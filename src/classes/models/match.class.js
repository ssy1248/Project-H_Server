import { MAX_PARTY_MEMBER } from '../../constants/constants.js';
import { searchPartySession } from '../../session/party.session.js';
import { addDungeonSession } from '../../session/dungeon.session.js';
import { v4 as uuidv4 } from 'uuid';

const maxDungeonNum = MAX_PARTY_MEMBER; // 던전의 최대 파티원 수

// 매칭 관련 다룰 클래스
class Match {
  constructor() {
    // 파티와 솔로 매치 큐를 초기화
    this.partyQueue = []; // 파티 매칭 대기열
  }

  // 솔로가 던전 입장 누르면 무조건 파티 생성 후 입장이 가능합니다. 팝업띄어서 유저가 직접 파티 생성하게 -> 파티 세션 집어넣고 진행

  // 두개의 파티가 합쳐질 때, 합쳐진 파티의 새로운 파티장 설정 로직 -> 두개의 파티에서 파티장들의 레벨 비교 -> 레벨 높은 사람이 파티장
  // 튕긴 파티원 처리 로직 -> 재접속/포기 UI 처리 로직

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

      // 매칭 시도 후 던전 세션을 반환 (매칭 성공 시)
      return this.attemptMatch();
    } catch (error) {
      console.error(`파티 ${partyId} 매칭 추가 실패: ${error.message}`);
    }
  }

  // 매칭 로직: 여러 큐를 활용하여 4명 조합 찾기
  attemptMatch() {
    // reduce를 이용해서 각 던전 인덱스를 키를 한 배열들을 만들고
    const groups = this.partyQueue.reduce((acc, party) => {
      const dungeonIndex = party.desiredDungeonIndex;
      if (!acc[dungeonIndex]) {
        acc[dungeonIndex] = [];
      }
      acc[dungeonIndex].push(party);
      return acc;
    }, {});

    /**
     리턴값
      {
        2: [ { id: 1, desiredDungeonIndex: 2, ... }, { id: 3, desiredDungeonIndex: 2, ... } ],
        3: [ { id: 2, desiredDungeonIndex: 3, ... } ]
      }
     */

    // 각 그룹별로 매칭을 시도
    for (const dungeonIndex in groups) {
      const group = groups[dungeonIndex];

      // 1) 단독 파티 매칭: 그룹 내에서 멤버 수가 최대 인원(maxDungeonNum)인 파티가 있으면 바로 처리
      for (let i = 0; i < group.length; i++) {
        const party = group[i];
        if (party.partyMembers.length === MAX_PARTY_MEMBER) {
          // 해당 파티를 원본 큐에서 제거
          this.partyQueue = this.partyQueue.filter((p) => p.id !== party.id);
          console.log(
            `매칭 완료: 파티 ${party.id} 던전 ${party.desiredDungeonIndex} 입장 (멤버 수: ${party.partyMembers.length}).`,
          );
          // 던전 입장 처리 후 dungeon 세션 반환
          return this.enterDungeon(party);
        }
      }

      // 2) 파티+파티 매칭: 그룹 내에서 2개의 파티의 합이 MAX_PARTY_MEMBER인 경우
      for (let i = 0; i < group.length; i++) {
        for (let j = i + 1; j < group.length; j++) {
          const party1 = group[i];
          const party2 = group[j];
          if (party1.partyMembers.length + party2.partyMembers.length === MAX_PARTY_MEMBER) {
            // 두 파티를 매칭 대기열에서 제거
            this.partyQueue = this.partyQueue.filter(
              (p) => p.id !== party1.id && p.id !== party2.id,
            );
            console.log(
              `매칭 완료: 파티 ${party1.id}와 파티 ${
                party2.id
              } 결합하여 던전 ${dungeonIndex} 입장 (합계: ${
                party1.partyMembers.length + party2.partyMembers.length
              }).`,
            );
            // 두 파티 중 레벨이 높은 리더를 기준으로 결합하거나 원하는 로직으로 처리
            const party1LeaderLevel = party1.partyLeader.playerInfo.level;
            const party2LeaderLevel = party2.partyLeader.playerInfo.level;
            if (party1LeaderLevel >= party2LeaderLevel) {
              party2.PartyBreakUp(); // party2 해체
              party1.addPartyMember(...party2.partyMembers); // party2 멤버를 party1에 추가
              return this.enterDungeon(party1);
            } else {
              party1.PartyBreakUp();
              party2.addPartyMember(...party1.partyMembers);
              return this.enterDungeon(party2);
            }
          }
        }
      }
    }
    // 무한재귀를 막기 위한 setTimeout 사용
    // 매칭 조건이 아직 충족되지 않으면, 일정 시간 후 재시도
    setTimeout(() => {
      this.attemptMatch();
    }, 1000); // 1초 후에 재시도

    // 아직 매칭이 완료되지 않았음을 나타내기 위해 null을 반환
    return null;

    // 매칭 취소
    //cancelMatch();
  }

  //cancelMatch
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

export default Match;
