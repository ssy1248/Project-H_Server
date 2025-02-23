import CustomError from '../../utils/error/customError.js';
import { ErrorCodes } from '../../utils/error/errorCodes.js';
import { handlerError } from '../../utils/error/errorHandler.js';
import { getUserBySocket } from '../../session/user.session.js';
import { createResponse } from '../../utils/response/createResponse.js';
import {
  findItemById,
  buyItem,
  updateUserGoldAfterBuy,
  updateShopStockAfterBuy,
  sellItem,
  updateUserGoldAfterSell,
  getShopItems,
} from '../../db/shop/shop.db.js';
import { PACKET_TYPE } from '../../constants/header.js';

// 아이템 구매
export const handleBuyItem = async (socket, packetData) => {
  const { shopId, price } = packetData;
  const user = getUserBySocket(socket);

  if (!user) {
    throw new CustomError(ErrorCodes.USER_NOT_FOUND, '유저를 찾을 수 없습니다.');
  }

  const characterId = user.userInfo.characterId;
  const item = await findItemById(shopId);

  if (!item) {
    throw new CustomError(ErrorCodes.ITEM_NOT_FOUND, '아이템을 찾을 수 없습니다.');
  }

  if (item.price !== price) {
    throw new CustomError(ErrorCodes.INVALID_ITEM_PRICE, '아이템 가격이 일치하지 않습니다.');
  }

  if (item.stock <= 0) {
    throw new CustomError(ErrorCodes.OUT_OF_STOCK, '아이템 재고가 부족합니다.');
  }

  const goldUpdated = await updateUserGoldAfterBuy(characterId, price);
  if (!goldUpdated) {
    throw new CustomError(ErrorCodes.NOT_ENOUGH_GOLD, '골드가 부족합니다.');
  }

  const itemBought = await buyItem(characterId, item.itemId);
  if (!itemBought) {
    throw new CustomError(ErrorCodes.INTERNAL_ERROR, '아이템 구매에 실패했습니다.');
  }

  const stockUpdated = await updateShopStockAfterBuy(shopId);
  if (!stockUpdated) {
    throw new CustomError(ErrorCodes.INTERNAL_ERROR, '상점 재고 업데이트에 실패했습니다.');
  }

  const response = createResponse('shop', 'S_BuyItemResponse', PACKET_TYPE.S_BUYITEMRESPONSE, {
    success: true,
    message: '아이템 구매 성공',
    failCode: 0,
  });
  socket.write(response);
};

// 아이템 판매
export const handleSellItem = async (socket, packetData) => {
  const { inventoryId, price } = packetData;
  const user = getUserBySocket(socket);

  if (!user) {
    throw new CustomError(ErrorCodes.USER_NOT_FOUND, '유저를 찾을 수 없습니다.');
  }

  const characterId = user.userInfo.characterId;
  const itemSold = await sellItem(inventoryId, characterId);

  if (!itemSold) {
    throw new CustomError(ErrorCodes.ITEM_NOT_FOUND, '판매할 아이템이 없습니다.');
  }

  const goldUpdated = await updateUserGoldAfterSell(characterId, price);
  if (!goldUpdated) {
    throw new CustomError(ErrorCodes.INTERNAL_ERROR, '골드 갱신에 실패했습니다.');
  }

  const response = createResponse('shop', 'S_SellItemResponse', PACKET_TYPE.S_SELLITEMRESPONSE, {
    success: true,
    message: '아이템 판매 성공',
    failCode: 0,
  });
  socket.write(response);
};

// 상점 아이템 목록 조회
// export const handleShopItemList = (socket) => {
//   console.log('✅ handleShopItemList 실행됨!');

//   try {
//     const items = getShopItems();

//     if (!items || items.length === 0) {
//       throw new CustomError(ErrorCodes.ITEM_NOT_FOUND, '상점에 등록된 아이템이 없습니다.');
//     }

