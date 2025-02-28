import Monster from '../classes/models/monster.class';

const activeMonsters = new Map(); // 던전별 몬스터 관리 (던전ID -> 몬스터Map)

// 던전ID가 없으면 초기화
const ensureDungeonExists = (dungeonId) => {
  if (!activeMonsters.has(dungeonId)) {
    activeMonsters.set(dungeonId, new Map());
  }
};

// 몬스터 추가
export const addMonster = (dungeonId, typeId, name, hp, atk, def, speed, position) => {
  ensureDungeonExists(dungeonId);

  const monster = new Monster(typeId, name, hp, atk, def, speed, position);
  activeMonsters.get(dungeonId).set(monster.id, monster); // id는 class에서 uuid 처리상태 종류는 typeId

  console.log(`[${dungeonId}] 몬스터 생성됨: ${name} (UUID: ${monster.id}, TypeID: ${typeId})`);
  return monster.id; // 생성된 몬스터의 UUID 반환
};

// 특정 몬스터 가져오기 (던전별)
export const getMonster = (dungeonId, monsterId) => {
  if (!activeMonsters.has(dungeonId)) return null;
  const monster = activeMonsters.get(dungeonId).get(monsterId);

  // 죽은 몬스터는 가져오지 않음
  if (!monster || !monster.isAlive) {
    activeMonsters.get(dungeonId).delete(monsterId);
    console.log(`[${dungeonId}] 몬스터 제거됨 (UUID: ${monsterId}, 사망 상태)`);
    return null;
  }

  return monster;
};

// 특정 던전의 모든 몬스터 가져오기 (살아있는 몬스터만)
export const getAllMonsters = (dungeonId) => {
  if (!activeMonsters.has(dungeonId)) return [];
  return Array.from(activeMonsters.get(dungeonId).values()).filter((monster) => monster.isAlive);
};

// 몬스터 제거 (던전별)
export const removeMonster = (dungeonId, monsterId) => {
  if (activeMonsters.has(dungeonId) && activeMonsters.get(dungeonId).has(monsterId)) {
    activeMonsters.get(dungeonId).delete(monsterId);
    console.log(`[${dungeonId}] 몬스터 삭제됨 (UUID: ${monsterId})`);
  } else {
    console.warn(`[${dungeonId}] 삭제하려는 몬스터(UUID: ${monsterId})가 존재하지 않음.`);
  }
};

// 특정 던전의 모든 몬스터 초기화
export const clearMonstersInDungeon = (dungeonId) => {
  if (activeMonsters.has(dungeonId)) {
    activeMonsters.get(dungeonId).clear();
    console.log(`[${dungeonId}] 던전의 모든 몬스터 초기화됨.`);
  }
};

// 전체 던전 몬스터 초기화 (게임 재시작 시)
export const clearAllMonsters = () => {
  activeMonsters.clear();
  console.log('모든 던전의 몬스터 세션 초기화됨.');
};
