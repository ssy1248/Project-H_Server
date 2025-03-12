import Entity from './entity.class.js';
import CONSTANTS from '../../constants/constants.js';
import movementUtils from '../../utils/movementUtils.js';
import A_STER_MANAGER from '../../pathfinding/testASter.manager.js';
import { createResponse } from '../../../utils/response/createResponse.js';
import { PACKET_TYPE } from '../../../constants/header.js';
import { getUserById } from '../../../session/user.session.js';

import Queue from '../../utils/queue.js';

export default class Boss1 extends Entity {
  constructor(movementId, id, transform, model, name, hp) {
    super(movementId, id, 'boss', transform);

    this.model = model;
    this.name = name;
    this.hp = hp;

    this.skillModifiers = {
      skill_1: 1.0,
      skill_2: 1.0,
      skill_3: 1.0,
      skill_4: 1.0,
      skill_5: 1.0,
    };

    this.skillActiveTimes = {
      skill_1: 1000,
      skill_2: 1000,
      skill_3: 1000,
      skill_4: 1000,
      skill_5: 1000,
    };

    this.skillCooldown = CONSTANTS.ENTITY.SKILL_COOLDOWN;

    this.bossBehavior = CONSTANTS.BOSS_AI_BEHAVIOR.IDLE;

    this.spawnTransform = { ...this.currentTransform };

    this.isSpawn = false;
    this.isSkill = false;
  }

  // [보스 몬스터 스폰]
  spawnBossMonster(userInfo) {
    const sBossSpawn = {
      bossId: this.id,
      hp: this.hp,
      currentPosition: {
        x: this.currentTransform.posX,
        y: this.currentTransform.posY,
        z: this.currentTransform.posZ,
      },
    };

    const initialResponse = createResponse(
      'dungeon',
      'S_BossSpawn',
      PACKET_TYPE.S_BOSSSPAWN,
      sBossSpawn,
    );

    //console.log("userInfo :", userInfo);

    this.broadcast(initialResponse, userInfo);

    this.isSpawn = true;
  }

  // 업데이트
  updateTransform(userInfo) {
    if (this.isDie) return;

    // 보스 몬스터 스폰 (한번만 스폰.)
    if (!this.isSpawn) {
      this.spawnBossMonster(userInfo);
    }

    this.updateBossSync(userInfo);

    if(this.bossBehavior === CONSTANTS.BOSS_AI_BEHAVIOR.IDLE){
      super.updateTransform();
    }
  }

  // 보스 몬스터 업데이트
  updateBossSync(userInfo) {
    // 보스 몬스터 행동 결정.
    this.determineBossAction(userInfo);

    // 보스 몬스터 추격
    this.bossAiBehaviorCHASE();

    // 보스 몬스터가 스킬을 사용 중 이라면
    if (this.bossBehavior !== CONSTANTS.BOSS_AI_BEHAVIOR.IDLE) {
      if (this.skillCooldown === 0) {
        switch (this.bossBehavior) {
          case CONSTANTS.BOSS_AI_BEHAVIOR.SKILL_01:
            this.boosAiBehaviorSkill('skill_01', userInfo);
            break;
          case CONSTANTS.BOSS_AI_BEHAVIOR.SKILL_02:
            this.boosAiBehaviorSkill( 'skill_02', userInfo);
            break;
          case CONSTANTS.BOSS_AI_BEHAVIOR.SKILL_03:
            this.boosAiBehaviorSkill( 'skill_03', userInfo);
            break;
          case CONSTANTS.BOSS_AI_BEHAVIOR.SKILL_04:
            this.boosAiBehaviorSkill('skill_04', userInfo);
            break;
          case CONSTANTS.BOSS_AI_BEHAVIOR.SKILL_05:
            this.boosAiBehaviorSkill( 'skill_05', userInfo);
            break;

          default:
            break;
        }
      } else {
        this.skillCooldown -= 1;
      }
    }
  }

