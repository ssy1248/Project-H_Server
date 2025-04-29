import { createClient } from 'redis';
import { config } from '../config/config';

const redisClient = createClient({
  url: config.redis.name + config.redis.host + config.redis.port, // 로컬 Redis 서버 연결
});

export default redisClient;
