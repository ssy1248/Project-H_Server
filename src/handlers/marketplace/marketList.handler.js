// 마켓에 올라온  물품 목록 그 url에 추가로 넣는 어써러에 넣는 느낌으로 할려고 합니다.

import { PACKET_TYPE } from '../../constants/header.js';
import { getMarketSession, getMaxMarketList } from '../../session/market.session.js';
import { createResponse } from '../../utils/response/createResponse.js';
const marketListHandler = (socket, payload) => {
  const { page, count } = payload;

  const marketData = [];
  for (let i = 0; i < count; i++) {
    let data = getMarketSession(page * count + i);
    if (data) {
      marketData.push({
        marketId: data.id,
        itemId: data.itemIndex,
        upgrade: data.upgrade,
        endTime: data.endTime,
        price: data.price,
      });
    }
  }
  const MaxPage = getMaxMarketList(count);
  const packet = createResponse('town', 'S_marketList', PACKET_TYPE.S_MARKETLIST, {
    MaxPage,
    itemdata: marketData,
  });

  socket.write(packet);
};

export default marketListHandler;
