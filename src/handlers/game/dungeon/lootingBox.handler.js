import RewardAuction from '../../../classes/models/rewardAuction.class.js';
import { PACKET_TYPE } from '../../../constants/header.js';
import { updateAddExp } from '../../../db/user/user.db.js';
import { getDungeonSession } from '../../../session/dungeon.session.js';
import { getUserById, getUserByNickname, getUserBySocket } from '../../../session/user.session.js';
import { createResponse } from '../../../utils/response/createResponse.js';

const lootingBoxHandler = async (socket, _) => {
  try {
    const user = getUserBySocket(socket);
    const dungeon = getDungeonSession(user.inDungeonId);
    if (!user || !user.inDungeonId) {
      throw new Error('user 또는 inDungeonId가 없습니다!');
    }
    const item = dungeon.randomAuctionItem();
    const partyInfo = dungeon.partyInfo;
    const rarity = dungeon.rarity;

    if (dungeon.isGetReward) {
      return;
    }
    dungeon.isGetReward = true;

    // 트랜잭션 추가 예정입니다.
    for (let player of partyInfo.Players) {
      const playerData = getUserByNickname(player.playerName);

      await updateAddExp(playerData.playerInfo.charId, dungeon.getExp);
      playerData.playerInfo.exp += dungeon.getExp;

      const packet = createResponse('dungeon', 'S_GetExp', PACKET_TYPE.S_GETEXP, {
        exp: dungeon.getExp,
      });

      playerData.userInfo.socket.write(packet);
    }
    setTimeout(() => {
      new RewardAuction(item, partyInfo, rarity);
    }, 10000);
  } catch (err) {
    console.log(err);
  }
};

export default lootingBoxHandler;
