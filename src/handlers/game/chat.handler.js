import { ChatErrorCodes, ChatType } from '../../constants/constants.js';
import CustomError from '../../utils/error/customError.js';
import { ErrorCodes } from '../../utils/error/errorCodes.js';
import { handlerError } from '../../utils/error/errorHandler.js';
import { createResponse } from '../../utils/response/createResponse.js';
import {
  getUserBySocket,
  getUserByNickname,
  getAllUsers,
  broadcastToUsersAsync,
} from '../../session/user.session.js';
import { PACKET_TYPE } from '../../constants/header.js';

const chatHandler = async (socket, { playerId, type, senderName, chatMsg }) => {
  try {
    const user = getUserBySocket(socket);
    if (!user) {
      throw new CustomError(ErrorCodes.USER_NOT_FOUND, '유저를 찾을 수 없습니다.');
    }

    switch (type) {
      // 전체 채팅
      case ChatType.GLOBAL:
        await broadcastToUsersAsync(
          socket,
          createResponse('chat', 'S_Chat', PACKET_TYPE.S_CHAT, {
            playerId,
            type,
            errorType: 0,
            chatMsg,
          }),
        );
        break;

      // 공지사항
      case ChatType.ANNOUNCEMENT:
        if (!user.isAdmin) {
          socket.write(
            createResponse('chat', 'S_Chat', PACKET_TYPE.S_CHAT, {
              playerId,
              type,
              errorType: ChatErrorCodes.NO_PERMISSION,
              chatMsg: '공지사항은 관리자만 보낼 수 있습니다.',
            }),
          );
          return;
        }

        await broadcastToUsersAsync(
          socket,
          createResponse('chat', 'S_Chat', PACKET_TYPE.S_CHAT, {
            playerId,
            type,
            errorType: 0,
            chatMsg,
          }),
        );
        break;

      // 파티 채팅
      case ChatType.PARTY:
        const allUsers = getAllUsers();
        const partyMembers = allUsers.filter(
          (u) => u.playerInfo.partyId === user.playerInfo.partyId,
        );
        for (const member of partyMembers) {
          member.userInfo.socket.write(
            createResponse('chat', 'S_Chat', PACKET_TYPE.S_CHAT, {
              playerId,
              type,
              errorType: 0,
              chatMsg,
            }),
          );
        }
        break;

      // 귓속말
      case ChatType.WHISPER:
        const recipient = getUserByNickname(senderName);
        if (!recipient) {
          socket.write(
            createResponse('chat', 'S_Chat', PACKET_TYPE.S_CHAT, {
              playerId,
              type,
              errorType: ChatErrorCodes.USER_NOT_FOUND,
              chatMsg: '대상이 존재하지 않습니다.',
            }),
          );
          return;
        }
        recipient.socket.write(
          createResponse('chat', 'S_Chat', PACKET_TYPE.S_CHAT, {
            playerId,
            type,
            errorType: 0,
            chatMsg,
          }),
        );
        break;

      // 감정표현
      case ChatType.EMOTE:
        await broadcastToUsersAsync(
          socket,
          createResponse('town', 'S_Emote', PACKET_TYPE.S_EMOTE, { playerId, animCode: chatMsg }),
        );
        break;

      default:
        throw new CustomError(ErrorCodes.INVALID_CHAT_TYPE, '잘못된 채팅 타입입니다.');
    }
  } catch (e) {
    handlerError(socket, e);
  }
};

export default chatHandler;
