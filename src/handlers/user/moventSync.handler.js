import { updateUser, findUser } from '../../movementSync/movementSync.manager.js';

const movementSyncHandler = (socket, packetData) => {
  // 0. 페킷데이터 구조분해 할당.
  const { playerId, transform, timestamp, isMoving, velocity, speed } = packetData;
  //updateEntitySync("town", playerId, transform, Number(timestamp), isMoving, velocity, speed);

  // playerId를 가지고 movementId 세팅
  let movementId = '';
  if (findUser('town', playerId)) {
    movementId = 'town';
  } else if (findUser('dungeon1', playerId)) {
    movementId = 'dungeon1';
  }

  updateUser(movementId, playerId, transform, Number(timestamp));
};

export default movementSyncHandler;
