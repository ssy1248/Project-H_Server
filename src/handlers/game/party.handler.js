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
  searchPartySession,
} from '../../session/party.session.js';
import { getUserById, getUserByNickname } from '../../session/user.session.js';
import { handlerError } from '../../utils/error/errorHandler.js';
import { createResponse } from '../../utils/response/createResponse.js';

// 매칭을 할떄 던전에게 보내줘야 하는거 : 파티 아이디, 파티 인원 정보, 던전 정보

/* 파티 생성 패킷 
message C_PartyRequest {
    int32 userId = 1;
    string partyName = 2; // 파티 이름 추가
}

// 초대용 패킷 
// 초대한 유저의 id를 파티 세션에서 검색을 한 후 파티가 존재하면 그 아이디를 전송
message C_PartyInviteRequest {
    string requesterUserNickname = 1; // 초대한 유저 닉네임
    string participaterUserNickname = 2; // 초대할 유저 닉네임
}

// 파티 신청 패킷
message C_PartyJoinRequest {
    int32 partyId = 1; // 파티 id
    int32 userId = 2; // 가입할 유저 id
}

message C_PartyListRequest {
  // 빈값으로 요청 
  // 5개만 요청(다음페이지를 누르면 다시 요청)
  // 서버에서 파티 세션 전송?
}

//지금은 아예 똑같거나 LIKE 써서 사용(추후 좋은아이디어가 있으면 수정)
message C_SearchPartyRequest {
  string partyName = 1; // 검색한 파티 이름
}

// 추방 패킷
// 추방 요청 유저가 파티세션에 있는지 검사 & 파티장인지 검사 후 성공 실패 전송
message C_PartyKickRequest {
    int32 requesterUserId = 1; // 추방 요청 유저 id
    int32 kickUserUserId = 2; // 추방 유저 id
}

// 파티 나가기
message C_PartyExitRequest {
    // 파티 세션에서 파티에 들어가있는지 검사 후 방장이였다면 다른 사람에게 방장을 넘기고 나가기
    int32 userId = 1; // 나갈 유저 id
}

// 파티 조회 관련 패킷
message S_PartySearchResponse {
  repeated PartyInfo info = 1;
  bool success = 2;
  string message = 3;
  GlobalFailCode failCode = 4;
}

// 파티 해체 관련 패킷
message S_PartyResultResponse {
    // 나간 유저를 알아야 하니까? 파티원들도?
    int32 userId = 1; // 나간 파티원
    int32 case = 2; // 분기 처리 -> (1 -> 강퇴, 2 -> 탈퇴)
    bool success = 3;
    string message = 4;
    GlobalFailCode failCode = 5;
}

// 파티 관련 클라가 서버에 보내는 패킷은 세분화를 하고 
// 처리하는 패킷을 하나로
// 파티 가입 관련 패킷 처리
message S_PartyResponse{
    PartyInfo party = 1;
    int32 case = 2; // 분기 처리 -> (1 -> 파티 생성, 2 -> 초대, 3 -> 가입)
    bool success = 3;
    string message = 4;
    GlobalFailCode failCode = 5;
}
    추가 패킷이 필요하다고 생각들면 추가하자
*/

/**
// 파티 조회 관련 패킷
// 모든 리스트 조회인지 검색인지 분기를 나눌 변수
  message S_PartySearchResponse {
    repeated PartyInfo info = 1;
    int32 case = 2; // case: (1 -> 모든 리스트 조회, 2 -> 검색)
    bool success = 3;
    string message = 4;
    GlobalFailCode failCode = 5;
  }
  message PartyInfo{
    int32 partyId = 1 ;
    string partyName = 2; // 파티 이름
    int32 partyLeaderId = 3; // 리더 아이디
    int32 maximum = 4;
    repeated PlayerStatus Players = 5;
  }

  message PlayerStatus {
    int32 playerClass = 1;
    int32 playerLevel = 2;
    string playerName = 3;
    float playerFullHp = 4;
    float playerFullMp = 5;
    float playerCurHp = 6;
    float playerCurMp = 7;
  }
 */

