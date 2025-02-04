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

export const getUserById = (id) => {
  return userSessions.find((user) => user.id === id);
};

export const getUserBySocket = (socket) => {
  return userSessions.find((user) => user.socket === socket);
};

export const getAllUsers = () => {
  return userSessions;
};
