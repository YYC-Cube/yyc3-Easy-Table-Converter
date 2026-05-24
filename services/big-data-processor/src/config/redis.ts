/**
 * @file Redis配置文件
 * @description 负责与Redis的连接和配置，用于缓存和队列
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-20
 */

import { createClient, RedisClientType } from 'redis';

// Redis客户端实例
let redisClient: RedisClientType;

/**
 * 连接Redis
 * @returns {Promise<RedisClientType>}
 */
async function connectRedis(): Promise<RedisClientType> {
  const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
  
  try {
    redisClient = createClient({
      url: REDIS_URL,
      socket: {
        connectTimeout: 10000,
        keepAlive: 60,
        reconnectStrategy: (retries) => {
          // 指数退避重试策略
          const delay = Math.min(retries * 100, 3000);
          console.log(`🔄 Redis重试连接 #${retries}，延迟 ${delay}ms`);
          return delay;
        }
      },
      database: 0
    });
    
    // 错误处理
    redisClient.on('error', (err) => {
      console.error('❌ Redis客户端错误:', err);
    });
    
    // 连接事件
    redisClient.on('connect', () => {
      console.log('🔗 Redis连接中...');
    });
    
    redisClient.on('ready', () => {
      console.log('✅ Redis连接成功');
    });
    
    redisClient.on('end', () => {
      console.warn('⚠️ Redis连接已关闭');
    });
    
    redisClient.on('reconnecting', (params) => {
      console.log(`🔄 Redis正在重新连接: ${JSON.stringify(params)}`);
    });
    
    // 建立连接
    await redisClient.connect();
    
    // 测试连接
    await redisClient.ping();
    console.log('✅ Redis连接测试成功');
    
    return redisClient;
  } catch (error) {
    console.error('❌ Redis连接失败:', error);
    throw error;
  }
}

/**
 * 获取Redis客户端实例
 * @returns {RedisClientType}
 */
function getRedisClient(): RedisClientType {
  if (!redisClient || !redisClient.isOpen) {
    throw new Error('Redis客户端未连接');
  }
  return redisClient;
}

/**
 * 断开Redis连接
 */
async function disconnectRedis(): Promise<void> {
  if (redisClient) {
    try {
      await redisClient.disconnect();
      console.log('✅ Redis连接已断开');
    } catch (error) {
      console.error('❌ Redis断开连接失败:', error);
    }
  }
}

export { connectRedis, getRedisClient, disconnectRedis };