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
    this.grid = grid;
    this.options = Object.assign(
      {
        rightAngle: false,
        optimalResult: true,
        maxDepth: 1000,
        heuristic: 'manhattan',
      },
      options,
    );
    this.openList = new PriorityQueue();
    this.closeList = new Set();

    
  }

  search(start, end) { 
    this.start = start;
    this.end = end;

    if (!this.isValid(start) || !this.isValid(end)) {
      console.error('Invalid start or end position');
      return null;
    }

    let depth = 0;
    this.openList.enqueue(start, 0);
    const cameFrom = new Map();
    const gScore = new Map();
    gScore.set(start.toString(), 0);

    while (!this.openList.isEmpty() && depth < this.options.maxDepth) {
      let current = this.openList.dequeue();

      if (current.toString() === end.toString()) {
        console.log('End node reached! Reconstructing path...');
        return this.reconstructPath(cameFrom, current);
      }

      this.closeList.add(current.toString());
      for (let neighbor of this.getNeighbors(current)) {
        if (this.closeList.has(neighbor.toString())) continue;

        let tentativeGScore = gScore.get(current.toString()) + this.g(current, neighbor);

        if (!gScore.has(neighbor.toString()) || tentativeGScore < gScore.get(neighbor.toString())) {
          cameFrom.set(neighbor.toString(), current);
          gScore.set(neighbor.toString(), tentativeGScore);
          let fScore = tentativeGScore + this.h(neighbor, end);
          this.openList.enqueue(neighbor, fScore);
        }
      }
      depth++;
    }

    console.log('No valid path found');
    return null; // No valid path found
  }

  reconstructPath(cameFrom, current) {
    const path = [current];
    console.log(`Reconstructing Path:`);
    while (cameFrom.has(current.toString())) {
      current = cameFrom.get(current.toString());
      //console.log(`Step: ${current}`);
      path.unshift(current);
    }
    console.log(`Final Path:`, path);
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
    return 14; // 대각선 이동 (14)
  }

  h(node, end) {
    const dx = Math.abs(node[0] - end[0]);
    const dy = Math.abs(node[1] - end[1]);

    // 휴리스틱: 맨해튼 거리 또는 유클리드 거리
    return this.options.heuristic === 'euclidean'
      ? Math.sqrt(dx * dx + dy * dy) * 10
      : (dx + dy) * 10;
  }
}
