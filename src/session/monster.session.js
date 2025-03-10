import Monster from '../classes/models/monster.class.js';

const activeMonsters = new Map();

// 몬스터 추가
export const addMonster = (typeId, name, hp, atk, def, speed, position) => {
  const monster = new Monster(typeId, name, hp, atk, def, speed, position);
  activeMonsters.set(monster.id, monster); // id는 class에서 uuid 처리상태 종류는 typeId

  console.log(`몬스터 생성됨: ${name} (UUID: ${monster.id}, TypeID: ${typeId})`);
  return monster.id; // 생성된 몬스터의 UUID 반환
};

// 특정 몬스터 가져오기
export const getMonster = (id) => {
  const monster = activeMonsters.get(id);
  if (!monster) return null;

  // 죽은 몬스터는 가져오지 않음
  if (!monster.isAlive) {
    activeMonsters.delete(id);
    console.log(`몬스터 제거됨 (UUID: ${id}, 사망 상태)`);
    return null;
  }

  return monster;
};

// 모든 몬스터 가져오기 (살아있는 몬스터만 반환)
export const getAllMonsters = () => {
  return Array.from(activeMonsters.values()).filter((monster) => monster.isAlive);
};

// 몬스터 제거
export const removeMonster = (id) => {
  if (activeMonsters.has(id)) {
    activeMonsters.delete(id);
    console.log(`몬스터 삭제됨 (UUID: ${id})`);
  } else {
    console.warn(`삭제하려는 몬스터(UUID: ${id})가 존재하지 않음.`);
  }
};

// 모든 몬스터 초기화 (게임 재시작 시)
export const clearMonsters = () => {
  activeMonsters.clear();
  console.log('모든 몬스터 세션 초기화됨.');
};
