// 파티 관련 패킷을 받아서 처리할 핸들러 js
// 파티 조회에서 던전에 들어가있는 파티 조회 함수
// 매칭 큐? 아님 어떤식으로 해야 할지 고민
// 매칭 관련 핸들러
// party클래스에서 userId를 넣어?

import { PACKET_TYPE } from '../../constants/header.js';
import {
  createPartySession,
  GetAllPartySession,
  removePartySession,
  searchPartyInPlayerSession,
  searchPartySession,
} from '../../session/party.session.js';
import { broadcastToUsers, getUserById, getUserByNickname } from '../../session/user.session.js';
import { handlerError } from '../../utils/error/errorHandler.js';
import { createResponse } from '../../utils/response/createResponse.js';

// 매칭을 할떄 던전에게 보내줘야 하는거 : 파티 아이디, 파티 인원 정보, 던전 정보

/* 
// 파티 신청 패킷
message C_PartyJoinRequest {
    int32 partyId = 1; // 파티 id
    int32 userId = 2; // 가입할 유저 id
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
    int32 case = 2; // 분기 처리 -> (1 -> 파티 생성, 2 -> 초대, 3 -> 가입, 4 -> 업데이트)
    bool success = 3;
    string message = 4;
    GlobalFailCode failCode = 5;
}
    추가 패킷이 필요하다고 생각들면 추가하자
*/

