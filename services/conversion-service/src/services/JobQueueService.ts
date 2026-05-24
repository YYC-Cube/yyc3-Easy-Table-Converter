/**
 * @file 任务队列服务
 * @description 管理转换任务队列和异步处理的服务
 * @module services/conversion-service/services
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-22
 */

import { ConversionTask } from '../engine/ConversionEngine';
import { ConversionOptions } from '../types';
import { LoggerService } from './LoggerService';
import { EventEmitter } from 'events';

/**
 * 任务状态枚举
 */
export enum JobStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

/**
 * 任务结果接口
 */
export interface JobResult {
  data?: Buffer;
  metadata?: any;
  error?: string;
}

/**
 * 任务队列项接口
 */
export interface JobQueueItem {
  id: string;
  task: ConversionTask;
  status: JobStatus;
  progress: number;
  createdAt: number;
  updatedAt: number;
  startedAt?: number;
  completedAt?: number;
  result?: JobResult;
}

/**
 * 任务队列服务类
 */
export class JobQueueService extends EventEmitter {
  private logger: LoggerService;
  private jobQueue: JobQueueItem[] = [];
  private jobMap: Map<string, JobQueueItem> = new Map();
  private workerRunning: boolean = false;
  private maxConcurrentJobs: number = 5;
  private activeJobs: Set<string> = new Set();

  constructor() {
    super();
    this.logger = new LoggerService('JobQueueService');
    this.setMaxListeners(100); // 增加事件监听器限制
  }

