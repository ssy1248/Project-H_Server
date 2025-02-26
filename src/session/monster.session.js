import Monster from '../classes/models/monster.class';

const activeMonsters = new Map();

// 몬스터 추가
export const addMonster = (id, name, hp, atk, def, speed, position) => {
  if (activeMonsters.has(id)) {
    console.log(`이미 존재하는 몬스터 ID: ${id}`);
    return;
  }

  const monster = new Monster(id, name, hp, atk, def, speed, position);
  activeMonsters.set(id, monster);

  console.log(`몬스터 생성됨: ${name} (ID: ${id})`);
};

// 특정 몬스터 가져오기
export const getMonster = (id) => {
  return activeMonsters.get(id) || null;
};

// 모든 몬스터 가져오기
export const getAllMonster = () => {
  return Array.from(activeMonsters.values());
};

// 몬스터 제거
export const removeMonster = (id) => {
  if (activeMonsters.has(id)) {
    activeMonsters.delete(id);
    console.log(`몬스터 삭제됨 (ID: ${id})`);
  } else {
    console.warn(`삭제하려는 몬스터(ID: ${id})가 존재하지 않음.`);
  }
};

// 모든 몬스터 초기화 (게임 재시작 시)
export const clearMonsters = () => {
  activeMonsters.clear();
  console.log('모든 몬스터 세션 초기화됨.');
};
