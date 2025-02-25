// 서버측에서 공격 요청을 처리하는 함수
export const processAttack = (attackerId, targetId) => {
    const attacker = getUserById(attackerId);
    //const target = getMonsterById(targetId); //몬스터는 동일한 아이디로 여러마리가 생성이 될건데 이렇게 찾으면 안되지 않나?
  
    if (!attacker /*|| !target*/) {
      console.error('공격자 또는 타겟을 찾을 수 없습니다.');
      return;
    }
  
    // 서버에서 두 유저의 위치 정보 사용
    const posA = attacker.userInfo.position;
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
    if (distance > 5) { // 5 -> player의 normalAttack.attackRange
      console.log('타겟이 공격 범위 밖에 있습니다.');
      return;
    }
  
    // 범위 내에 있다면 공격 처리 진행 (피해량 계산 등)
    console.log('타겟이 공격 범위 내에 있습니다. 공격 진행합니다.');
  };
  