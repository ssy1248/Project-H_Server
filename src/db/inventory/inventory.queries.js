export const SQL_QUERIES = {
  GET_INVENTORY_FROM_CHAR_ID: `
  SELECT I.id, I.itemId, T.itemType, T.name, T.price, T.stat, I.rarity, I.equipped, I.quantity, I.position, T.imgsrc, T.stackable
  FROM Inventory AS I
  JOIN Characters AS C ON I.charId = C.id
  JOIN Items AS T ON I.itemId = T.id
  WHERE I.charId = ?
`,
  ADD_ITEM_TO_INVENTORY:
    'INSERT INTO Inventory (charId, itemId, rarity, equipped, quantity, position) VALUES (?, ?, ?, ?, ?, ?)',
  UPDATE_ITEM_QUANTITY: 'UPDATE Inventory SET quantity = ? WHERE id = ? AND charId = ?',
  UPDATE_ITEM_POSITION: 'UPDATE Inventory SET position = ?, equipped = ? WHERE id = ? AND charId = ?',
  REMOVE_ITEM_FROM_INVENTORY: 'DELETE FROM Inventory WHERE id = ? AND charId = ?',
  GET_CHARACTER_TABLE:
    'SELECT C.id, U.nickname, C.charStatId, C.level FROM Characters AS C JOIN User AS U ON C.userId = U.id ORDER BY U.id ASC',
  EQUIP_ITEM: 'UPDATE Inventory SET equipped = 1 WHERE id = ? AND charId = ?',
  DISROBE_ITEM: 'UPDATE Inventory SET equipped = 0 WHERE id = ? AND charId = ?',
  STORE_ITEM: 'UPDATE Inventory SET equipped = 2 WHERE id = ? AND charId = ?',
  GET_ITEM_BUY_INVENTORY: `SELECT * FROM Inventory WHERE charId = ? AND  id =?`,
  LOSE: 'DELETE FROM Inventory WHERE charId = ? AND (equipped = 0 OR equipped = 1)',
};
