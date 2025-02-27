import { searchPartySession } from '../../session/party.session.js';
import IntervalManager from '../managers/interval.manager.js';
import Players from './player.class.js';

/**
  message PartyInfo{
    string partyId = 1 ;
    string partyName = 2; // 파티 이름
    int32 partyLeaderId = 3; // 리더 아이디
    int32 maximum = 4;
    int32 dungeonIndex = 5; // 들어갈 던전 인덱스
    repeated PlayerStatus Players = 6;
  }

  message PlayerStatus {
    int32 playerClass = 1;
    int32 playerLevel = 2;
    string playerName = 3;
    float playerFullHp = 4;
    float playerFullMp = 5;
    float playerCurHp = 6;
    float playerCurMp = 7;
  }
  
  생성자에 파티 멤버 아이디를 담는 배열을 생성을 해서 생성자가 시작될떄 foreach를 사용해서 배열에 아이디를 저장?

 */
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

    // 플레이어들의 위치 정보를 관리할 객체
    this.playersTransform = {};

    // 파티 정보에 있는 각 플레이어에 대해 초기 위치를 세팅 (초기값: {x:0, y:0, z:0, rot:0})
    if (partyInfo.Players && partyInfo.Players.length > 0) {
      let count = 0;
      partyInfo.Players.forEach((playerStatus) => {
        // playerStatus.playerName 또는 playerStatus에 다른 고유 식별자가 있다면 사용
        this.playersTransform[playerStatus.playerName] = { x: count * 2, y: 0.2, z: 0, rot: 0 };
        count++;
      });
    }

    // 던전 클래스가 생성될떄 플레이어 클래스를 생성
    if (partyInfo.Players && Array.isArray(partyInfo.Players)) {
      this.players = {};
      partyInfo.Players.forEach((member) => {
        // member.playerName을 키로 사용해서 Players 인스턴스를 저장합니다.
        this.players[member.playerName] = new Players(member);
      });
    } else {
      this.players = {};
    }
  }

  // 던전 내 플레이어 위치 업데이트 함수
  updatePlayerPosition(playerName, posX, posY, posZ, rot) {
    if (this.playersTransform[playerName]) {
      this.playersTransform[playerName] = { x: posX, y: posY, z: posZ, rot: rot };
    } else {
      // 플레이어가 아직 등록되지 않았다면 새로 추가
      this.playersTransform[playerName] = { x: posX, y: posY, z: posZ, rot: rot };
    }
  }

  // 던전 내 플레이어 위치 가져오기 함수
  getPlayerPosition(playerName) {
    return this.playersTransform[playerName] || null;
  }

  // 현재 던전에 있는 모든 플레이어의 위치를 반환하는 함수
  getAllPlayerPositions() {
    return this.playersTransform;
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
