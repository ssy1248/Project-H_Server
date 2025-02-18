import { Monster, MONSTER_AI_BEHAVIOR } from '../models/monster.class.js';
import { addEntitySync, findMovementSync, findEntitySync } from './movementSync.manager.js';
import { v4 as uuidv4 } from 'uuid';

const monsters = {};
const SPEED = 4;

// 몬스터 생성.
export const addMonster = (movementSyncId, index, model, name, hp) => {
  // 몬스터생성.
  const monsterId = uuidv4();
  monsters[monsterId] = new Monster(movementSyncId, monsterId, index, model, name, hp);
  const transform = monsters[monsterId].getTransformInfo();

  // 동기화 엔티티 추가
  addEntitySync(movementSyncId, monsterId, 'monster', null, transform);
};

// 몬스터 업데이트
export const updateMonster = () => {
  const monsterSize = Object.keys(monsters).length;

  // 사이즈가 존재 할경우
  if (monsterSize > 0) {
    for (let monster of monsters) {
      const behavior = monster.getBehavior;

      // 현재 몬스터가 대기 상태일 경우.
      if (behavior === MONSTER_AI_BEHAVIOR.IDLE) {
        monsterAiBehaviorIDLE(monster);
      } else if (behavior === MONSTER_AI_BEHAVIOR.CHASE) {
        monsterAiBehaviorCHASE(monster);
      }
    }
  }
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
      MONSTER_AI_BEHAVIOR.CHASE,
      closestUser.userId,
      closestUser.currentTransform,
      velocity,
    );
  }
};

// [ 몬스터 행동 패턴 ] - CHASE
const monsterAiBehaviorCHASE = (monster) => {
  // 1. 거리를 구하자. 
  // 2. 거리가 너무 멀어지면 ( 스폰 지역으로 이동)
  // 3. 거리가 가까우면 (행동패턴 - 좌우로 이동, 뒤로 가거나, 잠시대기, 공격)
  // 4. 그리고 적절한 거리면 다시 추격. 
  
  
  
  const monsterInfo = monster.monsterInfo;
  const user = findEntitySync(monsterInfo.movementSyncId, monsterInfo.id);
  const userId = user.userId;

  // 타겟 좌표를 구하자.
  const userTransform = { ...user.currentTransform };
  const randomNumber = Math.floor(Math.random() * 4);

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
  const monsterTransform = monster.transformInfo;
  const velocity = calculateDirectionAndVelocity(monsterTransform, userTransform, SPEED);

  // 타겟 재설정.
  monsterTarget(monster, MONSTER_AI_BEHAVIOR.CHASE, userId, userTransform, velocity);
};

//
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
