import { PACKET_TYPE } from "../../constants/header.js";
import { getDungeonSession } from "../../session/dungeon.session.js";
import { getUserBySocket } from "../../session/user.session.js";
import { createResponse } from "../../utils/response/createResponse.js";
import { healthPotion } from "../item/item.js";

// 아이템 핸들러 매핑
const handlers = {
    // itemId : itemHandler(args)
    3: healthPotion(100),
}

const getHandler = (itemId) => {
    return handlers[itemId];
}

// 적절한 아이템 핸들러를 찾아서 처리
export const ActiveItemRequestHandler = async (socket, data) => {
    const { id, timestamp } = data;

    // 각종 검증 절차
    const user = getUserBySocket(socket);
    const item = user.inventory.getItem(id);
    const itemId = item.itemId;
    const itemHandler = getHandler(itemId);

    if(!itemHandler){
        console.error(`아이템 핸들러를 찾을 수 없습니다. ${itemId}`);
        return;
    }

    itemHandler(socket, data);

    await user.inventory.drop(id);

    // 응답

    // message S_ActiveItemResponse {
        // int32 userId = 5;
        // int32 id = 1; // Inventory.id
        // bool success = 2;
        // string message = 3;
        // GlobalFailCode failCode = 4;
    // }
    const activeItemResponse = createResponse(
        'inventory',
        'S_ActiveItemRequest',
        PACKET_TYPE.S_ACTIVEITEMREQUEST,
        {
            userId: user.userInfo.userId,
            id: id,
            success: true,
            message: '',
            failCode: {
                code: 200,
            },
        },
    );

    // TODO: braodcast to every players in dungeon
    const dungeonId = user.inDungeonId;
    const dungeon = getDungeonSession(dungeonId);
    // 던전까지는 구했는데 던전에 있는 플레이어는 어떻게 구하지?

    socket.write(activeItemResponse);
}