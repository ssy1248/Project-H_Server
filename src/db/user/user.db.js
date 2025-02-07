import pools from '../database.js';
import { SQL_QUERIES } from './user.queries.js';
import { toCamelCase } from '../../utils/transformCase.js';

// 유저 찾기
export const findUserEmail = async (email) => {
  return await pools.USER_DB.query(SQL_QUERIES.FIND_USER_BY_DEVICE_ID, [email]);
};
// 유저 생성
export const createUser = async (email, nickname, password) => {
  const connection = await pools.USER_DB.getConnection();
  // 사용자 생성 쿼리 실행
  const user = await connection.execute(SQL_QUERIES.CREATE_USER, [email, nickname, password]);
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
export const createCharacter = async(userId, charStatId, gold, level, exp) => {
  const [result] = await pools.USER_DB.query(SQL_QUERIES.CREATE_CHARACTER, [userId, charStatId, gold, level, exp]);
  
  // 해당 테이블의 id값을 반환 (성공여부 확인용)
  return result.insertId;
} 

// 케릭터 업데이트. 
export const updateCharacter = async (userId, charStatId, gold, level, exp) => {
  const [result] = await pools.USER_DB.query(SQL_QUERIES.UPDATE_CHARACTER, [charStatId, gold, level, exp, userId]);

  // 쿼리가 변경하거나 영향을 준 행의 개수를 검사 (업데이트 성공여부 확인용)
  return result.affectedRows > 0;
}

// userId로 케릭터 정보, 스텟을 가져오는 함수.
export const findCharacterByUserId = async (id) => {
  // 케릭터 정보, 스텟 을 담을 배열
  const [characterInfo] = await pools.USER_DB.query(SQL_QUERIES.FIND_CHARACTER_BY_USER_ID, [id])

  // 만약에 읽어온 값이 0일 경우 null 반환.
  return characterInfo.length > 0 ? characterInfo[0] : null;
}

// 클래스로 원본 클래스 정보 가져오는 함수
export const findCharacterStatsById = async (id) => {
  // 클래스 원본 스텟을 담을 배열.
  const [characterStatInfo] = await pools.USER_DB.query(SQL_QUERIES.FIND_CHARACTER_STATS_BY_ID, [id])

  // 만약에 읽어온 값이 0일 경우 null 반환.
  return characterStatInfo.length > 0 ? characterStatInfo[0] : null;
}