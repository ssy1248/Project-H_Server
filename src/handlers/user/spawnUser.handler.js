import { addUser } from '../../session/user.session.js'
import { User } from '../../classes/models/user.class.js'

const spawnUserHandler = async (socket, packetData) => {
  console.log('테스트');

  // [C_SelectCharacterRequest 패킷을 받는다] 
  // nickname, class

  // [세션에 유저를 생성한다.]

  // [내정보를 보낸다] 
  // 플레이어정보 , 상점 리스트.

  // [내정보를 브로드 캐스트.]
  // 플레이어 정보. 
};

export default spawnUserHandler;