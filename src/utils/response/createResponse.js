import { getProtoMessages } from '../../init/loadProtos.js';

const PACKET_SIZE = 4;
const PACKET_ID = 1;

// createResponse 함수 개선
export const createResponse = (packetName, packetId, packetData) => {
  // 1. 패킷 데이터 직렬화
  const protoMessages = getProtoMessages();
  // [수정] packetName을 가지고 packageName, structName을 구한다.
  const [packageName, structName] = packetName.split('.');
  const Response = protoMessages[packageName][structName];
  const packet = Response.encode(packetData).finish();

  // 2. 패킷 사이즈 계산
  const packetSize = packet.length + PACKET_SIZE + PACKET_ID;

  // 3. 패킷 사이즈를 빅 엔디안으로 작성 
  const length = Buffer.alloc(PACKET_SIZE);
  
  // [수정 전] 빅엔디안
  //length.writeUInt32BE(packetSize, 0); 

  // [수정 후] 리틀엔디안
  length.writeUInt32LE(packetSize, 0); 

  // 4. 패킷 ID (1바이트)
  const id = Buffer.alloc(PACKET_ID);
  id.writeUInt8(packetId, 0);

  return Buffer.concat([length, id, packet]);
};
