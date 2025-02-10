import User from '../../classes/models/user.class.js';
import { PACKET_TYPE } from '../../constants/header.js';
import bcrypt from 'bcrypt';
import { findUserEmail } from '../../db/user/user.db.js';
import { addUser } from '../../session/user.session.js';
import { GlobalFailCode } from '../../utils/game.data.js';
import { createResponse } from '../../utils/response/createResponse.js';
import { regex } from './register.handler.js';

const validateUserInput = async (email, password, socket) => {
  try {
    const isValidateEmail = regex.email.test(email);
    if (!isValidateEmail) throw new Error('이메일 규격에 일치하지 않습니다!');

    console.log(isValidateEmail);

    // 이메일로 유저 찾기
    const userData = await findUserEmail(email);
    if (!userData) throw new Error('일치하는 유저가 없습니다!');

    // 비밀번호 비교
    let passwordMatch = false;
    passwordMatch = await bcrypt.compare(password, userData.password);
    if (!passwordMatch) throw new Error('비밀번호가 일치하지 않습니다!');

    // 유저 생성 및 추가
    const user = new User(socket, userData.id, userData.nickname);
    addUser(user);

    console.log(user);
    return createResponse('user', 'S_LoginResponse', PACKET_TYPE.S_LOGINRESPONSE, {
      success: true,
      token: '',
      message: '로그인에 성공했습니다!',
      failCode: GlobalFailCode.NONE,
    });
  } catch (err) {
    return createResponse('user', 'S_LoginResponse', PACKET_TYPE.S_LOGINRESPONSE, {
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
  const responsePayload = await validateUserInput(email, password, socket);
  console.log(responsePayload);
  socket.write(responsePayload);
};

export default loginHandler;
