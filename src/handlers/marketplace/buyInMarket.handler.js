//구매 하기

import { config } from '../../config/config.js';
import { PACKET_TYPE } from '../../constants/header.js';
import redisClient from '../../redis/redis.js';
import { getItemSession } from '../../session/item.session.js';
import { getUserBySocket } from '../../session/user.session.js';
import { createResponse } from '../../utils/response/createResponse.js';
import { addInventoryHandler } from '../inventory/inventory.handler.js';

const check = async (user, marketId) => {
  try {
    //보낼 데이터
    const sendData = {
      gold: user.playerInfo.gold,
      marketId,
      charId: user.playerInfo.charId,
      senderId: config.redis.id,
    };
    //보내기
    await redisClient.rPush('BUY', JSON.stringify(sendData));
    //받기
    const value = await redisClient.blPop(`BUY:RES:${config.redis.id}`, { EX: 10 });
    const marketData = JSON.parse(value.element);
    if (!marketData.isSuccess) {
      throw new Error();
    }
    const data = getItemSession(marketData.itemIndex);
    user.playerInfo.gold -= marketData.price;
    // 현재 인벤토리에 데이터 추가
    user.inventory.notAddDB(
      {
        insertId: itemData[0].insertId,
        id: marketData.itemIndex,
        itemType: data.itemType,
        name: data.name,
        price: data.price,
        stat: data.stat,
        rarity: marketData.rarity,
        stackable: 1,
      },
      marketData.rarity,
    );
    // 인벤토리에서 보내주는 함수

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
  addInventoryHandler(socket);
  socket.write(packet);
};

export default buyInMarketHandler;
