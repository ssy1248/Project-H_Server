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
  endData() {}
}
export default marketData;
