import Entity from './entity.class.js';
import CONSTANTS from '../../constants/constants.js';
import movementUtils from '../../utils/movementUtils.js';
import A_STER_MANAGER from '../../pathfinding/testASter.manager.js';

export default class User extends Entity {
  constructor(movementId, socket, id, transform) {
    super(movementId, id, transform);

    this.socket = socket;
    this.latency = 0;

    this.damageTagetMonster = {
      posX : 0,
      posY : 0,
      posZ : 0,
      rot : 0,
    }
  }

  // [유저 트랜스폼 동기화]
  async updateUserTransformSync(transform, timestamp) {
    // 레이턴시 갱신.
    this.latency = this.computeNetworkDelay(timestamp);

    // 길찾기 도착지점 갱신.
    super.setPathfindingDestination(transform);

    // 길찾기.
    super.updatePathFinding(this.currentTransform, this.pathfindingDestination);
  }

  // [트랜스폼 업데이트]
  updateTransform() {
    if (this.behavior === CONSTANTS.AI_BEHAVIOR.DAMAGED) {
      this.userAiBehaviorDAMAGED(this.damageTagetMonster);
    }
    
    super.updateTransform();

    if (this.behavior === CONSTANTS.AI_BEHAVIOR.CHASE) {
      this.userAiBehaviorCHASE();
    }
  }

  // [GET - currentTransform]
  getCurrentTransform() {
    const transform = { ...super.getCurrentTransform() };
    // const deltaTime = (this.latency / 2 + CONSTANTS.NETWORK.INTERVAL) / 1000; // latency를 초 단위로 변환
    // transform.posX += deltaTime;
    // transform.posY += deltaTime;
    // transform.posZ += deltaTime;

    //console.log("서버에서 보정된 transform : ", transform)
    return transform;
  }

  // [GET - transform]
  getTransform() {
    return super.getCurrentTransform();
  }

  // [GET - socket]
  getSocket() {
    return this.socket;
  }

  // [추격하고 있는지 아닌지 판단.]
  userAiBehaviorCHASE() {
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
        console.log('[도착]');
        return false;
      } else {
        super.setBehavior(CONSTANTS.AI_BEHAVIOR.CHASE);
        return true;
      }
    } else {
      return true;
    }
  }

  // [ 레이 턴시 ]
  computeNetworkDelay(timestamp) {
    // 서버와 클라이언트 시간 차이를 계산해서 보정
    const timeDifference = Date.now() - timestamp;
    let ping = timeDifference >= 0 ? timeDifference : 24 * 60 * 60 * 1000 + timeDifference; // 음수일 때 하루를 더해주기

    // ping이 0이면 1로 설정
    // if (ping === 0) {
    //   ping = 1;
    // }

    return ping * 2;
  }

  // [유저 피격]
  userAiBehaviorDAMAGED( monsterTransform) {
    if (this.damageCount > 0) {
      // Knockback 계산 (넉백 파워 = (공격력 / 무게) * 밀리는 강도)
      const knockbackPower = (this.power / this.mass) * this.factor;

      const velocity = movementUtils.DirectionAndVelocity(
        monsterTransform,
        this.currentTransform,
        knockbackPower,
      );
      this.velocity = { ...velocity };

      // 방향 계산 (몬스터가 피격된 방향으로 회전)
      const { yaw } = movementUtils.Rotation(this.currentTransform, monsterTransform);
      this.damageRot = yaw;
      this.currentTransform.rot = this.damageRot;


      // 넉백 각도 
      const knockback = movementUtils.Rotation(monsterTransform, this.currentTransform);
      const { topLeft, topRight, bottomLeft, bottomRight } = movementUtils.obbBox(1,1,this.currentTransform, knockback.yaw);



      // 넉백 방향이 장애물인 경우 바로 피격 종료.
      // 지금은 테스트라 y축은 냅두는데 테스트 종료후 삭제예정
      // 테스트
      const testArr = [];
      testArr.push({
        posX: topLeft.x,
        posY: 0,
        posZ: topLeft.z,
      })

      testArr.push({
        posX: topRight.x,
        posY: 0,
        posZ: topRight.z,
      })

      testArr.push({
        posX: bottomLeft.x,
        posY: 0,
        posZ: bottomLeft.z,
      })

      testArr.push({
        posX: bottomRight.x,
        posY: 0,
        posZ: bottomRight.z,
      })

      for(const pos of testArr){
        if (A_STER_MANAGER.FIND_OBSTACLE_POSITION(this.movementId, pos)) {
          console.error("유저 넉백 장애물 불가");
          this.resetDamageState();
          console.error("[넉백 불가]");
          return;
        }
      }

      // 점진적으로 감속 (실제 시간 기준 감소)
      // 0.1 * (1 / mass) = 기본 감속 속도 (무게가 클수록 감속이 느림)
      this.damageCount -= 0.1 * (1 / this.mass);
      

    } else {
      console.error("유저피격 끝");
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
  updateDamageCount(power, mass, factor, durationFactor, monsterTransform) {
    A_STER_MANAGER.DELETE_OBSTACLE(this.movementId, this.id);
    
    this.aSterPath.delete();
    this.damageTagetMonster = {...monsterTransform};
    
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
