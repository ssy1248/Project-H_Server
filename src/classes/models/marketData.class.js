import { cancelMarket } from '../../db/marketplace/market.db';
import { addMarketSession, deletMarketSession } from '../../session/market.session';

class marketData {
  constructor(data) {
    this.id = data.id;
    this.charId = data.charId;
    this.itemIndex = data.itemIndex;
    this.rarity = data.upgrade;
    this.price = data.price;
    this.endTime = data.endTime;
    this.delay = endTime - new Date(); // 남은 시간 계산 (밀리초)

    if (delay > 0) {
      addMarketSession(this);
      setTimeout(this.endData(), delay);
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
