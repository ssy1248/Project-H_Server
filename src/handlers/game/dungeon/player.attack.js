import CustomError from '../../../utils/error/customError.js';
import { ErrorCodes } from '../../../utils/error/errorCodes.js';
import { handlerError } from '../../../utils/error/errorHandler.js';
import { createResponse } from '../../../utils/response/createResponse.js';
import { PACKET_TYPE } from '../../../constants/header.js';
import { getUserById } from '../../../session/user.session.js';
import { getDungeonInPlayerName } from '../../../session/dungeon.session.js';

const playerAttackHandler = (socket, packetData) => {
  try {
    const {} = packetData;

    // 유저 정보 확인
    const user = getUserById(socket);

    if (!user) {
      console.error('공격자를 찾을 수 없습니다.');
      return;
    }

    const userNickName = user.userInfo.nickname;

    // 쿨타임 체크
    const cooltime = attackDelayCalculate(userNickName);
    if (!cooltime) {
      console.log('쿨타임 중입니다.');
      return;
    }

    // 던전 찾기
    const dungeon = getDungeonInPlayerName(userNickName);

    // 플레이어, 위치, 상태 정보 가져오기
    const players = dungeon.players[userNickName];
    const userPosition = dungeon.playersTransform[userNickName];
    const userStatus = dungeon.playerStatus[userNickName];

    //x,y,z좌표
    const position = [userPosition.x, userPosition.y, userPosition.z];

    //방향 백터는 direction으로 받아온 데이터 저장

    const maxDisatnce = players.normalAttack.attackRange;

    // 몬스터 정보 추출 (가정)
    const monsterId = packetData.monsterId || null;
    const monster = getMonsterById(monsterId);
    if (!monster) {
      console.error('몬스터를 찾을 수 없습니다.');
      return;
    }

    // 화살을 던전에서 생성
    if (players.playerClass === 'Archer') {
      dungeon.createArrow(userNickName, position, direction, speed, maxDisatnce);
    }

    // 화살 이동 처리 (Dungeon의 moveArrow 메서드 사용)
    dungeon.moveArrow(userNickName); // 던전 내 메서드 호출로 화살 이동 처리

    // 몬스터와의 충돌 체크 및 피해 처리
    // 던전에서 해당 플레이어의 화살 목록을 가져옵니다.
    const arrows = dungeon.getPlayerArrows(userNickName);
    // 각 화살에 대해 반복문을 돌며 처리합니다.
    arrows.forEach((arrow) => {
      // 화살의 현재 위치를 가져옵니다.
      let arrowPosition = arrow.position;
      // 화살의 이동 방향을 나타내는 벡터를 가져옵니다.
      let arrowDirection = arrow.direction;

      // 몬스터의 위치를 가져옵니다.
      let monsterPosition = [monster.position.x, monster.position.y, monster.position.z];

      // 두 벡터의 차이를 구하는 함수 (벡터 a와 b를 뺀 결과를 반환)
      const vectorSubtract = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];

      // 벡터의 크기(길이)를 계산하는 함수 (피타고라스의 정리를 사용하여 벡터의 길이를 계산)
      const vectorMagnitude = (v) => Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);

      // 두 벡터 간의 거리를 계산하는 함수 => 벡터 a와 b의 거리를 반환
      const vectorDistance = (a, b) => vectorMagnitude(vectorSubtract(a, b));

      // 화살 이동 처리 (화살이 arrowDirection 방향으로 이동)
      arrowPosition = [
        arrowPosition[0] + arrowDirection[0] * arrow.speed,
        arrowPosition[1] + arrowDirection[1] * arrow.speed,
        arrowPosition[2] + arrowDirection[2] * arrow.speed,
      ];

      // 화살과 몬스터가 충돌했는지 확인하는 조건문
      if (vectorDistance(arrowPosition, monsterPosition) < 1) {
        // 화살과 몬스터의 거리가 1보다 작으면 충돌로 간주
        console.log('화살과 몬스터가 충돌했습니다!'); // 화살이 몬스터와 충돌했다는 로그 출력
        handleMonsterDamage(monster, userStatus, players); // 몬스터에게 피해를 주는 함수 호출
      }
    });

    // 공격 처리 함수
    const handleMonsterDamage = (monster, userStatus, players) => {
      const randomFactors = [0.8, 0.9, 1, 1.1, 1.2];
      const randomFactor = randomFactors[Math.floor(Math.random() * randomFactors.length)];
      const attack = userStatus.atk * players.normalAttack.damage * randomFactor;

      monster.hp -= attack;
      console.log(`몬스터에게 ${attack}의 피해를 입혔습니다. 남은 체력: ${monster.hp}`);

      if (monster.hp <= 0) {
        console.log('몬스터가 처치되었습니다!');
        handleMonsterDeath(monster);
      }
    };
  } catch (error) {
    console.error('공격 처리 중 오류 발생:', error);
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

export default playerAttackHandler;
