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
const bossCalculateRectangleCorners = (center, direction, width, height, length) => {
  const halfWidth = width / 2;
  const halfLength = length / 2; // height는 필요 없음 (XZ 평면 기준)

  // 방향 벡터를 기준으로 사각형의 4개 코너를 계산
  const right = { x: direction.x * halfWidth, z: direction.z * halfWidth };
  const forward = { x: -direction.z * halfLength, z: direction.x * halfLength }; // 회전 고려

  // 4개의 모서리 좌표 계산
  const corners = [
    { x: center.x + right.x + forward.x, z: center.z + right.z + forward.z }, // Top-Right
    { x: center.x - right.x + forward.x, z: center.z - right.z + forward.z }, // Top-Left
    { x: center.x + right.x - forward.x, z: center.z + right.z - forward.z }, // Bottom-Right
    { x: center.x - right.x - forward.x, z: center.z - right.z - forward.z }, // Bottom-Left
  ];

  return corners;
};


// [보스 - 사각형 충돌]
const bossCheckRectangleCollision = (userPosition, corners) => {
  // 사각형 내부에 유저가 있는지 확인하는 로직 (단순히 x, y좌표 기준으로)
  const { posX, posZ } = userPosition;

  // 사각형의 두 점 사이의 거리를 확인
  const minX = Math.min(corners[0].x, corners[3].x);
  const maxX = Math.max(corners[1].x, corners[2].x);
  const minZ = Math.min(corners[0].z, corners[1].z);
  const maxZ = Math.max(corners[2].z, corners[3].z);

  return posX >= minX && posX <= maxX && posZ >= minZ && posZ <= maxZ;
}

// [보스 - 부채꼴 충돌 검사]
const bossCheckSectorCollision = (userPosition, center, direction, radius, angle) => {
  // 1. 중심점과 유저 거리 계산
  const dx = userPosition.posX - center.x;
  const dz = userPosition.posZ - center.z;
  const distanceSquared = dx * dx + dz * dz;

  if (distanceSquared > radius * radius) return false; // 반지름 바깥이면 충돌 X

  // 2. 방향 벡터와 유저 벡터의 각도 비교
  const userAngle = Math.atan2(dz, dx); // 유저 방향 (라디안)
  const forwardAngle = Math.atan2(direction.z, direction.x); // 보스 방향 (라디안)
  
  let angleDiff = userAngle - forwardAngle;
  angleDiff = ((angleDiff + Math.PI) % (2 * Math.PI)) - Math.PI; // -π ~ π 범위로 변환

  return Math.abs(angleDiff) <= angle / 2; // 부채꼴 각도 내에 있으면 충돌 O
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
