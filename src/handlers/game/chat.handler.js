import { ChatErrorCodes, ChatType } from '../../constants/chatType.js';
import { packetNames } from '../../protobuf/packetNames.js';
import { getGameSession } from '../../session/game.session.js';
import CustomError from '../../utils/error/customError.js';
import { ErrorCodes } from '../../utils/error/errorCodes.js';
import { handlerError } from '../../utils/error/errorHandler.js';
import {
  createAnimationPacket,
  createChatPacket,
} from '../../utils/notification/game.notification.js';

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

    switch (type) {
      // 전체 채팅
      case ChatType.GLOBAL:
        const globalChatPacket = createChatPacket(playerId, type, 0, chatMsg);
        gameSession.broadcast({
          packet: packetNames.game.S_Chat,
          data: globalChatPacket,
        });
        break;

      // 공지사항
      case ChatType.ANNOUNCEMENT:
        if (!user.isAdmin) {
          const noPermissionPacket = createChatPacket(
            playerId,
            type,
            ChatErrorCodes.NO_PERMISSION,
            '공지사항은 관리자만 보낼 수 있습니다.',
          );
          socket.emit(packetNames.game.S_Chat, noPermissionPacket);
          return;
        }

        const announcementPacket = createChatPacket(playerId, type, 0, chatMsg);
        gameSession.broadcast({
          packet: packetNames.game.S_Chat,
          data: announcementPacket,
        });
        break;

      // 파티 채팅
      case ChatType.PARTY:
        if (!user.party) {
          const noPartyPacket = createChatPacket(
            playerId,
            type,
            ChatErrorCodes.NO_PARTY,
            '파티에 가입되지 않았습니다.',
          );
          socket.emit(packetNames.game.S_Chat, noPartyPacket);
          return;
        }

        const partyChatPacket = createChatPacket(playerId, type, 0, chatMsg);
        gameSession.sendToParty(user.party, {
          packet: packetNames.game.S_Chat,
          data: partyChatPacket,
        });
        break;

      // 귓속말
      case ChatType.WHISPER:
        const recipient = gameSession.getUserByName(senderName);
        if (!recipient) {
          const userNotFoundPacket = createChatPacket(
            playerId,
            type,
            ChatErrorCodes.USER_NOT_FOUND,
            '대상이 존재하지 않습니다.',
          );
          socket.emit(packetNames.game.S_Chat, userNotFoundPacket);
          return;
        }

        const whisperPacket = createChatPacket(playerId, type, 0, chatMsg);
        recipient.socket.emit(packetNames.game.S_Chat, whisperPacket);
        break;

      // 감정표현
      case ChatType.EMOTE:
        const emotePacket = createAnimationPacket(playerId, chatMsg);
        gameSession.broadcast(emotePacket);
        break;

      default:
        throw new CustomError(ErrorCodes.INVALID_CHAT_TYPE, '잘못된 채팅 타입입니다.');
    }
  } catch (e) {
    handlerError(socket, e);
  }
};

export default chatHandler;
