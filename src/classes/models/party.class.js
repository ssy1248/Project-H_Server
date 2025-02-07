import { MAX_PARTY_MEMBER } from '../../constants/constants.js';

/* 파티 패킷 
message C_PartyRequest{
    int32 userId = 1;
}
message S_PartyResponse{
    PartyInfo party =1;
    bool success =2;
    string message= 3;
    GlobalFailCode failCode =4;
}
    추가 패킷이 필요하다고 생각들면 추가하자
*/

// 클라이언트에서 userId를 보내주니 party가 생성이 될 떄 userId를 사용해서 그 userId를 파티장으로 설정
class Party {
  constructor(id, partyName) {
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

  // 파티장 변경
  changePartyLeader(requester, newLeader) {
    // 요청자가 리더가 아니라면 리더 변경 불가
    if (this.partyLeader !== requester) {
      console.log('파티장 변경은 리더만 할 수 있습니다.');
      return;
    }

    // 새로운 리더가 파티에 속해있는지 확인
    if (this.partyMembers.indexOf(newLeader) === -1) {
      console.log('파티에 속해있지 않은 멤버는 파티장이 될 수 없습니다.');
      return;
    }

    // 리더 변경
    this.partyLeader = newLeader;

    console.log(`${newLeader} 님이 새로운 파티장이 되었습니다.`);
  }

  // 파티장 설정
  setPartyLeader(leader) {
    // 파티에 속해있지 않은 멤버는 리더가 될 수 없음
    if (this.partyMembers.indexOf(leader) === -1) {
      console.log('파티에 속해있지 않은 멤버는 리더가 될 수 없습니다.');
      return;
    }

    if (this.partyLeader !== null) {
      console.log('이미 리더가 설정되어 있습니다.');
      return;
    }

    this.partyLeader = leader;
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
    this.setPartyLeader(this.partyMembers[0]);
  }

  // 파티 초대
  inviteParty(requester, member) {
    const index = this.partyMembers.indexOf(requester);

    if (index === -1) {
      console.log('파티에 속해있지 않습니다.');
      return;
    }

    if (this.partyMembers.length >= MAX_PARTY_MEMBER) {
      console.log('파티 인원 초과');
      return;
    }

    // 생각나는 예외 사항
    // 초대한 멤버가 거절을 했을 경우?

    // 초대한 멤버가 이미 다른 파티에 속해있을 경우?
    // 초대한 멤버가 잠수일 경우
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
      // 세션 지우기
      this.partyMembers = [];
      this.partyLeader = null;
      return;
    }

    // 2명 이상인 경우 멤버 제거
    this.partyMembers.splice(index, 1);

    // 만약 탈퇴한 멤버가 리더였다면, 새로운 리더를 지정(배열의 첫 번째 멤버)
    this.setPartyLeader(this.partyMembers[0]);
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

  // 방장은 파티 해체를 가능하게 해체를 하면 어떤식?
  PartyBreakUp(requester) {
    // 요청자가 리더가 아니라면 해체 불가
    if (this.partyLeader !== requester) {
      console.log('파티 해체는 리더만 할 수 있습니다.');
      return;
    }

    // 파티 해체
    // 세션도 삭제 해줘야 함
    this.partyMembers = [];
    this.partyLeader = null;

    console.log('파티가 해체되었습니다.');
  }
}

export default Party;
