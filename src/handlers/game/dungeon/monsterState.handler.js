import { createResponse } from '../../../utils/response/createResponse.js';

// 여기 핸들러 들은 클라 응답 받고 처리해주는 핸들러가 아님
const setMosterHpHandler = async (data) => {
  const packet = createResponse('dungeon', 'S_SetMonsterHpData');
};
