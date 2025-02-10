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
    // 매칭핸들러에서 받은 데이터 던전아이디, 플레이어정보, 파티아이디
    const { dungeonId, players, partyId } = packetData;

    //받는 데이터로 던전의 상태를 넣는것이 어떤가
    //예를 들면 예를 들면 던전활성화 isAtive 만약 넣는다면 
    // start actvie end 이렇게 3개로 나누어서 
    // start는 입장이 가능하고
    // 그러면 여기서 문제 언제 active로 바꿀건인가
    // active는 입장 불가
    // end는 다끝났으니까 전부 dungeonSessio에서 제거후 gameSessions에 추가후 던전세션 제거
    // 이걸 하기 위해서는 class 에 isActive를 추가하는것이 좋을것 같다.

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

    //일단 있는지 없느지 부터 확인을 했는데 검증도 필요할수도
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

    //받아온 파티 아이디로 파티 찾기 예도 다른 검증이 플요할수도 있다.
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

    const dungeonEnterPayload = {
      dungeonId,
      players,
      party,
      message: '던전 입장이 완료되었습니다!', // 성공 메시지
      dungeonEnterSuccess: true, // 입장 성공 여부
    };

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
