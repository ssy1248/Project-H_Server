import { loadProtos } from './loadProtos.js';
import { v4 as uuidv4 } from 'uuid';
import { addGameSession } from '../session/game.session.js';
// import { createMovementSync } from '../classes/managers/movementSync.manager.js';
import { initMarketSesion } from '../session/market.session.js';
import { initItemSesion } from '../session/item.session.js';
import { createMovementSync, findMovementSync } from '../movementSync/movementSync.manager.js';

const initServer = async () => {
  try {
    await loadProtos();
    await initItemSesion();
    //await initMarketSesion();
    const gameId = uuidv4();
    const gameSession = addGameSession(gameId);

    // [테스트] 이동동기화생성 - town
    createMovementSync('town');
    createMovementSync('dungeon1');

    // await testAllConnections(pools);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
};

export default initServer;
