/**
 * @file 批处理任务服务
 * @description 提供高级批处理功能，包括任务分组、优先级管理和进度跟踪
 * @module services/BatchJobService
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-23
 */

import { v4 as uuidv4 } from 'uuid';
import { EventEmitter } from 'events';
import {
  ConversionRequest,
  ConversionResponse,
  ConversionStatus,
  ConversionTask
} from '../types';
import { JobQueueService } from './JobQueueService';
import { logger } from '../utils/logger';

/**
 * 批处理任务优先级枚举
 */
export enum BatchJobPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}

/**
 * 批处理任务配置接口
 */
export interface BatchJobConfig {
  /** 最大并发数 */
  maxConcurrency?: number;
  /** 任务优先级 */
  priority?: BatchJobPriority;
  /** 是否自动启动 */
  autoStart?: boolean;
  /** 任务超时时间（毫秒） */
  timeoutMs?: number;
  /** 错误处理策略 */
  errorHandling?: 'continue' | 'stop' | 'retry';
  /** 最大重试次数 */
  maxRetries?: number;
  /** 任务组ID */
  groupId?: string;
}

/**
 * 批处理任务接口
 */
export interface BatchJob {
  /** 任务ID */
  id: string;
  /** 任务名称 */
  name?: string;
  /** 任务描述 */
  description?: string;
  /** 转换请求列表 */
  requests: ConversionRequest[];
  /** 转换响应列表 */
  responses: Map<string, ConversionResponse>;
  /** 任务状态 */
  status: ConversionStatus;
  /** 任务配置 */
  config: BatchJobConfig;
  /** 总体进度 */
  progress: number;
  /** 已完成任务数 */
  completedCount: number;
  /** 失败任务数 */
  failedCount: number;
  /** 创建时间 */
  createdAt: Date;
  /** 更新时间 */
  updatedAt: Date;
  /** 开始时间 */
  startedAt?: Date;
  /** 完成时间 */
  completedAt?: Date;
  /** 元数据 */
  metadata?: Record<string, any>;
}

/**
 * 批处理任务服务类
 */
export class BatchJobService extends EventEmitter {
  private jobQueueService: JobQueueService;
  private batchJobs: Map<string, BatchJob> = new Map();
  private processingJobs: Set<string> = new Set();
  private jobGroups: Map<string, Set<string>> = new Map();
  private defaultConfig: BatchJobConfig = {
    maxConcurrency: 5,
    priority: BatchJobPriority.MEDIUM,
    autoStart: true,
    timeoutMs: 3600000, // 1小时
    errorHandling: 'continue',
    maxRetries: 0
  };

  constructor(jobQueueService: JobQueueService) {
    super();
    this.jobQueueService = jobQueueService;
    this.setMaxListeners(100);
    this.initializeEventListeners();
  }

  /**
   * 初始化事件监听器
   */
  private initializeEventListeners(): void {
    // 监听任务队列事件
    this.jobQueueService.on('job_completed', (jobItem) => {
      this.handleJobItemCompleted(jobItem);
    });

    this.jobQueueService.on('job_failed', (jobItem) => {
      this.handleJobItemFailed(jobItem);
    });

    this.jobQueueService.on('job_progress', (jobItem) => {
      this.handleJobItemProgress(jobItem);
    });
  }

  /**
   * 创建新的批处理任务
   * @param requests 转换请求列表
   * @param config 批处理配置
   * @param metadata 附加元数据
   * @returns 批处理任务ID
   */
  public createBatchJob(
    requests: ConversionRequest[],
    config?: Partial<BatchJobConfig>,
    metadata?: Record<string, any>
  ): string {
    const jobId = uuidv4();
    const mergedConfig = { ...this.defaultConfig, ...config };
    
    const batchJob: BatchJob = {
      id: jobId,
      requests,
      responses: new Map(),
      status: ConversionStatus.PENDING,
      config: mergedConfig,
      progress: 0,
      completedCount: 0,
      failedCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata
    };

    this.batchJobs.set(jobId, batchJob);
    
    // 如果有组ID，添加到任务组
    if (mergedConfig.groupId) {
      if (!this.jobGroups.has(mergedConfig.groupId)) {
        this.jobGroups.set(mergedConfig.groupId, new Set());
      }
      this.jobGroups.get(mergedConfig.groupId)!.add(jobId);
    }

    logger.info(`创建批处理任务: ${jobId}, 请求数: ${requests.length}`);
    this.emit('batch_job_created', batchJob);

    // 如果配置了自动启动，则启动任务
    if (mergedConfig.autoStart) {
      this.startBatchJob(jobId);
    }

    return jobId;
  }

