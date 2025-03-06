import _ from 'lodash';

class PriorityQueue {
  constructor() {
    this.queue = [];
  }

  enqueue(node, priority) {
    this.queue.push({ node, priority });
    this.queue.sort((a, b) => a.priority - b.priority);
  }

  dequeue() {
    return this.queue.shift().node;
  }

  isEmpty() {
    return this.queue.length === 0;
  }
}

export class AStar {
  constructor(grid, options = {}) {
    // 그리드를 참조가 아닌 깊은 복사로 가져오기.
    // 동적 장애물 갱신에 영향 가능성을 없애기 위해 깊은 복사 진행.
    this.grid = _.cloneDeep(grid); 
    this.options = Object.assign(
      {
        rightAngle: false,
        optimalResult: true,
        maxDepth: 30000,
        heuristic: 'manhattan',
      },
      options,
    );
    this.openList = new PriorityQueue();
    this.closeList = new Set();
    this.retryCount = 0;
  }

  search(start, end) {
    this.start = start;
    this.end = end; // 도착지 보정

    if (!this.isValid(start)) {
      // 1. 중대한 버그가 있을 수 있음
      // 2. 예를 들면 스타트랑 엔드랑 같을수도 있음.
      this.start = this.findNearestValidPointAroundStart(start);
      //console.error('Invalid start position');
      //return null;
    }

    // 2. 도착지 유효성 체크
    if (this.isValid(this.end)) {
      // 2-1. 도착지점이 유효할 경우
      if (this.isSurroundingBlocked(this.end)) {
        // 2-2. 도착지 주변이 막혀 있으면 시작점 인근으로 보정
        console.log('도착지 주변이 막혀서 시작점 인근으로 보정');
        this.end = this.findNearestValidPointAroundStart(start);
      }
    } else {
      // 3. 도착지가 유효하지 않으면 주변을 확인
      if (this.isSurroundingBlocked(this.end)) {
        // 3-1. 주변이 모두 막혀 있으면 시작점 인근으로 보정
        console.log('도착지 이미 장애물이고 주변이 막혀있으면 시작점 인근으로 보정 ');
        this.end = this.findNearestValidPointAroundStart(start);
      } else {
        // 3-2. 도착지가 막혀있지 않다면 근처의 유효한 도착지 찾기
        console.log('도착지 주변이 안막혔다면 근처로 도착점 지정.');
        this.end = this.findNearestValidPoint(end);
      }
    }


    // 그래도 유효한 위치가 없으면 리트라이 
    if (!this.isValid(this.end) || !this.isValid(this.start)) {
      if (this.retryCount >= 3) {  // 최대 3번까지만 재시도
        console.error('리트라이 횟수를 넘겼다.');
        return null;
      }

      this.retryCount = (this.retryCount || 0) + 1; // 재시도 횟수 증가
      return this.search(this.start, this.end); // 재귀 호출 후 결과 반환
    }

    let depth = 0;
    this.openList.enqueue(start, 0);
    const cameFrom = new Map();
    const gScore = new Map();
    gScore.set(start.toString(), 0);

    while (!this.openList.isEmpty() && depth < this.options.maxDepth) {
      let current = this.openList.dequeue();

      if (current.toString() === this.end.toString()) {
        //console.log('End node reached! Reconstructing path...');
        return this.reconstructPath(cameFrom, current);
      }

      this.closeList.add(current.toString());
      for (let neighbor of this.getNeighbors(current)) {
        if (this.closeList.has(neighbor.toString())) continue;

        let tentativeGScore = gScore.get(current.toString()) + this.g(current, neighbor);

        if (!gScore.has(neighbor.toString()) || tentativeGScore < gScore.get(neighbor.toString())) {
          cameFrom.set(neighbor.toString(), current);
          gScore.set(neighbor.toString(), tentativeGScore);
          let fScore = tentativeGScore + this.h(neighbor, this.end);
          this.openList.enqueue(neighbor, fScore);
        }
      }
      depth++;
    }

    // 여기오는거 같은데 ?
    // 여기 왜오는데!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

    console.log('No valid path found');
    console.error(`start: ${this.start}, end: ${this.end}`);
    console.log()


    return null; // 경로 탐색 실패
  }

