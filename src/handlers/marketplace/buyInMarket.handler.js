//구매 하기

import { PACKET_TYPE } from '../../constants/header';
import { sellInMarket } from '../../db/marketplace/market.db.js';
import { deletMarketSession, getMarketSession } from '../../session/market.session.js';
import { getUserBySocket } from '../../session/user.session.js';
import { createResponse } from '../../utils/response/createResponse.js';

const check = async (user, marketId) => {
  try {
    const marketData = getMarketSession(marketId);
    if (!marketData) {
      throw new Error('더이상 존재하지 않는 물품입니다.');
    }
    if (user.playerInfo.gold < marketData.price) {
      throw new Error('골드가 부족합니다.');
    }
    user.playerInfo.gold -= marketData.price;
    // 유저 아이디도 추가하면 좋을거 같음
    // 있으면 서버상에서 갱신 가능
    deletMarketSession(marketId);
    const itemData = await sellInMarket({
      BuyCharId: user.playerInfo.charId,
      SellCharId: marketData.charId,
      itemId: marketData.itemIndex,
      rarity: marketData.rarity,
      marketId,
      gold: marketData.price,
    });

    return createResponse('town', 'S_BuyInMarket', PACKET_TYPE.S_BUYITEMRESPONSE, {
      success: true,
      message: '구매에 성공했습니다.',
    });
  } catch (err) {
    return createResponse('town', 'S_BuyInMarket', PACKET_TYPE.S_BUYITEMRESPONSE, {
      success: false,
      message: err.message,
    });
  }
};

const buyInMarketHandler = async (socket, payload) => {
  const { marketId } = payload;
  const user = getUserBySocket(socket);
  // 소켓은 있는데 유저는 없는 심각한 오류 발생시 그냥 리턴
  if (!user) {
    return;
  }
  const packet = await check(user, marketId);
  socket.write(packet);
};

export default buyInMarketHandler;
