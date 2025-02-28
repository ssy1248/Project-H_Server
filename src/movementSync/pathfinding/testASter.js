import { Grid } from 'fast-astar';
import { AStar } from './AStar.js';

export default class TestASter {
  constructor(navMeshData, gridWidth, gridHeight) {
    // 네비게이션 메쉬 데이터 초기화
    this.vertices = navMeshData.vertices; // 정점 데이터
    this.indices = navMeshData.indices;   // 인덱스 데이터

    // 그리드 크기 설정
    this.gridWidth = gridWidth; 
    this.gridHeight = gridHeight;

    // A* 알고리즘을 위한 그리드 설정
    this.grid = new Grid({
      col: this.gridWidth, // 열의 개수
      row: this.gridHeight, // 행의 개수
    });

    // 장애물 저장 객체
    this.entityObstacles = {};

    // 네비메쉬의 최소 좌표를 기준으로 오프셋 계산
    const minX = Math.min(...this.vertices.map((p) => p.x));
    const minZ = Math.min(...this.vertices.map((p) => p.z));

    // 음수 좌표를 방지하기 위한 오프셋
    this.offsetX = minX < 0 ? Math.abs(minX) : minX; 
    this.offsetZ = minZ < 0 ? Math.abs(minZ) : minZ; 
  }

  // A* 알고리즘을 사용한 경로 찾기 테스트
  testPathfinding() {
    const startPos = [0, 0, 0]; // 시작 위치 (3D 좌표)
    const endPos = [10, 0, 10]; // 끝 위치 (3D 좌표)

    // 장애물 생성
    this.addObstacle([38, 110], "1");

    // A* 경로 탐색
    const path = this.aSterFindPath(startPos, endPos);

    // 경로 출력
    console.log('찾은 경로:', path);
  }

  // A* 알고리즘을 이용한 경로 찾기
  aSterFindPath(startPos, endPos) {
    let startGrid = this.coordToIndex(startPos); // 시작 좌표를 그리드 인덱스로 변환
    let endGrid = this.coordToIndex(endPos); // 끝 좌표를 그리드 인덱스로 변환

    console.log('startGrid', startGrid);
    console.log('endGrid', endGrid);

    // 시작 좌표와 끝 좌표가 유효한지 체크
    if (
      startGrid.index < 0 ||
      startGrid.index >= this.gridWidth * this.gridHeight ||
      endGrid.index < 0 ||
      endGrid.index >= this.gridWidth * this.gridHeight
    ) {
      console.log('잘못된 좌표');
      return []; // 유효하지 않은 좌표인 경우 빈 배열 반환
    }

    // A* 알고리즘 옵션 설정
    const options = {
      rightAngle: false, // 직각 방향만 이동을 허용
      //heuristic: 'manhattan', // 맨해튼 거리를 휴리스틱으로 사용
      heuristic: 'euclidean', // 유클리드 거리를 휴리스틱으로 사용
    };

    // AStar 클래스 인스턴스 생성
    const astar = new AStar(this.grid, options);

    // 경로 탐색
    const path = astar.search(
      [startGrid.index % this.gridWidth, Math.floor(startGrid.index / this.gridWidth)],
      [endGrid.index % this.gridWidth, Math.floor(endGrid.index / this.gridWidth)],
    );

    console.log('start :', [
      startGrid.index % this.gridWidth,
      Math.floor(startGrid.index / this.gridWidth),
    ]);
    console.log('end :', [
      endGrid.index % this.gridWidth,
      Math.floor(endGrid.index / this.gridWidth),
    ]);

    console.log("장애물 : ", this.entityObstacles);

    // 경로가 없으면 빈 배열 반환
    if (!path || path.length === 0) {
      console.log('경로를 찾을 수 없습니다.');
      return []; // 경로를 찾을 수 없으면 빈 배열 반환
    }

    // 2D 경로를 3D 좌표로 변환
    let pathCoords = path.map((coord) => {
      let x = coord[0];
      let z = coord[1];

      // 그리드 인덱스를 3D 좌표로 변환 (오프셋 포함)
      let { index, offsetX, offsetZ } = this.coordToIndex([x, 0, z]);
      let y = this.getYForXZ(x, z); // Y 값을 계산

      // 3D 좌표로 반환
      return [x - this.offsetX + offsetX, y, z - this.offsetZ + offsetZ];
    });

    return pathCoords; // 계산된 3D 경로 반환
  }