  // [보스 행동 결정 함수]
  determineBossAction(userInfo) {
    // 유저 중에 가장 가까운 유저를 찾자.
    let closestUser = null;
    let closestDistance = Infinity; // 가장 작은 거리를 찾기 위해 초기값을 무한대로 설정
    for (const user of userInfo) {
      // 두 지점 간의 거리 계산 (유클리드 거리)
      const dx = user.currentTransform.posX - this.currentTransform.posX;
      const dz = user.currentTransform.posZ - this.currentTransform.posZ;
      const distance = Math.sqrt(dx * dx + dz * dz); // 두 점 사이의 거리 (2D 기준)

      // 현재까지 찾은 유저 중 가장 가까운 유저를 찾음
      if (distance < closestDistance) {
        closestDistance = distance;
        closestUser = user;
      }
    }

    // 보스 몬스터 범위에 들어와있다면
    // const collisionDetected = movementUtils.obbMyCollision(
    //   2,
    //   this.currentTransform,
    //   closestUser.currentTransform,
    // );

    // 두 지점 간의 거리 계산 (유클리드 거리)
    const dx = closestUser.currentTransform.posX - this.currentTransform.posX;
    const dz = closestUser.currentTransform.posZ - this.currentTransform.posZ;
    const distance = Math.sqrt(dx * dx + dz * dz); // 두 점 사이의 거리 (2D 기준)

    if (distance <= 3.5) {
      // 보스 상태가 IDLE 일 경우 스킬 세팅.
      if (this.bossBehavior === CONSTANTS.BOSS_AI_BEHAVIOR.IDLE) {

        if(!this.isSkill){
          //this.prepareBossSkill();
          this.bossBehavior = CONSTANTS.BOSS_AI_BEHAVIOR.SKILL_01;
          super.setBehavior(CONSTANTS.AI_BEHAVIOR.IDLE);
        }

        
      }
    } else if (this.behavior === CONSTANTS.AI_BEHAVIOR.IDLE) {
      this.chasePlayer(closestUser.currentTransform);
    }
  }

  // [보스 추격]
  bossAiBehaviorCHASE() {
    if (this.behavior !== CONSTANTS.AI_BEHAVIOR.CHASE) return;
    if (this.bossBehavior !== CONSTANTS.BOSS_AI_BEHAVIOR.IDLE) return;

    const lastTransform = super.getLastTransform();
    const currentTransform = super.getCurrentTransform();
    const targetTransform = super.getTargetTransform();

    const aSterPath = super.getASterPath();

    if (aSterPath.size() === 0) {
      const result = movementUtils.hasPassedTarget(
        currentTransform,
        targetTransform,
        lastTransform,
      );

      if (result) {
        super.setBehavior(CONSTANTS.AI_BEHAVIOR.IDLE);
      } else {
        super.setBehavior(CONSTANTS.AI_BEHAVIOR.CHASE);
      }
    }
  }

  // [보스 스킬]
  boosAiBehaviorSkill(type, userInfo) {
    if(!this.isSkill) {
      this.boosAiBehaviorSkill_Start(type, userInfo);
    }
  }

  // [보스 스킬 시작]
  boosAiBehaviorSkill_Start(type, userInfo) {
    const sBossSkillStart = {
      bossId: this.id,
      type: type,
    };

    const initialResponse = createResponse(
      'dungeon',
      'S_BossSkillStart',
      PACKET_TYPE.S_BOSSSKILLSTART,
      sBossSkillStart,
    );

    this.broadcast(initialResponse, userInfo);
    this.isSkill = true;
  }

