import { getProtoMessages } from '../../init/loadProtos.js';

const PACKET_SIZE = 4;
const PACKET_ID = 1;

// 문제 -1 packageName 과 packageName 으로
//     장점 - 찾은걸 넣으면 이제 유지 보수가 편해지는 대신 단점 - createResponse 두개를 넣어줘야 한다.
// 문제 -2 packageName 으로 찾은거만 넣을려고 하면 packageName 에 있는 user , town .. 등 그런걸 제거하고 하나로 해서 load 프로토의 for문을 하나로 줄여야 한다!
//     장점 - 찾은거만 넣어주면 된다! 단점 - ? 유지 보수가 힘들다 ? 주석으로 커버하면 비슷비슷할거 같은데.
// createResponse 함수 개선
export const createResponse = (packageName, structName, packetId, packetData) => {
  // 1. 패킷 데이터 직렬화
  const protoMessages = getProtoMessages();
  // [수정] packetName을 가지고 packageName, structName을 구한다.
  // [수정 -2] packageName 사용해서 만든다.
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
