import { config } from '../../config/config.js';
import { PACKET_TYPE } from '../../constants/header.js';
import { getItemBuyInventoryId } from '../../db/inventory/inventory.db.js';
import redisClient from '../../redis/redis.js';
import { getUserBySocket } from '../../session/user.session.js';
import { createResponse } from '../../utils/response/createResponse.js';
import { addInventoryHandler, removeInventoryHandler } from '../inventory/inventory.handler.js';

const check = async (data) => {
  try {
    //아이템에 인벤토리 고유 키 넣어준다면 이렇게 구현
    const [item] = await getItemBuyInventoryId(data.user.playerInfo.charId, data.inventoryId);
    if (!item) {
      throw new Error('인벤토리에 없습니다!');
    }
    console.log(data.user.playerInfo.gold);
    //보낼 데이터
    const sendData = {
      gold: data.gold,
      inventoryId: data.inventoryId,
      charId: data.user.playerInfo.charId,
      senderId: config.redis.id,
    };
    //보내기
    await redisClient.rPush('SELL', JSON.stringify(sendData));
    //받기
    const value = await redisClient.blPop(`SELL:RES:${config.redis.id}`, 50);
    if (!value) {
      throw new Error();
    }
    const marketData = JSON.parse(value.element);
    if (!marketData.isSuccess) {
      throw new Error();
    }
    const itemData = data.user.inventory.notDropDB(data.inventoryId);

    return createResponse('town', 'S_SellInMarket', PACKET_TYPE.S_SELLINMARKET, {
      success: true,
      message: '등록에 성공했습니다.',
    });
  } catch (err) {
    return createResponse('town', 'S_SellInMarket', PACKET_TYPE.S_SELLINMARKET, {
      success: false,
      message: err.message,
    });
  }
};

//판매 목록 올리기
const sellInMarketHandler = async (socket, payload) => {
  const { inventoryId, itemId, gold } = payload;
  const user = getUserBySocket(socket);
  if (!user) {
    return;
  }

  const packet = await check({ inventoryId, itemId, user, gold });
  addInventoryHandler(socket);
  //인벤토리에 있는지 확인 필요
  socket.write(packet);
};
export default sellInMarketHandler;
