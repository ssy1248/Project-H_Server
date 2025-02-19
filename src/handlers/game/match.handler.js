import { getUserBySocket, getUserByNickname } from '../../session/user.session.js';
import { handlerError } from '../../utils/error/errorHandler.js';
import { createResponse } from '../../utils/response/createResponse.js';
import { PACKET_TYPE } from '../../constants/header.js';
import { addMatchSession } from '../../session/match.session.js';
import { matchSessions } from '../../session/sessions.js';

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
