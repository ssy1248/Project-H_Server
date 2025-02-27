import pools from '../database.js';
import { SQL_QUERIES } from './shop.queries.js';

// 아이템 목록 가져오기
export const findAllItems = async () => {
  const [items] = await pools.USER_DB.query(SQL_QUERIES.FIND_ALL_ITEMS);
  return items.length > 0 ? items : [];
};

// 아이템 정보 가져오기
export const findItemById = async (shopId) => {
  const [item] = await pools.USER_DB.query(SQL_QUERIES.FIND_ITEM_BY_ID, [shopId]);
  return item.length > 0 ? item[0] : null;
};

// 유저 골드 차감 (아이템 구매 시)
export const updateUserGoldAfterBuy = async (charId, price) => {
  const [result] = await pools.USER_DB.query(SQL_QUERIES.UPDATE_USER_GOLD_AFTER_BUY, [
    price,
    charId,
    price,
  ]);
  return result.affectedRows > 0;
};

// 아이템 구매 시 상점 재고 차감
export const updateShopStockAfterBuy = async (shopId) => {
  const [result] = await pools.USER_DB.query(SQL_QUERIES.UPDATE_SHOP_STOCK_AFTER_BUY, [shopId]);
  return result.affectedRows > 0;
};

// 인벤토리에 아이템 추가 (아이템 구매)
export const buyItem = async (charId, itemId) => {
  const [result] = await pools.USER_DB.query(SQL_QUERIES.BUY_ITEM, [charId, itemId]);
  return result.affectedRows > 0;
};

// 인벤토리에서 아이템 삭제 (아이템 판매)
export const sellItem = async (inventoryId, charId) => {
  const [result] = await pools.USER_DB.query(SQL_QUERIES.SELL_ITEM, [inventoryId, charId]);
  return result.affectedRows > 0;
};

// 유저 골드 추가 (아이템 판매 시)
export const updateUserGoldAfterSell = async (charId, price) => {
  const [result] = await pools.USER_DB.query(SQL_QUERIES.UPDATE_USER_GOLD_AFTER_SELL, [
    price,
    charId,
  ]);
  return result.affectedRows > 0;
};

// 상점 아이템 목록 조회
export const getShopItems = async () => {
  const [rows] = await pools.USER_DB.query(SQL_QUERIES.GET_SHOP_ITEMS);
  return rows;
};
