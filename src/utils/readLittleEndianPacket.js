function readLittleEndianPacket(buffer) {
  let arrayBuffer = new ArrayBuffer(buffer.length);
  let uint8Array = new Uint8Array(arrayBuffer);
  for (let i = 0; i < buffer.length; i++) {
    uint8Array[i] = buffer[i];
  }

  // DataView로 변환
  let dataView = new DataView(arrayBuffer);

  // 리틀 엔디안 형식의 4바이트 읽기
  let packetLength = dataView.getUint32(0, true);

  // 패킷 타입 읽기
  let packetType = dataView.getUint8(4);

  return {
    length: packetLength,
    packetType: packetType,
  };
}

export default readLittleEndianPacket;
