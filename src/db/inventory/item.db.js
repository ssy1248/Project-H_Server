import pools from '../database.js';
import { SQL_QUERIES } from './item.queries.js';
import { toCamelCase } from '../../utils/transformCase.js';

export const findItemById = async (itemId) => {
    const [rows] = await pools.USER_DB.query(SQL_QUERIES.FIND_ITEM_BY_ID, [itemId]);
    return toCamelCase(rows[0]);
};

export const createItem = async (name, itemType, stat, price) => {
    try {
        await pools.USER_DB.query(SQL_QUERIES.CREATE_ITEM, [name, itemType, stat, price]);
        return true;
    } catch (error) {
        console.log(error);
        return false;
    }
};

export const updateItem = async (itemId, name, itemType, stat, price) => {
    try {
        await pools.USER_DB.query(SQL_QUERIES.UPDATE_ITEM, [name, itemType, stat, price, itemId]);
        return true;
    } catch (error) {
        console.log(error);
        return false;
    }
};

export const deleteItem = async (itemId) => {
    try {
        await pools.USER_DB.query(SQL_QUERIES.DELETE_ITEM, [itemId]);
        return true;
    } catch (error) {
        console.log(error);
        return false;
    }
};

// FIND_ALL_ITEMS
// [추가] 모든 아이템 가져오기 
export const findAllItems = async () => {
    const [rows] = await pools.USER_DB.query(SQL_QUERIES.FIND_ALL_ITEMS);

    return toCamelCase(rows);
}