  // [보스 스킬 종료]
  boosAiBehaviorSkill_End(userInfo, currentPosition) {
    const sBossSkillEnd = {
      bossId: this.id,
    };

    const initialResponse = createResponse(
      'dungeon',
      'S_BossSkillEnd',
      PACKET_TYPE.S_BOSSSKILLEND,
      sBossSkillEnd,
    );

    this.broadcast(initialResponse, userInfo);

    this.bossBehavior = CONSTANTS.BOSS_AI_BEHAVIOR.IDLE;
    this.skillCooldown = CONSTANTS.ENTITY.SKILL_COOLDOWN;

    // 몬스터 좌표 갱신.
    const pos = {
      posX: currentPosition.x,
      posY: currentPosition.y,
      posZ: currentPosition.z,
      rot: this.currentTransform.rot,
    };

    this.currentTransform = { ...pos };

    this.isSkill = false;
  }

  // [시간제한 함수]
  runForLimitedTime(interval, duration, onTick, onEnd) {
    const startTime = Date.now(); // 시작 시간 기록

    const timer = setInterval(() => {
      // 반복하는 로직 (매 반복마다 onTick 호출)
      onTick();

      // 일정 시간이 지나면 인터벌을 멈추기
      if (Date.now() - startTime >= duration) {
        // 종료하는 로직 (onEnd 호출)
        onEnd();

        clearInterval(timer); // setInterval 중지
      }
    }, interval);
  }

  // [보스 추격 세팅]
  chasePlayer(userTransform) {
    super.setPathfindingDestination(userTransform);
    super.updatePathFinding(this.currentTransform, this.pathfindingDestination);
    A_STER_MANAGER.UPDATE_OBSTACLE(this.movementId, this);

    super.setBehavior(CONSTANTS.AI_BEHAVIOR.CHASE);
  }

  // [보스 몬스터 스킬 준비 함수]
  prepareBossSkill() {
    if (this.bossBehavior !== CONSTANTS.BOSS_AI_BEHAVIOR.IDLE) {
      return; // 대기 상태가 아닐 경우 아무 것도 하지 않음
    }

    // 가중치 총합 계산
    const totalWeight = this.calculateTotalWeight(this.skillModifiers);

    // 랜덤으로 스킬 선택
    const selectedSkill = this.selectSkillBasedOnWeight(this.skillModifiers, totalWeight);

    if (selectedSkill) {
      // 선택된 스킬 실행
      //this.executeSkill(selectedSkill);

      // 스킬 가중치 감소 및 회복
      this.adjustSkillWeights(selectedSkill);

      // 보스 상태 갱신
      this.bossBehavior = this.getBossBehaviorFromSkill(selectedSkill);
    }
  }

  // [가중치 총합 계산 함수]
  calculateTotalWeight(skillModifiers) {
    return Object.values(skillModifiers).reduce((total, weight) => total + weight, 0);
  }

  // [랜덤 스킬 선택 함수]
  selectSkillBasedOnWeight(skillModifiers, totalWeight) {
    let rand = Math.random() * totalWeight;
    for (const skill in skillModifiers) {
      rand -= skillModifiers[skill];
      if (rand <= 0) {
        return skill; // 선택된 스킬 반환
      }
    }
    return null; // 선택된 스킬 없음
  }

  // [가중치 조정 함수]
  adjustSkillWeights(selectedSkill) {
    // 선택된 스킬 가중치 감소
    this.skillModifiers[selectedSkill] *= 0.5;

    // 가중치가 음수로 떨어지지 않도록 최소값 설정
    if (this.skillModifiers[selectedSkill] < 0.1) {
      this.skillModifiers[selectedSkill] = 0.1;
    }

    // 다른 스킬들의 가중치 회복
    for (const skill in this.skillModifiers) {
      if (skill !== selectedSkill) {
        this.skillModifiers[skill] += 0.1;

        // 가중치가 너무 커지지 않도록 최대값 설정
        if (this.skillModifiers[skill] > 4.0) {
          this.skillModifiers[skill] = 4.0;
        }
      }
    }
  }

