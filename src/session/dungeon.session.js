import Dungeon from '../classes/models/dungeon.class.js';
import { dungeonSessions } from './sessions.js';

export const adddungeonSession = (id) => {
  const session = new Dungeon(id);
  dungeonSessions.push(session);
  return session;
};

export const removedungeonSession = () => {
  delete dungeonSessions[0];
};

export const getGameSession = () => {
  return dungeonSessions[0];
};