// C_SearchPartyRequest
// S_PartySearchResponse -> 보내주는
// 파티 이름 검색을 해서 조회한 값을 전송
export const partySearchHandler = async (socket, payload) => {
  try {
    const { partyName } = payload;
    console.log(`검색 이름 : ${partyName}`);
    const parties = GetAllPartySession();
    // 빈값이거나 없을 경우
    if (!partyName || partyName.trim() === '') {
      const responsePayload = {
        info: [],
        success: true,
        message: '검색어가 입력되지 않았습니다.',
      };

      const responsePacket = createResponse(
        'party',
        'S_PartySearchResponse',
        PACKET_TYPE.S_PARTYSEARCHRESPONSE,
        responsePayload
      );
      await socket.write(responsePacket);
      return;
    }

    // 파티 이름을 기준으로 필터링합니다.
    const matchingParties = parties.filter((party) => {
      const info = party.getPartyInfo();
      console.log(`찾은 정보 : ${info.partyName}`);
      if (!info || !info.partyName) 
        return false;
      return info.partyName.toLowerCase().includes(partyName.toLowerCase());
    });

    console.log(`검색 결과 : ${matchingParties}`);

    // 검색 결과를 PartyInfo 형식의 객체 배열로 변환합니다.
    const partyInfoList = matchingParties.map((party) => party.getPartyInfo());

    // 응답 페이로드 구성
    const responsePayload = {
      info: partyInfoList,
      case: 2,
      success: true,
      message:
        partyInfoList.length > 0
          ? `총 ${partyInfoList.length}개의 파티 검색 성공`
          : '검색 결과가 없습니다.',
    };

    // 응답 패킷 생성 및 전송
    const responsePacket = createResponse(
      'party',
      'S_PartySearchResponse',
      PACKET_TYPE.S_PARTYSEARCHRESPONSE,
      responsePayload
    );

    await socket.write(responsePacket);
  } catch (e) {
    handlerError(socket, e);
  }
};

// C_PartyListRequest
// S_PartySearchResponse
// 모든 파티 조회
export const partyListHandler = async (socket, payload) => {
  try {
    // socket.write할때 파티 세션 모두 담아서 전송
    console.log('파티 리스트 주기 핸들러 들어옴!!!');
    // 모든 파티 세션 가져오기
    // page 번호가 없으면 기본적으로 0(첫 페이지)을 사용
    const { page = 0 } = payload;
    const pageSize = 5; // 한 페이지에 5개씩 전송

    const parties = GetAllPartySession();
    // 페이지네이션: offset과 limit 계산
    const offset = page * pageSize;
    const pagedParties = parties.slice(offset, offset + pageSize);

    // 각 파티의 PartyInfo 객체 추출
    const partyInfoList = pagedParties.map((party) => party.getPartyInfo());

    // S_PartySearchResponse 패킷에 담을 페이로드 구성
    const responsePayload = {
      info: partyInfoList,    // 5개의 PartyInfo 객체 배열
      case: 1,
      success: true,
      message: '파티 목록 조회 성공',
      // 아래 부분은 수정 (페이지 네이션에 맞춰서 패킷 수정)
      //page,                  // 현재 페이지 번호
      //total: parties.length, // 전체 파티 개수 (추후 클라에서 페이지네이션 UI 구성에 활용 가능)
    };

    const responsePacket = createResponse(
      'party',
      'S_PartySearchResponse',
      PACKET_TYPE.S_PARTYSEARCHRESPONSE,
      responsePayload,
    );

    // 클라이언트로 패킷 전송
    await socket.write(responsePacket);

    console.log(`총 ${partyInfoList.length}개의 파티 정보 전송 완료`);
  } catch (e) {
    handlerError(socket, e);
  }
};

const generatePartyId = () => {
  const timestamp = Date.now(); // 현재 밀리초 단위 시간
  const random = Math.floor(Math.random() * 1000); // 0 ~ 999 사이의 랜덤 수
  return parseInt(`${timestamp}${random}`);
};