  // [스킬에 맞는 보스 상태 반환 함수]
  getBossBehaviorFromSkill(selectedSkill) {
    const skillMap = {
      skill_1: CONSTANTS.BOSS_AI_BEHAVIOR.SKILL_01,
      skill_2: CONSTANTS.BOSS_AI_BEHAVIOR.SKILL_02,
      skill_3: CONSTANTS.BOSS_AI_BEHAVIOR.SKILL_03,
      skill_4: CONSTANTS.BOSS_AI_BEHAVIOR.SKILL_04,
      skill_5: CONSTANTS.BOSS_AI_BEHAVIOR.SKILL_05,
    };

    return skillMap[selectedSkill] || CONSTANTS.BOSS_AI_BEHAVIOR.IDLE;
  }

  // [보스몬스터 체력 GET / SET]
  getBossHp() {
    return this.hp;
  }

  setBossHp(hp) {
    this.hp = hp;
  }

  // [보스몬스터 데미지].
  bossTakeDamage(damage) {
    const sBossHit = {
      bossId: bossId,
      damage: damage,
    };

    const initialResponse = createResponse('dungeon', 'S_BossHit', PACKET_TYPE.S_BOSSHIT, sBossHit);

    this.broadcast(initialResponse, userInfo);
  }

  // [보스몬스터 사망]
  bossDie() {
    const sBossDie = {
      bossId: this.id,
    };

    const initialResponse = createResponse('dungeon', 'S_BossDie', PACKET_TYPE.S_BOSSDIE, sBossDie);

    this.broadcast(initialResponse, userInfo);
  }

  // [보스 몬스터 핸들러]
  handleBossSkill(packetData, users) {
    const { type, currentPosition } = packetData;
    console.log("type: ", type);
    switch (type.toLowerCase()) {
      case 'skill_01':
        this.handleRectangleSkillCollision(packetData.rectangle , users, currentPosition);
        break;
      case 'skill_02':
        this.handleSectorSkillCollision(packetData.sector , users, currentPosition);
        break;
      case 'skill_03':
        this.handleMultiCircleSkillCollision(packetData.secmultiCircle , users, currentPosition);
        break;
      case 'skill_04':
        this.handleSectorSkillCollision(packetData.sector , users, currentPosition);
        break;
      case 'skill_05':
        this.handleCircleSkillCollision(packetData.circles , users, currentPosition);
        break;
    }
  }

  // [스킬 1 - 사각형]
  handleRectangleSkillCollision(rectangle, users, currentPosition) {
    console.log("[스킬 충돌 검사 시작 - 여기까지 오니?]")
    //console.log("users : ", users);
    if (users.length === 0) return;

    console.log("[스킬 충돌 검사 시작]")
    if (rectangle) {
      const { center, direction, width, height, length } = rectangle;

      // 사각형 만들기
      const bossRectangle  = movementUtils.BossCreateRectangle(this.currentTransform, center, direction, width, height, length );

      // 충돌 검사.
      for (const user of users) {
        const userCurrentPosition = user.getTransform();
        if (movementUtils.BossRectangleCollision(userCurrentPosition, bossRectangle )) {
          const userInfo = getUserById(user.getId());
          const playerStatInfo = userInfo.getPlayerStatInfo();
          const playerHp = playerStatInfo.hp;

          // 최소 0으로 설정
          const newHp = Math.max(playerHp - 10, 0);
          userInfo.setHp(newHp);

          console.error("rectangle 정보: ", rectangle);
          console.log("충돌 사각형 : ", bossRectangle );
          console.log("유저 포지션 : ", userCurrentPosition);
          console.log("[유저 충돌함]")
        } else {
          console.error("rectangle 정보: ", rectangle);
          console.log("충돌 사각형 : ", bossRectangle );
          console.log("유저 포지션 : ", userCurrentPosition);
          console.log("충돌 안된 유저 : ", user.getId());
        }
      }

      // 보스몬스터 스킬 종료
      this.boosAiBehaviorSkill_End(users, currentPosition);
    }
  }

