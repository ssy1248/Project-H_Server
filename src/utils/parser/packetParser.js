import { PACKET_TYPE } from '../../constants/header.js';
import { packetNames } from '../../protobuf/packetNames.js';

// MSS(Maximum Segment Size)는 TCP 연결에서 한 번에 전송할 수 있는 최대 데이터 크기
// 보통은 1460바이트로 설정되며, 네트워크의 MTU(Maximum Transmission Unit)에 따라 결정
const MSS = 1460; // MSS를 설정 (예: 1460바이트)

export const packetParser = (socket) => {
  // 1. 오프셋 초기화
  let offset = 0;

  // 2. 패킷 사이즈 (4 바이트, 리틀 엔디안)
  const packetSize = socket.buffer.readUInt32LE(offset);
  offset += 4;

  // 3. packetSize와 MSS를 비교 (패킷 사이즈 검증.)
  if (packetSize > MSS) {
    console.log('패킷 사이즈가 넘었습니다. ');
  }

  // 4. 패킷 ID (1 바이트)
  const packetId = socket.buffer.readUInt8(offset);
  offset += 1;

  // 5. 남은 데이터 (PacketData)
  // 패킷 사이즈가 전체 데이터 사이즈 라고 가정하고 만들었습니다.
  // 아니라면 주석 풀어주세요..
  const packetData = socket.buffer.slice(offset, offset + packetSize - 5);
  // const packetDataSize = packetData.length;
  // offset += packetDataSize;

  // 역직렬화 되어야함. packetData

  return { packetSize, packetId, packetData };
  // return { offset, packetId, packetData };
};

const getPacketNamesById = (packetId) => {
  // 순서대로 패킷 카테고리마다 해당하는 ID를 찾고, 반환.
  for (const category in packetNames) {
    for (const packet in packetNames[category]) {
      if (PACKET_TYPE[packet] === packetId) {
        return packetNames[category][packet];
      }
    }
  }
  return null; // 해당 ID가 없으면 null 반환
};
