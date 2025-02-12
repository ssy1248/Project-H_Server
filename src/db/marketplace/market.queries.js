export const SQL_QUERIES = {
  ADD_MARKET_DATA: 'INSERT INTO Market (charId,itemIndex,upgrade,price,endTime) VALUES (?,?,?,?,?)',
  REMOVE_MARKET_DATA: 'DELETE FROM Market WHERE id = ?',
  GET_MARKET_DATAS: 'SELECT * FROM Market',
};
