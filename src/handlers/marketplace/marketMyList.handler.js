import { PACKET_TYPE } from '../../constants/header.js';
import { getUserBySocket } from '../../session/user.session.js';
import { createResponse } from '../../utils/response/createResponse.js';

//인벤토리 서버내에 있는거 가져가기 갱신 개념 이게 갱신이 인벤토리 갱신이 됩니다.
const marketMyListHandler = (socket, payload) => {
  const { page, count } = payload;
  const user = getUserBySocket(socket);
  const data = [];
  for (let i = (page - 1) * count; i < (page - 1) * count + count; i++) {
    if (user.inventory.lenght > i) {
      data.push(user.inventory[i]);
    }
  }

  const packet = createResponse('town', 'S_marketMyList', PACKET_TYPE.S_MARKETMYLIST, {
    MaxPage: user.inventory.lenght > 0 ? parseInt(user.inventory.lenght / page) : 0,
    itemdata: data,
  });
  socket.write(packet);
};
export default marketMyListHandler;
