import { handlerError } from '../../../utils/error/errorHandler.js';
import { createResponse } from '../../../utils/response/createResponse.js';
import { PACKET_TYPE } from '../../../constants/header.js';
import { getUserBySocket } from '../../../session/user.session.js';
import { getDungeonInPlayerName } from '../../../session/dungeon.session.js';
import { findMonster, monsterApplyDamage } from '../../../movementSync/movementSync.manager.js';

const lastAttackTime = {};
const lastSkillTime = {};
const lastdodgeTime = {};
//줄어든 쿨타임 넣는것
const playerCooldowns = {};

//공격을 할떄 (플레이어가 공격을 할떄)
// const playerRangeAttackHandler = (socket, packetData) => {
//   try {
//     const { direction } = packetData;

//     console.log('playerAttackHandler 시작');
//     console.log(direction);

//     if (!direction) {
//       console.error('direction을 받지 않음');
//     }
//     if (
//       typeof direction === 'object' &&
//       typeof direction.x === 'number' &&
//       typeof direction.y === 'number' &&
//       typeof direction.z === 'number'
//     ) {
//       console.log('direction은 올바른 타입입니다.');
//     } else {
//       console.log('direction은 잘못된 타입입니다.');
//     }

//     // 유저 정보 확인
//     const user = getUserBySocket(socket);
//     console.log('user:', user);

//     if (!user) {
//       console.error('공격자를 찾을 수 없습니다.');
//       return;
//     }

//     const userNickName = user.userInfo.nickname;
//     console.log('userNickName:', userNickName);

//     // 던전 찾기
//     const dungeon = getDungeonInPlayerName(userNickName);
//     console.log('dungeon:', dungeon);

//     // 핸들러에 들어온 현재 시간
//     const now = Date.now();

//     // 2) 아직 한 번도 공격한 적이 없는 플레이어라면, 기록을 0(또는 과거 시각)으로 초기화
//     if (!lastAttackTime[userNickName]) {
//       lastAttackTime[userNickName] = 0;
//     }

//     // 3) 공격자(플레이어)를 던전에서 찾음
//     const attackerSessions = getDungeonInPlayerName(userNickName);
//     if (!attackerSessions || attackerSessions.length === 0) {
//       console.error('던전 세션에서 공격자를 찾을 수 없습니다.');
//       sendActionFailure(socket, '던전 세션에서 공격자를 찾을 수 없습니다.');
//       return;
//     }

//     // 던전 내의 플레이어 인스턴스 (객체 형태로 저장되어 있다고 가정)
//     const player = dungeon.players[userNickName];
//     if (!player) {
//       console.error('던전 세션 내에서 공격자 인스턴스를 찾을 수 없습니다.');
//       sendActionFailure(socket, '던전 세션 내에서 공격자 인스턴스를 찾을 수 없습니다.');
//       return;
//     }

//     // 기본 공격 쿨타임 계산
//     const cooldownMs = player.normalAttack.attackCoolTime * 1000;

//     // 쿨타임 감소 값 계산 (cooldownReduction은 `playerSkill`에서 추가됨)
//     const cooldownReduction = playerCooldowns[userNickName] || 0; // 쿨타임 감소 값
//     const nextPossibleTime = lastAttackTime[userNickName] + cooldownMs - cooldownReduction; // 쿨타임 감소 적용

//     // 공격 가능 여부 확인
//     if (now < nextPossibleTime) {
//       const remaining = nextPossibleTime - now;
//       console.log(`[${userNickName}] 공격 쿨타임 중! (남은 시간: ${remaining}ms)`);
//       sendActionFailure(socket, `공격 쿨타임 중입니다. 남은 시간: ${remaining}ms`);
//       return;
//     }

//     // 갱신: 공격 성공 시각 기록
//     lastAttackTime[userNickName] = now;
//     console.log(`[${userNickName}] 공격 시도!`);

//     // 화살 ID 생성 및 전송 처리
//     const userPosition = dungeon.playersTransform[userNickName];
//     const position = { x: userPosition.x, y: userPosition.y, z: userPosition.z };
//     const speed = 1; // 기본 속도 1로 설정
//     const maxDisatnce = player.normalAttack.attackRange;
//     const arrowId = dungeon.createArrow(userNickName, position, direction, speed, maxDisatnce);

//     // 화살 이동 처리 (Dungeon의 moveArrow 메서드 사용)
//     dungeon.moveArrow(userNickName);

//     // 화살 ID를 클라이언트로 전송
//     const playerAttackPayload = {
//       arrowId: arrowId,
//       message: '화살생성완료',
//     };

//     const playerAttackResponse = createResponse(
//       'dungeon',
//       'S_PlayerRangeAttack',
//       PACKET_TYPE.S_PLAYERRANGEATTACK,
//       playerAttackPayload,
//     );
//     socket.write(playerAttackResponse);
//   } catch (error) {
//     handlerError(socket, error);
//   }
// };

