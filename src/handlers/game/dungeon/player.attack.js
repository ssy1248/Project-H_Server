import CustomError from '../../../utils/error/customError.js';
import { ErrorCodes } from '../../../utils/error/errorCodes.js';
import { handlerError } from '../../../utils/error/errorHandler.js';
import { createResponse } from '../../../utils/response/createResponse.js';
import { PACKET_TYPE } from '../../../constants/header.js';
import { getUserById } from '../../../session/user.session.js';
import { getDungeonInPlayerName } from '../../../session/dungeon.session.js';

const playerAttackHandler = (socket, packetData) => {
  try {
    console.log('playerAttackHandler 시작');

    const {} = packetData;

    // 유저 정보 확인
    const user = getUserById(socket);
    console.log('user:', user);

    if (!user) {
      console.error('공격자를 찾을 수 없습니다.');
      return;
    }

    const userNickName = user.userInfo.nickname;
    console.log('userNickName:', userNickName);

    // 쿨타임 체크
    const cooltime = attackDelayCalculate(userNickName);
    console.log('cooltime:', cooltime);
    if (!cooltime) {
      console.log('쿨타임 중입니다.');
      return;
    }

    // 던전 찾기
    const dungeon = getDungeonInPlayerName(userNickName);
    console.log('dungeon:', dungeon);

    // 플레이어, 위치, 상태 정보 가져오기
    const players = dungeon.players[userNickName];
    const userPosition = dungeon.playersTransform[userNickName];
    const userStatus = dungeon.playerStatus[userNickName];

    console.log('players:', players);
    console.log('userPosition:', userPosition);
    console.log('userStatus:', userStatus);

    // x, y, z 좌표
    const position = { x: userPosition.x, y: userPosition.y, z: userPosition.z };
    console.log('position:', position);

    // 방향 백터는 direction으로 받아온 데이터 저장
    const direction = packetData.direction; // packetData에서 direction 정보 받아오기
    const speed = packetData.speed || 1; // 기본 속도 1로 설정

    const maxDisatnce = players.normalAttack.attackRange;

    // 몬스터 정보 추출 (가정)
    const monsterId = packetData.monsterId;
    const monster = getMonsterById(monsterId);
    console.log('monster:', monster);
    if (!monster) {
      console.error('몬스터를 찾을 수 없습니다.');
      return;
    }

    // 화살을 던전에서 생성
    if (players.playerClass === 'Archer') {
      console.log('Archer인 플레이어, 화살을 생성합니다.');
      dungeon.createArrow(userNickName, position, direction, speed, maxDisatnce);
    }

    // 화살 이동 처리 (Dungeon의 moveArrow 메서드 사용)
    dungeon.moveArrow(userNickName); // 던전 내 메서드 호출로 화살 이동 처리

    // 몬스터와의 충돌 체크 및 피해 처리
    const arrows = dungeon.getPlayerArrows(userNickName);
    console.log('arrows:', arrows);
    arrows.forEach((arrow) => {
      // 화살의 현재 위치를 가져옵니다.
      let arrowPosition = arrow.position;
      let arrowDirection = arrow.direction;

      // 몬스터의 위치를 가져옵니다.
      let monsterPosition = { x: monster.position.x, y: monster.position.y, z: monster.position.z };

      console.log('arrowPosition:', arrowPosition);
      console.log('arrowDirection:', arrowDirection);
      console.log('monsterPosition:', monsterPosition);

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

      console.log('new arrowPosition:', arrowPosition);

      // 화살과 몬스터가 충돌했는지 확인하는 조건문
      if (vectorDistance(arrowPosition, monsterPosition) < 1) {
        console.log('화살과 몬스터가 충돌했습니다!');
        handleMonsterDamage(monster, userStatus, players); // 몬스터에게 피해를 주는 함수 호출
      }
    });

    // 공격 처리 함수
    const handleMonsterDamage = (monster, userStatus, players) => {
      const randomFactors = [0.8, 0.9, 1, 1.1, 1.2];
      const randomFactor = randomFactors[Math.floor(Math.random() * randomFactors.length)];
      const attack = userStatus.atk * players.normalAttack.damage * randomFactor;

      console.log(`몬스터에게 ${attack}의 피해를 입혔습니다.`);
      monster.hp -= attack;
      console.log(`남은 체력: ${monster.hp}`);

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
    console.log('playerSkill 시작');

    const user = getUserById(socket);
    console.log('user:', user);

    // 유저가 없을 경우
    if (!user) {
      console.error('공격자를 찾을 수 없습니다.');
      return;
    }

    // 닉네임으로 던전 세션을 찾고
    const dungeon = getDungeonInPlayerName(userNickName);
    console.log('dungeon:', dungeon);

    //플레이어 공격력,방어력,스피드 가져오기
    const playerAtk = dungeon.getPlayerAtk(userNickName);
    const playerDef = dungeon.getPlayerDef(userNickName);
    const playerSpeed = dungeon.getPlayerSpeed(userNickName);

    console.log('playerAtk:', playerAtk);
    console.log('playerDef:', playerDef);
    console.log('playerSpeed:', playerSpeed);

    // 10% 증가시키기 위한 증가값 계산
    const atkIncrease = playerAtk * 0.1;
    const defIncrease = playerDef * 0.1;
    const speedIncrease = playerSpeed * 0.1;

    console.log('atkIncrease:', atkIncrease);
    console.log('defIncrease:', defIncrease);
    console.log('speedIncrease:', speedIncrease);

    // 20초 동안 증가된 스탯을 적용하는 함수
    function increasePlayerStats() {
      // 10% 증가시킨 값으로 설정
      dungeon.setPlayerAtk(userNickName, playerAtk + atkIncrease);
      dungeon.setPlayerDef(userNickName, playerDef + defIncrease);
      dungeon.setPlayerSpeed(userNickName, playerSpeed + speedIncrease);

      console.log('스탯 증가 적용 완료');

      // 20초 후, 원래 값으로 되돌리기
      setTimeout(() => {
        dungeon.setPlayerAtk(userNickName, playerAtk);
        dungeon.setPlayerDef(userNickName, playerDef);
        dungeon.setPlayerSpeed(userNickName, playerSpeed);
        console.log('원래 스탯으로 되돌리기 완료');
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
    console.log('playerDodge 처리 시작');
  } catch (e) {
    handlerError(socket, e);
  }
};

const attackDelayCalculate = (attackerName) => {
  console.log('attackDelayCalculate 시작');

  // attackerName을 포함하는 던전 세션들을 찾습니다.
  const dungeons = getDungeonInPlayerName(attackerName);
  console.log('dungeons:', dungeons);
  if (!dungeons || dungeons.length === 0) {
    console.error('해당 플레이어를 포함하는 던전 세션을 찾을 수 없습니다.');
    return null;
  }

  // 예시로 첫 번째 던전 세션을 사용합니다.
  const dungeon = dungeons[0];

  // 던전 세션에서 Players 배열(Players 클래스 인스턴스 배열)에서 attackerName과 일치하는 플레이어를 찾습니다.
  const player = dungeon.players.find((p) => p.partyData.playerName === attackerName);
  console.log('player:', player);
  if (!player) {
    console.error('던전 세션 내에서 해당 플레이어를 찾을 수 없습니다.');
    return null;
  }

  // 플레이어의 기본 공격 쿨타임을 밀리초로 변환하여 반환합니다.
  const delay = player.normalAttack.attackCoolTime * 1000;
  console.log('delay:', delay);
  return delay;
};

const skillDelayCalculate = (attackerName) => {
  console.log('skillDelayCalculate 시작');

  // attackerName을 포함하는 던전 세션들을 찾습니다.
  const dungeons = getDungeonInPlayerName(attackerName);
  console.log('dungeons:', dungeons);
  if (!dungeons || dungeons.length === 0) {
    console.error('해당 플레이어를 포함하는 던전 세션을 찾을 수 없습니다.');
    return null;
  }

  // 예시로 첫 번째 던전 세션을 사용합니다.
  const dungeon = dungeons[0];

  // 던전 세션에서 Players 배열(Players 클래스 인스턴스 배열)에서 attackerName과 일치하는 플레이어를 찾습니다.
  const player = dungeon.players.find((p) => p.partyData.playerName === attackerName);
  console.log('player:', player);
  if (!player) {
    console.error('던전 세션 내에서 해당 플레이어를 찾을 수 없습니다.');
    return null;
  }

  // 플레이어의 기본 공격 쿨타임을 밀리초로 변환하여 반환합니다.
  const delay = player.skillAttack.attackCoolTime * 1000;
  console.log('delay:', delay);
  return delay;
};

export default playerAttackHandler;
