export const SQL_QUERIES = {
  // 상점에 등록된 모든 아이템 조회
  FIND_ALL_ITEMS:
    'SELECT Shop.id AS shopId, Items.id AS itemId, Items.name, Items.itemType, Items.stat, Shop.price, Shop.stock FROM Shop JOIN Items ON Shop.itemId = Items.id',

  // 상점에서 특정 아이템 조회
  FIND_ITEM_BY_ID:
    'SELECT Shop.id AS shopId, Items.id AS itemId, Items.name, Items.itemType, Items.stat, Shop.price, Shop.stock FROM Shop JOIN Items ON Shop.itemId = Items.id WHERE Shop.id = ?',

  // 아이템 구매 시 재고 차감 (무한 재고는 -1로 설정)
  UPDATE_SHOP_STOCK_AFTER_BUY:
    'UPDATE Shop SET stock = CASE WHEN stock > 0 THEN stock - 1 ELSE stock END WHERE id = ?',

  // 유저 골드 차감 (아이템 구매 시)
  UPDATE_USER_GOLD_AFTER_BUY: 'UPDATE Characters SET gold = gold - ? WHERE id = ? AND gold >= ?',

  // 인벤토리에 아이템 추가
  BUY_ITEM:
    'INSERT INTO Inventory (charId, itemId) VALUES (?, ?) ON DUPLICATE KEY UPDATE rarity = rarity + 1',

  // 아이템 판매 관련 쿼리
  SELL_ITEM: 'DELETE FROM Inventory WHERE id = ? AND charId = ?',
  UPDATE_USER_GOLD_AFTER_SELL: 'UPDATE Characters SET gold = gold + ? WHERE id = ?',

  GET_SHOP_ITEMS:
    'SELECT s.id, s.itemId, s.stock, s.price, i.name, i.itemType, i.stat FROM Shop s JOIN Items i ON s.itemId = i.id',
  // 'SELECT * FROM Shop',
};
