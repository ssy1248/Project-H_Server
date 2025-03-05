import { PACKET_TYPE } from "../../constants/header.js";
import { getUserBySocket } from "../../session/user.session.js";
import { handlerError } from "../../utils/error/errorHandler.js";
import { createResponse } from "../../utils/response/createResponse.js";

export const inventoryHandler = async (socket, data) => {
    try {
        const { charId } = data;

        // socket의 플레이어가 charId인지 검증(남의 인벤토리는 볼 수 없음)
        const user = getUserBySocket(socket);
        if (user.PlayerInfo.charId !== charId) { // TODO : Class user.PlayerInfo에 charId가 있어야함 ('../../classes/models/user.class.js')
            throw new Error("Character ID is invalid!");
        }

        user.inventory.send();
    } catch (error) {
        handlerError(socket, error);
    }
}

// 이건 있으면 안되는 핸들러같은데?
export const addInventoryHandler = async (socket, data) => {
    try {
        const { charId, itemId, rarity } = data;

        // socket의 플레이어가 charId인지 검증(남의 인벤토리는 볼 수 없음)
        const user = getUserBySocket(socket);
        if (user.PlayerInfo.charId !== charId) {
            throw new Error("Character ID is invalid!");
        }

        // TODO : 일단 패킷 데이터로 받은 그대로 추가하지만, 클라이언트의 데이터를 그대로 믿을 수 없음
        // 클라이언트의 데이터를 검증하거나 제한할 수 있는 방법을 찾아야함
        await user.inventory.add(itemId, rarity);

        // 유저의 인벤토리를 조회
        let inventory = user.inventory.getInventory();

        // 메시지 생성
        const inventoryResponse = createResponse(
            'inventory',
            'S_InventoryResponse',
            PACKET_TYPE.S_INVENTORYRESPONSE,
            { inventory: inventory },
        );

        // 반환
        socket.write(inventoryResponse);
    } catch (error) {
        handlerError(socket, error);
    }
}

export const removeInventoryHandler = async (socket, data) => {
    try {
        const { charId, inventoryId } = data;

        // socket의 플레이어가 charId인지 검증(남의 인벤토리는 볼 수 없음)
        const user = getUserBySocket(socket);
        if (user.PlayerInfo.charId !== charId) {
            throw new Error("Character ID is invalid!");
        }

        // 아이템 제거 
        await user.inventory.drop(charId, inventoryId);

        // 유저의 인벤토리를 조회
        let inventory = user.inventory.getInventory();

        // 메시지 생성
        const inventoryResponse = createResponse(
            'inventory',
            'S_InventoryResponse',
            PACKET_TYPE.S_INVENTORYRESPONSE,
            { inventory: inventory },
        );

        // 반환
        socket.write(inventoryResponse);
    } catch (error) {
        handlerError(socket, error);
    }
}

export const equipItemHandler = async (socket, data) => {
    // TODO : 아이템을 장비하고, DB를 업데이트하고, 결과(전체 인벤토리)를 반환
    try {
        const { itemId } = data;

        // 소켓으로 유저 조회
        const user = getUserBySocket(socket);

        // 아이템 장착
        await user.inventory.equip(itemId);

        // 메시지 생성
        const inventoryResponse = createResponse(
            'inventory',
            'S_EquipItemResponse',
            PACKET_TYPE.S_EQUIPITEMRESPONSE,
            {
                itemId: itemId,
                success: true,
                message: '',
                failCode: {
                    code: 200,
                }
            },
        );

        // 반환
        socket.write(inventoryResponse);
    } catch (error) {
        handlerError(socket, error);
    }
}

export const disrobeItemHandler = async (socket, data) => {
    // TODO : 아이템 장비를 해체하고, DB를 업데이트하고, 결과(전체 인벤토리)를 반환
    try {
        const { itemId } = data;

        const user = getUserBySocket(socket);

        // 아이템 해제
        await user.inventory.disrobe(itemId);

        // 메시지 생성
        const inventoryResponse = createResponse(
            'inventory',
            'S_DisrobeItemResponse',
            PACKET_TYPE.S_DISROBEITEMRESPONSE,
            {
                itemId: itemId,
                success: true,
                message: '',
                failCode: {
                    code: 200,
                }
            },
        );

        // 반환
        socket.write(inventoryResponse);
    } catch (error) {
        handlerError(socket, error);
    }
}

export const storeItemHandler = async (socket, data) => {
    try {
        const { itemId } = data;

        const user = getUserBySocket(socket);

        await user.inventory.store(itemId);

        const storeResponse = createResponse(
            'inventory',

        )
    } catch (error) {
        handlerError(socket, error);
    }
};

export const MoveItemHandler = async (socket, data) => {
    try {
        const { itemId, position, storage } = data;

        const user = getUserBySocket(socket);

        const inventory = user.inventory.getInventory();
        // 옮기려는 아이템
        const item = inventory.find((item) => item.id === itemId);

        // 옮기려는 위치가 -1인 경우, 비어있는 가장 앞자리로 옮기기
        let targetPosition = position;
        if (position === -1) {
            const occupiedPositions = inventory
                .filter((item) => item.equipped === storage)
                .map((item) => item.position);
            targetPosition = 0;
            while (occupiedPositions.includes(targetPosition)) {
                targetPosition++;
            }
        }

        // 옮기려는 위치에 다른 아이템이 있는지 확인
        const other = inventory.find((item) => item.position === targetPosition && item.equipped === storage);
        if (other) {
            // 옮기려는 위치에 다른 아이템이 있으면 스왑
            await user.inventory.move(other.id, item.position, storage);
        }

        // 아이템 옮기기
        await user.inventory.move(itemId, targetPosition, storage);

        const moveItemResponse = createResponse(
            'inventory',
            'S_MoveItemResponse',
            PACKET_TYPE.S_MOVEITEMRESPONSE,
            {
                itemId: itemId,
                position: targetPosition,
                storage: storage,
            }
        );

        socket.write(moveItemResponse);
    } catch (error) {
        handlerError(socket, error);
    }
};