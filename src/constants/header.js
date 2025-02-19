export const TOTAL_LENGTH = 4;
export const PACKET_TYPE_LENGTH = 1;

export const PACKET_TYPE = {
  C_REGISTERREQUEST: 0,
  S_REGISTERRESPONSE: 1,
  C_LOGINREQUEST: 2,
  S_LOGINRESPONSE: 3,
  C_SELECTCHARACTERREQUEST: 4,
  S_ENTER: 5,
  S_SPAWN: 6,
  S_DESPAWN: 7,
  C_MOVE: 8,
  S_MOVE: 9,
  C_ANIMATION: 10,
  S_ANIMATION: 11,
  C_CHAT: 12,
  S_CHAT: 13,
  C_BUYITEMREQUEST: 14,
  S_BUYITEMRESPONSE: 15,
  C_EQUIPITEMREQUEST: 16,
  S_EQUIPITEMRESPONSE: 17,
  C_DISROBEITEMREQUEST: 18,
  S_DISROBEITEMRESPONSE: 19,
  C_ACTIVEITEMREQUEST: 20,
  S_ACTIVEITEMREQUEST: 21,
  C_PARTYREQUEST: 22,
  S_PARTYRESPONSE: 23,
  C_ENTERDUNGEON: 24,
  S_ENTERDUNGEON: 25,
  S_LEAVEDUNGEON: 26,
  S_SCREENTEXT: 27,
  S_SCREENDONE: 28,
  C_PARTYINVITEREQUEST: 29,
  C_PARTYJOINREQUEST: 30,
  C_PARTYLISTREQUEST: 31,
  C_SEARCHPARTYREQUEST: 32,
  C_PARTYKICKREQUEST: 33,
  C_PARTYEXITREQUEST: 34,
  S_PARTYSEARCHRESPONSE: 35,
  S_PARTYRESULTRESPONSE: 36,
  C_MARKETLIST: 37,
  S_MARKETLIST: 38,
  C_MARKETMYLIST: 39,
  S_MARKETMYLIST: 40,
  C_SELLINMARKET: 41,
  S_SELLINMARKET: 42,
  C_BUYINMARKET: 43,
  S_BUYINMARKET: 44,
  C_INVENTORYREQUEST: 45,
  S_INVENTORYRESPONSE: 46,
  C_EMOTE: 47,
  S_EMOTE: 48,
  C_MATCHREQUEST: 49,
  S_MATCHRESPONSE: 50,
  C_SELLITEMREQUEST: 51,
  S_SELLITEMRESPONSE: 52,
  C_MARKETSELECTBUYNAME: 53,
  S_MARKETSELECTBUYNAME: 54,
  C_MATCHSTOPREQUEST: 55,
  S_MATCHSTOPRESPONSE: 56,
  S_MATCHINGNOTIFICATION: 57,
};
