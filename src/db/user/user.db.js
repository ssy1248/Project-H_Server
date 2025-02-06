import pools from '../database.js';
import { SQL_QUERIES } from './user.queries.js';
import { toCamelCase } from '../../utils/transformCase.js';

export const findUserEmail = async (email) => {
  return await pools.USER_DB.query(SQL_QUERIES.FIND_USER_BY_DEVICE_ID, [email]);
};

export const createUser = async (email, nickname, password) => {
  const connection = await pools.USER_DB.getConnection();

  try {
    // 트랜잭션 시작
    await connection.beginTransaction();

    // 사용자 생성 쿼리 실행
    const user = await connection.execute(SQL_QUERIES.CREATE_USER, [email, nickname, password]);

    await connection.execute(SQL_QUERIES.CREATE_CHARACTER, [user.id, 1]);
    await connection.execute(SQL_QUERIES.CREATE_CHARACTER, [user.id, 2]);
    await connection.execute(SQL_QUERIES.CREATE_CHARACTER, [user.id, 3]);
    await connection.execute(SQL_QUERIES.CREATE_CHARACTER, [user.id, 4]);
    await connection.execute(SQL_QUERIES.CREATE_CHARACTER, [user.id, 5]);

    // 모든 쿼리가 성공하면 트랜잭션 커밋
    await connection.commit();
    return { success: true };
  } catch (error) {
    // 에러 발생 시 롤백
    await connection.rollback();
    return { success: false };
  } finally {
    // 연결을 반환하여 연결 풀에서 사용할 수 있도록 함
    connection.release();
  }
};

export const updateUserLogin = async (id) => {
  await pools.USER_DB.query(SQL_QUERIES.UPDATE_USER_LOGIN, [id]);
};

export const updateUserLocation = async (x, y, id) => {
  await pools.USER_DB.query(SQL_QUERIES.UPDATE_USER_LOCATION, [x, y, id]);
};
