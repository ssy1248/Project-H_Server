// 전역 변수 저장할 js
// 임시 2명 기존 기획 4명
export const MAX_PARTY_MEMBER = 2;

export const ChatType = {
  // 0: 전체, 1: 공지사항, 2: 파티, 3: 귓속말, 4: 감정표현
  GLOBAL: 0,
  ANNOUNCEMENT: 1,
  PARTY: 2,
  WHISPER: 3,
  EMOTE: 4,
};
export const ChatErrorCodes = {
  // 0: 성공, 1: 권한 없음, 2: 파티 미가입, 3: 대상 없음, 4: 잘못된 채팅 타입
  NONE: 0,
  NO_PERMISSION: 1,
  NO_PARTY: 2,
  USER_NOT_FOUND: 3,
  INVALID_TYPE: 4,
};

// 동기화 관련 js
export const MAX_POSITION_DIFFERENCE = 0.5;  
export const MAX_ROTATION_DIFFERENCE = 1; 
export const SERVER_TIME_OFFSET  = 10;
export const MONSTER_SPAWN_INTERVAL  = 10000;
export const MONSTER_UPDATE_INTERVAL  = 100;