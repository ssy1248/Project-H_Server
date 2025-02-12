import initialHandler from './user/initial.handler.js';
import CustomError from '../utils/error/customError.js';
import { ErrorCodes } from '../utils/error/errorCodes.js';
import moveHandler from './game/move.handler.js';
import { PACKET_TYPE } from '../constants/header.js';
import animationHandler from './game/animation.handler.js';
import chatHandler from './game/chat.handler.js';
import spawnUserHandler from './user/spawnUser.handler.js';
import movementSyncHandler from './user/moventSync.handler.js';
import registerHandler from './user/register.handler.js';
import loginHandler from './user/login.handler.js';
import { partyHandler } from './game/party.handler.js';
import dungeonEnterHandler from './game/dungeon/dungeonEnter.handler.js';

const handlers = {
  [PACKET_TYPE.C_REGISTERREQUEST]: {
    handler: registerHandler,
    protoType: 'user.C_RegisterRequest',
  },
  [PACKET_TYPE.S_REGISTERRESPONSE]: {
    handler: undefined,
    protoType: 'user.S_RegisterResponse',
  },
  [PACKET_TYPE.C_LOGINREQUEST]: {
    handler: loginHandler,
    protoType: 'user.C_LoginRequest',
  },
  [PACKET_TYPE.S_LOGINRESPONSE]: {
    handler: undefined,
    protoType: 'user.S_LoginResponse',
  },
  [PACKET_TYPE.C_SELECTCHARACTERREQUEST]: {
    handler: spawnUserHandler,
    protoType: 'user.C_SelectCharacterRequest',
  },
  [PACKET_TYPE.S_ENTER]: {
    handler: undefined,
    protoType: 'user.C_Enter',
  },
  [PACKET_TYPE.S_SPAWN]: {
    handler: undefined,
    protoType: 'user.S_Spawn',
  },
  [PACKET_TYPE.S_DESPAWN]: {
    handler: initialHandler,
    protoType: 'user.S_Despawn',
  },
  [PACKET_TYPE.C_MOVE]: {
    handler: movementSyncHandler,
    protoType: 'town.C_Move',
  },
  [PACKET_TYPE.S_MOVE]: {
    handler: undefined,
    protoType: 'town.S_Move',
  },
  [PACKET_TYPE.C_ANIMATION]: {
    handler: animationHandler,
    protoType: 'town.C_Animation',
  },
  [PACKET_TYPE.S_ANIMATION]: {
    handler: animationHandler,
    protoType: 'town.S_Animation',
  },
  [PACKET_TYPE.C_CHAT]: {
    handler: chatHandler,
    protoType: 'chat.C_Chat',
  },
  [PACKET_TYPE.S_CHAT]: {
    handler: animationHandler,
    protoType: 'chat.S_Chat',
  },
  [PACKET_TYPE.C_BUYITEMREQUEST]: {
    handler: animationHandler,
    protoType: 'inventory.C_BuyItemRequest',
  },
  [PACKET_TYPE.S_BUYITEMRESPONSE]: {
    handler: animationHandler,
    protoType: 'inventory.S_BuyItemResponse',
  },
  [PACKET_TYPE.C_EQUIPITEMREQUEST]: {
    handler: animationHandler,
    protoType: 'inventory.C_EquipItemRequest',
  },
  [PACKET_TYPE.S_EQUIPITEMRESPONSE]: {
    handler: animationHandler,
    protoType: 'inventory.S_EquipItemResponse',
  },
  [PACKET_TYPE.C_DISROBEITEMREQUEST]: {
    handler: animationHandler,
    protoType: 'inventory.C_DisrobeItemRequest',
  },
  [PACKET_TYPE.S_DISROBEITEMRESPONSE]: {
    handler: animationHandler,
    protoType: 'inventory.S_DisrobeItemResponse',
  },
  [PACKET_TYPE.C_ACTIVEITEMREQUEST]: {
    handler: animationHandler,
    protoType: 'inventory.C_ActiveItemRequest',
  },
  [PACKET_TYPE.S_ACTIVEITEMREQUEST]: {
    handler: animationHandler,
    protoType: 'inventory.S_ActiveItemRequest',
  },
  [PACKET_TYPE.C_PARTYREQUEST]: {
    handler: partyHandler,
    protoType: 'town.C_PartyRequest',
  },
  [PACKET_TYPE.S_PARTYRESPONSE]: {
    handler: animationHandler,
    protoType: 'town.S_PartyResponse',
  },
  [PACKET_TYPE.C_ENTERDUNGEON]: {
    handler: dungeonEnterHandler,
    protoType: 'dungeon.C_EnterDungeon',
  },
  [PACKET_TYPE.S_ENTERDUNGEON]: {
    handler: dungeonEnterHandler,
    protoType: 'dungeon.S_EnterDungeon',
  },
  [PACKET_TYPE.S_LEAVEDUNGEON]: {
    handler: animationHandler,
    protoType: 'dungeon.S_LeaveDungeon',
  },
  [PACKET_TYPE.S_SCREENTEXT]: {
    handler: animationHandler,
    protoType: 'dungeon.S_ScreenText',
  },
  [PACKET_TYPE.S_SCREENDONE]: {
    handler: animationHandler,
    protoType: 'dungeon.S_ScreenDone',
  },
  [PACKET_TYPE.C_UploadItemRequest]: {
    handler: shopHandler,
    protoType: 'inventory.C_UploadItemRequest',
  },
  [PACKET_TYPE.S_UploadItemResponse]: {
    handler: shopHandler,
    protoType: 'inventory.S_UploadItemResponse',
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
