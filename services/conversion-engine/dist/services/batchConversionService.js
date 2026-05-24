"use strict";
/**
 * @file 批量转换服务
 * @description 实现批量文件转换的核心业务逻辑
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-20
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BatchConversionService = exports.BatchProcessingEvents = void 0;
const BatchConversionTask_1 = __importDefault(require("../models/BatchConversionTask"));
const logger_1 = require("../utils/logger");
const rateLimiter_1 = require("../utils/rateLimiter");
const events_1 = require("events");
const perf_hooks_1 = require("perf_hooks");
// 批处理事件类型
var BatchProcessingEvents;
(function (BatchProcessingEvents) {
    BatchProcessingEvents["TASK_CREATED"] = "batch:task_created";
    BatchProcessingEvents["TASK_STARTED"] = "batch:task_started";
    BatchProcessingEvents["TASK_COMPLETED"] = "batch:task_completed";
    BatchProcessingEvents["TASK_FAILED"] = "batch:task_failed";
    BatchProcessingEvents["SUBTASK_STARTED"] = "batch:subtask_started";
    BatchProcessingEvents["SUBTASK_COMPLETED"] = "batch:subtask_completed";
    BatchProcessingEvents["SUBTASK_FAILED"] = "batch:subtask_failed";
    BatchProcessingEvents["PROGRESS_UPDATE"] = "batch:progress_update";
    BatchProcessingEvents["ALL_TASKS_COMPLETED"] = "batch:all_tasks_completed";
})(BatchProcessingEvents || (exports.BatchProcessingEvents = BatchProcessingEvents = {}));
// 默认配置
const DEFAULT_CONFIG = {
    maxConcurrentTasks: 5,
    maxRetries: 3,
    retryDelay: 1000,
    batchSizeLimit: 100,
    memoryThreshold: 80 // 内存使用阈值（百分比）
};
/**
 * 批量转换服务类 - 处理批量文件转换任务
 */
