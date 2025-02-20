import { cancelMarket } from '../../db/marketplace/market.db.js';
import { addMarketSession, deletMarketSession } from '../../session/market.session.js';

class marketData {
  constructor(data, name) {
    this.id = data.id;
    this.charId = data.charId;
    this.name = name;
    this.itemIndex = data.itemIndex;
    this.rarity = data.upgrade;
    this.price = data.price;
    this.endTime = data.endTime;
    this.delay = this.endTime - new Date(); // 남은 시간 계산 (밀리초)
    console.log(this.id, ' 가 새션에 들어감!');
    if (this.delay > 0) {
      addMarketSession(this);
      setTimeout(this.endData.bind(this), this.delay);
    } else {
      this.endData();
    }
  }
  endData() {
    cancelMarket({
      makrketId: this.id,
      charId: this.charId,
      itemId: this.itemIndex,
      rarity: this.rarity,
    });
    deletMarketSession(this.id);
  }
}
export default marketData;
