import { PACKET_TYPE } from '../../constants/header.js';
import { getUserBySocket } from '../../session/user.session.js';
import { createResponse } from '../../utils/response/createResponse.js';

const userStateHandler = (socket, _) => {
  try {
    const user = getUserBySocket(socket);
    if (!user) {
      throw new Error('해당 유저가 없습니다.');
    }
    const userData = user.inventory.addAllStat(user.playerStatInfo);
    const packet = createResponse('user', 'S_SetUserState', PACKET_TYPE.S_SETUSERSTATE, {
      data: {
        level: user.playerInfo.level,
        hp: userData.hp,
        maxHp: userData.maxHp,
        mp: userData.mp,
        maxMp: userData.maxMp,
        atk: userData.atk,
        def: userData.def,
        speed: userData.speed,
      },
      exp: user.playerInfo.exp,
    });
    socket.write(packet);
  } catch (err) {
    console.log(err);
  }
};
export default userStateHandler;