  // [스킬 2 - 부채꼴]
  handleSectorSkillCollision(sector, users, currentPosition) {
    if (users.length === 0) return;

    if (sector) {
      const { center, direction, radius, angle } = sector;

      // 충돌 검사.
      for (const user of users) {
        const userCurrentPosition = user.getTransform();

        if (
          movementUtils.BossSectorCollision(userCurrentPosition, center, direction, radius, angle)
        ) {
          const userInfo = getUserById(user.getId());
          const playerStatInfo = userInfo.getPlayerStatInfo();
          const playerHp = playerStatInfo.hp;

          // 최소 0으로 설정
          const newHp = Math.max(playerHp - 10, 0);
          userInfo.setHp(newHp);
          console.error("sector : ", sector);
          console.error("user : ", userCurrentPosition);
          console.log("[유저 충돌 - 부채꼴]")
        } else {
          console.error("sector : ", sector);
          console.error("user : ", userCurrentPosition);
          console.log("[유저 충돌 안함 - 부채꼴]")
        }
      }

      // 보스몬스터 스킬 종료
      this.boosAiBehaviorSkill_End(users, currentPosition);
    }
  }

  // [스킬 3 - 원(많은)]
  handleMultiCircleSkillCollision(skill_range, users, currentPosition) {
    if (users.length === 0) return;

    if (skill_range.multiCircle) {
      // 충돌 검사
      for (const user of users) {
        const userCurrentPosition = user.getTransform();

        for (const circle of skill_range.multiCircle.circles) {
          const { center, radius } = circle;

          // 충돌 검사 로직 (원 안에 있는지 확인)
          const dx = userCurrentPosition.posX - center.x;
          const dz = userCurrentPosition.posZ - center.z;
          const distanceSquared = dx * dx + dz * dz;

          if (distanceSquared <= radius * radius) {
            const userInfo = getUserById(user.getId());
            const playerStatInfo = userInfo.getPlayerStatInfo();
            const playerHp = playerStatInfo.hp;

            // 최소 0으로 설정
            const newHp = Math.max(playerHp - 10, 0);
            userInfo.setHp(newHp);
          }
        }
      }

      // 보스몬스터 스킬 종료
      this.boosAiBehaviorSkill_End(users, currentPosition);
    }
  }

  // [스킬 4 - 원]
  handleCircleSkillCollision(skill_range, users, currentPosition) {
    if (users.length === 0) return;

    if (skill_range.circles) {
      // 충돌 검사
      for (const user of users) {
        const userCurrentPosition = user.getTransform();
        const { center, radius } = skill_range.circles;

        // 충돌 검사 로직 (원 안에 있는지 확인)
        const dx = userCurrentPosition.posX - center.x;
        const dz = userCurrentPosition.posZ - center.z;
        const distanceSquared = dx * dx + dz * dz;

        if (distanceSquared <= radius * radius) {
          const userInfo = getUserById(user.getId());
          const playerStatInfo = userInfo.getPlayerStatInfo();
          const playerHp = playerStatInfo.hp;

          // 최소 0으로 설정
          const newHp = Math.max(playerHp - 10, 0);
          userInfo.setHp(newHp);
        }
      }

      // 보스몬스터 스킬 종료
      this.boosAiBehaviorSkill_End(users, currentPosition);
    }
  }

  // [브로드 케스트]
  async broadcast(initialResponse, users) {
    const promises = users.map((user) => {
      const player = getUserById(user.id);
      const userInfo = player.getUserInfo();
      const socket = userInfo.socket;

      //console.log("socket : ", socket)
      if (socket) {
        return new Promise((resolve, reject) => {
          socket.write(initialResponse, (err) => {
            if (err) {
              //reject();
              reject(new Error(`데이터를 보내는데 실패 user: ${err.message}`)); // 에러가 발생하면 reject
            } else {
              console.error('[메세지 보냄]');
              resolve(); // 성공적으로 보냈으면 resolve
            }
          });
        });
      }
    });

    // 모든 프로미스가 완료될 때까지 기다림
    await Promise.all(promises);
  }
}