  /**
   * 启动批处理任务
   * @param jobId 任务ID
   * @returns 是否成功启动
   */
  public startBatchJob(jobId: string): boolean {
    const job = this.batchJobs.get(jobId);
    if (!job) {
      logger.error(`找不到批处理任务: ${jobId}`);
      return false;
    }

    if (job.status !== ConversionStatus.PENDING) {
      logger.warn(`无法启动任务: ${jobId}，状态不是pending`);
      return false;
    }

    // 更新任务状态
    job.status = ConversionStatus.PROCESSING;
    job.startedAt = new Date();
    job.updatedAt = new Date();
    
    this.processingJobs.add(jobId);
    logger.info(`开始批处理任务: ${jobId}`);
    this.emit('batch_job_started', job);

    // 提交所有子任务到队列
    this.submitTasksToQueue(job);
    
    return true;
  }

  /**
   * 暂停批处理任务
   * @param jobId 任务ID
   * @returns 是否成功暂停
   */
  public pauseBatchJob(jobId: string): boolean {
    const job = this.batchJobs.get(jobId);
    if (!job) {
      logger.error(`找不到批处理任务: ${jobId}`);
      return false;
    }

    if (job.status !== ConversionStatus.PROCESSING) {
      logger.warn(`无法暂停任务: ${jobId}，状态不是processing`);
      return false;
    }

    // TODO: 实现任务暂停逻辑
    logger.info(`暂停批处理任务: ${jobId}`);
    this.emit('batch_job_paused', job);
    
    return true;
  }

  /**
   * 恢复批处理任务
   * @param jobId 任务ID
   * @returns 是否成功恢复
   */
  public resumeBatchJob(jobId: string): boolean {
    const job = this.batchJobs.get(jobId);
    if (!job) {
      logger.error(`找不到批处理任务: ${jobId}`);
      return false;
    }

    // TODO: 实现任务恢复逻辑
    logger.info(`恢复批处理任务: ${jobId}`);
    this.emit('batch_job_resumed', job);
    
    return true;
  }

  /**
   * 取消批处理任务
   * @param jobId 任务ID
   * @returns 是否成功取消
   */
  public cancelBatchJob(jobId: string): boolean {
    const job = this.batchJobs.get(jobId);
    if (!job) {
      logger.error(`找不到批处理任务: ${jobId}`);
      return false;
    }

    if (job.status === ConversionStatus.COMPLETED || job.status === ConversionStatus.FAILED) {
      logger.warn(`无法取消任务: ${jobId}，任务已完成或失败`);
      return false;
    }

    // 更新任务状态
    job.status = ConversionStatus.FAILED;
    job.updatedAt = new Date();
    this.processingJobs.delete(jobId);
    
    logger.info(`取消批处理任务: ${jobId}`);
    this.emit('batch_job_cancelled', job);
    
    return true;
  }

  /**
   * 获取批处理任务状态
   * @param jobId 任务ID
   * @returns 任务信息或undefined
   */
  public getBatchJobStatus(jobId: string): BatchJob | undefined {
    return this.batchJobs.get(jobId);
  }

  /**
   * 获取任务组中的所有任务
   * @param groupId 任务组ID
   * @returns 任务列表
   */
  public getBatchJobsByGroup(groupId: string): BatchJob[] {
    const jobIds = this.jobGroups.get(groupId);
    if (!jobIds) {
      return [];
    }
    
    return Array.from(jobIds)
      .map(id => this.batchJobs.get(id))
      .filter((job): job is BatchJob => job !== undefined);
  }

  /**
   * 获取所有批处理任务
   * @param statusFilter 状态过滤（可选）
   * @returns 任务列表
   */
  public getAllBatchJobs(statusFilter?: ConversionStatus): BatchJob[] {
    const jobs = Array.from(this.batchJobs.values());
    
    if (statusFilter) {
      return jobs.filter(job => job.status === statusFilter);
    }
    
    return jobs;
  }

  /**
   * 获取批处理任务统计信息
   * @returns 统计信息
   */
  public getBatchJobStats(): {
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    total: number;
  } {
    const stats = {
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
      total: this.batchJobs.size
    };

    this.batchJobs.forEach(job => {
      switch (job.status) {
        case ConversionStatus.PENDING:
          stats.pending++;
          break;
        case ConversionStatus.PROCESSING:
          stats.processing++;
          break;
        case ConversionStatus.COMPLETED:
          stats.completed++;
          break;
        case ConversionStatus.FAILED:
          stats.failed++;
          break;
      }
    });

    return stats;
  }

  /**
   * 将任务提交到队列
   * @param job 批处理任务
   */
  private submitTasksToQueue(job: BatchJob): void {
    // 设置队列的最大并发数
    this.jobQueueService.setMaxConcurrentJobs(job.config.maxConcurrency || 5);
    
    // 确保工作器已启动
    this.jobQueueService.initializeWorker();
    
    // 提交所有转换请求
    job.requests.forEach((request, index) => {
      const task: ConversionTask = {
        id: `${job.id}_task_${index}`,
        sourceData: request.sourceData,
        sourceFormat: request.sourceFormat,
        targetFormat: request.targetFormat,
        options: request.options || {},
        status: ConversionStatus.PENDING,
        metadata: {
          batchJobId: job.id,
          taskIndex: index,
          ...job.metadata
        }
      };
      
      this.jobQueueService.addJob(task);
    });
  }

