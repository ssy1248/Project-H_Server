import { getProtoMessages } from '../../init/loadProtos.js';
import { config } from '../../config/config.js';

export const createResponse = (type, packageName, structName, data = null) => {
  const protoMessages = getProtoMessages();
  const Response = protoMessages[packageName][structName];

  const buffer = Response.encode(data).finish();

  const packetLength = Buffer.alloc(config.packet.totalLength);
  packetLength.writeUInt32BE(
    buffer.length + config.packet.totalLength + config.packet.typeLength,
    0,
  );

  const packetType = Buffer.alloc(config.packet.typeLength);
  packetType.writeUInt8(type, 0);

  return Buffer.concat([packetLength, packetType, buffer]);
};
