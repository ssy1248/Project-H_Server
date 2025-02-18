import {
  getUserBySocket,
  getOtherUsers,
  broadcastToUsersAsync,
  getAllUsers,
  broadcastToUsers,
} from '../../session/user.session.js';
import {
  findCharacterByUserAndStatId,
  createCharacter,
  insertCharacterStats,
  getCharacterStatsCount,
} from '../../db/user/user.db.js';
import { getAllItems } from '../../db/inventory/item.db.js';
import { createResponse } from '../../utils/response/createResponse.js';
import { PACKET_TYPE } from '../../constants/header.js';
import User from '../../classes/models/user.class.js';
import { findEntitySync, addEntitySync } from '../../classes/managers/movementSync.manager.js';

const setCharacterStat = async () => {
  // 현재 테이블의 행 개수를 조회합니다.
  const count = await getCharacterStatsCount();
  console.log(`현재 캐릭터 스탯 행 개수: ${count}`);

  // 만약 이미 5개 이상 존재한다면 추가 삽입하지 않음.
  if (count >= 5) {
    console.log('이미 5개의 캐릭터 스탯이 존재합니다.');
    return;
  }

  // 부족한 개수만큼만 삽입 (예: 5 - count 개)
  const rowsToInsert = 5 - count;
  for (let i = 0; i < rowsToInsert; i++) {
    await insertCharacterStats(1, 1, 1, 1, 1);
  }
  console.log(`${rowsToInsert}개의 캐릭터 스탯이 추가되었습니다.`);
};

const spawnUserHandler = async (socket, packetData) => {
  // 1. C_SelectCharacterRequest 패킷을 받는다
  // 구조 분해 할당 (class → characterClass로 변경);
  // class는 예약어라 변수명 그대로 사용불가, 대채 이름을 설정해서 사용해야함.
  const { class: characterClass } = packetData;

  // 2. 소켓으로 유저 찾기.
  const user = getUserBySocket(socket);
  if (!user) {
    return console.log('해당 유저는 존재하지 않습니다.');
  }

  // 3. 케릭터 초기화.
  const userInfo = user.getUserInfo();
  await setCharacterStat();
  const character = await findOrCreateCharacter(userInfo.userId, characterClass);
  const characterData = initializeCharacter(character);
  user.init(characterData.playerInfo, characterData.playerStatInfo);

  // 4. 패킷 전송.
  syncSpawnedUser(socket, user);
};

// 유저의 특정 캐릭터가 존재하는지 확인하고, 없으면 새로 생성하는 함수.
const findOrCreateCharacter = async (userId, charStatId) => {
  try {
    console.log('캐릭터 조회/생성 시작:', userId, charStatId);
    // 1. 해당 유저의 특정 캐릭터 정보 조회
    let character = await findCharacterByUserAndStatId(userId, charStatId);

    // 2. 캐릭터가 존재하지 않으면 새로 생성 후 다시 조회
    if (!character) {
      await createCharacter(userId, charStatId);
      character = await findCharacterByUserAndStatId(userId, charStatId);
    }
    return character;
  } catch (error) {
    console.error('캐릭터 조회/생성 중 에러 발생:', error);
    return null; // 에러 발생 시 null 반환
  }
};

// 새로운 유저가 스폰될 때, 해당 유저에게 기존 스폰된 유저 정보를 보내고
// 동시에 다른 유저들에게 해당 유저가 새롭게 스폰되었음을 알리는 함수.
const syncSpawnedUser = async (socket, user) => {
  try {
    // 1. 본인에게 다른 유저들의 정보를 동기화하는 패킷 전송
    // 현재 스폰된 모든 유저 목록을 가져옴 (본인은 제외)
    const users = getAllUsers(socket);
    // 다른 유저들의 플레이어 정보를 패킷 데이터로 변환
    const playerData = users.map((value) => {
      
      // 유저 최신 좌표 가져오기.
      const userInfo = value.getUserInfo();
      const user = findEntitySync("town", userInfo.userId,"user");
      if(user !== null){
        value.setTransformInfo(user.currentTransform);
      }

      const playerInfo = createPlayerInfoPacketData(value);
      return playerInfo;
    });

    // 본인에게 보낼 패킷 데이터 구성 (다른 유저 정보 + (임시)상점 아이템 리스트)
    // 수정해야함!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
    const userInfo = user.getUserInfo();
    const sSpawn = {
      userId: userInfo.userId,
      players: playerData,
      storeList: getItemList(),
    };

    console.log(`유저 아이디 : ${userInfo.userId}, 플레이어 정보 : ${playerData}, 상점 아이템 리스트 : ${getItemList()}`);

    console.log(
      `유저 아이디 : ${
        userInfo.userId
      }, 플레이어 정보 : ${playerData}, 상점 아이템 리스트 : ${getItemList()}`,
    );

    // S_Enter 패킷 생성 후 전송 (본인의 게임 시작 처리)
    const initialResponse = createResponse('user', 'S_Spawn', PACKET_TYPE.S_SPAWN, sSpawn);
    await socket.write(initialResponse);

    // 본인을 스폰된 상태로 설정
    user.setIsSpawn(true);

    

    // 2. 다른 유저들에게 본인이 스폰되었음을 알리는 패킷 브로드캐스트
    const playerPacketData = createPlayerInfoPacketData(user);
    const sEnter = {
      player: playerPacketData,
    };

    // [테스트] 이동동기화 유저 추가
    addEntitySync('town', userInfo.userId, "user",  socket, playerPacketData.transform);

    // S_Spawn 패킷 생성 후 다른 유저들에게 브로드캐스트 (비동기 전송)
    const initialResponse2 = createResponse('user', 'S_Enter', PACKET_TYPE.S_ENTER, sEnter);
    //broadcastToUsersAsync(socket, initialResponse2);
    broadcastToUsers(socket, initialResponse2);

    const userCount = getAllUsers();
    console.log(`들어와 있는 유저 세션 : ${userCount.length}`);
  } catch (error) {
    // 에러 발생 시 null 반환
    console.error('패킷 전송 중 에러 발생:', error);
    return null;
  }
};

// 케릭터 초기화 함수.
// 데이터 베이스에서 불러온 케릭터 정보를 기반으로 플레이어 정보와 스탯 정보를 초기화.
const initializeCharacter = (result) => {
  const playerInfo = {
    playerClass: result.charStatId,
    gold: result.gold,
    level: result.level,
    exp: result.exp,
    isMove: false,
    isSpawn: false,
    charId: result.id,
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

// 아이템리스트 양식.
const getItemList = async () => {
  // 데이터 베이스에 있는 아이템리스트 가져오기
  const itemListData = await getAllItems();

  if (!Array.isArray(itemListData)) {
    console.error('아이템 리스트 데이터가 배열이 아닙니다:', itemListData);
    return [];
  }

  // map을 사용해서 id, price
  const itemList = itemListData.map(({ id, price }) => ({
    itemId: id,
    price: price,
  }));

  return itemList;
};

// 플레이어(케릭터) 정보 패킷을 생성하는 함수.
// 유저 객체를 기반으로, 해당 유저의 기본 정보와 스텟 정보를 포함한 패킷 데이터를 생성.
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
      speed: playerStatInfo.speed,
    },
  };

  return packetData;
};

export default spawnUserHandler;
