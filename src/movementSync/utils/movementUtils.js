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
  let sourceRot = rot
  if(rot === null) {
    sourceRot = targetTransform.rot
  }
  
  // 공격 범위의 네 꼭지점 계산
  const { topLeft, topRight, bottomLeft, bottomRight } = calculateRotatedBox(range, width, sourceTransform, sourceRot);

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
    bottomRight: { x: bottomRightX, z: bottomRightZ }
  };
};



const movementUtils = {
  Distance: calculateDistance,
  DirectionAndVelocity: calculateDirectionAndVelocity,
  Rotation: calculateRotation,
  hasPassedTarget: hasPassedTarget,
  obbCollision:isInRotatedRange,
  obbBox: calculateRotatedBox,
};

export default movementUtils;
