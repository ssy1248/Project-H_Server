export const SQL_QUERIES = {
  FIND_USER: 'SELECT * FROM User WHERE email = ?',
  FIND_CHARACTER: 'SELECT * FROM Characters WHERE userid = ?',
  CREATE_USER: 'INSERT INTO User (email,nickname,password) VALUES (?,?,?)',
  CREATE_CHARACTER: 'INSERT INT Characters (userId,charStatId) VALUSE (?,?)',
  UPDATE_USER_LOGIN: 'UPDATE user SET last_login = CURRENT_TIMESTAMP WHERE device_id = ?',
  UPDATE_USER_LOCATION: 'UPDATE user SET x_coord = ?, y_coord = ? WHERE device_id = ?',
  // 쿼리문 추가 [케릭터 관련]
  CREATE_CHARACTER:
    'INSERT INTO Characters (userId, charStatId, gold, level, exp) VALUES (?, ?, ?, ?, ?)',
  UPDATE_CHARACTER:
    'UPDATE Characters SET charStatId = ?, gold = ?, level =?, exp =? WHERE userId = ?',
  FIND_CHARACTER_BY_USER_ID:
    'SELECT ch.*, cs.* FROM Characters ch JOIN CharacterStats cs ON ch.charStatId = cs.id WHERE ch.userId = ?',
  FIND_CHARACTER_STATS_BY_ID: 'SELECT * FROM CharacterStats WHERE id = ?',
};

