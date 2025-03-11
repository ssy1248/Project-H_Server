const CONSTANTS = {
  PATHFINDING: {
    GRID_SIZE: 1, // 그리드 셀 크기
    MAX_SEARCH_DEPTH: 500, // 길찾기 최대 탐색 깊이
    PATH_SMOOTHING: true, // 경로 부드럽게 할지 여부
  },

  ENTITY: {
    DEFAULT_SPEED: 10, // 기본 이동 속도
    MONSTER_DETECTION_RANGE: 10, // 몬스터 탐지 범위
    PLAYER_HITBOX_SIZE: 1.5, // 플레이어 충돌 크기
    MONSTER_HITBOX_SIZE: 1.5, // 플레이어 충돌 크기
    MONSTER_SPAWN_INTERVAL: 10000,
    SKILL_COOLDOWN: 120,
  },

  NETWORK: {
    TICK_RATE: 60, // 서버 업데이트 주기 (Hz)
    INTERVAL: 100, // 1초(1000ms)를 60으로 나눈 값 → 16.7ms
    NETWORK_LATENCY: 100, // 예상 네트워크 지연 (ms)
    SNAPSHOT_INTERVAL: 0.1, // 스냅샷 전송 주기 (초)
  },

  AI: {
    ASTER_INTERVAL: 100,
    AGGRO_RANGE: 15, // 몬스터 어그로 범위
    ATTACK_COOLDOWN: 2, // 공격 쿨타임 (초)
    FLEE_HEALTH_THRESHOLD: 0.2, // 도망치는 체력 비율 (20%)
  },

  AI_BEHAVIOR: {
    IDLE: 0,          // 대기
    CHASE: 1,         // 추격 
    RETREAT: 2,       // 후퇴
    ATTACK: 3,        // 공격
    RETURN: 4,        // 복귀
    DAMAGED: 5,       // 공격받는 중
  },

  BOSS_AI_BEHAVIOR: {
    IDLE: 1000,          // 대기
    SKILL_01: 1001,      // 스킬
    SKILL_02: 1002,      // 스킬
    SKILL_03: 1003,      // 스킬
    SKILL_04: 1003,      // 스킬
    SKILL_05: 1003,      // 스킬
    DIE: 1004,           // 사망
  },

  UTILS: {
    QUEUE_SIZE: 50, // 큐 크기
  },
};

export default CONSTANTS;
