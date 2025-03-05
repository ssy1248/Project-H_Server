import { addUser, getUserBySocket } from '../../session/user.session.js';
import { createResponse } from '../../utils/response/createResponse.js';
import { handlerError } from '../../utils/error/errorHandler.js';
import { getGameSession } from '../../session/game.session.js';
import User from '../../classes/models/user.class.js';
import { PACKET_TYPE } from '../../constants/header.js';
import CustomError from '../../utils/error/customError.js';
import { ErrorCodes } from '../../utils/error/errorCodes.js';
import getRandomInt32 from '../../utils/getRandomInt32.js';

const initialHandler = async (socket, data) => {
  try {
    let user = getUserBySocket(socket);
    if (user) {
      throw new CustomError(ErrorCodes.SOCKET_ERROR, '잠시 뒤 접속해주세요.');
    }
    const id = getRandomInt32();
    user = new User(socket, id, data.nickname, data.class);
    user.init();

    addUser(user);
    const gameSession = getGameSession();
    gameSession.addUser(user);


    const initialResponse = createResponse(
      PACKET_TYPE.S_ENTER,
      'game',
      'S_Enter',
      user.makeUserInfo(),
    );

    socket.write(initialResponse);
  } catch (e) {
    handlerError(socket, e);
  }
};

export default initialHandler;
