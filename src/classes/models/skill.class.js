class Skill {
  constructor(id, type, name, description, level, damage, cooldown, cost, range, duration) {
    this.id = id; // 스킬 아이디
    this.type = type; // 스킬 타입 (단일, 범위, 버프, 디버프)
    this.name = name; // 스킬 이름
    this.description = description; // 스킬 설명
    this.level = level; // 스킬 레벨
    this.cooldown = cooldown; // 스킬 쿨타임
    this.damage = damage; // 스킬 데미지
    this.cost = cost; // 소비 마나
    this.range = range; // 스킬 범위
    this.duration = duration; // 스킬 지속 시간

    // 스킬 사용 시각을 기록하여 쿨타임 계산에 사용 (초기값: 과거 시각)
    this.lastUsedTime = 0;
  }

  // 스킬 사용 가능 여부를 반환 (쿨타임이 지났다면 true)
  isReady() {
    const now = Date.now();
    return now - this.lastUsedTime >= this.cooldown * 1000;
  }

  // 스킬 사용: 사용 가능할 경우 lastUsedTime을 갱신하고 사용했다고 리턴합니다.
  // 실제 스킬 효과(데미지, 버프 등)는 여기서 추가적으로 처리할 수 있습니다.
  use() {
    if (!this.isReady()) {
      throw new Error(
        `${this.name}은 아직 준비되지 않았습니다. 남은 쿨타임: ${this.getRemainingCooldown()}ms`,
      );
    }
    // 스킬 효과 적용 로직 추가
    this.lastUsedTime = Date.now();
    console.log(`${this.name} 사용!`);
    return true;
  }

  // 현재 스킬의 남은 쿨타임(밀리초 단위)을 반환합니다.
  getRemainingCooldown() {
    const now = Date.now();
    const elapsed = now - this.lastUsedTime;
    const remaining = this.cooldown * 1000 - elapsed;
    return remaining > 0 ? remaining : 0;
  }

  // 스킬 업그레이드: 레벨을 증가시키고, 쿨타임을 5% 단축합니다. / 데미지 10% 증가 -> 이렇게 된 정보는 db에 저장
  upgrade() {
    this.level += 1;
    // 레벨업 시 데미지를 10% 증가
    this.damage *= 1.1;
    // 레벨업 시 쿨타임을 5% 단축
    this.cooldown *= 0.95;
    console.log(
      `${this.name}이 업그레이드되었습니다. 현재 레벨: ${
        this.level
      }, 새로운 쿨타임: ${this.cooldown.toFixed(2)}초`,
    );
  }

  // 쿨타임 초기화: 강제로 스킬을 즉시 사용 가능하게 합니다.
  resetCooldown() {
    this.lastUsedTime = 0;
    console.log(`${this.name}의 쿨타임이 초기화되었습니다.`);
  }
}

// 사용 예시:
//   try {
//     const skill = new Skill(1, '단일', '파이어볼', '대상을 화염으로 공격합니다.', 1, 3);

//     if (skill.isReady()) {
//       skill.use(); // 스킬 사용, 쿨타임이 적용됨
//     } else {
//       console.log(`남은 쿨타임: ${skill.getRemainingCooldown()}ms`);
//     }

//     // 스킬 업그레이드 예시
//     skill.upgrade();

//     // 쿨타임 초기화
//     skill.resetCooldown();

//   } catch (error) {
//     console.error(error.message);
//   }

export default Skill;
