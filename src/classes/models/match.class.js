import { MAX_PARTY_MEMBER } from '../../constants/constants.js';
import { searchPartySession } from '../../session/party.session.js';
import { setDesiredDungeonIndex } from './party.class.js';

const maxDungeonNum = MAX_PARTY_MEMBER;
// 매칭 관련 다룰 클래스
class Match {
  constructor(dungeonIndex) {
    // 파티와 솔로 매치 큐
    this.partyQueue = [];
    this.soloQueue = [];
    this.dungeonIndex = dungeonIndex;
    
    setDesiredDungeonIndex(dungeonIndex);
  }

  // 파티로 매칭 시도
  addPartyMatchQueue(partyId) {
    try {
      const party = searchPartySession(partyId);

      // 파티 객체가 현재 매칭 인스턴스의 던전과 일치하는지 확인
      if (party.desiredDungeonIndex !== this.dungeonIndex) {
        console.error(`파티 ${partyId}는 던전 ${this.dungeonIndex} 매칭 대상이 아닙니다.`);
        return;
      }

      if (!party || !Array.isArray(party.partyMembers)) {
        throw new Error('유효한 파티 또는 파티 멤버 정보를 찾을 수 없습니다.');
      }

      this.partyQueue.push(party);
      console.log(
        `파티 ${partyId}의 멤버들이 던전 ${this.dungeonIndex} 매칭 대기열에 추가되었습니다.`,
      );
      this.attemptMatch();
    } catch (error) {
      console.error(`파티 ${partyId} 매칭 추가 실패: ${error.message}`);
    }
  }

  // 솔로로 매칭 시도
  addSoloMatchQueue(user) {
    // 솔로 유저가 현재 매칭 인스턴스의 던전과 일치하는지 확인
    if (user.desiredDungeonIndex !== this.dungeonIndex) {
      console.error(`유저 ${user.id}는 던전 ${this.dungeonIndex} 매칭 대상이 아닙니다.`);
      return;
    }
    this.soloQueue.push(user);
    console.log(`유저 ${user.id}가 던전 ${this.dungeonIndex} 솔로 매칭 대기열에 추가되었습니다.`);
    this.attemptMatch();
  }

  // 매칭 로직: 여러 큐를 활용하여 4명 조합 찾기
  attemptMatch() {
    // 현재 던전 대상의 파티와 솔로만 필터링
    const filteredPartyQueue = this.partyQueue.filter(
      (party) => party.desiredDungeonIndex === this.dungeonIndex,
    );
    const filteredSoloQueue = this.soloQueue.filter(
      (user) => user.desiredDungeonIndex === this.dungeonIndex,
    );

    // 1) 단독 파티 매칭: 파티의 멤버 수가 딱 maxDungeonNum(예: 4명)인 경우
    for (let i = 0; i < filteredPartyQueue.length; i++) {
      const party = filteredPartyQueue[i];
      if (party.partyMembers.length === maxDungeonNum) {
        // 해당 파티를 원본 큐에서 제거
        this.partyQueue = this.partyQueue.filter((p) => p.id !== party.id);
        console.log(
          `매칭 완료: 파티 ${party.id} 단독으로 던전 ${this.dungeonIndex} 입장 (멤버 수: ${party.partyMembers.length}).`,
        );
        this.enterDungeon(party.partyMembers);
      }
    }

    // 2) 파티 + 파티 매칭: 두 파티의 합이 maxDungeonNum이 되는 경우
    let updatedFilteredPartyQueue = this.partyQueue.filter(
      (party) => party.desiredDungeonIndex === this.dungeonIndex,
    );
    for (let i = 0; i < updatedFilteredPartyQueue.length; i++) {
      for (let j = i + 1; j < updatedFilteredPartyQueue.length; j++) {
        const party1 = updatedFilteredPartyQueue[i];
        const party2 = updatedFilteredPartyQueue[j];
        if (party1.partyMembers.length + party2.partyMembers.length === maxDungeonNum) {
          // 두 파티 모두 원본 큐에서 제거
          this.partyQueue = this.partyQueue.filter((p) => p.id !== party1.id && p.id !== party2.id);
          console.log(
            `매칭 완료: 파티 ${party1.id}와 파티 ${party2.id} 결합하여 던전 ${
              this.dungeonIndex
            } 입장 (합계: ${party1.partyMembers.length + party2.partyMembers.length}).`,
          );
          const matchedMembers = [...party1.partyMembers, ...party2.partyMembers];
          this.enterDungeon(matchedMembers);
          // 매칭 완료 후 변경된 큐를 다시 확인하기 위해 재귀 호출
          return this.attemptMatch();
        }
      }
    }

    // 3) 파티 + 솔로 매칭: 파티에 부족한 인원을 솔로 큐에서 채울 수 있는 경우
    updatedFilteredPartyQueue = this.partyQueue.filter(
        party => party.desiredDungeonIndex === this.dungeonIndex
      );
      
      for (let i = 0; i < updatedFilteredPartyQueue.length; i++) {
        const party = updatedFilteredPartyQueue[i];
        const needed = maxDungeonNum - party.partyMembers.length;
        if (needed > 0 && filteredSoloQueue.length >= needed) {
          // 미리 필터링된 filteredSoloQueue에서 필요한 만큼 솔로를 선택
          const matchingSolos = filteredSoloQueue.slice(0, needed);
          
          // 원본 솔로 큐에서 해당 솔로들을 제거
          const matchingSoloIds = matchingSolos.map(u => u.id);
          this.soloQueue = this.soloQueue.filter(u => !matchingSoloIds.includes(u.id));
          
          // 해당 파티도 원본 파티 큐에서 제거
          this.partyQueue = this.partyQueue.filter(p => p.id !== party.id);
          
          console.log(
            `매칭 완료: 파티 ${party.id}와 솔로 ${needed}명 결합하여 던전 ${this.dungeonIndex} 입장.`
          );
          const matchedMembers = [...party.partyMembers, ...matchingSolos];
          this.enterDungeon(matchedMembers);
          return this.attemptMatch();
        }
      }
      

    // 4) 솔로 + 솔로 매칭: 솔로 큐에 maxDungeonNum명 이상의 대상이 있으면 매칭
    while (true) {
      const availableSolos = this.soloQueue.filter(
        (user) => user.desiredDungeonIndex === this.dungeonIndex,
      );
      if (availableSolos.length >= maxDungeonNum) {
        const selectedSolos = [];
        const remainingSoloQueue = [];
        // 원본 솔로 큐에서 현재 던전 대상의 솔로 중 첫 maxDungeonNum명을 선택
        for (let user of this.soloQueue) {
          if (
            user.desiredDungeonIndex === this.dungeonIndex &&
            selectedSolos.length < maxDungeonNum
          ) {
            selectedSolos.push(user);
          } else {
            remainingSoloQueue.push(user);
          }
        }
        this.soloQueue = remainingSoloQueue;
        console.log(`매칭 완료: 솔로 ${maxDungeonNum}명 결합하여 던전 ${this.dungeonIndex} 입장.`);
        this.enterDungeon(selectedSolos);
      } else {
        break;
      }
    }
  }

  // 매칭 취소?

  // 던전 입장 함수 (예시)
  enterDungeon(members) {
    // 실제 게임 로직에서는 이곳에서 던전 입장 패킷 전송, 게임 상태 업데이트 등을 수행합니다.
    console.log('던전 입장 처리 중...', members);
  }
}

export default Match;
