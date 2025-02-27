const PLAYER_CLASS = {
  LANCE: 1,
  ROGUE: 2,
  ARCHER: 3,
  HOLYKNIGHT: 4,
  MAGE: 5,
};

class Players {
  constructor(partyData) {
    if (!partyData || typeof partyData.playerClass !== 'number') {
      throw new Error('유효한 partyData와와 playerClass가 필요합니다.');
    }
    this.partyData = partyData;
    this.playerClass = partyData.playerClass;

    // 스킬이 여러개여서 스킬을 골라서 들어가는 것이 아니라면 클래스 별로 구분하여 미리 세팅
    // 아이템이나 레벨업을 통해서 스킬 쿨이나 범위 데미지가 증가한다면 배열이나 딕셔너리를 이용해서 관리 
    switch (this.playerClass) {
      case PLAYER_CLASS.LANCE:
        this.normalAttack = {
          attackRange: 4, // 공격 범위 -> 유니티에 원범위를 이걸로 설정
          attackType: 1, // 단일 1 / 범위 2 / 도트딜? 3 / cc 4
          attackCoolTime: 3, // 기본 공격 쿨타임 (초)
          damage: 50,
        };
        this.skillAttack = {
          attackRange: 5, // 공격 범위
          attackType: 1, // 스킬 종류
          attackCoolTime: 6, // 스킬 쿨타임 (초)
          damage: 80,
        };
        this.dodge = {
          dodgeCoolTime: 8, // 회피 쿨타임 (초)
          dodgeRange: 3, // 회피 이동 거리
        };
        break;
      case PLAYER_CLASS.ROGUE:
        this.normalAttack = {
          attackRange: 6,
          attackType: 1,
          attackCoolTime: 3,
          damage: 40,
        };
        this.skillAttack = {
          attackRange: 8,
          attackType: 3,
          attackCoolTime: 8.0,
          damage: 90,
        };
        this.dodge = {
          dodgeCoolTime: 5,
          dodgeRange: 2,
        };
        break;
      case PLAYER_CLASS.ARCHER:
        this.normalAttack = {
          attackRange: 10, // 원거리 공격
          attackType: 1,
          attackCoolTime: 2,
          damage: 35,
        };
        this.skillAttack = {
          attackRange: 12,
          attackType: 2,
          attackCoolTime: 7,
          damage: 60,
        };
        this.dodge = {
          dodgeCoolTime: 5,
          dodgeRange: 4,
        };
        break;
      case PLAYER_CLASS.HOLYKNIGHT:
        this.normalAttack = {
          attackRange: 5,
          attackType: 1,
          attackCoolTime: 5,
          damage: 50,
        };
        this.skillAttack = {
          attackRange: 7,
          attackType: 4,
          attackCoolTime: 10,
          damage: 70,
        };
        this.dodge = {
          dodgeCoolTime: 10,
          dodgeRange: 3,
        };
        break;
      case PLAYER_CLASS.MAGE:
        this.normalAttack = {
          attackRange: 5,
          attackType: 1,
          attackCoolTime: 4,
          damage: 50,
        };
        this.skillAttack = {
          attackRange: 7,
          attackType: 3,
          attackCoolTime: 9,
          damage: 70,
        };
        this.dodge = {
          dodgeCoolTime: 10,
          dodgeRange: 3,
        };
        break;
      default:
        // 기본값 설정 (또는 에러 처리)
        console.warn('알 수 없는 플레이어 클래스, 기본값 적용');
        this.normalAttack = {
          attackRange: 5,
          attackType: 1,
          attackCoolTime: 1.0,
          damage: 50,
        };
        this.skillAttack = {
          attackRange: 7,
          attackType: 1,
          attackCoolTime: 3.0,
          damage: 70,
        };
        this.dodge = {
          dodgeCoolTime: 2.0,
          dodgeRange: 3,
        };
        break;
    }
  }
}

/**
---------------- C -> S --------------------- 클라 -> 서버 
message C_PlayerAction {
  oneof action {
    NormalAttack normalAttack = 1;
    SkillAttack skillAttack   = 2;
    DodgeAction dodgeAction   = 3;
    HitAction   hitAction     = 4; // 피격
  }
}

// 일반 공격
message NormalAttack {
  int32 targetId = 1;
  // 필요하다면 위치나 방향, etc.
}

// 스킬 공격
message SkillAttack {
  int32 skillId = 1;
  int32 targetId = 2; 
  // 혹은 범위 정보, 마나 소모 등
}

// 회피
message DodgeAction {
  float dodgeDistance = 1;
  // 방향 등
}

// 피격
message HitAction {
  int32 attackerId = 1;
  int32 damage     = 2;
  // 상태이상, 크리티컬 여부 등
}

---------------- S -> C --------------------- 서버 -> 클라
message S_PlayerAction {
  // oneof 그룹을 통해 단 하나의 액션 결과만 설정됩니다.
  oneof action {
    NormalAttackResult normalAttackResult = 1;
    SkillAttackResult skillAttackResult = 2;
    DodgeResult dodgeResult = 3;
    HitResult hitResult = 4;
  }
  // 액션 결과 전송의 성공 여부 및 메시지
  bool success = 5;
  string message = 6;
}

// 일반 공격 결과 메시지
message NormalAttackResult {
  int32 targetId = 1;       // 공격 대상 ID
  int32 damageDealt = 2;    // 입힌 피해량
  // 필요한 추가 필드가 있다면 여기에 작성
}

// 스킬 공격 결과 메시지
message SkillAttackResult {
  int32 skillId = 1;        // 사용한 스킬의 ID
  int32 targetId = 2;       // 공격 대상 ID
  int32 damageDealt = 3;    // 입힌 피해량
  // 필요한 추가 필드가 있다면 여기에 작성
}

// 회피(도주) 결과 메시지
message DodgeResult {
  int32 evadedDamage = 1;   // 회피하여 피해를 줄인 양
  int32 cooldown = 2;       // 회피 후 남은 쿨타임(초)
  // 필요한 추가 필드가 있다면 여기에 작성
}

// 피격 결과 메시지
message HitResult {
  int32 damageReceived = 1; // 받은 피해량
  int32 currentHp = 2;      // 피격 후 남은 HP
  // 필요한 추가 필드가 있다면 여기에 작성
}
*/

export default Players;