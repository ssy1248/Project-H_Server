import { handleBossSkill } from '../../../movementSync/movementSync.manager.js';

export const bossSkillHandler = (socket, packetData) => {
  const { bossId } = packetData;
  handleBossSkill('town', bossId, packetData);
};

export default bossSkillHandler;

