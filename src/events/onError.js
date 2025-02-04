import { handlerError } from '../utils/error/errorHandler.js';
import CustomError from '../utils/error/customError.js';
import { removeUser } from '../session/user.session.js';
import { getGameSession } from '../session/game.session.js';

export const onError = (socket) => async (err) => {
  console.error('소켓 오류:', err);
  handlerError(socket, new CustomError(500, `소켓 오류: ${err.message}`));

  // 세션에서 유저 삭제
  await removeUser(socket);

  const gameSession = getGameSession();
  gameSession.removeUser(socket);
};
