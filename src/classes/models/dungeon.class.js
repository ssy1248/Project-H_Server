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

  message PlayerStatus {
    int32 playerClass = 1;
    int32 playerLevel = 2;
    string playerName = 3;
    float playerFullHp = 4;
    float playerFullMp = 5;
    float playerCurHp = 6;
    float playerCurMp = 7;
  }
*/

class Dungeon {
  constructor(id, partyInfo) {
    // 던전 고유 아이디
    this.id = id;
    // 파티 정보
    this.partyInfo = partyInfo;
    // 인터벌 매니저
    this.intervalManager = new IntervalManager();
    // 던전 상태 (matching, progress, end)
    this.isState = 'matching';
    // 몬스터 종류
    this.monsterId = [];
    // 플레이어 상태 정보
    this.playerStatus = {};
    // 플레이어들의 위치 정보 관리 객체
    this.playersTransform = {};

    // 초기 위치 설정
    if (partyInfo.Players && partyInfo.Players.length > 0) {
      partyInfo.Players.forEach((playerStatus) => {
        // playerStatus.playerName 또는 playerStatus에 다른 고유 식별자가 있다면 사용
        this.playersTransform[playerStatus.playerName] = { x: 1, y: 0.1, z: 1, rot: 1 };
      });
    }

    // 던전 생성 시 플레이어 클래스 생성
    this.players = {};
    if (partyInfo.Players && Array.isArray(partyInfo.Players)) {
      partyInfo.Players.forEach((member) => {
        this.players[member.playerName] = new Players(member);
      });
    }

    // 화살 정보를 저장할 객체
    this.arrows = {};

    // 아처인 경우 화살 생성
    if (partyInfo.Players && partyInfo.Players.length > 0) {
      partyInfo.Players.forEach((playerStatus) => {
        if (playerStatus.playerClass === 'Archer') {
          this.createArrow(playerStatus.playerName); // 아처인 경우 화살 생성
        }
      });
    }
  }

  // 던전 내 플레이어 위치 업데이트 함수
  updatePlayerPosition(playerName, posX, posY, posZ, rot) {
    if (this.playersTransform[playerName]) {
      this.playersTransform[playerName] = { x: posX, y: posY, z: posZ, rot: rot };
    } else {
      this.playersTransform[playerName] = { x: posX, y: posY, z: posZ, rot: rot };
    }
  }

  // 던전 내 플레이어 위치 가져오기
  getPlayerPosition(playerName) {
    return this.playersTransform[playerName] || null;
  }

  // 현재 던전에 있는 모든 플레이어의 위치를 반환하는 함수
  getAllPlayerPositions() {
    return this.playersTransform;
  }

  // 파티 정보 세팅
  setPartyInfo(party) {
    this.partyInfo = party;
  }

  // 파티 정보 가져오기
  getPartyInfo() {
    return this.partyInfo;
  }

  // 던전에 속한 파티 찾기
  getParty() {
    const partyId = this.partyInfo.partyId;
    return searchPartySession(partyId);
  }

  // 던전 상태 가져오기
  getDungeonState() {
    return this.isState;
  }

  // 던전 상태 변경
  setDungeonState(state) {
    this.isState = state;
  }

  // 플레이어 상태 가져오기
  getPlayerStatus(nickname) {
    const playerStat = this.playerStatus[nickname];
    if (!playerStat) {
      console.log(`${nickname} 닉네임을 가진 플레이어를 찾을 수 없습니다.`);
      return null;
    } else {
      return playerStat;
    }
  }

  // 플레이어 상태 설정
  setPlayerStatus(nickname) {
    const user = getUserByNickname(nickname);
    if (user) {
      const playerStat = user.playerStatInfo;
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
    console.log(this.playerStatus);
  }

  // 화살 객체 생성
  createArrow(playerName, initialPosition, direction, speed, maxDistance) {
    // 해당 플레이어의 화살 배열이 없으면 초기화
    if (!this.arrows[playerName]) {
      this.arrows[playerName] = []; // 플레이어 별로 여러 화살을 관리하기 위해 배열로 설정
    }

    // 화살 초기 설정 (파라미터로 받은 값들로 설정)
    const arrow = {
      playerName,
      position: initialPosition, // 외부에서 받은 초기 위치
      direction: direction, // 외부에서 받은 방향 벡터
      speed: speed, // 외부에서 받은 속도, 기본값 1
      maxDistance: maxDistance, // 외부에서 받은 최대 거리, 기본값 100
      traveledDistance: 0, // 초기 이동한 거리
    };

    // 해당 플레이어의 화살 배열에 추가
    this.arrows[playerName].push(arrow);
  }

  // 화살 이동 함수
  moveArrow(playerName) {
    const arrows = this.arrows[playerName];
    if (!arrows) return; // 해당 플레이어가 화살을 가지고 있지 않으면 종료

    arrows.forEach((arrow, index) => {
      // 화살 이동 처리
      arrow.position.x += arrow.direction.x * arrow.speed;
      arrow.position.y += arrow.direction.y * arrow.speed;
      arrow.position.z += arrow.direction.z * arrow.speed;

      arrow.traveledDistance += arrow.speed;

      // 화살이 최대 이동 거리보다 멀리 갔으면 소멸
      if (arrow.traveledDistance >= arrow.maxDistance) {
        arrows.splice(index, 1); // 화살 삭제
        console.log(`${playerName}의 화살이 소멸했습니다.`);
      }
    });
  }

  // 던전 내 플레이어의 화살 목록 가져오기
  getPlayerArrows(playerName) {
    return this.arrows[playerName] || [];
  }

  // 던전 내 모든 화살 목록 가져오기
  getAllArrows() {
    return this.arrows;
  }

  // 던전 내 플레이어 상태 업데이트와 함께 화살 생성 관리
  updatePlayerStatus(playerName, newStatus) {
    // 상태 업데이트와 함께 화살 생성 처리
    if (newStatus.playerClass === 'Archer' && !this.arrows[playerName]) {
      this.createArrow(playerName); // 아처인 경우 화살을 생성
    }

    // 플레이어 상태 업데이트 로직
    this.playersTransform[playerName] = newStatus;
  }
}

export default Dungeon;
