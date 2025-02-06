import { MAX_PARTY_MEMBER } from '../../constants/constants';

class Party {
  constructor(id, partyName) {
    // 파티 아이디
    this.id = id;
    // 파티 이름
    this.partyName = partyName;
    // 파티 인원을 담은 배열
    this.partyMemebers = [];
  }

  // 파티 인원 추가
  addPartyMember(member) {
    if (this.partyMemebers.length >= MAX_PARTY_MEMBER) {
      console.log('파티 인원 초과');
      return;
    }

    this.partyMemebers.push(member);
  }

  // 파티 인원 제거? 추방?

  // 파티 인원 전체 조회? 한명 조회?
}

export default Party;