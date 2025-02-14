import { updateUserSync } from '../../classes/managers/movementSync.manager.js';

const movementSyncHandler = (socket, packetData) => {
  // 0. 페킷데이터 구조분해 할당.
  const { playerId, transform, timestamp, isMoving, velocity, speed, rotationSpeed } = packetData;
  console.log(transform);
  updateUserSync("town", playerId, transform, Number(timestamp), isMoving, velocity, speed,  rotationSpeed);

};

export default movementSyncHandler;

