import CustomError from '../../../utils/error/customError.js';
import { ErrorCodes } from '../../../utils/error/errorCodes.js';
import { handlerError } from '../../../utils/error/errorHandler.js';
import { createResponse } from '../../../utils/response/createResponse.js';
import { PACKET_TYPE } from '../../../constants/header.js';
import { getUserById } from '../../../session/user.session.js';
import { getDungeonInPlayerName } from '../../../session/dungeon.session.js';
import { getMonster } from '../../../session/monster.session.js';

//공격을 할떄 (플레이어가 공격을 할떄)
const playerRangedAttackHandler = (socket, packetData) => {
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
    // const cooltime = attackDelayCalculate(userNickName);
    // console.log('cooltime:', cooltime);
    // if (!cooltime) {
    //   console.log('쿨타임 중입니다.');
    //   return;
    // }

    // 던전 찾기
    const dungeon = getDungeonInPlayerName(userNickName);
    console.log('dungeon:', dungeon);

    // 플레이어, 위치, 상태 정보 가져오기
    const players = dungeon.players[userNickName];
    const userPosition = dungeon.playersTransform[userNickName];

    console.log('players:', players);
    console.log('userPosition:', userPosition);

    // x, y, z 좌표
    const position = { x: userPosition.x, y: userPosition.y, z: userPosition.z };
    console.log('position:', position);

    //이 스피드는 클라이언트가 어느정도 속도 인지를 알아야해 그리고 그러 내가 인터벌이 100m/s니까 이거에 맞게
    const speed = packetData.speed || 1; // 기본 속도 1로 설정

    const maxDisatnce = players.normalAttack.attackRange;

    // 화살 ID 반환 받기
    const arrowId = dungeon.createArrow(userNickName, position, direction, speed, maxDisatnce);

    // 화살 이동 처리 (Dungeon의 moveArrow 메서드 사용)
    dungeon.moveArrow(userNickName); // 던전 내 메서드 호출로 화살 이동 처리

    //이런 다음에 화살 아이디만 보내주면 되겠다
    console.log('생성된 화살 ID:', arrowId);

    //일단 arrowId는 보내야 한다

    const playerAttackPayload = {
      arrowId: arrowId,
      message: '화살생성완료',
    };

    const playerAttackResponse = createResponse(
      'dungeon',
      'S_PlayerRangeAttack',
      PACKET_TYPE.S_PLAYERRANGEATTACK,
      playerAttackPayload,
    );
    socket.write(playerAttackResponse);
  } catch (error) {
    handlerError(socket, error);
  }
};

//투사체가 몬스터에게 준 공격에 대한 핸들러 (몬스터가 투사체에 맞을떄)
export const rangedAttackImpactHandler = (socket, packetData) => {
  try {
    const { monsterId, arrowId } = packetData;
    // 유저 정보 확인
    const user = getUserById(socket);
    console.log('user:', user);

    if (!user) {
      console.error('공격자를 찾을 수 없습니다.');
      return;
    }

    const monster = getMonster(monsterId);

    if (!monster) {
      console.error('몬스터가 업습니다');
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
      //유저 공격 데미지
      const attack = userStatus.atk * players.normalAttack.damage * randomFactor;

      const damage = attack - monster.def;

      monster.takeDamage(damage);

      console.log(`몬스터에게 ${damage}의 피해를 입혔습니다.`);

      console.log(`남은 체력: ${monster.hp}`);

      const rangedAttackImpactPayload = {
        monsterId,
        monsterHp: monster.hp,
        damage: damage,
        message: '화살공격완료',
      };

      const rangedAttackImpactResponse = createResponse(
        'dungeon',
        'S_RangedAttackImpact',
        PACKET_TYPE.S_RANGEATTACKIMPACT,
        rangedAttackImpactPayload,
      );
      socket.write(rangedAttackImpactResponse);
    } else {
      console.error('몬스터가 멀리 있습니다');
    }

    socket.write();
  } catch (error) {
    handlerError(socket, error);
  }
};

//장애물에 화살이 닿았을때
export const rangeAttackCollide = (socket, packetData) => {
  try {
    //화살과 자애물 좌표?
    const { arrowId, collide } = packetData;

    //유저 찾기
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

    //화살좌표
    const arrowPos = arrow.position;

    //장애물 좌표
    const collidePosX = collide.x;
    const collidePosY = collide.y;
    const collidePosZ = collide.z;

    const distance = Math.sqrt(
      Math.pow(arrowPos.x - collidePosX, 2) +
        Math.pow(arrowPos.y - collidePosY, 2) +
        Math.pow(arrowPos.z - collidePosZ, 2),
    );

    // 간단한 충돌 감지 (화살의 위치와 몬스터의 위치가 가까운지 확인)
    if (distance < 1) {
      dungeon.removeArrow(arrowId);
    } else {
      console.log('충돌하지 않음');
    }
    const rangeAttackCollidePayload = {
      success: true,
      message: '화살제거완료',
    };

    const rangeAttackCollideResponse = createResponse(
      'dungeon',
      'S_rangeAttcckCollide',
      PACKET_TYPE.S_RANGEATTACKCOLLIDE,
      rangeAttackCollidePayload,
    );
    socket.write(rangeAttackCollideResponse);
  } catch (error) {
    handlerError(socket, error);
  }
};

export const playerSkill = (socket, packetData) => {
  try {
    console.log('playerSkill 시작');

    const user = getUserById(socket);
    console.log('user:', user);

    const userNickName = user.userInfo.nickname;

 

    // 유저가 없을 경우
    if (!user) {
      console.error('공격자를 찾을 수 없습니다.');
      return;
    }

    // 닉네임으로 던전 세션을 찾고
    const dungeon = getDungeonInPlayerName(userNickName);
    console.log('dungeon:', dungeon);

    const players = dungeon.players[userNickName];
    
    const playersSkillCooltime=players.normalAttack.attackCoolTime

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

export default playerRangedAttackHandler;
