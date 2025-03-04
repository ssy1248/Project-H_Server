import Entity from './entity.class.js';
import CONSTANTS from '../../constants/constants.js';
import movementUtils from '../../utils/movementUtils.js';
import A_STER_MANAGER from '../../pathfinding/testASter.manager.js';

export default class User extends Entity {
  constructor(movementId, socket, id, transform) {
    super(movementId, id, transform);

    this.socket = socket;
    this.latency = 0;
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
    super.updateTransform();

    // 여기 고치자..
    //console.log(this.aSterPath.size());

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

  // [랜덤 좌표]
}
