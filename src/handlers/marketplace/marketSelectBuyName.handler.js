import { PACKET_TYPE } from '../../constants/header.js';
import { getBuyNameInMarketList } from '../../session/market.session.js';

function marketSelectBuyName(socket, payload) {
  const { name, page, count } = payload;
  const packet = createResponse(
    'town',
    'S_MarketSelectBuyName',
    PACKET_TYPE.S_MARKETSELECTBUYNAME,
    {
      itemdata: getBuyNameInMarketList(name, page, count),
    },
  );
  socket.write(packet);
}

export default marketSelectBuyName;
