import { MAX_POSITION_DIFFERENCE, SERVER_TIME_OFFSET } from '../../constants/constants.js';
import { createResponse } from '../../utils/response/createResponse.js';
import { PACKET_TYPE } from '../../constants/header.js';

export default class MovementSync {
  // 생성자.
  constructor() {
    this.movementSyncId = 0; // 고유 ID
    this.userSyncs = {}; // 유저 정보를 담을 객체.
    this.snapshotTime = Date.now();
    this.interval = 0;

    // 인터벌 시작.
    this.startMovementProcess();

    // 임시로 만든것 (페킷을 큐로 받아서... 이하 생략. )
    this.movementQueue = {}; // 이동 데이터 큐 (클라이언트에서 받은 데이터)
  }

  // [유저 추가]
  addUserSync(userId, socket, Transform) {
    const userSyncInfo = {
      userId: userId,
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

    this.userSyncs[userId] = userSyncInfo;
  }

  // [유저 찾기]
  findUserSync(userId) {
    if (this.userSyncs[userId]) {
      return this.userSyncs[userId];
    }
    return null;
  }

  // [유저 업데이트]
  updateUserSync(userId, transform, timestamp, isMoving, velocity,speed) {
    // 레이턴시(핑)
    this.userSyncs[userId].latency = this.computeNetworkDelay(timestamp);
    // 현재 트랜스폼, 과거 트랜스폼 갱신.
    this.userSyncs[userId].lastSyncedTransform = transform;

    // 회전값이 없다면 기본값 0을 할당
    if (typeof this.userSyncs[userId].lastSyncedTransform.rot === 'undefined') {
      this.userSyncs[userId].lastSyncedTransform.rot = 0; // 기본 회전값 설정
    }

    // 움직이고 있는 중인가.
    this.userSyncs[userId].isMoving = isMoving;
    // 속도 벡터(방향 + 속도).
    this.userSyncs[userId].velocity = velocity;
    // 속도
    this.userSyncs[userId].speed = speed;

    // 마지막 업데이트 갱신.
    this.userSyncs[userId].lastUpdateTime = Date.now();
  }

  // [ 스냅샷 ] // 밥먹고 메인로직 수정
  syncTransformFromSnapshot(userId) {
    if (this.userSyncs[userId].isMoving) {
      // 필요한 변수 선언.
      const velocity = this.userSyncs[userId].velocity;
      const latency = this.userSyncs[userId].latency;
      const lastSyncedTransform = this.userSyncs[userId].lastSyncedTransform;

      // previousTransform 갱신
      this.userSyncs[userId].previousTransform = { ...this.userSyncs[userId].currentTransform };

      // latency는 밀리초 단위로 계산되므로, 이를 초 단위로 변환 후 속도와 곱해야 함
      const deltaTime = (latency + SERVER_TIME_OFFSET) / 1000; // latency를 초 단위로 변환

      // currentTransform 갱신 
      this.userSyncs[userId].currentTransform.posX += velocity.x * deltaTime;
      this.userSyncs[userId].currentTransform.posY += velocity.y * deltaTime;
      this.userSyncs[userId].currentTransform.posZ += velocity.z * deltaTime;
      this.userSyncs[userId].currentTransform.rot = lastSyncedTransform.rot;
      

      // 목표지점에 도착했는가.
      const posDiff = this.validateTransform(
        this.userSyncs[userId].currentTransform,
        lastSyncedTransform,
      );

      // 목적지에 넘어갔는가?
      const isPastTarget = this.hasPassedTarget(
        this.userSyncs[userId].currentTransform,
        this.userSyncs[userId].lastSyncedTransform,
        velocity,
      );

      if (isPastTarget) {
        this.userSyncs[userId].isMoving = false;
        this.userSyncs[userId].currentTransform = { ...this.userSyncs[userId].lastSyncedTransform };
      }

      // 목적지에 도착했다면 움직임 멈추기
      if (Math.abs(posDiff) < MAX_POSITION_DIFFERENCE) {
        this.userSyncs[userId].isMoving = false;
        this.userSyncs[userId].currentTransform = { ...this.userSyncs[userId].lastSyncedTransform };
      }

      // 마지막 업데이트 갱신.
      this.userSyncs[userId].lastUpdateTime = Date.now();
    }
  }

  // [유저 삭제]
  deleteUserSync(userId) {
    if (this.userSyncs[userId]) {
      delete this.userSyncs[userId];
      return true;
    }
    return false;
  }

  // [ 메인 로직 ]
  async processMovement() {
    // 100ms마다 이동 관련 로직을 실행
    this.interval = setInterval(async () => {
      const userSyncsSize = Object.keys(this.userSyncs).length;
      // 유저들이 있을때만 메인 로직 실행.
      if (userSyncsSize !== 0) {
        // 움직이고 있는 유저 솎아내기.
        const changedUsers = Object.keys(this.userSyncs)
          .filter((key) => this.userSyncs[key].isMoving === true)
          .map((key) => this.userSyncs[key]);

        // 움직이고 있는 유저들이 있을 경우 로직 실행.
        if (changedUsers.length !== 0) {
          // 변경된 유저들로 패킷을 만들자. []
          const syncTransformInfoDatas = [];

          // 데이터 업데이트 및 패킷 전송 준비.
          for (const user of changedUsers) {
            this.syncTransformFromSnapshot(user.userId);
            const syncData = this.createSyncTransformInfoData(user); // 동기 처리
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

  // [메인 로직 시작 ]
  startMovementProcess() {
    this.processMovement(); // 메서드를 별도로 호출
  }

  // [메인 로직 종료 ]
  endProcessMovement() {
    clearInterval(this.interval); // 반복 종료
  }

  // [ 패킷 생성 ]
  createSyncTransformInfoData(user) {
    const SyncTransformInfo = {
      playerId: user.userId,
      transform: user.currentTransform,
      speed: user.speed,
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

  // 브로드캐스트
  async broadcastChangedUsers(initialResponse) {
    const promises = Object.keys(this.userSyncs).map((userId) => {
      const user = this.userSyncs[userId]; // userId로 객체 참조

      return new Promise((resolve, reject) => {
        try {
          user.socket.write(initialResponse);
          setImmediate(resolve); // 즉시 resolve
        } catch (error) {
          reject(new Error(`[실패] ${userId}에게 패킷 전송 실패: ${error.message}`));
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
