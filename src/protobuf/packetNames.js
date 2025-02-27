export const packetNames = {
  user: {
    C_RegisterRequest: 'Google.Protobuf.Protocol.C_RegisterRequest',
    S_RegisterResponse: 'Google.Protobuf.Protocol.S_RegisterResponse',
    C_LoginRequest: 'Google.Protobuf.Protocol.C_LoginRequest',
    S_LoginResponse: 'Google.Protobuf.Protocol.S_LoginResponse',
    C_SelectCharacterRequest: 'Google.Protobuf.Protocol.C_SelectCharacterRequest',
    S_Enter: 'Google.Protobuf.Protocol.S_Enter',
    S_Spawn: 'Google.Protobuf.Protocol.S_Spawn',
    S_Despawn: 'Google.Protobuf.Protocol.S_Despawn',
  },
  town: {
    C_Move: 'Google.Protobuf.Protocol.C_Move',
    S_Move: 'Google.Protobuf.Protocol.S_Move',
    C_Animation: 'Google.Protobuf.Protocol.C_Animation',
    S_Animation: 'Google.Protobuf.Protocol.S_Animation',
    C_MarketList: 'Google.Protobuf.Protocol.C_MarketList',
    S_MarketList: 'Google.Protobuf.Protocol.S_MarketList',
    C_MarketMyList: 'Google.Protobuf.Protocol.C_MarketMyList',
    S_MarketMyList: 'Google.Protobuf.Protocol.S_MarketMyList',
    C_SellInMarket: 'Google.Protobuf.Protocol.C_SellInMarket',
    S_SellInMarket: 'Google.Protobuf.Protocol.S_SellInMarket',
    C_BuyInMarket: 'Google.Protobuf.Protocol.C_BuyInMarket',
    S_BuyInMarket: 'Google.Protobuf.Protocol.S_BuyInMarket',
    C_MarketSelectBuyName: 'Google.Protobuf.Protocol.C_MarketSelectBuyName',
    S_MarketSelectBuyName: 'Google.Protobuf.Protocol.S_MarketSelectBuyName',
    S_MonsterSpawn: 'Google.Protobuf.Protocol.S_MonsterSpawn',
    C_MonsterMove: 'Google.Protobuf.Protocol.C_MonsterMove',
    S_MonsterMove: 'Google.Protobuf.Protocol.S_MonsterMove',
    S_MonsterHit: 'Google.Protobuf.Protocol.S_MonsterHit',
    S_MonsterAttck: 'Google.Protobuf.Protocol.S_MonsterAttck',
    S_MonsterDie: 'Google.Protobuf.Protocol.S_MonsterDie',
  },
  party: {
    C_PartyRequest: 'Google.Protobuf.Protocol.C_PartyRequest',
    S_PartyResponse: 'Google.Protobuf.Protocol.S_PartyResponse',
    C_PartyInviteRequest: 'Google.Protobuf.Protocol.C_PartyInviteRequest',
    C_PartyJoinRequest: 'Google.Protobuf.Protocol.C_PartyJoinRequest',
    C_PartyListRequest: 'Google.Protobuf.Protocol.C_PartyListRequest',
    C_SearchPartyRequest: 'Google.Protobuf.Protocol.C_SearchPartyRequest',
    C_PartyKickRequest: 'Google.Protobuf.Protocol.C_PartyKickRequest',
    C_PartyExitRequest: 'Google.Protobuf.Protocol.C_PartyExitRequest',
    S_PartySearchResponse: 'Google.Protobuf.Protocol.S_PartySearchResponse',
    S_PartyResultResponse: 'Google.Protobuf.Protocol.S_PartyResultResponse',
    S_PartyResponse: 'Google.Protobuf.Protocol.S_PartyResponse',
    C_PartyLeaderChangeRequest: 'Google.Protobuf.Protocol.C_PartyLeaderChangeRequest',
  },
  chat: {
    C_Chat: 'Google.Protobuf.Protocol.C_Chat',
    S_Chat: 'Google.Protobuf.Protocol.S_Chat',
    C_Emote: 'Google.Protobuf.Protocol.C_Emote',
    S_Emote: 'Google.Protobuf.Protocol.S_Emote',
  },
  inventory: {
    C_BuyItemRequest: 'Google.Protobuf.Protocol.C_BuyItemRequest',
    S_BuyItemResponse: 'Google.Protobuf.Protocol.S_BuyItemResponse',
    C_EquipItemRequest: 'Google.Protobuf.Protocol.C_EquipItemRequest',
    S_EquipItemResponse: 'Google.Protobuf.Protocol.S_EquipItemResponse',
    C_DisrobeItemRequest: 'Google.Protobuf.Protocol.C_DisrobeItemRequest',
    S_DisrobeItemResponse: 'Google.Protobuf.Protocol.S_DisrobeItemResponse',
    C_ActiveItemRequest: 'Google.Protobuf.Protocol.C_ActiveItemRequest',
    S_ActiveItemRequest: 'Google.Protobuf.Protocol.S_ActiveItemResponse',
    C_InventoryRequest: 'Google.Protobuf.Protocol.C_InventoryRequest',
    S_InventoryResponse: 'Google.Protobuf.Protocol.S_InventoryResponse',
    C_SellItemRequest: 'Google.Protobuf.Protocol.C_SellItemRequest',
    S_SellItemResponse: 'Google.Protobuf.Protocol.S_SellItemResponse',
    C_ShopInventoryRequest: 'Google.Protobuf.Protocol.C_ShopInventoryRequest',
    S_ShopInventoryList: 'Google.Protobuf.Protocol.S_ShopInventoryList',
    C_MoveItemRequest: 'Google.Protobuf.Protocol.C_MoveItemRequest',
    S_MoveItemResponse: 'Google.Protobuf.Protocol.S_MoveItemResponse',
  },
  match: {
    C_MatchRequest: 'Google.Protobuf.Protocol.C_MatchRequest',
    S_MatchingNotification: 'Google.Protobuf.Protocol.S_MatchingNotification',
    S_MatchResponse: 'Google.Protobuf.Protocol.S_MatchResponse',
    C_MatchStopRequest: 'Google.Protobuf.Protocol.C_MatchStopRequest',
    S_MatchStopResponse: 'Google.Protobuf.Protocol.S_MatchStopResponse',
  },
  dungeon: {
    C_EnterDungeon: 'Google.Protobuf.Protocol.C_EnterDungeon',
    S_EnterDungeon: 'Google.Protobuf.Protocol.S_EnterDungeon',
    S_LeaveDungeon: 'Google.Protobuf.Protocol.S_LeaveDungeon',
    S_ScreenText: 'Google.Protobuf.Protocol.S_ScreenText',
    S_ScreenDone: 'Google.Protobuf.Protocol.S_ScreenDone',
    S_SetAuctionData: 'Google.Protobuf.Protocol.S_SetAuctionData',
    C_EnterAuctionBid: 'Google.Protobuf.Protocol.C_EnterAuctionBid',
    S_EnterAuctionBid: 'Google.Protobuf.Protocol.S_EnterAuctionBid',
    S_FinalizeBuyAuction: 'Google.Protobuf.Protocol.S_FinalizeBuyAuction',
    S_FinalizeAllAuction: 'Google.Protobuf.Protocol.S_FinalizeAllAuction',
    S_WaitAuction: 'Google.Protobuf.Protocol.S_WaitAuction',
    S_EndAuction: 'Google.Protobuf.Protocol.S_EndAuction',
    C_PlayerAction: 'Google.Protobuf.Protocol.C_PlayerAction',
    S_PlayerAction: 'Google.Protobuf.Protocol.S_PlayerAction',
    C_DungeonEnter: 'Google.Protobuf.Protocol.C_DungeonEnter',
    S_DungeonSpawn: 'Google.Protobuf.Protocol.S_DungeonSpawn',
    S_DungeonDeSpawn: 'Google.Protobuf.Protocol.S_DungeonDeSpawn',
    C_DungeonExit: 'Google.Protobuf.Protocol.C_DungeonExit',
    S_SetPlayerHpData: 'Google.Protobuf.Protocol.S_SetPlayerHpData',
    S_SetPlayerData: 'Google.Protobuf.Protocol.S_SetPlayerData',
    S_SetMonsterHpData: 'Google.Protobuf.Protocol.S_SetMonsterHpData',
  },
};
