import { PACKET_TYPE } from '../../../constants/header';
import { getDungeonSession } from '../../../session/dungeon.session.js';
import { searchPartyInPlayerSession } from '../../../session/party.session.js';
import { getUserByNickname, getUserBySocket } from '../../../session/user.session.js';
import { createResponse } from '../../../utils/response/createResponse.js';

const dungeonSpawnHandler = async (socket, payload) => {
  try {
    const user = getUserBySocket(socket);
    if (!user) {
      throw new Error('유저가 없습니다!');
    }
    const dungeondata = getDungeonSession(user.inDungeonId); // 파티안에 플레이어들 찾아오기!
    if (!dungeondata) {
      throw new Error('해당 던전이 없습니다!');
    }
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
    const transformInfo = [];

    for (let data of dungeondata.playersTransform) {
      const transform = {
        posX: data.x,
        posY: data.y,
        posZ: data.z,
        rot: data.rot,
      };
      transformInfo.push(transform);
    }

    const packet = createResponse('dungeon', 'S_DungeonSpawn', PACKET_TYPE.S_DUNGEONSPAWN, {
      userId: user.userInfo.userId,
      dungeonInfo,
      transformInfo,
    });
    socket.write(packet);
  } catch (err) {
    console.log(err);
  }
};
export default dungeonSpawnHandler;