//     console.log('[상점 목록 데이터]:', items);

//     const response = createResponse('town', 'S_ShopItemList', PACKET_TYPE.S_SHOPITEMLIST, {
//       items,
//     });
//     socket.write(response);

//     console.log('📢 상점 아이템 목록 전송 완료! 인벤토리 목록도 전송 시작');
//     handleInventoryList(socket, { page: 1, count: 20 });
//   } catch (error) {
//     console.error('handleShopItemList 오류:', error);
//   }
// };
// 인벤토리 조회 (상점에서 사용)
// export const handleInventoryList = (socket, packetData) => {
//   const { page, count } = packetData;

//   if (count <= 0) return;

//   const user = getUserBySocket(socket);
//   if (!user) {
//     throw new CustomError(ErrorCodes.USER_NOT_FOUND, '유저를 찾을 수 없습니다.');
//   }

//   const inventory = user.inventory.getInventory();
//   console.log('인벤토리 데이터:', inventory);

//   if (!inventory || inventory.length === 0) {
//     console.warn('인벤토리가 비어 있습니다! 데이터베이스 또는 유저 세션을 확인하세요.');
//     return;
//   }

//   const startIdx = Math.max(0, (page - 1) * count);
//   const endIdx = startIdx + count;
//   const data = inventory
//     .slice(startIdx, endIdx)
//     .filter((item) => item.equiped === 0)
//     .map(({ id, price, itemType, name, stat, equiped, rarity }) => ({
//       id,
//       price,
//       itemType,
//       name,
//       stat,
//       equiped,
//       rarity,
//     }));

//   const maxPage = Math.ceil(inventory.length / count);

//   const response = createResponse(
//     'inventory',
//     'S_ShopInventoryList',
//     PACKET_TYPE.S_SHOPINVENTORYLIST,
//     {
//       maxPage,
//       itemData: data,
//     },
//   );

//   console.log('[전송] S_ShopInventoryList:', JSON.stringify(response, null, 2));
//   socket.write(response);
// };
export const handleInventoryList = (socket, packetData) => {
  const { page, count } = packetData;

  if (count <= 0) {
    return;
  }

  const user = getUserBySocket(socket);
  if (!user) {
    throw new CustomError(ErrorCodes.USER_NOT_FOUND, '유저를 찾을 수 없습니다.');
  }

  const inventory = user.inventory.getInventory();
  console.log('인벤토리 데이터:', inventory);

  if (!inventory || inventory.length === 0) {
    console.warn('인벤토리가 비어 있습니다! 데이터베이스 또는 유저 세션을 확인하세요.');
  }

  // 상점 아이템 목록 가져오기
  const shopItems = getShopItems();
  console.log('[상점 목록 데이터]:', shopItems);

  const data = [];
  let startIdx = (page - 1) * count;
  const endIdx = page * count;

  if (startIdx < 0) {
    console.warn(`잘못된 페이지 요청 (${startIdx}). 0으로 초기화합니다.`);
    startIdx = 0;
  }

  for (let i = startIdx; i < endIdx; i++) {
    if (inventory.length <= i || !inventory[i]) break;

    if (inventory[i].equiped === 0) {
      data.push({
        id: inventory[i].id,
        price: inventory[i].price,
        itemType: inventory[i].itemType,
        name: inventory[i].name,
        stat: inventory[i].stat,
        equiped: inventory[i].equiped,
        rarity: inventory[i].rarity,
      });
    }
  }

  const maxPage = Math.ceil(inventory.length / count);

  const response = createResponse(
    'inventory',
    'S_ShopInventoryList',
    PACKET_TYPE.S_SHOPINVENTORYLIST,
    {
      maxPage: maxPage,
      itemData: data,
      shopItems: shopItems,
    },
  );

  console.log('[전송] S_ShopInventoryList:', JSON.stringify(response, null, 2));

  socket.write(response);
};
