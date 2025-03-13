import loadNavMeshData from './utils/loadNavMeshData.js';
import movementUtils from './utils/movementUtils.js';
import CONSTANTS from './constants/constants.js';
import { createResponse } from '../utils/response/createResponse.js';
import A_STER_MANAGER from './pathfinding/testASter.manager.js';
import { PACKET_TYPE } from '../constants/header.js';
import User from './entity/classes/user.class.js';
import Monster from './entity/classes/monster.class.js';
import Boss1 from './entity/classes/boss1.class.js';
import { getUserById, getUserBySocket } from '../session/user.session.js';
import { v4 as uuidv4 } from 'uuid';

/* 
클래스에 등록된 유저와 몬스터의 좌표를 60프레임 단위로 동기화하는 클래스
entity를 상속하는 별도의 user 클래스를 사용하기 때문에 코드가 분산되는 문제가 있음
user 클래스를 통합하려고 했으나 이미 구현된 코드가 많아서 그대로 두기로 결정

movementySync.manager에서 모든 인스턴스를 관리하고 있는데,
movementSync는 던전 인스턴스에 종속되므로 던전에서 생성하고 관리하는게 좋을 듯

movementSync 인스턴스는 던전의 지형 데이터만 가지고,
users, monsters, bosses는 parameter로 받아서 경로를 계산하는 기능만 있는게 좋을듯
아니면 인스턴스 레퍼런스를 받아서 사용하는 방법도 있을 듯
지형 생성, 지형 갱신, 경로 계산 기능만 있으면 될 것 같다
*/
export default class MovementSync {
  constructor(id, type) {
    this.movementId = id;
    this.users = {};
    this.monsters = {};
    this.bosses = {};
    this.navMeshGridData = null;
    this.updateinterval = 0;
    this.entityIntervar = 0;
    this.bossIntervar = 0;
    this.monsterSpawnInterval = 0;
    this.aSter = 0;
    this.bossCount = 5;

    this.loadNavMeshDataOnce(type);
    this.startMovementProcess();
  }

