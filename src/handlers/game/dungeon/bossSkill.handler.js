import { handleBossSkill } from '../../../movementSync/movementSync.manager.js';

export const bossSkillHandler = (socket, packetData) => {
  const { bossId, type, currentPosition, skill_range } = packetData;

  handleBossSkill('dungeon1', bossId, type, currentPosition,  skill_range);
};

export default bossSkillHandler;

