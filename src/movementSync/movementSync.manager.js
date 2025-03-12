import MovementSync from './movementSync.class.js';
const movementSyncs = {};

/*
movementSync 클래스 인스턴스를 관리하는 매니저
movementSync 인스턴스는 던전에 종속되므로, 던전에서 생성하고 관리하는 것이 좋을 것 같다.
어차피 town도 세션으로 관리해줘야 한다. town도 던전과 같은 방식으로 movementSync를 생성하고 관리하는 것이 좋을 것 같다.
*/

// [movementSync 생성].
export const createMovementSync = (movementSyncId, type) => {
  if (findMovementSync(movementSyncId)) {
    console.log(`movementSync 이미 존재: ${movementSyncId}`);
    return false;
  }
  // 생성
  movementSyncs[movementSyncId] = new MovementSync(movementSyncId);
  // 네브메쉬데이터 그리드로 변환
  movementSyncs[movementSyncId].loadNavMeshDataOnce(movementSyncId);
  // 셋인터벌 실행.
  movementSyncs[movementSyncId].startMovementProcess();
  return true;
};

// [movementSync 찾기].
export const findMovementSync = (movementSyncId) => {
  return movementSyncs[movementSyncId] || null;
};

// [movementSync 제거].
export const deleteMovementSync = (movementSyncId) => {
  if (!findMovementSync(movementSyncId)) {
    console.log(`movementSync 가 존재 하지 않습니다 (id : ${movementSyncId})`);
    return false;
  }

  // 진행중이던 setInterval 종료
  movementSyncs[movementSyncId].endProcessMovement();

  // movementSync 삭제.
  delete movementSyncs[movementSyncId];
};

// [유저 추가]
export const addUser = (movementSyncId, socket, id, transform) => {
  if (!findMovementSync(movementSyncId)) {
    console.log(`[유저 추가] movementSync 가 존재 하지 않습니다 (id : ${movementSyncId})`);
    return false;
  }

  movementSyncs[movementSyncId].addUser(socket, id, transform);
};


// [유저 찾기]
export const findUser = (movementSyncId, id) => {
  if (!findMovementSync(movementSyncId)) {
    console.log(`[유저 찾기] movementSync 가 존재 하지 않습니다 (id : ${movementSyncId})`);
    return false;
  }

  return movementSyncs[movementSyncId].findUser(id);
};

export const findUsers = (movementSyncId) => {
  if (!findMovementSync(movementSyncId)) {
    console.log(`[유저 찾기] movementSync 가 존재 하지 않습니다 (id : ${movementSyncId})`);
    return false;
  }

  return movementSyncs[movementSyncId].findUsers();
};

// [유저 업데이트]
export const updateUser = (movementSyncId, id, transform, timestamp) => {
  if (!findMovementSync(movementSyncId)) {
    console.log(`[유저 업데이트] movementSync 가 존재 하지 않습니다 (id : ${movementSyncId})`);
    return false;
  }

  movementSyncs[movementSyncId].updateUser(id, transform, timestamp);
};

// [유저 삭제 ]
export const deleteUser = (movementSyncId, id) => {
  if (!findMovementSync(movementSyncId)) {
    console.log(`[유저 삭제 ] movementSync 가 존재 하지 않습니다 (id : ${movementSyncId})`);
    return false;
  }

  // 이곳에서 삭제.
  // const sDespawn = {
  //   playerId: id,
  // };

  // // 만들어진 패킷을 직렬화.
  // const initialResponse = createResponse('user', 'S_Despawn', PACKET_TYPE.S_DESPAWN, sDespawn);

  // // 브로드 캐스트.
  // movementSyncs[movementSyncId].broadcast2(initialResponse);

  // 유저 삭제
  movementSyncs[movementSyncId].deleteUser(id);
};

export const addMonster = (movementSyncId) => {
  if (!findMovementSync(movementSyncId)) {
    console.log(`movementSync 가 존재 하지 않습니다 (id : ${movementSyncId})`);
    return false;
  }

  movementSyncs[movementSyncId].processMonsterSpawn();
  //movementSyncs[movementSyncId].addMonster(movementSyncId);
};

