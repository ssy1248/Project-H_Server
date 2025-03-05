import { getDungeonSession } from '../../session/dungeon.session.js';

const despawnUser = async (user) => {
  const packet = createResponse('user', 'S_Despawn', PACKET_TYPE.S_DESPAWN, {
    playerId: user.userInfo.userId,
  });
  if (user.inDungeonId === '') {
    broadcastTownAllUsers(packet);
    return;
  } else {
    const dungeonData = getDungeonSession(user.inDungeonId);
  }
};
export default despawnUser;
