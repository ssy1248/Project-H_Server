import { getDungeonInPlayerName } from '../../../session/dungeon.session.js';

export const processPlayerActionHandler = (socket, packet) => {
  if (packet.normalAttack) {
    // 일반 공격 처리
    console.log('일반 공격 요청 처리');
    console.log('packet.normalAttack.attackerName : ', packet.normalAttack.attackerName);
    console.log('packet.normalAttack.targetId : ', packet.normalAttack.targetId);
    processAttackHandler(packet.normalAttack.attackerName, packet.normalAttack.targetId);
  } else if (packet.skillAttack) {
    // 스킬 공격 처리
    console.log('스킬 공격 요청 처리');
    // packet.skillAttack.skillId, packet.skillAttack.targetId 등을 사용하여 처리
  } else if (packet.dodgeAction) {
    // 회피 처리
    console.log('회피 요청 처리');
    // packet.dodgeAction.dodgeDistance 등을 사용하여 처리
  } else if (packet.hitAction) {
    // 피격 처리
    console.log('피격 요청 처리');
    // packet.hitAction.attackerId, packet.hitAction.damage 등을 사용하여 처리
  } else {
    console.error('알 수 없는 플레이어 액션');
  }
};

// 클라측에서 일반 공격 요청을 처리하는 함수
const processAttackHandler = (attackerName, targetId) => {
  let isAttack = true;
  // 던전안에 있는 유저를 찾음
  const attacker = getDungeonInPlayerName(attackerName);
  //const target = getMonsterById(targetId); //몬스터는 동일한 아이디로 여러마리가 생성이 될건데 이렇게 찾으면 안되지 않나?

  if (!attacker) {
    console.error('공격자를 찾을 수 없습니다.');
    return;
  }
  // 몬스터를 찾는 함수가 추가되면 수정
  if (targetId === 1) {
    // 타겟이 없더라도 공격은 가능하게
    console.log('헛손질');
  } else {
    // 서버에서 두 유저의 위치 정보 사용
    const posA = attacker.playersTransform[attackerName];
    //const posB = target.position;

    if (!posA || !posB) {
      console.error('유효한 위치 정보가 없습니다.');
      return;
    }

    // 두 점 사이의 거리를 계산
    const dx = posA.x - posB.x;
    const dy = posA.y - posB.y;
    const dz = posA.z - posB.z;
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

    // 공격 범위를
    if (distance > attacker.players[attackerName].normalAttack.attackRange) {
      console.log('타겟이 공격 범위 밖에 있습니다.');
      return;
    }

    if (isAttack) {
      // 공격 한 후엔 isAttack을 false로 세팅 (연속 공격 방지)
      isAttack = false;
      // 범위 내에 있다면 공격 처리 진행 (피해량 계산 등)
      console.log('타겟이 공격 범위 내에 있습니다. 공격 진행합니다.');
    }
  }
};

// 클라측에서 스킬 공격을 요청할떄 처리할 핸들러
const processSkillAttackHandler = (attackerName, targetId) => {
  let isSkillAttack = true;
  // 던전안에 있는 유저를 찾음
  const attacker = getDungeonInPlayerName(attackerName);
  //const target = getMonsterById(targetId); //몬스터는 동일한 아이디로 여러마리가 생성이 될건데 이렇게 찾으면 안되지 않나?

  if (!attacker /*|| !target*/) {
    console.error('공격자 또는 타겟을 찾을 수 없습니다.');
    return;
  }
  // 서버에서 두 유저의 위치 정보 사용
  const posA = attacker.playersTransform[attackerName];
  //const posB = target.position;

  if (!posA || !posB) {
    console.error('유효한 위치 정보가 없습니다.');
    return;
  }

  // 두 점 사이의 거리를 계산
  const dx = posA.x - posB.x;
  const dy = posA.y - posB.y;
  const dz = posA.z - posB.z;
  const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

  // 공격 범위를
  if (distance > attacker.players[attackerName].skillAttack.attackRange) {
    console.log('타겟이 공격 범위 밖에 있습니다.');
    return;
  }

  if (isSkillAttack) {
    // 공격 한 후엔 isAttack을 false로 세팅 (연속 공격 방지)
    isSkillAttack = false;
    // 범위 내에 있다면 공격 처리 진행 (피해량 계산 등)
    console.log('타겟이 공격 범위 내에 있습니다. 공격 진행합니다.');
  }
};

// 클라측에서 회피를 요청할떄 처리할 핸들러
const processDodgeHandler = (attackerName) => {};

// 클라측에서 힐?을 요청할떄 처리할 핸들러 -> 애매
const processHealHandler = (healerName, targetName) => {};

// 클라측에서 피격 요청할떄 처리할 핸들러
const processHitHandler = (attackerName, targetName) => {};

// 일반공격 쿨타임 계산 함수
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

// 스킬 쿨타임 계산 핸들러
const skillCoolTimeCalcute = (attackerName) => {
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

  // 플레이어의 스킬 공격 쿨타임을 밀리초로 변환하여 반환합니다.
  const delay = player.skillAttack.attackCoolTime * 1000;
  return delay;
};

const dodgeCoolTimeCalculate = (attackerName) => {
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

  // 플레이어의 회피 쿨타임을 밀리초로 변환하여 반환합니다.
  const delay = player.dodgeCoolTime * 1000;
  return delay;
};
