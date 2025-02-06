import IntervalManager from '../managers/interval.manager.js';
import {
  createLocationPacket,
  createSpawnPacket,
} from '../../utils/notification/game.notification.js';

class Dungeon {
  constructor(id) {
    // 이게 던전 고유 아이디
    this.id = id;
    // 던전에 들어간 유저들
    this.users = [];
    // 혹시 쓸수도 있는 인터벌 매니더
    this.intervalManager = new IntervalManager();
  }

  //던전에 user 추가
  addUser(newUser) {
    //받아온 User를 this.users에 넣고
    this.users.push(newUser);

    //
    const users = this.users.map((user) => {
      return { ...user.makeUserInfo().player };
    });

    for (let user of this.users) {
      const usersWithoutMe = users.filter((u) => {
        return u.playerId !== user.PlayerInfo.playerId;
      });

      user.socket.write(createSpawnPacket(usersWithoutMe));
    }
  }

  //던전의 특정 유저를 찾는것
  getUser(socket) {
    return this.users.find((user) => user.socket === socket);
  }

  //던전에 특정 유저 제거하는것
  removeUser(socket) {
    const index = this.users.findIndex((user) => user.socket === socket);
    if (index !== -1) {
      return this.users.splice(index, 1)[0];
    }
  }

  //던전에서 특정유저 어디 있는지 알리기
  broadcastLocation(socket) {
    const user = this.getUser(socket);

    const posInfo = {
      playerId: user.PlayerInfo.playerId,
      posInfo: user.TransformInfo,
    };

    for (let user of this.users) {
      user.socket.write(createLocationPacket(posInfo));
    }
  }

  broadcast(data) {
    for (let user of this.users) {
      user.socket.write(data);
    }
  }
}

export default Dungeon;
