export default class Monster {
  constructor(id, name, hp, atk, def, speed, position) {
    this.id = id;
    this.name = name;
    this.hp = hp;
    this.atk = atk;
    this.def = def;
    this.speed = speed;
    this.position = position || { x: 0, y: 0, z: 0 };
    this.isAlive = true; // 몬스터 생존 여부
  }

  attackTarget(target) {
    if (!this.isAlive) return;

    const damage = Math.max(0, this.atk - target.def);
    target.hp -= damage;

    console.log(`${this.name}이(가) ${target.name}에게 ${damage}의 피해를 입힘!`);

    if (target.hp <= 0) {
      target.hp = 0;
      target.isAlive = false;
      console.log(`${target.name}이(가) 쓰러짐!`);
    }
  }
  // 몬스터 사망 처리
  die() {
    this.isAlive = false;
    console.log(`${this.name}이(가) 사망했습니다.`);
  }
}
