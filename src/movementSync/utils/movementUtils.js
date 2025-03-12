// 두 지점 사이의 거리 계산 함수
// 주어진 이전 위치(previousTransform)와 현재 위치(currentTransform) 간의 3D 거리 차이를 계산합니다.
const calculateDistance = (previousTransform, currentTransform) => {
  if (previousTransform === currentTransform) {
    return 0;
  }

  // 3D 거리 계산 (피타고라스의 정리 사용)
  // (x1 - x2)^2 + (y1 - y2)^2 + (z1 - z2)^2 의 제곱근을 구합니다.
  const distance = Math.sqrt(
    Math.pow(previousTransform.posX - currentTransform.posX, 2) +
      Math.pow(previousTransform.posY - currentTransform.posY, 2) +
      Math.pow(previousTransform.posZ - currentTransform.posZ, 2),
  );

  // 계산된 거리를 반환
  return distance;
};

// 위치 변화에 따른 방향과 속도를 계산하는 함수
// 이전 위치(previousTransform)와 현재 위치(currentTransform) 간의 방향 벡터를 구하고,
// 주어진 속도(speed)를 기준으로 속도 벡터(velocity)를 계산합니다.
const calculateDirectionAndVelocity = (previousTransform, currentTransform, speed) => {
  // 위치 변화(델타값) 계산: x, y, z 각각의 차이 구하기
  const deltaX = currentTransform.posX - previousTransform.posX;
  const deltaY = currentTransform.posY - previousTransform.posY;
  const deltaZ = currentTransform.posZ - previousTransform.posZ;

  // 두 지점 간의 거리 계산 (피타고라스의 정리 사용)
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY + deltaZ * deltaZ);

  // 방향 벡터 계산: 각 축에 대해 변화된 값에 거리로 나누어 단위 벡터로 정규화
  const directionX = deltaX / distance;
  const directionY = deltaY / distance;
  const directionZ = deltaZ / distance;

  // 속도 벡터 계산: 방향 벡터에 속도를 곱하여 각 축에 대한 속도 값을 계산
  const velocityX = directionX * speed;
  const velocityY = directionY * speed;
  const velocityZ = directionZ * speed;

  // 계산된 속도 벡터 객체 반환
  const velocity = { x: velocityX, y: velocityY, z: velocityZ };

  return velocity;
};

// 주어진 이전 위치와 현재 위치를 기준으로 회전 각도(yaw, pitch)를 계산하는 함수
const calculateRotation = (previousTransform, currentTransform) => {
  // 이전과 현재 위치 간의 차이 계산
  const deltaX = currentTransform.posX - previousTransform.posX;
  const deltaY = currentTransform.posY - previousTransform.posY;
  const deltaZ = currentTransform.posZ - previousTransform.posZ;

  // yaw 계산: 수평 회전 각도, xz평면에서의 회전 각도를 구함
  // Math.atan2(deltaX, deltaZ)는 xz평면에서의 각도를 계산하며, 이를 도(degree) 단위로 변환
  const yaw = Math.atan2(deltaX, deltaZ) * (180 / Math.PI);
  const yaw2 = (Math.atan2(deltaX, deltaZ) * (180 / Math.PI) + 360) % 360;
  // pitch 계산: 수직 회전 각도, y축(높이)과 xz평면의 거리 차이를 기준으로 회전 각도를 구함
  const distanceXZ = Math.sqrt(deltaX * deltaX + deltaZ * deltaZ);
  const pitch = Math.atan2(deltaY, distanceXZ) * (180 / Math.PI);

  // 계산된 yaw와 pitch 반환
  return { yaw, yaw2, pitch };
};

// 현재 위치가 목표 지점을 지나쳤는지 여부를 확인하는 함수입니다.
const hasPassedTarget = (currentTransform, targetTransform, lastTransform) => {
  // 목표 지점과 현재 위치 간의 차이 계산
  const deltaX = targetTransform.posX - currentTransform.posX;
  const deltaY = targetTransform.posY - currentTransform.posY;
  const deltaZ = targetTransform.posZ - currentTransform.posZ;

  // 목표와 현재 위치 사이의 거리 계산
  const distanceToTarget = Math.sqrt(deltaX * deltaX + deltaY * deltaY + deltaZ * deltaZ);

  // 목표 지점에 가까워졌을 때 지나친 것으로 판단 (0.1 미만으로 가까워졌다면)
  if (distanceToTarget < 0.1) {
    return true;
  }

  // 마지막 위치와 목표 지점 간의 차이 계산
  const lastDeltaX = targetTransform.posX - lastTransform.posX;
  const lastDeltaY = targetTransform.posY - lastTransform.posY;
  const lastDeltaZ = targetTransform.posZ - lastTransform.posZ;

  // 현재 위치와 마지막 위치 간의 내적 계산 (목표 방향과 이동 방향의 유사성 판단)
  const dotProduct = deltaX * lastDeltaX + deltaY * lastDeltaY + deltaZ * lastDeltaZ;

  //console.log(dotProduct);
  // 내적이 음수이면 지나쳤다고 판단 (이동 방향이 목표를 지나쳤을 경우)
  return dotProduct < 0;
};

