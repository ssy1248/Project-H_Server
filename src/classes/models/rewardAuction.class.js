import { PACKET_TYPE } from '../../constants/header.js';
import { getAutionItem } from '../../db/auction/auction.db.js';
import { updateAddGold } from '../../db/user/user.db.js';
import { getItemSession } from '../../session/item.session.js';
import { getUserByNickname } from '../../session/user.session.js';

// 나중에 log로 기록 처리
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
    this.interval = null;
    this.rarity = 1; // 여기서 랜덤으로 지정
    this.startAuction();
  }
  //임시 브로드캐스트
  brodcast(packet) {
    for (let player of this.partyInfo) {
      const user = getUserByNickname(player.playerName);
      user.userInfo.socket.write(packet);
    }
  }
  // 경매 시작
  startAuction() {
    const nowItem = getItemSession(this.items[0]);
    this.name = '';
    this.nowPrice = nowItem.price;
    const packet = createResponse('dungeon', 'S_SetAuctionData', PACKET_TYPE.S_SETAUCTIONDATA, {
      itemid: this.items[0],
      time: this.time,
      rarity: this.rarity,
    });
    this.brodcast(packet);
    this.interval = setInterval(this.stayAuction.bind(this), 1000);
  }
  // 경매 중
  stayAuction() {
    if (this.time > 0) {
      this.time--;
      this.state = stay;
    } else {
      clearInterval(this.interval);
      const [id] = his.items.splice(0, 1);
      if (this.items.lenght > 0) {
        this.state = 'stop';
        this.finalizeAuction(id);
        const packet = createResponse('dungeon', 'S_WaitAuction', PACKET_TYPE.S_WAITAUCTION, {
          isWait: true,
        });
        this.brodcast(packet);
        setTimeout(this.startAuction.bind(this), 10000); // 10초간 대기시간.
        return;
      }
      this.endAuction();
    }
  }
  // 경매 끝
  endAuction() {
    this.state = 'end';
    const packet = createResponse('dungeon', 'S_EndAuction', PACKET_TYPE.S_ENDAUCTION, {
      isEnd: true,
    });
    this.brodcast(packet);
    // 종료를 모두에게 알려주기
  }
  // 경매 분배
  finalizeAuction(itemId) {
    // 기본금 파티원 수만큼 분배
    if (this.name === '') {
      const givGold = (this.nowPrice - this.nowPrice / this.auctionFee) / this.partyInfo.lenght;
      for (let player of this.partyInfo) {
        const user = getUserByNickname(player.playerName);
        updateAddGold(user.playerInfo.charId, givGold);
        const packet = createResponse(
          'dungeon',
          'S_FinalizeAllAuction',
          PACKET_TYPE.S_FINALIZEALLAUCTION,
          {
            name: this.name,
            gold: givGold,
          },
        );
        user.userInfo.socket.write(packet);
      }
      return;
    }
    const givGold = (this.nowPrice - this.nowPrice / this.auctionFee) / (this.partyInfo.lenght - 1);
    // 산 사람 빼고 남은 사람 분배
    for (let player of partyInfo) {
      if (this.name === player.playerName) {
        const user = getUserByNickname(player.playerName);
        getAutionItem({
          CharId: user.playerInfo.charId,
          itemId: itemId,
          rarity: this.rarity,
          gold: this.nowPrice,
        });
        const packet = createResponse(
          'dungeon',
          'S_FinalizeBuyAuction',
          PACKET_TYPE.S_FINALIZEBUYAUCTION,
          {
            name: this.name,
            itemId: itemId,
          },
        );
        user.userInfo.socket.write(packet);
      } else {
        const user = getUserByNickname(player.playerName);
        updateAddGold(user.playerInfo.charId, givGold);
        const packet = createResponse(
          'dungeon',
          'S_FinalizeAllAuction',
          PACKET_TYPE.S_FINALIZEALLAUCTION,
          {
            name: this.name,
            gold: givGold,
          },
        );
        user.userInfo.socket.write(packet);
      }
    }
  }
  // 경매 입찰
  enterAuctionBid(charId, name, gold) {
    this.charId = charId;
    this.name = name;
    this.nowPrice = gold;
    if (this.time < 30) {
      this.time += this.addTime;
    }
    const packet = createResponse('dungeon', 'S_EnterAuctionBid', PACKET_TYPE.S_ENTERAUCTIONBID, {
      name: this.name,
      gold: this.nowPrice,
      time: this.time,
    });
    this.brodcast(packet);
  }
}
export default RewardAuction;
