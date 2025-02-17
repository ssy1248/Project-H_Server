import { MAX_PARTY_MEMBER } from '../../constants/constants.js';
import { createPartySession, searchPartySession } from '../../session/party.session.js';
import { addDungeonSession } from '../../session/dungeon.session.js';
import { v4 as uuidv4 } from 'uuid';

const maxDungeonNum = MAX_PARTY_MEMBER; // 던전의 최대 파티원 수를 상수로 지정

// 매칭 관련 다룰 클래스
class Match {
  constructor() {
    // 파티와 솔로 매치 큐를 초기화
    this.partyQueue = []; // 파티 매칭 대기열
  }

  // 솔로가 던전 입장 누르면 무조건 파티 생성 후 입장이 가능합니다. 팝업띄어서 유저가 직접 파티 생성하게 -> 파티 세션 집어넣고 진행

  // 두개의 파티가 합쳐질 때, 합쳐진 파티의 새로운 파티장 설정 로직
  // 튕긴 파티원 처리 로직
  // 재접속/포기 UI 처리 로직

  // 파티로 매칭 시도
  addPartyMatchQueue(partyId) {
    try {
      const party = searchPartySession(partyId); // 파티 세션 검색

      // 파티 정보가 유효한지 확인
      if (!party || !Array.isArray(party.partyMembers)) {
        throw new Error('유효한 파티 또는 파티 멤버 정보를 찾을 수 없습니다.');
      }

      // 던전 인덱스가 정상적인 값인지?
      // 임시 예외 처리
      if (party.desiredDungeonIndex !== typeof Number) {
        console.log('숫자형이 아님');
        return;
      }

      // 파티를 매칭 대기열에 추가
      this.partyQueue.push(party);

      console.log(
        `파티 ${partyId}의 멤버들이 던전 ${party.desiredDungeonIndex} 매칭 대기열에 추가되었습니다.`,
      );
      this.attemptMatch(); // 매칭 시도
    } catch (error) {
      console.error(`파티 ${partyId} 매칭 추가 실패: ${error.message}`);
    }
  }

  // 매칭 로직: 여러 큐를 활용하여 4명 조합 찾기
  attemptMatch() {
    // 던전 필터링 변경
    const filteredPartyQueue = this.partyQueue.filter(
      (party) => party.desiredDungeonIndex === this.dungeonIndex,
    );

    // 1) 단독 파티 매칭: 파티의 멤버 수가 maxDungeonNum(예: 4명)인 경우
    for (let i = 0; i < filteredPartyQueue.length; i++) {
      const party = filteredPartyQueue[i];
      if (party.partyMembers.length === maxDungeonNum) {
        // 해당 파티를 원본 큐에서 제거
        this.partyQueue = this.partyQueue.filter((p) => p.id !== party.id);
        console.log(
          `매칭 완료: 파티 ${party.id} 던전 ${party.desiredDungeonIndex} 입장 (멤버 수: ${party.partyMembers.length}).`,
        );
        // enterDungeon 수정
        const dungeonInfo = this.enterDungeon(party); // 던전 입장 처리
      }
    }

    // 2) 파티 + 파티 매칭: 두 파티의 합이 maxDungeonNum이 되는 경우
    let updatedFilteredPartyQueue = this.partyQueue.filter(
      (party) => party.desiredDungeonIndex === this.dungeonIndex,
    );
    for (let i = 0; i < updatedFilteredPartyQueue.length; i++) {
      for (let j = i + 1; j < updatedFilteredPartyQueue.length; j++) {
        console.log('파티+파티 매칭중');
        const party1 = updatedFilteredPartyQueue[i];
        const party2 = updatedFilteredPartyQueue[j];
        if (party1.partyMembers.length + party2.partyMembers.length === maxDungeonNum) {
          // 두 파티를 매칭 대기열에서 제거
          this.partyQueue = this.partyQueue.filter((p) => p.id !== party1.id && p.id !== party2.id);
          console.log(
            `매칭 완료: 파티 ${party1.id}와 파티 ${party2.id} 결합하여 던전 ${
              this.dungeonIndex
            } 입장 (합계: ${party1.partyMembers.length + party2.partyMembers.length}).`,
          );
          console.log('party1', 'party2', party1, party2);
          const matchedMembers = [...party1.partyMembers, ...party2.partyMembers];
          console.log(
            'party1members',
            'party2members',
            ...party1.partyMembers,
            ...party2.partyMembers,
          );

          // 파티 1,2이 레벨 비교하기 위해서 파티장의 레벨을 가져온다.
          const party1LeaderLevel = party1.partyLeader.playerInfo.level;
          const party2LeaderLevel = party2.partyLeader.playerInfo.level;
          console.log(
            'party1LedaerLevel',
            'party2LeaderLevel',
            party1LeaderLevel,
            party2LeaderLevel,
          );

          // 파티 1의 리더 레벨이 높거나 같으면 (일단 레벨이 같으면 먼저 큐에 들어간 사람을 파티장으로)
          if (party1LeaderLevel >= party2LeaderLevel) {
            // 파티2 삭제
            party2.PartyBreakUp();
            // 파티1에 파티2인원 추가
            party1.addPartyMember(...party2.partyMembers);
            const dungeonInfo = this.enterDungeon(party1);
          } else if (party1LeaderLevel < party2LeaderLevel) {
            // 파티1 삭제
            party1.PartyBreakUp();
            // 파티2에 파티1인원 추가
            party2.addPartyMember(...party1.partyMembers);
            const dungeonInfo = this.enterDungeon(party2);
          }
          console.log('party1', 'party2', party1, party2, '파티 분리후');

          //파티장 결합 문제 두명에서 파티장중에서 누가 될것인가 레벨과 같으면 랜덤으로?
          //보니까 여기서 파티장을 비교해서 레벨이 높은쪽이 파티장이 되고 아니면 랜덤으로 하자
          //파티장이 어떤 형태로 들어가는지 알아야겠다. 이부분은 일당 제끼고
          //그러면 파티장 레벨이 낮은쪽이 파티 헤제를
          //파티장이 이렇게 들어온다.

          /* partyLeader: 
          User {
          userInfo: [Object],
          playerInfo: [Object],
          playerStatInfo: [Object],
          transformInfo: [Object],
          inventory: [Inventory]
          },*/
          // userInfo안에 platerStatInfo에 레벨이 있군

          // 파티 결합 후 던전 입장

          // 매칭 완료 후 변경된 큐를 다시 확인하기 위해 재귀 호출
          return this.attemptMatch();
        }
      }
    }
  }

  // 매칭 취소? (아직 구현되지 않음)
  cancelMatch(user) {}

  // 던전 입장 함수: 매칭된 멤버들이 던전에 입장하도록 처리
  enterDungeon(party) {
    // 던전 고유 번호 생성
    const dungeonId = uuidv4();
    // 던전 세션 추가
    const dungeonSession = addDungeonSession(dungeonId, party.desiredDungeonIndex);

    // 실제 게임 로직에서는 던전 입장 패킷 전송, 게임 상태 업데이트 등을 수행
    console.log('던전 입장 처리 중...', party.partyMembers);
    return dungeonSession; // 생성된 던전 세션 반환
  }
}

export default Match; // Match 클래스 내보내기
