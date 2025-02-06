import bcrypt from 'bcrypt';
import { createUser } from '../../db/user/user.db.js';
import { createResponse } from '../../utils/response/createResponse.js';
import { PACKET_TYPE } from '../../constants/header';
import { GlobalFailCode } from '../../utils/game.data.js';

// 나중에 .env나 상수로 따로 관리
const HASH_ROUNDS = 5;

/* 비번, 이메일 정규식 */
const regex = {
  // 비밀번호는 최소 네자리, 영소문자 또는 숫자로만
  pw: /^[a-z0-9]{4,}$/,
  // 이메일은 일반적인 이메일 형식
  email: /^[a-z0-9]+@[a-z]+\.[a-z]{2,}$/,
};

/* 검증 함수 */
const validateUserInput = async (email, nickname, password) => {
  // 이메일 검증
  try {
    const isValidateEmail = regex.email.test(email);
    if (!isValidateEmail) throw new Error('이메일 규격에 일치하지 않습니다!');
    // 이름 검증
    if (nickname === '') throw new Error('이름이 빈칸입니다!');
    // 비밀번호 검증
    const isValidatePw = regex.pw.test(password);
    if (!isValidatePw) throw new Error('비밀번호가 일치하지 않습니다!');
    // 비밀번호 암호화
    const hashedPassword = await bcrypt.hash(password, HASH_ROUNDS);
    const isSuccessful = await createUser(email, nickname, hashedPassword);
    if (isSuccessful.success) {
      return createResponse(PACKET_TYPE.S_REGISTERRESPONSE, 'game', 'S_REGISTERRESPONSE', {
        success: true,
        message: '회원가입에 성공했습니다!',
        failCode: GlobalFailCode.NONE,
      });
    } else {
      throw new Error('이메일 또는 아이디가 중복됩니다.');
    }
  } catch (err) {
    return createResponse(PACKET_TYPE.S_REGISTERRESPONSE, 'game', 'S_REGISTERRESPONSE', {
      success: false,
      message: err.message,
      failCode: GlobalFailCode.NONE,
    });
  }
};

/* 회원가입 핸들러 */
const registerHandler = async (socket, payload) => {
  //  요청 페이로드에서 가입 정보 추출
  const { email, nickname, password } = payload;
  //  가입 정보 검증 후 응답 페이로드 준비
  const responsePayload = await validateUserInput(email, nickname, password);
  socket.write(responsePayload);
};
