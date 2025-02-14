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
    C_marketList: 'Google.Protobuf.Protocol.C_marketList',
    S_marketList: 'Google.Protobuf.Protocol.S_marketList',
    C_marketMyList: 'Google.Protobuf.Protocol.C_marketMyList',
    S_marketMyList: 'Google.Protobuf.Protocol.S_marketMyList',
    C_SellInMarket: 'Google.Protobuf.Protocol.C_SellInMarket',
    S_SellInMarket: 'Google.Protobuf.Protocol.S_SellInMarket',
    C_BuyInMarket: 'Google.Protobuf.Protocol.C_BuyInMarket',
    S_BuyInMarket: 'Google.Protobuf.Protocol.S_BuyInMarket',
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
  },
  chat: {
    C_Chat: 'Google.Protobuf.Protocol.C_Chat',
    S_Chat: 'Google.Protobuf.Protocol.S_Chat',
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
  },
  // match: {
  //   C_MatchRequest: 'Google.Protobuf.Protocol.C_MatchRequest',
  //   S_MatchResponse: 'Google.Protobuf.Protocol.S_MatchResponse',
  // },
  dungeon: {
    C_EnterDungeon: 'Google.Protobuf.Protocol.C_EnterDungeon',
    S_EnterDungeon: 'Google.Protobuf.Protocol.S_EnterDungeon',
    S_LeaveDungeon: 'Google.Protobuf.Protocol.S_LeaveDungeon',
    S_ScreenText: 'Google.Protobuf.Protocol.S_ScreenText',
    S_ScreenDone: 'Google.Protobuf.Protocol.S_ScreenDone',
  },
};
