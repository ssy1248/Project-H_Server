import { getInventoryFromCharId } from '../../db/inventory/inventory.db.js';

export default class Inventory {
    constructor() {
        this.inventory = []; // 소지중인 아이템 인벤토리
        this.equipment = []; // 장비중인 아이템 인벤토리
    }

    async init(charId) {
        this.inventory = await getInventoryFromCharId(charId);
        for (var item of this.inventory.filter((e) => { return e.equiped === true; })) {
            this.equip(item);
        }
    }

    // 아이템 장비하기
    equip(item) {
        this.equipment.push(item);
    }

    // 아이템 해제하기
    unequip(item) {
        const index = this.equipment.indexOf(item);
        if (index > -1) {
            this.equipment.splice(index, 1);
        }
    }

    // 인벤토리에 아이템 추가
    add(item) {
        this.inventory.push(item);
    }

    // 인벤토리에서 아이템 제거
    drop(item) {
        const index = this.inventory.indexOf(item);
        if (index > -1) {
            this.inventory.splice(index, 1);
        }
    }
}