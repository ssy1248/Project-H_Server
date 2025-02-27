// 두 지점 사이의 거리 계산 함수
// 주어진 이전 위치(previousTransform)와 현재 위치(currentTransform) 간의 3D 거리 차이를 계산합니다.
const calculateDistance = (previousTransform, currentTransform) => {
  if(previousTransform === currentTransform){
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

  // pitch 계산: 수직 회전 각도, y축(높이)과 xz평면의 거리 차이를 기준으로 회전 각도를 구함
  const distanceXZ = Math.sqrt(deltaX * deltaX + deltaZ * deltaZ);
  const pitch = Math.atan2(deltaY, distanceXZ) * (180 / Math.PI);

  // 계산된 yaw와 pitch 반환
  return { yaw, pitch };
};

// 한개 더추가 하자.
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

  //console.log(distanceToTarget);
  // 내적이 음수이면 지나쳤다고 판단 (이동 방향이 목표를 지나쳤을 경우)
  return dotProduct < 0;
};

const movementUtils = {
  Distance: calculateDistance,
  DirectionAndVelocity: calculateDirectionAndVelocity,
  Rotation: calculateRotation,
  hasPassedTarget: hasPassedTarget,
};

export default movementUtils;
