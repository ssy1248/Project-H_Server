export const MONSTER_AI_BEHAVIOR = {
  IDLE: 0,            // 몬스터가 대기
  WANDER: 1,          // 몬스터가 주변을 돌아다님
  CHASE_SETTING: 2,   // 추격 (세팅)
  CHASE_NORMAL: 2,    // 추격 (일반)
  CHASE_FLANK: 3,     // 추격 (측면이동)
  CHASE_PAUSE: 4,     // 추격 (대기)
  CHASE_RETREAT  : 5, // 추격 (후퇴)
  ATTACK: 6,          // 몬스터가 유저가 근처에 있다면 공격
  RETURN: 7,          // 몬스터가 스폰 장소로 돌아감
  TAKING_DAMAGE: 8,   // 몬스터가 공격받고 있음
};

export class Monster {
  // 생성자.
  constructor(movementSyncId, id, index, model, name, hp) {
    // 몬스터 정보
    this.monsterInfo = {
      movementSyncId: movementSyncId,
      id: id,
      index: index,
      model: model,
      name: name,
      hp: hp,
      behavior: MONSTER_AI_BEHAVIOR.IDLE,
    };

    const randomTransform = {
      posX: this.generateRandomPlayerTransformInfo(-9, 9),
      posY: 1,
      // 130 고정은 나중에 생성관련에서 맵이 여러가지가 되면 보내주는 곳에서 맵인덱스를 보내서 그 맵인덱스에 맞게 더해주거나 아님 클라를 손보든 수정
      posZ: this.generateRandomPlayerTransformInfo(-8, 8) + 130,
      rot: this.generateRandomPlayerTransformInfo(0, 360),
    };

    // 몬스터 현재 트랜스폼 정보
    this.transformInfo = {
      posX: randomTransform.posX,
      posY: randomTransform.posY,
      posZ: randomTransform.posZ,
      rot: randomTransform.rot,
    };

    // 몬스터의 소환 트랜스폼 정보.
    this.spawnTransform = {
      posX: randomTransform.posX,
      posY: randomTransform.posY,
      posZ: randomTransform.posZ,
      rot: randomTransform.rot,
    };

    // 타겟 정보
    this.targetInfo = {
      userId: '',
      velocity: {
        x: 0,
        y: 0,
        z: 0,
      },
      transform: {
        posX: 0,
        posY: 0,
        posZ: 0,
        rot: 0,
      },
    };
  }

  // [Get] - monsterInfo
  getMonsterInfo() {
    return this.monsterInfo;
  }


  // [Get] - 행동패턴
  getBehavior() {
    return this.monsterInfo.behavior;
  }

  // [Set] - 행동패턴
  SetBehavior(behavior) {
    this.monsterInfo.behavior = behavior;
  }

  // [Get] - transformInfo
  getTransformInfo() {
    return this.transformInfo;
  }

  // [Set] - transformInfo
  SetTransformInfo(transform) {
    this.transformInfo = transform;
  }

  // [Get] - spawnTransform
  getSpawnTransform() {
    return this.spawnTransform;
  }

  // [Set] - spawnTransform
  SetSpawnTransform(spawnTransform) {
    this.spawnTransform = spawnTransform;
  }

  // [Get] - targetInfo
  getTargetInfo() {
    return this.targetInfo;
  }

  // [Set] - targetInfo
  SetTargetInfo(userId, transform , velocity) {
    this.targetInfo.userId = userId;
    this.targetInfo.transform = transform;
    this.targetInfo.velocity = velocity;
  }

  // 랜덤 좌표 및 회전 각도 생성 함수
  generateRandomPlayerTransformInfo(min, max) {
    // min ~ max 사이의 랜덤 값
    const randomValue = Math.floor(Math.random() * (max - min + 1)) + min;
    return randomValue;
  }

}

// 1. 길찾기는 100ms ~ 200ms 마다.
// 2. 타겟팅은 상하좌우 중앙 이렇게 해서 서로 겹치지 않게.?
// 3. 셋인터벌 2개로 하자.

/*
message MonsterStatus {
  int32 monsterIdx = 1;
  int32 monsterModel = 2;
  string monsterName = 3;
  float monsterHp = 4;
}

*/
