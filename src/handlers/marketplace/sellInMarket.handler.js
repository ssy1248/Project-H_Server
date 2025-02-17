import marketData from '../../classes/models/marketData.class.js';
import { PACKET_TYPE } from '../../constants/header.js';
import { getItemBuyInventoryId, removeItemFromInventory } from '../../db/inventory/inventory.db.js';
import { addMarket } from '../../db/marketplace/market.db.js';
import { getUserBySocket } from '../../session/user.session.js';
import { createResponse } from '../../utils/response/createResponse.js';

const check = async (data) => {
  try {
    //아이템에 인벤토리 고유 키 넣어준다면 이렇게 구현
    const item = getItemBuyInventoryId(data.user.charId, data.inventoryId);
    if (!item) {
      throw new Error('인벤토리에 없습니다!');
    }
    const marketDataTemp = await addMarket({
      charId: data.user.playerInfo.charId,
      inventoryId: data.inventoryId,
      itemIndex: item.itemId,
      upgrade: item.rarity,
      price: data.gold,
      endTime: new Date(),
    });
    if (!marketDataTemp) {
      throw new Error('거래 실패입니다!');
    }
    // 생성까지 완료 해주기
    new marketData(marketDataTemp);

    return createResponse('town', 'S_SellInMarket', PACKET_TYPE.S_SELLINMARKET, {
      success: true,
      message: '구매에 성공했습니다.',
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
  const { inventoryId, itemId, gold, count } = payload;
  const user = getUserBySocket(socket);
  if (!user) {
    return;
  }

  const packet = await check({ inventoryId, itemId, user, gold, count });
  //인벤토리에 있는지 확인 필요
  socket.write(packet);
};
export default sellInMarketHandler;
