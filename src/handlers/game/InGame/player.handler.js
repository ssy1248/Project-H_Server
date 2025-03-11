import { PACKET_TYPE } from '../../../constants/header.js';
import {
  findMonster,
  findUser,
  monsterApplyDamage,
} from '../../../movementSync/movementSync.manager.js';
import { getDungeonInPlayerName } from '../../../session/dungeon.session.js';
import { getUserByNickname, getUserBySocket } from '../../../session/user.session.js';
import { createResponse } from '../../../utils/response/createResponse.js';

// 상태 객체들: 각 액션별로 독립적인 상태 관리
const lastAttackTime = {};
const lastdodgeTime = {};

//줄어든 쿨타임 넣는것
const playerCooldowns = {};

// 추후 -> socket으로 유저를 찾아 그 유저의 닉네임을 매개변수에 등록
export const processPlayerActionHandler = (socket, packet) => {
  if (packet.normalAttack) {
    // 일반 공격 처리
    console.log('일반 근접 공격 요청 처리');
    processAttackHandler(socket, packet.normalAttack.attackerName, packet.normalAttack.targetId);
  } else if (packet.skillAttack) {
    if (packet.skillAttack.targetId[0] === 'Buff') {
      console.log('버프 스킬 들어왔다');
      processBuffSkillHandler(socket, packet.skillAttack.attackerName);
    } else {
      // 스킬 공격 처리
      console.log('스킬 공격 요청 처리');
      processSkillAttackHandler(
        socket,
        packet.skillAttack.attackerName,
        packet.skillAttack.targetId,
      );
    }
  } else if (packet.dodgeAction) {
    // 회피 처리
    console.log('회피 요청 처리');
    processDodgeHandler(
      socket,
      packet.dodgeAction.attackerName,
      packet.dodgeAction.currentPosition,
      packet.dodgeAction.direction,
    );
  } else if (packet.hitAction) {
    // 피격 처리
    console.log('피격 요청 처리');
    processHitHandler(socket, packet.hitAction.attackerId, packet.hitAction.damage);
  } else if (packet.rangeNormalAttackAction) {
    console.log('일반 원거리 공격 요청 처리');
    processRangeAttackHandler(socket, packet.rangeNormalAttackAction.direction);
  } else {
    console.error('알 수 없는 플레이어 액션');
  }
};

// 클라에서 원거리 투사체가 어딘가에 부딪혀서 패킷을 보내면 처리할 핸들러
export const rangeAttackHitHandler = (socket, packet) => {};

/**
 * 실패 패킷을 보내는 함수
 */
function sendActionFailure(socket, message) {
  const payload = {
    success: false,
    message: message,
  };
  const packet = createResponse('dungeon', 'S_PlayerAction', PACKET_TYPE.S_PLAYERACTION, payload);
  socket.write(packet);
}

/**
 * 두 점 사이의 거리를 계산하는 함수
 */