//투사체가 몬스터에게 준 공격에 대한 핸들러 (몬스터가 투사체에 맞을떄)
export const rangeAttackImpactHandler = (socket, packetData) => {
  try {
    const { arrowId, hitObject, monsterId } = packetData;
    if (hitObject === 1) {
      console.log('몬스터에게 공격 성공');

      // 유저 정보 확인
      const user = getUserBySocket(socket);
      if (!user) {
        console.error('공격자를 찾을 수 없습니다.');
        return;
      }
      //유저 닉네임 찾기
      const userNickName = user.userInfo.nickname;

      // 현재 던전 정보를 가져옵니다.
      const attackerSessions = getDungeonInPlayerName(userNickName);
      if (!attackerSessions || attackerSessions.length === 0) {
        console.error('던전 세션을 찾을 수 없습니다.');
        return;
      }
      const dungeon = attackerSessions[0];

      const monster = findMonster('dungeon1', monsterId);
      if (!monster) {
        console.log('몬스터를 찾을 수 없습니다.');
        return;
      }
      const monsterTrans = monster.getTransform();
      console.log('충돌한 몬스터의 좌표 : ', monsterTrans);

      // 던전 내 화살 목록에서 arrowId를 이용해 화살 찾기
      const arrow = dungeon.getArrowById(arrowId);

      // 몬스터와의 충돌 여부 확인
      const collisionOccurred = dungeon.checkArrowCollision(arrow, monsterTrans);
      console.log('collide', collisionOccurred);

      if (collisionOccurred) {
        // 이게 못찾아질거 같은데
        const userStatus = dungeon.playerStatus[userNickName];
        console.log('찾은 유저 스탯 정보 : ', userStatus);
        const players = dungeon.players[userNickName];

        // 공격 처리 함수

        //대미지 계산하기 위해서
        const randomFactors = [0.8, 0.9, 1, 1.1, 1.2];
        const randomFactor = randomFactors[Math.floor(Math.random() * randomFactors.length)];
        //유저 공격 데미지
        const attack = userStatus.atk + players.normalAttack.damage * randomFactor;

        const damage = attack; //* (1 - monster.def / (attack + monster.def));

        console.log(`몬스터에게 ${damage}의 피해를 입혔습니다.`);
        console.log(`남은 체력: ${monster.hp}`);

        const rangeNormalAttackResult = {
          arrowId: arrowId,
          message: '화살공격완료',
        };

        const payload = {
          rangeNormalAttackResult,
          success: true,
          message: '화살 공격 성공~!',
        };
        const packet = createResponse(
          'dungeon',
          'S_PlayerAction',
          PACKET_TYPE.S_PLAYERACTION,
          payload,
        );
        socket.write(packet);

        monsterApplyDamage('dungeon1', monsterId, damage);
      } else {
        console.error('몬스터가 멀리 있습니다');
        // 이 부분에 화살이 사라지는 로직 추가?
      }
    } else {
      console.log('몬스터아닌 오브젝트 공격 성공');
      const rangeNormalAttackResult = {
        arrowId: arrowId,
        message: '화살이 오브젝트에 충돌',
      };

      const payload = {
        rangeNormalAttackResult,
        success: false,
        message: '화살이 오브젝트에 부딪힘',
      };
      const packet = createResponse(
        'dungeon',
        'S_PlayerAction',
        PACKET_TYPE.S_PLAYERACTION,
        payload,
      );
      socket.write(packet);
    }
  } catch (error) {
    handlerError(socket, error);
  }
};

//장애물에 화살이 닿았을때
// export const rangeAttackCollide = (socket, packetData) => {
//   try {
//     //화살과 자애물 좌표?
//     const { arrowId, collide } = packetData;

//     console.log('arrowId', arrowId);
//     if (typeof arrowId !== 'number' || arrowId < 0 || arrowId > 100) {
//       console.log('arrowId가 숫자형이 아니거나, 0부터 100 사이의 값이 아닙니다');
//       return;
//     }

//     console.log('collide', collide);
//     if (
//       typeof collide !== 'object' ||
//       collide !== null ||
//       typeof collide.x !== 'number' ||
//       typeof collide.y !== 'number' ||
//       typeof collide.z !== 'number'
//     ) {
//       console.log('collide가 객체형이 아니거나 x,y,z가 숫자형이 아닙니다');
//     }

//     //유저 찾기
//     const user = getUserBySocket(socket);
//     console.log('user:', user);

//     if (!user) {
//       console.error('공격자를 찾을 수 없습니다.');
//       return;
//     }

//     //유저 닉네임 찾기
//     const userNickName = user.userInfo.nickname;

//     // 현재 던전 정보를 가져옵니다.
//     const dungeon = getDungeonInPlayerName(userNickName);
//     console.log('dungeon:', dungeon);

