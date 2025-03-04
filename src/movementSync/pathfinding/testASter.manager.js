import TestASter from './testASter.js';

// [A*]를 담을 객체 (id 키값으로 맵핑)
const testASters = {};

// [A*] 추가
const addASter = (id, navMeshData, gridWidth, gridHeight) => {
  // 검증
  if (testASters[id]) {
    return console.log('❌ 이미 [A*]가 있습니다 - ID : ', id);
  }

  testASters[id] = new TestASter(navMeshData, gridWidth, gridHeight);
};

// [A*] 삭제
const deleteSter = (id) => {
  // 검증
  if (!testASters[id]) {
    return console.log('❌ 존재하지않는 [A*] 입니다. - ID : ', id);
  }

  delete testASters[id];
}

// [A*] 장애물 업데이트
const updateObstacleAter = (id, entity) => {
  // 검증
  if (!testASters[id]) {
    return console.log('❌ 존재하지않는 [A*] 입니다. - ID : ', id);
  }

  // 장애물 업데이트.
  testASters[id].updateGrid(entity);
};

// [A*] 장애물 제거.
const deleteObstacleAter = (id,obstacleId ) => {
  testASters[id].removeObstacle(obstacleId);
}

// [A*] 장애물 리스트 제거.
const deleteObstacleAterList = (id,obstacleId ) => {
  testASters[id].deleteObstacleList(obstacleId);
}

// [A*] 장애물 리스트 찾기.
const firndObstacleAterList = (id ) => {
  return testASters[id].findEntityObstacles();
}

// [A*] 장애물 찾기 - 인덱스.
const findObstacle = (id, gridIndex) =>{
  return testASters[id].findEntityObstacle(gridIndex);
}

// [A*] 장애물 찾기 - 좌표.
const findObstacleAtPosition  = (id, pos) =>{
  return testASters[id].findObstacleAtPosition(pos);
}

// [A*] 길찾기
const findPath = (id, startPos, endPos) => {
  // 검증
  if (!testASters[id]) {
    return console.log('❌ 존재하지않는 [A*] 입니다. - ID : ', id);
  }

  // 길찾기.
  return testASters[id].aSterFindPath(startPos, endPos);
};

// [A*] 매니저
const A_STER_MANAGER = {
  ADD: addASter,
  DELETE: deleteSter,
  DELETE_OBSTACLE: deleteObstacleAter,
  FIND_OBSTACLE: findObstacle,
  FIND_OBSTACLE_POSITION: findObstacleAtPosition,
  FIND_OBSTACLE_List: firndObstacleAterList,
  DELETE_OBSTACLE_List:deleteObstacleAterList,
  UPDATE_OBSTACLE: updateObstacleAter,
  FIND_PATH: findPath,
};

export default A_STER_MANAGER;
