import { PACKET_TYPE } from '../../constants/header.js';
import { getBuyNameInMarketList } from '../../session/market.session.js';
import { createResponse } from '../../utils/response/createResponse.js';

function marketSelectBuyName(socket, payload) {
  const { name, page, count } = payload;
  const data = getBuyNameInMarketList(name, page, count);

  const packet = createResponse(
    'town',
    'S_MarketSelectBuyName',
    PACKET_TYPE.S_MARKETSELECTBUYNAME,
    {
      itemdata: data,
    },
  );
  socket.write(packet);
}

export default marketSelectBuyName;
