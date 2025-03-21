import { getDungeonSession } from '../../session/dungeon.session.js';
import Inventory from './inventory.class.js';

export default class User {
  // 생성자.
  constructor(socket, userId, nickname) {
    // 유저 정보.
    this.userInfo = {
      socket: socket,
      userId: userId,
      nickname: nickname,
      // 정보 추가.
    };

    // 플레이어 정보.
    this.playerInfo = {
      playerClass: 0,
      gold: 0,
      level: 0,
      exp: 0,
      isMove: false,
      isSpawn: false,
      charId: 0, // TODO : 캐릭터 선택시 캐릭터 ID 저장
      // 정보 추가
    };

    // 플레이어 스텟 정보.
    this.playerStatInfo = {
      hp: 0,
      maxHp: 0,
      mp: 0,
      maxMp: 0,
      atk: 0,
      def: 0,
      speed: 0,
    };

    // 플레이어 좌표 정보.
    this.transformInfo = {
      posX: 0,
      posY: 0,
      posZ: 0,
      rot: 0,
    };
    this.agent = null;
    this.inDungeonId = '';
    this.isAlive = true;
    this.inventory = new Inventory();
  }

  // 초기화
  init(playerInfo, statInfo) {
    // 플레이어 정보, 스텟 초기화.
    this.setPlayerInfo(playerInfo);
    this.setPlayerStatInfo(statInfo);

    // 플레이어 생성 좌표 랜덤으로 부여
    // X 좌표 → 기본값 : -9 ~ 9
    // Y 좌표 → 기본값 : 1
    // Z 좌표 → 기본값 : -8 ~ 8
    // 회전 각도 → 기본값 : 0 ~ 360

    this.setTransform();
    this.transformInfo = {
      posX: this.generateRandomPlayerTransformInfo(-9, 9),
      posY: 1,
      // 130 고정은 나중에 생성관련에서 맵이 여러가지가 되면 보내주는 곳에서 맵인덱스를 보내서 그 맵인덱스에 맞게 더해주거나 아님 클라를 손보든 수정
      posZ: this.generateRandomPlayerTransformInfo(-8, 8) + 130,
      rot: this.generateRandomPlayerTransformInfo(0, 360),
    };

    this.inventory.init(this);
  }
  setTransform() {
    this.transformInfo = {
      posX: this.generateRandomPlayerTransformInfo(-9, 9),
      posY: 1,
      // 130 고정은 나중에 생성관련에서 맵이 여러가지가 되면 보내주는 곳에서 맵인덱스를 보내서 그 맵인덱스에 맞게 더해주거나 아님 클라를 손보든 수정
      posZ: this.generateRandomPlayerTransformInfo(-8, 8) + 130,
      rot: this.generateRandomPlayerTransformInfo(0, 360),
    };
  }
  // 랜덤 좌표 및 회전 각도 생성 함수
  generateRandomPlayerTransformInfo(min, max) {
    // min ~ max 사이의 랜덤 값
    const randomValue = Math.floor(Math.random() * (max - min + 1)) + min;
    return randomValue;
  }

  // Get
  getUserInfo() {
    return this.userInfo;
  }

  getPlayerInfo() {
    return this.playerInfo;
  }

  getPlayerStatInfo() {
    return this.playerStatInfo;
  }

  getTransformInfo() {
    return this.transformInfo;
  }

  // Set
  setIsMove(isMove) {
    this.playerInfo.isMove = isMove;
  }

  setIsSpawn(isSpawn) {
    this.playerInfo.isSpawn = isSpawn;
  }

  setPlayerInfo(playerInfo) {
    this.playerInfo = {
      playerClass: playerInfo.playerClass,
      gold: playerInfo.gold,
      level: playerInfo.level,
      exp: playerInfo.exp,
      isMove: false,
      charId: playerInfo.charId,
    };
  }

  // 수정 해야함.
  setPlayerStatInfo(statInfo) {
    this.playerStatInfo = {
      hp: statInfo.hp,
      maxHp: statInfo.hp,
      mp: statInfo.mp,
      maxMp: statInfo.mp,
      atk: statInfo.atk,
      def: statInfo.def,
      speed: statInfo.speed,
    };
  }

  setLevel(level) {
    this.playerInfo.level = level;
  }

  setHp(hp) {
    this.playerStatInfo.hp = hp;
  }

  setMaxHp(maxHp) {
    this.playerStatInfo.maxHp = maxHp;
  }

  setMp(mp) {
    this.playerStatInfo.mp = mp;
  }

  setMaxMp(maxMp) {
    this.playerStatInfo.maxMp = maxMp;
  }

  setAtk(atk) {
    this.playerStatInfo.atk = atk;
  }

  setDef(def) {
    this.playerStatInfo.def = def;
  }

  setMagic(magic) {
    this.playerStatInfo.magic = magic;
  }

  setSpeed(speed) {
    this.playerStatInfo.speed = speed;
  }

  setTransformInfo(transform) {
    this.transformInfo.posX = transform.posX;
    this.transformInfo.posY = transform.posY;
    this.transformInfo.posZ = transform.posZ;
    this.transformInfo.rot = transform.rot;
  }

  getAtk(){
    return this.playerStatInfo.atk;
  }

  getDef(){
    return this.playerStatInfo.def;
  }

  getSpeed(){
    return this.playerStatInfo.speed;
  }

  getDamage(damage) {
    // TODO : broadcast로 데미지 정보 전달
    this.playerStatInfo.hp -= damage;
    if (this.playerStatInfo.hp <= 0) {
      this.playerStatInfo.hp = 0;
      this.die();
    }
  }

  die() {
    // 사망 처리
    this.isAlive = false;
    this.agent.isAlive = false;
    // 참여한 던전 찾기
    const dungeon = getDungeonSession(this.inDungeonId);
    // 던전에 플레이어 사망 상태 반영하기
    // 던전은 파티가 전멸 상태인지 아닌지 확인해야함
    // 파티가 전멸 상태라면 던전 종료
    dungeon.Alives--;
  }
  // 추가 함수 작성...
}
