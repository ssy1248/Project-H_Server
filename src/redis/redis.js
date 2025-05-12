import { createClient } from 'redis';
import { config } from '../config/config.js';

const redisClient = createClient({
  url: `redis://${config.redis.host}:${config.redis.port}`,
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));

await redisClient.connect();
console.log('레디스 연결 완료');

export default redisClient;
