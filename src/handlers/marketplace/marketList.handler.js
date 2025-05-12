// 마켓에 올라온  물품 목록 그 url에 추가로 넣는 어써러에 넣는 느낌으로 할려고 합니다.

import { PACKET_TYPE } from '../../constants/header.js';
import redisClient from '../../redis/redis.js';
import { createResponse } from '../../utils/response/createResponse.js';

const marketListHandler = async (socket, payload) => {
  const { page, count } = payload;
  const startIndex = (page - 1) * count;
  const endIndex = startIndex + count - 1;
  const marketData = [];

  const keys = await redisClient.lRange('marketList', startIndex, endIndex);
  if (keys.length === 0) {
    console.log('데이터 없음');
  } else {
    for (let key of keys) {
      let data = await redisClient.hGetAll(key);
      if (data && Object.keys(data).length > 0) {
        console.log(data);
        marketData.push({
          marketId: Number(key),
          itemId: Number(data.itemIndex),
          name: data.name,
          upgrade: Number(data.rarity),
          endTime: new Date(data.endTime),
          price: Number(data.price),
        });
      }
    }
  }

  // 최대 page 계산 (총 아이템 수 / 페이지당 갯수, 올림)
  const totalItems = await redisClient.lLen('marketList');
  const maxPage = Math.ceil(totalItems / count);
  console.log(marketData, '페이지', maxPage);
  const packet = createResponse('town', 'S_MarketList', PACKET_TYPE.S_MARKETLIST, {
    maxPage: maxPage,
    itemdata: marketData,
  });

  socket.write(packet);
};

export default marketListHandler;
