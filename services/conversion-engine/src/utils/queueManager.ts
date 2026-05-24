/**
 * @file 队列管理器
 * @description 管理转换任务的队列，支持任务的添加、处理和监控
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-20
 */

import Bull, { Queue, Job } from 'bull';
import { logger } from './logger';

// 队列配置接口
export interface QueueConfig {
  name: string;
  defaultJobOptions?: any;
  redis?: any;
}

// 任务处理函数类型
export type TaskProcessor<T = any, R = any> = (job: Job<T>) => Promise<R>;

/**
 * 队列管理器类
 */
export class QueueManager {
  private queues: Map<string, Queue> = new Map();
  private processors: Map<string, TaskProcessor> = new Map();

  /**
   * 创建或获取队列
   * @param config 队列配置
   */
  getQueue(config: QueueConfig): Queue {
    const { name, defaultJobOptions, redis } = config;

    if (this.queues.has(name)) {
      return this.queues.get(name)!;
    }

    const queue = new Bull(name, {
      redis: redis || {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD
      },
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000
        },
        ...defaultJobOptions
      }
    });

    // 监听队列事件
    this.setupQueueEvents(queue, name);

    this.queues.set(name, queue);
    logger.info(`✅ 队列创建成功: ${name}`);

    return queue;
  }

  /**
   * 设置队列事件监听
   * @param queue 队列实例
   * @param name 队列名称
   */
  private setupQueueEvents(queue: Queue, name: string): void {
    // 队列错误事件
    queue.on('error', (error) => {
      logger.error(`❌ 队列错误 [${name}]:`, error);
    });

    // 任务完成事件
    queue.on('completed', (job, result) => {
      logger.info(`✅ 任务完成 [${name}]:`, {
        jobId: job.id,
        data: job.data,
        result: result
      });
    });

    // 任务失败事件
    queue.on('failed', (job, error) => {
      logger.error(`❌ 任务失败 [${name}]:`, {
        jobId: job.id,
        data: job.data,
        error: error.message,
        attempts: job.attemptsMade
      });
    });

    // 任务重试事件
    queue.on('retried', (job, error) => {
      logger.warn(`🔄 任务重试 [${name}]:`, {
        jobId: job.id,
        attempts: job.attemptsMade,
        error: error?.message
      });
    });
  }

  /**
   * 添加任务到队列
   * @param queueName 队列名称
   * @param data 任务数据
   * @param options 任务选项
   */
  async addTask<T = any>(queueName: string, data: T, options?: Bull.JobOptions): Promise<Job<T>> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`队列 ${queueName} 不存在`);
    }

    const job = await queue.add(data, options);
    logger.debug(`📥 任务添加到队列 [${queueName}]:`, {
      jobId: job.id,
      data: data
    });

    return job;
  }

  /**
   * 为队列添加处理器
   * @param queueName 队列名称
   * @param processor 任务处理器
   */
  addProcessor<T = any>(queueName: string, processor: TaskProcessor<T>): void {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`队列 ${queueName} 不存在`);
    }

    queue.process(processor);
    this.processors.set(queueName, processor);
    logger.info(`🔧 处理器添加到队列 [${queueName}]`);
  }

  /**
   * 获取队列状态
   * @param queueName 队列名称
   */
  async getQueueStatus(queueName: string): Promise<{ [key: string]: number }> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      throw new Error(`队列 ${queueName} 不存在`);
    }

    const status = await queue.getJobCounts();
    // 将 JobCounts 转换为 { [key: string]: number } 类型
    return Object.entries(status).reduce((acc, [key, value]) => {
      acc[key] = value;
      return acc;
    }, {} as { [key: string]: number });
  }

  /**
   * 关闭指定队列
   * @param queueName 队列名称
   */
  async closeQueue(queueName: string): Promise<void> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      return;
    }

    await queue.close();
    this.queues.delete(queueName);
    this.processors.delete(queueName);
    logger.info(`🔴 队列已关闭: ${queueName}`);
  }

  /**
   * 移除队列中的任务
   * @param queueName 队列名称
   * @param taskId 任务ID
   */
  async removeTask(queueName: string, taskId: string): Promise<boolean> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      return false;
    }

    try {
      // 在 Bull 中，我们可以通过任务 ID 查找并移除任务
      // 这里我们使用 taskId 作为 job 的 ID
      // 注意：Bull 中的 job ID 是数字，而我们的 taskId 是字符串，所以我们需要通过 data 中的 taskId 来查找
      const jobs = await queue.getJobs(['waiting', 'active']);
      for (const job of jobs) {
        if (job.data.taskId === taskId) {
          await job.remove();
          logger.info(`⏹️  任务已从队列移除 [${queueName}]: ${taskId}`);
          return true;
        }
      }
      return false;
    } catch (error) {
      logger.error(`❌ 移除任务失败 [${queueName}]:`, error);
      return false;
    }
  }

  /**
   * 关闭所有队列
   */
  async close(): Promise<void> {
    const queueNames = Array.from(this.queues.keys());
    for (const name of queueNames) {
      await this.closeQueue(name);
    }
    logger.info('🔴 所有队列已关闭');
  }
}
