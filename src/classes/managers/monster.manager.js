import { Monster, MONSTER_AI_BEHAVIOR } from '../models/monster.class.js';
import {
  addEntitySync,
  findMovementSync,
  findEntitySync,
  updateEntitySync,
} from './movementSync.manager.js';
import Queue from '../../utils/queue.js';
import { v4 as uuidv4 } from 'uuid';

const monsters = {}; // 몬스터를 담을 배열.
const monsterUpdateQueue = new Queue(50); // 업데이트할 몬스터를 담을 큐
const SPEED = 4; // 몬스터 스피드.
const RADIUS = 3; // 유저 주변 원.
const RETREAT_DISTANCE = 3; // 몬스터가 뒤로 이동할 거리

// [ 몬스터 생성 ]
export const addMonster = (movementSyncId, monsterId, index, model, name, hp) => {
  // 몬스터 매니저에 몬스터 추가.
  monsters[monsterId] = new Monster(movementSyncId, monsterId, index, model, name, hp);
  // 현재 몬스터의 Transform 정보를 가져온다.
  const transform = monsters[monsterId].getTransformInfo();
  // 동기화 엔티티 추가
  addEntitySync(movementSyncId, monsterId, 'monster', null, transform);
};

// [ 몬스터 찾기 ]
export const findMonster = (id) => {
  return monsters[id];
};

// [ 몬스터 업데이트 ]
export const updateMonster = (id) => {
  const monster = monsters[id];

  // 몬스터 매니저에 몬스터가 있어야 로직이 실행됨.
  if (monster) {
    // 몬스터의 행동을 가져온다. (디폴트는 "IDLE")
    const behavior = monster.getBehavior();

    // IDLE 행동, 그밖의 행동인지 걸러낸다.
    if (behavior === MONSTER_AI_BEHAVIOR.IDLE) {
      //console.log("dksdhk?");
      // IDLE 행동 일 경우 실행하는 함수.
      monsterAiBehaviorIDLE(monster);
    } else {
      // 몬스터의 현재 동기화된 좌표를 모스터 매니저에 업데이트한다.
      // const monsterId = monster.getMonsterInfo();
      // const monsterUpdateTransform = findEntitySync('town', monsterId.id);
      // monster.setTransformInfo(monsterUpdateTransform.currentTransform);

      //console.log(behavior);
      if (behavior !== MONSTER_AI_BEHAVIOR.RETURN) {
        // 몬스터의 메인 행동은 여기서 진행 된다.
        // 타겟으로 지정된 유저를 불러온다.
        const targetInfo = monster.targetInfo;
        const user = findEntitySync('town', targetInfo.userId);

        // 타겟이 존재하는지 검증.
        if (!user) {
          return console.log('타겟 유저가 없습니다. ID :', targetInfo.userId);
        }

        //

        // 몬스터 추격 시작.
        monsterAiBehaviorCHASE_NORMAL(monster, user);
      }

      // 한번 정해지면 도착할때 까지 경로 탐색 x
      switch (behavior) {
        case MONSTER_AI_BEHAVIOR.CHASE_NORMAL: {
          const distance = validateTransform(monster.transformInfo, monster.targetInfo.transform); // 거리 계산
          // // console.log(distance);
          // if (distance >= 1) {
          //   monster.setBehavior(MONSTER_AI_BEHAVIOR.IDLE);
          // }
          // break;
        }
        case MONSTER_AI_BEHAVIOR.CHASE_FLANK:
          //console.log(MONSTER_AI_BEHAVIOR.CHASE_FLANK);
          break;
        case MONSTER_AI_BEHAVIOR.CHASE_PAUSE:
          //console.log(MONSTER_AI_BEHAVIOR.CHASE_PAUSE);
          break;
        case MONSTER_AI_BEHAVIOR.CHASE_RETREAT:
          //console.log(MONSTER_AI_BEHAVIOR.CHASE_RETREAT);
          break;
        case MONSTER_AI_BEHAVIOR.RETURN: {
          // 만약에 도착했다면 IDLE로 바꾸자.
          const distance = validateTransform(monster.transformInfo, monster.spawnTransform); // 거리 계산
          console.log(distance);
          if (distance <= 1) {
            monster.setBehavior(MONSTER_AI_BEHAVIOR.IDLE);
          }

          // if (hasPassedTarget(monster.transformInfo, monster.targetInfo.transform)) {
          //   monster.setBehavior(MONSTER_AI_BEHAVIOR.IDLE);
          // }
          break;
        }

        default:
          break;
      }
    }
  }

  // 몬스터 업데이트를 위한 몬스터 정보 변수에 담는다.
  const monsterInfo = monster.getMonsterInfo();
  const monsterTargetInfo = monster.targetInfo;

  // 타겟이 변경되면 업데이트 큐에 담자.
  if (monster.getIsTargetChanged()) {
    monsterUpdateQueue.enqueue(monster);
    monster.setIsTargetChanged(false);
    //monsterUpdateQueue.test();
  }

  updateEntitySync(
    'town',
    monsterInfo.id,
    monsterTargetInfo.transform,
    0,
    true,
    monsterTargetInfo.velocity,
    SPEED,
  );

  // console.log(monsterTargetInfo.transform);
  // console.log(monsterTargetInfo.userId);
};

