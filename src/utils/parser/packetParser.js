import { PACKET_TYPE } from '../../constants/header.js';
import { packetNames } from '../../protobuf/packetNames.js';
import { getProtoMessages } from '../../init/loadProtos.js';


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
  let packetData = socket.buffer.slice(offset, offset + packetSize - 5);

  // 역직렬화 되어야함. packetData
  const {packageName, structName, packetName} = getPacketNamesById(packetId);
  const protoMessages = getProtoMessages();
  const packetDataType = protoMessages[packageName][structName];

  const deserializedPacketData = packetDataType.decode(packetData);

  return { packetSize, packetId, deserializedPacketData };
};

// 주어진 packetId에 해당하는 패킷 이름을 반환하는 함수.
const getPacketNamesById = (packetId) => {
  // packetNames의 각 카테고리(예: user, town, chat 등)별로 순차적으로 반복
  for (const packageName in packetNames) {
    // 각 카테고리 내의 패킷들을 반복
    for (const structName in packetNames[packageName]) {
      // 패킷의 ID가 전달된 packetId와 일치하면 해당 패킷 이름을 반환 (정규 표현식)
      // 대소문자 변환 (변환하는 이유는 PACKET_TYPE은 _ 제외하고 대문자 여서)
      const formattedPacket = structName
        .replace(/([A-Z])/g, (match, p1, offset) =>
          offset > 0 && /[A-Z]/.test(structName[offset - 1]) ? `_${p1}` : p1,
        )
        .toUpperCase();
      if (PACKET_TYPE[formattedPacket] === packetId) {
        return {
          packageName: packageName,
          structName: structName,
          packetName: packetNames[packageName][structName],
        };
      }
    }
  }
  // 만약 packetId에 해당하는 패킷이 없으면 null을 반환
  return null;
};

/**
 *
 * 출력 예시 (14)를 매게변수로 넣었을경우
 * {
      packageName: 'inventory',
      structName: 'C_BuyItemRequest',
      packetName: 'Google.Protobuf.Protocol.C_BuyItemRequest'
    }
 */
