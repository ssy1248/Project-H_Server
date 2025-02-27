import pools from '../database.js';
import { SQL_QUERIES } from './inventory.queries.js';

export const getInventoryFromCharId = async (charId) => {
  try {
    const [rows] = await pools.USER_DB.query(SQL_QUERIES.GET_INVENTORY_FROM_CHAR_ID, [charId]);
    return rows;
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const addItemToInventory = async (charId, itemId, rarity, equipped, quantity = 1, position = null) => {
  try {
    const result = await pools.USER_DB.query(SQL_QUERIES.ADD_ITEM_TO_INVENTORY, [
      charId,
      itemId,
      rarity,
      equipped,
      quantity,
      position,
    ]);
    return result;
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const updateItemQuantity = async (charId, inventoryId, quantity) => {
  try {
    await pools.USER_DB.query(SQL_QUERIES.UPDATE_ITEM_QUANTITY, [quantity, inventoryId, charId]);
  } catch (error) {
    console.error(error);
  }
};

export const updateItemPosition = async (charId, inventoryId, position) => {
  try {
    await pools.USER_DB.query(SQL_QUERIES.UPDATE_ITEM_POSITION, [position, inventoryId, charId]);
  } catch (error) {
    console.error(error);
  }
}

export const removeItemFromInventory = async (charId, inventoryId) => {
  try {
    await pools.USER_DB.query(SQL_QUERIES.REMOVE_ITEM_FROM_INVENTORY, [inventoryId, charId]);
  } catch (error) {
    console.error(error);
  }
};

export const equipItem = async (charId, inventoryId) => {
  try {
    await pools.USER_DB.query(SQL_QUERIES.EQUIP_ITEM, [inventoryId, charId]);
  } catch (error) {
    console.error(error);
  }
};

export const disrobeItem = async (charId, inventoryId) => {
  try {
    await pools.USER_DB.query(SQL_QUERIES.DISROBE_ITEM, [inventoryId, charId]);
  } catch (error) {
    console.error(error);
  }
};

export const getCharacterTable = async () => {
  try {
    const [rows] = await pools.USER_DB.query(SQL_QUERIES.GET_CHARACTER_TABLE);
    return rows;
  } catch (error) {
    console.log(error);
    return null;
  }
};

export const getItemBuyInventoryId = async (charId, id) => {
  const [rows] = await pools.USER_DB.query(SQL_QUERIES.GET_ITEM_BUY_INVENTORY, [charId, id]);
  return rows;
};
