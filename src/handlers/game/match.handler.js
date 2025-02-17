import { searchPartySession } from '../../session/party.session.js';
import { getUserBySocket } from '../../session/user.session.js';
import CustomError from '../../utils/error/customError.js';
import { ErrorCodes } from '../../utils/error/errorCodes.js';
import { handlerError } from '../../utils/error/errorHandler.js';
import { createResponse } from '../../utils/response/createResponse.js';
import { PACKET_TYPE } from '../../constants/header.js';
import { addMatchSession } from '../../session/match.session.js';

const matchingHandler = (socket, packetData) => {
  try {
    // 파티 ,플레어 정보
    const { partyinfo, dungeonCode, players } = packetData;

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

    //일단 파티 partyinfo에서 partyId 추출
    const partyId = partyinfo.partyId;

    //partId로 파티 찾기
    const party = searchPartySession(partyId);

    //소켓으로 유저 찾기
    const user = getUserBySocket(socket);

    // 매칭 세션이 0명이 되면 삭제할지 말지 고민 냅둬도 될거 같긴 한데
    //let matchSession = getMatchSession(dungeonCode);
    // if (!matchSession) {
    //   console.log('이 던전의 매칭은 만들어지지 않았습니다');
    //   matchSession = addMatchSession(dungeonCode);
    // }

    // 매칭이 완료가 되었을떄 들어가는 던전 정보를 어떻게 가져오냐 
    let dungeon;

    dungeon = matchSession.addPartyMatchQueue(partyId);
    // 여기서 나온 던전 세션을 새로 만드는 던전 인포에 맞게 넣어야한다.
    //dungeonInfo 에 들어가야 할것

    const dungeonInfo = {
      dungeonId: dungeon.dungeonId,
      dungeonIndex: dungeon.dungeonIndex,
      dungeonUser: dungeon.users,
      dungeonState: dungeon.sState,
    };

    const partyInfo = party.partyInfo;

    //dungeonId : 던전 아이디
    //dungeonIndex : 어떤 던전인지 아는 던전 번호
    //dungeonUser : 던전에 들어가있는 유저 <- 이부분에서 파티로 보내주는게 낳을까  그러면 던전 클래스도 그냥 파티로 만들면 되긴 하는데
    //dungeonState : 던전의 상태 매칭, 진행중, 중단

    //여기서 던전 세션을 만들어야한고 클라이언트에 보내줘야한다.일단 받은 데이터는 다 보내자

    const MatcchPayload = {
      dungeonInfo,
      players,
      partyInfo,
      message: '매칭이 완료되었습니다!', // 성공 메시지
    };

    //createResponse
    const matchResponse = createResponse('match', 'S_Match', PACKET_TYPE.S_Match, MatcchPayload);
    socket.write(matchResponse);
  } catch (e) {
    handlerError(socket, e);
  }
};

export default matchingHandler;
