import { PACKET_TYPE } from '../../constants/header.js';
import { getGameSession } from '../../session/game.session.js';
import { userSessions } from '../../session/sessions.js';
import { getUserBySocket } from '../../session/user.session.js';
import CustomError from '../../utils/error/customError.js';
import { ErrorCodes } from '../../utils/error/errorCodes.js';
import { handlerError } from '../../utils/error/errorHandler.js';
import { createResponse } from '../../utils/response/createResponse.js';

const animationHandler = (socket, payload) => {
  try {
    const gameSession = getGameSession();
    console.log(payload.animCode);
    if (!gameSession) {
      throw new CustomError(ErrorCodes.GAME_NOT_FOUND, '게임 세션을 찾을 수 없습니다.');
    }

    const user = getUserBySocket(socket);
    if (!user) {
      throw new CustomError(ErrorCodes.USER_NOT_FOUND, '유저를 찾을 수 없습니다.');
    }

    const packet = createResponse('town', 'S_Animation', PACKET_TYPE.S_ANIMATION, {
      playerId: user.userInfo.userId,
      animCode: payload.animCode,
    });
    userSessions.broadcastToAllUsers(packet);
  } catch (e) {
    handlerError(socket, e);
  }
};

export default animationHandler;