// [ OBB 충돌]
const isInRotatedRange = (range, width, sourceTransform, targetTransform, rot = null) => {
  let sourceRot = rot;
  if (rot === null) {
    sourceRot = targetTransform.rot;
  }

  // 공격 범위의 네 꼭지점 계산
  const { topLeft, topRight, bottomLeft, bottomRight } = calculateRotatedBox(
    range,
    width,
    sourceTransform,
    sourceRot,
  );

  // 대상이 공격 범위 내에 있는지 체크 (최소/최대 좌표를 이용한 충돌 감지)
  const isTargetInRange =
    targetTransform.posX >= Math.min(topLeft.x, topRight.x, bottomLeft.x, bottomRight.x) &&
    targetTransform.posX <= Math.max(topLeft.x, topRight.x, bottomLeft.x, bottomRight.x) &&
    targetTransform.posZ >= Math.min(topLeft.z, topRight.z, bottomLeft.z, bottomRight.z) &&
    targetTransform.posZ <= Math.max(topLeft.z, topRight.z, bottomLeft.z, bottomRight.z);

  return isTargetInRange;
};

const calculateRotatedBox = (range, width, sourceTransform, rot) => {
  // 공격 범위 설정 (원본 객체의 회전 방향에 맞춰 회전된 박스형 범위)
  const attackDistance = range; // 공격 거리 (원본 객체가 바라보는 방향으로 범위)
  const attackWidth = width; // 공격 폭 (좌우 범위)

  // 원본 객체의 forward 방향 벡터 (회전된 방향)
  const forwardX = Math.cos(rot); // Y축 회전 기준
  const forwardZ = Math.sin(rot);

  // 원본 객체의 오른쪽 방향 벡터 (좌우로 벗어난 방향)
  const rightX = -forwardZ;
  const rightZ = forwardX;

  // 원본 객체의 현재 위치
  const sourceX = sourceTransform.posX;
  const sourceZ = sourceTransform.posZ;

  // 공격 범위의 중심을 계산
  const centerX = sourceX + forwardX * (attackDistance / 2);
  const centerZ = sourceZ + forwardZ * (attackDistance / 2);

  // 공격 범위의 네 꼭지점을 계산
  const topLeftX = centerX - (attackWidth / 2) * rightX;
  const topLeftZ = centerZ - (attackWidth / 2) * rightZ;
  const topRightX = centerX + (attackWidth / 2) * rightX;
  const topRightZ = centerZ + (attackWidth / 2) * rightZ;

  const bottomLeftX = centerX - (attackWidth / 2) * rightX - forwardX * attackDistance;
  const bottomLeftZ = centerZ - (attackWidth / 2) * rightZ - forwardZ * attackDistance;
  const bottomRightX = centerX + (attackWidth / 2) * rightX - forwardX * attackDistance;
  const bottomRightZ = centerZ + (attackWidth / 2) * rightZ - forwardZ * attackDistance;

  // 반환값을 꼭지점별로 묶어서 리턴
  return {
    topLeft: { x: topLeftX, z: topLeftZ },
    topRight: { x: topRightX, z: topRightZ },
    bottomLeft: { x: bottomLeftX, z: bottomLeftZ },
    bottomRight: { x: bottomRightX, z: bottomRightZ },
  };
};

