// 아직은 데이터 컨테이너
// 어떤 기능을 넣어야 할까?

import { addItemSession } from '../../session/item.session.js';

// consume?
class Item {
  constructor() {
    this.name = ''; // string
    this.itemType = 0; // int
    this.stat = 0; // float
    this.price = 0; // int
    this.rarity = 0; // int
    this.equiped = false; // bool
    this.stackable = false; // bool
  }
  initItem(data) {
    this.name = data.name; // string
    this.itemType = data.itemType; // int
    this.stat = data.stat; // float
    this.price = data.price; // int
    this.rarity = data.rarity; // int

    addItemSession(data);
  }
  // 소모성 아이템일 경우 아이템 사용 효과
  consume() {}
}

export default Item;
