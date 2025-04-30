import { PACKET_TYPE } from '../../constants/header.js';
import { getBuyNameInMarketList } from '../../session/market.session.js';
import { createResponse } from '../../utils/response/createResponse.js';

const marketSelectBuyName = async (socket, payload) => {
  const { name, page, count } = payload;
  const startIndex = (page - 1) * count;
  const endIndex = startIndex + count - 1;

  const namekeys = await client.zRange('index:name:' + name, startIndex, endIndex);

  const marketData = [];

  for (let key of namekeys) {
    let data = await client.hGetAll(key);
    if (data && Object.keys(data).length > 0) {
      marketData.push({
        marketId: data.id,
        itemId: data.itemIndex,
        name: data.name,
        upgrade: data.upgrade,
        endTime: data.endTime,
        price: data.price,
      });
    }
  }

  const packet = createResponse(
    'town',
    'S_MarketSelectBuyName',
    PACKET_TYPE.S_MARKETSELECTBUYNAME,
    {
      itemdata: marketData,
    },
  );
  socket.write(packet);
};

export default marketSelectBuyName;
