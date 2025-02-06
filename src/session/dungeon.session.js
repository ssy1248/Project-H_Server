import Dungeon from '../classes/models/dungeon.class.js';
import { dungeonSessions } from './sessions.js';

//던전 세션 추가
export const addDungeonSession = (id) => {
  const session = new Dungeon(id);
  dungeonSessions.push(session);
  return session;
};

//던전세션 제거
export const removeDungeonSession = () => {
  //이 dungeonSessions은 던전 고유 아이디를 받아서 삭제 해야한다.
  //아마 마지막 한명이 던전을 나갈떄 던전 고유 아이디를 받아서 삭제 시키면 될것 같다. 
};

//특정 던전세션 찾기
export const getDungeonSession = () => {
  return dungeonSessions[0];
};
