import Entity from './entity.class.js';
import CONSTANTS from '../../constants/constants.js';
import movementUtils from '../../utils/movementUtils.js';
import A_STER_MANAGER from '../../pathfinding/testASter.manager.js';
import MONSTER_SEND_MESSAGE from '../../handlers/monster.handler.js';

export default class Monster extends Entity {
  constructor(movementId, id, transform, model, name, hp) {
    super(movementId, id, transform);

    this.model = model;
    this.name = name;
    this.hp = hp;

    this.spawnTransform = { ...transform };
    this.attackCount = 0;
    this.isAttack = false;
  }

  // 0.
  getMonsterInfo() {
    return { model: this.model, name: this.name, hp: this.hp };
  }

  getIsAttack() {
    return this.isAttack;
  }

  updateTransform(users) {
    this.updateMonsterSync(users);
    super.updateTransform();
  }

  // 1. updateMonsterSync
  updateMonsterSync(users) {
    const behavior = super.getBehavior();

    if (users.length === 0) {
      return;
    }

    if (behavior === CONSTANTS.AI_BEHAVIOR.IDLE) {
      this.isAttack = false;
      this.monsterAiBehaviorIDLE(users);
    } else {
      switch (behavior) {
        case CONSTANTS.AI_BEHAVIOR.CHASE:
          this.monsterAiBehaviorCHASE(users);
          break;
        case CONSTANTS.AI_BEHAVIOR.RETURN:
          this.monsterAiBehaviorRETURN();
          break;
        case CONSTANTS.AI_BEHAVIOR.RETREAT:
          //this.monsterAiBehaviorCHASE(users);
          break;
        case CONSTANTS.AI_BEHAVIOR.ATTACK:
          this.monsterAiBehaviorATTACK(users);
          break;
        case CONSTANTS.AI_BEHAVIOR.DAMAGED:
          this.monsterAiBehaviorDAMAGED(users);
          break;
        default:
          break;
      }
      if (behavior === CONSTANTS.AI_BEHAVIOR.CHASE) {
        this.monsterAiBehaviorCHASE();
      }
    }
  }

  // 문제 발생
  // 1.

  monsterAiBehaviorIDLE(users) {
    const currentTransform = super.getCurrentTransform();

    let closestUser = null; // 가장 가까운 유저.
    let minDistance = Infinity; // 가장 작은 거리로 초기화

    for (const user of users) {
      const userTransform = user.getTransform(); // 유저의 트랜스폼 정보

      const distance = movementUtils.Distance(currentTransform, userTransform); // 거리 계산
      if (distance < minDistance) {
        minDistance = distance;
        closestUser = user;
      }
    }

    // users.forEach((user) => {
    //   const userTransform = user.getTransform(); // 유저의 트랜스폼 정보

    //   const distance = movementUtils.Distance(currentTransform, userTransform); // 거리 계산
    //   if (distance < minDistance) {
    //     minDistance = distance;
    //     closestUser = user;
    //   }
    // });

    if (closestUser) {
      const userTransform = closestUser.getTransform();
      const velocity = movementUtils.DirectionAndVelocity(
        this.currentTransform,
        userTransform,
        CONSTANTS.ENTITY.DEFAULT_SPEED,
      );


      // 엔티티의 이동 방향과 반대쪽으로 목표를 설정 (조금 덜가게)
      const offset = 0.3; // 이동할 거리의 비율 (조정 가능)
      const targetPos = {
        posX: userTransform.posX - velocity.x * offset,
        posY: userTransform.posY - velocity.y * offset,
        posZ: userTransform.posZ - velocity.z * offset,
        rot: movementUtils.Rotation(currentTransform, userTransform),
      };

      const distance = movementUtils.Distance(this.currentTransform, targetPos);


      if (distance < 1) {
        return;
      }

      // 길찾기 도착지점 갱신.
      super.setPathfindingDestination(targetPos);

      // 시작
      const startPos = [
        this.currentTransform.posX,
        this.currentTransform.posY,
        this.currentTransform.posZ,
      ];

      // 도착
      const endPos = [
        this.pathfindingDestination.posX,
        this.pathfindingDestination.posY,
        this.pathfindingDestination.posZ,
      ];

      // 패스 갱신.
      A_STER_MANAGER.DELETE_OBSTACLE(this.movementId, this.id);
      const paths = A_STER_MANAGER.FIND_PATH(this.movementId, startPos, endPos);

      if (paths.length === 0) {
        return;
      }

      for (const path of paths) {
        this.aSterPath.enqueue(path);
      }

      if (this.aSterPath.size() !== 0) {
        this.aSterPath.delete();
      }

      for (const path of paths) {
        this.aSterPath.enqueue(path);
      }

      let path = this.aSterPath.dequeue();

      this.targetTransform.posX = path[0];
      this.targetTransform.posY = path[1];
      this.targetTransform.posZ = path[2];

      // 초기 방향 설정.
      super.updateVelocity();

      // 행동 변경.
      super.setBehavior(CONSTANTS.AI_BEHAVIOR.CHASE);

    }
  }

