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
  setIsDie(isDie){
    this.isDie = isDie;
  }

  getIsDamage() {
    return this.isDamage;
  }
  setIsDamage(isDamage){
    this.isDie = isDamage;
  }

  getHp() {
    return this.hp;
  }

  setHp(hp){
    this.hp = hp
  }

  updateTransform(userTransform) {
    if(this.isDie) return;

    this.updateMonsterSync(userTransform);
    super.updateTransform();
  }

  // 1. updateMonsterSync
  updateMonsterSync(user) {
    const behavior = super.getBehavior();

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
      if (behavior === CONSTANTS.AI_BEHAVIOR.CHASE) {
        //this.monsterAiBehaviorCHASE();
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
    if (distance01 <= 2) {
      super.setBehavior(CONSTANTS.AI_BEHAVIOR.ATTACK);
      A_STER_MANAGER.UPDATE_OBSTACLE(this.movementId, this);
      this.attackCount = 60;
    }
    

    // 거리가 1보다 클경우
    if (distance01 >= 2) {
      
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
        const spawnDistance = movementUtils.Distance(this.pathfindingDestination, this.spawnTransform);
        
        if(spawnDistance <= 0.5){
          super.setBehavior(CONSTANTS.AI_BEHAVIOR.IDLE);
        }

        // 3. 복귀 중이 아니고 목표에 도달했으면 
        if(spawnDistance > 0.5){
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
    if(this.attackCount === 0) {
      const distance = movementUtils.Distance(this.currentTransform, userTransform);
      if(distance <= 1){
        super.setBehavior(CONSTANTS.AI_BEHAVIOR.ATTACK);
        this.isAttack = false;
        this.attackCount = 60;
      } else {
        super.setBehavior(CONSTANTS.AI_BEHAVIOR.RETURN);
        //super.setBehavior(CONSTANTS.AI_BEHAVIOR.ATTACK);
        this.isAttack = false;
        //this.attackCount = 60;
      }
      
    }

    if (this.attackCount === 60) {
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
        if (this.isAttack) {
          MONSTER_SEND_MESSAGE.ATTCK('town');
          // 1. 타겟 유저 찾기 => clear 매개변수 수정으로 해결
          const targetUser = getUserBySocket(user.getSocket());
          // 1-2. 공격 몬스터 찾기 => 몬스터 클래스 통합으로 해결
          const damage = Math.max(0, this.atk - targetUser.getDef());
          
          // 2. 타겟 유저에게 데미지 주기

          // 3. 타겟 유저 사망 처리
          // 4. 파티 전멸 처리
          // 5. 아이템 소실
          //super.setBehavior(CONSTANTS.AI_BEHAVIOR.RETURN);
          super.setBehavior(CONSTANTS.AI_BEHAVIOR.RETURN);
          this.isAttack = false;
        }
      } else {
        super.setBehavior(CONSTANTS.AI_BEHAVIOR.IDLE);
        this.isAttack = false;

        console.log(`몬스터 공격 범위 X : minX ${minX} / maxX ${maxX}`);
        console.log(`몬스터 공격 범위 Y : minZ ${minZ} / maxZ ${maxZ}`);
        console.log(`플레이어 위치    X : X    ${userTransform.posX} / Z    ${userTransform.posZ}`);
      }
    }

    this.attackCount--;
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
