import pools from '../database.js';
import { SQL_QUERIES } from './user.queries.js';
import { toCamelCase } from '../../utils/transformCase.js';

// 유저 찾기
export const findUserEmail = async (email) => {
  const [data] = await pools.USER_DB.execute(SQL_QUERIES.FIND_USER, [email]);
  return data[0] || null;
};
// 유저 생성
export const createUser = async (email, nickname, password) => {
  const user = await pools.USER_DB.execute(SQL_QUERIES.CREATE_USER, [email, nickname, password]);
  if (user) {
    return { success: true };
  }
  return { success: false };
};

export const updateUserLogin = async (id) => {
  await pools.USER_DB.query(SQL_QUERIES.UPDATE_USER_LOGIN, [id]);
};

export const updateUserLocation = async (x, y, id) => {
  await pools.USER_DB.query(SQL_QUERIES.UPDATE_USER_LOCATION, [x, y, id]);
};

// 케릭터 생성.
export const createCharacter = async (userId, charStatId) => {
  const [result] = await pools.USER_DB.query(SQL_QUERIES.CREATE_CHARACTER, [userId, charStatId]);

  // 해당 테이블의 id값을 반환 (성공여부 확인용)
  return result.insertId;
};

// 케릭터 업데이트.
export const updateCharacter = async (userId, charStatId, gold, level, exp) => {
  const [result] = await pools.USER_DB.query(SQL_QUERIES.UPDATE_CHARACTER, [
    gold,
    level,
    exp,
    userId,
    charStatId,
  ]);

  // 쿼리가 변경하거나 영향을 준 행의 개수를 검사 (업데이트 성공여부 확인용)
  return result.affectedRows > 0;
};

// userId, charStatId로 케릭터 정보, 스텟을 가져오는 함수.
export const findCharacterByUserAndStatId = async (userId, charStatId) => {
  // 케릭터 정보, 스텟 을 담을 배열
  const [characterInfo] = await pools.USER_DB.query(
    SQL_QUERIES.FIND_CHARACTER_BY_USER_AND_STAT_ID,
    [userId, charStatId],
  );

  // 만약에 읽어온 값이 0일 경우 null 반환.
  return characterInfo.length > 0 ? characterInfo[0] : null;
};

// 클래스로 원본 클래스 정보 가져오는 함수
export const findCharacterStatsById = async (id) => {
  // 클래스 원본 스텟을 담을 배열.
  const [characterStatInfo] = await pools.USER_DB.query(SQL_QUERIES.FIND_CHARACTER_STATS_BY_ID, [
    id,
  ]);

  // 만약에 읽어온 값이 0일 경우 null 반환.
  return characterStatInfo.length > 0 ? characterStatInfo[0] : null;
};

// 케릭터 스텟 컬럼명만 가져오기.
export const getTableStructure = async () => {
  const query = 'DESCRIBE CharacterStats';
  const [results] = await pools.USER_DB.query(query);
  return results.map(column => column.Field); // 컬럼명만 반환
};

export const insertCharacterStats = async (hp, mp, atk, def, speed) => {
  const [result] = await pools.USER_DB.query(SQL_QUERIES.INSERT_CHARACTER_STATS, [hp, mp, atk, def, speed]);
  return result.insertId;
}

export const getCharacterStatsCount = async () => {
  const [rows] = await pools.USER_DB.query(SQL_QUERIES.COUNT_CHARACTERSTATTABLE);
  return rows[0].count; // rows[0].count 값이 현재 행의 수입니다.
};