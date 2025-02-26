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
    this.id = id;
    this.partyInfo = partyInfo;
    this.intervalManager = new IntervalManager();
    this.isState = 'matching'; // 던전 상태 (matching, progress, end)
    this.monsterId = [];
    this.playerStatus = {};
    this.playersTransform = {};

    // 초기 위치 설정
    if (partyInfo.Players && partyInfo.Players.length > 0) {
      partyInfo.Players.forEach((playerStatus) => {
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

    this.arrows = {}; // 화살 정보를 저장할 객체
    this.startArrowMovement();
  }

  // 던전 내 플레이어 위치 업데이트 함수
  updatePlayerPosition(playerName, posX, posY, posZ, rot) {
    this.playersTransform[playerName] = { x: posX, y: posY, z: posZ, rot: rot };
  }

  // 던전 내 플레이어 위치 가져오기
  getPlayerPosition(playerName) {
    return this.playersTransform[playerName] || null;
  }

  // 파티 정보 세팅
  setPartyInfo(party) {
    this.partyInfo = party;
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
    if (state === 'end') {
      this.stopArrowMovement(); // 던전 종료 시 화살 이동 중지
    }
  }

  // 플레이어 상태 가져오기
  getPlayerStatus(nickname) {
    const playerStat = this.playerStatus[nickname];
    if (!playerStat) {
      // 에러 처리: 플레이어를 찾을 수 없을 때
      throw new Error(`플레이어 "${nickname}"을(를) 찾을 수 없습니다.`);
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
  }

  // 화살 객체 생성
  createArrow(
    playerName,
    initialPosition = { x: 0, y: 0, z: 0 },
    direction = { x: 1, y: 0, z: 0 },
    speed = 1,
    maxDistance = 100,
  ) {
    if (!this.arrows[playerName]) {
      this.arrows[playerName] = [];
    }

    const arrow = {
      playerName,
      position: initialPosition,
      direction,
      speed,
      maxDistance,
      traveledDistance: 0,
    };

    this.arrows[playerName].push(arrow);
  }

  // 화살 이동 함수
  moveArrow(playerName) {
    const arrows = this.arrows[playerName];
    if (!arrows) return;

    // 화살 이동 처리
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

  // 일정 간격으로 화살을 이동시키는 함수
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
}