  /**
   * 添加任务到队列
   * @param task 转换任务
   * @returns 任务ID
   */
  public addJob(task: Omit<ConversionTask, 'options'> & { options: ConversionOptions }): string {
    const jobId = task.id;
    
    const jobItem: JobQueueItem = {
      id: jobId,
      task,
      status: JobStatus.PENDING,
      progress: 0,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    // 添加到队列和映射
    this.jobQueue.push(jobItem);
    this.jobMap.set(jobId, jobItem);

    this.logger.info(`任务已添加到队列: ${jobId}`, {
      sourceFormat: task.sourceFormat,
      targetFormat: task.targetFormat
    });

    // 触发任务添加事件
    this.emit('job_added', jobItem);

    // 如果工作器已启动，尝试处理任务
    if (this.workerRunning) {
      this.processNextJob();
    }

    return jobId;
  }

  /**
   * 获取任务状态
   * @param jobId 任务ID
   * @returns 任务信息
   */
  public getJobStatus(jobId: string): JobQueueItem | undefined {
    return this.jobMap.get(jobId);
  }

  /**
   * 获取队列统计信息
   */
  public getQueueStats(): {
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    total: number;
    active: number;
  } {
    const stats = {
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      total: this.jobMap.size,
      active: this.activeJobs.size
    };

    this.jobMap.forEach(job => {
      switch (job.status) {
        case JobStatus.PENDING:
          stats.pending++;
          break;
        case JobStatus.PROCESSING:
          stats.processing++;
          break;
        case JobStatus.COMPLETED:
          stats.completed++;
          break;
        case JobStatus.FAILED:
        case JobStatus.CANCELLED:
          stats.failed++;
          break;
      }
    });

    return stats;
  }

  /**
   * 初始化工作器
   */
  public initializeWorker(): void {
    if (this.workerRunning) {
      this.logger.warn('工作器已经在运行');
      return;
    }

    this.workerRunning = true;
    this.logger.info('任务队列工作器已启动');

    // 开始处理队列中的任务
    this.processNextJob();
  }

  /**
   * 停止工作器
   */
  public stopWorker(): void {
    this.workerRunning = false;
    this.logger.info('任务队列工作器已停止');
  }

  /**
   * 处理下一个任务
   */
  private processNextJob(): void {
    if (!this.workerRunning) {
      return;
    }

    // 检查是否已达到最大并发任务数
    if (this.activeJobs.size >= this.maxConcurrentJobs) {
      this.logger.debug(`已达到最大并发任务数: ${this.maxConcurrentJobs}`);
      return;
    }

    // 找到下一个待处理的任务
    const nextJobIndex = this.jobQueue.findIndex(job => job.status === JobStatus.PENDING);
    if (nextJobIndex === -1) {
      this.logger.debug('队列中没有待处理的任务');
      return;
    }

    const jobItem = this.jobQueue[nextJobIndex];
    
    // 从队列中移除（保持映射中的引用）
    this.jobQueue.splice(nextJobIndex, 1);
    
    // 开始处理任务
    this.startProcessingJob(jobItem);

    // 继续处理下一个任务
    setImmediate(() => this.processNextJob());
  }

  /**
   * 开始处理任务
   */
  private async startProcessingJob(jobItem: JobQueueItem): Promise<void> {
    const jobId = jobItem.id;
    
    // 更新任务状态
    jobItem.status = JobStatus.PROCESSING;
    jobItem.progress = 10;
    jobItem.startedAt = Date.now();
    jobItem.updatedAt = Date.now();

    // 添加到活跃任务集合
    this.activeJobs.add(jobId);

    this.logger.info(`开始处理任务: ${jobId}`);

    // 触发任务开始处理事件
    this.emit('job_started', jobItem);

    try {
      // 这里应该导入并使用ConversionEngine，但为了避免循环依赖，使用模拟处理
      // 在实际应用中，应该通过依赖注入获取ConversionEngine实例
      await this.simulateJobProcessing(jobItem);

      // 更新任务为完成状态
      jobItem.status = JobStatus.COMPLETED;
      jobItem.progress = 100;
      jobItem.completedAt = Date.now();
      jobItem.updatedAt = Date.now();

      this.logger.info(`任务处理完成: ${jobId}`);

      // 触发任务完成事件
      this.emit('job_completed', jobItem);
    } catch (error) {
      // 处理任务失败
      jobItem.status = JobStatus.FAILED;
      jobItem.progress = 0;
      jobItem.updatedAt = Date.now();
      jobItem.result = {
        error: error instanceof Error ? error.message : String(error)
      };

      this.logger.error(`任务处理失败: ${jobId}`, {
        error: error instanceof Error ? error.message : String(error)
      });

      // 触发任务失败事件
      this.emit('job_failed', jobItem);
    } finally {
      // 从活跃任务集合中移除
      this.activeJobs.delete(jobId);

      // 处理下一个任务
      setImmediate(() => this.processNextJob());
    }
  }

  /**
   * 模拟任务处理（实际应用中应替换为真实的转换逻辑）
   */
  private async simulateJobProcessing(jobItem: JobQueueItem): Promise<void> {
    // 模拟进度更新
    const updateProgress = (progress: number) => {
      jobItem.progress = progress;
      jobItem.updatedAt = Date.now();
      this.emit('job_progress', jobItem);
    };

    // 模拟处理时间（根据数据大小估算）
    const dataSize = typeof jobItem.task.sourceData === 'string' 
      ? jobItem.task.sourceData.length 
      : jobItem.task.sourceData.length;
    
    const processingTime = Math.min(5000, Math.max(1000, dataSize / 1024)); // 1-5秒

    // 模拟进度更新
    await new Promise(resolve => setTimeout(resolve, processingTime * 0.2));
    updateProgress(30);
    
    await new Promise(resolve => setTimeout(resolve, processingTime * 0.3));
    updateProgress(60);
    
    await new Promise(resolve => setTimeout(resolve, processingTime * 0.3));
    updateProgress(85);
    
    await new Promise(resolve => setTimeout(resolve, processingTime * 0.2));
    
    // 设置模拟结果
    jobItem.result = {
      data: Buffer.from('模拟转换结果数据'),
      metadata: {
        processTime: processingTime,
        rowCount: Math.floor(Math.random() * 1000) + 100,
        columnCount: Math.floor(Math.random() * 20) + 5
      }
    };
  }

  /**
   * 取消任务
   * @param jobId 任务ID
   * @returns 是否成功取消
   */
  public cancelJob(jobId: string): boolean {
    const jobItem = this.jobMap.get(jobId);
    if (!jobItem) {
      return false;
    }

    // 只能取消待处理的任务
    if (jobItem.status !== JobStatus.PENDING) {
      this.logger.warn(`无法取消任务: ${jobId}，状态不是pending`);
      return false;
    }

    // 更新任务状态
    jobItem.status = JobStatus.CANCELLED;
    jobItem.updatedAt = Date.now();

    // 从队列中移除
    const index = this.jobQueue.findIndex(job => job.id === jobId);
    if (index !== -1) {
      this.jobQueue.splice(index, 1);
    }

    this.logger.info(`任务已取消: ${jobId}`);
    this.emit('job_cancelled', jobItem);

    return true;
  }

  /**
   * 清理过期任务
   * @param maxAge 最大保留时间（毫秒）
   */
  public cleanupOldJobs(maxAge: number = 24 * 60 * 60 * 1000): void {
    const now = Date.now();
    const oldJobIds: string[] = [];

    this.jobMap.forEach((jobItem, jobId) => {
      if (
        (jobItem.status === JobStatus.COMPLETED || 
         jobItem.status === JobStatus.FAILED || 
         jobItem.status === JobStatus.CANCELLED) &&
        (now - jobItem.updatedAt > maxAge)
      ) {
        oldJobIds.push(jobId);
      }
    });

    oldJobIds.forEach(jobId => {
      this.jobMap.delete(jobId);
    });

    this.logger.info(`清理了 ${oldJobIds.length} 个过期任务`);
  }

  /**
   * 设置最大并发任务数
   */
  public setMaxConcurrentJobs(max: number): void {
    if (max > 0) {
      this.maxConcurrentJobs = max;
      this.logger.info(`已设置最大并发任务数: ${max}`);
      
      // 如果增加了并发数，尝试立即处理更多任务
      if (this.workerRunning) {
        setImmediate(() => this.processNextJob());
      }
    }
  }
}
