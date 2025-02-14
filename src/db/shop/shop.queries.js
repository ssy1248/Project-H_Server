export const SQL_QUERIES = {
  FIND_ALL_ITEMS: 'SELECT * FROM Items',
  FIND_ITEM_BY_ID: 'SELECT * FROM Items WHERE item_id = ?',
  BUY_ITEM:
    'INSERT INTO user_inventory (user_id, item_id, quantity) VALUES (?, ?, 1) ON DUPLICATE KEY UPDATE quantity = quantity + 1',
  UPDATE_USER_GOLD: 'UPDATE Characters SET gold = gold - ? WHERE userId = ? AND charStatId = ?',
};
