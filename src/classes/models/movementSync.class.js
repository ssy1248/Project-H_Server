import {
  MAX_POSITION_DIFFERENCE,
  SERVER_TIME_OFFSET,
  MONSTER_SPAWN_INTERVAL,
  MONSTER_UPDATE_INTERVAL,
} from '../../constants/constants.js';
import { createResponse } from '../../utils/response/createResponse.js';
import { PACKET_TYPE } from '../../constants/header.js';
import { addMonster, updateMonster, findMonster } from '../managers/monster.manager.js';
import { v4 as uuidv4 } from 'uuid';

export default class MovementSync {
  // 생성자.
  constructor() {
    this.movementSyncId = 0; // 고유 ID
    this.entitySyncs = {}; // 유저 정보를 담을 객체.
    this.snapshotTime = Date.now();
    this.userUpdateinterval = 0;
    this.monsterSpawnInterval = 0;
    this.monsterUpdateInterval = 0;

    // 인터벌 시작.
    this.startMovementProcess();

    // 임시로 만든것 (페킷을 큐로 받아서... 이하 생략. )
    this.movementQueue = {}; // 이동 데이터 큐 (클라이언트에서 받은 데이터)
  }

  // [엔티티 추가]
  addEntitySync(id, type, Transform, socket = null) {
    const userSyncInfo = {
      id: id,
      type: type,
      socket: socket,
      previousTransform: {
        posX: Transform.posX,
        posY: Transform.posY,
        posZ: Transform.posZ,
        rot: Transform.rot,
      },
      currentTransform: {
        posX: Transform.posX,
        posY: Transform.posY,
        posZ: Transform.posZ,
        rot: Transform.rot,
      },
      lastSyncedTransform: {
        posX: Transform.posX,
        posY: Transform.posY,
        posZ: Transform.posZ,
        rot: Transform.rot,
      },
      latency: 0,
      isMoving: false,
      velocity: {
        x: 0,
        y: 0,
        z: 0,
      },
      speed: 0,
      lastUpdateTime: Date.now(),
    };

    this.entitySyncs[id] = userSyncInfo;
  }

  // [엔티티 찾기]
  findEntitySync(id) {
    if (this.entitySyncs[id]) {
      return this.entitySyncs[id];
    }
    return null;
  }

  // [전체 엔티티 찾기]
  getAllEntitySyncs() {
    if (this.entitySyncs) {
      return this.entitySyncs;
    }
    return null;
  }

  // [엔티티 삭제]
  deleteEntitySync(id, type) {
    if (this.entitySyncs[id] && this.entitySyncs[id].type === type) {
      delete this.entitySyncs[id];
      return true;
    }
    return false;
  }

  // [엔티티 업데이트] // 여기 수정해야함.
  updateEntitySync(id, transform, timestamp, isMoving, velocity, speed) {
    // 레이턴시(핑)
    if (timestamp !== 0) {
      this.entitySyncs[id].latency = this.computeNetworkDelay(timestamp);
    } else {
      this.entitySyncs[id].latency = 0;
    }
    // 현재 트랜스폼, 과거 트랜스폼 갱신.
    this.entitySyncs[id].lastSyncedTransform = transform;

    // 회전값이 없다면 기본값 0을 할당
    if (typeof this.entitySyncs[id].lastSyncedTransform.rot === 'undefined') {
      this.entitySyncs[id].lastSyncedTransform.rot = 0; // 기본 회전값 설정
    }

    // 움직이고 있는 중인가.
    this.entitySyncs[id].isMoving = isMoving;
    // 속도 벡터(방향 + 속도).
    this.entitySyncs[id].velocity = velocity;
    // 속도
    this.entitySyncs[id].speed = speed;

    // 마지막 업데이트 갱신.
    this.entitySyncs[id].lastUpdateTime = Date.now();
  }