//     // 던전 내 화살 목록에서 arrowId를 이용해 화살 찾기
//     const arrow = getArrowById(arrowId);
//     console.log('arrow', arrow);

//     //화살좌표
//     const arrowPos = arrow.position;

//     //장애물 좌표
//     const collidePosX = collide.x;
//     const collidePosY = collide.y;
//     const collidePosZ = collide.z;

//     const distance = Math.sqrt(
//       Math.pow(arrowPos.x - collidePosX, 2) +
//         Math.pow(arrowPos.y - collidePosY, 2) +
//         Math.pow(arrowPos.z - collidePosZ, 2),
//     );

//     // 간단한 충돌 감지 (화살의 위치와 몬스터의 위치가 가까운지 확인)
//     if (distance < 1) {
//       dungeon.removeArrow(arrowId);
//     } else {
//       console.log('distance', distance);
//       console.log('장애물이 멀리 떨어져 있슴');
//     }
//     const rangeAttackCollidePayload = {
//       success: true,
//       message: '화살제거완료',
//     };

//     const rangeAttackCollideResponse = createResponse(
//       'dungeon',
//       'S_rangeAttcckCollide',
//       PACKET_TYPE.S_RANGEATTACKCOLLIDE,
//       rangeAttackCollidePayload,
//     );
//     socket.write(rangeAttackCollideResponse);
//   } catch (error) {
//     handlerError(socket, error);
//   }
// };

//버프 스킬 proto는 어떻게 해야할지 정하지 않았다 지금 던전에서 스텟과 쿨타임을 보내지 않아서 이걸 안보내거 true,false할지 고민중이다.

export const playerSkillBuff = (socket, packetData) => {
  try {
    console.log('playerSkill 시작');
    // 핸들러에 들어온 현재 시간
    const now = Date.now();

    const user = getUserBySocket(socket);
    // 유저가 없을 경우
    if (!user) {
      console.error('공격자를 찾을 수 없습니다.');
      return;
    }
    const userNickName = user.userInfo.nickname;

    // 2) 아직 한 번도 공격한 적이 없는 플레이어라면, 기록을 0(또는 과거 시각)으로 초기화
    if (!lastSkillTime[userNickName]) {
      lastSkillTime[userNickName] = 0;
    }

    // 3) 공격자(플레이어)를 던전에서 찾음
    const attackerSessions = getDungeonInPlayerName(userNickName);
    if (!attackerSessions || attackerSessions.length === 0) {
      console.error('던전 세션에서 공격자를 찾을 수 없습니다.');
      sendActionFailure(socket, '던전 세션에서 공격자를 찾을 수 없습니다.');
      return;
    }
    const dungeon = attackerSessions[0];

    // 던전 내의 플레이어 인스턴스 (객체 형태로 저장되어 있다고 가정)
    const player = dungeon.players[userNickName];
    if (!player) {
      console.error('던전 세션 내에서 공격자 인스턴스를 찾을 수 없습니다.');
      sendActionFailure(socket, '던전 세션 내에서 공격자 인스턴스를 찾을 수 없습니다.');
      return;
    }

    // 다음 공격 가능 시각 계산
    const cooldownMs = player.skillAttack.attackCoolTime * 1000;
    const nextPossibleTime = lastSkillTime[userNickName] + cooldownMs;
    if (now < nextPossibleTime) {
      const remaining = nextPossibleTime - now;
      console.log(`[${userNickName}] 스킬 쿨타임 중! (남은 시간: ${remaining}ms)`);
      sendActionFailure(socket, `스킬 쿨타임 중입니다. 남은 시간: ${remaining}ms`);
      return;
    }
    // 갱신: 공격 성공 시각 기록
    lastSkillTime[userNickName] = now;

    // 현재 일반 공격 쿨타임 (초 단위) 가져오기
    let playerAtkDelaySec = dungeon.players[userNickName].normalAttack.attackCoolTime;
    Debug.Log("현재 공격 쿨타임: " + playerAtkDelaySec);

    // 버프 효과로 쿨타임을 줄일 값 (예: 1초 감소)
    const reductionAmount = 1;
    // 최소한 0.5초 이상 남도록 함
    const newAtkDelay = Math.max(playerAtkDelaySec - reductionAmount, 0.5);

    // 원래 값 저장
    const originalAtkDelay = playerAtkDelaySec;
    // 적용: 던전 내 해당 플레이어의 일반 공격 쿨타임 업데이트
    dungeon.players[userNickName].normalAttack.attackCoolTime = newAtkDelay;
    Debug.Log(`공격 쿨타임이 ${newAtkDelay}초로 감소되었습니다.`);

    // -> 아래 부분부턴 수정을 해야할듯

    // 쿨타임 감소 적용 (10초 감소)
    const cooldownReductionTime = 10 * 1000; // 10초 감소

    if (!playerCooldowns[userNickName]) {
      playerCooldowns[userNickName] = 0; // 처음에 값이 없다면 0으로 초기화
    }

    // 쿨타임 감소 적용
    playerCooldowns[userNickName] += cooldownReductionTime;
    console.log(`쿨타임 감소 적용: ${cooldownReductionTime / 1000}초`);

    // 동일한 setTimeout을 사용하여 20초 후에 스탯과 쿨타임 복원
    setTimeout(() => {
      // 원래 값으로 되돌리기
      dungeon.setPlayerAtk(userNickName, playerAtk);
      dungeon.setPlayerDef(userNickName, playerDef);
      dungeon.setPlayerSpeed(userNickName, playerSpeed);
      console.log('원래 스탯으로 되돌리기 완료');

      // 쿨타임 복원
      playerCooldowns[userNickName] -= cooldownReductionTime;
      console.log('쿨타임 복원 완료');

      const skillBuffPayload = {
        playerAtk: playerAtk,
        playerDef: playerDef,
        playerSpeed: playerSpeed,
        remainingCooldown: playerCooldowns[userNickName],
        message: '스탯 버프 완료',
      };
      const skillBuffResponse = createResponse(
        'dungeon',
        'S_SkillBuff',
        PACKET_TYPE.S_SKILLBUFF,
        skillBuffPayload,
      );
      socket.write(skillBuffResponse);
    }, 20000); // 20초 후

    // 스킬 사용 후 플레이어 상태 (쿨타임 포함) 전송
    const skillBuffPayload = {
      playerAtk: playerAtk + atkIncrease,
      playerDef: playerDef + defIncrease,
      playerSpeed: playerSpeed + speedIncrease,
      remainingCooldown: playerCooldowns[userNickName],
      message: '스탯 버프 완료',
    };

    const skillBuffResponse = createResponse(
      'dungeon',
      'S_SkillBUff',
      PACKET_TYPE.S_SKILLBUFF,
      skillBuffPayload,
    );
    socket.write(skillBuffResponse);
  } catch (e) {
    handlerError(socket, e);
  }
};

