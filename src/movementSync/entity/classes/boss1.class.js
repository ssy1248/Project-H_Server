import Entity from './entity.class.js';
import CONSTANTS from '../../constants/constants.js';
import movementUtils from '../../utils/movementUtils.js';
import A_STER_MANAGER from '../../pathfinding/testASter.manager.js';
import Queue from '../../utils/queue.js';

export default class Boss1 extends Entity {
  constructor(movementId, id, transform, model, name, hp) {
    super(movementId, id, transform);

    this.model = model;
    this.name = name;
    this.hp = hp;

    this.skillModifiers = {
      skill_1: 1.0,
      skill_2: 1.0,
      skill_3: 1.0,
    };

    this.skillActiveTimes = {
      skill_1: 1000,
      skill_2: 1000,
      skill_3: 1000,
    };

    this.skillCooldown = 120;

    this.bossBehavior = CONSTANTS.BOSS_AI_BEHAVIOR.IDLE;

    this.spawnTransform = { ...this.currentTransform };
  }

  // 업데이트
  updateTransform(userInfo) {
    if (this.isDie) return;

    this.updateBossSync(userInfo);
    super.updateTransform();
  }

  // 보스 몬스터 업데이트
  updateBossSync(userInfo) {
    // 엔티티 상태가 IDLE 일 경우 (보스몬스터 행동 세팅.)
    if (this.behavior === CONSTANTS.AI_BEHAVIOR.IDLE) {
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
      const collisionDetected = movementUtils.obbMyCollision(
        5,
        this.currentTransform,
        closestUser.currentTransform,
      );

      if (collisionDetected) {
        // 보스 상태가 IDLE 일 경우 스킬 세팅.
        if (this.bossBehavior === CONSTANTS.BOSS_AI_BEHAVIOR.IDLE) {
          if(this.skillCooldown <= 0){
            this.prepareBossSkill();
            this.attackCount = 120;
          }
        }
      } else {
        this.chasePlayer(closestUser.currentTransform);
      }
    }

    if (this.bossBehavior !== CONSTANTS.BOSS_AI_BEHAVIOR.IDLE) {
      switch (this.bossBehavior) {
        case CONSTANTS.BOSS_AI_BEHAVIOR.SKILL_01:
          this.boosAiBehaviorSkill_01(userInfo);
          break;

        case CONSTANTS.BOSS_AI_BEHAVIOR.SKILL_02:
          this.boosAiBehaviorSkill_02(userInfo);
          break;
        case CONSTANTS.BOSS_AI_BEHAVIOR.SKILL_03:
          this.boosAiBehaviorSkill_03(userInfo);
          break;

        default:
          break;
      }
    } else {
      this.skillCooldown -= 1;
    }
  }

  // [보스 추격]

  // [보스 스킬 1]
  boosAiBehaviorSkill_01(userInfo) {
    this.runForLimitedTime(
      100,
      this.skillActiveTimes.skill_1,
      () => this.boosAiBehaviorSkill_01_Start(),
      () => this.boosAiBehaviorSkill_01_End(userInfo),
    );
  }

  boosAiBehaviorSkill_01_Start() {}

  boosAiBehaviorSkill_01_End(userInfo) {

    this.bossBehavior = CONSTANTS.BOSS_AI_BEHAVIOR.IDLE;
    this.skillCooldown = 120;
  }

  // [보스 스킬 2]
  boosAiBehaviorSkill_02(userInfo) {
    this.runForLimitedTime(
      100,
      this.skillActiveTimes.skill_1,
      () => this.boosAiBehaviorSkill_02_Start(),
      () => this.boosAiBehaviorSkill_02_End(userInfo),
    );
  }

  boosAiBehaviorSkill_02_Start() {}

  boosAiBehaviorSkill_02_End(userTransform) {

    this.bossBehavior = CONSTANTS.BOSS_AI_BEHAVIOR.IDLE;
    this.skillCooldown = 120;
  }

  // [보스 스킬 3]
  boosAiBehaviorSkill_03(userInfo) {
    this.runForLimitedTime(
      100,
      this.skillActiveTimes.skill_1,
      () => this.boosAiBehaviorSkill_03_Start(),
      () => this.boosAiBehaviorSkill_03_End(userInfo),
    );
  }

  boosAiBehaviorSkill_03_Start() {}

  boosAiBehaviorSkill_03_End(userTransform) {

    this.bossBehavior = CONSTANTS.BOSS_AI_BEHAVIOR.IDLE;
    this.skillCooldown = 120;
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
      this.executeSkill(selectedSkill);

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
    };

    return skillMap[selectedSkill] || CONSTANTS.BOSS_AI_BEHAVIOR.IDLE;
  }

  // 보스몬스터 데미지.

  // 보스
}
