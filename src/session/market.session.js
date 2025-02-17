import marketData from '../classes/models/marketData.class.js';
import { getAllMarketData } from '../db/marketplace/market.db.js';
import { getItemSession } from './item.session.js';
import { marketSessions } from './sessions.js';

// 해당 데이터 추가입니다.
export function addMarketSession(item) {
  if (marketSessions.has(item.id)) {
    marketSessions.set(item.id, item);
  } else {
    return new Error('해당하는 데이터가 이미 존제 합니다.');
  }
}
// 해당 데이터 삭제
export function deletMarketSession(id) {
  marketSessions.delete(id);
}
export function getMarketSession() {
  return marketSessions;
}
// 해당 데이터 받아오기
export function getBuyIdInMarketSession(id) {
  return marketSessions.get(id);
}
// 최대 길이 구하기
export function getMaxMarketList(count) {
  if (marketSessions.size <= 0) {
    return 0;
  }
  return parseInt(marketSessions.size / count);
}

export function getBuyNameInMarketList(naem, page, count) {
  const startIndex = (page - 1) * count;
  const endIndex = startIndex + count;
}

//처음 초기화 용도
export async function initMarketSesion() {
  const marketAllData = await getAllMarketData();
  for (let data of marketAllData) {
    new marketData(data, getItemSession(data.id).name);
  }
}
