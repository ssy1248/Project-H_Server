import pools from '../database.js';
import { SQL_QUERIES as MARKET } from './market.queries';
import { SQL_QUERIES as INVENTORY } from '../inventory/inventory.queries.js';
import { SQL_QUERIES as USER } from '../user/user.queries.js';
// 모든 데이터 받고 서버에서 관리 경매 종료를 위한 관리
export const getAllMarketData = async () => {
  const [data] = await pools.USER_DB.execute(MARKET.GET_MARKET_DATAS);
  return data || null;
};
// 아이템 거래
export const sellInMarket = async (data) => {
  try {
    await pools.beginTransaction();

    await pools.USER_DB.execute(INVENTORY.ADD_ITEM_TO_INVENTORY, [
      data.BuyCharId,
      data.itemId,
      data.rarity,
      false,
    ]);
    await pools.USER_DB.execute(MARKET.REMOVE_MARKET_DATA, [data.marketId]);
    await pools.USER_DB.execute(USER.UPDATE_SUBTRACT_GOLD, [data.gold, data.BuyCharId]);
    await pools.USER_DB.execute(USER.UPDATE_ADD_GOLD, [data.gold, data.SellCharId]);

    await pools.commit();
  } catch (err) {
    await pools.rollback();
  } finally {
    pools.release();
  }
};
// 아이템 등록
export const addMarket = async (data) => {
  try {
    await pools.beginTransaction();

    await pools.USER_DB.execute(INVENTORY.REMOVE_ITEM_FROM_INVENTORY, [
      data.inventoryId,
      data.charId,
    ]);
    await pools.USER_DB.execute(MARKET.ADD_MARKET_DATA, [
      data.charId,
      data.itemIndex,
      data.upgrade,
      data.price,
      data.endTime,
    ]);

    await pools.commit();
  } catch (err) {
    await pools.rollback();
  } finally {
    pools.release();
  }
};
// 아이템 등록 취소
export const cancelMarket = async (data) => {
  try {
    await pools.beginTransaction();

    await pools.USER_DB.execute(INVENTORY.ADD_ITEM_TO_INVENTORY, [
      data.charId,
      data.itemId,
      data.rarity,
      false,
    ]);
    await pools.USER_DB.execute(MARKET.REMOVE_MARKET_DATA, [data.makrketId]);
    await pools.commit();
  } catch (err) {
    await pools.rollback();
  } finally {
    pools.release();
  }
};
