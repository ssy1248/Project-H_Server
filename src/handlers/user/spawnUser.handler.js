import { getUserByNickname, getOtherUserSockets, getOtherUsers, broadcastToUsersAsync } from '../../session/user.session.js';
import {
  findCharacterByUserId,
  findCharacterStatsById,
  createCharacter,
} from '../../db/user/user.db.js';
import { createResponse } from '../../utils/response/createResponse.js';
import { packetNames } from '../../protobuf/packetNames.js';
import { PACKET_TYPE } from '../../constants/header.js';
import User from '../../classes/models/user.class.js';

const spawnUserHandler = async (socket, packetData) => {
  console.log('테스트');

  // 1. C_SelectCharacterRequest 패킷을 받는다
  // 구조 분해 할당 (class → characterClass로 변경);
  // class는 예약어라 변수명 그대로 사용불가, 대채 이름을 설정해서 사용해야함.
  const { nickname, class: characterClass } = packetData;

  // 2. 닉네임으로 유저 찾기.
  const user = getUserByNickname(nickname);
  if (!user) {
    return console.log('해당 유저는 존재하지 않습니다.');
  }

  // 3. 케릭터 초기화.
  try {
    // 3-1. 유저Id 로 케릭터가 데이터베이스에 있는지 확인.
    const userInfo = user.getUserInfo();
    const character = await findCharacterByUserId(userInfo.userId);
    let characterData;

    // 3-2. 있다면 기존 정보로 초기화, 없다면 새로 생성.
    if (!character) {
      const newCharacter = await findCharacterStatsById(characterClass);

      if (!newCharacter) {
        return console.log('해당 케릭터는 존재하지 않습니다.');
      }

      characterData = initializeCharacter(newCharacter, characterClass, true);

      // DB에 새로 생성.
      const { playerClass, gold, level, exp } = characterData;
      const result = await createCharacter(userInfo.userId, playerClass, gold, level, exp);

      if (!result) {
        return console.log('DB에 저장실패.');
      }
    } else {
      characterData = initializeCharacter(character, characterClass);
    }

    // 3-3. 케릭터 초기화
    user.init(characterClass, characterData.playerInfo, characterData.playerStatInfo);
  } catch (error) {
    console.error('에러 :', error);
  }

  // 4. 메세지 전송.
  try {
    // [수정] 4-1. (S_Spawn) 클라이언트에게 현재 스폰되어있는 유저 정보를 전송.
    // 본인을 제외한 유저 정보를 가져오자.
    const users = getOtherUsers(socket);
    // 플레이어(유저)들의 정보를 담을 배열.
    const playerData = [];

    // 패킷데이터 형식으로 바꿔서 담는다.
    for(let value of users){
      playerData.push(createPlayerInfoPacketData(value));
    }

    // 패킷데이터
    const sSpawn = {
      players: playerData,
      storeList: testItemList(),
    }
    
    // 직렬화후 전송.
    const initialResponse = createResponse(packetNames.game.S_Enter, PACKET_TYPE.S_ENTER, sSpawn);
    await socket.write(initialResponse);

    // isSpawn을 true로 변경.
    user.setIsSpawn(true);

    // [수정] 4-2. (S_Enter) 스폰되어있는 모든 유저에게 본인의 정보를 보냄. 
    // 페킷데이터 만듬.
    const sEnter = {
      player: createPlayerInfoPacketData(),
    };

    // 직렬화 
    const initialResponse2 = createResponse(packetNames.game.S_Spawn, PACKET_TYPE.SPAWN, sEnter);

    // 브로드 캐스트
    broadcastToUsersAsync(socket, initialResponse2);

  } catch (error) {
    console.error('에러 :', error);
  }

};

// 케릭터 초기화 정보. (수정)
const initializeCharacter = (result, characterClass, isNewCharacter = false) => {
  const playerInfo = {
    playerClass: characterClass,
    gold: !isNewCharacter ? result.gold : 0,
    level: !isNewCharacter ? result.level : 1,
    exp: !isNewCharacter ? result.exp : 0,
    isMove: false,
  };
  const playerStatInfo = {
    hp: result.hp,
    maxHp: result.hp,
    mp: result.mp,
    maxMp: result.mp,
    atk: result.atk,
    def: result.def,
    speed: result.speed,
  };

  return { playerInfo, playerStatInfo };
};

// 임시로 쓸 아이템리스트 양식.
const testItemList = () => {
  const itemList = [
    { itemId: 0, price: 1000 },
    { itemId: 1, price: 1000 },
    { itemId: 2, price: 1000 },
    { itemId: 3, price: 1000 },
    { itemId: 4, price: 1000 },
  ];

  return itemList;
};

// 패킷 데이터를 만들자.
const createPlayerInfoPacketData = (user) => {
  const userInfo = user.getUserInfo();
  const playerInfo = user.getPlayerInfo();
  const playerStatInfo = user.getPlayerStatInfo();
  const transformInfo = user.getTransformInfo();

  const packetData = {
    playerId: userInfo.userId,
    nickname: userInfo.nickname,
    class: playerInfo.playerClass,
    transform: {
      posX: transformInfo.posX,
      posY: transformInfo.posY,
      posZ: transformInfo.posZ,
      rot: transformInfo.rot,
    },
    statInfo: {
      level: playerInfo.level,
      hp: playerStatInfo.hp,
      maxHp: playerStatInfo.maxHp,
      mp: playerStatInfo.mp,
      maxMp: playerStatInfo.maxMp,
      atk: playerStatInfo.atk,
      def: playerStatInfo.def,
      //magic: 0, // DB 기준엔 없다..
      speed: playerStatInfo.speed,
    },
  };

  return packetData;
};

export default spawnUserHandler;

// 내일 해야할 것 (오전).
// 0. 프로토콜 수정해야함. (완료)
// 1. S_Enter(브로드캐스트), S_Spawn(본인) 역활이 반대임. (완료)
// 2. 케릭터의 원본데이터 디폴트값이 있다. (물어봐야함.) 
// 3. 브로드캐스트를 유저 세션에서 만들자. (완료.)


// 1. 원본 테이블 케릭터 디폴트 값 있습니다.
// 2. 현재 한유저가 여러 플레이어 

  /*
 message S_Spawn {
    repeated PlayerInfo players = 1;
}
  */

/**
 *   message PlayerInfo {
    int32 playerId = 1;   // 입장할때 서버 내부에서 생성한 관리코드
    string nickname = 2;  // C_EnterGame 에서 지정한 이름
    int32 class = 3;      // C_EnterGame 에서 지정한 직업 정보, 이 정보를 통해 캐릭터가 결정
    TransformInfo transform = 4;
    StatInfo statInfo = 5;
  }
 */

/**
 *   message TransformInfo {
    float posX = 1; // 기본값 : -9 ~ 9
    float posY = 2; // 기본값 : 1
    float posZ = 3; // 기본값 : -8 ~ 8
    float rot = 4; // 기본값 : 0~360
  }
 */

/**
 *   message StatInfo {
    int32 level = 1;
    float hp = 2;
    float maxHp = 3;
    float mp = 4;
    float maxMp = 5;
    float atk = 6;
    float def = 7;
    float magic = 8;
    float speed = 9; 
  }
  }
 */
