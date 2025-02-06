import { addUser } from '../../session/user.session.js'
import { User } from '../../classes/models/user.class.js'

const spawnUserHandler = async (socket, packetData) => {
  console.log('테스트');

  // 1. C_SelectCharacterRequest 패킷을 받는다
  // 구조 분해 할당 (class → characterClass로 변경);
  // class는 예약어라 변수명 그대로 사용불가, 대채 이름을 설정해서 사용해야함.
  const { nickname, class: characterClass } = packetData;

  // 유저가 만들어지는 시점은 언제인가.? 
  // 만약에 케릭터 이전에 만들어진다면.
  // 유저 세션에서 정보를 불러와야한다. 

  // 아니라면 여기서 유저를 생성해서 넣어야하는데 그건 좀 이상한듯?
  // 유저클래스 수정 해야할듯.
  // 유저를 생성할때 socket, id, nickname, gameClass 매개변수를 받는다.
  // 그리고 내무에 생성자와 초기화 함수가 있다.
  // gameClass를 초기화 함수에 빼버리면 될것같다.
  // 그러면 여기서 유저 세션에서 닉네임으로 검색해서 
  // 초기화 진행. 
  // 유저 세션도 수정 들어가야할듯.
  // 닉네임으로 유저검색, 전체 유저 가져오기, 본인만 제외하고 가져오기.

  // 상점 리스트를 어떻게 가져와야하는가.?
  // 이것도 고려해야함. 


  // 변경해서 한다고 한다면.
  // 1. 유저를 검색해서 초기화한다. (클래스)
  // 2. 그리고 S_Enter 패킷을 보낸다.  (상점 리스트를 가져와야한다.)
  // 3. 전체 유저를 검색하고 S_Spawn을 보낸다. 

  

  // [C_SelectCharacterRequest 패킷을 받는다] 
  // nickname, class

  // [세션에 유저를 생성한다.]

  // [내정보를 보낸다] 
  // 플레이어정보 , 상점 리스트.

  // [내정보를 브로드 캐스트.]
  // 플레이어 정보. 
};

export default spawnUserHandler;