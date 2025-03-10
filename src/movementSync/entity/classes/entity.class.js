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
    this.currentTransform = { ...transform }; // 현재 좌표.
    this.lastTransform = { ...transform }; // 이전 좌표.
    this.targetTransform = { ...transform }; // 목표 좌표.
    this.pathfindingDestination = { ...transform }; // 길찾기 최종 목표.
    this.velocity = { x: 0, y: 0, z: 0 };
    this.aSterPath = new Queue(CONSTANTS.UTILS.QUEUE_SIZE);
    this.gridIndexPath = new Queue(CONSTANTS.UTILS.QUEUE_SIZE);
    this.behavior = CONSTANTS.AI_BEHAVIOR.IDLE;
    this.lastUpdateTime = Date.now();

    this.isSearchFail = false;

    this.attackCount = 0;
    this.isAttack = false;
    this.isDie = false;
    this.isDamage = false;

    // 데미지
    this.damageCount = 0;
    this.power = 0;
    this.mass = 0;
    this.factor = 0;
    this.damageRot = 0;
    this.durationFactor = 0;

    console.log('생성 좌표 : ', this.currentTransform);
    console.log(` ID : ${this.id} / movementId : ${this.movementId}`);

    this.findAccessiblePosition();
  }

  // [엔티티 스폰시 장애물 없는 곳에서 생성]
  findAccessiblePosition() {
    // 스폰지역이 장애물 구역이면 새로 지정.
    while (A_STER_MANAGER.FIND_OBSTACLE_POSITION(this.movementId, this.currentTransform)) {
      let transform = {};
      if (this.movementId === 'town') {
        transform = {
          posX: this.generateRandomPlayerTransformInfo(-9, 9),
          posY: 1,
          posZ: this.generateRandomPlayerTransformInfo(-8, 8) + 130,
          rot: this.generateRandomPlayerTransformInfo(0, 360),
        };
      } else {
        transform = {
          posX: this.generateRandomPlayerTransformInfo(-20, 20),
          posY: 1,
          posZ: this.generateRandomPlayerTransformInfo(0, 40),
          rot: this.generateRandomPlayerTransformInfo(0, 360),
        };
      }

      this.currentTransform = { ...transform };
    }

    // 스폰지역이 지정되면 장애물 지정.
    A_STER_MANAGER.UPDATE_OBSTACLE(this.movementId, this);
  }

  // 랜덤 좌표 및 회전 각도 생성 함수
  generateRandomPlayerTransformInfo(min, max) {
    // min ~ max 사이의 랜덤 값
    const randomValue = Math.floor(Math.random() * (max - min + 1)) + min;
    return randomValue;
  }

  // [패스 경로에서 동적 장애물을 탐색]
  checkPathObstacles() {
    if (this.gridIndexPath.size() !== 0) {
      const items = this.gridIndexPath.getItems();
      let result = false;

      // for(const item of items){
      //   result = A_STER_MANAGER.FIND_OBSTACLE(this.movementId, item );

      //   if(result) break;

      // }

      // this.gridIndexPath.dequeue();

      const test = this.gridIndexPath.dequeue();
      result = A_STER_MANAGER.FIND_OBSTACLE(this.movementId, test);

      return result;
    }
  }

  // [경로 찾기]
  updatePathFinding(startTransform, endTransform) {
    // 시작 포지션.
    const startPos = [startTransform.posX, startTransform.posY, startTransform.posZ];

    // 도착 포지션.
    const endPos = [endTransform.posX, endTransform.posY, endTransform.posZ];

    // 패스 갱신.
    A_STER_MANAGER.DELETE_OBSTACLE(this.movementId, this.id);
    const paths = A_STER_MANAGER.FIND_PATH(this.movementId, startPos, endPos);

    // 길 못찾은경우.
    if (!paths || paths.gridIndexPath.length === 0 || paths.gridIndexPath.length === 0) {
      // 1. 도착지가 막혀있으면 몇번 탐색후.
      // 2. 길을 계속 못찾을 경우 다른 행동을 하자.

      const transform = {
        posX: this.generateRandomPlayerTransformInfo(-20, 20),
          posY: 1,
          posZ: this.generateRandomPlayerTransformInfo(0, 40),
          rot: this.generateRandomPlayerTransformInfo(0, 360),
      };

      this.setPathfindingDestination(transform);
      console.log('길못찾는다.!!!!');

      this.isSearchFail = true;
      this.behavior = CONSTANTS.AI_BEHAVIOR.IDLE;

      //여기 확인하자. 밥먹고
      return this.updatePathFinding(this.currentTransform, this.pathfindingDestination);
    } else {
      this.isSearchFail = false;
    }

    // 이미 패스가 존재 한다면 삭제.
    if (this.aSterPath.size() !== 0) {
      this.aSterPath.delete();
      this.gridIndexPath.delete();
    }

    // 패스 갱신.
    for (const path of paths.pathCoords) {
      this.aSterPath.enqueue(path);
    }

    //console.log("paths.pathCoords :", paths.pathCoords);

    // 그리드 인덱스 패스 갱신
    for (const gridIndex of paths.gridIndexPath) {
      this.gridIndexPath.enqueue(gridIndex);
    }

    if (!this.aSterPath.size()) {
      console.log('aSterPath가 비어있다.');
      //return;
    }

    if (!this.gridIndexPath.size()) {
      console.log('gridIndexPath가 비어있다.');
      //return;
    }

    //console.log("this.gridIndexPath : ", this.gridIndexPath);
    //console.log("paths.pathCoords : ", paths.pathCoords)

    // 타겟 갱신.
    const path = this.aSterPath.dequeue();
    this.gridIndexPath.dequeue();
    if (path !== null) {
      this.targetTransform.posX = path[0];
      this.targetTransform.posY = path[1];
      this.targetTransform.posZ = path[2];
    }

    // 인덱스 패스 검사 (재탐색)
    if (this.checkPathObstacles()) {
      return this.updatePathFinding(this.currentTransform, this.pathfindingDestination);
    }

    // 초기 방향 설정.
    this.updateVelocity();

    // 행동 변경.
    this.setBehavior(CONSTANTS.AI_BEHAVIOR.CHASE);
  }

  // [트랜스폼 업데이트]
  updateTransform() {
    if (this.behavior !== CONSTANTS.AI_BEHAVIOR.IDLE) {
      // 방향 구하기.
      const { yaw } = movementUtils.Rotation(this.currentTransform, this.targetTransform);

      // 타겟 업데이트.
      if (this.behavior !== CONSTANTS.AI_BEHAVIOR.ATTACK) {
        this.updateTargetTransform();
      }

      // 델타타임
      const deltaTime = 1 / CONSTANTS.NETWORK.TICK_RATE; // 프레임당 시간 (60FPS 기준)

      // 현재 좌표 업데이트.
      if (this.behavior !== CONSTANTS.AI_BEHAVIOR.ATTACK) {
        this.currentTransform.posX += this.velocity.x * deltaTime;
        this.currentTransform.posY += this.velocity.y * deltaTime;
        this.currentTransform.posZ += this.velocity.z * deltaTime;
      }

      if (this.behavior !== CONSTANTS.AI_BEHAVIOR.DAMAGED) {
        this.currentTransform.rot = yaw;
      }

      //console.log("업데이트 좌표: ", this.currentTransform.posX);

      //console.log(this.currentTransform);
      // 트랜스폼 스왑.
      this.updateLastTransform(this.currentTransform);

      if (this.behavior === CONSTANTS.AI_BEHAVIOR.DAMAGED) {
        //console.error("피격중");
      }
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
        // 1. 엔티티가 타겟 경로에 도착하면 장애물이있는지 탐색한다
        // 2. 엔티티가 존재한다면 바로 재탐색.
        if (this.checkPathObstacles()) {
          //return this.updatePathFinding(this.currentTransform, this.pathfindingDestination);
          this.behavior = CONSTANTS.AI_BEHAVIOR.IDLE;
          return this.behavior;
        }

        this.currentTransform = { ...this.targetTransform };

        const target = this.aSterPath.dequeue();

        if (target) {
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

          A_STER_MANAGER.UPDATE_OBSTACLE(this.movementId, this);
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
  }

  // [마지막 트랜스폼 갱신]
  updateLastTransform(transform) {
    this.lastTransform = { ...this.currentTransform };
    this.currentTransform = { ...transform };
    //console.log(transform);
  }

  // [GET - id]
  getIsSearchFail() {
    return this.isSearchFail;
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
