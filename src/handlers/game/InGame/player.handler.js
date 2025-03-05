import { PACKET_TYPE } from '../../../constants/header.js';
import { findMonster, findUser } from '../../../movementSync/movementSync.manager.js';
import { getDungeonInPlayerName } from '../../../session/dungeon.session.js';
import { getUserByNickname } from '../../../session/user.session.js';
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
    processSkillAttackHandler(socket, packet.skillAttack.attackerName, packet.skillAttack.targetId);
    // packet.skillAttack.skillId, packet.skillAttack.targetId 등을 사용하여 처리
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
      targetId: "0", // 대상이 없으므로 0 또는 특수값
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
  // (예시로 몬스터의 위치 정보를 가져오는 부분은 아직 구현되지 않은 것으로 가정)
  const posA = dungeon.playersTransform[attackerName];
  //const posB = getTargetPosition(targetId); // 이 함수는 targetId에 해당하는 타겟의 위치 정보를 반환한다고 가정
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

  // 피해량 계산 (여기서는 고정 50 데미지) -> 추후 플레이어 클래스의 데미지로 변경
  console.log(`[${attackerName}] 타겟이 사거리 내에 있습니다. 공격 진행합니다.`);
  const normalAttackResult = {
    targetId,
    damageDealt: 50,
    useUserName: attackerName,
  };
  const payload = {
    normalAttackResult,
    success: true,
    message: '공격에 성공하였습니다.',
  };
  const packet = createResponse('dungeon', 'S_PlayerAction', PACKET_TYPE.S_PLAYERACTION, payload);
  socket.write(packet);

  // 몬스터 히트 패킷 전송
  // 모든 결과 브로드캐스팅
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

  // 타겟팅, 논타겟팅인지에 따라 targetId가 필요할수도 없을수도도
  // 만약 targetId가 유효하지 않다면, 그냥 공격 진행 (사거리 체크 생략)
  if (targetId <= 0) {
    console.log(`[${attackerName}] 대상이 없으므로 기본 공격 진행합니다.`);

    // 타겟팅인지 아닌지에 따라 처리리
    const skillAttackResult = {
      skillId: 0, // 스킬 아이디
      targetId: 0, // 대상이 없으므로 0 또는 특수값
      damageDealt: 0, // 피해량 0 (혹은 기본 데미지 적용)
      useUserName: attackerName,
    };

    const sPlayerActionPayload = {
      skillAttackResult,
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
    if (distance > player.skillAttack.attackRange) {
      console.log('타겟이 공격 범위 밖에 있습니다.');
      sendActionFailure(socket, '타겟이 공격 범위 밖에 있습니다.');
      return;
    }

    // 피해량 계산 (여기서는 고정 50 데미지) -> 추후 플레이어 클래스의 데미지로 변경
    console.log(`[${attackerName}] 타겟이 사거리 내에 있습니다. 공격 진행합니다.`);
    const skillAttackResult = {
      skillId: 1, // 스킬 아이디
      targetId,
      damageDealt: 50,
    };
    const payload = {
      skillAttackResult,
      success: true,
      message: '공격에 성공하였습니다.',
    };
    const packet = createResponse('dungeon', 'S_PlayerAction', PACKET_TYPE.S_PLAYERACTION, payload);
    socket.write(packet);
  }
};

// 클라측에서 회피를 요청할떄 처리할 핸들러
const processDodgeHandler = (socket, requesterName, currentPosition, direction) => {
  console.log('바라보는 방향 : ', direction);

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
    dodgeDistance: player.dodge.dodgeRange,
    direction: direction,
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

// 클라측에서 힐?을 요청할떄 처리할 핸들러 -> 애매
const processHealHandler = (socket, healerName, targetName) => {};

// 클라측에서 피격 요청할떄 처리할 핸들러
const processHitHandler = (socket, attackerName, targetName) => {};
