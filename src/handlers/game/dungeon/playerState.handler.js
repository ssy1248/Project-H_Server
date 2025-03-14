import { PACKET_TYPE } from '../../../constants/header.js';
import { getUserByNickname } from '../../../session/user.session.js';
import { createResponse } from '../../../utils/response/createResponse.js';

// 여기 핸들러 들은 클라 응답 받고 처리해주는 핸들러가 아님
export const setPlayerHpHandler = async (playerName) => {
  try {
    const user = getUserByNickname(playerName);
    if (!user) {
      throw new Error('해당 유저가 없습니다.');
    }
    const userData = user.inventory.addAllStat(user.playerStatInfo);
    return createResponse('dungeon', 'S_SetPlayerHpData', PACKET_TYPE, {
      userId: user.userInfo.userId,
      hp: userData.hp,
    });
  } catch (err) {
    console.log(err);
  }
};

export const setPlayerstateHandler = async (playerName) => {
  try {
    const user = getUserByNickname(playerName);
    if (!user) {
      throw new Error('해당 유저가 없습니다.');
    }
    const userData = user.inventory.addAllStat(user.playerStatInfo);
    const playerData = {
      level: user.playerInfo.level,
      hp: userData.hp,
      maxHp: userData.maxHP,
      mp: userData.mp,
      maxMp: userData.maxMp,
      atk: userData.atk,
      def: userData.def,
      speed: userData.speed,
    };
    return createResponse('dungeon', 'S_SetPlayerData', PACKET_TYPE, {
      userId: user.userInfo.userId,
      playerData,
    });
  } catch (err) {
    console.log(err);
  }
};
