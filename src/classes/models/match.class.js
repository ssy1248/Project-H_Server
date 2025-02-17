import { MAX_PARTY_MEMBER } from '../../constants/constants.js';
import { createPartySession, searchPartySession } from '../../session/party.session.js';
import { addDungeonSession } from '../../session/dungeon.session.js';
import Party from './party.class.js';
import { v4 as uuidv4 } from 'uuid';

const maxDungeonNum = MAX_PARTY_MEMBER; // 던전의 최대 파티원 수를 상수로 지정

// 매칭 관련 다룰 클래스
class Match {
  constructor(dungeonIndex) {
    // 파티와 솔로 매치 큐를 초기화
    this.partyQueue = []; // 파티 매칭 대기열
    this.soloQueue = []; // 솔로 매칭 대기열

    // // 던전 인덱스를 설정 왠지 모르게 에러가 나서 이걸 매칭 시도시에 쓰도록 변경
    // setDesiredDungeonIndex(dungeonIndex);
    this.dungeonIndex = dungeonIndex; // 던전 인덱스를 설정
  }

  // 두개의 파티가 합쳐질 때, 합쳐진 파티의 새로운 파티장 설정 로직
  // 튕긴 파티원 처리 로직
  // 재접속/포기 UI 처리 로직

  // 파티로 매칭 시도
  addPartyMatchQueue(partyId) {
    try {
      const party = searchPartySession(partyId); // 파티 세션 검색

      // 파티가 원하는 던전과 현재 던전이 일치하는지 확인
      // if (party.desiredDungeonIndex !== this.dungeonIndex) {
      //   console.error(`파티 ${partyId}는 던전 ${this.dungeonIndex} 매칭 대상이 아닙니다.`);
      //   return;
      // }

      // 파티 정보가 유효한지 확인
      if (!party || !Array.isArray(party.partyMembers)) {
        throw new Error('유효한 파티 또는 파티 멤버 정보를 찾을 수 없습니다.');
      }

      // 파티를 매칭 대기열에 추가
      party.setDesiredDungeonIndex(dungeonIndex);

      this.partyQueue.push(party);
      console.log(
        `파티 ${partyId}의 멤버들이 던전 ${this.dungeonIndex} 매칭 대기열에 추가되었습니다.`,
      );
      this.attemptMatch(); // 매칭 시도
    } catch (error) {
      console.error(`파티 ${partyId} 매칭 추가 실패: ${error.message}`);
    }
  }

  // 솔로로 매칭 시도
  addSoloMatchQueue(user) {
    // 솔로 유저가 원하는 던전과 현재 던전이 일치하는지 확인
    if (user.desiredDungeonIndex !== this.dungeonIndex) {
      console.error(`유저 ${user.id}는 던전 ${this.dungeonIndex} 매칭 대상이 아닙니다.`);
      return;
    }
    this.soloQueue.push(user); // 유저를 솔로 대기열에 추가
    console.log(`유저 ${user.id}가 던전 ${this.dungeonIndex} 솔로 매칭 대기열에 추가되었습니다.`);
    this.attemptMatch(); // 매칭 시도
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

    // 1) 단독 파티 매칭: 파티의 멤버 수가 maxDungeonNum(예: 4명)인 경우
    for (let i = 0; i < filteredPartyQueue.length; i++) {
      const party = filteredPartyQueue[i];
      if (party.partyMembers.length === maxDungeonNum) {
        // 해당 파티를 원본 큐에서 제거
        this.partyQueue = this.partyQueue.filter((p) => p.id !== party.id);
        console.log(
          `매칭 완료: 파티 ${party.id} 단독으로 던전 ${this.dungeonIndex} 입장 (멤버 수: ${party.partyMembers.length}).`,
        );
        this.enterDungeon(party.partyMembers, this.dungeonIndex); // 던전 입장 처리
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
          } else if (party1LeaderLevel < party2LeaderLevel) {
            // 파티1 삭제
            party1.PartyBreakUp();
            // 파티2에 파티1인원 추가
            party2.addPartyMember(...party1.partyMembers);
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
          this.enterDungeon(matchedMembers, this.dungeonIndex);
          // 매칭 완료 후 변경된 큐를 다시 확인하기 위해 재귀 호출
          return this.attemptMatch();
        }
      }
    }

    // 3) 파티 + 솔로 매칭: 파티에 부족한 인원을 솔로 큐에서 채울 수 있는 경우
    updatedFilteredPartyQueue = this.partyQueue.filter(
      (party) => party.desiredDungeonIndex === this.dungeonIndex,
    );

