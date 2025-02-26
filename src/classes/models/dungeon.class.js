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
        this.playersTransform[playerStatus.playerName] = { x: 1, y: 1, z: 1, rot: 1 };
      });
    }

    // 던전 생성 시 플레이어 클래스 생성
    this.players = {};
    if (partyInfo.Players && Array.isArray(partyInfo.Players)) {
      partyInfo.Players.forEach((member) => {
        this.players[member.playerName] = new Players(member);
      });
    }

    // 던전 내에서 전체 화살 ID를 관리하는 카운터
    this.arrowCounter = 0; // 화살 ID 카운터 초기화

    // 화살 정보를 저장할 객체
    this.arrows = {};

    this.startArrowMovement();
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

  // 화살 생성
  createArrow(playerName, position, direction, speed, maxDistance) {
    const arrowId = this.arrowCounter++; // 화살 ID는 0부터 증가

    const arrow = {
      arrowId,
      position,
      direction,
      speed,
      maxDistance,
      traveledDistance: 0,
    };

    // 플레이어별 화살 목록에 화살 추가
    if (!this.arrows[playerName]) {
      this.arrows[playerName] = []; // 플레이어별 화살 목록이 없으면 생성
    }

    this.arrows[playerName].push(arrow); // 해당 플레이어의 화살 목록에 화살 추가

    return arrowId; // 화살 ID를 반환
  }

  // 화살 이동
  moveArrow(playerName) {
    const arrows = this.arrows[playerName];
    if (!arrows) return;

    for (let i = 0; i < arrows.length; i++) {
      const arrow = arrows[i];

      const adjustedSpeed = arrow.speed * (this.arrowMoveIntervalDuration / 1000);

      // 화살 이동
      arrow.position.x += arrow.direction.x * adjustedSpeed;
      arrow.position.y += arrow.direction.y * adjustedSpeed;
      arrow.position.z += arrow.direction.z * adjustedSpeed;

      arrow.traveledDistance += adjustedSpeed;

      // 화살이 최대 이동 거리보다 멀리 갔으면 소멸
      if (arrow.traveledDistance >= arrow.maxDistance) {
        arrows.splice(i, 1); // 화살 삭제
        console.log(`${playerName}의 화살이 소멸했습니다.`);
        i--; // 인덱스를 하나 감소시켜서 스킵되는 문제 방지
      }
    }
  }

  // 특정 몬스터와 화살의 충돌을 확인하는 함수
  checkArrowCollision(arrow, monsterId) {
    const arrowPos = arrow.position;

    // 해당 monsterId에 대한 몬스터를 가져옴
    const monster = this.monsters[monsterId];
    if (!monster) return false; // 몬스터가 없다면 충돌하지 않음

    const monsterPos = monster.position;

    // 간단한 충돌 감지 (화살의 위치와 몬스터의 위치가 가까운지 확인)
    if (
      Math.abs(arrowPos.x - monsterPos.x) < 1 &&
      Math.abs(arrowPos.y - monsterPos.y) < 1 &&
      Math.abs(arrowPos.z - monsterPos.z) < 1
    ) {
      // 충돌 발생 -> 몬스터에게 피해
      return true; // 충돌이 발생했음을 반환
    }

    return false; // 충돌이 발생하지 않으면 false 반환
  }

  // 화살 제거
  removeArrow(arrowId) {
    Object.keys(this.arrows).forEach((playerName) => {
      const arrows = this.arrows[playerName];
      this.arrows[playerName] = arrows.filter((arrow) => arrow.arrowId !== arrowId);
    });
  }

  // 던전 내 플레이어의 화살 목록 가져오기
  getPlayerArrows(playerName) {
    return this.arrows[playerName] || [];
  }

  // 던전 내 화살 ID로 화살을 찾는 메소드
  getArrowById(arrowId) {
    // 모든 플레이어를 순회하면서 화살을 찾음
    for (const playerName in this.arrows) {
      const arrows = this.arrows[playerName];

      // 화살 배열에서 해당 ID를 가진 화살을 찾음
      const arrow = arrows.find((arrow) => arrow.arrowId === arrowId);
      if (arrow) {
        return arrow; // 찾으면 해당 화살을 반환
      }
    }

    // 화살을 찾지 못한 경우 null 반환
    return null;
  }

  // 화살 이동을 일정 간격으로 처리
  startArrowMovement() {
    this.arrowMoveIntervalDuration = 100; // 100ms 간격

    this.intervalManager.addInterval(() => {
      // 모든 플레이어의 화살 이동
      Object.keys(this.arrows).forEach((playerName) => {
        this.moveArrow(playerName);
      });
    }, this.arrowMoveIntervalDuration);
  }

  // 인터벌을 멈추는 함수
  stopArrowMovement() {
    this.intervalManager.clearAllIntervals(); // 모든 인터벌 종료
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
