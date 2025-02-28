import Queue from '../../utils/queue.js';
import CONSTANTS from '../../constants/constants.js';
import movementUtils from '../../utils/movementUtils.js';
import A_STER_MANAGER from '../../pathfinding/testASter.manager.js';

/**
 * [Entiy]
 * 1. 모든 Entiy의 부모 클래스.
 */

export default class Entity {
  constructor(movementId, id, transform = { posX: 0, posY: 0, posZ: 0, rot: 0 }) {
    this.movementId = movementId;
    this.id = id;
    this.currentTransform = { ...transform };
    this.lastTransform = { ...transform };
    this.targetTransform = { ...transform };
    this.pathfindingDestination = { ...transform };
    this.velocity = { x: 0, y: 0, z: 0 };
    this.aSterPath = new Queue(CONSTANTS.UTILS.QUEUE_SIZE);
    this.behavior = CONSTANTS.AI_BEHAVIOR.IDLE;
    this.lastUpdateTime = Date.now();

    console.log('생성 좌표 : ', this.currentTransform);
    console.log(` ID : ${this.id} / movementId : ${this.movementId}`);
  }

  // [경로 찾기]
  updatePathFinding(startTransform, endTransform) {
    // 시작
    const startPos = [
      startTransform.posX,
      startTransform.posY,
      startTransform.posZ,
    ];

    // 도착
    const endPos = [
      endTransform.posX,
      endTransform.posY,
      endTransform.posZ,
    ];

    // 패스 갱신.
    A_STER_MANAGER.DELETE_OBSTACLE(this.movementId, this.id);
    const paths = A_STER_MANAGER.FIND_PATH(this.movementId, startPos, endPos);

    if (paths.length === 0) {
      return true;
    }

    if (this.aSterPath.size() !== 0) {
      this.aSterPath.delete();
    }

    for (const path of paths) {
      this.aSterPath.enqueue(path);
    }

    const path = this.aSterPath.dequeue();
    if (path !== null) {
      this.targetTransform.posX = path[0];
      this.targetTransform.posY = path[1];
      this.targetTransform.posZ = path[2];
    }

    // 초기 방향 설정.
    this.updateVelocity();

    // 행동 변경.
    this.setBehavior(CONSTANTS.AI_BEHAVIOR.CHASE);

  }

  // [트랜스폼 업데이트]
  updateTransform() {

    //console.log(this.behavior);

    if (
      this.behavior !== CONSTANTS.AI_BEHAVIOR.IDLE &&
      this.behavior !== CONSTANTS.AI_BEHAVIOR.ATTACK
    ) {
      // 방향 구하기.
      const { yaw } = movementUtils.Rotation(this.currentTransform, this.targetTransform);

      // 타겟 업데이트.
      this.updateTargetTransform();

      

      // 델타타임
      const deltaTime = 1 / CONSTANTS.NETWORK.TICK_RATE; // 프레임당 시간 (60FPS 기준)

      // 현재 좌표 업데이트.
      this.currentTransform.posX += this.velocity.x * deltaTime;
      this.currentTransform.posY += this.velocity.y * deltaTime;
      this.currentTransform.posZ += this.velocity.z * deltaTime;
      if (this.behavior !== CONSTANTS.AI_BEHAVIOR.DAMAGED) {
        this.currentTransform.rot = yaw;
      }

      //console.log("업데이트 좌표: ", this.currentTransform.posX);

      //console.log(this.currentTransform);
      // 트랜스폼 스왑.
      this.updateLastTransform(this.currentTransform);
    }
  }

  // [타겟 업데이트]
  updateTargetTransform() {
    if (this.aSterPath.size() !== 0 && this.behavior !== CONSTANTS.AI_BEHAVIOR.IDLE) {
      const isTargetReached = movementUtils.hasPassedTarget(
        this.currentTransform,
        this.targetTransform,
        this.lastTransform,
      );


      // 목표지점을 도착했거나 지나쳤을 경우 타겟 재설정.
      if (isTargetReached) {
        this.currentTransform = { ...this.targetTransform };

        const target = this.aSterPath.dequeue();

        if (target) {

          //const value = this.updatePathFinding(this.currentTransform, this.pathfindingDestination);

          //if(!value) return;

          const targetTransformInfo = {
            posX: target[0],
            posY: target[1],
            posZ: target[2],
            rot: 0,
          };

          const { yaw } = movementUtils.Rotation(this.currentTransform, targetTransformInfo);
          targetTransformInfo.rot = yaw;

          this.targetTransform = { ...targetTransformInfo };

          // 방향 업데이트
          this.updateVelocity();

          A_STER_MANAGER.UPDATE_OBSTACLE('town', this);
        }
      }
    }
  }

  // [방향 업데이트]
  updateVelocity() {
    const velocity = movementUtils.DirectionAndVelocity(
      this.currentTransform,
      this.targetTransform,
      CONSTANTS.ENTITY.DEFAULT_SPEED,
    );
    this.velocity = { ...velocity };
    //console.log(this.currentTransform);
    // console.log("함수 내부 현재 좌표:",this.currentTransform);
    //console.log("함수 내부 타겟:",this.targetTransform);
    //console.log(velocity);
  }

  // [마지막 트랜스폼 갱신]
  updateLastTransform(transform) {
    this.lastTransform = { ...this.currentTransform };
    this.currentTransform = { ...transform };
    //console.log(transform);
  }

  // [GET - id]
  getId() {
    return this.id;
  }

  // [GET - currentTransform]
  getCurrentTransform() {
    return this.currentTransform;
  }

  // [GET - behavior]
  getBehavior() {
    return this.behavior;
  }

  // [SET - behavior]
  setBehavior(behavior) {
    this.behavior = behavior;
  }

  // [GET - LastUpdateTime]
  getLastUpdateTime() {
    return this.lastUpdateTime;
  }

  // [SET - LastUpdateTime]
  setLastUpdateTime() {
    this.lastUpdateTime = Date.now();
  }

  // [GET - pathfindingDestination]
  getPathfindingDestination() {
    return this.pathfindingDestination;
  }

  // [SET - pathfindingDestination]
  setPathfindingDestination(transform) {
    this.pathfindingDestination = { ...transform };
  }

  // [GET - jpsPath]
  getASterPath() {
    return this.aSterPath;
  }

  // [GET - lastTransform]
  getLastTransform() {
    return this.lastTransform;
  }

  // [GET - lastTransform]
  getTargetTransform() {
    return this.targetTransform;
  }

  /**
   * this.behavior = CONSTANTS.AI_BEHAVIOR.IDLE;
    this.lastUpdateTime = Date.now();
   */
}
