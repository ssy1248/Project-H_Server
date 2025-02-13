import { getUserBySocket } from '../../session/user.session.js';
import { createResponse } from '../../utils/response/createResponse.js';
//판매 목록 올리기
const sellInMarketHandler = (socket, payload) => {
  const { inventoryId } = payload;
  const user = getUserBySocket(socket);
  //인벤토리에 있는지 확인 필요
};
export default sellInMarketHandler;
