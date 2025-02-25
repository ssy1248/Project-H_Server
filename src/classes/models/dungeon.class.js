import { searchPartySession } from '../../session/party.session.js';
import { getUserByNickname } from '../../session/user.session.js';
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

  msage PlayerStatus {
    int32 playerClass = 1;
    int32 playerLevel = 2;
    string playerName = 3;
    float playerFullHp = 4;
    float playerFullMp = 5;
    float playerCurHp = 6;
    float playerCurMp = 7;
  }
  es
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
    // 플레이스텟 인포를 넣는 배열로
    this.playerStatus = {};

    // 플레이어들의 위치 정보를 관리할 객체
    this.playersTransform = {};

    // 파티 정보에 있는 각 플레이어에 대해 초기 위치를 세팅 (초기값: {x:0, y:0, z:0, rot:0})
    if (partyInfo.Players && partyInfo.Players.length > 0) {
      partyInfo.Players.forEach((playerStatus) => {
        // playerStatus.playerName 또는 playerStatus에 다른 고유 식별자가 있다면 사용
        this.playersTransform[playerStatus.playerName] = { x: 0, y: 0, z: 0, rot: 0 };
      });
    }

    // 던전 클래스가 생성될떄 플레이어 클래스를 생성
    if (partyInfo.Players && Array.isArray(partyInfo.Players)) {
      this.players = partyInfo.Players.map((member) => new Players(member));
    } else {
      this.players = [];
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

  getPlayerStatus(nickname) {
    // nickname을 키로 사용하여 playerStatInfo를 가져옵니다.
    const playerStat = this.playerStatus[nickname];

    // 만약 playerStat이 존재하지 않으면 (존재하지 않는 닉네임인 경우)
    if (!playerStat) {
      // 없을 경우 기본값이나 오류 처리 반환
      console.log(`${nickname} 닉네임을 가진 플레이어를 찾을 수 없습니다.`);
      return null; // 혹은 {} 빈 객체를 반환할 수도 있습니다.
    } else {
      return playerStat;
    }
  }

  setPlayerStatus(nickname) {
    const user = getUserByNickname(nickname);

    //이게 들어오면 객체 하나 생성
    if (user) {
      const playerStat = user.playerStatInfo;
      //추가 할수 있는 방법으로
      this.playerStatus[nickname] = {
        hp: playerStat.hp,
        maxHp: playerStat.maxHp,
        mp: playerStat.mp,
        maxMp: playerStat.maxMp,
        atk: playerStat.atk,
        def: playerStat.def,
        speed: playerStat.speed,
      };
    }
  }

  // 플레이어의 HP 값 가져오기
  getPlayerHp(nickname) {
    const playerStat = this.getPlayerStatus(nickname);
    return playerStat ? playerStat.hp : null;
  }

  // 플레이어의 HP 값 설정하기
  setPlayerHp(nickname, newHp) {
    this.updatePlayerStat(nickname, 'hp', newHp);
  }

  // 플레이어의 최대 HP 값 가져오기
  getPlayerMaxHp(nickname) {
    const playerStat = this.getPlayerStatus(nickname);
    return playerStat ? playerStat.maxHp : null;
  }

  // 플레이어의 최대 HP 값 설정하기
  setPlayerMaxHp(nickname) {
    this.updatePlayerStat(nickname, 'maxHp', newHp);
  }

  // 플레이어의 MP 값 가져오기
  getPlayerMp(nickname) {
    const playerStat = this.getPlayerStatus(nickname);
    return playerStat ? playerStat.mp : null;
  }

  // 플레이어의 MP 값 설정하기
  setPlayerMp(nickname, newMp) {
    this.updatePlayerStat(nickname, 'mp', newMp);
  }

  // 플레이어의 최대 MP 값 가져오기
  getPlayerMaxMp(nickname) {
    const playerStat = this.getPlayerStatus(nickname);
    return playerStat ? playerStat.maxMp : null;
  }

  // 플레이어의 최대 MP 값 설정하기
  setPlayerMaxMp(nickname) {
    this.updatePlayerStat(nickname, 'maxMp', newHp);
  }

  // 플레이어의 공격력 가져오기
  getPlayerAtk(nickname) {
    const playerStat = this.getPlayerStatus(nickname);
    return playerStat ? playerStat.atk : null;
  }

  // 플레이어의 방어력 가져오기
  getPlayerDef(nickname) {
    const playerStat = this.getPlayerStatus(nickname);
    return playerStat ? playerStat.def : null;
  }

  // 플레이어의 스피드 가져오기
  getPlayerSpeed(nickname) {
    const playerStat = this.getPlayerStatus(nickname);
    return playerStat ? playerStat.speed : null;
  }

  // 플레이어의 공격력 설정하기
  setPlayerAtk(nickname, newAtk) {
    this.updatePlayerStat(nickname, 'atk', newAtk);
  }

  // 플레이어의 방어력 설정하기
  setPlayerDef(nickname, newDef) {
    this.updatePlayerStat(nickname, 'def', newDef);
  }

  // 플레이어의 스피드 설정하기
  setPlayerSpeed(nickname, newSpeed) {
    this.updatePlayerStat(nickname, 'speed', newSpeed);
  }

  // 내부적으로 플레이어 상태를 업데이트하는 메서드
  updatePlayerStat(nickname, statKey, newValue) {
    const playerStat = this.getPlayerStatus(nickname);
    if (playerStat) {
      playerStat[statKey] = newValue;
    }
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
