"use strict";
/**
 * @file 转换任务队列配置
 * @description 配置和管理转换任务的异步处理队列
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-20
 */
Object.defineProperty(exports, "__esModule", { value: true });
const bull_1 = require("bull");
const conversionService_1 = require("../services/conversionService");
// 创建转换队列
const conversionQueue = new bull_1.Queue('conversion', {
    redis: process.env.REDIS_URL || 'redis://localhost:6379'
});
// 定义工作处理器
const conversionWorker = new bull_1.Worker('conversion', async (job) => {
    const { inputFile, outputFormat, options } = job.data;
    try {
        // 更新任务状态为处理中
        await job.progress(25);
        // 执行转换
        const result = await (0, conversionService_1.convertData)(inputFile, outputFormat, options);
        // 更新任务状态为完成
        await job.progress(100);
        return result;
    }
    catch (error) {
        console.error(`❌ 转换任务失败 (${job.id}):`, error);
        throw error;
    }
});
// 错误处理
conversionWorker.on('failed', (job, err) => {
    console.error(`❌ 任务 ${job.id} 失败:`, err);
});
// 完成处理
conversionWorker.on('completed', (job, result) => {
    console.log(`✅ 任务 ${job.id} 成功完成`);
});
// 导出队列
exports.default = conversionQueue;
//# sourceMappingURL=conversionQueue.js.map