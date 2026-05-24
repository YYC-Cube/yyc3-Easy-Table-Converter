/**
 * @file 队列管理器
 * @description 管理转换任务的队列，支持任务的添加、处理和监控
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-20
 */
import Bull, { Queue, Job } from 'bull';
export interface QueueConfig {
    name: string;
    defaultJobOptions?: any;
    redis?: any;
}
export type TaskProcessor<T = any, R = any> = (job: Job<T>) => Promise<R>;
/**
 * 队列管理器类
 */
export declare class QueueManager {
    private queues;
    private processors;
    /**
     * 创建或获取队列
     * @param config 队列配置
     */
    getQueue(config: QueueConfig): Queue;
    /**
     * 设置队列事件监听
     * @param queue 队列实例
     * @param name 队列名称
     */
    private setupQueueEvents;
    /**
     * 添加任务到队列
     * @param queueName 队列名称
     * @param data 任务数据
     * @param options 任务选项
     */
    addTask<T = any>(queueName: string, data: T, options?: Bull.JobOptions): Promise<Job<T>>;
    /**
     * 为队列添加处理器
     * @param queueName 队列名称
     * @param processor 任务处理器
     */
    addProcessor<T = any>(queueName: string, processor: TaskProcessor<T>): void;
    /**
     * 获取队列状态
     * @param queueName 队列名称
     */
    getQueueStatus(queueName: string): Promise<{
        [key: string]: number;
    }>;
    /**
     * 关闭指定队列
     * @param queueName 队列名称
     */
    closeQueue(queueName: string): Promise<void>;
    /**
     * 移除队列中的任务
     * @param queueName 队列名称
     * @param taskId 任务ID
     */
    removeTask(queueName: string, taskId: string): Promise<boolean>;
    /**
     * 关闭所有队列
     */
    close(): Promise<void>;
}
//# sourceMappingURL=queueManager.d.ts.map