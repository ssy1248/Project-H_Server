import { Monster, MONSTER_AI_BEHAVIOR } from '../models/monster.class.js';
import {
  addEntitySync,
  findMovementSync,
  findEntitySync,
  updateEntitySync,
} from './movementSync.manager.js';
import { v4 as uuidv4 } from 'uuid';

const monsters = {}; // 몬스터를 담을 배열.
const SPEED = 4; // 몬스터 스피드.
const RADIUS = 3; // 유저 주변 원.
const RETREAT_DISTANCE = 3; // 몬스터가 뒤로 이동할 거리

// 몬스터 생성.
export const addMonster = (movementSyncId, monsterId, index, model, name, hp) => {
  // 몬스터생성.
  //const monsterId = uuidv4();
  monsters[monsterId] = new Monster(movementSyncId, monsterId, index, model, name, hp);
  const transform = monsters[monsterId].getTransformInfo();

  // 동기화 엔티티 추가
  addEntitySync(movementSyncId, monsterId, 'monster', null, transform);
};

// 몬스터 찾기. 
export const findMonster = (id) => {
  return monsters[id];
}

// 몬스터 업데이트
export const updateMonster = () => {
  const monsterSize = Object.keys(monsters).length;

  // 사이즈가 존재 할경우
  if (monsterSize > 0) {
    for (let monster of monsters) {
      const behavior = monster.getBehavior;

      // 현재 몬스터가 대기 상태일 경우.
      if (behavior === MONSTER_AI_BEHAVIOR.IDLE) {
        // 타겟 정해지기전 단 한번.
        monsterAiBehaviorIDLE(monster);
      } else {
        // 이동 관련.
        // CHASE_NORMAL 아니라면 로직 실행 x
        const targetInfo = monster.targetInfo;
        const user = findEntitySync(monsterInfo.movementSyncId, targetInfo.userId);

        if (!user) {
          return console.log('타겟 유저가 없습니다.');
        }

        monsterAiBehaviorCHASE_NORMAL(monster, user);

        // 한번 정해지면 도착할때 까지 경로 탐색 x
        switch (behavior) {
          case MONSTER_AI_BEHAVIOR.CHASE_NORMAL:
            monsterAiBehaviorCHASE_NORMAL(monster);
            break;
          case MONSTER_AI_BEHAVIOR.CHASE_FLANK:
            console.log(MONSTER_AI_BEHAVIOR.CHASE_FLANK);
            break;
          case MONSTER_AI_BEHAVIOR.CHASE_PAUSE:
            console.log(MONSTER_AI_BEHAVIOR.CHASE_PAUSE);
            break;
          case MONSTER_AI_BEHAVIOR.CHASE_RETREAT:
            console.log(MONSTER_AI_BEHAVIOR.CHASE_RETREAT);
            break;
          case MONSTER_AI_BEHAVIOR.RETURN:
            console.log(MONSTER_AI_BEHAVIOR.RETURN);
            break;

          default:
            break;
        }
      }

      // 업데이트.
      updateEntitySync(
        'town',
        monster.monsterInfo.id,
        monster.targetInfo.transform,
        0,
        true,
        monster.targetInfo.velocity,
        SPEED,
      );
    }
  }
};

/////////////////////////////////////// 몬스터 삭제 추가해야함.

// [ 몬스터 행동 패턴 ] - IDLE
const monsterAiBehaviorIDLE = (monster) => {
  const monsterInfo = monster.getMonsterInfo();
  const movementSync = findMovementSync(monsterInfo.movementSyncId);
  const entitys = movementSync.getAllEntitySyncs();

  // 유저 정보만 뽑기.
  const users = Object.values(entitys).filter((entity) => entity.type === 'user');

  // 각 유저에 대한 거리를 계산하고, 가장 가까운 유저를 찾는다 .
  const monsterTransform = monster.getTransformInfo();

  let closestUser = null;
  let minDistance = Infinity; // 가장 작은 거리로 초기화

  users.forEach((user) => {
    const userTransform = user.currentTransform; // 유저의 트랜스폼 정보

    const distance = validateTransform(monsterTransform, userTransform); // 거리 계산

    if (distance < minDistance) {
      minDistance = distance;
      closestUser = user;
    }
  });

  // 몬스터 행동 상태를 변경한다. (추격)
  if (closestUser) {
    // 방향 설정.
    const velocity = calculateDirectionAndVelocity(
      monsterTransform,
      closestUser.currentTransform,
      SPEED,
    );

    // 타겟 설정.
    monsterTarget(
      monster,
      MONSTER_AI_BEHAVIOR.CHASE_SETTING,
      closestUser.userId,
      closestUser.currentTransform,
      velocity,
    );
  }
};

