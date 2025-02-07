import { MAX_PARTY_MEMBER } from '../../../constants/constants.js';
import { getDungeonSession, getDungeonUser } from '../../../session/dungeon.session.js';
import { getGameSession } from '../../../session/game.session.js';
import { searchPartyInPlayerSession, searchPartySession } from '../../../session/party.session.js';
import { getUserById } from '../../../session/user.session.js';
import CustomError from '../../../utils/error/customError.js';
import { ErrorCodes } from '../../../utils/error/errorCodes.js';
import { handlerError } from '../../../utils/error/errorHandler.js';

const dungeonEnter = (socket, packetData) => {
  try {
    // 매칭핸들러에서 받은 데이터 던전아이디, 플레이어정보
    const { dungeonId, players } = packetData;

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

    //받아온 players의 playerinfo에서 id만 추출
    const playerId = players.playerId;

    //유저 아이디가 없으면 오류를 뱉어야함
    if (!playerId) {
      throw new Error('플레이어 아이디가 없습니다.');
    }

    // 받아온 던전 아이디로 던전 세션을 찾는다.
    const dungeonSession = getDungeonSession(dungeonId);

    if (!dungeonSession) {
      throw new Error('던전이 생성되지 않았습니다.');
    }

    //유저가 유저
    const userSession = getUserById(playerId);

    if (!userSession) {
      throw new Error('유저가 유저 세션에 없습니다.');
    }

    //게임세션 가져오기  (아직 게임세션이 하나만 만들어 지기 떄문에 getGameSession으로 해도 된다. 만약 게임세션이 늘어나면 userId로 찾을수 있게 해야한다.)
    const gameSession = getGameSession();

    //유저가 게임 세션에 있는가
    const gameUser = getUser(socket);
    if (!gameUser) {
      throw new Error('유저가 게임에 없습니다');
    }

    //유저가 던전 세션에 있는가 (이거 있으면 에러를 띠워야지)
    const dungeonUser = getDungeonUser(userId);
    if (dungeonUser) {
      throw new Error('유저가 던전에 있습니다');
    }

    //이러면 속한 파티의 아이디가 나옴
    const partyId = searchPartyInPlayerSession(playerId);

    //속한 파티 알기
    const party = searchPartySession(partyId);

    //만약 파티에 속한멤버수가 특정값 보다 적으면
    if (party.partyMembers.length < MAX_PARTY_MEMBER) {
      console.log('파티 인원이 부족합니다.');
    }

    // 던전 세션이 유저를 입장시킨다.
    dungeonSession.addUser(players);

    //게임 세션에서 이유저를 제거해야한다.
    gameSession.removeUser(socket);

    /*
    그런 다음 완료 코드를 보낸다.
    players,dungeonCode는 원래 있던 패킷에 있어서 넣었다 필요없으면 뺴도 된다.
    dungeonId는 이파티,유저가 어떤 던전인지 알기 위해서 필요할것같다
    */

    const dungeonEnterPayload = { players, dungeonId };
    //createResponse
    const dungeonEnterResponse = createResponse(
      'dungeon',
      S_EnterDungeon,
      PACKET_TYPE.S_ENTERDUNGEON,
      dungeonEnterPayload,
    );

    socket.write(dungeonEnterResponse);
  } catch (e) {
    handlerError(socket, e);
  }
};

export default dungeonEnter;