  // [ 스냅샷 ] // 밥먹고 메인로직 수정
  syncTransformFromSnapshot(id) {
    if (this.entitySyncs[id].isMoving) {
      // 필요한 변수 선언.
      const velocity = this.entitySyncs[id].velocity;
      const latency = this.entitySyncs[id].latency;
      const lastSyncedTransform = this.entitySyncs[id].lastSyncedTransform;

      // previousTransform 갱신
      this.entitySyncs[id].previousTransform = { ...this.entitySyncs[id].currentTransform };

      // latency는 밀리초 단위로 계산되므로, 이를 초 단위로 변환 후 속도와 곱해야 함
      const deltaTime = (latency + SERVER_TIME_OFFSET) / 1000; // latency를 초 단위로 변환

      // currentTransform 갱신
      this.entitySyncs[id].currentTransform.posX += velocity.x * deltaTime;
      this.entitySyncs[id].currentTransform.posY += velocity.y * deltaTime;
      this.entitySyncs[id].currentTransform.posZ += velocity.z * deltaTime;
      this.entitySyncs[id].currentTransform.rot = lastSyncedTransform.rot;

      // 목표지점에 도착했는가.
      const posDiff = this.validateTransform(
        this.entitySyncs[id].currentTransform,
        lastSyncedTransform,
      );

      // 목적지에 넘어갔는가?
      const isPastTarget = this.hasPassedTarget(
        this.entitySyncs[id].currentTransform,
        this.entitySyncs[id].lastSyncedTransform,
        velocity,
      );

      if (isPastTarget) {
        this.entitySyncs[id].isMoving = false;
        this.entitySyncs[id].currentTransform = {
          ...this.entitySyncs[id].lastSyncedTransform,
        };
      }

      // 목적지에 도착했다면 움직임 멈추기
      if (Math.abs(posDiff) < MAX_POSITION_DIFFERENCE) {
        this.entitySyncs[id].isMoving = false;
        this.entitySyncs[id].currentTransform = {
          ...this.entitySyncs[id].lastSyncedTransform,
        };
      }

      // 마지막 업데이트 갱신.
      this.entitySyncs[id].lastUpdateTime = Date.now();
    }
  }

  // [ 메인 로직 ]
  async processUesrMovement() {
    // 100ms마다 이동 관련 로직을 실행
    this.userUpdateinterval = setInterval(async () => {
      const userSyncsSize = Object.keys(this.entitySyncs).length;
      // 유저들이 있을때만 메인 로직 실행.
      if (userSyncsSize !== 0) {
        // 움직이고 있는 유저 솎아내기.
        const changedUsers = Object.keys(this.entitySyncs)
          .filter(
            (key) =>
              this.entitySyncs[key].isMoving === true && this.entitySyncs[key].type === 'user',
          )
          .map((key) => this.entitySyncs[key]);

        // 움직이고 있는 유저들이 있을 경우 로직 실행.
        if (changedUsers.length !== 0) {
          // 변경된 유저들로 패킷을 만들자. []
          const syncTransformInfoDatas = [];

          // 데이터 업데이트 및 패킷 전송 준비.
          for (const user of changedUsers) {
            this.syncTransformFromSnapshot(user.id);
            const syncData = this.createSyncTransformInfoData(user);
            syncTransformInfoDatas.push(syncData);
          }

          const sMove = {
            transformInfos: syncTransformInfoDatas,
          };

          // 만들어진 패킷을 직렬화.
          const initialResponse = createResponse('town', 'S_Move', PACKET_TYPE.S_MOVE, sMove);

          // 브로드캐스트.
          await this.broadcastChangedUsers(initialResponse);

          // 스냅샷 시간 갱신
          this.snapshotTime = Date.now();
        }
      }
    }, SERVER_TIME_OFFSET);
  }

  // [서브 로직 - 몬스터 업데이트]
  async processMonsterMovement() {
    // 100ms마다 이동 관련 로직을 실행
    this.monsterUpdateInterval = setInterval(async () => {
      const userSyncsSize = Object.keys(this.entitySyncs).length;
      // 몬스터들이 있을때만  로직 실행.
      if (userSyncsSize !== 0) {
        // 움직이고 있는 몬스터 솎아내기.
        const changedMonsters = Object.keys(this.entitySyncs)
          .filter(
            (key) =>
              this.entitySyncs[key].isMoving === true && this.entitySyncs[key].type === 'monster',
          )
          .map((key) => this.entitySyncs[key]);

        // 움직이고 있는 몬스터들이 있을 경우 로직 실행.
        if (changedMonsters.length !== 0) {
          // 변경된 몬스터들로 패킷을 만들자. []
          const syncTransformInfoDatas = [];

          // 데이터 업데이트 및 패킷 전송 준비.
          for (const monster of changedMonsters) {
            this.syncTransformFromSnapshot(monster.id);
            const syncData = this.createSyncMonsterTransformInfoData(monster);
            syncTransformInfoDatas.push(syncData);
          }

          const sMonsterMove = {
            transformInfo: syncTransformInfoDatas,
          };

          // 만들어진 패킷을 직렬화.
          const initialResponse = createResponse(
            'town',
            'S_MonsterMove',
            PACKET_TYPE.S_MONSTER_MOVE,
            sMonsterMove,
          );

          // 브로드캐스트.
          await this.broadcastChangedUsers(initialResponse);

          // 스냅샷 시간 갱신
          this.snapshotTime = Date.now();
        }
      }
    }, MONSTER_UPDATE_INTERVAL);
  }

