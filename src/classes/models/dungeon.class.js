import { searchPartySession } from '../../session/party.session.js';
import { getUserByNickname } from '../../session/user.session.js';
import ArrowPool from '../managers/arrowPool,manager.js';
import IntervalManager from '../managers/interval.manager.js';
import Players from './player.class.js';
import RewardAuction from './rewardAuction.class.js';

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
      let count = 0;
      partyInfo.Players.forEach((playerStatus) => {
        // playerStatus.playerName 또는 playerStatus에 다른 고유 식별자가 있다면 사용
        this.playersTransform[playerStatus.playerName] = { x: count * 2, y: 0.2, z: 0, rot: 0 };
        count++;
      });
    }

    // 던전 생성 시 플레이어 클래스 생성
    this.players = {};
    if (partyInfo.Players && Array.isArray(partyInfo.Players)) {
      partyInfo.Players.forEach((member) => {
        this.players[member.playerName] = new Players(member);
      });
    }

    // ArrowPool 인스턴스 생성
    this.arrowPool = new ArrowPool();

    // 화살 정보를 저장할 객체
    this.arrows = {};

    //this.startArrowMovement();
    this.testCount = 0;
  }

  checkAuctionTest() {
    if (this.testCount < 1) {
      this.testCount++;
      return;
    }
    new RewardAuction([5, 6], this.partyInfo);
  }
  // 던전 내 플레이어 위치 업데이트 함수 -> 던전에서 이동을 할떄 사용을 해줘야 할듯
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
    const arrow = this.arrowPool.getArrow(); // 풀에서 화살을 가져옴
    if (!arrow) {
      console.log('풀에 사용할 수 있는 화살이 없습니다.');
      return null; // 풀에 화살이 없다면 null 반환
    }

    arrow.position = position;
    arrow.direction = direction;
    arrow.speed = speed;
    arrow.maxDistance = maxDistance;
    arrow.traveledDistance = 0;

    // 플레이어별 화살 목록에 화살 추가
    if (!this.arrows[playerName]) {
      this.arrows[playerName] = [];
    }

    this.arrows[playerName].push(arrow); // 해당 플레이어의 화살 목록에 화살 추가

    return arrow.arrowId; // 화살의 ID를 반환
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
  checkArrowCollision(arrow, monster) {
    const arrowPos = arrow.position;

    if (!monster) {
      return false; // 몬스터가 없다면 충돌하지 않음
    }

    const monsterPos = monster.position;

    // 두 점 사이의 거리 계산 (유클리드 거리)
    const distance = Math.sqrt(
      Math.pow(arrowPos.x - monsterPos.x, 2) +
        Math.pow(arrowPos.y - monsterPos.y, 2) +
        Math.pow(arrowPos.z - monsterPos.z, 2),
    );

    // 일정 거리 이하일 경우 충돌로 간주
    const collisionThreshold = 1; // 이 값을 적절히 설정 (예: 1)
    if (distance < collisionThreshold) {
      return true; // 충돌 발생
    }

    return false; // 충돌하지 않음
  }

  // 화살 제거 메서드
  removeArrow(arrowId) {
    let arrowRemoved = false; // 화살이 삭제됐는지 여부를 추적

    // 모든 플레이어를 순회하면서 화살을 찾음
    for (const playerName in this.arrows) {
      const arrows = this.arrows[playerName];

      // 화살 배열에서 해당 ID를 가진 화살을 찾음
      const arrowIndex = arrows.findIndex((arrow) => arrow.arrowId === arrowId);

      if (arrowIndex !== -1) {
        // 화살이 발견되면 배열에서 제거
        const removedArrow = arrows.splice(arrowIndex, 1)[0];

        // 풀로 반환
        this.arrowPool.returnArrow(removedArrow); // 풀에 화살을 반환
        console.log(`${playerName}의 화살 (ID: ${arrowId})가 소멸되었습니다.`);
        arrowRemoved = true; // 화살 삭제 처리됨
        break; // 한 번만 찾으면 되므로 루프 종료
      }
    }

    if (!arrowRemoved) {
      console.log(`ID ${arrowId}를 가진 화살을 찾을 수 없습니다.`);
    }
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
      for (let playerName in this.arrows) {
        if (this.arrows.hasOwnProperty(playerName)) {
          // 객체 자체의 속성만 처리
          this.moveArrow(playerName);
        }
      }
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
  broadcastOther(name, packet) {
    for (let player of partyInfo.Players) {
      if (player.playerName !== name) {
        getUserByNickname(player.playerName).userInfo.socket.write(packet);
      }
    }
  }
}

export default Dungeon;
