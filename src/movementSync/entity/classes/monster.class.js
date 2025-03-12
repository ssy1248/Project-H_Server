import Entity from './entity.class.js';
import CONSTANTS from '../../constants/constants.js';
import movementUtils from '../../utils/movementUtils.js';
import A_STER_MANAGER from '../../pathfinding/testASter.manager.js';
import MONSTER_SEND_MESSAGE from '../../handlers/monster.handler.js';
import { getUserBySocket } from '../../../session/user.session.js';
import { monsterApplyDamage } from '../../movementSync.manager.js';

export default class Monster extends Entity {
  constructor(movementId, id, transform, model, name, hp, atk, def, speed) {
    super(movementId, id, transform);

    this.model = model;
    this.name = name;
    this.hp = hp;
    this.atk = atk;
    this.def = def;
    this.speed = speed;

    this.spawnTransform = { ...this.currentTransform };
    this.attackCount = 0;
    this.isAttack = false;
    this.isDie = false;
    this.isDamage = false;
  }

  // 0.
  getMonsterInfo() {
    return { model: this.model, name: this.name, hp: this.hp };
  }

  getIsAttack() {
    return this.isAttack;
  }

  getIsDie() {
    return this.isDie;
  }
  setIsDie(isDie) {
    this.isDie = isDie;
  }

  getIsDamage() {
    return this.isDamage;
  }
  setIsDamage(isDamage) {
    this.isDamage = isDamage;
  }

  getHp() {
    return this.hp;
  }

  setHp(hp) {
    this.hp = hp;
  }

  updateTransform(userTransform, id) {
    if (this.isDie) return;

    this.updateMonsterSync(userTransform, id);
    super.updateTransform();
  }

  // 1. updateMonsterSync
  updateMonsterSync(user) {
    const behavior = super.getBehavior();

    if (this.isDamage) {
      this.monsterAiBehaviorDAMAGED(user);
    }

    if (behavior === CONSTANTS.AI_BEHAVIOR.IDLE) {
      this.isAttack = false;
      this.monsterAiBehaviorIDLE(user);
    } else {
      switch (behavior) {
        case CONSTANTS.AI_BEHAVIOR.CHASE:
          this.monsterAiBehaviorCHASE(user);
          break;
        case CONSTANTS.AI_BEHAVIOR.RETURN:
          this.monsterAiBehaviorRETURN();
          break;
        case CONSTANTS.AI_BEHAVIOR.RETREAT:
          //this.monsterAiBehaviorCHASE(users);
          break;
        case CONSTANTS.AI_BEHAVIOR.ATTACK:
          this.monsterAiBehaviorATTACK(user);
          break;
        case CONSTANTS.AI_BEHAVIOR.DAMAGED:
          this.monsterAiBehaviorDAMAGED(user);
          break;
        default:
          break;
      }
    }
  }

  // 문제 발생
  // 1.

  monsterAiBehaviorIDLE(user) {
    // 거리 측정.
    const userTransform = user.getTransform();
    const currentTransform = super.getCurrentTransform();
    const distance01 = movementUtils.Distance(this.currentTransform, userTransform); // 거리 계산

    //console.log('유저 <-> 몬스터 거리: ', distance01);
    if (movementUtils.obbCollision(4, 4, this.currentTransform, userTransform)) {
      super.setBehavior(CONSTANTS.AI_BEHAVIOR.ATTACK);
      A_STER_MANAGER.UPDATE_OBSTACLE(this.movementId, this);
      this.attackCount = 60;
    }

    // 거리가 1보다 클경우
    if (distance01 >= 1) {
      // 길찾기 도착지점 갱신.
      super.setPathfindingDestination(userTransform);
      super.updatePathFinding(this.currentTransform, this.pathfindingDestination);
      A_STER_MANAGER.UPDATE_OBSTACLE(this.movementId, this);
    }
  }

  monsterAiBehaviorCHASE(user) {
    const userTransform = user.getTransform();
    const lastTransform = super.getLastTransform();
    const currentTransform = super.getCurrentTransform();
    const targetTransform = super.getTargetTransform();

    const distance01 = movementUtils.Distance(this.currentTransform, userTransform); // 거리 계산

    if (movementUtils.obbCollision(4, 4, this.currentTransform, userTransform)) {
      super.setBehavior(CONSTANTS.AI_BEHAVIOR.ATTACK);
      A_STER_MANAGER.UPDATE_OBSTACLE(this.movementId, this);

      this.attackCount = 60;
    }

    const aSterPath = super.getASterPath();

    if (aSterPath.size() === 0) {
      const result = movementUtils.hasPassedTarget(
        currentTransform,
        targetTransform,
        lastTransform,
      );

      if (result) {
        // 1. 이곳은 패스 (경로)에 도착할때마다 실행 하는 로직.

        // 2. 스폰 위치와 이동 목표가 가깝다면 복귀하는중이다.
        const spawnDistance = movementUtils.Distance(
          this.pathfindingDestination,
          this.spawnTransform,
        );

        if (spawnDistance <= 0.5) {
          //monsterApplyDamage(this.movementId, this.id, 5);
          super.setBehavior(CONSTANTS.AI_BEHAVIOR.IDLE);
        }

        // 3. 복귀 중이 아니고 목표에 도달했으면
        if (spawnDistance > 0.5) {
          super.setBehavior(CONSTANTS.AI_BEHAVIOR.IDLE);
          //super.setBehavior(CONSTANTS.AI_BEHAVIOR.ATTACK);
        }

        return false;
      } else {
        super.setBehavior(CONSTANTS.AI_BEHAVIOR.CHASE);
        return true;
      }
    } else {
      return true;
    }
  }

