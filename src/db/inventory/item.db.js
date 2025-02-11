import pools from '../database.js';
import { SQL_QUERIES } from './item.queries.js';
import { toCamelCase } from '../../utils/transformCase.js';

export const getAllItems = async () => {
    const [rows] = await pools.USER_DB.query(SQL_QUERIES.GET_ALL_ITEMS);
    //return toCamelCase(rows);
    return rows;
}
export const findItemById = async (itemId) => {
    const [rows] = await pools.USER_DB.query(SQL_QUERIES.FIND_ITEM_BY_ID, [itemId]);
    return toCamelCase(rows.insertId);
};

export const createItem = async (name, itemType, stat, price) => {
    try {
        const [result] = await pools.USER_DB.query(SQL_QUERIES.CREATE_ITEM, [name, itemType, stat, price]);
        return toCamelCase(result.insertId);
    } catch (error) {
        console.log(error);
        return null;
    }
};

export const createItem2 = async (name, itemType, stat, price) => {
    try {
        const [result] = await pools.USER_DB.query(SQL_QUERIES.CREATE_ITEM, [name, itemType, stat, price]);
        const newId = result.insertId;
        return { success: true, id: newId };
    } catch (error) {
        console.log(error);
        return { success: false, id: null };
    }
};

export const updateItem = async (itemId, name, itemType, stat, price) => {
    try {
        const [result] = await pools.USER_DB.query(SQL_QUERIES.UPDATE_ITEM, [name, itemType, stat, price, itemId]);
        return toCamelCase(result.insertId);
    } catch (error) {
        console.log(error);
        return null;
    }
};

export const deleteItem = async (itemId) => {
    try {
        const [result] = await pools.USER_DB.query(SQL_QUERIES.DELETE_ITEM, [itemId]);
        return result.affectedRows > 0;
    } catch (error) {
        console.log(error);
    }
};

// 아이템 컬럼명만 가져오기.
export const getItemsTableStructure = async () => {
    const query = 'DESCRIBE Items';
    const [results] = await pools.USER_DB.query(query);
    return results.map((column) => column.Field); // 컬럼명만 반환
  };

