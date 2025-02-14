import pools from '../database.js';
import { SQL_QUERIES } from './shop.queries.js';

// 아이템 목록 가져오기
export const findAllItems = async () => {
  const [items] = await pools.USER_DB.query(SQL_QUERIES.FIND_ALL_ITEMS);
  return items.length > 0 ? items : [];
};

// 아이템 정보 가져오기
export const findItemById = async (itemId) => {
  const [item] = await pools.USER_DB.query(SQL_QUERIES.FIND_ITEM_BY_ID, [itemId]);
  return item.length > 0 ? item[0] : null;
};

// 유저 골드 차감
export const updateUserGold = async (userId, charStatId, price) => {
  const [result] = await pools.USER_DB.query(SQL_QUERIES.UPDATE_USER_GOLD, [
    price,
    userId,
    charStatId,
  ]);
  return result.affectedRows > 0;
};

// 인벤토리에 아이템 추가
export const buyItem = async (userId, itemId) => {
  const [result] = await pools.USER_DB.query(SQL_QUERIES.BUY_ITEM, [userId, itemId]);
  return result.affectedRows > 0;
};
