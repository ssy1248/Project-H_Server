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
    //파티에서 member.length가 MAX_PARTY_MEMBER 보다 적으면 매칭로직으로 보내기
    //매칭이 잡인것을 어떻게 파악을 할것인가

    //간단하게  addDungeonSession를 쓰고 거기서 유저를 추가하면 되지만
    //여기서 생각 해야할점이 여기서 addDungeonSession을 쓰면 던전이 파티원수대로 만들어지기 떄문에 고민을 해봐야한다.
    //socket에서 찾은 다음에 같이 갈 유저들을 찾는것도 좋은것 같다. 근데 파티로 가면 파티원이 누구 인지 아는데 모르면 매칭 쪽에서 알려줘야한다.
    //그리고 던전에 참여한 유저들을 gamesession에서 제거 해야한다.
    //결국 던전 생성 시점이 어디냐가 중요하다.
    //이 dungeonId를 어떻게 매칭된 유저들끼리 공유할것인가.

    const dungeonId = uuidv4();
    const dungeonSession = addDungeonSession(dungeonId, dungeonCode);

    dungeonSession.addUser(players);

    //던전입장시 필요한것

    const dungeonEnterPayload = { players, dungeonCode };
    const dungeonEnterResponse = createResponse(
      
      PACKET_TYPE.S_ENTERDUNGEON, 
      dungeonEnterPayload
    );

    socket.write(dungeonEnterResponse);
  } catch (e) {
    handlerError(socket, e);
  }
};

export default dungeonEnter;
