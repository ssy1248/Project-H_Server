// 파티 관련 패킷을 받아서 처리할 핸들러 js
// 방장 설정해주는 함수 + 방장 위임 함수
// 파티 조회에서 던전에 들어가있는 파티 조회 함수
// 매칭 큐? 아님 어떤식으로 해야 할지 고민
// 매칭 관련 핸들러

import { handlerError } from '../../utils/error/errorHandler';

const partyHandler = ( socket, payload ) => {
  try {
    // payload로 받아온 데이터를 파싱
    const { partyId, partyName, partyMembers } = payload;

    // 파티 생성
    // 파티 해체
    // 파티 조회
    // 파티 검색
    // 파티에 있는 유저 조회
    // 파티에 유저 추가
    // 파티에서 유저 제거
    // 파티에 있는 유저의 상태 변경
    // 파티에 있는 유저의 상태 조회
    // 파티에 있는 유저의 상태 초기화

    // 파티 정보 전송
    //socket.write();
  } catch (e) {
    handlerError(socket, e);
  }
};