  // [서브 로직 - 몬스터 생성]
  async processMonsterSpawn() {
    // 100ms마다 이동 관련 로직을 실행
    this.monsterSpawnInterval = setInterval(async () => {
      const monsterId = uuidv4();
      addMonster('town', monsterId, 1, 1, 'test', 10);

      ///
      const monster = findMonster(monsterId);
      const monsterInfo = monster.monsterInfo;

      const sMonsterSpawn = {
        monstId: monsterId,
        monsterStatus: {
          monsterIdx: monsterInfo.index,
          monsterModel:  monsterInfo.model,
          monsterName: monsterInfo.name,
          monsterHp: monsterInfo.hp,
        },
        transformInfo: entitySyncs[monsterId].currentTransform,
      };
      // 만들어진 패킷을 직렬화.
      const initialResponse = createResponse(
        'town',
        'S_MonsterSpawn',
        PACKET_TYPE.S_MONSTER_SPAWN,
        sMonsterSpawn,
      );
      // 브로드캐스트.
      await this.broadcastChangedUsers(initialResponse);
    }, MONSTER_SPAWN_INTERVAL);
  }

  // [메인 로직 시작 ]
  startMovementProcess() {
    this.processUesrMovement();
    this.processMonsterSpawn();
    this.processMonsterMovement();
  }

  // [메인 로직 종료 ]
  endProcessMovement() {
    clearInterval(this.userUpdateinterval);
    clearInterval(this.monsterSpawnInterval);
    clearInterval(this.monsterUpdateInterval);
  }

  // [ 패킷 생성 ] - 유저 이동
  createSyncTransformInfoData(user) {
    const SyncTransformInfo = {
      playerId: user.id,
      transform: user.currentTransform,
      speed: user.speed,
    };

    return SyncTransformInfo;
  }

  // [ 패킷 생성 ] - 몬스터 이동
  createSyncMonsterTransformInfoData(monster) {
    const SyncTransformInfo = {
      monsterId: monster.id,
      transform: monster.currentTransform,
      speed: monster.speed,
    };

    return SyncTransformInfo;
  }

  // [ 레이 턴시 ]
  computeNetworkDelay(timestamp) {
    // 서버와 클라이언트 시간 차이를 계산해서 보정
    const timeDifference = Date.now() - timestamp;
    let ping = timeDifference >= 0 ? timeDifference : 24 * 60 * 60 * 1000 + timeDifference; // 음수일 때 하루를 더해주기

    // ping이 0이면 1로 설정
    if (ping === 0) {
      ping = 1;
    }

    return ping * 2;
  }

  // [트랜스폼 검증]
  validateTransform(previousTransform, currentTransform) {
    // 1. 위치 차이 계산:  이전 위치와 현재 위치의 차이를 구합니다.
    const positionDifference = Math.sqrt(
      Math.pow(previousTransform.posX - currentTransform.posX, 2) +
        Math.pow(previousTransform.posY - currentTransform.posY, 2) +
        Math.pow(previousTransform.posZ - currentTransform.posZ, 2),
    );

    return positionDifference;
  }

  // [타겟 방향을 지나갔는지 검증]
  hasPassedTarget(currentTransform, targetTransform, velocity) {
    // 목표 지점과 현재 위치 벡터 계산
    const deltaX = targetTransform.posX - currentTransform.posX;
    const deltaY = targetTransform.posY - currentTransform.posY;

    // 현재 이동 방향 벡터
    const velocityX = velocity.x;
    const velocityY = velocity.y;

    // 내적 계산
    const dotProduct = deltaX * velocityX + deltaY * velocityY;

    // 내적이 음수이면 지나쳤다고 판단
    return dotProduct < 0;
  }

  // 브로드캐스트 (type이 'user'인 경우만 전송)
  async broadcastChangedUsers(initialResponse) {
    const promises = Object.keys(this.entitySyncs)
      .filter((id) => this.entitySyncs[id].type === 'user') // 'user' 타입만 필터링
      .map((id) => {
        const user = this.entitySyncs[id]; // userId로 객체 참조

        return new Promise((resolve, reject) => {
          try {
            user.socket.write(initialResponse);
            setImmediate(resolve); // 즉시 resolve
          } catch (error) {
            reject(new Error(`[실패] ${id}에게 패킷 전송 실패: ${error.message}`));
          }
        });
      });

    try {
      await Promise.all(promises);
    } catch (error) {
      console.error('🚨 일부 유저에게 전송 실패:', error);
    }
  }
}