    for (let i = 0; i < updatedFilteredPartyQueue.length; i++) {
      const party = updatedFilteredPartyQueue[i];
      const needed = maxDungeonNum - party.partyMembers.length;
      if (needed > 0 && filteredSoloQueue.length >= needed) {
        console.log('파티+솔로 매칭중');
        // 미리 필터링된 filteredSoloQueue에서 필요한 만큼 솔로를 선택
        const matchingSolos = filteredSoloQueue.slice(0, needed);

        // 원본 솔로 큐에서 해당 솔로들을 제거
        const matchingSoloIds = matchingSolos.map((u) => u.id);
        this.soloQueue = this.soloQueue.filter((u) => !matchingSoloIds.includes(u.id));

        // 해당 파티도 원본 파티 큐에서 제거
        this.partyQueue = this.partyQueue.filter((p) => p.id !== party.id);

        console.log('party', party);
        console.log('matchingSolos', matchingSolos);

        // 파티에 솔로 매칭 인원 추가
        party.addPartyMember(...matchingSolos);
        console.log('party', party, '파티 생성후');

        console.log(
          `매칭 완료: 파티 ${party.id}와 솔로 ${needed}명 결합하여 던전 ${this.dungeonIndex} 입장.`,
        );
        const matchedMembers = [...party.partyMembers, ...matchingSolos];
        this.enterDungeon(matchedMembers, this.dungeonIndex);
        return this.attemptMatch();
      }
    }

    // 4) 솔로 + 솔로 매칭: 솔로 큐에 maxDungeonNum명 이상의 대상이 있으면 매칭
    while (true) {
      // 던전 인덱스에 맞는 솔로 유저들만 필터링
      const availableSolos = this.soloQueue.filter(
        (user) => user.desiredDungeonIndex === this.dungeonIndex,
      );

      // availableSolos에 maxDungeonNum 명 이상의 솔로가 있으면 매칭을 시도
      if (availableSolos.length >= maxDungeonNum) {
        const selectedSolos = []; // 선택된 4명(파티)을 저장할 배열
        const remainingSoloQueue = []; // 매칭에 사용되지 않은 나머지 솔로 유저들 저장할 배열

        // 원본 솔로 큐에서 던전 대상인 유저들 중에서 maxDungeonNum 명을 선택
        for (let user of this.soloQueue) {
          if (
            user.desiredDungeonIndex === this.dungeonIndex && // 원하는 던전 인덱스와 일치하는지 확인
            selectedSolos.length < maxDungeonNum // 아직 4명이 되지 않았다면
          ) {
            selectedSolos.push(user); // 유효한 솔로 유저를 선택
          } else {
            remainingSoloQueue.push(user); // 선택되지 않은 유저는 나중에 다시 사용되도록 남겨둠
          }
        }

        this.soloQueue = remainingSoloQueue; // 매칭에 사용되지 않은 유저들을 다시 대기열에 저장

        // 파티장 설정: 레벨이 가장 높은 사람을 파티장으로 설정
        selectedSolos.sort((a, b) => b.playerInfo.level - a.playerInfo.level); // 레벨 내림차순 정렬 (가장 높은 레벨이 앞에 오게)

        // 첫 번째 유저를 파티장으로 지정 (레벨이 가장 높은 사람)
        const partyLeader = selectedSolos[0];
        selectedSolos.shift(); // 파티장으로 설정한 사람은 나머지 파티원들과 구분되므로 제외

        // 파티 이름은 uuid로 고유하게 생성
        const partyName = `Party_${uuidv4()}`; // 파티 이름 생성 (UUID 사용) **임시적으로 uuid씀
        const userId = partyLeader.id; // 파티장은 레벨이 가장 높은 사람으로 설정
        const partyId = uuidv4();

        // 새로운 파티 세션을 생성. 파티 이름과 파티장 정보로 세션을 생성
        const party = createPartySession(partyId, partyName, userId);
        party.addPartyMember(...selectedSolos);

        console.log(`매칭 완료: 솔로 ${maxDungeonNum}명 결합하여 던전 ${this.dungeonIndex} 입장.`);

        // 매칭된 유저들로 던전에 입장
        this.enterDungeon(selectedSolos, this.dungeonIndex);
      } else {
        // availableSolos에 4명 이상의 유저가 없으면, 더 이상 매칭을 시도하지 않고 종료
        break;
      }
    }
  }

  // 매칭 취소? (아직 구현되지 않음)
  cancelMatch(user) {}

  // 던전 입장 함수: 매칭된 멤버들이 던전에 입장하도록 처리
  enterDungeon(members, dungeonIndex) {
    // 던전 고유 번호 생성
    const dungeonId = uuidv4();
    // 던전 세션 추가
    const dungeonSession = addDungeonSession(dungeonId, dungeonIndex);

    // 실제 게임 로직에서는 던전 입장 패킷 전송, 게임 상태 업데이트 등을 수행
    console.log('던전 입장 처리 중...', members);
    return dungeonSession; // 생성된 던전 세션 반환
  }
}

export default Match; // Match 클래스 내보내기
