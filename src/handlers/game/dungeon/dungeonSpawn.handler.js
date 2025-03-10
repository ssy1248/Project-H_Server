import { PACKET_TYPE } from '../../../constants/header.js';
import { addUser, deleteUser, deleteMonsters, addMonster, deleteMovementSync, createMovementSync } from '../../../movementSync/movementSync.manager.js';
import { getDungeonSession } from '../../../session/dungeon.session.js';
import { getUserBySocket } from '../../../session/user.session.js';
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
    const playertransform = dungeondata.getPlayerPosition(user.userInfo.nickname);
    const userInfo = user.getUserInfo();

    user.setTransformInfo({
      posX: playertransform.x,
      posY: playertransform.y,
      posZ: playertransform.z,
      rot: playertransform.rot,
    });

    deleteUser('town', userInfo.userId);
    addUser('dungeon1', socket, userInfo.userId, user.getTransformInfo());

    // 나중에 싱크 추가되면 변경
    // for (let player of partyPlayers) {
    //   userData.push(getUserByNickname(player.playerName));
    // }
    const dungeonInfo = {
      dungeonId: dungeondata.id,
      partyInfo: dungeondata.partyInfo,
      dungeonState: dungeondata.isState,
      monsterId: [],
    };
    const transformInfo = [];

    dungeondata.partyInfo.Players.forEach((playerStatus) => {
      let data = dungeondata.playersTransform[playerStatus.playerName];
      const transform = {
        posX: data.x,
        posY: data.y,
        posZ: data.z,
        rot: data.rot,
      };
      transformInfo.push(transform);
    });

    dungeondata.startPeriodicPositionUpdates(100);

    const packet = createResponse('dungeon', 'S_DungeonSpawn', PACKET_TYPE.S_DUNGEONSPAWN, {
      userId: user.userInfo.userId,
      dungeonInfo,
      playerTransforms: transformInfo,
    });
    socket.write(packet);

    addMonster('dungeon1');
    // 클라이언트에선 던전 스폰까진 들어옴 그 이후 패킷이 안옴
    /**
     * Add Monster :  dungeon1
       생성 좌표 :  { posX: 2, posY: 1, posZ: 25, rot: 107 }
       길 못찾고 서버 종료
     */
    //dungeondata.checkAuctionTest();
  } catch (err) {
    console.log(err);
  }
};
export default dungeonSpawnHandler;
