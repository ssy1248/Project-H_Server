export const SQL_QUERIES = {
    GET_INVENTORY_FROM_CHAR_ID: 'SELECT * FROM inventory WHERE charId = ?',
    ADD_ITEM_TO_INVENTORY: 'INSERT INTO inventory (charId, itemId, rarity, equipped) VALUES (?, ?, ?, ?)',
    REMOVE_ITEM_FROM_INVENTORY: 'DELETE FROM inventory WHERE charId = ? AND itemId = ? LIMIT 1',
  };