  // 도착지점이 비정상일 경우 도착지점 재지정
  findNearestValidPoint([x, y]) {
    if (this.isValid([x, y])) return [x, y]; // 도착지가 유효하면 그대로 사용

    const directions = [
      [0, 1],
      [1, 0],
      [0, -1],
      [-1, 0], // 4방향
      [-1, -1],
      [-1, 1],
      [1, -1],
      [1, 1], // 대각선 포함
    ];

    let queue = [[x, y]];
    let visited = new Set();
    let validPoints = []; // 여러 개의 유효한 좌표 저장
    visited.add(`${x},${y}`);

    let maxDepth = 10; // 탐색 깊이 제한 (예: 10칸 거리까지)
    let depth = 0;

    while (queue.length > 0 && depth < maxDepth) {
      let nextQueue = []; // 다음 깊이 탐색을 위한 새로운 큐

      for (let [cx, cy] of queue) {
        for (let [dx, dy] of directions) {
          let nx = cx + dx,
            ny = cy + dy;

          if (!visited.has(`${nx},${ny}`)) {
            nextQueue.push([nx, ny]); // 먼저 큐에 넣음
            visited.add(`${nx},${ny}`); // 방문 체크는 여기서 추가

            if (this.isValid([nx, ny])) {
              //console.log('유효한 위치 저장: ', nx, ny);
              validPoints.push([nx, ny]); // 유효한 위치 저장
            } else {
              //console.log('유효한 위치 저장 못함: ', nx, ny);
            }
          }
        }
      }

      if (validPoints.length > 0) break; // 유효한 위치가 있으면 종료

      queue = nextQueue;
      depth++;
    }

    // 유효한 위치 중 랜덤으로 하나 선택
    if (validPoints.length > 0) {
      let randomIndex = Math.floor(Math.random() * validPoints.length);
      console.log('랜덤으로 선택된 인덱스:', randomIndex, '좌표:', validPoints[randomIndex]);
      return validPoints[randomIndex];
    }

    console.log('엔드포인트 못찾는다.');
    return [-1, -1]; // 이동 가능한 위치가 아예 없으면 실패
  }

  findNearestValidPointAroundStart(start) {
    const directions = [
      [0, 1],
      [1, 0],
      [0, -1],
      [-1, 0], // 4방향
      [-1, -1],
      [-1, 1],
      [1, -1],
      [1, 1], // 대각선 포함
    ];

    let queue = [start]; // 시작 지점으로부터 탐색 시작
    let visited = new Set();
    visited.add(`${start[0]},${start[1]}`);

    while (queue.length > 0) {
      let [cx, cy] = queue.shift();

      for (let [dx, dy] of directions) {
        let nx = cx + dx,
          ny = cy + dy;

        // 유효한 위치인지 검사
        if (!visited.has(`${nx},${ny}`) && this.isValid([nx, ny])) {
          return [nx, ny]; // 유효한 위치를 찾으면 바로 반환
        }
        visited.add(`${nx},${ny}`);
        queue.push([nx, ny]);
      }
    }

    return [-1, -1]; // 유효한 위치가 없다면 실패
  }

  // 도착지 지점이 막혔는가.
  isSurroundingBlocked([x, y]) {
    const directions = [
      [0, 1],
      [1, 0],
      [0, -1],
      [-1, 0], // 4방향
      [-1, -1],
      [-1, 1],
      [1, -1],
      [1, 1], // 대각선 포함
    ];

    // 주변 8방향을 확인하여 모두 막혀 있는지 체크
    for (let [dx, dy] of directions) {
      let nx = x + dx,
        ny = y + dy;
      if (this.isValid([nx, ny])) {
        return false; // 주변에 유효한 공간이 있으면 false 반환
      }
    }

    return true; // 주변이 모두 막혀 있으면 true 반환
  }

  reconstructPath(cameFrom, current) {
    const path = [current];
    //console.log(`Reconstructing Path:`);
    while (cameFrom.has(current.toString())) {
      current = cameFrom.get(current.toString());
      //console.log(`Step: ${current}`);
      path.unshift(current);
    }
    //console.log(`Final Path:`, path);
    return path;
  }

  getNeighbors([x, y]) {
    const directions = this.options.rightAngle
      ? [
          // 직각 이동 (4방향)
          [0, 1], // 위
          [1, 0], // 오른쪽
          [0, -1], // 아래
          [-1, 0], // 왼쪽
        ]
      : [
          // 대각선 포함 (8방향)
          [0, 1], // 위
          [1, 0], // 오른쪽
          [0, -1], // 아래
          [-1, 0], // 왼쪽
          [-1, -1], // 왼쪽 아래
          [-1, 1], // 왼쪽 위
          [1, -1], // 오른쪽 아래
          [1, 1], // 오른쪽 위
        ];

    //console.log(`Calculating neighbors for [${x}, ${y}] with directions:`, directions);
    //console.log('Right Angle:', this.options.rightAngle); // true인지 false인지 확인

    const validNeighbors = directions
      .map(([dx, dy]) => [x + dx, y + dy])
      .filter(([nx, ny]) => this.isValid([nx, ny]));

    //console.log('Valid Neighbors:', validNeighbors);
    return validNeighbors;
  }

  isValid([x, y]) {
    return (
      x >= 0 && x < this.grid.col && y >= 0 && y < this.grid.row && this.grid.get([x, y]).value < 1
    );
  }

  g(current, neighbor) {
    if (current[0] === neighbor[0] || current[1] === neighbor[1]) {
      return 10; // 직선 이동 (10)
    }
    return 10; // 대각선 이동 (14)
  }

  h(node, end) {
    const dx = Math.abs(node[0] - end[0]);
    const dy = Math.abs(node[1] - end[1]);

    // 휴리스틱: 맨해튼 거리 또는 유클리드 거리
    // 유클리드 10
    // 맨핸튼 10
    return this.options.heuristic === 'euclidean'
      ? Math.sqrt(dx * dx + dy * dy) * 2
      : (dx + dy) * 5;
  }
}
