import { addItemToInventory, disrobeItem, equipItem, getInventoryFromCharId, removeItemFromInventory } from '../../db/inventory/inventory.db.js';
import { findItemById } from '../../db/inventory/item.db.js';

export default class Inventory {
    constructor() {
        this.inventory = []; // 소지중인 아이템 인벤토리
        this.equipment = []; // 장비중인 아이템 인벤토리
    }

    async init(charId) {
        this.charId = charId;
        this.inventory = await getInventoryFromCharId(charId);
        if (!this.inventory) {
            console.log('inventory is empty');
            return;
        }
    }

    // 아이템 장비하기
    async equip(inventoryId) {
        try {
            // DB 업데이트
            await equipItem(this.charId, inventoryId);
            // 서버 업데이트
            var item = this.inventory.find((item) => item.id = inventoryId);
            item.equiped = true;
            return this.inventory;
        } catch (error) {
            console.error(error);
        }
    }

    // 아이템 해제하기
    async disrobe(inventoryId) {
        try {
            // DB 업데이트
            await disrobeItem(this.charId, inventoryId);
            // 서버 업데이트
            var item = this.inventory.find((item) => item.id === inventoryId);
            item.equiped = false;
            return this.inventory;
        } catch (error) {
            console.error(error);
        }
    }

    // 인벤토리에 아이템 추가
    async add(itemId, rarity) {
        try {
            // DB 업데이트
            const result = await addItemToInventory(this.charId, itemId, rarity, false);
            // 아이템 정보 조회
            const item = await findItemById(itemId);
            const newItem = {
                id: result.insertId,
                itemType: item.itemType,
                name: item.name,
                price: item.price,
                stat: item.stat,
                rarity: rarity,
                equiped: false,
            }
            // 서버 업데이트
            this.inventory.push(newItem);
            return this.inventory;
        } catch (error) {
            console.error(error);
        }
    }

    // 인벤토리에서 아이템 제거
    async drop(inventoryId) {
        try {
            // DB 업데이트
            await removeItemFromInventory(this.charId, inventoryId);
            // 서버 업데이트
            const index = this.inventory.findIndex((item) => item.id === inventoryId);
            if (index > -1) {
                this.inventory.splice(index, 1);
                return this.inventory;
            } else {
                throw new Error('item not found');
            }
        } catch (error) {
            console.error(error);
        }
    }

    getInventory() {
        return this.inventory;
    }
}