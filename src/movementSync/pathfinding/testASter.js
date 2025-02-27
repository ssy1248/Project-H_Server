import { Grid } from 'fast-astar';
import CONSTANTS from '../constants/constants.js';
import { AStar } from './AStar.js';

export default class TestASter {
  constructor(navMeshData, gridWidth, gridHeight) {
    this.vertices = navMeshData.vertices;
    this.indices = navMeshData.indices;

    this.gridWidth = gridWidth;
    this.gridHeight = gridHeight;

    this.grid = new Grid({
      col: this.gridWidth, // 열의 개수
      row: this.gridHeight, // 행의 개수
    });

    this.entityObstacles = {};

    const minX = Math.min(...this.vertices.map((p) => p.x));
    const minZ = Math.min(...this.vertices.map((p) => p.z));

    // console.log('minX :', minX);
    // console.log('minZ :', minZ);

    // 음수 좌표를 방지하기 위한 오프셋 (맵의 최소 좌표를 기준)
    this.offsetX = minX < 0 ? Math.abs(minX) : minX; // 오프셋 계산 수정
    this.offsetZ = minZ < 0 ? Math.abs(minZ) : minZ; // 오프셋 계산 수정
    // console.log('this.offsetX :', this.offsetX);
    // console.log('this.offsetZ :', this.offsetZ);

    //this.testPathfinding();

    //console.log(this.grid);
  }

  // A* 알고리즘을 사용한 경로 찾기 테스트
  testPathfinding() {
    const startPos = [0, 0, 0]; // 시작 위치 (3D 좌표)
    const endPos = [10, 0, 10]; // 끝 위치 (3D 좌표)
    // 장애물 생성
    this.addObstacle([38, 110], "1");

    const path = this.aSterFindPath(startPos, endPos);

    console.log('찾은 경로:', path);
  }

  // [에이스타]
  aSterFindPath(startPos, endPos) {
    let startGrid = this.coordToIndex(startPos);
    let endGrid = this.coordToIndex(endPos);

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

    const options = {
      rightAngle: false,
      heuristic: 'manhattan', // 휴리스틱으로 맨해튼 거리 사용
    };

    const astar = new AStar(this.grid, options);

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

      // x, y, z 값을 3D 좌표로 리턴
      return [x - this.offsetX + offsetX, y, z - this.offsetZ + offsetZ];
    });

    return pathCoords;
  }

  // 3D 좌표를 그리드 인덱스로 변환하는 함수 (보간 & 음수 처리 추가)
  coordToIndex(coord) {
    let x = coord[0];
    let z = coord[2];

    // x, z 좌표에 오프셋을 더한 후, 그리드로 변환
    x = Math.floor(x + this.offsetX);
    z = Math.floor(z + this.offsetZ);

    // x, z 좌표가 그리드 범위를 벗어나지 않도록 처리
    if (x < 0) x = 0;
    if (z < 0) z = 0;

    // 그리드 인덱스 계산
    const index = x + z * this.gridWidth;

    // 보간값을 계산하여 리턴 (그리드 좌표의 정수 부분과 소수 부분)
    const offsetX = coord[0] - Math.floor(coord[0]);
    const offsetZ = coord[2] - Math.floor(coord[2]);

    return { index, offsetX, offsetZ };
  }

  indexToCoords(index, offsetX, offsetZ) {
    let x = index % this.gridWidth;
    let z = Math.floor(index / this.gridWidth);

    let actualX = x - this.offsetX + offsetX;
    let actualZ = z - this.offsetZ + offsetZ;

    return [actualX, actualZ];
  }

  getYForXZ(x, z) {
    let closestY = null;

    // 모든 삼각형에 대해 반복
    for (let i = 0; i < this.indices.length; i += 3) {
      const idx1 = this.indices[i];
      const idx2 = this.indices[i + 1];
      const idx3 = this.indices[i + 2];

      // 삼각형의 세 점을 가져옵니다.
      const p1 = this.vertices[idx1];
      const p2 = this.vertices[idx2];
      const p3 = this.vertices[idx3];

      // 삼각형의 두 벡터를 계산합니다.
      const vector1 = { x: p2.x - p1.x, y: p2.y - p1.y, z: p2.z - p1.z };
      const vector2 = { x: p3.x - p1.x, y: p3.y - p1.y, z: p3.z - p1.z };

      // 법선 벡터 계산
      const normal = {
        x: vector1.y * vector2.z - vector1.z * vector2.y,
        y: vector1.z * vector2.x - vector1.x * vector2.z,
        z: vector1.x * vector2.y - vector1.y * vector2.x,
      };

      // 평면 방정식의 계수 계산
      const A = normal.x;
      const B = normal.y;
      const C = normal.z;
      const D = -(A * p1.x + B * p1.y + C * p1.z);

      // (x, z)에 대해 y값을 구합니다.
      if (A * x + C * z + D !== 0) {
        const y = -(A * x + C * z + D) / B;
        closestY = y;
        break; // 첫 번째 삼각형에서 찾으면 바로 종료
      }
    }

    return closestY;
  }

  addObstacle(obstacle, id) {
    // console.log(obstacle);
    this.grid.set(obstacle, 'value', 1);
    const storedValue = this.grid.get([obstacle[0], obstacle[1]]);
    // console.log(`저장된 값 확인 (${obstacle[0]}, ${obstacle[1]}):`, storedValue);

    // 장애물 추가.
    this.entityObstacles[id] = obstacle;
    console.log('추가한  entityObstacles :', this.entityObstacles[id]);
  }

  removeObstacle(id) {
    const obstacle = this.entityObstacles[id];

    // 검증
    if (obstacle) {
      this.grid.set(obstacle, 'value', 0);
      const storedValue = this.grid.get([obstacle[0], obstacle[1]]);
      console.log(`⭕ 장애물 삭제 확인 (${obstacle[0]}, ${obstacle[1]}):`, storedValue);
    } else {
      console.log('제거 할 장애물이 ❌ 없음');
    }
  }

  // 작성하자.
  // 이후에 하자.
  // 쉬었다가..
  getObstacles(entity) {
    const currentTransform = entity.getTransform();
    const obstaclePos = [currentTransform.posX, currentTransform.posY, currentTransform.posZ];

    const index = this.coordToIndex(obstaclePos);

    const obstacle = {
      obstacle: [index.index % this.gridWidth, Math.floor(index.index / this.gridWidth)],
      id: entity.getId(),
    };

    //console.log('zzz : ', obstacle);
    return obstacle;
  }

  updateGrid(entity) {
    this.updateObstacles(this.getObstacles(entity));
  }

  updateObstacles(obstacle) {
    this.removeObstacle(obstacle.id);
    this.addObstacle(obstacle.obstacle, obstacle.id);
  }
}
