import MovementSync from '../models/movementSync.class.js';
import { PACKET_TYPE } from '../../constants/header.js';
import { createResponse } from '../../utils/response/createResponse.js';

const movementSyncs = {};

// [movementSync 생성].
export const createMovementSync = (movementSyncId) => {
  if (findMovementSync(movementSyncId)) {
    console.log(`movementSync 이미 존재: ${movementSyncId}`);
    return false;
  }

  movementSyncs[movementSyncId] = new MovementSync();
  return true;
};

// [movementSync 제거].
export const deleteMovementSync = (movementSyncId) => {
  if (!findMovementSync(movementSyncId)) {
    console.log(`movementSync 가 존재 하지 않습니다 (id : ${movementSyncId})`);
    return false;
  }

  // 진행중이던 setInterval 종료
  if (movementSyncs[movementSyncId]) {
    movementSyncs[movementSyncId].endProcessMovement();
  }

  // movementSync 삭제.
  delete movementSyncs[movementSyncId];
};

// [movementSync 찾기].
export const findMovementSync = (movementSyncId) => {
  return movementSyncs[movementSyncId] || null;
};

// [유저 동기화 추가].
export const addUserSync = async (movementSyncId, userId, socket, transform) => {
  if (!findMovementSync(movementSyncId)) {
    console.log(`movementSync 가 존재 하지 않습니다 (id : ${movementSyncId})`);
    return false;
  }

  // 유저 생성.
  if (movementSyncs[movementSyncId]) {
    if (findUserSync(movementSyncId, userId)) {
      console.log(`movementSyncUser 이미 존재: ${userId}`);
      return false;
    }

    

    if (socket.destroyed || !socket.writable) {
      console.log(`연결된 소켓이아님 : ${socket.id}`);
      return false;
    }

    
    if (!isValidTransform(transform)) {
      console.log(`transform 이 정상이 아님 : ${transform}`);
      return false;
    }

    // 추가
    movementSyncs[movementSyncId].addUserSync(userId, socket, transform);
  
  
  }

  return true;
};

// [유저 동기화 업데이트].
export const updateUserSync = (
  movementSyncId,
  userId,
  transform,
  timestamp,
  isMoving,
  velocity,
  speed
) => {
  if (!findMovementSync(movementSyncId)) {
    console.log(`movementSync 가 존재 하지 않습니다 (id : ${movementSyncId})`);
    return false;
  }

  if (movementSyncs[movementSyncId] && findUserSync(movementSyncId, userId)) {
    if (!isValidTransform(transform)) {
      console.log(`transform 이 정상이 아님 : ${transform}`);
      return false;
    }

    if (typeof timestamp !== 'number') {
      console.log(`timestamp 가 정상이 아님 : ${timestamp}`);
      return false;
    }

    // 업데이트
    movementSyncs[movementSyncId].updateUserSync(
      userId,
      transform,
      timestamp,
      isMoving,
      velocity,
      speed
    );
  }

  return true;
};

// [유저 동기화 삭제].
export const deleteUserSync = (movementSyncId, userId) => {
  if (!findMovementSync(movementSyncId)) {
    console.log(`movementSync 가 존재 하지 않습니다 (id : ${movementSyncId})`);
    return false;
  }

  // 전송하는거 하고, 프로토콜 파일 유니티 적용하고, 유니티 수정.

  if (movementSyncs[movementSyncId] && findUserSync(movementSyncId, userId)) {
    // 이곳에서 삭제.
    const sDespawn = {
      playerId: userId,
    };

    // 만들어진 패킷을 직렬화.
    const initialResponse = createResponse('user', 'S_Despawn', PACKET_TYPE.S_DESPAWN, sDespawn);

    // 브로드 캐스트.
    movementSyncs[movementSyncId].broadcastChangedUsers(initialResponse);

    // 삭제
    movementSyncs[movementSyncId].deleteUserSync(userId);
  }
};

// [유저 찾기].
export const findUserSync = (movementSyncId, userId) => {
  return movementSyncs[movementSyncId].findUserSync(userId);
};

// [트랜스폼 검증].
const isValidTransform = (transform) => {
  return (
    typeof transform.posX === 'number' &&
    typeof transform.posY === 'number' &&
    typeof transform.posZ === 'number' &&
    typeof transform.rot === 'number'
  );
};
