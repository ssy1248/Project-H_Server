import { ChatErrorCodes, ChatType } from '../../constants/constants.js';
import { packetNames } from '../../protobuf/packetNames.js';
import { getGameSession } from '../../session/game.session.js';
import CustomError from '../../utils/error/customError.js';
import { ErrorCodes } from '../../utils/error/errorCodes.js';
import { handlerError } from '../../utils/error/errorHandler.js';
import { createResponse } from '../../utils/response/createResponse.js';

const chatHandler = (socket, { playerId, type, senderName, chatMsg }) => {
  try {
    const gameSession = getGameSession();

    if (!gameSession) {
      throw new CustomError(ErrorCodes.GAME_NOT_FOUND, '게임 세션을 찾을 수 없습니다.');
    }

    const user = gameSession.getUser(socket);
    if (!user) {
      throw new CustomError(ErrorCodes.USER_NOT_FOUND, '유저를 찾을 수 없습니다.');
    }

    // 채팅 응답 패킷 생성 함수
    const createChatResponse = (errorType, message) => {
      return createResponse('chat', packetNames.chat.S_Chat, 13, {
        playerId,
        type,
        errorType,
        chatMsg: message,
      });
    };

    // 감정표현 응답 패킷 생성 함수 (S_Animation 사용)
    const createEmoteResponse = (animCode) => {
      return createResponse('town', packetNames.town.S_Animation, 11, {
        playerId,
        // 감정표현 ID
        animCode,
      });
    };

    switch (type) {
      // 전체 채팅
      case ChatType.GLOBAL:
        gameSession.broadcast(createChatResponse(0, chatMsg));
        break;

      // 공지사항
      case ChatType.ANNOUNCEMENT:
        if (!user.isAdmin) {
          socket.emit(
            createChatResponse(
              ChatErrorCodes.NO_PERMISSION,
              '공지사항은 관리자만 보낼 수 있습니다.',
            ),
          );
          return;
        }
        gameSession.broadcast(createChatResponse(0, chatMsg));
        break;

      // 파티 채팅
      case ChatType.PARTY:
        if (!user.party) {
          socket.emit(createChatResponse(ChatErrorCodes.NO_PARTY, '파티에 가입되지 않았습니다.'));
          return;
        }
        gameSession.sendToParty(user.party, createChatResponse(0, chatMsg));
        break;

      // 귓속말
      case ChatType.WHISPER:
        const recipient = gameSession.getUserByName(senderName);
        if (!recipient) {
          socket.emit(
            createChatResponse(ChatErrorCodes.USER_NOT_FOUND, '대상이 존재하지 않습니다.'),
          );
          return;
        }
        recipient.socket.emit(createChatResponse(0, chatMsg));
        break;

      // 감정표현 (애니메이션 패킷 따로 처리)
      case ChatType.EMOTE:
        // `S_Animation` 패킷을 사용하여 감정표현 처리
        gameSession.broadcast(createEmoteResponse(chatMsg));
        break;

      default:
        throw new CustomError(ErrorCodes.INVALID_CHAT_TYPE, '잘못된 채팅 타입입니다.');
    }
  } catch (e) {
    handlerError(socket, e);
  }
};

export default chatHandler;
