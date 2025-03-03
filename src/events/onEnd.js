import {
  removeUser,
  getUserBySocket,
  broadcastToUsersAsync,
  broadcastTownOtherUsers,
} from '../session/user.session.js';
import { getGameSession } from '../session/game.session.js';
import { updateCharacter } from '../db/user/user.db.js';
import { deleteEntitySync } from '../classes/managers/movementSync.manager.js';
import { deleteUser } from '../movementSync/movementSync.manager.js';
import { createResponse } from '../utils/response/createResponse.js';
import { PACKET_TYPE } from '../constants/header.js';

export const onEnd = (socket) => async () => {
  console.log('클라이언트 연결이 종료되었습니다.');

  // 유저 처리.
  clearUser(socket);

  // const gameSession = getGameSession();
  // gameSession.removeUser(socket);
};

// 유저 처러.
const clearUser = async (socket) => {
  try {
    // 해당 케릭터 정보 db 업데이트
    const user = getUserBySocket(socket);

    const userInfo = user.getUserInfo();
    const playerInfo = user.getPlayerInfo();

    // 삭제.
    //deleteEntitySync('town', userInfo.userId, "user");
    deleteUser('town', userInfo.userId);
    deleteUser('dungeon1', userInfo.userId);

    // 스폰 되어있는 클라이언트가 종료했을경우.
    if (playerInfo.isSpawn) {
      // DB에 업데이트
      await updateCharacter(
        userInfo.userId,
        playerInfo.playerClass,
        playerInfo.gold,
        playerInfo.level,
        playerInfo.exp,
      );
    }

    // 세션에서 유저 삭제
    removeUser(socket);
    const packet = createResponse('user', 'S_Despawn', PACKET_TYPE.S_DESPAWN, {
      playerId: userInfo.userId,
    });
    if (user.inDungeonId === '') {
      broadcastTownOtherUsers(socket, packet);
      return;
    }
  } catch (error) {
    console.error('에러 :', error);
  }
};
