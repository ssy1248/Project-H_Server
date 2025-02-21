import { getUserByNickname } from '../../session/user.session';

class RewardAuction {
  constructor(items, partyInfo) {
    this.items = items;
    this.name = ''; // 현재 가장 높게 부른 charId 캐릭터 아이디
    this.nowPrice = 0; // 현재 가격 없으면 items.price 기본값으로
    this.partyInfo = partyInfo;
    this.timeLimit = 60; // 기본 60초 입니다!
    this.addTime = 10; // 추가 시간 10초
    this.auctionFee = 10; // 10퍼센트 때먹기!
    this.time = this.timeLimit;
    this.state = 'stop'; /// stop , stay , end 이 순서
    this.startAuction();
  }
  // 경매 시작
  startAuction() {
    this.name = '';
    this.nowPrice = this.items.price;
    setInterval(this.stayAuction.bind(this), 1000);
  }
  // 경매 중
  stayAuction() {
    if (this.time > 0) {
      this.time--;
      this.state = stay;
    } else {
      if (this.items.lenght > 0) {
        this.state = 'stop';
        this.finalizeAuction();
        setTimeout(this.startAuction.bind(this), 10000); // 10초간 대기시간.
        return;
      }
      this.endAuction();
    }
  }
  // 경매 끝
  endAuction() {
    this.state = 'end';
    // 종료를 모두에게 알려주기
  }
  // 경매 분배
  finalizeAuction() {
    // 기본금 파티원 수만큼 분배
    if (this.name === '') {
      for (let player of partyInfo) {
        const user = getUserByNickname(player.playerName);
      }
      return;
    }
    // 산 사람 빼고 남은 사람 분배
    for (let player of partyInfo) {
      if (this.name === player.playerName) {
        const user = getUserByNickname(player.playerName);
      } else {
        const user = getUserByNickname(player.playerName);
      }
    }
  }
  // 경매 입찰
  enterAuctionBid(charId, gold) {
    this.charId = charId;
    this.nowPrice = gold;
    if (this.time < 30) {
      this.time += this.addTime;
    }
  }
}
export default RewardAuction;
