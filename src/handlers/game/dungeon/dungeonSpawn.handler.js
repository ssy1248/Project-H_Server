import { getUserByNickname, getUserBySocket } from '../../../session/user.session';

const dungeonSpawnHandler = async (socket, packetData) => {
  const partyPlayers = []; // 파티안에 플레이어들 찾아오기!
  const user = getUserBySocket(socket);
  const userData = [];

  for (let player of partyPlayers) {
    userData.push(getUserByNickname(player.playerName));
  }
};
export default dungeonSpawnHandler;
