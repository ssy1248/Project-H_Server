import { updateUser, findUser } from '../../movementSync/movementSync.manager.js';
import { getUserById } from '../../session/user.session.js';

const movementSyncHandler = (socket, packetData) => {
  // 0. 페킷데이터 구조분해 할당.
  const { playerId, transform, timestamp, isMoving, velocity, speed } = packetData;
  //updateEntitySync("town", playerId, transform, Number(timestamp), isMoving, velocity, speed);
  const user = getUserById(playerId);
  // playerId를 가지고 movementId 세팅
  let movementId = '';
  if (findUser('town', playerId)) {
    movementId = 'town';
  } else if (findUser(user.inDungeonId, playerId)) {
    movementId = user.inDungeonId;
  }

  updateUser(movementId, playerId, transform, Number(timestamp));
};

export default movementSyncHandler;