/////////////////////////////////////// 몬스터 삭제 추가해야함.

// [ 업데이트 큐 ]
export const getMonsterUpdateQueue = () => {
  return monsterUpdateQueue.dequeueAll();
};

// [ 몬스터 행동 패턴 ] - IDLE
const monsterAiBehaviorIDLE = (monster) => {
  // 함수에 필요할 데이터를 담을 변수 선언.
  const monsterInfo = monster.getMonsterInfo(); // 몬스터 정보.
  const movementSync = findMovementSync(monsterInfo.movementSyncId); // 현재 동기화 정보.
  const entitys = movementSync.getAllEntitySyncs(); // "현재 동기화"에 있는 모든 엔티티.

  // 모든 엔티티에서 "유저"만 뽑아서 users 변수에 담는다.
  const users = Object.values(entitys).filter((entity) => entity.type === 'user');

  if (users.length < 1) {
    console.log('유저가 없다.');
    return;
  }
  // 유저들의 대한 거리를 계산하고, 가장 가까운 유저를 찾는다.
  const monsterTransform = monster.transformInfo;
  // console.log(monsterTransform);

  let closestUser = null; // 가장 가까운 유저.
  let minDistance = Infinity; // 가장 작은 거리로 초기화

  users.forEach((user) => {
    const userTransform = user.currentTransform; // 유저의 트랜스폼 정보

    const distance = validateTransform(monsterTransform, userTransform); // 거리 계산
    if (distance < minDistance) {
      minDistance = distance;
      closestUser = user;
    }
  });

  if (closestUser === null) {
    console.log('closestUser');
    return;
  }

  // 가장 가까운 유저가 정해진다면 타겟으로 지정한다.
  if (closestUser) {
    // "몬스터 -> 가장가까운 유저" 의 velocity(방향 + 속도)를 지정.
    const velocity = calculateDirectionAndVelocity(
      monsterTransform,
      closestUser.currentTransform,
      SPEED,
    );

    // 방향전환
    const { yaw, pitch } = calculateRotation(monsterTransform, closestUser.currentTransform);
    closestUser.currentTransform.rot = yaw;

    // velocity이 정해졌다면 몬스터 타겟을 변경하고 행동을 변경한다.
    // CHASE_SETTING : 추격을 위한 초기 세팅 단계
    monsterTarget(
      monster,
      MONSTER_AI_BEHAVIOR.CHASE_SETTING,
      closestUser.id,
      closestUser.currentTransform,
      velocity,
    );
  }
};

