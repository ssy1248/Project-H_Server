import { PACKET_TYPE } from '../../../constants/header';
import { getDungeonSession } from '../../../session/dungeon.session.js';
import { searchPartyInPlayerSession } from '../../../session/party.session.js';
import { getUserByNickname, getUserBySocket } from '../../../session/user.session.js';
import { createResponse } from '../../../utils/response/createResponse.js';

const dungeonSpawnHandler = async (socket, payload) => {
  const user = getUserBySocket(socket);
  const dungeondata = getDungeonSession(user.inDungeonId); // 파티안에 플레이어들 찾아오기!

  // 나중에 싱크 추가되면 변경
  // for (let player of partyPlayers) {
  //   userData.push(getUserByNickname(player.playerName));
  // }

  const dungeonInfo = {
    dungeonId: '',
    partyInfo: '',
    dungeonState: '',
    monsterId: [],
  };
  const packet = createResponse('dungeon', 'S_DungeonSpawn', PACKET_TYPE);
};
export default dungeonSpawnHandler;