// C_PartyRequest가 날라오면 처리할 핸들러
// S_PartyResponse
// 파티 생성
export const partyHandler = async (socket, payload) => {
  try {
    // payload로 받아온 데이터를 파싱
    const { userId, partyName } = payload;
    // 보낼 파티 패킷(스코프때문에 외부로 빼놓음)
    let partyPacket = {};
    // 파티 아이디 설정
    let partyId = generatePartyId();
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
      console.log(info);
      partyPacket = {
        party: info,
        case: 1,
        success: true,
        message: '파티가 생성되었습니다.',
      };
    }

    const partyResponse = createResponse(
      'party',
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
// S_PartyResponse
// 파티에 있는 사람이 중간에 나가면 파티에서 지우는 예외조건?
export const partyInviteHandler = async (socket, payload) => {
  try {
    const { requesterUserNickname, participaterUserNickname } = payload;
    let partyPacket = {};

    const requester = getUserByNickname(requesterUserNickname);
    const participater = getUserByNickname(participaterUserNickname);
    if(!requester) {
      console.log(`req 유저가 존재하지 않습니다. -> ${requester}`);
      return;
    }
    // 자기 자신은 제외
    if(!participater || requester === participater) {
      console.log(`par 유저가 존재하지 않습니다. -> ${participater}`);
      return;
    }
    
    const requesterParties = searchPartyInPlayerSession(requester.userInfo.userId);
    if (requesterParties.length === 0) {
      // 요청자가 파티에 속해 있지 않으면 초대할 파티가 없음
      partyPacket = {
        case: 2,
        success: false,
        message: '요청자가 아직 파티에 속해 있지 않습니다.',
      };
      const partyResponse = createResponse(
        'party',
        'S_PartyResponse',
        PACKET_TYPE.S_PARTYRESPONSE,
        partyPacket
      );
      await socket.write(partyResponse);
      return;
    }
    
    // 보통 한 유저는 한 파티에만 속한다고 가정하고 첫 번째 파티 사용
    const partyInstance = requesterParties[0];

    // 초대 대상 유저가 이미 어떤 파티에 속해 있는지 검사
    const participaterParties = searchPartyInPlayerSession(participater.userInfo.userId);
    // 유저 id 9가 포함된 파티를 찾을 수 없습니다.
    if (participaterParties.length > 0) {
      // 이미 파티에 속해 있다면, 같은 파티인지 다른 파티인지 확인
      if (participaterParties[0].id === partyInstance.id) {
        partyPacket = {
          case: 2,
          success: false,
          message: '초대 대상은 이미 같은 파티에 속해 있습니다.',
        };
      } else {
        partyPacket = {
          case: 2,
          success: false,
          message: '초대 대상은 이미 다른 파티에 속해 있습니다.',
        };
      }
      const partyResponse = createResponse(
        'party',
        'S_PartyResponse',
        PACKET_TYPE.S_PARTYRESPONSE,
        partyPacket
      );
      await socket.write(partyResponse);
      return;
    }

    // 초대 대상이 아직 파티에 속해 있지 않은 경우, 파티에 추가
    partyInstance.addPartyMember(participater);
    const info = partyInstance.getPartyInfo();
    partyPacket = {
      party: info,
      case: 2,
      success: true,
      message: '파티에 초대되었습니다.',
    };

    const partyResponse = createResponse(
      'party',
      'S_PartyResponse',
      PACKET_TYPE.S_PARTYRESPONSE,
      partyPacket
    );

    await socket.write(partyResponse);
    console.log(GetAllPartySession());
  } catch (e) {
    handlerError(socket, e);
  }
};

// C_PartyJoinRequest가 날라오면 처리할 핸들러
// S_PartyResponse
// 파티 가입
/**
 // 파티 신청 패킷
message C_PartyJoinRequest {
    int32 partyId = 1; // 파티 id
    int32 userId = 2; // 가입할 유저 id
}

message S_PartyResponse{
    PartyInfo party = 1;
    int32 case = 2; // 분기 처리 -> (1 -> 파티 생성, 2 -> 초대, 3 -> 가입)
    bool success = 3;
    string message = 4;
    GlobalFailCode failCode = 5;
}
 */
export const partyJoinHandler = (socket, payload) => {
  try {
    const { partyId, userId } = payload;
    const user = getUserById(userId);
    if(!user) {
      console.log('유저가 존재하지 않습니다. ' + user);
      return;
    }
    const party = searchPartySession(partyId);
    if(!party) {
      console.log('존재하지 않는 파티입니다.' + party);
      return;
    }

  } catch (e) {
    handlerError(socket, e);
  }
};

// C_PartyKickRequest가 날라오면 처리할 핸들러
// S_PartyResultResponse
// 파티 추방
export const partyKickHandler = (socket, payload) => {
  try {
    const { partyId, userId } = payload;
  } catch (e) {
    handlerError(socket, e);
  }
};

// C_PartyExitRequest가 날라오면 처리할 핸들러
// S_PartyResultResponse
// 파티 나가기
// 해체는 0명이 되면 자동 해체를 진행
export const partyDisbandHandler = (socket, payload) => {
  try {
    const { userId } = payload;
  } catch (e) {
    handlerError(socket, e);
  }
};
