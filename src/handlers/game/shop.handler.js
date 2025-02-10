import { getGameSession } from '../../session/game.session.js';
import CustomError from '../../utils/error/customError.js';
import { ErrorCodes } from '../../utils/error/errorCodes.js';
import { handlerError } from '../../utils/error/errorHandler.js';

const shopHandler = (socket) => {
  try {
    const gameSession = getGameSession();

    if (!gameSession) {
      throw new CustomError(ErrorCodes.GAME_NOT_FOUND, '게임 세션을 찾을 수 없습니다.');
    }

    const user = gameSession.getUser(socket);
    if (!user) {
      throw new CustomError(ErrorCodes.USER_NOT_FOUND, '유저를 찾을 수 없습니다.');
    }
  } catch (e) {
    handlerError(socket, e);
  }
};

export default shopHandler;
