import { CLIENT_VERSION, HOST, PORT } from '../constants/env.js';
import { PACKET_TYPE_LENGTH, TOTAL_LENGTH } from '../constants/header.js';
import { DB1_NAME, DB1_USER, DB1_PASSWORD, DB1_HOST, DB1_PORT, DB2_NAME, DB2_USER, DB2_PASSWORD, DB2_HOST, DB2_PORT } from '../constants/env.js';

export const config = {
  server: {
    port: PORT,
    host: HOST,
  },
  client: {
    version: CLIENT_VERSION,
  },
  packet: {
    totalLength: TOTAL_LENGTH,
    typeLength: PACKET_TYPE_LENGTH,
  },
  databases: {
    GAME_DB: {
      name: DB1_NAME || 'game_db',
      user: DB1_USER || 'root',
      password: DB1_PASSWORD || '1234',
      host: DB1_HOST || 'localhost',
      port: parseInt(DB1_PORT) || 3306,
    },
    USER_DB: {
      name: DB2_NAME,
      user: DB2_USER,
      password: DB2_PASSWORD,
      host: DB2_HOST,
      port: parseInt(DB2_PORT),
    },
  },
};
