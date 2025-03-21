import { userSessions } from './sessions.js';
import { updateUserLocation } from '../db/user/user.db.js';

export const addUser = (user) => {
  userSessions.push(user);
  return user;
};

export const removeUser = (socket) => {
  const index = userSessions.findIndex((user) => user.userInfo.socket === socket);

  if (index !== -1) {
    const length = userSessions.length;
    const removedUser = userSessions.splice(index, 1)[0];

    return true;
  }
};

// id로 유저 찾기.
export const getUserById = (id) => {
  return userSessions.find((user) => user.userInfo.userId === id);
};

// 소캣으로 유저 찾기.
export const getUserBySocket = (socket) => {
  return userSessions.find((user) => user.userInfo.socket === socket);
};

// 닉네임으로 유저 찾기.
export const getUserByNickname = (nickname) => {
  return userSessions.find((user) => user.userInfo.nickname === nickname);
};

// 모든 유저 가져오기.
export const getAllUsers = () => {
  return userSessions;
};
// 타운에만 있는지 체크
export const getAllTownUsers = () => {
  return userSessions.filter((user) => {
    return user.inDungeonId === '';
  });
};

// 타운에 있는 모든 유저에게
export const broadcastTownAllUsers = (packet) => {
  const userData = userSessions.filter((user) => {
    return user.inDungeonId === '';
  });
  for (let user of userData) {
    user.userInfo.socket.write(packet);
  }
};

// 타운에 있는 나 제외 모든 유저에게
export const broadcastTownOtherUsers = (socket, packet) => {
  const userData = userSessions.filter((user) => {
    return user.inDungeonId === '' && user.userInfo.socket !== socket;
  });
  for (let user of userData) {
    user.userInfo.socket.write(packet);
  }
};

// [수정] 본인 제외 유저 소켓 가져오기 (스폰 되어있는 유저)
export const getOtherUserSockets = (socket) => {
  const userSockets = userSessions.filter(
    (user) => user.userInfo.socket !== socket && user.playerInfo.isSpawn === true,
  );
  return userSockets.map((user) => user.userInfo.socket);
};

// [추가] 본인을 제외한 유저 배열 (스폰 되어있는 유저)
export const getOtherUsers = (socket) => {
  const userSockets = userSessions.filter(
    (user) => user.userInfo.socket !== socket && user.playerInfo.isSpawn === true,
  );
  return userSockets;
};

// [수정] 모든 유저 소켓 가져오기. (스폰 되어있는 유저)
export const getAllUserSockets = () => {
  return userSessions
    .filter((user) => user.playerInfo.isSpawn === true)
    .map((user) => user.userInfo.socket);
};

// 브로드캐스트 (반복문) - 본인제외
export const broadcastToUsers = (socket, data) => {
  // 본인 제외 스폰되어있는 모든 유저
  const sockets = getOtherUserSockets(socket);

  // 반복문을 사용하여 개별적으로 메시지 전송
  for (const userSocket of sockets) {
    userSocket.write(data);
  }
};

// 브로드캐스트 (반복문) - 본인포함
export const broadcastToAllUsers = (data) => {
  // 본인 포함 스폰되어있는 모든 유저
  const sockets = getAllUserSockets();

  // 반복문을 사용하여 개별적으로 메시지 전송
  for (const userSocket of sockets) {
    userSocket.write(data);
  }
};

// 브로드캐스트 (프로미스ALL) - 본인제외
export const broadcastToUsersAsync = async (socket, data) => {
  // 본인 제외 스폰되어있는 모든 유저.
  const sockets = getOtherUserSockets(socket);

  // Promise.all을 사용한 병렬 처리 후 전송.
  const sendPromises = sockets.map((userSocket) => userSocket.write(data));
  console.log(`sendPromise => ${sendPromises}`);
  await Promise.all(sendPromises);
};

// 브로드캐스트 (프로미스ALL) - 본인포함
export const broadcastToAllUsersAsync = async (data) => {
  // 본인 포함 스폰되어있는 모든 유저.
  const sockets = getAllUserSockets();

  // Promise.all을 사용한 병렬 처리 후 전송.
  const sendPromises = sockets.map((userSocket) => userSocket.write(data));
  await Promise.all(sendPromises);
};
