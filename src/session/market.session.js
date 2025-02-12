import marketListHandler from '../handlers/marketplace/marketList.handler';

export function addMarketSession(item) {
  if (marketListHandler[item.id] === undefined) {
    marketListHandler[item.id] = item;
  } else {
    return new Error('해당하는 데이터가 이미 존제 합니다.');
  }
}
export function deletMarketSession(id) {
  delete marketListHandler[id];
}
export function getMarketSession(id) {
  return marketListHandler[id];
}
