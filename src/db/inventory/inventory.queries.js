export const SQL_QUERIES = {
  GET_INVENTORY_FROM_CHAR_ID: `
  SELECT I.id, T.itemType, T.name, T.price, T.stat, I.rarity, I.equiped
  FROM Inventory AS I
  JOIN Characters AS C ON I.charId = C.id
  JOIN Items AS T ON I.itemId = T.id
  WHERE I.charId = ?
`,
  ADD_ITEM_TO_INVENTORY: 'INSERT INTO Inventory (charId, itemId, rarity, equiped) VALUES (?, ?, ?, ?)',
  REMOVE_ITEM_FROM_INVENTORY: 'DELETE FROM Inventory WHERE id = ? AND charId = ?',
  GET_CHARACTER_TABLE: 'SELECT C.id, U.nickname, C.charStatId, C.level FROM Characters AS C JOIN User AS U ON C.userId = U.id ORDER BY U.id ASC',
  EQUIP_ITEM: 'UPDATE Inventory SET equiped = 1 WHERE id = ? AND charId = ?',
  DISROBE_ITEM: 'UPDATE Inventory SET equiped = 0 WHERE id = ? AND charId = ?',
};