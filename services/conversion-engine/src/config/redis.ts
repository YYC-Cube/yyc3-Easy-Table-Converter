/**
 * @file Redis配置文件
 * @description 负责与Redis的连接和配置，用于任务队列和缓存
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-20
 */

import { createClient } from 'redis';

// 创建Redis客户端
const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

/**
 * 连接Redis
 * @returns {Promise<void>}
 */
async function connectRedis(): Promise<void> {
  try {
    await redisClient.connect();
    console.log('✅ Redis连接成功');
  } catch (error) {
    console.error('❌ Redis连接失败:', error);
    throw error;
  }
}

// 导出Redis客户端
export { redisClient };
export default connectRedis;