export const playerDodge = (socket, packetData) => {
  try {
    const { direction } = packetData;
    console.log('playerDodge 처리 시작');

    const user = getUserBySocket(socket);
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

    // 핸들러에 들어온 현재 시간
    const now = Date.now();

    // 2) 아직 한 번도 회피한 적이 없는 플레이어라면, 기록을 0(또는 과거 시각)으로 초기화
    if (!lastdodgeTime[userNickName]) {
      lastdodgeTime[userNickName] = 0;
    }

    // 3) 플레이어를 던전에서 찾음
    const requesterSessions = getDungeonInPlayerName(userNickName);
    if (!requesterSessions || requesterSessions.length === 0) {
      console.error('던전 세션에서 요청자를 찾을 수 없습니다.');
      sendActionFailure(socket, '던전 세션에서 요청자를 찾을 수 없습니다.');
      return;
    }

    // 던전 내의 플레이어 인스턴스 (객체 형태로 저장되어 있다고 가정)
    const player = dungeon.players[userNickName];
    if (!player) {
      console.error('던전 세션 내에서 요청자 인스턴스를 찾을 수 없습니다.');
      sendActionFailure(socket, '던전 세션 내에서 요청자 인스턴스를 찾을 수 없습니다.');
      return;
    }

    // 다음 공격 가능 시각 계산
    const cooldownMs = player.dodge.dodgeCoolTime * 1000;
    const nextPossibleTime = lastdodgeTime[userNickName] + cooldownMs;
    if (now < nextPossibleTime) {
      const remaining = nextPossibleTime - now;
      console.log(`[${userNickName}] 회피 쿨타임 중! (남은 시간: ${remaining}ms)`);
      sendActionFailure(socket, `회피 쿨타임 중입니다. 남은 시간: ${remaining}ms`);
      return;
    }
    // 갱신: 회피 성공 시각 기록
    lastdodgeTime[userNickName] = now;
    console.log(`[${userNickName}] 회피 시도!`);
  } catch (e) {
    handlerError(socket, e);
  }
};

export default playerRangeAttackHandler;

//자 기본 공격,(논타켓팅) 스킬공격(논타겟티잉거나 타겟팅), 스킬 버프,
//자 그러면 분기를 나누어서 이것들을 처리 시키고 싶어 왜냐하면 쿨타임 계산식을 모든 스킬 핸들러에 추가 하는것보다 낳을것 같거든
//기본 공격은 그대로 일단 만둘고 가다음 스킬 버프가 있고
//스킬 공격에서 타켓팅의 경우에는 arrow를 안만들어도 되고 그냥 공격할떄 공격이 몬스터한테 충돌했을떄만 해야되니