/**
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
        responsePayload,
      );
      await socket.write(responsePacket);
      return;
    }

    // 파티 이름을 기준으로 필터링합니다.
    const matchingParties = parties.filter((party) => {
      const info = party.getPartyInfo();
      console.log(`찾은 정보 : ${info.partyName}`);
      if (!info || !info.partyName) return false;
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
      responsePayload,
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
      info: partyInfoList, // 5개의 PartyInfo 객체 배열
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

// 이부분을 바꿔야할듯 -> Id를 어떤식으로? 그냥 랜덤값으로 하면 결국 같은 값이 나올 가능성이 존재하지 않을까?
const generatePartyId = () => {
  const timestamp = Date.now(); // 현재 밀리초 단위 시간
  const random = Math.floor(Math.random() * 1000); // 0 ~ 999 사이의 랜덤 수
  return parseInt(`${timestamp}${random}`);
};

// C_PartyRequest가 날라오면 처리할 핸들러
// S_PartyResponse
// 파티 생성
// 파티 생성 시 던전까지 고르고 생성
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
    if (!requester) {
      console.log(`req 유저가 존재하지 않습니다. -> ${requester}`);
      return;
    }
    // 자기 자신은 제외
    if (!participater || requester === participater) {
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
        partyPacket,
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
        partyPacket,
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
      partyPacket,
    );

    // 2명 이상일때는 info의 player를 다 순회하면서 socket찾아서 던져주면 될듯?
    await socket.write(partyResponse);
    await participater.userInfo.socket.write(partyResponse);
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
    if (!user) {
      console.log('유저가 존재하지 않습니다. ' + user);
      return;
    }
    const party = searchPartySession(partyId);
    if (!party) {
      console.log('존재하지 않는 파티입니다.' + party);
      return;
    }
  } catch (e) {
    handlerError(socket, e);
  }
};

// C_PartyKickRequest가 날라오면 처리할 핸들러
// S_PartyResultResponse
// 파티 추방 exitPartySelectMember -> party.class
export const partyKickHandler = (socket, payload) => {
  try {
    const { requesterUserId, kickUserUserId } = payload;

    // 1. 요청자와 추방 대상 유저를 조회
    const requester = getUserById(requesterUserId);
    if (!requester) {
      console.log('요청 유저가 존재하지 않습니다.');
      return;
    }
    const kickUser = getUserById(kickUserUserId);
    if (!kickUser) {
      console.log('쳐낼 유저가 존재하지 않습니다.');
      return;
    }

    // 2. 요청자가 속한 파티를 조회
    const requesterParties = searchPartyInPlayerSession(requesterUserId);
    if (requesterParties.length === 0) {
      console.log('요청 유저는 어떤 파티에도 속해 있지 않습니다.');
      return;
    }
    // 일반적으로 한 유저는 하나의 파티에 속한다고 가정하므로 첫 번째 파티를 사용
    const party = requesterParties[0];

    // 3. 추방 대상 유저가 같은 파티에 속해 있는지 확인
    const kickUserParties = searchPartyInPlayerSession(kickUserUserId);
    if (kickUserParties.length === 0 || kickUserParties[0].id !== party.id) {
      console.log('추방 대상은 같은 파티에 속해 있지 않습니다.');
      // 실패 응답 전송
      const failResponse = createResponse(
        'party',
        'S_PartyResultResponse',
        PACKET_TYPE.S_PARTYRESULTRESPONSE,
        {
          userId: kickUserUserId,
          case: 1, // 1: 강퇴
          success: false,
          message: '추방 대상이 같은 파티에 속해 있지 않습니다.',
          failCode: 0, // 적절한 GlobalFailCode 값으로 대체
        },
      );
      socket.write(failResponse);
      return;
    }

    // 4. 요청자가 파티 리더인지 확인
    if (!party.partyLeader || party.partyLeader.userInfo.userId !== requesterUserId) {
      console.log('요청 유저는 파티 리더가 아니므로 강퇴 권한이 없습니다.');
      const failResponse = createResponse(
        'party',
        'S_PartyResultResponse',
        PACKET_TYPE.S_PARTYRESULTRESPONSE,
        {
          userId: kickUserUserId,
          case: 1, // 1: 강퇴
          success: false,
          message: '파티 리더가 아니어서 강퇴할 수 없습니다.',
          failCode: 0, // 적절한 GlobalFailCode 값으로 대체
        },
      );
      socket.write(failResponse);
      return;
    }

    // 5. 강퇴 처리: 파티에서 추방
    // party.exitPartySelectMember(requester, kickUser) 메서드를 호출
    party.exitPartySelectMember(requester, kickUser);

    // 6. 강퇴 성공 응답을 구성
    const successResponse = createResponse(
      'party',
      'S_PartyResultResponse',
      PACKET_TYPE.S_PARTYRESULTRESPONSE,
      {
        userId: kickUserUserId,
        case: 1, // 1: 강퇴
        success: true,
        message: '파티에서 추방되었습니다.',
        failCode: 0, // 성공시 보통 0 또는 적절한 값
      },
    );

    // 7. 응답 전송: 요청자의 소켓에 전송하고, 추방된 유저나 다른 파티원에게도 필요하다면 전송
    socket.write(successResponse);

    if (party.partyMembers.length > 0) {
      const updatedPartyInfo = party.getPartyInfo();
      const updateResponse = createResponse(
        'party',
        'S_PartyResponse',
        PACKET_TYPE.S_PARTYRESPONSE,
        {
          party: updatedPartyInfo,
          case: 4, // 업데이트된 파티 정보 (탈퇴 후)
          success: true,
          message: '파티 정보가 업데이트되었습니다.',
          failCode: 0,
        },
      );
      //  파티의 다른 멤버들에게도 브로드캐스트
      party.partyMembers.forEach((member) => {
        //if (member.userInfo.socket !== socket) {
        broadcastToUsers(member.userInfo.socket, updateResponse);
        //member.userInfo.socket.write(updateResponse);
        //}
      });
      socket.write(updateResponse);
    }
  } catch (e) {
    handlerError(socket, e);
  }
};

// C_PartyExitRequest가 날라오면 처리할 핸들러
// S_PartyResultResponse
// 파티 나가기
// 해체는 0명이 되면 자동 해체를 진행
export const partyExitHandler = (socket, payload) => {
  try {
    const { userId } = payload;

    // 1. 요청한 유저 객체 조회
    const user = getUserById(userId);
    if (!user) {
      console.log(`유저가 존재하지 않습니다. userId: ${userId}`);
      const failResponse = createResponse(
        'party',
        'S_PartyResultResponse',
        PACKET_TYPE.S_PARTYRESULTRESPONSE,
        {
          userId: userId,
          case: 2, // 탈퇴
          success: false,
          message: '유효한 유저가 아닙니다.',
          failCode: 0,
        },
      );
      socket.write(failResponse);
      return;
    }

    // 2. 해당 유저가 속한 파티 조회 (배열 반환)
    const parties = searchPartyInPlayerSession(userId);
    if (parties.length === 0) {
      console.log(`유저 ${userId}는 어떠한 파티에도 속해 있지 않습니다.`);
      const failResponse = createResponse(
        'party',
        'S_PartyResultResponse',
        PACKET_TYPE.S_PARTYRESULTRESPONSE,
        {
          userId: userId,
          case: 2, // 탈퇴
          success: false,
          message: '파티에 속해 있지 않습니다.',
          failCode: 0,
        },
      );
      socket.write(failResponse);
      return;
    }

    // 일반적으로 한 유저는 하나의 파티에 속한다고 가정하고 첫 번째 파티 사용
    const party = parties[0];

    // 3. 파티 내에서 해당 유저 제거 (exitPartyMember 메서드 호출)
    // 이 메서드는 내부에서 파티원 배열에서 유저를 제거하고, 만약 리더였다면 새 리더를 지정
    party.exitPartyMember(user);

    // 4. 파티원 수가 0이 되면 파티 세션 자체를 제거
    if (party.partyMembers.length === 0) {
      removePartySession(party.id);
      console.log(`파티 ${party.id}가 해체되었습니다.`);
    }

    // 5. 성공 응답 구성 (나간 유저에게)
    const successResponse = createResponse(
      'party',
      'S_PartyResultResponse',
      PACKET_TYPE.S_PARTYRESULTRESPONSE,
      {
        userId: userId,
        case: 2, // 탈퇴
        success: true,
        message: '파티에서 나갔습니다.',
        failCode: 0,
      },
    );
    socket.write(successResponse);

    // 6. 파티에 남아있는 멤버들에게 업데이트된 파티 정보를 브로드캐스트
    // (만약 파티가 해체되지 않은 경우)
    if (party.partyMembers.length > 0) {
      const updatedPartyInfo = party.getPartyInfo();
      const updateResponse = createResponse(
        'party',
        'S_PartyResponse',
        PACKET_TYPE.S_PARTYRESPONSE,
        {
          party: updatedPartyInfo,
          case: 4, // 업데이트된 파티 정보 (탈퇴 후)
          success: true,
          message: '파티 정보가 업데이트되었습니다.',
          failCode: 0,
        },
      );
      // 브로드캐스트: 파티에 남아있는 모든 멤버의 소켓으로 전송
      party.partyMembers.forEach((member) => {
        if (member.userInfo && member.userInfo.socket) {
          member.userInfo.socket.write(updateResponse);
        }
      });
    }
  } catch (e) {
    handlerError(socket, e);
  }
};