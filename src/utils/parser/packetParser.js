import { getProtoMessages } from '../../init/loadProtos.js';
import { getProtoTypeNameByHandlerId } from '../../handlers/index.js';
import CustomError from '../error/customError.js';
import { ErrorCodes } from '../error/errorCodes.js';

export const packetParser = (data, packetType) => {
  const protoMessages = getProtoMessages();

  const protoTypeName = getProtoTypeNameByHandlerId(packetType);
  if (!protoTypeName) {
    throw new CustomError(ErrorCodes.UNKNOWN_HANDLER_ID, `알 수 없는 패킷 타입: ${packetType}`);
  }
  const [namespace, typeName] = protoTypeName.split('.');
  const struct = protoMessages[namespace][typeName];
  let packet;

  try {
    packet = struct.decode(data);
  } catch (e) {
    console.log(e);
    throw new CustomError(ErrorCodes.PACKET_DECODE_ERROR, '패킷 디코딩 중 오류가 발생했습니다.');
  }

  // 필드가 비어있는 경우 = 필수 필드가 누락된 경우
  const expectedFields = Object.keys(struct.fields);
  const actualFields = Object.keys(packet);
  const missingFields = expectedFields.filter((field) => !actualFields.includes(field));

  if (missingFields.length > 0) {
    throw new CustomError(
      ErrorCodes.MISSING_FIELDS,
      `필수 필드가 누락되었습니다: ${missingFields.join(', ')}`,
    );
  }

  return { ...packet };
};
