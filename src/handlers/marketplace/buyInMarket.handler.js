//구매 하기

import { PACKET_TYPE } from '../../constants/header';
import { getMarketSession } from '../../session/market.session.js';
import { getUserBySocket } from '../../session/user.session.js';
import { createResponse } from '../../utils/response/createResponse.js';

const check = async (user, marketId) => {
  try {
    const marketData = getMarketSession(marketId);
    if (marketData) {
      throw new Error('더이상 존재하지 않는 물품입니다.');
    }
    if (user.playerInfo.gold < itemData.price) {
      throw new Error('골드가 부족합니다.');
    }

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
  if (user) {
    return;
  }
  const packet = await check(user, marketId);
  socket.write(packet);
};

export default buyInMarketHandler;
