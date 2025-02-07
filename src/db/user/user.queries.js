export const SQL_QUERIES = {
  FIND_USER_BY_DEVICE_ID: 'SELECT * FROM user WHERE device_id = ?',
  CREATE_USER: 'INSERT INTO user (device_id) VALUES (?)',
  UPDATE_USER_LOGIN: 'UPDATE user SET last_login = CURRENT_TIMESTAMP WHERE device_id = ?',
  UPDATE_USER_LOCATION: 'UPDATE user SET x_coord = ?, y_coord = ? WHERE device_id = ?',
  // 쿼리문 추가 [케릭터 관련]
  CREATE_CHARACTER: 'INSERT INTO Characters (userId, charStatId) VALUES (?, ?)',
  UPDATE_CHARACTER:
    'UPDATE Characters SET gold = ?, level = ?, exp = ? WHERE userId = ? AND charStatId = ?',
  FIND_CHARACTER_BY_USER_AND_STAT_ID:
    'SELECT ch.*, cs.* FROM Characters ch JOIN CharacterStats cs ON ch.charStatId = cs.id WHERE ch.userId = ? AND ch.id = ?',
  FIND_CHARACTER_STATS_BY_ID: 'SELECT * FROM CharacterStats WHERE id = ?',
};
