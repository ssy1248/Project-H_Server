import EntityManager from './entity/manager/entity.manager.js';
import loadNavMeshData from './utils/loadNavMeshData.js';
import movementUtils from './utils/movementUtils.js';
import CONSTANTS from './constants/constants.js';
import { createResponse } from '../utils/response/createResponse.js';
import A_STER_MANAGER from './pathfinding/testASter.manager.js';
import { PACKET_TYPE } from '../constants/header.js';

export default class MovementSync {
  constructor(id) {
    this.movementId = id;
    this.entityManager = new EntityManager();
    this.navMeshGridData = null;
    this.updateinterval = 0;
    this.entityIntervar = 0;
    this.monsterSpawnInterval = 0;
    this.aSter = 0;

    this.startMovementProcess();
  }

  async loadNavMeshDataOnce(type) {
    switch (type) {
      case 'town':
        this.navMeshGridData = await loadNavMeshData('./navMesh/town.json');
        break;
      case 'dungeon1':
        this.navMeshGridData = await loadNavMeshData('./navMesh/dungeon1.json');
        break;
      default:
        break;
    }

    A_STER_MANAGER.ADD(this.movementId, this.navMeshGridData, 1000, 1000);
  }

  // [엔티티 인터벌] = 엔티티 좌표 업데이트를 60 프레임 단위로.
  async entityMovement() {
    const tickRate = 1000 / CONSTANTS.NETWORK.TICK_RATE;
    this.entityIntervar = setInterval(async () => {
      const users = this.entityManager.getUsersArray();
      const monsters = this.entityManager.getMonstersArray();

      // 유저
      if (users.length <= 0) {
        return;
      }

      const userTransforms = [];
      for (const user of users) {
        user.updateTransform();
        userTransforms.push(user.getTransform());
      }

      // 몬스터
      if (monsters.length <= 0) {
        return;
      }

      for (const monster of monsters) {
        // 가장 근처에있는 유저를 여기서 찾자.

        let closestUserTransform = null; // 가장 가까운 유저.
        let minDistance = Infinity; // 가장 작은 거리로 초기화

        for (const userTransform of userTransforms) {
          const distance = movementUtils.Distance(monster.getTransform(), userTransform); // 거리 계산
          if (distance < minDistance) {
            minDistance = distance;
            closestUserTransform = userTransform;
          }
        }

        // console.log("closestUserTransform : ",closestUserTransform);

        if (closestUserTransform) {
          monster.updateTransform(closestUserTransform);
        }
      }
    }, tickRate);
  }

  // [메인 로직]
  async processMovement() {
    this.updateinterval = setInterval(async () => {
      // 엔티티 불러오기.
      const users = this.entityManager.getUsersArray();
      const monsters = this.entityManager.getMonstersArray();

      //A_STER_MANAGER.UPDATE_OBSTACLE("town", users, monsters);

      if (users.length <= 0) {
        return;
      }

      // 유저 - 동기화
      const userTransformInfo = [];
      for (const user of users) {
        if (user.getBehavior() !== CONSTANTS.AI_BEHAVIOR.IDLE) {
          if (user.userAiBehaviorCHASE()) {
            // user.updateTransform();
            if (user.getIsSearchFail()) continue;
            const syncData = this.createSyncTransformInfoData(user);
            userTransformInfo.push(syncData);
          }
        }
      }

      if (userTransformInfo.length !== 0) {
        // 유저 - 패킷 생성.
        const sMove = {
          transformInfos: userTransformInfo,
        };

        // 유저 - 패킷 직렬화
        const initialResponse = createResponse('town', 'S_Move', PACKET_TYPE.S_MOVE, sMove);
        await this.broadcast2(initialResponse);
      }

      if (monsters.length <= 0) {
        return;
      }

      // 몬스터 - 동기화.
      const monsterTransformInfo = [];
      for (const monster of monsters) {
        if (monster.getBehavior() !== CONSTANTS.AI_BEHAVIOR.IDLE) {
          if (monster.getIsSearchFail()) continue;
          const syncData = this.createSyncMonsterTransformInfoData(
            monster,
            monster.getMonsterInfo(),
          );
          monsterTransformInfo.push(syncData);
        }
      }

      // 움직인 몬스터가 업으면 패스
      if (monsterTransformInfo.length < 1) {
        return;
      }

      //console.log(monsterTransformInfo);

      if (monsterTransformInfo.length !== 0) {
        // 몬스터 - 패킷 생성.
        const sMonsterMove = {
          transformInfo: monsterTransformInfo,
        };

        // 몬스터 -  패킷 직렬화
        const initialResponse2 = createResponse(
          'town',
          'S_MonsterMove',
          PACKET_TYPE.S_MONSTERMOVE,
          sMonsterMove,
        );
        await this.broadcast2(initialResponse2);
      }

      // 공격/ 죽음
      //this.updateMonsterAttck();
      //this.updateMonsterDie();
    }, CONSTANTS.NETWORK.INTERVAL);
  }

  // [몬스터 애니메이션 삭제] - 죽음
  updateMonsterDie() {
    const monsters = this.entityManager.getMonstersArray();
    const monsterIds = monsters
      .filter((monster) => monster.getIsDie()) // 죽었을경우
      .map((monster) => monster.getId()); // 몬스터 ID만 추출

    if (monsterIds.length !== 0) {
      const sMonsterDie = {
        monsterId: monsterIds,
        monsterAinID: 'Die',
      };

      for (const monsterId of monsterIds) {
        A_STER_MANAGER.DELETE_OBSTACLE('town', monsterId);
        A_STER_MANAGER.DELETE_OBSTACLE_List('town', monsterId);
        this.entityManager.deleteMonster(monsterId);
      }
      const initialResponse = createResponse(
        'town',
        'S_MonsterDie',
        PACKET_TYPE.S_MonsterDie,
        sMonsterDie,
      );

      this.broadcast2(initialResponse);
    }
  }

