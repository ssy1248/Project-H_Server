export const SQL_QUERIES = {
    FIND_ITEM_BY_ID: 'SELECT * FROM items WHERE id = ?',
    CREATE_ITEM: 'INSERT INTO items (name, itemType, stat, price) VALUES (?, ?, ?, ?)',
    UPDATE_ITEM: 'UPDATE items SET name = ?, itemType = ?, stat = ?, price = ? WHERE id = ?',
    DELETE_ITEM: 'DELETE FROM items WHERE id = ?',
};