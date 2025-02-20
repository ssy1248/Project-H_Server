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

    const user = getUserBySocket(socket);
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

    console.log(party.partyId);
    const dungeon = matchSession.addPartyMatchQueue(party.partyId);
    if (!dungeon) {
      // 매칭이 아직 안 됐으므로, 던전 정보가 없다.
      console.log('아직 매칭이 완료되지 않았습니다.');
      return;
    }

    console.log(dungeon , '매칭 완료 던전 결과값');
    // 매칭이 성공하여 dungeon이 존재한다면, 이제 dungeonId 참조 가능
    const dungeonId = dungeon.dungeonId;

    // 매칭이 완료되고 리턴이 되서 날라온 값을 통해서 사용을 해야지 기존에 들어온 값으로 세팅을 하니 계속 1명이지
    const partyInfo = dungeon.partyInfo;
    console.log('매칭 완료 파티 인포');
    console.log(partyInfo);

    // 던전 아이디에 맞는 씬으로 이동
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
