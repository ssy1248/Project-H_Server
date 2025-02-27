import pools from '../database.js';
import { SQL_QUERIES } from './item.queries.js';

export const getAllItems = async () => {
    const [rows] = await pools.USER_DB.query(SQL_QUERIES.GET_ALL_ITEMS);
    return rows;
}
export const findItemById = async (itemId) => {
    const [rows] = await pools.USER_DB.query(SQL_QUERIES.FIND_ITEM_BY_ID, [itemId]);
    return rows;
};

export const createItem = async (itemId, name, itemType, stat, price, stackable = false) => {
    try {
        const [result] = await pools.USER_DB.query(SQL_QUERIES.CREATE_ITEM, [itemId, name, itemType, stat, price, stackable]);
        return result.insertId;
    } catch (error) {
        console.log(error);
        return null;
    }
};

export const updateItem = async (itemId, name, itemType, stat, price, stackable = false) => {
    try {
        await pools.USER_DB.query(SQL_QUERIES.UPDATE_ITEM, [name, itemType, stat, price, stackable, itemId]);
    } catch (error) {
        console.log(error);
    }
};

export const deleteItem = async (itemId) => {
    try {
        await pools.USER_DB.query(SQL_QUERIES.DELETE_ITEM, [itemId]);
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

