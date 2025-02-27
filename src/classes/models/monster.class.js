import { v4 as uuidv4 } from 'uuid';

export default class Monster {
  constructor(id, name, hp, atk, def, speed, position) {
    this.id = uuidv4();
    this.typeId = id;
    this.name = name;
    this.hp = hp;
    this.atk = atk;
    this.def = def;
    this.speed = speed;
    this.position = position || { x: 0, y: 0, z: 0 };
    this.isAlive = true; // 몬스터 생존 여부
  }

  // 공격 메서드
  attackTarget(target) {
    if (!this.isAlive) return;
    if (!target.isAlive) {
      console.log(`${target.name}은(는) 이미 쓰러진 상태입니다.`);
      return;
    }

    // 피해량 계산 (방어력이 높으면 0)
    const damage = Math.max(0, this.atk - target.def);

    if (damage === 0) {
      console.log(`${this.name}의 공격! 하지만 ${target.name}이(가) 피해를 받지 않음!`);
      return;
    }
    target.hp = Math.max(0, target.hp - damage);
    console.log(`${this.name}이(가) ${target.name}에게 ${damage}의 피해를 입힘!`);

    if (target.hp <= 0) {
      target.die();
      console.log(`${target.name}이(가) 쓰러짐!`);
    }
  }
  // 몬스터 사망 처리
  die() {
    if (!this.isAlive) return;
    this.isAlive = false;
    console.log(`${this.name}이(가) 사망했습니다.`);
  }
}
