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
    C_PartyRequest: 'Google.Protobuf.Protocol.C_PartyRequest',
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
  },
  dungeon: {
    C_EnterDungeon: 'Google.Protobuf.Protocol.C_EnterDungeon',
    S_EnterDungeon: 'Google.Protobuf.Protocol.S_EnterDungeon',
    S_LeaveDungeon: 'Google.Protobuf.Protocol.S_LeaveDungeon',
    S_ScreenText: 'Google.Protobuf.Protocol.S_ScreenText',
    S_ScreenDone: 'Google.Protobuf.Protocol.S_ScreenDone',
  },
};