// [내 주변 회전된 사각형 충돌 감지]
const isTargetInRotatedAreaAroundMe = (width, sourceTransform, targetTransform, rot = null) => {
  let sourceRot = rot;
  if (rot === null) {
    sourceRot = sourceTransform.rot; // 기본적으로 보스의 회전값을 사용
  }

  // 내 주변을 기준으로 회전된 사각형의 네 꼭지점 계산
  const { topLeft, topRight, bottomLeft, bottomRight } = calculateRotatedBoxAroundMe(
    width,
    sourceTransform,
    sourceRot,
  );

  // 대상이 내 주변의 회전된 사각형 범위 내에 있는지 체크 (최소/최대 좌표를 이용한 충돌 감지)
  const isTargetInRange =
    targetTransform.posX >= Math.min(topLeft.x, topRight.x, bottomLeft.x, bottomRight.x) &&
    targetTransform.posX <= Math.max(topLeft.x, topRight.x, bottomLeft.x, bottomRight.x) &&
    targetTransform.posZ >= Math.min(topLeft.z, topRight.z, bottomLeft.z, bottomRight.z) &&
    targetTransform.posZ <= Math.max(topLeft.z, topRight.z, bottomLeft.z, bottomRight.z);

  return isTargetInRange;
};

// [내 주변 회전된 사각형 생성]
const calculateRotatedBoxAroundMe = (width, sourceTransform, rot) => {
  const attackWidth = width; // 사각형의 폭 (내 주변을 기준으로 하는 폭)

  // 객체의 forward (앞) 방향 벡터
  const forwardX = Math.cos(rot); // 회전값에 따른 X 방향
  const forwardZ = Math.sin(rot); // 회전값에 따른 Z 방향

  // 객체의 오른쪽 방향 벡터 (회전된 X, Z 좌표)
  const rightX = -forwardZ;
  const rightZ = forwardX;

  // 원본 객체의 위치 (중심)
  const sourceX = sourceTransform.posX;
  const sourceZ = sourceTransform.posZ;

  // 공격 범위의 중심을 계산 (여기서는 범위가 0이므로 중앙 위치로 설정)
  const centerX = sourceX;
  const centerZ = sourceZ;

  // 사각형의 네 꼭지점 계산
  const topLeftX = centerX - (attackWidth / 2) * rightX;
  const topLeftZ = centerZ - (attackWidth / 2) * rightZ;
  const topRightX = centerX + (attackWidth / 2) * rightX;
  const topRightZ = centerZ + (attackWidth / 2) * rightZ;

  const bottomLeftX = centerX - (attackWidth / 2) * rightX;
  const bottomLeftZ = centerZ - (attackWidth / 2) * rightZ;
  const bottomRightX = centerX + (attackWidth / 2) * rightX;
  const bottomRightZ = centerZ + (attackWidth / 2) * rightZ;

  // 반환값: 네 꼭지점의 좌표를 포함하는 객체
  return {
    topLeft: { x: topLeftX, z: topLeftZ },
    topRight: { x: topRightX, z: topRightZ },
    bottomLeft: { x: bottomLeftX, z: bottomLeftZ },
    bottomRight: { x: bottomRightX, z: bottomRightZ },
  };
};

// [보스 - 사각형 생성]
const bossCalculateRectangleCorners = (
  currentTransform,
  center,
  direction,
  width,
  height,
  length,
) => {
  const halfWidth = width / 2;
  const halfLength = length / 2;
  const { posX, posZ } = currentTransform;

  // 방향 벡터를 기준으로 오른쪽 벡터 계산 (90도 회전)
  const right = { x: direction.z, z: -direction.x };
  const forward = { x: direction.x, z: direction.z };

  // 벡터 길이 계산 (정규화)
  const rightLength = Math.hypot(right.x, right.z);
  const forwardLength = Math.hypot(forward.x, forward.z);

  // 정규화 벡터
  const normRight = { x: right.x / rightLength, z: right.z / rightLength };
  const normForward = { x: forward.x / forwardLength, z: forward.z / forwardLength };

  console.log('Normalized Right: ', normRight);
  console.log('Normalized Forward: ', normForward);

  // 사각형 꼭짓점 계산
  const corners = [
    {
      x: center.x + normRight.x * halfWidth + normForward.x * halfLength,
      z: center.z + normRight.z * halfWidth + normForward.z * halfLength,
    }, // Top-Left
    {
      x: center.x - normRight.x * halfWidth + normForward.x * halfLength,
      z: center.z - normRight.z * halfWidth + normForward.z * halfLength,
    }, // Top-Right
    {
      x: center.x - normRight.x * halfWidth - normForward.x * halfLength,
      z: center.z - normRight.z * halfWidth - normForward.z * halfLength,
    }, // Bottom-Right
    {
      x: center.x + normRight.x * halfWidth - normForward.x * halfLength,
      z: center.z + normRight.z * halfWidth - normForward.z * halfLength,
    }, // Bottom-Left
  ];

  console.log('Rectangle Corners: ', corners);

  return corners;
};

