import pools from '../database.js';
import { SQL_QUERIES } from './inventory.queries.js';
import { toCamelCase } from '../../utils/transformCase.js';

export const getInventoryFromCharId = async (charId) => {
  try {
    const [rows] = await pools.USER_DB.query(SQL_QUERIES.GET_INVENTORY_FROM_CHAR_ID, [charId]);
    return toCamelCase(rows);
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const addItemToInventory = async (charId, itemId, rarity, equipped) => {
  try {
    const result = await pools.USER_DB.query(SQL_QUERIES.ADD_ITEM_TO_INVENTORY, [
      charId,
      itemId,
      rarity,
      equipped,
    ]);
    return result;
  } catch (error) {
    console.error(error);
    return null;
  }
};

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
  return ([rows] = await pools.USER_DB.query(SQL_QUERIES.GET_ITEM_BUY_INVENTORY, [charId, id]));
};
