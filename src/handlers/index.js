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
  partyExitHandler,
  partyHandler,
  partyInviteHandler,
  partyJoinHandler,
  partyKickHandler,
  partyLeaderChangeHandler,
  partyListHandler,
  partySearchHandler,
} from './game/party.handler.js';
import {
  disrobeItemHandler,
  equipItemHandler,
  inventoryHandler,
  MoveItemHandler,
} from './inventory/inventory.handler.js';
import dungeonEnterHandler from './game/dungeon/dungeonEnter.handler.js';
import buyInMarketHandler from './marketplace/buyInMarket.handler.js';
import sellInMarketHandler from './marketplace/sellInMarket.handler.js';
import marketMyListHandler from './marketplace/marketMyList.handler.js';
import marketListHandler from './marketplace/marketList.handler.js';
import matchingHandler, { matchStopHandler } from './game/match.handler.js';
import { handleBuyItem, handleInventoryList, handleSellItem } from './game/shop.handler.js';
import marketSelectBuyName from './marketplace/marketSelectBuyName.handler.js';
import enterAuctionBid from './game/enterAuctionBid.handler.js';
import {
  processBuffSkillHandler,
  processPlayerActionHandler,
} from './game/InGame/player.handler.js';
import dungeonSpawnHandler from './game/dungeon/dungeonSpawn.handler.js';
import { ActiveItemRequestHandler } from './inventory/item.handler.js';
import reSpawnUserHandler from './user/respawnUser.handler.js';
import monsterSyncHandler from './game/dungeon/monsterSync.handler.js';
import { playerSkillBuff, rangeAttackCollide, rangeAttackImpactHandler } from './game/dungeon/player.attack.js';
import userStateHandler from './user/userState.handler.js';
//import playerRangeAttackHandler from './game/dungeon/player.attack.js';
import bossSkillHandler from './game/dungeon/bossSkill.handler.js';

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
    handler: undefined,
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
    handler: chatHandler,
    protoType: 'chat.S_Chat',
  },
  [PACKET_TYPE.C_BUYITEMREQUEST]: {
    handler: handleBuyItem,
    protoType: 'inventory.C_BuyItemRequest',
  },
  [PACKET_TYPE.S_BUYITEMRESPONSE]: {
    handler: handleBuyItem,
    protoType: 'inventory.S_BuyItemResponse',
  },
  [PACKET_TYPE.C_EQUIPITEMREQUEST]: {
    handler: equipItemHandler,
    protoType: 'inventory.C_EquipItemRequest',
  },
  [PACKET_TYPE.C_DISROBEITEMREQUEST]: {
    handler: disrobeItemHandler,
    protoType: 'inventory.C_DisrobeItemRequest',
  },
  [PACKET_TYPE.C_MOVEITEMREQUEST]: {
    handler: MoveItemHandler,
    protoType: 'inventory.C_MoveItemRequest',
  },
  [PACKET_TYPE.C_ACTIVEITEMREQUEST]: {
    handler: ActiveItemRequestHandler,
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
  [PACKET_TYPE.C_MATCHREQUEST]: {
    handler: matchingHandler,
    protoType: 'match.C_MatchResponse',
  },
  [PACKET_TYPE.S_MATCHRESPONSE]: {
    handler: matchingHandler,
    protoType: 'match.S_MatchResponse',
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
  [PACKET_TYPE.C_PARTYINVITEREQUEST]: {
    handler: partyInviteHandler,
    protoType: 'party.C_PartyInviteRequest',
  },
  [PACKET_TYPE.C_PARTYJOINREQUEST]: {
    handler: partyJoinHandler,
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
    handler: partyKickHandler,
    protoType: 'party.C_PartyKickRequest',
  },
  [PACKET_TYPE.C_PARTYEXITREQUEST]: {
    handler: partyExitHandler,
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
  [PACKET_TYPE.C_BUYINMARKET]: {
    handler: buyInMarketHandler,
    protoType: 'town.C_BuyInMarket',
  },
  [PACKET_TYPE.S_BUYINMARKET]: {
    handler: buyInMarketHandler,
    protoType: 'town.S_BuyInMarket',
  },
  [PACKET_TYPE.C_EMOTE]: {
    handler: chatHandler,
    protoType: 'chat.C_Emote',
  },
  [PACKET_TYPE.S_EMOTE]: {
    handler: chatHandler,
    protoType: 'chat.S_Emote',
  },
  [PACKET_TYPE.C_SellItemRequest]: {
    handler: handleSellItem,
    protoType: 'inventory.C_SellItemRequest',
  },
  [PACKET_TYPE.S_SellItemResponse]: {
    handler: handleSellItem,
    protoType: 'inventory.S_SellItemResponse',
  },
  [PACKET_TYPE.C_MARKETSELECTBUYNAME]: {
    handler: marketSelectBuyName,
    protoType: 'town.C_MarketSelectBuyName',
  },
  [PACKET_TYPE.C_MATCHSTOPREQUEST]: {
    handler: matchStopHandler,
    protoType: 'match.C_MatchStopRequest',
  },
  [PACKET_TYPE.S_MATCHSTOPRESPONSE]: {
    handler: undefined,
    protoType: 'match.S_MatchStopResponse',
  },
  [PACKET_TYPE.S_MATCHINGNOTIFICATION]: {
    handler: undefined,
    protoType: 'match.S_MatchingNotification',
  },
  marketSelectBuyName,
  [PACKET_TYPE.C_SHOPINVENTORYREQUEST]: {
    handler: handleInventoryList,
    protoType: 'inventory.C_ShopInventoryRequest',
  },
  [PACKET_TYPE.S_SHOPINVENTORYLIST]: {
    handler: handleInventoryList,
    protoType: 'inventory.S_ShopInventoryList',
  },
  [PACKET_TYPE.C_PARTYLEADERCHANGEREQUEST]: {
    handler: partyLeaderChangeHandler,
    protoType: 'party.C_PartyLeaderChangeRequest',
  },
  [PACKET_TYPE.C_ENTERAUCTIONBID]: {
    handler: enterAuctionBid,
    protoType: 'dungeon.C_EnterAuctionBid',
  },
  [PACKET_TYPE.C_PLAYERACTION]: {
    handler: processPlayerActionHandler,
    protoType: 'dungeon.C_PlayerAction',
  },
  [PACKET_TYPE.S_PLAYERACTION]: {
    handler: undefined,
    protoType: 'dungeon.S_PlayerAction',
  },
  [PACKET_TYPE.C_DUNGEONENTER]: {
    handler: dungeonSpawnHandler,
    protoType: 'dungeon.C_DungeonEnter',
  },
  [PACKET_TYPE.C_DUNGEONEXIT]: {
    handler: reSpawnUserHandler,
    protoType: 'dungeon.C_DungeonExit',
  },
  [PACKET_TYPE.C_MONSTERMOVE]: {
    handler: monsterSyncHandler,
    protoType: 'town.C_MonsterMove',
  },
  [PACKET_TYPE.S_PLAYERRANGEATTACK]: {
    handler: undefined,
    protoType: 'dungeon.S_playerRangeAttck',
  },
  [PACKET_TYPE.C_PLAYERRANGEATTACK]: {
    handler: undefined,
    protoType: 'dungeon.C_playerRangeAttck',
  },
  [PACKET_TYPE.S_RANGEATTACKIMPACT]: {
    handler: rangeAttackImpactHandler,
    protoType: 'dungeon.S_rangeAttackImpact',
  },
  [PACKET_TYPE.C_RANGEATTACKIMPACT]: {
    handler: rangeAttackImpactHandler,
    protoType: 'dungeon.C_rangeAttackImpact',
  },
  [PACKET_TYPE.S_RANGEATTACKCOLLIDE]: {
    handler: undefined,
    protoType: 'dungeon.S_rangeAttcckCollide',
  },
  [PACKET_TYPE.C_RANGEATTACKCOLLIDE]: {
    handler: undefined,
    protoType: 'dungeon.C_rangeAttcckCollide',
  },
  [PACKET_TYPE.C_SKILLBUFF]: {
    handler: processBuffSkillHandler,
    protoType: 'dungeon.C_SkillBuff',
  },
  [PACKET_TYPE.S_SKILLBUFF]: {
    handler: undefined,
    protoType: 'dungeon.S_SkillBuff',
  },
  [PACKET_TYPE.C_GETUSERSTATE]: {
    handler: userStateHandler,
    protoType: 'user.C_GetUserState',
  },
  [PACKET_TYPE.C_BOSSSKILL]: {
    handler : bossSkillHandler,
    protoType : 'dungeon.C_BossSkill',
  }
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
