"use strict";
/**
 * @file Redis配置文件
 * @description 负责与Redis的连接和配置，用于任务队列和缓存
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-20
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisClient = void 0;
const redis_1 = require("redis");
// 创建Redis客户端
const redisClient = (0, redis_1.createClient)({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
});
exports.redisClient = redisClient;
/**
 * 连接Redis
 * @returns {Promise<void>}
 */
async function connectRedis() {
    try {
        await redisClient.connect();
        console.log('✅ Redis连接成功');
    }
    catch (error) {
        console.error('❌ Redis连接失败:', error);
        throw error;
    }
}
exports.default = connectRedis;
//# sourceMappingURL=redis.js.map