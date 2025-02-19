import Party from '../classes/models/party.class.js';
import { partySessions } from './sessions.js';
import { getUserById } from './user.session.js';

// 파티 생성
export const createPartySession = (id, partyName, userId, dungeonIndex) => {
  let partySession;
  if (!id || !partyName) {
    throw new Error('파티 생성 시 id와 partyName은 필수입니다.');
  }

  // 이미 파티에 들어가있다면 예외 처리
  if(searchPartyInPlayerSession(userId).length > 0){
    console.log('이미 파티에 들어가있는 플레이어는 파티 생성이 불가능합니다.');
  } else {
    partySession = new Party(id, partyName, userId, dungeonIndex);
    partySessions.push(partySession);
  }
  return partySession;
};

// 파티 해체 (파티 번호)
export const removePartySession = (id) => {
  if (!id) {
    throw new Error('파티 해체 시 id가 필요합니다.');
  }

  const partyIndex = partySessions.findIndex((party) => party.id === id);
  if (partyIndex === -1) {
    console.error(`파티 id ${id}를 찾을 수 없습니다.`);
    return false;
  }

  // 파티 세션 배열에서 제거
  partySessions.splice(partyIndex, 1);
  return true;
};

// 파티 전체 조회
export const GetAllPartySession = () => {
  return partySessions;
};

// 파티 조회 or 검색
export const searchPartySession = (id) => {
  // 파티 아이디로 검색을 할것인지? 이름으로 할지?
  if (!id) {
    throw new Error('파티 검색 시 id가 필요합니다.');
  }

  const party = partySessions.find((party) => party.id.toString() === id.toString());

  if (!party) {
    throw new Error(`파티 id ${id}를 찾을 수 없습니다.`);
  }

  return party;
};

// 던전에 들어간 파티를 찾는? 함수 있으면 좋을듯?

// 파티에 있는 유저 조회
export const searchPartyInPlayerSession = (userId) => {
  // 만약 여러개의 파티의 세션이 존재해서 그 파티를 전부다 조회해서 찾아야 한다면?
  if (!userId) {
    throw new Error("유저 검색 시 userId가 필요합니다.");
  }

  // partySessions 배열의 각 파티의 partyMembers 배열에 조건에 맞는 멤버가 있는지 확인
  const parties = partySessions.filter((party) => {
    // partyMembers가 배열인지 확인한 후, some() 메서드를 통해 조건 만족 여부를 판단
    if (!Array.isArray(party.partyMembers)) 
        return false;
    return party.partyMembers.some((member) => member.userInfo.userId === userId);
  });

  if (parties.length === 0) {
    console.log(`유저 id ${userId}가 포함된 파티를 찾을 수 없습니다.`);
  }

  return parties;
};