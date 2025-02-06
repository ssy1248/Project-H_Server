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
  NONE: 0, // 성공
  NO_PERMISSION: 1, // 권한 없음
  NO_PARTY: 2, // 파티 미가입
  USER_NOT_FOUND: 3, // 귓속말 대상 없음
  INVALID_TYPE: 4, // 잘못된 채팅 타입
};
