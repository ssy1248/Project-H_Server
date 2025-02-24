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
import { searchPartyInPlayerSession } from '../../session/party.session.js';

const chatHandler = async (socket, { playerId, type, senderName, chatMsg }) => {
  try {
    const user = getUserBySocket(socket);
    if (!user) {
      throw new CustomError(ErrorCodes.USER_NOT_FOUND, '유저를 찾을 수 없습니다.');
    }
    // const parties = searchPartyInPlayerSession(user.userInfo.userId); 임시 확인용 콘솔 주석처리
    // console.log('parties:', parties); 임시 확인용 콘솔 주석처리
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
        const parties = searchPartyInPlayerSession(user.userInfo.userId);
        // 파티 검색할때마다 잘 불러와지는지 확인용 콘솔
        console.log('parties:', parties);
        if (!parties || parties.length === 0) {
          const noPartyMessage = createResponse('chat', 'S_Chat', PACKET_TYPE.S_CHAT, {
            playerId,
            type,
            errorType: ChatErrorCodes.USER_NOT_FOUND,
            chatMsg: '파티원이 없습니다.',
          });

          socket.write(noPartyMessage);
          return;
        }

        // 모든 해당 파티의 멤버들에게 메시지를 전송
        for (const party of parties) {
          for (const member of party.partyMembers) {
            const chatMessage = createResponse('chat', 'S_Chat', PACKET_TYPE.S_CHAT, {
              playerId,
              type,
              errorType: 0,
              chatMsg,
            });

            console.log(
              `[CHAT] Party Message Sent - From: ${user.userInfo.nickname} To: ${member.userInfo.nickname}, Message: ${chatMsg}`,
            );

            member.userInfo.socket.write(chatMessage);
          }
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
