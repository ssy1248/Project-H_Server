class User {
  constructor(socket, id, nickname, gameClass) {
    this.socket = socket;
    this.PlayerInfo = {
      playerId: id,
      nickname,
      class: gameClass,
    };
    this.StatInfo = {
      level: 1,
    };
    this.TransformInfo = {};
    this.CostumeInfo = {};
    this.lastUpdateTime = Date.now();
  }

  init() {
    this.StatInfo = {
      ...this.StatInfo,
      maxHp: 100,
      hp: 100,
      maxMp: 100,
      mp: 100,
      atk: 10,
      def: 5,
      magic: 10,
      speed: 3,
    };

    this.TransformInfo = {
      posX: this.getRandomFloat(-9.0, 9.0),
      posY: 1,
      posZ: this.getRandomFloat(-8.0, 8.0),
      rot: this.getRandomFloat(0, 360),
    };
  }

  makeUserInfo() {
    return {
      player: {
        ...this.PlayerInfo,
        statInfo: this.StatInfo,
        transform: this.TransformInfo,
      },
    };
  }

  getRandomFloat(min, max) {
    return Math.random() * (max - min) + min;
  }

  updatePosition(posInfo) {
    this.TransformInfo = posInfo.posInfo;
    this.lastUpdateTime = Date.now();
  }
}

export default User;
