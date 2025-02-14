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
import {
  partyHandler,
  partyInviteHandler,
  partyListHandler,
  partySearchHandler,
} from './game/party.handler.js';
import { inventoryHandler } from './inventory/inventory.handler.js';
import dungeonEnterHandler from './game/dungeon/dungeonEnter.handler.js';
import buyInMarketHandler from './marketplace/buyInMarket.handler.js';
import sellInMarketHandler from './marketplace/sellInMarket.handler.js';
import marketMyListHandler from './marketplace/marketMyList.handler.js';
import marketListHandler from './marketplace/marketList.handler.js';

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
    protoType: 'party.C_PartyRequest',
  },
  [PACKET_TYPE.S_PARTYRESPONSE]: {
    handler: animationHandler,
    protoType: 'party.S_PartyResponse',
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
  [PACKET_TYPE.C_INVENTORYREQUEST]: {
    handler: inventoryHandler,
    protoType: 'inventory.C_InventoryRequest',
  },
  [PACKET_TYPE.S_INVENTORYRESPONSE]: {
    handler: inventoryHandler,
    protoType: 'inventory.S_InventoryResponse',
  },
  [PACKET_TYPE.C_PARTYINVITEREQUEST]: {
    handler: partyInviteHandler,
    protoType: 'party.C_PartyInviteRequest',
  },
  [PACKET_TYPE.C_PARTYJOINREQUEST]: {
    handler: animationHandler,
    protoType: 'party.C_PartyJoinRequest',
  },
  [PACKET_TYPE.C_PARTYLISTREQUEST]: {
    handler: partyListHandler,
    protoType: 'party.C_PartyListRequest',
  },
  [PACKET_TYPE.C_SEARCHPARTYREQUEST]: {
    handler: partySearchHandler,
    protoType: 'party.C_SearchPartyRequest',
  },
  [PACKET_TYPE.C_PARTYKICKREQUEST]: {
    handler: animationHandler,
    protoType: 'party.C_PartyKickRequest',
  },
  [PACKET_TYPE.C_PARTYEXITREQUEST]: {
    handler: animationHandler,
    protoType: 'party.C_PartyExitRequest',
  },
  [PACKET_TYPE.S_PARTYSEARCHRESPONSE]: {
    handler: animationHandler,
    protoType: 'party.S_PartySearchResponse',
  },
  [PACKET_TYPE.S_PARTYRESULTRESPONSE]: {
    handler: animationHandler,
    protoType: 'party.S_PartyResultResponse',
  },
  [PACKET_TYPE.C_MARKETLIST]: {
    handler: marketListHandler,
    protoType: 'town.C_marketList',
  },
  [PACKET_TYPE.S_MARKETLIST]: {
    handler: animationHandler,
    protoType: 'town.S_marketList',
  },
  [PACKET_TYPE.C_MARKETMYLIST]: {
    handler: marketMyListHandler,
    protoType: 'town.C_marketMyList',
  },
  [PACKET_TYPE.S_MARKETMYLIST]: {
    handler: animationHandler,
    protoType: 'town.S_marketMyList',
  },
  [PACKET_TYPE.C_SELLINMARKET]: {
    handler: sellInMarketHandler,
    protoType: 'town.C_SellInMarket',
  },
  [PACKET_TYPE.S_SELLINMARKET]: {
    handler: animationHandler,
    protoType: 'town.S_SellInMarket',
  },
  [PACKET_TYPE.C_BuyInMarket]: {
    handler: buyInMarketHandler,
    protoType: 'town.C_BuyInMarket',
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
