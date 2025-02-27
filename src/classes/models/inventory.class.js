import { addItemToInventory, disrobeItem, equipItem, getInventoryFromCharId, removeItemFromInventory, updateItemPosition, updateItemQuantity } from '../../db/inventory/inventory.db.js';
import { findItemById } from '../../db/inventory/item.db.js';
import { createResponse } from "../../utils/response/createResponse.js";
import { PACKET_TYPE } from '../../constants/header.js';

export default class Inventory {
    constructor() {
        this.inventory = []; // 소지중인 아이템 인벤토리
    }

    async init(user) {
        this.user = user;
        this.charId = user.playerInfo.charId;
        this.inventory = await getInventoryFromCharId(this.charId);
        if (!this.inventory) {
            console.log('inventory is empty');
            return;
        }
        this.send();
    }

    send() {
        // 메시지 생성
        const inventoryResponse = createResponse(
            'inventory',
            'S_InventoryResponse',
            PACKET_TYPE.S_INVENTORYRESPONSE,
            { inventory: this.inventory },
        );

        // 전송
        this.user.userInfo.socket.write(inventoryResponse);
    }

    // 아이템 장비하기
    async equip(inventoryId) {
        try {
            var item = this.inventory.find((item) => item.id === inventoryId);
            // 이미 장비된 아이템이 있다면 장비 해제
            var equipped = this.inventory.find((e) => e.equiped === true && e.itemType === item.itemType);
            if (!item) throw new Error('item not found');
            if (equipped) {
                await disrobeItem(this.charId, equipped.id);
                equipped.equiped = false;
            }
            // DB 업데이트
            await equipItem(this.charId, item.id);
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
                    stackable: result.stackable,
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
                if (found.stackable) {
                    // 스택이 가능하면 수량이 충분한지 확인
                    if (found.quantity > quantity) {
                        // 수량이 충분하면 수량 감소
                        await updateItemQuantity(this.charId, inventoryId, found.quantity - quantity);
                        // 서버에서도 수량 감소
                        found.quantity -= quantity;
                    } else {
                        // 수량이 충분하지 않으면 에러
                        throw new Error('item not enough');
                    }
                } else {
                    // 스택이 불가능하다면 아이템 삭제
                    await removeItemFromInventory(this.charId, inventoryId);
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

    // 아이템 슬롯 이동
    async move(itemId, position) {
        try {
            var item = this.inventory.find((item) => item.id === itemId);
            // DB의 위치 정보 업데이트
            await updateItemPosition(this.charId, itemId, position);
            // 서버의 위치 정보 업데이트
            if (!item) throw new Error('item not found');
            item.position = position;
        } catch (error) {
            console.error(error);
        }
    }

    getItem(inventoryId) {
        return this.inventory.find((item) => item.id === inventoryId);
    }

    // 소지한 아이템을 반환하는 함수
    getInventory() {
        return this.inventory;
    }

    // 장비한 아이템만을 반환하는 함수
    getEquipment() {
        return this.inventory.filter((item) => item.equipped === true);
    }

    // 모든 장착한 아이템의 스탯 합을 구하는 함수
    getAllStat() {
        return this.getEquipment.reduce(
            (acc, item) => acc + item.stat,
            0
        );
    }

    // 클래스 기본 스탯에 장비한 모든 스탯을 더한 객체를 반환하는 함수
    addAllStat(playerStatInfo) {
        const copy = { ...playerStatInfo };
        const stat = this.getAllStat();
        for (const [key, value] of Object.entries(copy)) {
            value += stat;
        }
        return copy;
    }
}