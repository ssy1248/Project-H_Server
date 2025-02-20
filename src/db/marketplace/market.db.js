import pools from '../database.js';
import { SQL_QUERIES as MARKET } from './market.queries.js';
import { SQL_QUERIES as INVENTORY } from '../inventory/inventory.queries.js';
import { SQL_QUERIES as USER } from '../user/user.queries.js';
// 모든 데이터 받고 서버에서 관리 경매 종료를 위한 관리
export const getAllMarketData = async () => {
  const [data] = await pools.USER_DB.execute(MARKET.GET_MARKET_DATAS);
  return data || null;
};
// 아이템 거래
export const sellInMarket = async (data) => {
  const connection = await pools.USER_DB.getConnection();
  try {
    await connection.beginTransaction();

    const itemData = await connection.execute(INVENTORY.ADD_ITEM_TO_INVENTORY, [
      data.BuyCharId,
      data.itemId,
      data.rarity,
      false,
      1,
    ]);
    await connection.execute(MARKET.REMOVE_MARKET_DATA, [data.marketId]);
    await connection.execute(USER.UPDATE_SUBTRACT_GOLD, [data.gold, data.BuyCharId]);
    await connection.execute(USER.UPDATE_ADD_GOLD, [data.gold, data.SellCharId]);

    await connection.commit();
    return itemData;
  } catch (err) {
    console.log(err);
    await connection.rollback();
  } finally {
    connection.release();
  }
};
// 아이템 등록
export const addMarket = async (data) => {
  const connection = await pools.USER_DB.getConnection();
  try {
    await connection.beginTransaction();

    await connection.execute(INVENTORY.REMOVE_ITEM_FROM_INVENTORY, [
      data.inventoryId,
      data.charId,
      data.upgrade,
    ]);
    const marketData = await connection.execute(MARKET.ADD_MARKET_DATA, [
      data.charId,
      data.itemIndex,
      data.upgrade,
      data.price,
      data.endTime,
    ]);
    await connection.commit();
    return marketData;
  } catch (err) {
    console.log(err);
    await connection.rollback();
  } finally {
    connection.release();
  }
};
// 아이템 등록 취소
export const cancelMarket = async (data) => {
  console.log(data);
  const connection = await pools.USER_DB.getConnection();
  try {
    await connection.beginTransaction();
    const item = await connection.execute(INVENTORY.ADD_ITEM_TO_INVENTORY, [
      data.charId,
      data.itemId,
      data.rarity,
      false,
      1,
    ]);
    await connection.execute(MARKET.REMOVE_MARKET_DATA, [data.makrketId]);
    await connection.commit();
  } catch (err) {
    console.log(err);
    await connection.rollback();
  } finally {
    connection.release();
  }
};
