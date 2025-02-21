import { getUserBySocket, getUserByNickname } from '../../session/user.session.js';
import { handlerError } from '../../utils/error/errorHandler.js';
import { createResponse } from '../../utils/response/createResponse.js';
import { PACKET_TYPE } from '../../constants/header.js';
import { addMatchSession } from '../../session/match.session.js';
import { matchSessions } from '../../session/sessions.js';
import { searchPartySession } from '../../session/party.session.js';

//C_MatchRequest
const matchingHandler = (socket, packetData) => {
  try {
    // 파티 ,플레어 정보
    const { party } = packetData;

    //socket으로 유저 찾기
    const user = getUserBySocket(socket);

    //받아온 파티를 통해서 파티리더 아리디 찾기
    const leaderId = party.partyLeaderId;

    if (user.userInfo.userId !== leaderId) {
      console.log('파티장만 신청 가능합니다.');
      return;
    }

    // 매칭이 완료가 되면 matchingNotification을 isStart = false로 보내서 매칭 완료를 알려줌
    const matchingNotificationPayload = {
      isStart: true,
    };

    const matchingNotificationPacket = createResponse(
      'match',
      'S_MatchingNotification',
      PACKET_TYPE.S_MATCHINGNOTIFICATION,
      matchingNotificationPayload,
    );

    // 파티원 전원에게 브로드캐스트
    party.Players.forEach((member) => {
      const partyMember = getUserByNickname(member.playerName);
      partyMember.userInfo.socket.write(matchingNotificationPacket);
    });

    let matchSession = matchSessions[0];
    if (!matchSession) {
      console.log('이 던전의 매칭은 만들어지지 않았습니다');
      matchSession = addMatchSession();
    }

    const dungeon = matchSession.addPartyMatchQueue(party.partyId);

    if (!dungeon) {
      // 매칭이 아직 안 됐으므로, 던전 정보가 없다.
      console.log('아직 매칭이 완료되지 않았습니다.');
      return;
    }

    // 던전인포
    const dungeonInfoResponse = {
      dungeonId: dungeon.dungeonId,
      partyInfo: dungeon.partyInfo,
      dungeonState: dungeon.State,
      monster: null,
    };

    // 매칭이 완료되서 하나가 된 파티 인포(파티 + 파티) / 풀파티가 들어간 경우는 같은 값이 리턴
    const partyInfo = dungeon.partyInfo;

    // 업데이트 파티 리스트를 브로드캐스팅
    if (dungeon.partyInfo.Players.length > 0) {
      const updatedPartyInfo = dungeon.partyInfo;
      const updateResponse = createResponse(
        'party',
        'S_PartyResponse',
        PACKET_TYPE.S_PARTYRESPONSE,
        {
          party: updatedPartyInfo,
          case: 4, // 업데이트된 파티 정보
          success: true,
          message: '파티 정보가 업데이트되었습니다.',
          failCode: 0,
        },
      );
      //  파티의 다른 멤버들에게도 브로드캐스트
      dungeon.partyInfo.Players.forEach((member) => {
        const userSock = getUserByNickname(member.playerName);
        userSock.userInfo.socket.write(updateResponse);
      });
      socket.write(updateResponse);
    }

    // 던전 아이디에 맞는 씬으로 이동
    const matchPayload = {
      dungeonInfoResponse,
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
    // 파티원들에게 브로드캐스팅
    dungeon.partyInfo.Players.forEach((member) => {
      const userSock = getUserByNickname(member.playerName);
      userSock.userInfo.socket.write(matchResponse);
    });
    socket.write(matchResponse);
  } catch (e) {
    handlerError(socket, e);
  }
};

// C_MatchStopRequest
export const matchStopHandler = (socket, packetData) => {
  try {
    const { party } = packetData;
    console.log('stop', party);

    const partyId = party.partyId;

    const stopMatch = matchSessions[0].cancelMatch(partyId);

    if (stopMatch) {
      const matchStopPayload = {
        bool: true,
        message: '매칭 종료가 성공적으로 진행되었습니다.',
      };
      const matchStopResponse = createResponse(
        'match',
        'S_MatchStopResponse',
        PACKET_TYPE.S_MATCHSTOPRESPONSE,
        matchStopPayload,
      );
      socket.write(matchStopResponse);

      const matchingNotificationPayload = {
        isStart: false,
      };
      const matchingNotificationPacket = createResponse(
        'match',
        'S_MatchingNotification',
        PACKET_TYPE.S_MATCHINGNOTIFICATION,
        matchingNotificationPayload,
      );

      // 파티원 전원에게 브로드캐스트
      party.Players.forEach((member) => {
        const partyMember = getUserByNickname(member.playerName);
        partyMember.userInfo.socket.write(matchingNotificationPacket);
      });
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
