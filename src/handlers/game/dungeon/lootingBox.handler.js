import { PACKET_TYPE } from '../../../constants/header.js';
import { updateAddExp } from '../../../db/user/user.db.js';
import { getDungeonSession } from '../../../session/dungeon.session.js';
import { getUserById, getUserBySocket } from '../../../session/user.session.js';
import { createResponse } from '../../../utils/response/createResponse.js';

const lootingBoxHandler = async (socket, _) => {
  const user = getUserBySocket(socket);
  const dungeon = getDungeonSession(user.inDungeonId);

  // 트랜잭션 추가 예정입니다.
  for (let player of dungeon.partyInfo.Players) {
    const playerData = getUserById(player.id);

    updateAddExp(playerData.playerInfo.charId, dungeon.getExp);
    playerData.playerInfo.exp += dungeon.getExp;

    const packet = createResponse('dungeon', 'S_GetExp', PACKET_TYPE.S_GETEXP, {
      exp: dungeon.getExp,
    });
    player.userInfo.socket.write(packet);
  }
};

export default lootingBoxHandler;
