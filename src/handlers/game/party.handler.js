// 파티 관련 패킷을 받아서 처리할 핸들러 js
// 파티 조회에서 던전에 들어가있는 파티 조회 함수
// 매칭 큐? 아님 어떤식으로 해야 할지 고민
// 매칭 관련 핸들러
// party클래스에서 userId를 넣어?

import { PACKET_TYPE } from '../../constants/header.js';
import {
  createPartySession,
  GetAllPartySession,
  searchPartyInPlayerSession,
} from '../../session/party.session.js';
import { getUserById } from '../../session/user.session.js';
import { handlerError } from '../../utils/error/errorHandler.js';
import { createResponse } from '../../utils/response/createResponse.js';

// 매칭을 할떄 던전에게 보내줘야 하는거 : 파티 아이디, 파티 인원 정보, 던전 정보보

/* 파티 생성 패킷 
message C_PartyRequest{
    int32 userId = 1;
    string partyName = 2; // 파티 이름 추가
}

// 초대용 패킷 
// 초대한 유저의 id를 파티 세션에서 검색을 한 후 파티가 존재하면 그 아이디를 전송
message C_PartyInviteRequest{
    int32 requesterId = 1; // 초대한 유저 id
    int32 participaterId = 2; // 초대할 유저 id
}

// 참가용 패킷
message C_PartyJoinRequest{
    int32 partyId = 1; // 파티 id
    int32 userId = 2; // 가입할 유저 id
}

message C_SearchPartyListRequest {
  // 빈값으로 요청
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
    string partyName = 2; // 파티 이름
    int32 maximum = 3;
    repeated PlayerStatus Players = 4;
}
    추가 패킷이 필요하다고 생각들면 추가하자
*/

const generatePartyId = () => {
  const timestamp = Date.now(); // 현재 밀리초 단위 시간
  const random = Math.floor(Math.random() * 1000); // 0 ~ 999 사이의 랜덤 수
  return parseInt(`${timestamp}${random}`);
};

// C_PartyRequest가 날라오면 처리할 핸들러
// 파티 생성
export const partyHandler = async (socket, payload) => {
  try {
    // payload로 받아온 데이터를 파싱
    // const { userId, partyName } = payload;
    const { userId } = payload;
    // 보낼 파티 패킷(스코프때문에 외부로 빼놓음)
    let partyPacket = {};
    // 파티 아이디 설정
    let partyId = generatePartyId();
    // 임시 값
    let partyName = 'testParty';
    // 파티에 집어넣기 위해 아이디를 통하여 유저 조회
    const user = getUserById(userId);
    if (!user) {
      console.log(`유저가 존재하지 않습니다. : ${user} : ${getUserById(userId)} : ${userId}`);
      return;
    }

    if (searchPartyInPlayerSession(userId).length > 0) {
      console.log('이미 파티에 들어가있는 플레이어는 파티 생성이 불가능합니다.');
      // 리턴을 하는것은 좋으나 클라에선 무슨 일인지 모르기에 실패 패킷으로 보내줘야함
      partyPacket = {
        success: false,
        message: '파티 생성에 실패했습니다.',
      };
    } else {
      // 파티 생성
      const party = createPartySession(partyId, partyName, userId);
      // 파티에 유저 추가
      party.addPartyMember(user);
      const info = party.getPartyInfo();
      partyPacket = {
        info,
        success: true,
        message: '파티가 생성되었습니다.',
      };
    }

    const partyResponse = createResponse(
      'town',
      'S_PartyResponse',
      PACKET_TYPE.S_PARTYRESPONSE,
      partyPacket,
    );

    // 파티 정보 전송
    await socket.write(partyResponse);
    console.log(GetAllPartySession());
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
