import { addDungeonSession } from '../../../session/dungeon.session.js';
import { getGameSession } from '../../../session/game.session.js';
import CustomError from '../../../utils/error/customError.js';
import { ErrorCodes } from '../../../utils/error/errorCodes.js';
import { handlerError } from '../../../utils/error/errorHandler.js';

const dungeonEnter = (socket, payload) => {
  try {
    //이게에 문제가 있다. 같이 온 팀원들에 대해서 알아야 하는데 어떻게 찾지
    const { dungeonCode, players } = payload;

    //players는 playerinfo가 들어있다. 여기서 id을 추출

    //받아온 players의 playerinfo에서 id만 추출
    const player = players.playerId;

    //파티 클래스가 만들어진 다음에 같이 있는 파티 찾는로직을 만들자

    //만약 파티의 인원이 가득차 있지 않거나, 파티가 없으면 매칭 핸들러 보내거나 실패 코드를 보내서 클라에서 이 실패코드를 방으면 랜덤매칭을 돌리겠습니까 창을 띠우게 할수도 있지

    //던전 기준으로 class
    //파티의 인원이 가득 차 있으면 던전을 만들고 거기에 유저를 추가해야한다.

    //간단하게  addDungeonSession를 쓰고 거기서 유저를 추가하면 되지만
    //여기서 생각 해야할점이 여기서 addDungeonSession을 쓰면 던전이 파티원수대로 만들어지기 떄문에 고민을 해봐야한다.
    //socket에서 찾은 다음에 같이 갈 유저들을 찾는것도 좋은것 같다. 근데 파티로 가면 파티원이 누구 인지 아는데 모르면 매칭 쪽에서 알려줘야한다.

    //던전입장시 필요한것

    const dungeonEnterPayload = { players, dungeonCode };
    const dungeonEnterResponse = createResponse(
      PACKET_TYPE.S_ENTER,
      dungeonEnterPayload,
      user.makeUserInfo(),
    );

    socket.write(dungeonEnterResponse);
  } catch (e) {
    handlerError(socket, e);
  }
};

export default dungeonEnter;
