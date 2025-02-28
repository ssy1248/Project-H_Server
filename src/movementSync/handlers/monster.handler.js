import { findMovementSync } from '../movementSync.manager.js';

// [몬스터 애니메이션 동기화] - 공격 브로드 캐스트.
const updateMonsterAttck = (movementSyncId) => {
  const movementSync = findMovementSync(movementSyncId);

  if (movementSync) {
    movementSync.updateMonsterAttck();
  }
};

// [몬스터 애니메이션 동기화] - 죽음 브로드 캐스트.
const updateMonsterDie = (movementSyncId) => {
  const movementSync = findMovementSync(movementSyncId);

  if (movementSync) {
    movementSync.updateMonsterDie();
  }
};

const MONSTER_SEND_MESSAGE= {
  ATTCK : updateMonsterAttck,
  DIE : updateMonsterDie,
  // 추가 작성..

}

export default MONSTER_SEND_MESSAGE;