  // [몬스터 애니메이션 동기화] - 공격
  updateMonsterAttck() {
    const monsters = this.entityManager.getMonstersArray();
    const monsterIds = monsters
      .filter((monster) => monster.getIsAttack()) // 공격 중인 몬스터 필터링
      .map((monster) => monster.getId()); // 몬스터 ID만 추출

    if (monsterIds.length !== 0) {
      const sMonsterAttck = {
        monsterId: monsterIds,
        monsterAinID: 'Attck',
      };

      const initialResponse = createResponse(
        'town',
        'S_MonsterAttck',
        PACKET_TYPE.S_MonsterAttck,
        sMonsterAttck,
      );

      this.broadcast2(initialResponse);
    }
  }

  // [ 패킷 생성 (유저) ]
  createSyncTransformInfoData(user) {
    const SyncTransformInfo = {
      playerId: user.getId(),
      transform: user.getCurrentTransform(),
      speed: CONSTANTS.ENTITY.DEFAULT_SPEED,
    };

    return SyncTransformInfo;
  }

  // [ 패킷 생성 (몬스터) ]
  createSyncMonsterTransformInfoData(monster, monsterInfo) {
    const SyncTransformInfo = {
      monsterId: monster.getId(),
      monsterStatus: {
        monsterIdx: monster.getId(),
        monsterModel: monsterInfo.model,
        monsterName: monsterInfo.name,
        monsterHp: monsterInfo.hp,
      },
      transform: monster.currentTransform,
      speed: CONSTANTS.ENTITY.DEFAULT_SPEED,
    };

    return SyncTransformInfo;
  }

  // [몬스터 리스폰]
  async processMonsterSpawn() {
    this.monsterSpawnInterval = setInterval(async () => {
      console.log('몬스터 스폰');
      const users = this.entityManager.getUsersArray();
      const monsters = this.entityManager.getMonstersArray();

      if (users.length === 0) {
        return;
      }

      // 몬스터수 제한
      if (monsters.length >= 10) {
        return;
      }

      this.addMonster(this.movementId);

      const monsterTransformInfo = [];
      for (const monster of monsters) {
        const test = monster.currentTransform;
        if (!test.posX) {
          //console.log("종료전 몬스터 트랜스폼 : ", test)
          //process.exit(0); // 정상 종료
          continue;
        }
        const syncData = this.createSyncMonsterTransformInfoData(monster, monster.getMonsterInfo());
        monsterTransformInfo.push(syncData);
      }

      // 패깃 생성
      const sMonsterSpawn = {
        monsterInfo: monsterTransformInfo,
      };
      // 패킷 직렬화
      const initialResponse = createResponse(
        'town',
        'S_MonsterSpawn',
        PACKET_TYPE.S_MONSTERSPAWN,
        sMonsterSpawn,
      );

      // 브로드 캐스트
      await this.broadcast2(initialResponse);
    }, CONSTANTS.ENTITY.MONSTER_SPAWN_INTERVAL);
  }

  startMovementProcess() {
    this.processMovement();
    if (this.movementId !== 'town') {
      this.processMonsterSpawn();
    } 
    this.entityMovement();
  }

  endProcessMovement() {
    clearInterval(this.monsterSpawnInterval);
    clearInterval(this.updateinterval);
    clearInterval(this.entityIntervar);
  }

  addUser(socket, id, transform) {
    this.entityManager.addUser(this.movementId, socket, id, transform);
  }

  updateUser(id, transform, timestamp) {
    const user = this.entityManager.getUser(id);
    user.updateUserTransformSync(transform, timestamp);
  }

  deleteUser(id) {
    A_STER_MANAGER.DELETE_OBSTACLE('town', id);
    A_STER_MANAGER.DELETE_OBSTACLE_List('town', id);

    this.entityManager.deleteUser(id);
  }

  findUser(id) {
    return this.entityManager.getUser(id);
  }

  addMonster() {
    this.entityManager.addMonster(this.movementId);
  }

  findMonster(id) {
    return this.entityManager.getMonster(id);
  }

  findMonsters() {
    return this.entityManager.getMonstersArray();
  }

  deleteMonsters() {
    const monsters = this.entityManager.getMonsters();
    const monstersArray = Object.values(monsters);
    monstersArray.forEach((mon) => {
      this.entityManager.deleteMonster(mon.id);
    });
  }

  deleteMonster(id) {
    A_STER_MANAGER.DELETE_OBSTACLE('town', id);
    A_STER_MANAGER.DELETE_OBSTACLE_List('town', id);

    this.entityManager.deleteMonster(id);
  }

  async broadcast(initialResponse) {
    const users = this.entityManager.getUsersArray();

    const promises = users.map((user) => {
      const socket = user.getSocket();
      if (socket) {
        return new Promise((resolve, reject) => {
          socket.write(initialResponse, (err) => {
            if (err) {
              reject();
              //reject(new Error(`데이터를 보내는데 실패 user: ${err.message}`)); // 에러가 발생하면 reject
            } else {
              resolve(); // 성공적으로 보냈으면 resolve
            }
          });
        });
      }
    });

    // 모든 프로미스가 완료될 때까지 기다림
    await Promise.all(promises);
  }

  broadcast2(initialResponse) {
    const users = this.entityManager.getUsersArray();

    for (const user of users) {
      const socket = user.getSocket();
      if (socket) {
        socket.write(initialResponse, (err) => {
          if (err) {
            //console.error(
            //  `데이터를 보내는데 [ 유저 : ${users.length} 명]실패 user: ${err.message}`,
            //);
          }
        });
      }
    }
  }
}
