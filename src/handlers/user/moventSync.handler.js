import { getUserBySocket, broadcastToUsersAsync } from '../../session/user.session.js';
import { MAX_POSITION_DIFFERENCE, MAX_ROTATION_DIFFERENCE } from '../../constants/constants.js';
import { createResponse } from '../../utils/response/createResponse.js';
import { PACKET_TYPE } from '../../constants/header.js';

const movementSyncHandler = (socket, packetData) => {
  // 0. 페킷데이터 구조분해 할당.
  const { transform } = packetData;

  // 1. 소캣으로 유저찾기.
  const user = getUserBySocket(socket);

  // 2. 케릭터의 현재 트랜스폼을 가져온다.
  const characterTransform = user.getTransformInfo();

  // 3. 트랜스폼 검증.
  validateTransform(characterTransform, transform);

  if (!validateTransform) {
    return console.log('트랜스폼 검증에 실패하였습니다.');
  }

  // 트랜스폼 갱신.
  user.setTransformInfo(transform);

  // 4. 브로드캐스트.
  const userInfo = user.getUserInfo();

  const sMove = {
    playerId: userInfo.userId,
    transform: transform,
  };

  const initialResponse = createResponse('town', 'S_Move', PACKET_TYPE.S_MOVE, sMove);
  broadcastToUsersAsync(socket, initialResponse);
};

// 트랜스폼 검증용 함수.
const validateTransform = (previousTransform, currentTransform) => {
  // 1. 위치 차이 계산:  이전 위치와 현재 위치의 차이를 구합니다.
  // 이전과 현재의 좌표값의 차이를 각각 구합니다.
  // 각 차이를 제곱하여 더합니다.
  // 그 값을 제곱근을 구하여 두 점 사이의 거리를 계산합니다.
  const positionDifference = Math.sqrt(
    Math.pow(previousTransform.posX - currentTransform.posX, 2) +
      Math.pow(previousTransform.posY - currentTransform.posY, 2) +
      Math.pow(previousTransform.posZ - currentTransform.posZ, 2),
  );

  // 2. 회전 차이 계산: 이전 회전 값과 현재 회전 값의 절대 차이를 구합니다.
  const rotationDifference = Math.abs(previousTransform.rot - currentTransform.rot);

  // 3. 조건 확인: 위치 차이와 회전 차이가 주어진 최대 차이를 초과하지 않으면 true 반환.
  // 둘 중 하나라도 최대 차이를 초과하면 false를 반환.
  const isValidTransform = !(
    positionDifference > MAX_POSITION_DIFFERENCE || rotationDifference > MAX_ROTATION_DIFFERENCE
  );

  return isValidTransform;
};

export default movementSyncHandler;

/**
 *   message TransformInfo {
    float posX = 1; 
    float posY = 2; 
    float posZ = 3; 
    float rot = 4;
  } */

// 클라가 서버에게 100ms 안에 패킷을 보낸다고 가정 하자.
// 클라이언트 CheckMove() 수정해야함.
// 클라이언트는 이동을 하고 이동에 변화량이 생기면 그때 서버에 패킷을 보냄.
// 서버는 패킷을 받고 다른 유저들에게 브로드캐스트를한다
// 클라이언트 Player.cs에 보간 처리가 이미 되어있는것같다.

// 해결 방법 1. 클라에서 일정 간격으로 보낸다.
// 클라(MyPlayer.cs)에서 일정간격(예: 100ms)마다 패킷 전송.
// 서버는 검증후 브로드 캐스트.
// 다른 유저들 (Player.cs) 에서 이미 보간처리 되어있음
// 장단점 : 빠른 반응과 정확한 동기화에 유리하지만,
// 패킷 전송 빈도가 높아 네트워크 및 서버 부하가 증가할 수 있음.

// 해결 방법 2. 서버에서 지연보정(스냅샷?).
// 패킷에 서버의 타임스탬프를 넣어서 보낸다.
// 클라에서는 이전 스냅샷과 받은 스냅샷과 비교해서 보간을 사용하여 동기화
// 장단점 : 서버에서 일괄적으로 동기화하여 과부하를 줄일 수 있지만,
// 지연이 발생하고 실시간 반응이 약간 떨어질 수 있음.

/**
 *
  message C_Move {
    TransformInfo transform = 1;
  }
  
  // ALL
  message S_Move {
    int32 playerId = 1;
    TransformInfo transform = 2;
  }
 */
