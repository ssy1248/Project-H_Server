// 마켓에 올라온  물품 목록 그 url에 추가로 넣는 어써러에 넣는 느낌으로 할려고 합니다.

import { PACKET_TYPE } from '../../constants/header.js';
import { getMarketSession, getMaxMarketList } from '../../session/market.session.js';
import { createResponse } from '../../utils/response/createResponse.js';

const marketListHandler = (socket, payload) => {
  const { page, count } = payload;
  const marketData = [];
  const marketSession = getMarketSession();

  // 시작 과 끝 정해주기
  const keysArray = Array.from(marketSession.keys());
  const startIndex = (page - 1) * count;
  const endIndex = startIndex + count;
  const selectedKeys = keysArray.slice(startIndex, endIndex);

  // 데이터 찾아서 넣어주기
  for (let marketData of selectedKeys) {
    let data = marketSession.get(marketData);
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
  const packet = createResponse('town', 'S_MarketList', PACKET_TYPE.S_MARKETLIST, {
    MaxPage,
    itemdata: marketData,
  });

  socket.write(packet);
};

export default marketListHandler;
