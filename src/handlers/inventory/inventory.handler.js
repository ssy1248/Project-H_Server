import { PACKET_TYPE } from "../../constants/header.js";
import { getInventoryFromCharId } from "../../db/inventory/inventory.db.js";
import { createResponse } from "../../utils/response/createResponse.js";

export const inventoryHandler = async (socket, data) => {
    try {
        const { charId } = data;

        // db에서 캐릭터의 인벤토리를 조회
        const inventory = await getInventoryFromCharId(charId);

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
        handlerError(socket, e);
    }
}