import CustomError from '../../utils/error/customError.js';
import { ErrorCodes } from '../../utils/error/errorCodes.js';
import { handlerError } from '../../utils/error/errorHandler.js';
import { getUserBySocket } from '../../session/user.session.js';
import { createResponse } from '../../utils/response/createResponse.js';
import {
  findItemById,
  buyItem,
  updateUserGoldAfterBuy,
  sellItem,
  updateUserGoldAfterSell,
} from '../../db/shop/shop.db.js';
import { PACKET_TYPE } from '../../constants/header.js';

// 아이템 구매
const handleBuyItem = async (socket, packetData) => {
  const { itemname, price } = packetData;
  const user = getUserBySocket(socket);

  if (!user) {
    throw new CustomError(ErrorCodes.USER_NOT_FOUND, '유저를 찾을 수 없습니다.');
  }

  const characterId = user.userInfo.characterId;
  const item = await findItemById(itemname);

  if (!item) {
    throw new CustomError(ErrorCodes.ITEM_NOT_FOUND, '아이템을 찾을 수 없습니다.');
  }

  if (item.price !== price) {
    throw new CustomError(ErrorCodes.INVALID_ITEM_PRICE, '아이템 가격이 일치하지 않습니다.');
  }

  const goldUpdated = await updateUserGoldAfterBuy(characterId, price);
  if (!goldUpdated) {
    throw new CustomError(ErrorCodes.NOT_ENOUGH_GOLD, '골드가 부족합니다.');
  }

  const itemBought = await buyItem(characterId, item.id);
  if (!itemBought) {
    throw new CustomError(ErrorCodes.INTERNAL_ERROR, '아이템 구매 실패');
  }

  const response = createResponse('shop', 'S_BuyItemResponse', PACKET_TYPE.S_BUY_ITEM_RESPONSE, {
    success: true,
    message: '아이템 구매 성공',
    failCode: 0,
  });
  socket.write(response);
};

// 아이템 판매
const handleSellItem = async (socket, packetData) => {
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
    throw new CustomError(ErrorCodes.INTERNAL_ERROR, '골드 갱신 실패');
  }

  const response = createResponse('shop', 'S_SellItemResponse', PACKET_TYPE.S_SELLITEMRESPONSE, {
    success: true,
    message: '아이템 판매 성공',
    failCode: 0,
  });
  socket.write(response);
};

// 상점 패킷 처리
const shopHandler = (socket, packetId, packetData) => {
  try {
    switch (packetId) {
      case PACKET_TYPE.C_BUYITEMREQUEST:
        handleBuyItem(socket, packetData);
        break;
      case PACKET_TYPE.C_SELLITEMREQUEST:
        handleSellItem(socket, packetData);
        break;
      default:
        throw new CustomError(ErrorCodes.INVALID_PACKET, '유효하지 않은 패킷 ID');
    }
  } catch (e) {
    handlerError(socket, e);
  }
};

export default shopHandler;
