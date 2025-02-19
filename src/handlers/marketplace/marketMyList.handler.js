import { PACKET_TYPE } from '../../constants/header.js';
import { getUserBySocket } from '../../session/user.session.js';
import { createResponse } from '../../utils/response/createResponse.js';

//인벤토리 서버내에 있는거 가져가기 갱신 개념 이게 갱신이 인벤토리 갱신이 됩니다.
const marketMyListHandler = (socket, payload) => {
  const { page, count } = payload;
  if (count === 0) {
    return;
  }
  const user = getUserBySocket(socket);
  const inventory = user.inventory.getInventory();
  const data = [];
  for (let i = (page - 1) * count; i < page * count; i++) {
    if (!inventory.length <= i) {
      if (inventory[i].equiped === 0) {
        data.push({
          id: inventory[i].id,
          price: inventory[i].price,
          itemType: inventory[i].itemType,
          name: inventory[i].name,
          stat: inventory[i].stat,
          equiped: inventory[i].equiped,
          rarity: inventory[i].rarity,
        });
      }
    }
  }
  const maxPage = inventory.length / count;
  const packet = createResponse('town', 'S_MarketMyList', PACKET_TYPE.S_MARKETMYLIST, {
    MaxPage: maxPage,
    itemdata: data,
  });
  socket.write(packet);
};
export default marketMyListHandler;
