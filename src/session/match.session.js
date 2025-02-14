import { matchSessions } from './sessions';
import Match from '../classes/models/match.class';

export const addMatchSession = (dungeonIndex) => {
  const session = new Match(dungeonIndex);
  matchSessions.push(session);
  return session;
};

export const getMatchSession = (dungeonIndex) => {
  return matchSessions.find((session) => session.dungeonIndex === dungeonIndex);
};

export const removeMatchSession = (id) => {
  const index = matchSessions.findIndex((session) => session.id === id);
  if (index !== -1) {
    return matchSessions.splice(index, 1)[0];
  }
};
