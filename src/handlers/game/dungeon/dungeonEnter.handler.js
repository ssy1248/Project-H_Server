import { MAX_PARTY_MEMBER } from '../../../constants/constants.js';
import {
  addDungeonSession,
  getDungeonSession,
  getDungeonUser,
} from '../../../session/dungeon.session.js';
import { getGameSession } from '../../../session/game.session.js';
import { searchPartyInPlayerSession, searchPartySession } from '../../../session/party.session.js';
import { getUserBySocket } from '../../../session/user.session.js';
import CustomError from '../../../utils/error/customError.js';
import { ErrorCodes } from '../../../utils/error/errorCodes.js';
import { handlerError } from '../../../utils/error/errorHandler.js';
import { removeUser } from '../../../session/user.session.js';
import { dungeonSessions, userSessions } from '../../../session/sessions.js';
import { createResponse } from '../../../utils/response/createResponse.js';
import { PACKET_TYPE } from '../../../constants/header.js';

const dungeonEnterHandler = (socket, packetData) => {
  try {
    // 매칭핸들러에서 받은 데이터 던전아이디, 플레이어정보, 파티아이디
    const { dungeonId, players, partyInfo } = packetData;

    /*지금 전체적인 흐름이 
   1. 파티장이 던전 입장 버튼을 클릭한다.
   2. 매칭 핸들러로 들어간다.
   3. 매칭이 완료되면 던전을 생성하고 던전아이디, playerinfo가 온다.
   4. 일단 들어온 코드에 검증을 한다 던전아이디의 던전이 있는지 playerinfo는 적절한지  
   5. 이 정보를 가지고 던전아이디에 자신을 던전 세션에 입장 시킨다. 
   6. 자신을 게임(마을)세션에서 자신을 제거한다.
   7. 클라이언트에게 완료코드를 보낸다.
    */

    // 아직 에러 코드는 안적었다.

    //소켓으로 유저를 찾는다. // 이게 유저 세션이 있다는것을 확인하는것이다.
    const user = getUserBySocket(socket);
    //유저에서 유저 Info 추출
    const userInfo = user.getUserInfo();
    // 유저 Info에서 userId 찾기
    const userId = userInfo.userId;

    //유저 아이디가 없으면 오류를 뱉어야함
    if (!userInfo) {
      throw new Error('플레이어 아이디가 없습니다.');
    }

    // 받아온 던전 아이디로 던전 세션을 찾는다.
    const dungeon = getDungeonSession(dungeonId);

    if (!dungeon) {
      //일단 있는지 없느지 부터 확인을 했는데 검증도 필요할수도
      throw new Error('던전이 생성되지 않았습니다.');
    }

    //던전 상테 확인
    const dungeonState = dungeon.getDungeonState();
    if (dungeonState !== 'matching') {
      throw new Error('던전이 매칭 상태가 아닙니다.');
    }

    // 유저가 던전 세션에 있는가 (이거 있으면 에러를 띠워야지)
    const dungeonUser = getDungeonUser(userId);
    if (dungeonUser) {
      throw new Error('유저가 던전에 있습니다');
    }

    if (dungeon.partyInfo.partyId !== partyInfo.partyId) {
      throw new Error('이던전은 속해있는 파티의 던전이 아님니다.');
    }

    // 받아온 파티 아이디로 파티 찾기 예도 다른 검증이 플요할수도 있다.
    const party = searchPartySession(partyInfo.partyId);

    console.log('파티', party);

    if (!party) {
      throw new ErrorCodes('파티가 없습니다.');
    }

    //만약 파티에 속한멤버수가 특정값 보다 적으면
    if (party.partyMembers.length < MAX_PARTY_MEMBER) {
      console.log('파티 인원이 부족합니다.');
    }

    // 던전 세션이 유저를 입장시킨다.
    dungeon.addUser(user);

    console.log(dungeon);

    //유저 세션에서 유저 제거
    removeUser(socket);

    console.log(userSessions);

    //일단 만약 던전에 max 인원이 있으면 상태를 변경하게 했다.
    if (dungeon.getUserCount() === MAX_PARTY_MEMBER) {
      dungeon.setDungeonState('progress');
    }

    console.log('던전 입장후', dungeon);

    const dungeonInfoResponse = {
      dungeonId: dungeon.dungeonId,
      dungeonIndex: dungeon.dungeonIndex,
      dungeonUser: dungeon.users,
      dungeonState: dungeon.sState,
    };

    // 던전 세션을 보내주는것이 맞나?
    // players는 받은 데이터 돌렺주는거고
    // party는 파티아이디로 찾은 아이디 돌려주는거고
    //mmessage
    //여기도 party가 만들어 지면 주석을 풀어야한다.
    const dungeonEnterPayload = {
      dungeonInfoResponse,
      players,
      partyInfo,
      message: '던전 입장이 완료되었습니다!', // 성공 메시지
    };

    //createResponse
    const dungeonEnterResponse = createResponse(
      'dungeon',
      'S_EnterDungeon',
      PACKET_TYPE.S_ENTERDUNGEON,
      dungeonEnterPayload,
    );

    socket.write(dungeonEnterResponse);
  } catch (e) {
    handlerError(socket, e);
  }
};

export default dungeonEnterHandler;
