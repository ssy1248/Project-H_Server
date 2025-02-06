import IntervalManager from '../managers/interval.manager.js';
import {
  createLocationPacket,
  createSpawnPacket,
} from '../../utils/notification/game.notification.js';

class Dungeon {
  constructor(id, index) {
    // 이게 던전 고유 아이디 (이건 던전의 고유값 대부분이 값을 통해서 어떤 던전에 접근할것지 파악)
    this.id = id;
    // 어떤 던전의 종류을 알수있는 인게스(이건 던전에 어떤 던전인지 아는 즉 0번이면 초원던전 1버이면 동굴던전)
    this.index = index;
    // 던전에 들어간 유저들
    this.users = [];
    // 혹시 쓸수도 있는 인터벌 매니더
    this.intervalManager = new IntervalManager();
    // 앞으로 추가할것들은 나올수 있는 몬스터 종류,
  }

  //던전에 user 추가
  addUser(userId) {
    this.users.push(userId);
  }

  //던전의 특정 유저를 찾는것
  getUser(userId) {
    return this.users.find((user) => user.id === userId);
  }

  //던전에 특정 유저 제거하는것
  removeUser(userId) {
    const index = this.users.findIndex((user) => user.id === userId);
    if (index !== -1) {
      this.users.splice(index, 1)[0]; // 제거된 사용자 반환
    }
  }
}

export default Dungeon;