  // 3D 좌표를 그리드 인덱스로 변환
  coordToIndex(coord) {
    let x = coord[0];
    let z = coord[2];

    // x, z 좌표에 오프셋을 더한 후, 그리드로 변환
    x = Math.floor(x + this.offsetX);
    z = Math.floor(z + this.offsetZ);

    // 그리드 범위 밖으로 벗어나지 않도록 처리
    if (x < 0) x = 0;
    if (z < 0) z = 0;

    // 그리드 인덱스 계산
    const index = x + z * this.gridWidth;

    // 소수점 처리 (보간값)
    const offsetX = coord[0] - Math.floor(coord[0]);
    const offsetZ = coord[2] - Math.floor(coord[2]);

    return { index, offsetX, offsetZ };
  }

  // 그리드 인덱스를 좌표로 변환
  indexToCoords(index, offsetX, offsetZ) {
    let x = index % this.gridWidth;
    let z = Math.floor(index / this.gridWidth);

    let actualX = x - this.offsetX + offsetX;
    let actualZ = z - this.offsetZ + offsetZ;

    return [actualX, actualZ];
  }

  // (x, z) 좌표에 대한 y 값을 계산 (삼각형 평면 방정식 사용)
  getYForXZ(x, z) {
    let closestY = null;

    // 삼각형을 탐색하여 y 값을 찾음
    for (let i = 0; i < this.indices.length; i += 3) {
      const idx1 = this.indices[i];
      const idx2 = this.indices[i + 1];
      const idx3 = this.indices[i + 2];

      const p1 = this.vertices[idx1];
      const p2 = this.vertices[idx2];
      const p3 = this.vertices[idx3];

      const vector1 = { x: p2.x - p1.x, y: p2.y - p1.y, z: p2.z - p1.z };
      const vector2 = { x: p3.x - p1.x, y: p3.y - p1.y, z: p3.z - p1.z };

      // 법선 벡터 계산
      const normal = {
        x: vector1.y * vector2.z - vector1.z * vector2.y,
        y: vector1.z * vector2.x - vector1.x * vector2.z,
        z: vector1.x * vector2.y - vector1.y * vector2.x,
      };

      const A = normal.x;
      const B = normal.y;
      const C = normal.z;
      const D = -(A * p1.x + B * p1.y + C * p1.z);

      // y 값 계산
      if (A * x + C * z + D !== 0) {
        const y = -(A * x + C * z + D) / B;
        closestY = y;
        break; // 첫 번째 삼각형에서 찾으면 바로 종료
      }
    }

    return closestY;
  }

  deleteObstacleList(id) {
    delete this.entityObstacles[id];
  }

  // 장애물 추가
  addObstacle(obstacle, id) {
    this.grid.set(obstacle, 'value', 1); // 장애물 위치 그리드에 설정

    // 장애물 추가
    this.entityObstacles[id] = obstacle;
    console.log('추가한 entityObstacles :', this.entityObstacles[id]);
  }

  // 장애물 제거
  removeObstacle(id) {
    const obstacle = this.entityObstacles[id];

    // 장애물이 존재하는 경우
    if (obstacle) {
      this.grid.set(obstacle, 'value', 0); // 그리드에서 장애물 제거
      const storedValue = this.grid.get([obstacle[0], obstacle[1]]); // 그리드 값 확인
      console.log(`⭕ 장애물 삭제 확인 (${obstacle[0]}, ${obstacle[1]}):`, storedValue);
    } else {
      console.log('제거 할 장애물이 ❌ 없음');
    }
  }

  getObstacles(entity) {
    const pos = [
      entity.currentTransform.posX,
      entity.currentTransform.posY,
      entity.currentTransform.posZ,
    ];
    const obstaclePos = this.coordToIndex(pos);
    const obstacle = {
      id: entity.id,
      obstacle: [obstaclePos.index % this.gridWidth, Math.floor(obstaclePos.index / this.gridWidth)],
    }

    return obstacle;
  }

  // 장애물 정보를 그리드에 업데이트
  updateGrid(entity) {
    this.updateObstacles(this.getObstacles(entity)); // 장애물 업데이트
  }

  // 장애물 정보 업데이트
  updateObstacles(obstacle) {
    this.removeObstacle(obstacle.id); // 기존 장애물 제거
    this.addObstacle(obstacle.obstacle, obstacle.id); // 새 장애물 추가
  }
}