  monsterAiBehaviorRETURN() {
    // 길찾기 도착지점 갱신.
    super.setPathfindingDestination(this.spawnTransform);
    super.updatePathFinding(this.currentTransform, this.pathfindingDestination);
  }

  // [GET - transform]
  getTransform() {
    return super.getCurrentTransform();
  }

  monsterAiBehaviorATTACK(user) {
    const userTransform = user.getTransform();
    const currentTransform = super.getCurrentTransform();

    // 공격 수정
    if (this.attackCount === 0) {
      super.setBehavior(CONSTANTS.AI_BEHAVIOR.RETURN);
      this.isAttack = false;
    }

    if (this.attackCount === 60) {
      // 몬스터 -> 유저 바라보는 rot 계싼
      const { yaw } = movementUtils.Rotation(this.currentTransform, userTransform);
      //console.log('1. rot : ', this.currentTransform.rot);
      this.currentTransform.rot = yaw;
      //console.log('2. rot : ', this.currentTransform.rot);

      // 유저가 공격 범위 내에 있는지 확인
      if (movementUtils.obbCollision(4, 4, this.currentTransform, userTransform)) {
        this.isAttack = true;
        if (this.isAttack) {
          MONSTER_SEND_MESSAGE.ATTCK(this.movementId);
          // 1. 타겟 유저 찾기 => 매개변수로 받아옴
          const targetUser = getUserBySocket(user.getSocket());
          // 1-2. 공격 몬스터 찾기 => this
          // TODO: 몬스터 공격력 계산
          const damage = Math.max(0, this.atk - targetUser.getDef());
          // 2. 타겟 유저에게 데미지 주기
          targetUser.getDamage(damage);
          // 3. 타겟 유저 사망 처리
          // 4. 파티 전멸 처리
          // 5. 아이템 소실
          //super.setBehavior(CONSTANTS.AI_BEHAVIOR.RETURN);
          super.setBehavior(CONSTANTS.AI_BEHAVIOR.RETURN);
          this.isAttack = false;
          console.log('[몬스터 공격 성공하는 시점]');

          //userApplyDamage(this.movementId, id, this.id);
        }
      }
    }

    this.attackCount--;
  }

  monsterAiBehaviorDAMAGED(userTransform) {
    if (this.damageCount > 0) {
      // Knockback 계산 (넉백 파워 = (공격력 / 무게) * 밀리는 강도)
      const knockbackPower = (this.power / this.mass) * this.factor;
      const velocity = movementUtils.DirectionAndVelocity(
        userTransform,
        this.currentTransform,
        knockbackPower,
      );
      this.velocity = { ...velocity };

      // 방향 계산 (몬스터가 피격된 방향으로 회전)
      const { yaw } = movementUtils.Rotation(this.currentTransform, userTransform);
      this.damageRot = yaw;
      this.currentTransform.rot = this.damageRot;

      // 넉백 각도
      const knockback = movementUtils.Rotation(userTransform, this.currentTransform);
      const { topLeft, topRight, bottomLeft, bottomRight } = movementUtils.obbBox(
        1,
        1,
        this.currentTransform,
        knockback.yaw,
      );

      // 넉백 방향이 장애물인 경우 바로 피격 종료.
      // 지금은 테스트라 y축은 냅두는데 테스트 종료후 삭제예정
      // 테스트
      const testArr = [];
      testArr.push({
        posX: topLeft.x,
        posY: 0,
        posZ: topLeft.z,
      });

      testArr.push({
        posX: topRight.x,
        posY: 0,
        posZ: topRight.z,
      });

      testArr.push({
        posX: bottomLeft.x,
        posY: 0,
        posZ: bottomLeft.z,
      });

      testArr.push({
        posX: bottomRight.x,
        posY: 0,
        posZ: bottomRight.z,
      });

      for (const pos of testArr) {
        if (A_STER_MANAGER.FIND_OBSTACLE_POSITION(this.movementId, pos)) {
          // console.error("유저 넉백 장애물 불가");
          this.resetDamageState();
          console.error('[유저 - 넉백 불가]');
          return;
        }
      }

      // 점진적으로 감속 (실제 시간 기준 감소)
      // 0.1 * (1 / mass) = 기본 감속 속도 (무게가 클수록 감속이 느림)
      this.damageCount -= 0.1 * (1 / this.mass);
    } else {
      this.resetDamageState();
    }
  }

  // 피격 상태 초기화 함수
  resetDamageState() {
    super.setBehavior(CONSTANTS.AI_BEHAVIOR.IDLE);
    this.damageCount = CONSTANTS.ENTITY.DEFAULT_SPEED;
    this.isDamage = false;
    A_STER_MANAGER.UPDATE_OBSTACLE(this.movementId, this);
  }

  // 넉백 지속시간 계산 (프레임 단위 변환)
  //  (공격력 / 무게) = 기본 넉백 영향도 (공격력이 높을수록 넉백 증가, 무게가 높을수록 감소)
  // 밀리는 강도와 지속시간을 반영하여 넉백 지속시간 계산
  updateDamageCount(power, mass, factor, durationFactor) {
    A_STER_MANAGER.DELETE_OBSTACLE(this.movementId, this.id);

    this.aSterPath.delete();

    this.isDamage = true;
    super.setBehavior(CONSTANTS.AI_BEHAVIOR.DAMAGED);

    this.power = power; // 파워
    this.mass = mass; // 무개
    this.factor = factor; // 밀리는 강도
    this.durationFactor = durationFactor; // 밀리는 시간.

    // 넉백 지속시간 계산
    this.damageCount = (this.power / this.mass) * this.factor * durationFactor;
  }
}