  /**
   * 处理单个任务完成
   * @param jobItem 任务项
   */
  private handleJobItemCompleted(jobItem: any): void {
    const batchJobId = jobItem.task.metadata?.batchJobId;
    if (!batchJobId) return;
    
    const batchJob = this.batchJobs.get(batchJobId);
    if (!batchJob) return;
    
    const taskIndex = jobItem.task.metadata?.taskIndex;
    if (taskIndex !== undefined && taskIndex < batchJob.requests.length) {
      // 创建响应对象
      const response: ConversionResponse = {
        data: jobItem.result?.data || '',
        format: batchJob.requests[taskIndex].targetFormat,
        stats: {
          rowCount: jobItem.result?.metadata?.rowCount || 0,
          columnCount: jobItem.result?.metadata?.columnCount || 0,
          processingTime: jobItem.result?.metadata?.processTime || 0
        },
        success: true
      };
      
      batchJob.responses.set(jobItem.id, response);
      batchJob.completedCount++;
      this.updateBatchJobProgress(batchJob);
      
      // 检查是否所有任务都已完成
      this.checkBatchJobCompletion(batchJob);
    }
  }

  /**
   * 处理单个任务失败
   * @param jobItem 任务项
   */
  private handleJobItemFailed(jobItem: any): void {
    const batchJobId = jobItem.task.metadata?.batchJobId;
    if (!batchJobId) return;
    
    const batchJob = this.batchJobs.get(batchJobId);
    if (!batchJob) return;
    
    // 创建失败响应
    const response: ConversionResponse = {
      data: '',
      format: jobItem.task.targetFormat,
      stats: {
        rowCount: 0,
        columnCount: 0,
        processingTime: 0
      },
      success: false,
      error: jobItem.result?.error || '任务处理失败'
    };
    
    batchJob.responses.set(jobItem.id, response);
    batchJob.failedCount++;
    this.updateBatchJobProgress(batchJob);
    
    // 根据错误处理策略决定后续操作
    if (batchJob.config.errorHandling === 'stop') {
      this.cancelBatchJob(batchJob.id);
    } else if (batchJob.config.errorHandling === 'retry') {
      // TODO: 实现重试逻辑
    }
    
    // 检查是否所有任务都已完成
    this.checkBatchJobCompletion(batchJob);
  }

  /**
   * 处理任务进度更新
   * @param jobItem 任务项
   */
  private handleJobItemProgress(jobItem: any): void {
    const batchJobId = jobItem.task.metadata?.batchJobId;
    if (!batchJobId) return;
    
    const batchJob = this.batchJobs.get(batchJobId);
    if (!batchJob) return;
    
    // 可以根据需要实现更复杂的进度计算
    this.updateBatchJobProgress(batchJob);
  }

  /**
   * 更新批处理任务进度
   * @param job 批处理任务
   */
  private updateBatchJobProgress(job: BatchJob): void {
    const totalTasks = job.requests.length;
    const processedTasks = job.completedCount + job.failedCount;
    
    job.progress = totalTasks > 0 ? Math.round((processedTasks / totalTasks) * 100) : 0;
    job.updatedAt = new Date();
    
    this.emit('batch_job_progress', job);
  }

  /**
   * 检查批处理任务是否完成
   * @param job 批处理任务
   */
  private checkBatchJobCompletion(job: BatchJob): void {
    if (job.completedCount + job.failedCount >= job.requests.length) {
      job.status = job.failedCount > 0 && job.config.errorHandling === 'stop' 
        ? ConversionStatus.FAILED 
        : ConversionStatus.COMPLETED;
      job.completedAt = new Date();
      job.updatedAt = new Date();
      this.processingJobs.delete(job.id);
      
      logger.info(`批处理任务完成: ${job.id}, 成功: ${job.completedCount}, 失败: ${job.failedCount}`);
      this.emit('batch_job_completed', job);
    }
  }

  /**
   * 清理过期任务
   * @param maxAge 最大保留时间（毫秒）
   */
  public cleanupOldJobs(maxAge: number = 24 * 60 * 60 * 1000): void {
    const now = Date.now();
    const oldJobIds: string[] = [];

    this.batchJobs.forEach((job, jobId) => {
      if (
        (job.status === ConversionStatus.COMPLETED || job.status === ConversionStatus.FAILED) &&
        (now - job.createdAt.getTime() > maxAge)
      ) {
        oldJobIds.push(jobId);
        
        // 从任务组中移除
        if (job.config.groupId && this.jobGroups.has(job.config.groupId)) {
          this.jobGroups.get(job.config.groupId)!.delete(jobId);
        }
      }
    });

    oldJobIds.forEach(jobId => {
      this.batchJobs.delete(jobId);
    });

    logger.info(`清理了 ${oldJobIds.length} 个过期批处理任务`);
  }
}

/**
 * 批处理任务服务单例实例
 */
export const batchJobService = new BatchJobService(
  new JobQueueService()
);
