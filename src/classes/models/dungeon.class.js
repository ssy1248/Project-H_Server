import IntervalManager from '../managers/interval.manager.js';
import {
  createLocationPacket,
  createSpawnPacket,
} from '../../utils/notification/game.notification.js';

class Dungeon {
  constructor(id) {
    this.id = id;
    this.users = [];
    this.intervalManager = new IntervalManager();
  }

  addUser(newUser) {
    this.users.push(newUser);

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

  getUser(socket) {
    return this.users.find((user) => user.socket === socket);
  }

  removeUser(socket) {
    const index = this.users.findIndex((user) => user.socket === socket);
    if (index !== -1) {
      return this.users.splice(index, 1)[0];
    }
  }

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

export default Game;
