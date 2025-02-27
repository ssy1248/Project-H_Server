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

    const { direction } = packetData;

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
    const speed = packetData.speed || 1; // 기본 속도 1로 설정

    const maxDisatnce = players.normalAttack.attackRange;

    // Archer 클래스 플레이어일 때만 화살을 생성
    if (players.playerClass === 'Archer') {
      console.log('Archer인 플레이어, 화살을 생성합니다.');
      arrowId = dungeon.createArrow(userNickName, position, direction, speed, maxDisatnce); // 화살 ID 반환 받기
    }

    // 화살 이동 처리 (Dungeon의 moveArrow 메서드 사용)
    dungeon.moveArrow(userNickName); // 던전 내 메서드 호출로 화살 이동 처리

    //이런 다음에 화살 아이디만 보내주면 되겠다
    console.log('생성된 화살 ID:', arrowId);
  } catch (error) {
    console.error('playerAttackHandler 오류:', error);
  }
};

export const playerArrowAttack = (socket, packetData) => {
  try {
    const { monsterId, arrowId } = packetData;
    // 유저 정보 확인
    const user = getUserById(socket);
    console.log('user:', user);

    if (!user) {
      console.error('공격자를 찾을 수 없습니다.');
      return;
    }

    //유저 닉네임 찾기
    const userNickName = user.userInfo.nickname;

    // 현재 던전 정보를 가져옵니다.
    const dungeon = getDungeonInPlayerName(userNickName);
    console.log('dungeon:', dungeon);

    // 던전 내 화살 목록에서 arrowId를 이용해 화살 찾기
    const arrow = getArrowById(arrowId);
    console.log('arrow', arrow);

    // 몬스터와의 충돌 여부 확인
    const collisionOccurred = dungeon.checkArrowCollision(arrow, monsterId);
    console.log('collide', collisionOccurred);

    if (collisionOccurred) {
      const userStatus = dungeon.playerStatus[userNickName];
      const players = dungeon.players[userNickName];

      // 공격 처리 함수

      //대미지 계산하기 위해서
      const randomFactors = [0.8, 0.9, 1, 1.1, 1.2];
      const randomFactor = randomFactors[Math.floor(Math.random() * randomFactors.length)];
      const attack = userStatus.atk * players.normalAttack.damage * randomFactor;

      //아직 몬스터에 대한건 없다

      console.log(`몬스터에게 ${attack}의 피해를 입혔습니다.`);
      monster.hp -= attack;
      console.log(`남은 체력: ${monster.hp}`);

      if (monster.hp <= 0) {
        console.log('몬스터가 처치되었습니다!');
        //여기에 몬스터 죽어서 삭제 처리 넣고

        //여기서 null이면 몬스터 죽었다고 알리면 된다.
        return null;
      } else {
        //0이 아닐떄
        return monster.hp;
      }
    } else {
      console.error('몬스터가 멀리 있습니다');
    }

    socket.write();
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
