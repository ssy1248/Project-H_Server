import { rewardSessions } from './sessions.js';

export const addRewardAutionSession = (data) => {
  rewardSessions.set(data.id, data);
};
export const deleteRewardAutionSession = (id) => {
  rewardSessions.delete(id);
};
export const getRewardAutionSession = (id) => {
  return rewardSessions.get(id);
};
