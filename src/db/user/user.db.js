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
