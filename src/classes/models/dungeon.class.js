import IntervalManager from '../managers/interval.manager.js';

class Dungeon {
  constructor(id, partyInfo) {
    // 이게 던전 고유 아이디 (이건 던전의 고유값 대부분이 값을 통해서 어떤 던전에 접근할것지 파악)
    this.id = id;
    // 어떤 던전의 종류을 알수있는 인게스(이건 던전에 어떤 던전인지 아는 즉 0번이면 초원던전 1번이면 동굴던전)
    // 파티 인포를 받아서 그 안에 dungeonIndex를 사용
    this.partyInfo = partyInfo;
    // 던전에 들어간 유저들 유저고유의 아이디만 넣을거다.
    this.users = [];
    // 혹시 쓸수도 있는 인터벌 매니더
    this.intervalManager = new IntervalManager();
    // 던전 상태  시작을 matching,  진행중(이떄는 던전에 참가가 안된다)progress  끝(end일떄 세션 삭제)end
    this.isState = 'matching';
    // 몬스터 종류

    // 앞으로 추가할것들은 나올수 있는 몬스터 종류
  }

  //던전에 user 추가
  addUser(userId) {
    this.users.push(userId);
  }

  //던전의 특정 유저를 찾는것
  getUser(userId) {
    return this.users.find((user) => user.id === userId) || null; // 유저가 없으면 null 반환
  }

  //유저에서 소켓으로 찾는것
  getUserBySocket(socket) {
    return this.users.find((user) => user.socket === socket) || null;
  }

  //던전 상태 찾기
  getDungeonState() {
    return this.isState;
  }

  //던전 상태 번경
  setDungeonState(state) {
    this.isState = state;
  }

  //던전 유저수 세기
  getUserCount() {
    return this.users.length;
  }

  //던전에 특정 유저 제거하는것
  removeUser(userId) {
    const index = this.users.findIndex((user) => user.id === userId);
    if (index !== -1) {
      return this.users.splice(index, 1)[0]; // 제거된 유저 객체 반환
    }
    return null; // 유저가 없으면 null 반환
  }
}

export default Dungeon;