// [보스 - 사각형 충돌]
// 유저 위치를 회전된 사각형의 로컬 좌표계로 변환 후 충돌 검사
const bossCheckRectangleCollision = (userPosition, corners) => {
  const { posX, posZ, rot } = userPosition; // 유저의 월드 좌표와 회전값
  const angle = -rot * (Math.PI / 180); // 유저 회전값을 라디안으로 변환

  // 사각형의 중심점 계산 (대각선 중간점)
  const centerX = (corners[0].x + corners[2].x) / 2;
  const centerZ = (corners[0].z + corners[2].z) / 2;

  // 유저의 위치를 사각형의 중심을 기준으로 변환
  const localPosX = posX - centerX;
  const localPosZ = posZ - centerZ;

  // 회전값을 반영하여 유저의 로컬 좌표 계산
  const rotatedPosX = localPosX * Math.cos(angle) + localPosZ * Math.sin(angle);
  const rotatedPosZ = -localPosX * Math.sin(angle) + localPosZ * Math.cos(angle);

  // 사각형의 축 벡터 계산 (회전된 방향)
  const axisX = corners[1].x - corners[0].x; // X 방향 벡터
  const axisZ = corners[2].z - corners[0].z; // Z 방향 벡터

  // 사각형의 크기 (반지름) 계산
  const halfWidth = Math.abs(axisX); // X 방향의 반 크기
  const halfHeight = Math.abs(axisZ); // Z 방향의 반 크기

  // SAT 충돌 검사
  return Math.abs(rotatedPosX) <= halfWidth && Math.abs(rotatedPosZ) <= halfHeight;
};

// [보스 - 부채꼴 충돌 검사]
// [보스 - 부채꼴 충돌 검사]
const bossCheckSectorCollision = (userPosition, center, direction, radius, angle) => {
  // 1. 삼각형의 세 점 계산 (부채꼴의 꼭지점)
  const halfAngle = angle / 2;
  const angle1 = Math.atan2(direction.z, direction.x) - halfAngle;
  const angle2 = Math.atan2(direction.z, direction.x) + halfAngle;

  const point1 = {
    x: center.x + radius * Math.cos(angle1),
    z: center.z + radius * Math.sin(angle1),
  };
  const point2 = {
    x: center.x + radius * Math.cos(angle2),
    z: center.z + radius * Math.sin(angle2),
  };

  // 2. 삼각형의 세 점과 유저 위치 비교 (삼각형 내부 검사)
  const triangleVertices = [center, point1, point2];
  const isInside = isPointInsideTriangle(userPosition, triangleVertices);

  return isInside; // 유저가 삼각형 내부에 있으면 충돌 O
};

// 삼각형 내부 점 검사 함수 (벡터 외적 사용)
const isPointInsideTriangle = (point, triangleVertices) => {
  const [v0, v1, v2] = triangleVertices;

  const dX1 = v1.x - v0.x;
  const dZ1 = v1.z - v0.z;
  const dX2 = v2.x - v0.x;
  const dZ2 = v2.z - v0.z;
  const dX3 = point.posX - v0.x;
  const dZ3 = point.posZ - v0.z;

  const cross1 = dX1 * dZ3 - dZ1 * dX3;
  const cross2 = dX2 * dZ3 - dZ2 * dX3;
  const cross3 = dX1 * dZ2 - dZ1 * dX2;

  return (cross1 >= 0 && cross2 >= 0 && cross3 >= 0) || (cross1 <= 0 && cross2 <= 0 && cross3 <= 0);
};

const movementUtils = {
  Distance: calculateDistance,
  DirectionAndVelocity: calculateDirectionAndVelocity,
  Rotation: calculateRotation,
  hasPassedTarget: hasPassedTarget,
  obbCollision: isInRotatedRange,
  obbBox: calculateRotatedBox,
  obbMyCollision: isTargetInRotatedAreaAroundMe,
  obbMyBox: calculateRotatedBoxAroundMe,

  BossCreateRectangle: bossCalculateRectangleCorners,
  BossRectangleCollision: bossCheckRectangleCollision,
  BossSectorCollision: bossCheckSectorCollision,
};

export default movementUtils;
