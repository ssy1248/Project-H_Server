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

    // 시작
    const startPos = [
      this.currentTransform.posX,
      this.currentTransform.posY,
      this.currentTransform.posZ,
    ];

    console.log("startPos", startPos);

    // 도착
    const endPos = [
      this.pathfindingDestination.posX,
      this.pathfindingDestination.posY,
      this.pathfindingDestination.posZ,
    ];

    console.log("endPos", endPos);


    // 패스 갱신.
    A_STER_MANAGER.DELETE_OBSTACLE(this.movementId, this.id);
    const paths = await A_STER_MANAGER.FIND_PATH(this.movementId, startPos, endPos);

    console.log('유저클래스 패스 :', paths);

    if (this.aSterPath.size() !== 0) {
      this.aSterPath.delete();
      console.log('기존에 데이터가 있어서 지웠습니다.');
    }

    for (const path of paths) {
      this.aSterPath.enqueue(path);
    }

    let path = this.aSterPath.dequeue();
    if (path !== null) {
      console.log(path);
      this.currentTransform.posX = path[0];
      this.currentTransform.posY = path[1];
      this.currentTransform.posZ = path[2];
    }

    path = this.aSterPath.dequeue();
    if (path !== null) {
      this.targetTransform.posX = path[0];
      this.targetTransform.posY = path[1];
      this.targetTransform.posZ = path[2];
    }


  
    // 초기 방향 설정.
    super.updateVelocity();

    //console.log('taget', this.targetTransform);
    console.log(this.velocity);

    // 행동 변경.
    super.setBehavior(CONSTANTS.AI_BEHAVIOR.CHASE);
  }

  // [트랜스폼 업데이트]
  updateTransform() {
    super.updateTransform();

    // 여기 고치자..
    //console.log(this.aSterPath.size());

    if (this.behavior === CONSTANTS.AI_BEHAVIOR.CHASE) {
      // if (this.aSterPath.size() === 0) {
      //   this.userAiBehaviorCHASE();

      //   const isTargetReached = movementUtils.hasPassedTarget(
      //     this.currentTransform,
      //     this.targetTransform,
      //     this.lastTransform,
      //   );

      //   if (isTargetReached) {
      //     this.behavior = CONSTANTS.AI_BEHAVIOR.IDLE;
      //     this.currentTransform = { ...this.pathfindingDestination };
      //     console.log("도착했음");
      //     //
      //   }
      // }
      this.userAiBehaviorCHASE();
    }
  }

  // [GET - currentTransform]
  getCurrentTransform() {
    const transform = { ...super.getCurrentTransform() };
    const deltaTime = (this.latency / 2 + CONSTANTS.NETWORK.INTERVAL) / 1000; // latency를 초 단위로 변환
    transform.posX += deltaTime;
    transform.posY += deltaTime;
    transform.posZ += deltaTime;

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
        console.log("[도착]")
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
    if (ping === 0) {
      ping = 1;
    }

    return ping * 2;
  }

  // [랜덤 좌표]
}
