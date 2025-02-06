export const SQL_QUERIES = {
  FIND_USER: 'SELECT * FROM user WHERE device_id = ?',
  CREATE_USER: 'INSERT INTO user (email,nickname,password) VALUES (?,?,?)',
  CREATE_CHARACTER: 'INSERT INT Characters (userId,charStatId) VALUSE (?,?)',
  UPDATE_USER_LOGIN: 'UPDATE user SET last_login = CURRENT_TIMESTAMP WHERE device_id = ?',
  UPDATE_USER_LOCATION: 'UPDATE user SET x_coord = ?, y_coord = ? WHERE device_id = ?',
};