  async loadNavMeshDataOnce(type) {
    switch (type) {
      case 'town':
        this.navMeshGridData = await loadNavMeshData('./navMesh/town.json');
        break;
      case 'dungeon1':
        this.navMeshGridData = await loadNavMeshData('./navMesh/dungeon1_test.json');
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
      const users = Object.values(this.users);
      const monsters = Object.values(this.monsters);
      const bosses = Object.values(this.bosses);

      //const userInfo = JSON.parse(JSON.stringify(users));
      //console.log("userInfo : ", userInfo);

      // 유저
      if (users.length <= 0) {
        return;
      }

      for (const user of users) {
        user.updateTransform();
      }

      // 보스몬스터
      if (bosses.length !== 0) {
        for (const boss of bosses) {
          const userInfo = JSON.parse(JSON.stringify(users));
          boss.updateTransform(userInfo);
        }
      }

      // 몬스터
      if (monsters.length <= 0) {
        return;
      }

      for (const monster of monsters) {
        // 가장 근처에있는 유저를 여기서 찾자.

        let closestUser = null; // 가장 가까운 유저.
        let minDistance = Infinity; // 가장 작은 거리로 초기화

        for (const user of users) {
          const distance = movementUtils.Distance(monster.getTransform(), user.getTransform()); // 거리 계산
          if (distance < minDistance) {
            minDistance = distance;
            closestUser = user;
          }
        }

        if (closestUser) {
          monster.updateTransform(closestUser);
        }
      }
    }, tickRate);
  }

  // [메인 로직]
  async processMovement() {
    this.updateinterval = setInterval(async () => {
      // 엔티티 불러오기.
      const users = Object.values(this.users);
      const monsters = Object.values(this.monsters);
      const bosses = Object.values(this.bosses);

      //A_STER_MANAGER.UPDATE_OBSTACLE("town", users, monsters);

      if (users.length <= 0) {
        return;
      }

      // 유저 - 동기화
      const userTransformInfo = [];
      for (const user of users) {
        if (user.getBehavior() !== CONSTANTS.AI_BEHAVIOR.IDLE) {
          //console.error('[유저가 메세지를 보내고있습니다.]');
          //console.warn('pos : ', user.getTransform());
          if (user.getIsSearchFail()) continue;
          const syncData = this.createSyncTransformInfoData(user);
          userTransformInfo.push(syncData);
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

      // 보스몬스터 - 동기화
      if (bosses.length !== 0) {
        for (const boss of bosses) {
          const sBossMove = {
            bossId: boss.id,
            targetPosition: {
              x: boss.currentTransform.posX,
              y: boss.currentTransform.posY,
              z: boss.currentTransform.posZ,
            },
          };

          //console.log("sBossMove :", sBossMove)

          const initialResponse = createResponse(
            'dungeon',
            'S_BossMove',
            PACKET_TYPE.S_BOSSMOVE,
            sBossMove,
          );
          await this.broadcast2(initialResponse);
          //console.log("보스 무브 메세지 보냄");
        }
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
    }, CONSTANTS.NETWORK.INTERVAL);
  }

  // [몬스터 애니메이션 삭제] - 죽음
  updateMonsterDie() {
    const monsters = Object.values(this.monsters);
    const monsterIds = monsters
      .filter((monster) => monster.getIsDie()) // 죽었을경우
      .map((monster) => monster.getId()); // 몬스터 ID만 추출

    if (monsterIds.length !== 0) {
      const sMonsterDie = {
        monsterId: monsterIds,
        monsterAinID: 'Die',
      };

      for (const monsterId of monsterIds) {
        A_STER_MANAGER.DELETE_OBSTACLE(this.movementId, monsterId);
        A_STER_MANAGER.DELETE_OBSTACLE_List(this.movementId, monsterId);
        delete this.monsters[monsterId];
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

  // // [몬스터 애니메이션 동기화] - 데미지
  updateMonsterDamage() {
    const monsters = Object.values(this.monsters);
    const monsterIds = monsters
      .filter((monster) => monster.getIsDamage()) // 죽었을경우
      .map((monster) => monster.getId()); // 몬스터 ID만 추출

    if (monsterIds.length !== 0) {
      const sMonsterDamage = {
        monsterId: monsterIds,
        monsterAinID: 'Hit',
      };

      const initialResponse = createResponse(
        'town',
        'S_MonsterHit',
        PACKET_TYPE.S_MonsterHit,
        sMonsterDamage,
      );

      this.broadcast2(initialResponse);

      //console.log('왔어요.');
    }
  }

  // [몬스터 애니메이션 동기화] - 공격
  updateMonsterAttck() {
    const monsters = Object.values(this.monsters);
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
      const users = Object.values(this.users);
      const monsters = Object.values(this.monsters);

      if (users.length === 0) {
        return;
      }

      // 보스 생성 (보스 생성 후 몬스터 리스폰 종료.)
      //this.bossCount = 0;
      if (this.bossCount <= 0) {
        this.addBoss();
        clearInterval(this.monsterSpawnInterval);
        this.bossCount = 1;
        return;
      } 

      // 몬스터수 제한
      if (monsters.length >= 5) {
        return;
      }

      this.addMonster(this.movementId);
      //console.log('몬스터 생성이 됬어요.');
      const tsetMonsters = Object.values(this.monsters);

      const monsterTransformInfo = [];
      for (const monster of tsetMonsters) {
        console.log(' monster.currentTransform : ', monster.currentTransform);
        const test = monster.currentTransform;
        if (!test.posX) {
          //console.log("종료전 몬스터 트랜스폼 : ", test)
          //process.exit(0); // 정상 종료
          continue;
        }
        const syncData = this.createSyncMonsterTransformInfoData(monster, monster.getMonsterInfo());
        monsterTransformInfo.push(syncData);
      }

      console.error('monsterTransformInfo :', monsterTransformInfo);

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

      // 보스카운터 1 감소.
      this.bossCount--;
    }, CONSTANTS.ENTITY.MONSTER_SPAWN_INTERVAL);
  }

  startMovementProcess() {
    this.processMovement();
    // if (this.movementId !== 'town') {
    //   this.processMonsterSpawn();
    // }

    this.processMonsterSpawn();
    this.entityMovement();
  }

  endProcessMovement() {
    clearInterval(this.monsterSpawnInterval);
    clearInterval(this.updateinterval);
    clearInterval(this.entityIntervar);
  }

  // [유저]
  addUser(socket, id, transform) {
    const user = getUserBySocket(socket);
    const userAgent = new User(this.movementId, socket, id, transform);
    this.users[id] = userAgent;
    user.agent = userAgent;
  }

  updateUser(id, transform, timestamp) {
    const user = this.users[id];
    if (!user) return;
    user.updateUserTransformSync(transform, timestamp);
  }

  deleteUser(id) {
    A_STER_MANAGER.DELETE_OBSTACLE(this.movementId, id);
    A_STER_MANAGER.DELETE_OBSTACLE_List(this.movementId, id);

    if (!this.users) return;
    // console.log('삭제 ID : ', id);
    // console.log('삭제 전 유저들 : ', this.users);
    const user = getUserById(id);
    user.agent = null;
    delete this.users[id];
    // console.log('삭제 후 유저들 : ', this.users);
  }

  findUser(id) {
    return this.users[id];
  }

  findUsers() {
    return Object.values(this.users);
  }

  // [몬스터]
  addMonster() {
    const transform = {
      posX: this.generateRandomPlayerTransformInfo(-9, 9),
      posY: 1,
      posZ: this.generateRandomPlayerTransformInfo(-8, 8) + 130,
      rot: this.generateRandomPlayerTransformInfo(0, 360),
    };
    const monsterId = uuidv4();
    const randomNum = Math.floor(Math.random() * 30) + 1;

    // TODO: DB에서 몬스터 데이터 받아서 생성하기
    this.monsters[monsterId] = new Monster(
      this.movementId,
      monsterId,
      transform,
      3,
      'test',
      10,
      1,
      0,
      CONSTANTS.ENTITY.DEFAULT_SPEED,
    );
  }

  findMonster(id) {
    return this.monsters[id];
  }

  findMonsters() {
    return Object.values(this.monsters);
  }

  deleteMonsters() {
    const monsters = Object.values(this.monsters);
    monsters.forEach((mon) => {
      deleteMonster(mon.id);
    });
  }

  deleteMonster(id) {
    A_STER_MANAGER.DELETE_OBSTACLE(this.movementId, id);
    A_STER_MANAGER.DELETE_OBSTACLE_List(this.movementId, id);

    if (!this.monsters) return;
    delete this.monsters[id];
  }

  // [보스]
  addBoss() {
    const transform = {
      posX: this.generateRandomPlayerTransformInfo(-9, 9),
      posY: 1,
      posZ: this.generateRandomPlayerTransformInfo(-8, 8) + 130,
      rot: this.generateRandomPlayerTransformInfo(0, 360),
    };
    const bossId = uuidv4();
    const randomNum = Math.floor(Math.random() * 30) + 1;

    this.bosses[bossId] = new Boss1(this.movementId, bossId, transform, randomNum, 'test', 3000);
  }

  findBoss(id) {
    return this.bosses[id];
  }

  findBosses() {
    return this.bosses;
  }

  deleteBoss(id) {
    A_STER_MANAGER.DELETE_OBSTACLE(this.movementId, id);
    A_STER_MANAGER.DELETE_OBSTACLE_List(this.movementId, id);

    delete this.bosses[id];
  }

  async broadcast(initialResponse) {
    const users = Object.values(this.users);

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
    const users = Object.values(this.users);

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

  // 랜덤 좌표 및 회전 각도 생성 함수
  generateRandomPlayerTransformInfo(min, max) {
    // min ~ max 사이의 랜덤 값
    const randomValue = Math.floor(Math.random() * (max - min + 1)) + min;
    return randomValue;
  }
}
