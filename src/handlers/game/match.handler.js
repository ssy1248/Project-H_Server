import { getUserBySocket, getUserByNickname } from '../../session/user.session.js';
import { handlerError } from '../../utils/error/errorHandler.js';
import { createResponse } from '../../utils/response/createResponse.js';
import { PACKET_TYPE } from '../../constants/header.js';
import { addMatchSession } from '../../session/match.session.js';
import { matchSessions } from '../../session/sessions.js';

/* 
  message C_MatchRequest{
    PartyInfo party = 1;
  }

  message S_MatchingResponse {
    bool isStart = 1; // 매칭이 시작됬는지 체크
  }

  message S_MatchResponse{
    int32 dungeonSessionNumber = 1;
    repeated PartyInfo party = 2; // 합쳐진 파티 인포
    bool success = 3; // 매칭 완료 불값
    string message = 4; // 매칭 완료 
  }

  message C_MatchStopRequest {
    bool stop = 1; // 매칭 중단 요청
    int32 partyId = 2; //파티 아이디
  }

  message S_MatchStopResponse { 
    bool stop = 1; // 매칭 중단 결과
    string message = 2; // 매칭 중단 결과 메세지
  }
*/

//C_MatchRequest
const matchingHandler = (socket, packetData) => {
  try {
    // 파티 ,플레어 정보
    const { party } = packetData;

    const user = getUserBySocket(socket);
    const leaderId = party.partyLeaderId;

    if(user.userInfo.userId !== leaderId) {
      console.log('파티장만 신청 가능합니다.');
      return;
    }

    // 파티장이 신청했는지 예외 처리 파티장만 신청 가능하도록
    // 파티장이 신청하면 파티원들에게 매칭이 시작된다라는 것을 브로드캐스트로 보내줘서 매칭 ui 띄우기
    // 매칭 취소를 누르면 매칭 취소 핸들러 

    //1.일단 매치 핸들러 실행되면 파티장만 이 요청을 받아야 할것이다.
    //2.파티에 대한정보로 파티를 찾고 지금은 파티아이디를 받는것으로했지만 partyinfo를 받을 가능성이 높다.
    //3.받은 던전 종류 index를 가지고 매칭 세션이 있는지 확인 없으면 만든다.
    //4.파티가 업승면 soloMatch, 있으면 partyMatch 메소드 실행Ï
    //5.저 메소드에서 매칭큐에 넣고 매칭 메소드를 실행해준다.
    //6.매칭이 끝난후 지금 기준으로 enterDungeon메소드가 (이 메소드이름을 바꿀수 있다.) 실행된다.
    //7.enterDungeon 메소드에서 던전을 생성하고 그에 따른 정보들을 받는다.
    //8. 패킷을 통해 던전,파티, 을 보낸다.
    //9. 매칭 완료 캐싱르 받으면 이제 클라이언트에서 던전입장 핸들러를 사용한다.

    // 파티장이 매칭 신청 -> 그 후 매칭 리스판스는 모든 파티원에게 브로드캐스트 전송
    // 파티아이디로 파티 세션 검색 후 파티 인포를 던전관련 핸들러에 전송
    // 던전 인덱스의

    // 이부분에서 S_MatchingNotification을 Party의 partyMembers에게 모두 전송
    // 매칭이 완료가 되면 matchingNotification을 isStart = false로 보내서 매칭 완료를 알려줌
    const matchingNotificationPayload = {
      isStart: true
    };
    const matchingNotificationPacket = createResponse(
      'match',
      'S_MatchingNotification',      
      PACKET_TYPE.S_MATCHINGNOTIFICATION,    
      matchingNotificationPayload
    );

    // 파티원 전원에게 브로드캐스트
    party.Players.forEach((member) => {
      const partyMember = getUserByNickname(member.playerName)
      partyMember.userInfo.socket.write(matchingNotificationPacket);
    });

    let matchSession = matchSessions[0];
    if (!matchSession) {
      console.log('이 던전의 매칭은 만들어지지 않았습니다');
      matchSession = addMatchSession();
    }

    console.log(party.partyId);
    const dungeon = matchSession.addPartyMatchQueue(party.partyId);
    if (!dungeon) {
      // 매칭이 아직 안 됐으므로, 던전 정보가 없다.
      console.log('아직 매칭이 완료되지 않았습니다.');
      return;
    }

    // 매칭이 성공하여 dungeon이 존재한다면, 이제 dungeonId 참조 가능
    const dungeonId = dungeon.dungeonId;

    const partyInfo = party;

    //dungeonId : 던전 아이디
    //dungeonIndex : 어떤 던전인지 아는 던전 번호
    //dungeonUser : 던전에 들어가있는 유저 <- 이부분에서 파티로 보내주는게 낳을까  그러면 던전 클래스도 그냥 파티로 만들면 되긴 하는데
    //dungeonState : 던전의 상태 매칭, 진행중, 중단

    //여기서 던전 세션을 만들어야한고 클라이언트에 보내줘야한다.일단 받은 데이터는 다 보내자

    const matchPayload = {
      dungeonId,
      partyInfo,
      success: true,
      message: '매칭이 완료되었습니다!', // 성공 메시지
    };

    //createResponse
    const matchResponse = createResponse(
      'match',
      'S_MatchResponse',
      PACKET_TYPE.S_MATCHRESPONSE,
      matchPayload,
    );
    socket.write(matchResponse);
  } catch (e) {
    handlerError(socket, e);
  }
};

// C_MatchStopRequest
export const matchStopHandler = (socket, packetData) => {
  try {
    const { stop, partyId } = packetData;

    const stopMatch = matchSessions.cancelMatch(partyId);

    if (!stopMatch) {
      const matchStopPayload = {
        bool: true,
        message: '매칭 종료가 성공정으로 진행되었습니다.',
      };
      const matchStopResponse = createResponse(
        'match',
        'S_MatchStopResponse',
        PACKET_TYPE.S_MATCHSTOPRESPONSE,
        matchStopPayload,
      );
      socket.write(matchStopResponse);
    } else {
      const matchStopPayload = {
        bool: false,
        message: '매칭 종료를 실패했습니다.',
      };
      const matchStopResponse = createResponse(
        'match',
        'S_MatchStopResponse',
        PACKET_TYPE.S_MATCHSTOPRESPONSE,
        matchStopPayload,
      );
      socket.write(matchStopResponse);
    }
  } catch (e) {
    handlerError(socket, e);
  }
};

export default matchingHandler;
