import { config } from '../config/config.js';
import { PACKET_TYPE } from '../constants/header.js';
import { packetParser } from '../utils/parser/packetParser.js';
import { getHandlerById } from '../handlers/index.js';
import { handlerError } from '../utils/error/errorHandler.js';

export const onData = (socket) => async (data) => {
  if (!data) {
    console.log('Data is undefined or null');
    return;
  }

  socket.buffer = Buffer.concat([socket.buffer, data]);

  while (socket.buffer.length > 0) {
    // 패킷 파서
    const { packetSize, packetId, deserializedPacketData } = packetParser(socket);
    socket.buffer = socket.buffer.slice(packetSize);

    // 패킷 사이즈가 전체 패킷 사이즈가 아닐경우.
    // const { offset, packetId, deserializedPacketData } = packetParser(socket, data);
    // socket.buffer = socket.buffer.slice(offset);

    try {
      const handler = getHandlerById(packetId);
      // 각 핸들러 동작.
      await handler(socket, deserializedPacketData);
    } catch (e) {
      handlerError(socket, e);
    }
  }
};