// [ 몬스터 행동 패턴 ] - CHASE_CHASE_NORMAL
const monsterAiBehaviorCHASE_NORMAL = (monster, user) => {
  const userId = user.userId;
  const monsterTransform = monster.transformInfo; // 몬스터 좌표
  const userTransform = { ...user.currentTransform }; // 유저 좌표.

  // 현재 본인 -> 타겟 거리 측정.
  const posDiff = validateTransform(monsterTransform, userTransform);

  // 일정 거리에 도달하면 랜덤.
  // 일정 거리를 넘으면 되돌아감.
  // 거리가멀면 그냥 추격.

  // [추격종류 설정]
  // 타겟과 거리가 일정 수준이 되면 추격 종류 변경.
  // 거리가 2 보다 작으면 : 측면 이동, 잠시 대기, 후퇴, 공격 등...
  // 타겟과 거리가 일정 수준으로 멀어지면
  // 거리가 10보다 멀면 : 스폰 지역으로 이동.

  if (posDiff <= 2) {
    // 행동 패턴 변경.
    if (monster.getBehavior === MONSTER_AI_BEHAVIOR.CHASE_NORMAL) {
      // 조건에 안맞다면 CHASE_NORMAL 진행.
      const randomNumber = Math.floor(Math.random() * 4);
      if (randomNumber === 0) {
        // 측면 이동
        monsterAiBehaviorCHASE_FLANK(monster, user);
        return;
      } else if (randomNumber === 1) {
        // 잠시 대기
        // monsterAiBehaviorCHASE_PAUSE(monster, user);

        // 공격 및 기타 작업을 위해..
        // 일단 생략.

        return;
      } else if (randomNumber === 2) {
        // 후퇴.
        monsterAiBehaviorCHASE_RETREAT(monster, user);
        return;
      }
    } else {
      return;
    }
  } else if (posDiff >= 10) {
    // 거리가 너무 멀어지면 스폰장소로 이동.
    monsterAiBehaviorRETURN(monster);
    return;
  }

  // 추격 세팅할때 한번만 들어옴.
  if (monster.getBehavior === MONSTER_AI_BEHAVIOR.CHASE_SETTING) {
    // 타겟 좌표를 구하자.
    const randomNumber = Math.floor(Math.random() * 5);

    // 상하좌우 방향 설정
    if (randomNumber === 0) {
      userTransform.posZ += 1; // 위로
    } else if (randomNumber === 1) {
      userTransform.posZ -= 1; // 아래로
    } else if (randomNumber === 2) {
      userTransform.posX += 1; // 오른쪽
    } else if (randomNumber === 3) {
      userTransform.posX -= 1; // 왼쪽
    }

    // [ velocity ] - (방향 + 속도) 백터 구하기
    const velocity = calculateDirectionAndVelocity(monsterTransform, userTransform, SPEED);

    // 타겟 재설정.
    monsterTarget(monster, MONSTER_AI_BEHAVIOR.CHASE_NORMAL, userId, userTransform, velocity);
  }
};

// [ 몬스터 행동 패턴 ] - CHASE_FLANK
const monsterAiBehaviorCHASE_FLANK = (monster, user) => {
  const monsterTransform = { ...monster.transformInfo }; // 몬스터 좌표
  const userTransform = { ...user.currentTransform }; // 유저 좌표.

  // 0 ~ 360도(라디안) 중 랜덤
  const randomAngle = Math.random() * Math.PI * 2;

  // 새로운 목표 좌표 (유저 주변 원형 위치)
  const targetX = userTransform.posX + RADIUS * Math.cos(randomAngle);
  const targetZ = userTransform.posZ + RADIUS * Math.sin(randomAngle);

  const targetTransform = {
    posX: targetX,
    posY: userTransform.posY,
    posZ: targetZ,
    rot: userTransform.rot,
  };

  // 방향 + 속도 벡터 계산
  const velocity = calculateDirectionAndVelocity(monsterTransform, targetTransform, SPEED);

  // 타겟 설정
  monsterTarget(monster, MONSTER_AI_BEHAVIOR.CHASE_FLANK, user.userId, targetTransform, velocity);
};

