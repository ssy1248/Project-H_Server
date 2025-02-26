import { removeDungeonSession } from '../../session/dungeon.session.js';
import { getUserBySocket } from '../../session/user.session.js';
import spawnUserHandler from './spawnUser.handler.js';

// 던전에서 마을로 생성 패킷
const respawnUserHandler = async (socket) => {
  try {
    const user = getUserBySocket(socket);
    if (!user) {
      throw new Error('해당 유저가 없습니다!');
    }
    // 4명이 모두 나가면 삭제 하는 로직 필요.
    // 파티 유지 폭파 정하기.
    //removeDungeonSession(user.inDungeonId);
    user.inDungeonId = '';
    spawnUserHandler(socket, { class: user.playerInfo.playerClass });
  } catch (err) {
    console.log(err);
  }
};

export default respawnUserHandler();
