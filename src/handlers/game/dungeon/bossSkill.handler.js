import { handleBossSkill } from '../../../movementSync/movementSync.manager.js';
import { getUserBySocket } from '../../../session/user.session.js';

export const bossSkillHandler = (socket, packetData) => {
  const { bossId } = packetData;
  const user = getUserBySocket(socket);
  handleBossSkill(user.inDungeonId, bossId, packetData);
};

export default bossSkillHandler;