  monsterAiBehaviorCHASE() {
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
        const distance = movementUtils.Distance(this.currentTransform, this.spawnTransform);
        if (distance <= 1) {
          this.hp = 0;
          super.setBehavior(CONSTANTS.AI_BEHAVIOR.IDLE);
        } else {
          super.setBehavior(CONSTANTS.AI_BEHAVIOR.ATTACK);
          this.attackCount = 120;

          //super.setBehavior(CONSTANTS.AI_BEHAVIOR.DAMAGED);
        }

        //super.setBehavior(CONSTANTS.AI_BEHAVIOR.DAMAGED);

      

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

    // 시작
    const startPos = [
      this.currentTransform.posX,
      this.currentTransform.posY,
      this.currentTransform.posZ,
    ];

    // 도착
    const endPos = [
      this.pathfindingDestination.posX,
      this.pathfindingDestination.posY,
      this.pathfindingDestination.posZ,
    ];

    // 패스 갱신.
    A_STER_MANAGER.DELETE_OBSTACLE(this.movementId, this.id);
    const paths = A_STER_MANAGER.FIND_PATH(this.movementId, startPos, endPos);

    if (paths.length === 0) {
      return;
    }

    if (this.aSterPath.size() !== 0) {
      this.aSterPath.delete();
    }

    for (const path of paths) {
      this.aSterPath.enqueue(path);
    }

    let path = this.aSterPath.dequeue();
    if (path !== null) {

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

    // 행동 변경.
    super.setBehavior(CONSTANTS.AI_BEHAVIOR.CHASE);
  }

  // [GET - transform]
  getTransform() {
    return super.getCurrentTransform();
  }

  monsterAiBehaviorATTACK(users) {
    const currentTransform = super.getCurrentTransform();
    this.attackCount--; // 어택카운터 --

    // 카운터가 0이면
    if (this.attackCount <= 0) {
      super.setBehavior(CONSTANTS.AI_BEHAVIOR.RETURN);
      this.isAttack = false;
      return;
    }

    let closestUser = null; // 가장 가까운 유저.
    let minDistance = Infinity; // 가장 작은 거리로 초기화

    users.forEach((user) => {
      const userTransform = user.getTransform(); // 유저의 트랜스폼 정보

      const distance = movementUtils.Distance(currentTransform, userTransform); // 거리 계산
      if (distance < minDistance) {
        minDistance = distance;
        closestUser = user;
      }
    });

    if (closestUser) {
      const userTransform = closestUser.getTransform();

      const distance = movementUtils.Distance(this.currentTransform, userTransform);

      if (distance >= 0 && distance <= 3) {
        const velocity = movementUtils.DirectionAndVelocity(
          this.currentTransform,
          userTransform,
          CONSTANTS.ENTITY.DEFAULT_SPEED,
        );

        // 1. 몬스터 공격 할때 한번만 공격하게 
        // 2. 대기 행동 만들어야할듯. 
        // 3. 공격하면 공격 애니메이션 패킷 한번 보내고  대기상태.
        // 4. 대기상태는 일정 시간후 다시행동 
        // 5. 모든 행동을 거치는 대기가 필요할듯. 
        // 6. 패스를 따라 가는도중에 근처에 유저가 있으면 공격하게 수정.

        // 몬스터의 공격 범위 설정 (2D 사각형)
        const attackRange = 4;
        const halfRange = attackRange / 2;

        const minX = this.currentTransform.posX - halfRange;
        const maxX = this.currentTransform.posX + halfRange;
        const minZ = this.currentTransform.posZ - halfRange;
        const maxZ = this.currentTransform.posZ + halfRange;

        // 유저가 공격 범위 내에 있는지 확인
        if (
          userTransform.posX >= minX &&
          userTransform.posX <= maxX &&
          userTransform.posZ >= minZ &&
          userTransform.posZ <= maxZ
        ) {
          this.isAttack = true;
          console.log('공격 성공!');
          MONSTER_SEND_MESSAGE.ATTCK("town");
          super.setBehavior(CONSTANTS.AI_BEHAVIOR.RETURN);
          
        } else {
          const test = {
            minX: minX,
            maxX: maxX,
            minZ: minZ,
            maxZ: maxZ,
          };

        }
      }
    }
  }

  monsterAiBehaviorDAMAGED(users) {
    const currentTransform = super.getCurrentTransform();
    

    let closestUser = null; // 가장 가까운 유저.
    let minDistance = Infinity; // 가장 작은 거리로 초기화

    users.forEach((user) => {
      const userTransform = user.getTransform(); // 유저의 트랜스폼 정보

      const distance = movementUtils.Distance(currentTransform, userTransform); // 거리 계산
      if (distance < minDistance) {
        minDistance = distance;
        closestUser = user;
      }
    });

    if (closestUser) {
      const userTransform = closestUser.getTransform();

      const distance = movementUtils.Distance(this.currentTransform, userTransform);

      if (distance >= 2 && distance <= 3) {
        const velocity = movementUtils.DirectionAndVelocity(
          userTransform,
          this.currentTransform,
          CONSTANTS.ENTITY.DEFAULT_SPEED,
        );

        // 유저 -> 몬스터 방향으로 이동  5 좌표 만큼.
        const offset = 2;
        const targetPos = {
          posX: this.currentTransform.posX + velocity.x * offset, // 현재 위치에서 반대 방향으로 이동
          posY: this.currentTransform.posY + velocity.y * offset,
          posZ: this.currentTransform.posZ + velocity.z * offset,
          rot: movementUtils.Rotation(currentTransform, userTransform),
        };

        // 스타트 엔드 포스.

        // 패스 갱신.
        // 길찾기 도착지점 갱신.
        super.setPathfindingDestination(targetPos);

        // 시작
        const startPos = [
          this.currentTransform.posX,
          this.currentTransform.posY,
          this.currentTransform.posZ,
        ];

        // 도착
        const endPos = [
          this.pathfindingDestination.posX,
          this.pathfindingDestination.posY,
          this.pathfindingDestination.posZ,
        ];

        // 패스 갱신.
        A_STER_MANAGER.DELETE_OBSTACLE(this.movementId, this.id);
        const paths = A_STER_MANAGER.FIND_PATH(this.movementId, startPos, endPos);

        if (paths.length === 0) {
          return;
        }

        for (const path of paths) {
          this.aSterPath.enqueue(path);
        }

        if (this.aSterPath.size() !== 0) {
          this.aSterPath.delete();
        }

        for (const path of paths) {
          this.aSterPath.enqueue(path);
        }

        let path = this.aSterPath.dequeue();
        if (path !== null) {
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

        // 행동 변경.
        //super.setBehavior(CONSTANTS.AI_BEHAVIOR.CHASE);
      }
    }
  }
}
