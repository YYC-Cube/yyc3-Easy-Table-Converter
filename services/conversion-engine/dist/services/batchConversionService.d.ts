/**
 * @file 批量转换服务
 * @description 实现批量文件转换的核心业务逻辑
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-20
 */
import { BatchConversionTaskDocument } from '../models/BatchConversionTask';
import { ConversionService } from './conversionService';
import { StorageService } from './storageService';
import { QueueManager } from '../utils/queueManager';
import { EventEmitter } from 'events';
export declare enum BatchProcessingEvents {
    TASK_CREATED = "batch:task_created",
    TASK_STARTED = "batch:task_started",
    TASK_COMPLETED = "batch:task_completed",
    TASK_FAILED = "batch:task_failed",
    SUBTASK_STARTED = "batch:subtask_started",
    SUBTASK_COMPLETED = "batch:subtask_completed",
    SUBTASK_FAILED = "batch:subtask_failed",
    PROGRESS_UPDATE = "batch:progress_update",
    ALL_TASKS_COMPLETED = "batch:all_tasks_completed"
}
export interface BatchConversionConfig {
    maxConcurrentTasks: number;
    maxRetries: number;
    retryDelay: number;
    batchSizeLimit: number;
    memoryThreshold: number;
}
/**
 * 批量转换服务类 - 处理批量文件转换任务
 */
export declare class BatchConversionService extends EventEmitter {
    private config;
    private conversionService;
    private storageService;
    private rateLimiter;
    private queueManager;
    private activeTasks;
    private runningSubTasks;
    private taskProcessors;
    constructor(conversionService: ConversionService, storageService: StorageService, queueManager: QueueManager, config?: Partial<BatchConversionConfig>);
    /**
     * 初始化事件监听器
     */
    private initEventListeners;
    /**
     * 启动任务处理器
     */
    private startTaskProcessor;
    /**
     * 停止任务处理器
     */
    stopTaskProcessor(): void;
    /**
     * 提交批量转换任务
     * @param userId - 用户ID
     * @param tasks - 要处理的子任务列表
     * @param options - 转换选项
     * @returns 创建的批量任务
     */
    submitBatchTask(userId: string, tasks: Array<{
        inputFileId: string;
        outputFormat: string;
    }>, options?: Record<string, any>): Promise<BatchConversionTaskDocument>;
    /**
     * 处理待处理的批量任务
     */
    private processPendingBatchTasks;
    /**
     * 处理单个批量任务
     * @param batchTask - 批量任务对象
     */
    private processBatchTask;
    /**
     * 处理批量任务中的子任务
     * @param batchJobId - 批量任务ID
     */
    private processSubTasks;
    /**
     * 处理单个子任务
     * @param batchJobId - 批量任务ID
     * @param subTaskId - 子任务ID
     */
    private processSubTask;
    /**
     * 更新批量任务进度
     * @param batchJobId - 批量任务ID
     */
    private updateBatchTaskProgress;
    /**
     * 检查是否所有子任务都已完成
     * @param batchJobId - 批量任务ID
     */
    private checkAllSubTasksCompleted;
    /**
     * 完成批量任务处理
     * @param batchJobId - 批量任务ID
     */
    private finalizeBatchTask;
    /**
     * 获取批量任务状态
     * @param batchJobId - 批量任务ID
     * @param userId - 用户ID
     * @returns 批量任务信息
     */
    getBatchTaskStatus(batchJobId: string, userId: string): Promise<BatchConversionTaskDocument | null>;
    /**
     * 取消批量任务
     * @param batchJobId - 批量任务ID
     * @param userId - 用户ID
     * @returns 取消后的任务
     */
    cancelBatchTask(batchJobId: string, userId: string): Promise<BatchConversionTaskDocument | null>;
    /**
     * 获取用户的批量任务列表
     * @param userId - 用户ID
     * @param page - 页码
     * @param limit - 每页数量
     * @returns 任务列表
     */
    getUserBatchTasks(userId: string, page?: number, limit?: number): Promise<{
        tasks: BatchConversionTaskDocument[];
        total: number;
        page: number;
        limit: number;
    }>;
    /**
     * 检查系统资源是否充足
     * @returns 系统资源是否充足
     */
    private checkSystemResources;
    /**
     * 获取批量转换服务统计信息
     */
    getStatistics(): {
        activeTasks: number;
        runningSubTasks: number;
        memoryUsage: NodeJS.MemoryUsage;
        config: BatchConversionConfig;
    };
}
export default BatchConversionService;
//# sourceMappingURL=batchConversionService.d.ts.map