import User from '../classes/user.class.js';
import Monster from '../classes/monster.class.js';
import { v4 as uuidv4 } from 'uuid';


export default class EntityManager {
  constructor() {
    this.users = {};
    this.monsters = {};
  }

  addUser(movementId, socket, id, transform) {
    // const transform = {
    //   posX: this.generateRandomPlayerTransformInfo(-9, 9),
    //   posY: 1,
    //   posZ: this.generateRandomPlayerTransformInfo(-8, 8) + 130,
    //   rot: this.generateRandomPlayerTransformInfo(0, 360),
    // };

    this.users[id] = new User(movementId, socket, id, transform);
  }

  deleteUser(id) {
    if (!this.users) return;
    console.log("삭제 ID : ", id);
    console.log("삭제 전 유저들 : ", this.users);
    delete this.users[id];
    console.log("삭제 후 유저들 : ", this.users);
  }

  getUsers() {
    return this.users;
  }

  getUsersArray() {
    return Object.values(this.users);
  }

  getUser(id) {
    if(Object.values(this.users).length !== 0 ){
      return this.users[id];
    }
    return false;
  }

  addMonster(movementId) {
    // movementId -> town일때만 
    // movementId -> dungeon1이면 다른 생성 지점을 가져야 할듯
    let transform = {};
    console.log('Add Monster : ', movementId);
    if(movementId === 'town') {
      transform = {
        posX: this.generateRandomPlayerTransformInfo(-9, 9),
        posY: 1,
        posZ: this.generateRandomPlayerTransformInfo(-8, 8) + 130,
        rot: this.generateRandomPlayerTransformInfo(0, 360),
      };
    } else {
      transform = {
        posX: 2,
        posY: 1,
        posZ: 25,
        rot: this.generateRandomPlayerTransformInfo(0, 360),
      }
    }
    
    const monsterId = uuidv4();
    const randomNum = Math.floor(Math.random() * 30) + 1;

    this.monsters[monsterId] = new Monster(movementId,monsterId, transform, 3, 'test', 10);
  }

  deleteMonster(id) {
    if (!this.monsters) return;
    delete this.monsters[id];
  }

  getMonsters() {
    return this.monsters;
  }

  getMonstersArray() {
    return Object.values(this.monsters);
  }

  getMonster(id) {
    return this.monsters[id];
  }

  // 랜덤 좌표 및 회전 각도 생성 함수
  generateRandomPlayerTransformInfo(min, max) {
    // min ~ max 사이의 랜덤 값
    const randomValue = Math.floor(Math.random() * (max - min + 1)) + min;
    return randomValue;
  }
}
