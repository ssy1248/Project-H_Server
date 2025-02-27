import { handleMonsterArrivalPacket } from '../../../classes/managers/monster.manager.js';

const monsterSyncHandler = (socket, packetData) => {
  // 0. 페킷데이터 구조분해 할당.
  const { monstId, transformInfo} = packetData;
  //handleMonsterArrivalPacket(monstId, transformInfo);
};

export default monsterSyncHandler;