// [ 몬스터 행동 패턴 ] - CHASE_CHASE_NORMAL
const monsterAiBehaviorCHASE_NORMAL = (monster, user) => {
  // 몬스터, 유저 정보를 가져온다.
  const userId = user.id;
  const monsterTransform = monster.transformInfo; // 몬스터 좌표
  const userTransform = { ...user.currentTransform }; // 유저 좌표.

  // 몬스터 -> 유저의 거리를 구한다.
  const posDiff = validateTransform(monsterTransform, userTransform);

  // 일정 거리에 도달하면 랜덤.
  // 일정 거리를 넘으면 되돌아감.
  // 거리가멀면 그냥 추격.

  // [추격종류 설정]
  // 타겟과 거리가 일정 수준이 되면 추격 종류 변경.
  // 거리가 2 보다 작으면 : 측면 이동, 잠시 대기, 후퇴, 공격 등...
  // 타겟과 거리가 일정 수준으로 멀어지면
  // 거리가 10보다 멀면 : 스폰 지역으로 이동.
  //console.log("테스트",monster.transformInfo);
  //console.log(monster.targetInfo);
  //console.log(hasPassedTarget (monster.transformInfo, monster.targetInfo.transform, monster.targetInfo.velocity ));
  // if (
  //   hasPassedTarget(
  //     monster.transformInfo,
  //     monster.targetInfo.transform,
  //     monster.targetInfo.velocity,
  //   )
  // ) {
  //   if (monster.getBehavior() === MONSTER_AI_BEHAVIOR.CHASE_NORMAL) {
  //     //monster.setBehavior(MONSTER_AI_BEHAVIOR.IDLE);
  //     monsterAiBehaviorRETURN(monster);
  //   }
  // }

  const distance = validateTransform(monster.transformInfo, monster.targetInfo.transform); // 거리 계산
  // console.log(distance);
  console.log(distance);
  if (distance <= 1) {
    monsterAiBehaviorRETURN(monster);
  }

  // 추격 세팅할때 한번만 들어옴.
  if (monster.getBehavior() === MONSTER_AI_BEHAVIOR.CHASE_SETTING) {
    //console.log(posDiff);

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

    // console.log("몬스터 : ", monsterTransform);
    // console.log("유저 : ", userTransform);
    // [ velocity ] - (방향 + 속도) 백터 구하기
    const velocity = calculateDirectionAndVelocity(monsterTransform, userTransform, SPEED);
    const { yaw, pitch } = calculateRotation(monsterTransform, userTransform);
    monster.targetInfo.transform.rot = yaw;
    // console.log("방향+속도 : ", velocity);

    // 타겟 재설정.
    monsterTarget(monster, MONSTER_AI_BEHAVIOR.CHASE_NORMAL, userId, userTransform, velocity);

    // monsterTarget(monster, MONSTER_AI_BEHAVIOR.CHASE_SETTING, userId, userTransform, velocity);
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
  //monsterTarget(monster, MONSTER_AI_BEHAVIOR.CHASE_FLANK, user.userId, targetTransform, velocity);
  monsterTarget(monster, MONSTER_AI_BEHAVIOR.CHASE_SETTING, user.userId, targetTransform, velocity);
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

// [회전각도]
const calculateRotation = (monsterTransform, userTransform) => {
  // 1. 위치 차이 계산 (방향 벡터)
  const deltaX = userTransform.posX - monsterTransform.posX;
  const deltaY = userTransform.posY - monsterTransform.posY;
  const deltaZ = userTransform.posZ - monsterTransform.posZ;

  // 2. Yaw(좌우 회전, Y축 기준 회전) - atan2 사용 + 180도 보정
  const yaw = Math.atan2(deltaX, deltaZ) * (180 / Math.PI); // 180도 보정 추가

  // 3. Pitch(상하 회전, X축 기준 회전)
  const distanceXZ = Math.sqrt(deltaX * deltaX + deltaZ * deltaZ); // 수평 거리 (XZ 평면)
  const pitch = Math.atan2(deltaY, distanceXZ) * (180 / Math.PI); // 도(degree) 변환

  return { yaw, pitch };
};

// [ 몬스터 타겟 ]
const monsterTarget = (monster, behavior, id, transform, velocity) => {
  monster.setBehavior(behavior);
  monster.setTargetInfo(id, transform, velocity);
  // 타겟 변경알림
  monster.setIsTargetChanged(true);
};

const hasPassedTarget = (currentTransform, targetTransform) => {
  // 목표 지점과 현재 위치 벡터 계산
  const deltaX = targetTransform.posX - currentTransform.posX;
  const deltaY = targetTransform.posY - currentTransform.posY;

  // 목표와 현재 위치 사이의 거리 계산 (벡터 크기)
  const distanceToTarget = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

  // 목표 지점에 가까워졌을 때 지나친 것으로 판단 (0.1 미만으로 가까워졌다면)
  if (distanceToTarget < 0.1) {
    return true;
  }

  // 이동 방향을 추정하기 위해 목표 방향 벡터와 현재 위치의 차이 계산
  const directionToTargetX = deltaX;
  const directionToTargetY = deltaY;

  // 벡터 간 내적 계산 (이동 방향과 목표 방향의 유사성)
  const dotProduct = directionToTargetX * deltaX + directionToTargetY * deltaY;

  console.log(`Distance to target: ${distanceToTarget}, Dot Product: ${dotProduct}`);

  // 내적이 음수이면 지나쳤다고 판단
  if (dotProduct <= 0) {
    return true;
  }

  return false;
};
export const handleMonsterArrivalPacket = (id, transform) => {
  //console.log("아이디 : ",id);
  //console.log("트랜스폼 : ",transform);
  const monster = monsters[id];

  monster.transformInfo = { ...transform };
};
