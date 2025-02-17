import { addItemToInventory, disrobeItem, equipItem, getInventoryFromCharId, removeItemFromInventory, updateItemQuantity } from '../../db/inventory/inventory.db.js';
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
            var item = this.inventory.find((item) => item.id === inventoryId);
            if (!item) throw new Error('item not found');
            // DB 업데이트
            await equipItem(this.charId, inventoryId);
            // 서버 업데이트
            item.equiped = true;
        } catch (error) {
            console.error(error);
        }
    }

    // 아이템 해제하기
    async disrobe(inventoryId) {
        try {
            var item = this.inventory.find((item) => item.id === inventoryId);
            if (!item) throw new Error('item not found');
            // DB 업데이트
            await disrobeItem(this.charId, inventoryId);
            // 서버 업데이트
            item.equiped = false;
        } catch (error) {
            console.error(error);
        }
    }

    // 인벤토리에 아이템 추가
    async add(itemId, rarity, quantity = 1) {
        try {
            // 아이템이 스택 가능한지 확인
            const item = await findItemById(itemId);
            if (item.stackable) {
                // 스택 가능하다면 아이템이 인벤토리에 있는지 확인
                const found = this.inventory.find((item) => item.itemId === itemId && item.rarity === rarity);
                if (found) {
                    // 인벤토리에 있으면 수량 증가
                    await updateItemQuantity(this.charId, itemId, rarity, found.quantity + quantity);
                    // 서버 아이템 수량 증가
                    found.quantity += quantity;
                }
            } else {
                // 스택이 불가능하거나 인벤토리에 없다면 아이템 추가
                const result = await addItemToInventory(this.charId, itemId, 0, false, quantity);
                const newItem = {
                    id: result.insertId,
                    itemId: item.id,
                    itemType: item.itemType,
                    name: item.name,
                    price: item.price,
                    stat: item.stat,
                    rarity: rarity,
                    equiped: false,
                    quantity: quantity,
                }
                // 서버에 아이템 추가
                this.inventory.push(newItem);
            }
        } catch (error) {
            console.error(error);
        }
    }

    // 인벤토리에서 아이템 제거
    async drop(inventoryId, quantity = 1) {
        try {
            // 아이템이 존재하는지 확인
            const idx = this.inventory.findIndex((item) => item.id === inventoryId);
            const found = idx !== -1 ? this.inventory[idx] : undefined;
            if (found) {
                // 아이템이 스택 가능한지 확인
                const item = await findItemById(found.itemId);
                if (item.stackable) {
                    // 스택이 가능하면 수량이 충분한지 확인
                    if (item.quantity >= quantity) {
                        // 수량이 충분하면 수량 감소
                        await updateItemQuantity(this.charId, itemId, rarity, found.quantity - quantity);
                        // 서버에서도 수량 감소
                        found.quantity -= quantity;
                    } else {
                        // 수량이 충분하지 않으면 에러
                        throw new Error('item not enough');
                    }
                } else {
                    // 스택이 불가능하다면 아이템 삭제
                    await removeItemFromInventory(this.charId, this.inventory);
                    // 서버에서도 삭제 
                    this.inventory.splice(idx, 1);
                }
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