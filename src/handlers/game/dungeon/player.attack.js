import CustomError from '../../../utils/error/customError.js';
import { ErrorCodes } from '../../../utils/error/errorCodes.js';
import { handlerError } from '../../../utils/error/errorHandler.js';

import { createResponse } from '../../../utils/response/createResponse.js';
import { PACKET_TYPE } from '../../../constants/header.js';
import { getUserById } from '../../../session/user.session.js';

const playerAttack = (socket, packetData) => {
  try {
    //캐릭터 아이디, 좌표,
    const {} = packetData;
    //유저오 유저 클래스 확인
    const user = getUserById(socket);

    //유저가 없을 경우
    if (!user) {
      console.error('공격자을 찾을 수 없습니다.');
      return;
    }
    const userNickName = user.userInfo.nickname;
    const userClass = user.playerInfo.playerClass;

    const dungeon = getDungeonInPlayerName(attackerName);

    //화살을 기억하는 방법을쓰자

    //유저와 타켓 사이의 거리를 계산
    const dx = posA.x - posB.x;
    const dy = posA.y - posB.y;
    const dz = posA.z - posB.z;
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

    //일단 쿨타임을 생각하자
    if (distance > 10) {
      // 10 -> player의 normalAttack.attackRange
      console.log('타겟이 공격 범위 밖에 있습니다.');
      return;
    }

    //지금 궁수인 경우를 생각해보자

    //그러면 화살을 쏜 좌표 + 화살을 쏜 방향 + 화살의 속력  화살의 사이즈도 필요하나?
    //그래서 방향과 속력으로 화살의 좌표를 구하고
    //만약 일정시간이 지나거나 일정 거리를 가거나 몬스터에 맞으면 소멸한다.
    //근데 여기서

    socket.write();
  } catch (e) {
    handlerError(socket, e);
  }
};

export default playerAttack;
