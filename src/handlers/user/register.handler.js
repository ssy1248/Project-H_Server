import bcrypt from 'bcrypt';

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
  const isValidateEmail = regex.email.test(email);
  if (!isValidateEmail) return '';
  // 이름 검증
  if (nickname === '') return '';
  // 비밀번호 검증
  const isValidatePw = regex.pw.test(password);
  if (!isValidatePw) return '';
  // 비밀번호 암호화
  const hashedPassword = await bcrypt.hash(password, 5);
  try {
  } catch (err) {}
};

/* 회원가입 핸들러 */
const registerHandler = async (socket, payload) => {
  try {
    //  요청 페이로드에서 가입 정보 추출
    const { email, nickname, password } = payload;
    //  가입 정보 검증 후 응답 페이로드 준비
    const responsePayload = await validateUserInput(email, nickname, password);
    socket.write(responsePayload);
  } catch (err) {}
};
