class ArrowPool {
  constructor(poolSize = 300) {
    this.pool = []; // 이제 풀은 하나의 배열로 관리
    this.poolSize = poolSize;
    this.arrowCounter = 0;

    // 화살을 미리 생성하여 풀에 넣기
    for (let i = 0; i < poolSize; i++) {
      const type = i % 3; // 0, 1, 2로 타입을 순차적으로 설정
      this.pool.push(this.createArrow(type)); // 풀에 화살을 넣음
    }
  }

  // 특정 type의 화살을 가져오기
  getArrow(type) {
    // 풀에서 해당 타입의 화살을 찾음
    for (let i = 0; i < this.pool.length; i++) {
      if (this.pool[i].type === type) {
        const arrow = this.pool.splice(i, 1)[0]; // 해당 화살을 찾아서 풀에서 제거
        return arrow;
      }
    }
    return null; // 해당 타입의 화살이 없으면 null 반환
  }

  // 화살을 풀에 반환
  returnArrow(arrow) {
    // 풀에 반환할 화살의 상태를 초기화한 후 다시 넣음
    arrow.position = { x: 0, y: 0, z: 0 };
    arrow.direction = { x: 0, y: 0, z: 0 };
    arrow.speed = 0;
    arrow.maxDistance = 0;
    arrow.traveledDistance = 0;

    this.pool.push(arrow); // 풀에 반환
  }

  // 새 화살 객체 생성 (ID와 type을 미리 부여)
  createArrow(type) {
    return {
      arrowId: this.arrowCounter++, // 화살 생성 시점에서 ID를 부여
      type: type, // 화살의 종류를 지정
      position: { x: 0, y: 0, z: 0 },
      direction: { x: 0, y: 0, z: 0 },
      speed: 0,
      maxDistance: 0,
      traveledDistance: 0,
    };
  }
}

export default ArrowPool;
