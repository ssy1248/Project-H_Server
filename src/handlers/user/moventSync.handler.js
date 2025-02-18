import { updateEntitySync } from '../../classes/managers/movementSync.manager.js';

const movementSyncHandler = (socket, packetData) => {
  // 0. 페킷데이터 구조분해 할당.
  const { playerId, transform, timestamp, isMoving, velocity, speed} = packetData;
  updateEntitySync("town", playerId, transform, Number(timestamp), isMoving, velocity, speed);

};

export default movementSyncHandler;

