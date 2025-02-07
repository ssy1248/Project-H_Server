export default class Inventory{
    constructor(){
        this.inventory = []; // 소지중인 아이템 인벤토리
        this.equipment = []; // 장비중인 아이템 인벤토리
    }

    // 아이템 장비하기
    equip(item){
        this.equipment.add(item);
    }

    // 아이템 해제하기
    unequip(item){
        this.equipment.remove(item);
    }

    // 인벤토리에 아이템 추가
    add(item){
        this.inventory.add(item);
    }

    // 인벤토리에서 아이템 제거
    drop(item){
        this.inventory.remove(item);
    }
}