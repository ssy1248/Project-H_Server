import { PACKET_TYPE } from '../../constants/header.js';
import MovementSync from '../../movementSync/movementSync.class.js';
import { addMovementSync, deleteMovementSync, findMovementSync, findUser } from '../../movementSync/movementSync.manager.js';
import { removeDungeonSession } from '../../session/dungeon.session.js';
import { searchPartySession } from '../../session/party.session.js';
import { getUserByNickname } from '../../session/user.session.js';
import { createResponse } from '../../utils/response/createResponse.js';
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
  constructor(id, partyInfo, users) {
    // 던전 고유 아이디
    this.id = id;
    /*
    partyInfo: {
      dungeonIndex,
      maximum ,
      partyId,
      partyLeaderId,
      partyName,
      Players = 
      [
        {
          playerName,
          playerLevel,
          playerClass,
          playerFullHp,
          playerCurHp,
          playerFullMp,
          playerCurMp,
        }
      ]
    },
    */
    // 파티 정보
    this.partyInfo = partyInfo; // => 파티 정보에 user 인스턴스를 추가해서 직접 참조하자
    // 인터벌 매니저
    this.intervalManager = new IntervalManager();
    // 던전 상태 (matching, progress, end)
    this.isState = 'matching';
    // 몬스터 class를 집어 넣자
    this.monsterId = [];
    // 플레이어 상태 정보
    this.playerStatus = {}; // => 플레이어 스탯을 복사해오는데, 그러지 말고 user 인스턴스를 직접 참조하자
    // 플레이어들의 위치 정보 관리 객체
    this.playersTransform = {}; // => user 인스턴스를 직접 참조하고, 인스턴스에 있는 transformInfo를 참조하자

    // => user 인스턴스를 직접 참조하고, 인스턴스에 있는 transformInfo를 참조하자
    // 초기 위치 설정
    if (partyInfo.Players && partyInfo.Players.length > 0) {
      let count = 0;
      partyInfo.Players.forEach((playerStatus) => {
        // playerStatus.playerName 또는 playerStatus에 다른 고유 식별자가 있다면 사용
        this.playersTransform[playerStatus.playerName] = { x: count * 2, y: 0.2, z: 2, rot: 0 };
        count++;
      });
    }

    // => Players 클래스의 주석을 참조해주세요
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

    this.startArrowMovement();
    this.testCount = 0;

    // 주기적 위치 업데이트 인터벌 ID (중복 실행 방지를 위해)
    this._positionUpdateIntervalId = null;

    // 유저 배열
    this.users = users;
    this.alives = users.length;
    Object.defineProperty(this, "Alives",
      {
        get: () => this.alives,
        set: (value) => {
          this.alives = value;
          if (this.alives <= 0) {
            // 파티 전멸
            // 던전 종료
            this.endDungeonFailed();
            // 
          }
        }
      });

    this.movementSync = new MovementSync(this.id, 'dungeon1');
    addMovementSync(this.id, this.movementSync);
  }

  checkAuctionTest() {
    if (this.testCount < 1) {
      this.testCount++;
      return;
    }
    new RewardAuction([5, 6], this.partyInfo);
  }

  // 던전 내 플레이어 위치 업데이트 함수 -> 던전에서 이동을 할떄 사용을 해줘야 할듯
  // => 던전에서 movementSync를 생성하고 사용하자
  updatePlayerPosition(playerName, posX, posY, posZ, rot) {
    this.playersTransform[playerName] = { x: posX, y: posY, z: posZ, rot: rot };
  }

  // 던전 내 플레이어 위치 가져오기
  // => 던전에서 movementSync를 생성하고 사용하자
  getPlayerPosition(playerName) {
    return this.playersTransform[playerName] || null;
  }

  // 주기적으로 던전 내 모든 플레이어의 위치를 업데이트하는 메서드
  // => 던전에서 movementSync를 생성하고 사용하자
  startPeriodicPositionUpdates(updateInterval = 10000) {
    // 이미 인터벌이 설정되어 있다면 재설정하지 않음
    if (this._positionUpdateIntervalId) {
      return;
    }

    this._positionUpdateIntervalId = setInterval(() => {
      // playersTransform은 플레이어 이름을 key로 갖는 객체입니다.
      Object.keys(this.playersTransform).forEach((playerName) => {
        const user = getUserByNickname(playerName);
        const userTransform = findUser('dungeon1', user.userInfo.userId);
        if (user && userTransform && userTransform.currentTransform) {
          this.playersTransform[playerName] = {
            x: userTransform.currentTransform.posX,
            y: userTransform.currentTransform.posY,
            z: userTransform.currentTransform.posZ,
            rot: userTransform.currentTransform.rot,
          };
          // console.log(
          //   `플레이어 [${playerName}] 위치 갱신 완료:`,
          //   this.playersTransform[playerName],
          // );
        } else {
          //console.warn(`플레이어 [${playerName}]의 정보를 찾을 수 없습니다.`);
        }
      });
    }, updateInterval);
  }

  // 주기적 업데이트를 중지하는 메서드
  stopPeriodicPositionUpdates() {
    if (this._positionUpdateIntervalId) {
      clearInterval(this._positionUpdateIntervalId);
      this._positionUpdateIntervalId = null;
    }
  }

  // 던전 성공 처리
  endDungeonSuccess() {

  }

  // 던전 실패 처리
  endDungeonFailed() {
    // 던전 실패 패킷
    const packet = {
      success: false,
    }

    const leaveDungeonPacket = createResponse(
      'dungeon',
      'S_LeaveDungeon',
      PACKET_TYPE.S_LEAVEDUNGEON,
      packet,
    );

    // 던전 실패 메시지 전송
    this.broadCastAll(leaveDungeonPacket);

    // 모든 유저의 인벤토리 소실
    this.users.forEach(async (user) => await user.inventory.lost());

    // 던전에 사용되는 movementSync 정지
    // 즉시 정지해도 되는건가?
    deleteMovementSync(this.id);
    this.movementSync = null;

    // 던전 제거
  }

  deleteDungeon() {
    removeDungeonSession(this.id);
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

      //console.log(`${playerName}의 화살 상태: `, arrows);

      // 화살이 최대 이동 거리보다 멀리 갔으면 소멸
      if (arrow.traveledDistance >= arrow.maxDistance) {
        arrows.splice(i, 1); // 화살 삭제
        //console.log(`${playerName}의 화살이 소멸했습니다.`);
        i--; // 인덱스를 하나 감소시켜서 스킵되는 문제 방지
      }
    }
  }

  // 특정 몬스터와 화살의 충돌을 확인하는 함수
  checkArrowCollision(arrow, monsterTrans) {
    const arrowPos = arrow.position;
    console.log('충돌 화살 좌표 : ', arrowPos);

    // 두 점 사이의 거리 계산 (유클리드 거리)
    const distance = Math.sqrt(
      Math.pow(arrowPos.x - monsterTrans.posX, 2) +
      Math.pow(arrowPos.y - monsterTrans.posY, 2) +
      Math.pow(arrowPos.z - monsterTrans.posZ, 2),
    );

    // 일정 거리 이하일 경우 충돌로 간주
    const collisionThreshold = 5; // 이 값을 적절히 설정 (예: 1)
    if (distance < collisionThreshold) {
      return true; // 충돌 발생
    }

    console.log('distance 거라가 너무 멈', distance);
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
    this.testArrowMovement();
  }

  // 인터벌을 멈추는 함수
  stopArrowMovement() {
    this.intervalManager.clearAllIntervals(); // 모든 인터벌 종료
  }

  // 던전 내 모든 화살 목록 가져오기
  getAllArrows() {
    return this.arrows;
  }

  // 임시로 화살을 생성하고 이동을 테스트하는 메서드
  testArrowMovement(
    playerName = 'test',
    position = { x: 0, y: 0, z: 0 },
    direction = { x: 1, y: 0, z: 0 },
    speed = 10,
    maxDistance = 100,
  ) {
    // 화살을 생성
    const arrowId = this.createArrow(playerName, position, direction, speed, maxDistance);

    console.log(`${playerName}의 화살이 생성되었습니다. ID: ${arrowId}`);
  }

  broadCastAll(packet) {
    for (const user of users) {
      user.userInfo.socket.write(packet);
    }
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
