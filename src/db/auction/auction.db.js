import pools from '../database.js';
import { SQL_QUERIES as INVENTORY } from '../inventory/inventory.queries.js';
import { SQL_QUERIES as USER } from '../user/user.queries.js';
export const getAutionItem = async (data) => {
  const connection = await pools.USER_DB.getConnection();
  try {
    await connection.beginTransaction();
    const itemData = await connection.execute(INVENTORY.ADD_ITEM_TO_INVENTORY, [
      data.CharId,
      data.itemId,
      data.rarity,
      false,
      1,
      null,
    ]);
    await connection.execute(USER.UPDATE_SUBTRACT_GOLD, [data.gold, data.CharId]);

    await connection.commit();
    return marketData;
  } catch (err) {
    console.log(err);
    await connection.rollback();
  } finally {
    connection.release();
  }
};
