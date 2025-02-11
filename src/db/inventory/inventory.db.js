import pools from '../database.js';
import { SQL_QUERIES } from './inventory.queries.js';
import { toCamelCase } from '../../utils/transformCase.js';

export const getInventoryFromCharId = async (charId) => {
  try {
    const [rows] = await pools.USER_DB.query(SQL_QUERIES.GET_INVENTORY_FROM_CHAR_ID, [charId]);
    return toCamelCase(rows);
  } catch (error) {
    console.log(error);
    return null;
  }
}

export const addItemToInventory = async (charId, itemId, rarity, equipped) => {
  try {
    await pools.USER_DB.query(SQL_QUERIES.ADD_ITEM_TO_INVENTORY, [charId, itemId, rarity, equipped]);
  } catch (error) {
    console.log(error);
  }
}

export const removeItemFromInventory = async (charId, id) => {
  try {
    await pools.USER_DB.query(SQL_QUERIES.REMOVE_ITEM_FROM_INVENTORY, [id, charId]);
  } catch (error) {
    console.log(error);
  }
}

export const getCharacterTable = async () => {
  try {
    const [rows] = await pools.USER_DB.query(SQL_QUERIES.GET_CHARACTER_TABLE);
    return rows;
  } catch (error) {
    console.log(error);
    return null;
  }
}