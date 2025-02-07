export const SQL_QUERIES = {
    FIND_ITEM_BY_ID: 'SELECT * FROM Items WHERE id = ?',
    CREATE_ITEM: 'INSERT INTO Items (name, itemType, stat, price) VALUES (?, ?, ?, ?)',
    UPDATE_ITEM: 'UPDATE Items SET name = ?, itemType = ?, stat = ?, price = ? WHERE id = ?',
    DELETE_ITEM: 'DELETE FROM Items WHERE id = ?',
    FIND_ALL_ITEMS: 'SELECT * FROM Items',
};