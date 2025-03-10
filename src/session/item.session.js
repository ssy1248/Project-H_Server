import { getAllItems } from '../db/inventory/item.db.js';
import { itemSessions } from './sessions.js';

export function addItemSession(id, item) {
  if (!itemSessions.has(item.id)) {
    itemSessions.set(id, item);
  } else {
    return new Error('해당하는 데이터가 이미 존wo 합니다.');
  }
}
// 해당 데이터 삭제
export function deletItemSession(id) {
  itemSessions.delete(id);
}
export function getAllItemSession() {
  return itemSessions;
}
// 해당 데이터 받아오기
export function getItemSession(id) {
  return itemSessions.get(id);
}
// 최대 길이 구하기
export function getMaxItemList(count) {
  if (itemSessions.size <= 0) {
    return 0;
  }
  return parseInt(itemSessions.size / count);
}

//처음 초기화 용도
export async function initItemSesion() {
  const itemAllData = await getAllItems();
  for (let data of itemAllData) {
    addItemSession(data.id, data);
  }
}