// [ 몬스터 찾기 ]
export const findMonster = (movementSyncId, id) => {
  if (!findMovementSync(movementSyncId)) {
    console.log(`[ 몬스터 찾기 ] movementSync 가 존재 하지 않습니다 (id : ${movementSyncId})`);
    return false;
  }

  return movementSyncs[movementSyncId].findMonster(id);
};

// [몬스터들 찾기]
export const findMonsters = (movementSyncId) => {
  if (!findMovementSync(movementSyncId)) {
    console.log(`[몬스터들 찾기] movementSync 가 존재 하지 않습니다 (id : ${movementSyncId})`);
    return false;
  }

  return movementSyncs[movementSyncId].findMonsters();
};

// [ 몬스터 삭제 ]
export const deleteMonster = (movementSyncId, id) => {
  if (!findMovementSync(movementSyncId)) {
    console.log(`[ 몬스터 삭제 ] movementSync 가 존재 하지 않습니다 (id : ${movementSyncId})`);
    return false;
  }

  return movementSyncs[movementSyncId].deleteMonster(id);
};

// [몬스터 피격]
export const monsterApplyDamage = (movementSyncId, id, damage) => {
  if (!findMovementSync(movementSyncId)) {
    console.log(`movementSync 가 존재 하지 않습니다 (id : ${movementSyncId})`);
    return false;
  }

  // 1. 몬스터 찾는다.
  const monster = findMonster(movementSyncId, id);

  // 1-1. 몬스터 검증.
  if (monster) {
    // 2. 몬스터 피격 체력 업데이트
    let monsterHp = monster.getHp();
    monsterHp -= damage;
    console.log('몬스터 체력 :', monsterHp);
    monster.setHp(monsterHp);

    // 2-2. 몬스터 체력 조건문.
    if (monsterHp <= 0) {
      // 3. 몬스터 사망처리
      monster.setIsDie(true);

      // 4. 몬스터 사망 클라이언트에 브로드 캐스트.
      movementSyncs[movementSyncId].updateMonsterDie(movementSyncId);
    } else {
      // 5. 몬스터 피격 클라이언트에 브로드 캐스트.
      // 무게, 파워, 밀리는강도, 지속시간)
      monster.updateDamageCount(1, 20, 40, 0.2);
      movementSyncs[movementSyncId].updateMonsterDamage();
    }
  } else {
    return console.log('해당 몬스터는 존재 하지않습니다.');
  }
}

// [유저 피격]
export const userApplyDamage = (movementSyncId, userId, monsterId) =>{
  if (!findMovementSync(movementSyncId)) {
    console.log(`movementSync 가 존재 하지 않습니다 (id : ${movementSyncId})`);
    return false;
  }

  // console.log("[유저가 넉백하는 시점]")

  // 유저, 몬스터 정보를 불러온다.
  const monster = findMonster(movementSyncId, monsterId);
  const user = findUser(movementSyncId, userId);

  if(user){
    // 유저 넉백은 이동만.
    user.updateDamageCount(1, 20, 40, 0.2, monster.getCurrentTransform());
  }

}

// [보스 피격]
export const bossApplyDamage = (movementSyncId, damage) => {
  if (!findMovementSync(movementSyncId)) {
    console.log(` movementSync 가 존재 하지 않습니다 (id : ${movementSyncId})`);
    return false;
  }

  // 보스체력 업데이트
  const boss = movementSyncs[movementSyncId].findBosses();
  let bossHp = boss[0].getHp();
  bossHp -= damage;
  boss[0].setHp(bossHp);

  // 보스 사망 검증 
  if(bossHp <= 0){
    boss[0].bossDie();
    boss[0].deleteBoss(boss[0].id);
  } else {
    boss[0].bossTakeDamage(damage);
  }

}

// [보스 스킬]
export const handleBossSkill = (movementSyncId, bossId, packetData ) => {
  if (!findMovementSync(movementSyncId)) {
    console.log(` movementSync 가 존재 하지 않습니다 (id : ${movementSyncId})`);
    return false;
  }

  const boss = movementSyncs[movementSyncId].findBoss(bossId);
  const users = findUsers(movementSyncId);

  if(boss){
    boss.handleBossSkill(packetData, users);
  } else{
    console.log("보스가 존재 하지 않습니다. : ", bossId);
  }
}
