import { MAX_POSITION_DIFFERENCE, MAX_ROTATION_DIFFERENCE, CLIENT_TIME_OFFSET } from '../../constants/constants.js';
import { createResponse } from '../../utils/response/createResponse.js';

export default class MovementSync {
  // 생성자.
  constructor() {
    this.movementSyncId = 0; // 고유 ID
    this.userSyncs = {}; // 유저 정보를 담을 객체.
    this.snapshotTime = Date.now();
    this.interval = 0;

    // 인터벌 시작.
    this.startMovementProcess();

    // 임시로 만든것 (페킷을 큐로 받아서... 이하 생략. )
    this.movementQueue = {}; // 이동 데이터 큐 (클라이언트에서 받은 데이터)
  }

  // [유저 추가]
  addUserSync(userId, socket, Transform) {
    const userSyncInfo = {
      userId: userId,
      socket: socket,
      previousTransform: {
        posX: Transform.posX,
        posY: Transform.posY,
        posZ: Transform.posZ,
        rot: Transform.rot,
      },
      currentTransform: {
        posX: Transform.posX,
        posY: Transform.posY,
        posZ: Transform.posZ,
        rot: Transform.rot,
      },
      latency: 0,
      lastUpdateTime: Date.now(),
    };

    this.userSyncs[userId] = userSyncInfo;
  }

  // [유저 찾기]
  findUserSync(userId) {
    if (this.userSyncs[userId]) {
      return this.userSyncs[userId];
    }
    return null;
  }

  // [유저 업데이트]
  updateUserSync(userId, transform, timestamp) {
    // [검증] 서버에서 마지막으로 보낸 트랜스폼과 클라에서 보낸 트랜스폼을 비교.
    const value = this.validateTransform(transform, this.userSyncs[userId].currentTransform);

    if (value) {
      // 레이턴시(핑)
      this.userSyncs[userId].latency = this.computeNetworkDelay(timestamp);
      // 현재 트랜스폼, 과거 트랜스폼 갱신.
      this.userSyncs[userId].previousTransform = this.userSyncs[userId].currentTransform;
      this.userSyncs[userId].currentTransform = transform;
      // 마지막 업데이트 갱신.
      this.userSyncs[userId].lastUpdateTime = Date.now();
    }
  }

  // [유저 삭제]
  deleteUserSync(userId) {
    if (this.userSyncs[userId]) {
      delete this.userSyncs[userId];
      return true;
    }
    return false;
  }

  // [ 메인 로직 ]
  async processMovement() {
    // 100ms마다 이동 관련 로직을 실행
    this.interval = setInterval(async () => {
      const userSyncsSize = Object.keys(this.userSyncs).length;
      // 유저들이 있을때만 메인 로직 실행.
      if (userSyncsSize !== 0) {
        // 변경된 유저들만 찾는다.
        const changedUsers = this.userSyncs
          .filter(([value]) => value.lastUpdateTime > this.snapshotTime)
          .map(([value]) => value);

        // 변경된 유저들이 있을 경우 로직 실행. 
        if (changedUsers.length !== 0) {
          // 변경된 유저들로 패킷을 만들자.
          const syncTransformInfoDatas = [];
          changedUsers.forEach((user) => {
            const syncData = this.createSyncTransformInfoData(user);
            syncTransformInfoDatas.push(syncData);
          });

          const sMove = {
            transformInfos: syncTransformInfoDatas,
          };

          // 만들어진 패킷을 직렬화.
          const initialResponse = createResponse('town', 'S_Move', PACKET_TYPE.S_MOVE, sMove);

          // 브로드캐스트.
          await this.broadcastChangedUsers(changedUsers, initialResponse);

          // 스냅샷 시간 갱신
          this.snapshotTime = Date.now();
        }
      }
    }, 100);
  }

  // [메인 로직 시작]
  startMovementProcess() {
    this.processMovement(); // 메서드를 별도로 호출
  }

  // [메인 로직 종료]
  endProcessMovement() {
    clearInterval(this.interval); // 반복 종료
  }

  // [ 패킷 생성 ]
  createSyncTransformInfoData(user) {
    const SyncTransformInfo = {
      playerId: user.userId,
      TransformInfo: user.currentTransform,
      estimatedArrivalTime: this.CalculateEstimatedArrivalTime(user.userId),
    };
    return SyncTransformInfo;
  }

  // [ 레이 턴시 ]
  computeNetworkDelay(timestamp) {
    // 현재 방식은 핑이 정확하지않음
    // 이유는 유니티의 현재시간과 js현재시간의 차이가 있을수 있음.
    // 유니티 DateTime.UtcNow.Ticks / 10_000 → UTC 기준 밀리초
    // JS Date.now() → UTC 기준 밀리초
    // 이론상으론 차이없다고는 하지만
    // 일부 플랫폼(모바일,브라우저)에선 클라시간이 흐트러질 수도 있다고함.
    // (예: 모바일 절전 모드, FPS 드랍, 운영체제 시간 변경 등.)

    // 차이가 나도 문제가 없는 이유
    // 클라가 이동할 때 매번 패킷을 보내고, 100ms마다 서버에서 스냅샷을 보냄
    // 아주 미세한 시간 차이는 누적되기 전까지 큰 문제가 되지 않음
    // 핑(Ping)이 정확하지 않아도 보간(Interpolation)과 추측항법으로 보정 가능

    // 문제가 발생시 그때 핑퐁 방식으로 변경.

    const ping = (Date.now() - timestamp) * 2; // 핑 계산
    return ping;
  }

  // [예상 도착 시간 계산]
  CalculateEstimatedArrivalTime(userId) {
    const snapshotTime = Date.now(); // 서버 시간
    const latency = this.userSyncs[userId].latency;

    // 예상 도착 시간 = snapshotTime + (ping / 2)
    const estimatedArrivalTime = snapshotTime + (latency / 2) + CLIENT_TIME_OFFSET;
    return estimatedArrivalTime;
  }

  // [트랜스폼 검증]
  validateTransform(previousTransform, currentTransform) {
    // 1. 위치 차이 계산:  이전 위치와 현재 위치의 차이를 구합니다.
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
  }

  // 브로드캐스트
  async broadcastChangedUsers(changedUsers, initialResponse) {
    // 모든 유저에게 비동기적으로 패킷 전송
    const promises = changedUsers.map((user) => {
      // 유저의 소켓을 통해 패킷 전송 (응답 없음)
      user.socket.write(initialResponse);
      return Promise.resolve(); // 바로 resolve
    });

    // 모든 프로미스가 완료될 때까지 대기
    await Promise.all(promises);
  }
}
