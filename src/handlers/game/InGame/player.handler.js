import { PACKET_TYPE } from '../../../constants/header.js';
import { getDungeonInPlayerName } from '../../../session/dungeon.session.js';
import { createResponse } from '../../../utils/response/createResponse.js';

// 상태 객체들: 각 액션별로 독립적인 상태 관리
const lastAttackTime = {};
const lastSkillTime = {};
const lastdodgeTime = {};

export const processPlayerActionHandler = (socket, packet) => {
  if (packet.normalAttack) {
    // 일반 공격 처리
    console.log('일반 공격 요청 처리');
    processAttackHandler(socket, packet.normalAttack.attackerName, packet.normalAttack.targetId);
  } else if (packet.skillAttack) {
    // 스킬 공격 처리
    console.log('스킬 공격 요청 처리');
    processSkillAttackHandler(socket, attackerName, packet.skillAttack.targetId);
    // packet.skillAttack.skillId, packet.skillAttack.targetId 등을 사용하여 처리
  } else if (packet.dodgeAction) {
    // 회피 처리
    console.log('회피 요청 처리');
    processDodgeHandler(socket, attackerName, packet.dodgeAction.dodgeDistance);
  } else if (packet.hitAction) {
    // 피격 처리
    console.log('피격 요청 처리');
    processHitHandler(socket, packet.hitAction.attackerId, packet.hitAction.damage);
  } else {
    console.error('알 수 없는 플레이어 액션');
  }
};

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
  const attackerSessions  = getDungeonInPlayerName(attackerName);
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

  // 만약 targetId가 유효하지 않다면(예: -1 또는 0), 그냥 공격 진행 (사거리 체크 생략)
  if (targetId <= 0) {
    console.log(`[${attackerName}] 대상이 없으므로 기본 공격 진행합니다.`);

    const normalAttackResult = {
      targetId: 0, // 대상이 없으므로 0 또는 특수값
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
  } else {
    // targetId가 유효하면 사거리 체크를 진행합니다.
    // (예시로 몬스터의 위치 정보를 가져오는 부분은 아직 구현되지 않은 것으로 가정)
    const posA = dungeon.playersTransform[attackerName];
    //const posB = getTargetPosition(targetId); // 이 함수는 targetId에 해당하는 타겟의 위치 정보를 반환한다고 가정
    const posB = { x: 3, y: 0.1, z: 3 };

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

    // 피해량 계산 (여기서는 고정 50 데미지) -> 추후 플레이어 클래스의 데미지로 변경
    console.log(`[${attackerName}] 타겟이 사거리 내에 있습니다. 공격 진행합니다.`);
    const normalAttackResult = {
      targetId,
      damageDealt: 50,
    };
    const payload = {
      normalAttackResult,
      success: true,
      message: '공격에 성공하였습니다.',
    };
    const packet = createResponse('dungeon', 'S_PlayerAction', PACKET_TYPE.S_PLAYERACTION, payload);
    socket.write(packet);
  }
};

// 클라측에서 스킬 공격을 요청할떄 처리할 핸들러
const processSkillAttackHandler = (socket, attackerName, targetId) => {
  // 핸들러에 들어온 현재 시간
  const now = Date.now();

  // 2) 아직 한 번도 공격한 적이 없는 플레이어라면, 기록을 0(또는 과거 시각)으로 초기화
  if (!lastSkillTime[attackerName]) {
    lastSkillTime[attackerName] = 0;
  }

  // 3) 공격자(플레이어)를 던전에서 찾음
  const attackerSessions  = getDungeonInPlayerName(attackerName);
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

  // 다음 공격 가능 시각 계산
  const cooldownMs = player.skillAttack.attackCoolTime * 1000;
  const nextPossibleTime = lastSkillTime[attackerName] + cooldownMs;
  if (now < nextPossibleTime) {
    const remaining = nextPossibleTime - now;
    console.log(`[${attackerName}] 공격 쿨타임 중! (남은 시간: ${remaining}ms)`);
    sendActionFailure(socket, `공격 쿨타임 중입니다. 남은 시간: ${remaining}ms`);
    return;
  }
  // 갱신: 공격 성공 시각 기록
  lastSkillTime[attackerName] = now;
  console.log(`[${attackerName}] 공격 시도! targetId=${targetId}`);

  // 만약 targetId가 유효하지 않다면(예: -1 또는 0), 그냥 공격 진행 (사거리 체크 생략)
  if (targetId <= 0) {
    console.log(`[${attackerName}] 대상이 없으므로 기본 공격 진행합니다.`);

    const normalAttackResult = {
      targetId: 0, // 대상이 없으므로 0 또는 특수값
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
  } else {
    // targetId가 유효하면 사거리 체크를 진행합니다.
    // (예시로 몬스터의 위치 정보를 가져오는 부분은 아직 구현되지 않은 것으로 가정)
    const posA = dungeon.playersTransform[attackerName];
    //const posB = getTargetPosition(targetId); // 이 함수는 targetId에 해당하는 타겟의 위치 정보를 반환한다고 가정
    const posB = { x: 3, y: 0.1, z: 3 };

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

    // 피해량 계산 (여기서는 고정 50 데미지) -> 추후 플레이어 클래스의 데미지로 변경
    console.log(`[${attackerName}] 타겟이 사거리 내에 있습니다. 공격 진행합니다.`);
    const normalAttackResult = {
      targetId,
      damageDealt: 50,
    };
    const payload = {
      normalAttackResult,
      success: true,
      message: '공격에 성공하였습니다.',
    };
    const packet = createResponse('dungeon', 'S_PlayerAction', PACKET_TYPE.S_PLAYERACTION, payload);
    socket.write(packet);
  }
}

// 클라측에서 회피를 요청할떄 처리할 핸들러
const processDodgeHandler = (socket, attackerName) => {};

// 클라측에서 힐?을 요청할떄 처리할 핸들러 -> 애매
const processHealHandler = (socket, healerName, targetName) => {};

// 클라측에서 피격 요청할떄 처리할 핸들러
const processHitHandler = (socket, attackerName, targetName) => {};