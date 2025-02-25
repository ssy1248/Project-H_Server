import CustomError from '../../../utils/error/customError.js';
import { ErrorCodes } from '../../../utils/error/errorCodes.js';
import { handlerError } from '../../../utils/error/errorHandler.js';

import { createResponse } from '../../../utils/response/createResponse.js';
import { PACKET_TYPE } from '../../../constants/header.js';
import { getUserById } from '../../../session/user.session.js';
import { getDungeonInPlayerName } from '../../../session/dungeon.session.js';

const playerAttack = (socket, packetData) => {
  try {
    //몬스터아이디를 보내는것도 좋겠다 없으면 그냥 없거나 null을 보내고
    const {} = packetData;
    //유저오 유저 클래스 확인
    const user = getUserById(socket);

    //유저가 없을 경우
    if (!user) {
      console.error('공격자을 찾을 수 없습니다.');
      return;
    }
    //이 유저로 닉네임을 찾는다.
    const userNickName = user.userInfo.nickname;

    //const monster

    //쿨타임 체크
    const cooltime = attackDelayCalculate(userNickName);
    if (!cooltime) {
      console.log('쿨타임 중입니다.');
    }

    //닉네임으로 던전세션을 찾고
    const dungeon = getDungeonInPlayerName(attackerName);

    //players와 userPosition
    const players = dungeon.players[userNickName];
    const userPosition = dungeon.playersTransform[userNickName];
    const userStatus = dungeon.playerplayerStatus[userNickName];

    //이것도 만약 몬스터가 있으면 으로 조건을 넣어서 밑의 사거리 계산을 하는것도 좋다
    // 몬스터 포지션 찾기
    // const monsterPosition

    //유저와 몬스터 사이의 거리를 계산
    const dx = userPosition.x - monsterPosition.x;
    const dy = userPosition.y - monsterPosition.y;
    const dz = userPosition.z - monsterPosition.z;
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

    //사거리 체크
    if (distance > players.normalAttack.attackRange) {
      console.log('타겟이 공격 범위 밖에 있습니다.');
      return;
    }

    //몬스터 공격 유저의 공격력 * 클래스 노말스킬 공격력 * 랜덤한 보정치
    const randomFactors = [0.8, 0.9, 1, 1.1, 1.2]; // 선택 가능한 값들
    const randomFactor = randomFactors[Math.floor(Math.random() * randomFactors.length)]; // 랜덤으로 선택

    const attack = userStatus.atk * players.normalAttack.damage * randomFactor;

    //monster.hp
    monater.hp -= attack;

    socket.write();
  } catch (e) {
    handlerError(socket, e);
  }
};

export const playerSkill = (socket, packetData) => {
  try {
    // 궁수의 경우에는 스텟버프였지
    const user = getUserById(socket);

    // 유저가 없을 경우
    if (!user) {
      console.error('공격자를 찾을 수 없습니다.');
      return;
    }

    // 닉네임으로 던전 세션을 찾고
    const dungeon = getDungeonInPlayerName(userNickName); // attackerName을 userNickName으로 수정해야할 수도 있음

    //플레이어 공격력,방어력,스피드 가져오기
    const playerAtk = dungeon.getPlayerAtk(userNickName);
    const playerDef = dungeon.getPlayerDef(userNickName);
    const playerSpeed = dungeon.getPlayerSpeed(userNickName);

    // 10% 증가시키기 위한 증가값 계산
    const atkIncrease = playerAtk * 0.1;
    const defIncrease = playerDef * 0.1;
    const speedIncrease = playerSpeed * 0.1;

    // 20초 동안 증가된 스탯을 적용하는 함수
    function increasePlayerStats() {
      // 10% 증가시킨 값으로 설정
      dungeon.setPlayerAtk(userNickName, playerAtk + atkIncrease);
      dungeon.setPlayerDef(userNickName, playerDef + defIncrease);
      dungeon.setPlayerSpeed(userNickName, playerSpeed + speedIncrease);

      // 20초 후, 원래 값으로 되돌리기
      setTimeout(() => {
        dungeon.setPlayerAtk(userNickName, playerAtk);
        dungeon.setPlayerDef(userNickName, playerDef);
        dungeon.setPlayerSpeed(userNickName, playerSpeed);
      }, 20000); // 20초 후
    }

    // 스탯 증가 함수 호출
    increasePlayerStats();
  } catch (e) {
    handlerError(socket, e);
  }
};

export const playerDodge = () => {
  try {
  } catch (e) {
    handlerError(socket, e);
  }
};
const attackDelayCalculate = (attackerName) => {
  // attackerName을 포함하는 던전 세션들을 찾습니다.
  const dungeons = getDungeonInPlayerName(attackerName);
  if (!dungeons || dungeons.length === 0) {
    console.error('해당 플레이어를 포함하는 던전 세션을 찾을 수 없습니다.');
    return null;
  }

  // 예시로 첫 번째 던전 세션을 사용합니다.
  const dungeon = dungeons[0];

  // 던전 세션에서 Players 배열(Players 클래스 인스턴스 배열)에서 attackerName과 일치하는 플레이어를 찾습니다.
  const player = dungeon.players.find((p) => p.partyData.playerName === attackerName);
  if (!player) {
    console.error('던전 세션 내에서 해당 플레이어를 찾을 수 없습니다.');
    return null;
  }

  // 플레이어의 기본 공격 쿨타임을 밀리초로 변환하여 반환합니다.
  const delay = player.normalAttack.attackCoolTime * 1000;
  return delay;
};

const skillDelayCalculate = (attackerName) => {
  // attackerName을 포함하는 던전 세션들을 찾습니다.
  const dungeons = getDungeonInPlayerName(attackerName);
  if (!dungeons || dungeons.length === 0) {
    console.error('해당 플레이어를 포함하는 던전 세션을 찾을 수 없습니다.');
    return null;
  }

  // 예시로 첫 번째 던전 세션을 사용합니다.
  const dungeon = dungeons[0];

  // 던전 세션에서 Players 배열(Players 클래스 인스턴스 배열)에서 attackerName과 일치하는 플레이어를 찾습니다.
  const player = dungeon.players.find((p) => p.partyData.playerName === attackerName);
  if (!player) {
    console.error('던전 세션 내에서 해당 플레이어를 찾을 수 없습니다.');
    return null;
  }

  // 플레이어의 기본 공격 쿨타임을 밀리초로 변환하여 반환합니다.
  const delay = player.skillAttack.attackCoolTime * 1000;
  return delay;
};

export default playerAttack;
