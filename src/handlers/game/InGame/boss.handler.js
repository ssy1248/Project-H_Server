import { PACKET_TYPE } from '../../../constants/header.js';
import { createResponse } from '../../../utils/response/createResponse.js';

const attacks = [];

export const bossSkillReadyHandler = (socket, packetData) => {
  try {
    const { bossId } = packetData;

    // 1. 보스와 던전 정보를 데이터베이스나 게임 데이터에서 찾아옵니다.
    const boss = getBossById(bossId); // 보스를 ID로 찾기
    if (!boss) {
      throw new Error(`Boss with id ${bossId} not found`);
    }

    const dungeon = getDungeonByBossId(bossId); // 보스가 속한 던전 찾기
    if (!dungeon) {
      throw new Error(`Dungeon not found for boss ${bossId}`);
    }

    // 2. 여러 개의 원형 범위 공격을 생성합니다.
    const attackCount = 5; // 생성할 원형 범위의 개수 (예: 5개)
    for (let i = 0; i < attackCount; i++) {
      // 보스와 던전을 기반으로 각 원형 공격 생성
      const attack = createRandomCircleAttack(boss, dungeon);
      attacks.push(attack); // 공격 목록에 추가
    }

    // 3. 원형 범위 정보를 클라이언트에 전송
    const bossSkillReadyPayload = {
      attacks, // 생성된 공격 정보
    };

    // 패킷 응답 생성
    const bossSkillReadyResponse = createResponse(
      'dungeon', // 대상
      'S_bossSkillReady', // 응답 타입
      PACKET_TYPE.S_BOSSSKILLREADY, // 패킷 타입
      bossSkillReadyPayload, // 페이로드
    );

    // 클라이언트에 응답 전송
    socket.write(bossSkillReadyResponse);

    // 4. 일정 시간(예: 3초) 후에 플레이어가 범위에 있는지 확인
    const damageDelay = 3000; // 3초 후에 데미지 계산 (시간 조정 가능)
    setTimeout(() => {
      // 5. 모든 원형 범위에 대해 병렬로 유저 체크 후 데미지 계산
      checkPlayersInCircleRangeParallel(dungeon) // 던전 객체 전달
        .then(() => {
          // 6. 플레이어 범위 확인 후 클라이언트에 결과를 전송
          const damageAppliedPayload = {
            attacks, // 공격 정보 (범위 내 플레이어 확인 후 업데이트된 정보)
          };

          // 패킷 응답 생성
          const damageAppliedResponse = createResponse(
            'dungeon', // 대상
            'S_damageApplied', // 응답 타입
            PACKET_TYPE.S_DAMAGEAPPLIED, // 패킷 타입
            damageAppliedPayload, // 페이로드
          );

          // 클라이언트에 데미지 적용 결과 전송
          socket.write(damageAppliedResponse);
        })
        .catch((err) => {
          // 플레이어 범위 확인 중 오류가 발생한 경우
          console.error('Error checking players in range:', err);
        });
    }, damageDelay); // 설정한 시간 후에 플레이어 범위 확인 시작
  } catch (e) {
    // 전체 처리 중 오류가 발생한 경우
    console.error(socket, e);
  }
};

const createRandomCircleAttack = (boss, dungeon) => {
  const radius = 10; // 고정된 반경 (원 크기)
  const mapWidth = dungeon.width; // 던전의 가로 크기
  const mapHeight = dungeon.height; // 던전의 세로 크기

  // 맵 크기 내에서 랜덤 좌표 생성
  const x = Math.random() * (mapWidth - 2 * radius) + radius; // x 좌표
  const y = Math.random() * (mapHeight - 2 * radius) + radius; // y 좌표

  // 원형 공격 객체 생성
  const attack = {
    id: `${boss.id}_attack_${Date.now()}`, // 고유한 공격 ID
    bossId: boss.id, // 보스 ID
    position: { x, y }, // 공격의 중심 좌표
    radius, // 원의 반경
    damage: 50, // 고정된 데미지 값 (예시)
    createdAt: Date.now(), // 공격 생성 시간
    duration: 3000, // 공격이 지속되는 시간 (3초)
  };

  console.log(`Attack created at position: ${attack.position.x}, ${attack.position.y}`);

  return attack;
};

// 모든 공격에 대해 비동기로 플레이어를 체크하는 병렬 처리 함수
const checkPlayersInCircleRangeParallel = async (dungeon) => {
  const playerPositions = dungeon.getAllPlayerPositions(); // 던전 객체에서 플레이어 위치 가져오기

  // 각 공격에 대해 비동기로 플레이어를 체크
  const promises = attacks.map(
    (attack) =>
      new Promise((resolve) => {
        const playersHit = new Map(); // 플레이어별로 겹친 공격 목록을 저장할 맵

        playerPositions.forEach((player) => {
          // 플레이어와 공격 중심 사이의 거리 계산
          const distance = Math.sqrt(
            (player.x - attack.position.x) ** 2 + (player.y - attack.position.y) ** 2,
          );

          // 플레이어가 공격 범위 내에 있으면 데미지 적용
          if (distance <= attack.radius) {
            console.log(`플레이어 ${player.name}이 공격 ${attack.id}의 범위 내에 있습니다.`);

            // 플레이어가 이미 겹친 공격 목록을 가지고 있다면 그 공격 목록에 현재 공격을 추가
            if (!playersHit.has(player.name)) {
              playersHit.set(player.name, []);
            }
            playersHit.get(player.name).push(attack); // 해당 플레이어가 겹친 공격 목록에 현재 공격 추가
          }
        });

        // 플레이어들이 여러 공격에 걸쳤다면, 중복된 데미지를 경감시키는 로직
        playersHit.forEach((attacksForPlayer, playerName) => {
          const player = playerPositions.find((p) => p.name === playerName);

          // 겹친 공격 수에 따라 데미지 비율을 조정
          let damageRatio = 1;
          const overlappingAttacks = attacksForPlayer.length;

          if (overlappingAttacks === 2) {
            damageRatio = 0.6; // 2개 겹칠 때 각 공격의 데미지는 60%
          } else if (overlappingAttacks === 3) {
            damageRatio = 0.4; // 3개 겹칠 때 각 공격의 데미지는 40%
          } else if (overlappingAttacks > 3) {
            damageRatio = 0.3; // 4개 이상의 겹침이면, 데미지 30%
          }

          // 각 공격에 적용할 데미지 계산 (겹친 공격에 대해 동일한 데미지를 한 번만 적용)
          const totalReducedDamage = attacksForPlayer.reduce(
            (totalDamage, attack) => totalDamage + attack.damage * damageRatio,
            0,
          );

          console.log(
            `플레이어 ${player.name}은 ${overlappingAttacks}개의 공격에 의해 총 ${totalReducedDamage}만큼 피해를 입습니다.`,
          );

          // 데미지를 입은 플레이어는 `processHitHandler`로 넘기기 (겹치는 공격을 하나로 묶어 처리)
          processHitHandler([player], {
            ...attacksForPlayer[0], // 공격의 첫 번째 데이터를 가져오되, 데미지는 총합으로
            damage: totalReducedDamage,
          });
        });

        resolve(); // 해당 공격에 대한 체크가 완료되면 resolve
      }),
  );

  // 모든 공격에 대한 플레이어 체크가 완료될 때까지 기다림
  await Promise.all(promises);
};
