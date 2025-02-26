import { getUserById } from "../../session/user.session";
import { PACKET_TYPE } from "../../constants/header.js";

// 적절한 아이템 핸들러를 찾아서 처리
export const ActiveItemRequestHandler = async (socket, data) => {
    const { itemId, userId } = data;

    // 각종 검증 절차
    const itemHandler = getHandler(itemId);
    itemHandler(userId, data);

    // 응답

    // message S_ActiveItemResponse {
    //     int32 userId = 5;
    //     int32 itemId = 1;
    //     bool success = 2;
    //     string message = 3;
    //     GlobalFailCode failCode = 4;
    //     oneof itemData
    // }
    const activeItemResponse = createResponse(
        'inventory',
        'S_ActiveItemRequest',
        PACKET_TYPE.S_ACTIVEITEMREQUEST,
        {
            userId: userId,
            itemId: itemId,
            success: true,
            message: '',
            failCode: {
                code: 200,
            },
        },
    );

    // TODO: braodcast
    socket.write(activeItemResponse);
}

// 아이템 핸들러 매핑

const handlers = {
    // itemId : itemHandler(args)
}

const getHandler = (itemId) => {
    return this.handlers[itemId];
}
