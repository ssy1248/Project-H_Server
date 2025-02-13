import { cancelMarket } from '../../db/marketplace/market.db';
import { deletMarketSession } from '../../session/market.session';

class marketData {
  constructor(data) {
    this.id = data.id;
    this.charId = data.charId;
    this.itemIndex = data.itemIndex;
    this.upgrade = data.upgrade;
    this.price = data.price;
    this.endTime = data.endTime;
    this.delay = endTime - new Date(); // 남은 시간 계산 (밀리초)

    if (delay > 0) {
      setTimeout(endData(), delay);
    } else {
      endData();
    }
  }
  endData() {
    cancelMarket({
      makrketId: this.id,
      charId: this.charId,
      itemId: this.itemIndex,
      rarity: this.upgrade,
    });
    deletMarketSession(this.id);
  }
}
export default marketData;
