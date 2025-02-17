export const SQL_QUERIES = {
  // 모든 아이템 조회
  FIND_ALL_ITEMS: 'SELECT * FROM Items',

  // 아이템 ID로 특정 아이템 조회
  FIND_ITEM_BY_ID: 'SELECT * FROM Items WHERE id = ?',

  // 아이템 구매
  BUY_ITEM:
    'INSERT INTO Inventory (charId, itemId) VALUES (?, ?) ON DUPLICATE KEY UPDATE rarity = rarity + 1',
  UPDATE_USER_GOLD_AFTER_BUY: 'UPDATE Characters SET gold = gold - ? WHERE id = ? AND gold >= ?',

  // 아이템 판매
  SELL_ITEM: 'DELETE FROM Inventory WHERE id = ? AND charId = ?',
  UPDATE_USER_GOLD_AFTER_SELL: 'UPDATE Characters SET gold = gold + ? WHERE id = ?',
};