function calculateDistance(posA, posB) {
  const dx = posA.x - posB.x;
  const dy = posA.y - posB.y;
  const dz = posA.z - posB.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

// 클라측에서 일반 공격 요청을 처리하는 함수
// tagetId가 아니고 타겟 트랜스폼을 보내서 그것으로
const processAttackHandler = async (socket, attackerName, targetId) => {
  // 핸들러에 들어온 현재 시간
  const now = Date.now();

  // 2) 아직 한 번도 공격한 적이 없는 플레이어라면, 기록을 0(또는 과거 시각)으로 초기화
  if (!lastAttackTime[attackerName]) {
    lastAttackTime[attackerName] = 0;
  }

  // 3) 공격자(플레이어)를 던전에서 찾음
  const attackerSessions = getDungeonInPlayerName(attackerName);
  if (!attackerSessions || attackerSessions.length === 0) {
    console.error('던전 세션에서 공격자를 찾을 수 없습니다.');
    sendActionFailure(socket, '던전 세션에서 공격자를 찾을 수 없습니다.');
    return;
  }
  const dungeon = attackerSessions[0];

  // 던전 내의 플레이어 인스턴스 (객체 형태로 저장되어 있다고 가정)
  const player = dungeon.players[attackerName];
  if (!player) {
    console.error('던전 세션 내에서 공격자 인스턴스를 찾을 수 없습니다.');
    sendActionFailure(socket, '던전 세션 내에서 공격자 인스턴스를 찾을 수 없습니다.');
    return;
  }

  const monster = findMonster('dungeon1', targetId);
  if (!monster) {
    console.log('몬스터를 찾을 수 없습니다.');
    console.log(`[${attackerName}] 대상이 없으므로 기본 공격 진행합니다.`);

    const normalAttackResult = {
      targetId: '0', // 대상이 없으므로 0 또는 특수값
      damageDealt: 0, // 피해량 0 (혹은 기본 데미지 적용)
    };

    const sPlayerActionPayload = {
      normalAttackResult: normalAttackResult,
      success: true,
      message: '공격하였습니다 (대상이 없으므로 특별한 효과 없음).',
    };

    const sPlayerActionPacket = createResponse(
      'dungeon',
      'S_PlayerAction',
      PACKET_TYPE.S_PLAYERACTION,
      sPlayerActionPayload,
    );
    socket.write(sPlayerActionPacket);
    return;
  }

  // 다음 공격 가능 시각 계산
  const cooldownMs = player.normalAttack.attackCoolTime * 1000;
  const nextPossibleTime = lastAttackTime[attackerName] + cooldownMs;
  if (now < nextPossibleTime) {
    const remaining = nextPossibleTime - now;
    console.log(`[${attackerName}] 공격 쿨타임 중! (남은 시간: ${remaining}ms)`);
    sendActionFailure(socket, `공격 쿨타임 중입니다. 남은 시간: ${remaining}ms`);
    return;
  }
  // 갱신: 공격 성공 시각 기록
  lastAttackTime[attackerName] = now;
  console.log(`[${attackerName}] 공격 시도! targetId=${targetId}`);

  // targetId가 유효하면 사거리 체크를 진행합니다.
  const posA = dungeon.playersTransform[attackerName];
  const posB = monster.getTransform();
  console.log('posB : ', posB);

  if (!posA || !posB) {
    console.error('유효한 위치 정보가 없습니다.');
    sendActionFailure(socket, '유효한 위치 정보가 없습니다.');
    return;
  }
  const distance = calculateDistance(posA, posB);
  if (distance > player.normalAttack.attackRange) {
    console.log('타겟이 공격 범위 밖에 있습니다.');
    sendActionFailure(socket, '타겟이 공격 범위 밖에 있습니다.');
    return;
  }

  // 피해량 계산
  console.log(`[${attackerName}] 타겟이 사거리 내에 있습니다. 공격 진행합니다.`);
  const normalAttackResult = {
    targetId,
    damageDealt: dungeon.players[attackerName].normalAttack.damage,
    useUserName: attackerName,
  };
  const payload = {
    normalAttackResult,
    success: true,
    message: '공격에 성공하였습니다.',
  };
  const packet = createResponse('dungeon', 'S_PlayerAction', PACKET_TYPE.S_PLAYERACTION, payload);
  socket.write(packet);

  // 모든 결과 브로드캐스팅 - 공격 애니메이션, 사운드
  // attackerSessions.partyInfo.players.forEach((dungeon) => {

  // });

  // 몬스터 히트 패킷 전송 - 히트 패킷이 없으면 몬스터에게 공격 했다라는 함수 호출 후 데미지 계산
  monsterApplyDamage('dungeon1', targetId, dungeon.players[attackerName].normalAttack.damage);
};

const processRangeAttackHandler = (socket, direction) => {
  try {
    console.log(`바라보는 방향 : `, direction);

    // 핸들러에 들어온 현재 시간
    const now = Date.now();

    // 유저 정보 확인
    const user = getUserBySocket(socket);
    if (!user) {
      console.error('공격자를 찾을 수 없습니다.');
      return;
    }

    const userNickName = user.userInfo.nickname;

    // 2) 아직 한 번도 공격한 적이 없는 플레이어라면, 기록을 0(또는 과거 시각)으로 초기화
    if (!lastAttackTime[userNickName]) {
      lastAttackTime[userNickName] = 0;
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

    // 기본 공격 쿨타임 계산
    const cooldownMs = player.normalAttack.attackCoolTime * 1000;

    // 쿨타임 감소 값 계산 (cooldownReduction은 `playerSkill`에서 추가됨)
    const cooldownReduction = playerCooldowns[userNickName] || 0; // 쿨타임 감소 값
    const nextPossibleTime = lastAttackTime[userNickName] + cooldownMs - cooldownReduction; // 쿨타임 감소 적용

    // 공격 가능 여부 확인
    if (now < nextPossibleTime) {
      const remaining = nextPossibleTime - now;
      console.log(`[${userNickName}] 공격 쿨타임 중! (남은 시간: ${remaining}ms)`);
      sendActionFailure(socket, `공격 쿨타임 중입니다. 남은 시간: ${remaining}ms`);
      return;
    }

    // 갱신: 공격 성공 시각 기록
    lastAttackTime[userNickName] = now;
    console.log(`[${userNickName}] 공격 시도!`);

    // 화살 ID 생성 및 전송 처리
    const userPosition = dungeon.playersTransform[userNickName];
    const position = { x: userPosition.x, y: userPosition.y, z: userPosition.z };
    const speed = 1; // 기본 속도 1로 설정 -> 화살 속도를 클라와 서버를 동일시 하면 1로 가능할듯?
    const maxDisatnce = player.normalAttack.attackRange;
    const arrowId = dungeon.createArrow(userNickName, position, direction, speed, maxDisatnce);

    // 화살 이동 처리 (Dungeon의 moveArrow 메서드 사용)
    dungeon.moveArrow(userNickName);

    // 화살 ID를 클라이언트로 전송
    const rangeNormalAttackResult = {
      arrowId: arrowId,
      message: '화살생성완료',
    };

    const payload = {
      rangeNormalAttackResult,
      success: true,
      message: '화살생성완료',
    };

    const playerAttackResponse = createResponse(
      'dungeon',
      'S_PlayerAction',
      PACKET_TYPE.S_PLAYERACTION,
      payload,
    );
    socket.write(playerAttackResponse);
  } catch (e) {
    console.log('processRangeAttackHandler error : ', e);
  }
};

// 클라측에서 스킬 공격을 요청할떄 처리할 핸들러
const processSkillAttackHandler = (socket, attackerName, targetIds) => {
  // 1) 공격자(플레이어)를 던전에서 찾음
  const attackerSessions = getDungeonInPlayerName(attackerName);
  if (!attackerSessions || attackerSessions.length === 0) {
    console.error('던전 세션에서 공격자를 찾을 수 없습니다.');
    sendActionFailure(socket, '던전 세션에서 공격자를 찾을 수 없습니다.');
    return;
  }
  const dungeon = attackerSessions[0];

  // 던전 내의 플레이어 인스턴스 (객체 형태로 저장되어 있다고 가정)
  const player = dungeon.players[attackerName];
  if (!player) {
    console.error('던전 세션 내에서 공격자 인스턴스를 찾을 수 없습니다.');
    sendActionFailure(socket, '던전 세션 내에서 공격자 인스턴스를 찾을 수 없습니다.');
    return;
  }

  try {
    player.skillAttack.use();
  } catch (error) {
    sendActionFailure(socket, error.message);
    return;
  }

  let user;
  dungeon.partyInfo.Players.forEach((player) => {
    if (player.playerName === attackerName) {
      user = player;
    }
  });

  let playerCurrentMp = user.playerCurMp;
  if (playerCurrentMp < player.skillAttack.cost) {
    player.skillAttack.resetCooldown();
    console.error('마나가 부족합니다.');
    return;
  }

  playerCurrentMp -= player.skillAttack.cost;
  console.log('playerCurrentMp 남은 마나 : ', playerCurrentMp);
  user.playerCurMp = playerCurrentMp;
  // mp 회복 로직을 추가해야할듯? -> 로그라이크인데 소울류처럼 할거니까 그냥 한게임에 마나 고정?

  for (let targetId of targetIds) {
    const monster = findMonster('dungeon1', targetId);
    if (!monster) {
      console.log(`몬스터(${targetId})를 찾을 수 없습니다.`);
      continue;
    }
    // 범위 체크
    const posA = dungeon.playersTransform[attackerName];
    const posB = monster.getTransform();
    if (!posA || !posB) {
      continue;
    }
    const distance = calculateDistance(posA, posB);
    if (distance > player.skillAttack.attackRange) {
      console.log(`몬스터(${targetId})가 공격 범위 밖입니다.`);
      continue;
    }

    // 데미지 적용
    monsterApplyDamage('dungeon1', targetId, player.skillAttack.damage);
  }

  // 결과 패킷 생성
  const skillAttackResult = {
    skillId: player.skillAttack.id, // 스킬 인스턴스의 id
    useUserName: attackerName,
    currentMp: playerCurrentMp,
  };
  const payload = {
    skillAttackResult,
    success: true,
    message: '스킬 공격에 성공하였습니다.',
  };
  const packet = createResponse('dungeon', 'S_PlayerAction', PACKET_TYPE.S_PLAYERACTION, payload);
  console.log('스킬 사용 성공!!!');
  socket.write(packet);
};

// 클라측에서 회피를 요청할떄 처리할 핸들러
const processDodgeHandler = (socket, requesterName, currentPosition, direction) => {
  // 핸들러에 들어온 현재 시간
  const now = Date.now();

  // 2) 아직 한 번도 회피한 적이 없는 플레이어라면, 기록을 0(또는 과거 시각)으로 초기화
  if (!lastdodgeTime[requesterName]) {
    lastdodgeTime[requesterName] = 0;
  }

  // 3) 플레이어를 던전에서 찾음
  const requesterSessions = getDungeonInPlayerName(requesterName);
  if (!requesterSessions || requesterSessions.length === 0) {
    console.error('던전 세션에서 요청자를 찾을 수 없습니다.');
    sendActionFailure(socket, '던전 세션에서 요청자를 찾을 수 없습니다.');
    return;
  }
  const dungeon = requesterSessions[0];

  // 던전 내의 플레이어 인스턴스 (객체 형태로 저장되어 있다고 가정)
  const player = dungeon.players[requesterName];
  if (!player) {
    console.error('던전 세션 내에서 요청자 인스턴스를 찾을 수 없습니다.');
    sendActionFailure(socket, '던전 세션 내에서 요청자 인스턴스를 찾을 수 없습니다.');
    return;
  }

  console.log('플레이어 : ', player);

  // 다음 회피 가능 시각 계산
  const cooldownMs = player.dodge.dodgeCoolTime * 1000;
  const nextPossibleTime = lastdodgeTime[requesterName] + cooldownMs;
  if (now < nextPossibleTime) {
    const remaining = nextPossibleTime - now;
    console.log(`[${requesterName}] 회피 쿨타임 중! (남은 시간: ${remaining}ms)`);
    sendActionFailure(socket, `회피 쿨타임 중입니다. 남은 시간: ${remaining}ms`);
    return;
  }
  // 갱신: 회피 성공 시각 기록
  lastdodgeTime[requesterName] = now;
  console.log(`[${requesterName}] 회피 시도!`);

  // 플레이어의 서버 현재 위치 -> 이부분에서 업데이트가 안되고 있어서 스폰 위치에서 구르고 보간이 되고있음
  const currentServerPosition = dungeon.playersTransform[requesterName];

  // 클라에서 보낸 현재 좌표 -> 이상함 -> 스폰 위치에서 계속 보내는 위치 같음
  const basePosition = {
    x: currentPosition.x,
    y: currentPosition.y,
    z: currentPosition.z,
  };

  // 서버에서 가진 가장 최근 좌표와 클라에서 보낸 현재좌표를 검사해야할듯?

  // 클라이언트에서 전송한 dodgeAction의 방향과 이동 거리를 사용하여 최종 좌표 계산
  const finalPosition = {
    x: currentServerPosition.x + direction.x * player.dodge.dodgeRange,
    y: currentServerPosition.y, // y축은 사용하지 않음
    z: currentServerPosition.z + direction.z * player.dodge.dodgeRange,
  };

  console.log('최종 좌표 : ', finalPosition);

  // 던전 내 플레이어 위치 업데이트
  dungeon.playersTransform[requesterName] = finalPosition;
  console.log(
    `던전 내 ${requesterName}의 위치가 업데이트되었습니다: `,
    dungeon.playersTransform[requesterName],
  );

  // 해당 유저의 currentTransform 업데이트
  const user = getUserByNickname(requesterName);
  if (user) {
    const userTransform = findUser('dungeon1', user.userInfo.userId);
    if (userTransform) {
      userTransform.currentTransform = {
        posX: finalPosition.x,
        posY: finalPosition.y,
        posZ: finalPosition.z,
        rot: userTransform.currentTransform.rot,
      };
      console.log(
        `movementSync: 업데이트된 ${requesterName}의 currentTransform: `,
        userTransform.currentTransform,
      );
    } else {
      console.warn(`movementSync: ${requesterName}의 userTransform을 찾을 수 없습니다.`);
    }
  } else {
    console.warn(`${requesterName} 닉네임의 유저를 찾을 수 없습니다.`);
  }

  const dodgeResult = {
    evadedDamage: 20, // 회피 효과에 따른 피해 경감
    dodgeDistance: player.dodge.dodgeRange, // 보낼필요없고
    direction: direction, // 보낼필요없고
    finalPosition: finalPosition,
    useUserName: requesterName,
  };

  const payload = {
    dodgeResult,
    success: true,
    message: '회피에 성공하였습니다.',
  };

  const sPlayerActionPacket = createResponse(
    'dungeon',
    'S_PlayerAction',
    PACKET_TYPE.S_PLAYERACTION,
    payload,
  );

  socket.write(sPlayerActionPacket);
};

// PlayerAction 에 추가를 해야하나 아님 그냥 프로토버퍼에서 구분을 해야하나
// 고민을 해야할듯

export const processBuffSkillHandler = (socket, attackerName) => {
  try {
    console.log('playerBuffSkill 시작');

    // 3) 공격자(플레이어)를 던전에서 찾음
    const attackerSessions = getDungeonInPlayerName(attackerName);
    if (!attackerSessions || attackerSessions.length === 0) {
      console.error('던전 세션에서 공격자를 찾을 수 없습니다.');
      sendActionFailure(socket, '던전 세션에서 공격자를 찾을 수 없습니다.');
      return;
    }
    const dungeon = attackerSessions[0];

    // 던전 내의 플레이어 인스턴스 (객체 형태로 저장되어 있다고 가정)
    const player = dungeon.players[attackerName];
    if (!player) {
      console.error('던전 세션 내에서 공격자 인스턴스를 찾을 수 없습니다.');
      sendActionFailure(socket, '던전 세션 내에서 공격자 인스턴스를 찾을 수 없습니다.');
      return;
    }

    try {
      player.skillAttack.use();
    } catch (error) {
      sendActionFailure(socket, error.message);
      return;
    }

    let user;
    dungeon.partyInfo.Players.forEach((player) => {
      if (player.playerName === attackerName) {
        user = player;
      }
    });

    let playerCurrentMp = user.playerCurMp;
    if (playerCurrentMp < player.skillAttack.cost) {
      player.skillAttack.resetCooldown();
      console.error('마나가 부족합니다.');
      return;
    }

    playerCurrentMp -= player.skillAttack.cost;
    console.log('playerCurrentMp 남은 마나 : ', playerCurrentMp);
    user.playerCurMp = playerCurrentMp;

    // Archer일 때만 공격 속도 증가 버프 적용
    if (player.playerClass === 3) {
      // 현재 일반 공격 쿨타임
      let originalAtkDelay = player.normalAttack.attackCoolTime;
      console.log('원래 공격 쿨타임: ' + originalAtkDelay);

      // 버프 효과로 줄일 값 (예: 1초 감소, 최소 0.5초는 유지)
      const reductionAmount = 1;
      const newAtkDelay = Math.max(originalAtkDelay - reductionAmount, 0.5);

      // 쿨타임 적용: 던전의 플레이어 인스턴스 업데이트
      player.normalAttack.attackCoolTime = newAtkDelay;
      console.log(`공격 쿨타임이 ${newAtkDelay}초로 감소되었습니다.`);

      // 스킬 지속시간(밀리초) 동안 유지 후 복원.
      const skillDurationTime = player.skillAttack.duration; // 이 값은 밀리초 단위라고 가정
      setTimeout(() => {
        // 원래 스탯으로 복원
        player.normalAttack.attackCoolTime = originalAtkDelay;
        console.log('공격 쿨타임이 원래 값으로 복원되었습니다.');
      }, skillDurationTime * 1000);

      // 버프 적용 즉시 결과 전송
      const skillPayload = {
        skillId: player.skillAttack.id,
        useUserName: attackerName,
        currentMp: playerCurrentMp,
      };
      const skillBuffPacket = {
        skillPayload, 
        success: true,
        message: '스킬 사용을 성공했습니다.',
      };
      const packet = createResponse(
        'dungeon',
        'S_PlayerAction',
        PACKET_TYPE.S_PLAYERACTION,
        skillBuffPacket,
      );
      socket.write(packet);
    } else {
      console.log('해당 플레이어는 버프 스킬 적용 대상이 아닙니다.');
      // 다른 클래스에 대해 별도 처리가 필요한 경우 여기에 구현
    }
  } catch (e) {
    console.log('버프 스킬 핸들러 에러 : ', e);
  }
};

// 클라측에서 힐?을 요청할떄 처리할 핸들러 -> 애매
const processHealHandler = (socket, healerName, targetName) => {};

// 클라측에서 피격 요청할떄 처리할 핸들러
// attackId -> 공격한 몬스터 id / playerName -> 피격당한 플레이어 이름 / damage -> 피격 데미지
const processHitHandler = (socket, attackId, playerName, damage) => {};
