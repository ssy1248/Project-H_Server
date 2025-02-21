import { searchPartySession } from '../../session/party.session.js';
import IntervalManager from '../managers/interval.manager.js';

class Dungeon {
  constructor(id, partyInfo) {
    // 이게 던전 고유 아이디 (이건 던전의 고유값 대부분이 값을 통해서 어떤 던전에 접근할것지 파악)
    this.id = id;
    // 파티 인포를 받아서 그 안에 dungeonIndex를 사용
    this.partyInfo = partyInfo;
    // 혹시 쓸수도 있는 인터벌 매니더
    this.intervalManager = new IntervalManager();
    // 던전 상태  시작을 matching,  진행중(이떄는 던전에 참가가 안된다)progress  끝(end일떄 세션 삭제)end
    this.isState = 'matching';
    // 몬스터 종류
    this.monsterId = [];
    // 앞으로 추가할것들은 나올수 있는 몬스터 종류
  }

  //getUser와 getUserBySocket을 partyInfo에서 찾을수 있게 해야된다.
  //파티 인포 넣기
  setPartyInfo(party) {
    this.partyInfo = party;
  }

  //파티 인포 가져오기
  getPartyInfo() {
    return this.partyInfo;
  }

  //던전에 속해있는 파티 찾기
  getparty() {
    const partyId = this.partyInfo.partyId;
    const party = searchPartySession(partyId);
    return party;
  }

  //던전 상태 찾기
  getDungeonState() {
    return this.isState;
  }

  //던전 상태 번경
  setDungeonState(state) {
    this.isState = state;
  }

  //나오는 몬스터 아이디 설정
  setMonsterId(id) {
    this.monsterId.push(id);
  }

  // 나오는 몬스터아이디
  getMonsterId() {
    return this.monsterId;
  }
}

export default Dungeon;
