export const SQL_QUERIES = {
    GET_ALL_ITEMS: 'SELECT * FROM Items',
    FIND_ITEM_BY_ID: 'SELECT * FROM Items WHERE id = ?',
    CREATE_ITEM: 'INSERT INTO Items (id, name, itemType, stat, price, stackable) VALUES (?, ?, ?, ?, ?, ?)',
    UPDATE_ITEM: 'UPDATE Items SET name = ?, itemType = ?, stat = ?, price = ?, stackable = ? WHERE id = ?',
    DELETE_ITEM: 'DELETE FROM Items WHERE id = ?',
};