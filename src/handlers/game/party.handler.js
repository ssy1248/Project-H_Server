// 파티 관련 패킷을 받아서 처리할 핸들러 js
// 파티 조회에서 던전에 들어가있는 파티 조회 함수
// 매칭 큐? 아님 어떤식으로 해야 할지 고민
// 매칭 관련 핸들러
// party클래스에서 userId를 넣어?

import { PARTY_ID } from '../../constants/constants.js';
import { createPartySession } from '../../session/party.session.js';
import { handlerError } from '../../utils/error/errorHandler.js';

// 매칭을 할떄 던전에게 보내줘야 하는거 : 파티 아이디, 파티 인원 정보, 던전 정보보

/* 파티 패킷 
message C_PartyRequest{
    int32 userId = 1;
    string partyName = 2; // 파티 이름 추가
}

// 초대용 패킷 
message C_PartyInviteRequest{
    //int32 partyId = 1; // 파티 id
    int32 requesterId = 2; // 초대한 유저 id
    int32 participaterId = 3; // 초대할 유저 id
}

// 참가용 패킷
message C_PartyJoinRequest{
    int32 partyId = 1; // 파티 id
    int32 userId = 2; // 가입할 유저 id
}

// 추방 패킷
message C_PartyKickRequest{
    int32 partyId = 1; // 파티 id
    int32 requesterId = 2; // 추방한 유저 id
    int32 kickUserId = 3; // 추방할 유저 id
}

// 해체 패킷
message C_PartyDisbandRequest{
    int32 parttyId = 1; // 해체할 파티 id
    repeated Playerstatus players = 2; // 파티원들
}

// 파티 해체 관련 패킷 처리
message S_PartyResultResponse{
    bool success = 1;
    string message = 2;
    GlobalFailCode failCode = 3;
}

// 파티 관련 클라가 서버에 보내는 패킷은 세분화를 하고 
// 처리하는 패킷을 하나로
// 파티 가입 관련 패킷 처리
message S_PartyResponse{
    PartyInfo party =1;
    bool success =2;
    string message= 3;
    GlobalFailCode failCode =4;
}

message PartyInfo{
    int32 partyId = 1 ;
    int32 maximum = 2;
    repeated PlayerStatus Players = 3;
}
    추가 패킷이 필요하다고 생각들면 추가하자
*/

// 파티 아이디는 서버에서 전역으로 계산을 하여서 보내줘야할듯?

// C_PartyRequest가 날라오면 처리할 핸들러
// 파티 생성
export const partyHandler = (socket, payload) => {
  try {
    // payload로 받아온 데이터를 파싱
    const { userId, partyName } = payload;
    let partyId = PARTY_ID;

    // 파티 생성
    createPartySession(partyId, partyName, userId);

    // 파티 정보 전송
    //socket.write();
  } catch (e) {
    handlerError(socket, e);
  }
};

// C_PartyInviteRequest가 날라오면 처리할 핸들러
// 파티 초대
export const partyInviteHandler = (socket, payload) => {
  try {
    const { partyId, userId } = payload;
  } catch (e) {
    handlerError(socket, e);
  }
};

// C_PartyJoinRequest가 날라오면 처리할 핸들러
// 파티 참가
export const partyJoinHandler = (socket, payload) => {
  try {
    const { partyId, userId } = payload;
  } catch (e) {
    handlerError(socket, e);
  }
};

// C_PartyKickRequest가 날라오면 처리할 핸들러
// 파티 추방
export const partyKickHandler = (socket, payload) => {
  try {
    const { partyId, userId } = payload;
  } catch (e) {
    handlerError(socket, e);
  }
};

// C_PartyDisbandRequest가 날라오면 처리할 핸들러
// 파티 해체
export const partyDisbandHandler = (socket, payload) => {
  try {
    const { partyId } = payload;
  } catch (e) {
    handlerError(socket, e);
  }
};