// [ 몬스터 행동 패턴 ] - CHASE_PAUSE
const monsterAiBehaviorCHASE_PAUSE = (monster, user) => {
  const monsterTransform = { ...monster.transformInfo }; // 몬스터 좌표
  const userTransform = { ...user.currentTransform }; // 유저 좌표.

  // 이건보류 - 공격이랑 병행 할듯.?
  // 1. 일정시간 멈췄다가 다시 추격.
  // 2. 가까워지면 공격..?
  // 3. 공격시도? (랜덤으로 대기 or 공격) 하는것도 나쁘진 않을듯.?
  // 4. 대기후 -> 이동 or 추격(노멀, 측면이동, 뒤로이동) 도망도 나쁘진않을듯.
};

// [ 몬스터 행동 패턴 ] - CHASE_RETREAT
const monsterAiBehaviorCHASE_RETREAT = (monster, user) => {
  const monsterTransform = { ...monster.transformInfo }; // 몬스터 좌표
  const userTransform = { ...user.currentTransform }; // 유저 좌표.

  // 유저 → 몬스터 방향 벡터 구하기
  let directionX = monsterTransform.posX - userTransform.posX;
  let directionZ = monsterTransform.posZ - userTransform.posZ;

  // 정규화 (방향 유지하면서 크기를 1로 맞춤)
  const length = Math.sqrt(directionX ** 2 + directionZ ** 2);
  if (length !== 0) {
    directionX /= length;
    directionZ /= length;
  }

  // 후퇴할 위치 계산 (몬스터의 현재 위치 + 반대 방향 * 거리)
  const targetX = monsterTransform.posX + directionX * RETREAT_DISTANCE;
  const targetZ = monsterTransform.posZ + directionZ * RETREAT_DISTANCE;

  const targetTransform = {
    posX: targetX,
    posY: monsterTransform.posY,
    posZ: targetZ,
    rot: monsterTransform.rot, // 회전값 유지
  };

  // 방향 + 속도 벡터 계산
  const velocity = calculateDirectionAndVelocity(monsterTransform, targetTransform, SPEED);

  // 타겟 설정
  monsterTarget(monster, MONSTER_AI_BEHAVIOR.CHASE_RETREAT, user.userId, targetTransform, velocity);
};

// [ 몬스터 행동 패턴 ] - RETURN
const monsterAiBehaviorRETURN = (monster) => {
  const monsterTransform = { ...monster.transformInfo }; // 몬스터 좌표
  const spawnTransform = { ...monster.spawnTransform }; // 유저 좌표.

  // 방향 + 속도 벡터 계산
  const velocity = calculateDirectionAndVelocity(monsterTransform, spawnTransform, SPEED);

  // 타겟 설정
  monsterTarget(monster, MONSTER_AI_BEHAVIOR.RETURN, '', spawnTransform, velocity);
};

// [트랜스폼 검증]
const validateTransform = (previousTransform, currentTransform) => {
  // 1. 위치 차이 계산:  이전 위치와 현재 위치의 차이를 구합니다.
  const positionDifference = Math.sqrt(
    Math.pow(previousTransform.posX - currentTransform.posX, 2) +
      Math.pow(previousTransform.posY - currentTransform.posY, 2) +
      Math.pow(previousTransform.posZ - currentTransform.posZ, 2),
  );

  return positionDifference;
};

// [방향 + 속도 백터]
const calculateDirectionAndVelocity = (monsterTransform, userTransform, speed) => {
  // 1. 위치 차이 계산 (방향 벡터)
  const deltaX = userTransform.posX - monsterTransform.posX; // 몬스터에서 유저 방향으로 차이 계산
  const deltaY = userTransform.posY - monsterTransform.posY;
  const deltaZ = userTransform.posZ - monsterTransform.posZ;

  // 2. 방향 벡터 구하기 (단위 벡터로 만들기)
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY + deltaZ * deltaZ); // 거리
  const directionX = deltaX / distance; // X축 방향
  const directionY = deltaY / distance; // Y축 방향
  const directionZ = deltaZ / distance; // Z축 방향

  // 3. 속도 벡터 구하기
  const velocityX = directionX * speed; // X축 속도
  const velocityY = directionY * speed; // Y축 속도
  const velocityZ = directionZ * speed; // Z축 속도

  // 최종적으로 계산된 속도 벡터
  const velocity = { x: velocityX, y: velocityY, z: velocityZ };

  return velocity;
};

// [ 몬스터 타겟 ]
const monsterTarget = (monster, behavior, id, transform, velocity) => {
  monster.getBehavior = behavior;
  monster.SetTargetInfo(id, transform, velocity);
};
