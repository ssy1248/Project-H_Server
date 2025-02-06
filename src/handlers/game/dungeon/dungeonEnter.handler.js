import { getGameSession } from '../../../session/game.session.js';
import CustomError from '../../../utils/error/customError.js';
import { ErrorCodes } from '../../../utils/error/errorCodes.js';
import { handlerError } from '../../../utils/error/errorHandler.js';

const dungeonEnter = (socket, payload) => {
  try {
    const { dungeonCode, players } = payload;

    //socket에서 세션 찾아서  
    //던전 기준으로 class 


    //던전입장시 필요한것
  } catch (e) {
    handlerError(socket, e);
  }
};

export default dungeonEnter;
