class ArrowPool {
  constructor(poolSize = 100) {
    this.pool = [];
    this.poolSize = poolSize;
    this.arrowCounter = 0; // 고유한 화살 ID 카운터

    // 미리 풀에 지정된 개수만큼 화살을 생성해 놓음
    for (let i = 0; i < poolSize; i++) {
      this.pool.push(this.createArrow()); // 풀에 화살을 추가
    }
  }

  // 풀에서 화살을 가져오거나 없으면 null 반환
  getArrow() {
    if (this.pool.length > 0) {
      const arrow = this.pool.pop(); // 풀에서 화살을 꺼냄
      return arrow; // 이미 ID가 부여된 화살을 반환
    }
    return null; // 풀에 사용 가능한 화살이 없으면 null 반환
  }

  // 화살을 풀에 반환
  returnArrow(arrow) {
    // 풀에 반환할 화살의 상태를 초기화한 후 다시 넣음
    arrow.position = { x: 0, y: 0, z: 0 };
    arrow.direction = { x: 0, y: 0, z: 0 };
    arrow.speed = 0;
    arrow.maxDistance = 0;
    arrow.traveledDistance = 0;

    // 풀에 화살을 반환
    this.pool.push(arrow);
  }

  // 새 화살 객체 생성 (ID를 미리 부여)
  createArrow() {
    return {
      arrowId: this.arrowCounter++, // 화살 생성 시점에서 ID를 부여
      position: { x: 0, y: 0, z: 0 },
      direction: { x: 0, y: 0, z: 0 },
      speed: 0,
      maxDistance: 0,
      traveledDistance: 0,
    };
  }
}

export default ArrowPool;