class BatchConversionService extends events_1.EventEmitter {
    constructor(conversionService, storageService, queueManager, config = {}) {
        super();
        this.activeTasks = new Map(); // 跟踪活跃的批量任务ID
        this.runningSubTasks = new Set(); // 跟踪正在运行的子任务ID
        this.taskProcessors = new Map(); // 任务处理器定时器
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.conversionService = conversionService;
        this.storageService = storageService;
        this.queueManager = queueManager;
        this.rateLimiter = new rateLimiter_1.RateLimiter({
            maxConcurrent: this.config.maxConcurrentTasks,
            burst: 2
        });
        // 初始化事件监听器
        this.initEventListeners();
        // 启动任务处理器
        this.startTaskProcessor();
    }
    /**
     * 初始化事件监听器
     */
    initEventListeners() {
        // 子任务完成时更新批量任务进度
        this.on(BatchProcessingEvents.SUBTASK_COMPLETED, async (batchJobId) => {
            await this.updateBatchTaskProgress(batchJobId);
        });
        this.on(BatchProcessingEvents.SUBTASK_FAILED, async (batchJobId) => {
            await this.updateBatchTaskProgress(batchJobId);
        });
        // 所有子任务完成时更新批量任务状态
        this.on(BatchProcessingEvents.ALL_TASKS_COMPLETED, async (batchJobId) => {
            await this.finalizeBatchTask(batchJobId);
        });
    }
    /**
     * 启动任务处理器
     */
    startTaskProcessor() {
        // 每5秒检查一次待处理的批量任务
        this.taskProcessors.set('main', setInterval(() => this.processPendingBatchTasks(), 5000));
        logger_1.logger.info('批量转换任务处理器已启动');
    }
    /**
     * 停止任务处理器
     */
    stopTaskProcessor() {
        this.taskProcessors.forEach(timer => clearInterval(timer));
        this.taskProcessors.clear();
        logger_1.logger.info('批量转换任务处理器已停止');
    }
    /**
     * 提交批量转换任务
     * @param userId - 用户ID
     * @param tasks - 要处理的子任务列表
     * @param options - 转换选项
     * @returns 创建的批量任务
     */
    async submitBatchTask(userId, tasks, options = {}) {
        // 验证批量大小
        if (tasks.length > this.config.batchSizeLimit) {
            throw new Error(`批量任务过大，最大支持${this.config.batchSizeLimit}个文件`);
        }
        if (tasks.length === 0) {
            throw new Error('批量任务至少需要一个文件');
        }
        // 验证所有输入文件是否存在
        for (const task of tasks) {
            try {
                await this.storageService.getFileInfo(task.inputFileId);
            }
            catch (error) {
                throw new Error(`文件 ${task.inputFileId} 不存在或无法访问`);
            }
        }
        // 创建批量转换任务
        const batchTask = await BatchConversionTask_1.default.create({
            userId,
            subTasks: tasks.map(task => ({
                subTaskId: `sub-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                inputFileId: task.inputFileId,
                outputFormat: task.outputFormat,
                status: 'pending'
            })),
            status: 'pending',
            options,
            progress: {
                totalTasks: tasks.length,
                completedTasks: 0,
                failedTasks: 0,
                processingTasks: 0,
                percentComplete: 0,
                estimatedTimeRemaining: 0,
                lastUpdated: Date.now()
            }
        });
        logger_1.logger.info(`创建批量转换任务 ${batchTask.batchJobId}，包含 ${tasks.length} 个子任务`);
        // 触发任务创建事件
        this.emit(BatchProcessingEvents.TASK_CREATED, batchTask.batchJobId, batchTask);
        return batchTask;
    }
    /**
     * 处理待处理的批量任务
     */
    async processPendingBatchTasks() {
        try {
            // 检查系统资源
            if (!await this.checkSystemResources()) {
                logger_1.logger.warn('系统资源不足，暂停处理新的批量任务');
                return;
            }
            // 获取待处理任务
            const pendingTasks = await BatchConversionTask_1.default.findPendingBatchJobs(3);
            for (const task of pendingTasks) {
                if (!this.activeTasks.has(task.batchJobId)) {
                    await this.processBatchTask(task);
                }
            }
        }
        catch (error) {
            logger_1.logger.error('处理待处理批量任务时发生错误:', error);
        }
    }
    /**
     * 处理单个批量任务
     * @param batchTask - 批量任务对象
     */
    async processBatchTask(batchTask) {
        try {
            this.activeTasks.set(batchTask.batchJobId, true);
            // 更新任务状态为处理中
            await BatchConversionTask_1.default.updateBatchJobStatus(batchTask.batchJobId, 'processing');
            logger_1.logger.info(`开始处理批量任务 ${batchTask.batchJobId}`);
            this.emit(BatchProcessingEvents.TASK_STARTED, batchTask.batchJobId, batchTask);
            // 提交子任务到队列
            for (const subTask of batchTask.subTasks) {
                this.queueManager.addToQueue('batch-subtask', {
                    batchJobId: batchTask.batchJobId,
                    subTaskId: subTask.subTaskId,
                    inputFileId: subTask.inputFileId,
                    outputFormat: subTask.outputFormat,
                    userId: batchTask.userId,
                    options: batchTask.options
                });
            }
            // 启动子任务处理
            this.processSubTasks(batchTask.batchJobId);
        }
        catch (error) {
            logger_1.logger.error(`处理批量任务 ${batchTask.batchJobId} 时发生错误:`, error);
            // 更新任务状态为失败
            await BatchConversionTask_1.default.updateBatchJobStatus(batchTask.batchJobId, 'failed', `批量任务处理失败: ${error instanceof Error ? error.message : '未知错误'}`);
            this.activeTasks.delete(batchTask.batchJobId);
            this.emit(BatchProcessingEvents.TASK_FAILED, batchTask.batchJobId, error);
        }
    }
    /**
     * 处理批量任务中的子任务
     * @param batchJobId - 批量任务ID
     */
    async processSubTasks(batchJobId) {
        try {
            const batchTask = await BatchConversionTask_1.default.findByBatchJobId(batchJobId);
            if (!batchTask)
                return;
            // 处理待处理的子任务
            for (const subTask of batchTask.subTasks) {
                if (subTask.status === 'pending' && !this.runningSubTasks.has(subTask.subTaskId)) {
                    // 使用速率限制器控制并发
                    await this.rateLimiter.acquire();
                    this.processSubTask(batchJobId, subTask.subTaskId).catch(error => {
                        logger_1.logger.error(`处理子任务 ${subTask.subTaskId} 时发生错误:`, error);
                    });
                }
            }
        }
        catch (error) {
            logger_1.logger.error(`处理批量任务 ${batchJobId} 的子任务时发生错误:`, error);
        }
    }
    /**
     * 处理单个子任务
     * @param batchJobId - 批量任务ID
     * @param subTaskId - 子任务ID
     */
    async processSubTask(batchJobId, subTaskId) {
        let retries = 0;
        const maxRetries = this.config.maxRetries;
        let resultFileId;
        let errorMessage;
        try {
            // 获取任务信息
            const batchTask = await BatchConversionTask_1.default.findByBatchJobId(batchJobId);
            if (!batchTask)
                return;
            const subTask = batchTask.subTasks.find(t => t.subTaskId === subTaskId);
            if (!subTask)
                return;
            this.runningSubTasks.add(subTaskId);
            // 更新子任务状态为处理中
            await BatchConversionTask_1.default.updateSubTaskStatus(batchJobId, subTaskId, 'processing');
            this.emit(BatchProcessingEvents.SUBTASK_STARTED, batchJobId, subTaskId);
            // 开始计时
            const startTime = perf_hooks_1.performance.now();
            // 执行转换
            do {
                try {
                    const result = await this.conversionService.convertFile(subTask.inputFileId, subTask.outputFormat, batchTask.options || {});
                    resultFileId = result.outputFileId;
                    break;
                }
                catch (error) {
                    retries++;
                    if (retries > maxRetries) {
                        throw error;
                    }
                    // 指数退避重试
                    const delay = this.config.retryDelay * Math.pow(2, retries - 1);
                    logger_1.logger.warn(`子任务 ${subTaskId} 重试 ${retries}/${maxRetries}，延迟 ${delay}ms`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            } while (retries <= maxRetries);
            // 计算处理时间
            const processingTime = Math.round(perf_hooks_1.performance.now() - startTime);
            // 更新子任务状态为完成
            await BatchConversionTask_1.default.updateSubTaskStatus(batchJobId, subTaskId, 'completed', resultFileId);
            logger_1.logger.info(`子任务 ${subTaskId} 处理完成，耗时 ${processingTime}ms`);
            this.emit(BatchProcessingEvents.SUBTASK_COMPLETED, batchJobId, subTaskId, resultFileId);
            // 检查是否所有子任务都已完成
            await this.checkAllSubTasksCompleted(batchJobId);
        }
        catch (error) {
            errorMessage = error instanceof Error ? error.message : '未知错误';
            // 更新子任务状态为失败
            await BatchConversionTask_1.default.updateSubTaskStatus(batchJobId, subTaskId, 'failed', undefined, errorMessage);
            logger_1.logger.error(`子任务 ${subTaskId} 处理失败:`, errorMessage);
            this.emit(BatchProcessingEvents.SUBTASK_FAILED, batchJobId, subTaskId, errorMessage);
            // 检查是否所有子任务都已完成
            await this.checkAllSubTasksCompleted(batchJobId);
        }
        finally {
            this.runningSubTasks.delete(subTaskId);
            this.rateLimiter.release();
        }
    }
    /**
     * 更新批量任务进度
     * @param batchJobId - 批量任务ID
     */
    async updateBatchTaskProgress(batchJobId) {
        try {
            const updatedTask = await BatchConversionTask_1.default.updateBatchJobProgress(batchJobId);
            if (updatedTask) {
                this.emit(BatchProcessingEvents.PROGRESS_UPDATE, batchJobId, updatedTask.progress);
            }
        }
        catch (error) {
            logger_1.logger.error(`更新批量任务 ${batchJobId} 进度时发生错误:`, error);
        }
    }
    /**
     * 检查是否所有子任务都已完成
     * @param batchJobId - 批量任务ID
     */
    async checkAllSubTasksCompleted(batchJobId) {
        try {
            const batchTask = await BatchConversionTask_1.default.findByBatchJobId(batchJobId);
            if (!batchTask)
                return;
            const allCompleted = batchTask.subTasks.every(task => task.status === 'completed' || task.status === 'failed');
            if (allCompleted) {
                this.emit(BatchProcessingEvents.ALL_TASKS_COMPLETED, batchJobId);
            }
        }
        catch (error) {
            logger_1.logger.error(`检查批量任务 ${batchJobId} 子任务状态时发生错误:`, error);
        }
    }
    /**
     * 完成批量任务处理
     * @param batchJobId - 批量任务ID
     */
    async finalizeBatchTask(batchJobId) {
        try {
            const batchTask = await BatchConversionTask_1.default.findByBatchJobId(batchJobId);
            if (!batchTask)
                return;
            // 计算最终状态
            const completedTasks = batchTask.subTasks.filter(task => task.status === 'completed');
            const failedTasks = batchTask.subTasks.filter(task => task.status === 'failed');
            let finalStatus;
            let finalErrorMessage;
            if (completedTasks.length === batchTask.subTasks.length) {
                finalStatus = 'completed';
            }
            else if (failedTasks.length === batchTask.subTasks.length) {
                finalStatus = 'failed';
                finalErrorMessage = '所有子任务处理失败';
            }
            else {
                finalStatus = 'partial';
                finalErrorMessage = `${completedTasks.length}个任务成功，${failedTasks.length}个任务失败`;
            }
            // 更新任务状态
            await BatchConversionTask_1.default.updateBatchJobStatus(batchJobId, finalStatus, finalErrorMessage);
            logger_1.logger.info(`批量任务 ${batchJobId} 完成，状态: ${finalStatus}`);
            this.emit(BatchProcessingEvents.TASK_COMPLETED, batchJobId, finalStatus);
            // 移除活跃任务标记
            this.activeTasks.delete(batchJobId);
        }
        catch (error) {
            logger_1.logger.error(`完成批量任务 ${batchJobId} 时发生错误:`, error);
        }
    }
    /**
     * 获取批量任务状态
     * @param batchJobId - 批量任务ID
     * @param userId - 用户ID
     * @returns 批量任务信息
     */
    async getBatchTaskStatus(batchJobId, userId) {
        const task = await BatchConversionTask_1.default.findByBatchJobId(batchJobId);
        // 检查权限
        if (task && task.userId !== userId) {
            return null;
        }
        return task;
    }
    /**
     * 取消批量任务
     * @param batchJobId - 批量任务ID
     * @param userId - 用户ID
     * @returns 取消后的任务
     */
    async cancelBatchTask(batchJobId, userId) {
        const task = await BatchConversionTask_1.default.findByBatchJobId(batchJobId);
        // 检查权限
        if (!task || task.userId !== userId) {
            return null;
        }
        // 只有未开始或正在处理的任务可以取消
        if (['pending', 'processing'].includes(task.status)) {
            // 更新任务状态为已取消
            await BatchConversionTask_1.default.updateBatchJobStatus(batchJobId, 'cancelled');
            // 移除活跃任务标记
            this.activeTasks.delete(batchJobId);
            logger_1.logger.info(`批量任务 ${batchJobId} 已取消`);
            // 重新获取更新后的任务
            return await BatchConversionTask_1.default.findByBatchJobId(batchJobId);
        }
        return task;
    }
    /**
     * 获取用户的批量任务列表
     * @param userId - 用户ID
     * @param page - 页码
     * @param limit - 每页数量
     * @returns 任务列表
     */
    async getUserBatchTasks(userId, page = 1, limit = 10) {
        const skip = (page - 1) * limit;
        const [tasks, total] = await Promise.all([
            BatchConversionTask_1.default.find({ userId })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .exec(),
            BatchConversionTask_1.default.countDocuments({ userId }).exec()
        ]);
        return { tasks, total, page, limit };
    }
    /**
     * 检查系统资源是否充足
     * @returns 系统资源是否充足
     */
    async checkSystemResources() {
        try {
            // 检查内存使用情况
            const memoryUsage = process.memoryUsage();
            const totalMemory = memoryUsage.heapTotal;
            const usedMemory = memoryUsage.heapUsed;
            const memoryPercent = (usedMemory / totalMemory) * 100;
            // 检查并发任务数
            const activeTaskCount = this.activeTasks.size;
            const runningSubTaskCount = this.runningSubTasks.size;
            logger_1.logger.debug(`系统资源检查: 内存使用 ${memoryPercent.toFixed(2)}%, 活跃任务 ${activeTaskCount}, 运行中子任务 ${runningSubTaskCount}`);
            return memoryPercent < this.config.memoryThreshold &&
                activeTaskCount < this.config.maxConcurrentTasks * 2 &&
                runningSubTaskCount < this.config.maxConcurrentTasks * 5;
        }
        catch (error) {
            logger_1.logger.error('检查系统资源时发生错误:', error);
            return true; // 出错时默认返回可用，避免服务中断
        }
    }
    /**
     * 获取批量转换服务统计信息
     */
    getStatistics() {
        return {
            activeTasks: this.activeTasks.size,
            runningSubTasks: this.runningSubTasks.size,
            memoryUsage: process.memoryUsage(),
            config: { ...this.config }
        };
    }
}
exports.BatchConversionService = BatchConversionService;
exports.default = BatchConversionService;
//# sourceMappingURL=batchConversionService.js.map