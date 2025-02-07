import { MAX_PARTY_MEMBER } from '../../../constants/constants.js';
import { addDungeonSession } from '../../../session/dungeon.session.js';
import CustomError from '../../../utils/error/customError.js';
import { ErrorCodes } from '../../../utils/error/errorCodes.js';
import { handlerError } from '../../../utils/error/errorHandler.js';
import { v4 as uuidv4 } from 'uuid';

const dungeonEnter = (socket, packetData) => {
  try {
    //이게에 문제가 있다. 같이 온 팀원들에 대해서 알아야 하는데 어떻게 찾지
    const { dungeonCode, players } = packetData;

    //players는 playerinfo가 들어있다. 여기서 id을 추출

    //받아온 players의 playerinfo에서 id만 추출
    const player = players.playerId;

    //파티 클래스가 만들어진 다음에 같이 있는 파티 찾는로직을 만들자

    //먼저 playerId로 어떤 파티인지 알고
    //파티에서 member.length가 MAX_PARTY_MEMBER 보다 적으면 매칭 큐에 넣기 아직 파티에서 찾는것이 낳아와야하마

    //여기서 생각 해야할점이 여기서 addDungeonSession을 쓰면 던전이 파티원수대로 만들어지기 떄문에 고민을 해봐야한다.
    //socket에서 찾은 다음에 같이 갈 유저들을 찾는것도 좋은것 같다. 근데 파티로 가면 파티원이 누구 인지 아는데 모르면 매칭 쪽에서 알려줘야한다.
    //그리고 던전에 참여한 유저들을 gamesession에서 제거 해야한다.
    //결국 던전 생성 시점이 어디냐가 중요하다.
    //이 dungeonId를 어떻게 매칭된 유저들끼리 공유할것인가.

    const dungeonId = uuidv4();

    const dungeonSession = addDungeonSession(dungeonId, dungeonCode);

    dungeonSession.addUser(players);

    //이 이후 나 말고 다른 플레이어도 들어오게 해야한다.

    /*던전입장시 필요한것
    players,dungeonCode는 원래 있던 패킷에 있어서 넣었다 필요없으면 뺴도 된다.
    dungeonId는 이파티,유저가 어떤 던전인지 알기 위해서 필요할것같다.
    partymember도 넣으면 좋을것 같다. 이던전에 나말고 누구랑 같이 같는지를 알게 하기 위해서이다.
    */
    const dungeonEnterPayload = { players, dungeonCode, dungeonId };
    const dungeonEnterResponse = createResponse(PACKET_TYPE.S_ENTERDUNGEON, dungeonEnterPayload);

    socket.write(dungeonEnterResponse);
  } catch (e) {
    handlerError(socket, e);
  }
};

export default dungeonEnter;
