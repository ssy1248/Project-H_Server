import Dungeon from '../classes/models/dungeon.class.js';
import { dungeonSessions } from './sessions.js';

//던전 세션 추가
export const addDungeonSession = (id, index, users) => {
  const session = new Dungeon(id, index, users);
  dungeonSessions.push(session);
  return session;
};

//던전세션 제거
export const removeDungeonSession = (id) => {
  const index = dungeonSessions.findIndex((session) => session.id === id);
  if (index !== -1) {
    return gameSessions.splice(index, 1)[0];
  }
};

//특정 던전세션 찾기
export const getDungeonSession = (id) => {
  return dungeonSessions.find((session) => session.id === id);
};

//던전에 있는 유저 찾기
export const getDungeonUser = (userId) => {
  const dungeons = dungeonSessions.filter((dungeon) => {
    return dungeon.users.some((user) => user.userInfo.userId === userId);
  });

  return dungeons;
};

export const getDungeonInPlayerName = (playerName) => {
  const dungeons = dungeonSessions.filter((dungeon) => {
    return dungeon.partyInfo.Players.some((player) => player.playerName === playerName);
  });

  return dungeons;
}
