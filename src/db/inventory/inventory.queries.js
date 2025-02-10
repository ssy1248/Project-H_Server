export const SQL_QUERIES = {
  GET_INVENTORY_FROM_CHAR_ID: 'SELECT * FROM Inventory WHERE charId = ?',
  ADD_ITEM_TO_INVENTORY: 'INSERT INTO Inventory (charId, itemId, rarity, equipped) VALUES (?, ?, ?, ?)',
  REMOVE_ITEM_FROM_INVENTORY: 'DELETE FROM Inventory WHERE charId = ? AND itemId = ? LIMIT 1',
  GET_CHARACTER_TABLE: 'SELECT C.id, U.nickname, C.charStatId, C.level FROM Characters AS C JOIN User AS U ON C.userId = U.id ORDER BY U.id ASC'
};