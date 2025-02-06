import { userSessions } from './sessions.js';
import { updateUserLocation } from '../db/user/user.db.js';

export const addUser = (user) => {
  userSessions.push(user);
  return user;
};

export const removeUser = async (socket) => {
  const index = userSessions.findIndex((user) => user.socket === socket);
  if (index !== -1) {
    return userSessions.splice(index, 1)[0];
  }
};

// id로 유저 찾기. 
export const getUserById = (id) => {
  return userSessions.find((user) => user.playerInfo.playerId === id);
};

// 소캣으로 유저 찾기.
export const getUserBySocket = (socket) => {
  return userSessions.find((user) => user.playerInfo.socket === socket);
};

// 닉네임으로 유저 찾기.
export const getUserByNickname = (nickname) => {
  return userSessions.find((user) => user.playerInfo.nickname === nickname);
}

// 모든 유저 가져오기.
export const getAllUsers = () => {
  return userSessions;
};

// 본인 제외 유저 소켓 가져오기.
export const getOtherUserSockets = (socket) => {
  const userSockets = userSessions.filter((user) => user.playerInfo.socket !== socket);
  return userSockets.map((user) => user.playerInfo.socket);
}

// 모든 유저 소켓 가져오기.
export const getAllUserSockets = () => {
  return userSessions.map((user) => user.playerInfo.socket);
}

//,,