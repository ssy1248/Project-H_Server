import { matchSessions } from './sessions.js';
import Match from '../classes/models/match.class.js';

export const addMatchSession = () => {
  const session = new Match();
  matchSessions.push(session);
  return session;
};

// 세션에서 유저를 찾는 함수 -> 매치를 돌리는 중인지 확인을 위한

// 매치 중간 취소를 위한 세션에서 유저를 찾아서 삭제하는 함수

// 매치 세션을 보여주는 함수? ex) getAllMatchSession

export const removeMatchSession = (id) => {
  const index = matchSessions.findIndex((session) => session.id === id);
  if (index !== -1) {
    return matchSessions.splice(index, 1)[0];
  }
};
