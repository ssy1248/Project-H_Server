import User from '../../classes/models/user.class.js';
import { PACKET_TYPE } from '../../constants/header.js';
import { findUserEmail } from '../../db/user/user.db.js';
import { packetNames } from '../../protobuf/packetNames.js';
import { addUser } from '../../session/user.session.js';
import { createResponse } from '../../utils/response/createResponse.js';

const validateUserInput = async (email, password, socket) => {
  try {
    // 이메일로 찾아보기
    const userData = await findUserEmail(email);
    if (!userData) throw new Error('일치하는 유저가 없습니다!');

    if (!(await bcrypt.compare(password, user.password)))
      throw new Error('비밀번호가 일치하지 않습니다!');

    const user = new User(socket, userData.id, userData.nickname);
    addUser(user);

    return createResponse(packetNames.user.S_LoginResponse, PACKET_TYPE.S_LOGINRESPONSE, {
      success: true,
      token: '',
      message: '로그인에 성공했습니다!',
      failCode: GlobalFailCode.NONE,
    });
  } catch (err) {
    return createResponse(packetNames.user.S_LoginResponse, PACKET_TYPE.S_LOGINRESPONSE, {
      success: false,
      token: '',
      message: err.message,
      failCode: GlobalFailCode.NONE,
    });
  }
};

/* 로그인 핸들러 */
const loginHandler = async (socket, payload) => {
  // email 와 password 받기
  const { email, password } = payload;
  const responsePayload = validateUserInput(email, password, socket);
  socket.write(responsePayload);
};

export default loginHandler;
