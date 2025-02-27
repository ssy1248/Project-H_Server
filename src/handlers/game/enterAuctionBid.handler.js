import { getRewardAutionSession } from '../../session/rewardAuction.session.js';
import { getUserBySocket } from '../../session/user.session.js';

const enterAuctionBid = (socket, payload) => {
  try {
    const user = getUserBySocket(socket);
    const { gold, id } = payload;
    const rewardAuction = getRewardAutionSession(id);
    if (!rewardAuction.nameCheck(user.userInfo.nickname)) {
      throw new Error('해당 경매에 참여한 유저가 아닙니다!');
    }
    if (user.playerInfo.gold < gold) {
      throw new Error('골드가 부족합니다!');
    }
    rewardAuction.enterAuctionBid(user.playerInfo.charId, user.userInfo.nickname, gold);
  } catch (err) {
    console.log(err.message);
  }
};

export default enterAuctionBid;
