import { MAX_PARTY_MEMBER } from '../../constants/constants.js';

class Party {
  constructor(id, partyName) {
    // 방장이 나가면 어떤식으로? -> 방장의 인덱스는 0이 고정 그러니 splice를 통해서 0번 짜르고 다음 인덱스에서 리더 부여?
    // 추방은 방장만! 방장은 파티 해체를 가능하게 해체를 하면 어떤식?
    // 파티 아이디
    this.id = id;
    // 파티 이름
    this.partyName = partyName;
    // 파티 인원을 담은 배열 = User
    this.partyMembers = [];
    // 파티 리더
    this.partyLeader = null;
    // 파티에 더 필요한게 있다면 여기에 추가해서 사용하자
  }

  // 파티 인원 추가
  addPartyMember(member) {
    // 만약 파티 인원이 초과했다면
    if (this.partyMembers.length >= MAX_PARTY_MEMBER) {
      console.log('파티 인원 초과');
      return;
    }

    this.partyMembers.push(member);

    // 리더가 없다면 리더를 0번 인덱스로 설정
    if (this.partyLeader === null) {
      this.partyLeader = this.partyMembers[0];
    }
  }

  // 파티 탈퇴
  exitPartyMember(member) {
    const index = this.partyMembers.indexOf(member);

    // 해당 멤버가 파티에 존재하지 않는 경우
    if (index === -1) {
      console.log('해당 멤버는 파티에 존재하지 않습니다.');
      return;
    }

    // 멤버가 파티에 단 한 명만 있을 경우
    if (this.partyMembers.length === 1) {
      this.partyMembers = [];
      this.partyLeader = null;
      return;
    }

    // 2명 이상인 경우 멤버 제거
    this.partyMembers.splice(index, 1);

    // 만약 탈퇴한 멤버가 리더였다면, 새로운 리더를 지정(배열의 첫 번째 멤버)
    if (this.partyLeader === member) {
      this.partyLeader = this.partyMembers[0];
    }
  }

  // 파티 추방 - 리더만 다른 멤버를 추방할 수 있음
  exitPartySelectMember(requester, memberToExpel) {
    // 요청자가 리더가 아니라면 추방 불가
    if (this.partyLeader !== requester) {
      console.log('파티 추방은 리더만 할 수 있습니다.');
      return;
    }

    // 리더가 스스로를 추방하려는 경우 차단
    if (memberToExpel === this.partyLeader) {
      console.log('리더는 스스로 추방할 수 없습니다.');
      return;
    }

    // 추방 대상 멤버가 파티에 존재하는지 확인
    const index = this.partyMembers.indexOf(memberToExpel);
    if (index === -1) {
      console.log('해당 멤버는 파티에 존재하지 않습니다.');
      return;
    }

    // 멤버 추방
    this.partyMembers.splice(index, 1);

    console.log(`${memberToExpel} 님이 파티에서 추방되었습니다.`);
  }
}

export default Party;
