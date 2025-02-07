export default class User {
  // 생성자.
  constructor(socket, userId, nickname ) {
    // 유저 정보.
    this.userInfo = {
      socket : socket,
      userId : userId,
      nickname : nickname,
      // 정보 추가.
    }

    // 플레이어 정보.
    this.playerInfo = {
      playerClass : "", 
      gold : 0,
      level : 0,
      exp : 0,
      isMove: false,
      isSpawn: false,
      // 정보 추가
    }

    // 플레이어 스텟 정보.
    this.playerStatInfo = {
      hp: 0,
      maxHp: 0,
      mp: 0,
      maxMp: 0,
      atk: 0,
      def: 0,
      speed: 0,
    }
  
    // 플레이어 좌표 정보.
    this.transformInfo = {
      posX : 0,
      posY : 0,
      posZ : 0,
      rot : 0, 
    }

    this.inventory = new Inventory();
  }

  // 초기화 
  init(playerClass, playerInfo, statInfo ) {
    // 플레이어 클래스가 정해지지 않았으면 플레이어 클래스 지정.
    if(this.playerInfo.playerClass === "") {
      this.playerInfo.playerClass = playerClass;
    } else {
      return console.log("이미 초기화 했습니다.");
    }

    // 플레이어 정보, 스텟 초기화.
    this.setPlayerInfo(playerInfo);
    this.setPlayerStatInfo(statInfo);

    // 플레이어 생성 좌표 랜덤으로 부여 
    // X 좌표 → 기본값 : -9 ~ 9
    // Y 좌표 → 기본값 : 1
    // Z 좌표 → 기본값 : -8 ~ 8
    // 회전 각도 → 기본값 : 0 ~ 360

    this.transformInfo = {
      posX : this.generateRandomPlayerTransformInfo(-9, 9),
      posY : 1,
      posZ : this.generateRandomPlayerTransformInfo(-8, 8),
      rot : this.generateRandomPlayerTransformInfo(0, 360), 
    }

    this.inventory.init(/* charId */);
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

  getPlayerInfo(){
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
      playerClass : playerInfo.playerClass, 
      gold : playerInfo.gold,
      level : playerInfo.level,
      exp : playerInfo.exp,
      isMove: false,
    }
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
    }
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
  
  // 추가 함수 작성... 

}

