import initialHandler from './user/initial.handler.js';
import CustomError from '../utils/error/customError.js';
import { ErrorCodes } from '../utils/error/errorCodes.js';
import moveHandler from './game/move.handler.js';
import { PACKET_TYPE } from '../constants/header.js';
import animationHandler from './game/animation.handler.js';
import chatHandler from './game/chat.handler.js';

const handlers = {
  [PACKET_TYPE.C_ENTER]: {
    handler: initialHandler,
    protoType: 'game.C_Enter',
  },
  [PACKET_TYPE.C_MOVE]: {
    handler: moveHandler,
    protoType: 'game.C_Move',
  },
  [PACKET_TYPE.C_ANIMATION]: {
    handler: animationHandler,
    protoType: 'game.C_Animation',
  },
  [PACKET_TYPE.C_CHAT]: {
    handler: chatHandler,
    protoType: 'game.C_Chat',
  },
};

export const getHandlerById = (handlerId) => {
  if (!handlers[handlerId]) {
    throw new CustomError(
      ErrorCodes.UNKNOWN_HANDLER_ID,
      `핸들러를 찾을 수 없습니다: ID ${handlerId}`,
    );
  }
  return handlers[handlerId].handler;
};

export const getProtoTypeNameByHandlerId = (handlerId) => {
  if (!handlers[handlerId]) {
    throw new CustomError(
      ErrorCodes.UNKNOWN_HANDLER_ID,
      `프로토타입를 찾을 수 없습니다: ID ${handlerId}`,
    );
  }
  return handlers[handlerId].protoType;
};
