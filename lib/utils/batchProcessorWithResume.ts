/**
 * @file 支持断点续传的批量处理器
 * @description 扩展标准BatchProcessor，添加断点续传、进度监控和恢复功能
 * @module utils/batchProcessorWithResume
 * @author YYC
 * @version 1.0.0
 * @created 2024-07-12
 */

import { BatchProcessor } from './batchProcessor';
import {
  BatchTaskExtended,
  ProgressUpdateEvent,
  ResumeConfig,
  ProgressCallback,
  TaskProcessor,
  CheckpointStorage
} from '@/lib/types/progress.types';

/**
 * 本地存储实现的检查点存储
 */
export class LocalStorageCheckpoint implements CheckpointStorage {
  private readonly prefix = 'batch_processor_checkpoint_';

  async saveCheckpoint(taskId: string, checkpoint: BatchTaskExtended['checkpoint']): Promise<void> {
    if (!checkpoint) return;
    localStorage.setItem(`${this.prefix}${taskId}`, JSON.stringify(checkpoint));
  }

  async getCheckpoint(taskId: string): Promise<BatchTaskExtended['checkpoint'] | null> {
    const data = localStorage.getItem(`${this.prefix}${taskId}`);
    if (!data) return null;
    try {
      return JSON.parse(data);
    } catch (error) {
      console.error('解析检查点失败:', error);
      return null;
    }
  }

  async deleteCheckpoint(taskId: string): Promise<void> {
    localStorage.removeItem(`${this.prefix}${taskId}`);
  }

  async listCheckpoints(): Promise<Array<{ taskId: string; checkpoint: BatchTaskExtended['checkpoint'] }>> {
    const checkpoints = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.prefix)) {
        const taskId = key.replace(this.prefix, '');
        const checkpoint = await this.getCheckpoint(taskId);
        if (checkpoint) {
          checkpoints.push({ taskId, checkpoint });
        }
      }
    }
    return checkpoints;
  }
}

/**
 * 支持断点续传的批量处理器类
 */
export class BatchProcessorWithResume extends BatchProcessor {
  private tasks: Map<string, BatchTaskExtended> = new Map();
  private checkpointStorage: CheckpointStorage;
  private config: ResumeConfig;
  private progressCallbacks: Set<ProgressCallback> = new Set();
  private processingTasks: Map<string, boolean> = new Map();
  private checkPointTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor(
    config: Partial<ResumeConfig> = {},
    checkpointStorage: CheckpointStorage = new LocalStorageCheckpoint()
  ) {
    super();
    this.checkpointStorage = checkpointStorage;
    this.config = {
      enabled: true,
      chunkSize: 5 * 1024 * 1024, // 5MB 默认块大小
      maxRetries: 3,
      retryDelay: 2000,
      checkpointInterval: 5000,
      ...config
    };
  }

  /**
   * 添加单个任务
   */
  addTask(file: File): string {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const chunkSize = this.config.chunkSize;
    const totalChunks = Math.ceil(file.size / chunkSize);
    
    const task: BatchTaskExtended = {
      id,
      file,
      status: 'pending',
      progress: 0,
      totalChunks,
      completedChunks: 0,
      chunkSize,
      uploadedBytes: 0,
      retryCount: 0,
      chunksMap: new Map(),
      startTime: Date.now()
    };
    
    this.tasks.set(id, task);
    this.notifyProgress();
    return id;
  }

  /**
   * 暂停任务
   */
  async pauseTask(taskId: string): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task || task.status !== 'processing') return;
    
    // 保存检查点
    task.status = 'paused';
    task.pausePosition = task.uploadedBytes;
    task.checkpoint = {
      position: task.uploadedBytes,
      timestamp: Date.now()
    };
    
    await this.checkpointStorage.saveCheckpoint(taskId, task.checkpoint);
    
    // 清除定时器
    this.clearCheckpointTimer(taskId);
    this.processingTasks.delete(taskId);
    
    this.updateTask(taskId, {}); // 触发更新
  }

  /**
   * 恢复任务
   */
  async resumeTask(taskId: string): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task || task.status !== 'paused') return;
    
    const checkpoint = await this.checkpointStorage.getCheckpoint(taskId);
    if (checkpoint) {
      task.status = 'processing';
      task.uploadedBytes = checkpoint.position;
      task.progress = (checkpoint.position / task.file.size) * 100;
      
      // 这里可以继续处理任务，但需要与具体的处理器结合
      this.updateTask(taskId, {});
    }
  }

  /**
   * 处理批量任务，支持断点续传
   */
  async processBatchWithResume<T>(
    processor: TaskProcessor<T>,
    concurrency = 3
  ): Promise<void> {
    const pendingTasks = this.getTasks().filter((t) => 
      t.status === 'pending' || t.status === 'paused'
    );
    const chunks: BatchTaskExtended[][] = [];

    for (let i = 0; i < pendingTasks.length; i += concurrency) {
      chunks.push(pendingTasks.slice(i, i + concurrency));
    }

    for (const chunk of chunks) {
      await Promise.all(
        chunk.map(async (task) => {
          if (this.processingTasks.has(task.id)) return;
          
          this.processingTasks.set(task.id, true);
          this.updateTask(task.id, { status: 'processing' });
          
          // 启动检查点定时器
          this.startCheckpointTimer(task.id);
          
          let startFrom = 0;
          if (task.pausePosition) {
            startFrom = task.pausePosition;
          } else {
            // 尝试从存储中恢复检查点
            const checkpoint = await this.checkpointStorage.getCheckpoint(task.id);
            if (checkpoint) {
              startFrom = checkpoint.position;
              task.uploadedBytes = checkpoint.position;
            }
          }
          
          try {
            // 带断点续传的处理逻辑
            const result = await this.processWithRetry(
              task,
              processor,
              startFrom
            );
            
            this.updateTask(task.id, {
              status: 'completed',
              progress: 100,
              uploadedBytes: task.file.size,
              completedChunks: task.totalChunks,
              result: result as Blob | string
            });
            
            // 处理完成后删除检查点
            await this.checkpointStorage.deleteCheckpoint(task.id);
          } catch (error) {
            this.updateTask(task.id, {
              status: 'error',
              error: error instanceof Error ? error.message : '处理失败'
            });
          } finally {
            this.clearCheckpointTimer(task.id);
            this.processingTasks.delete(task.id);
          }
        })
      );
    }
  }

  /**
   * 带重试机制的任务处理
   */
  private async processWithRetry<T>(
    task: BatchTaskExtended,
    processor: TaskProcessor<T>,
    startFrom: number
  ): Promise<T> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          // 重试前等待
          await new Promise(resolve => setTimeout(resolve, this.config.retryDelay));
          task.retryCount = attempt;
        }
        
        return await processor(
          task.file,
          (progress, chunkIndex) => {
            const totalProgress = startFrom > 0 
              ? (startFrom / task.file.size) * 100 + progress * (1 - startFrom / task.file.size)
              : progress;
              
            task.progress = Math.min(totalProgress, 100);
            task.uploadedBytes = Math.min(
              startFrom + Math.floor((progress / 100) * task.file.size),
              task.file.size
            );
            
            if (chunkIndex !== undefined) {
              task.completedChunks = chunkIndex + 1;
              task.chunksMap.set(chunkIndex, true);
            }
            
            this.updateTaskProgress(task.id, {
              progress: task.progress,
              uploadedBytes: task.uploadedBytes,
              status: task.status,
              chunkIndex
            });
          },
          startFrom
        );
      } catch (error) {
        lastError = error as Error;
        console.warn(`任务处理失败，尝试重试 (${attempt + 1}/${this.config.maxRetries}):`, error);
      }
    }
    
    throw lastError || new Error('达到最大重试次数');
  }

  /**
   * 开始检查点定时器
   */
  private startCheckpointTimer(taskId: string): void {
    this.clearCheckpointTimer(taskId);
    
    const timer = setInterval(async () => {
      const task = this.tasks.get(taskId);
      if (task && task.status === 'processing' && task.uploadedBytes > 0) {
        const checkpoint: BatchTaskExtended['checkpoint'] = {
          position: task.uploadedBytes,
          timestamp: Date.now()
        };
        await this.checkpointStorage.saveCheckpoint(taskId, checkpoint);
      }
    }, this.config.checkpointInterval);
    
    this.checkPointTimers.set(taskId, timer);
  }

  /**
   * 清除检查点定时器
   */
  private clearCheckpointTimer(taskId: string): void {
    const timer = this.checkPointTimers.get(taskId);
    if (timer) {
      clearInterval(timer);
      this.checkPointTimers.delete(taskId);
    }
  }

  /**
   * 注册进度回调
   */
  onProgressWithDetails(callback: ProgressCallback): void {
    this.progressCallbacks.add(callback);
  }

  /**
   * 移除进度回调
   */
  offProgressWithDetails(callback: ProgressCallback): void {
    this.progressCallbacks.delete(callback);
  }

  /**
   * 更新任务进度
   */
  private updateTaskProgress(taskId: string, event: ProgressUpdateEvent): void {
    this.progressCallbacks.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('进度回调执行失败:', error);
      }
    });
  }

  /**
   * 获取所有任务
   */
  getTasks(): BatchTaskExtended[] {
    return Array.from(this.tasks.values());
  }

  /**
   * 清除所有任务
   */
  async clearAll(): Promise<void> {
    // 清除所有定时器和检查点
    for (const taskId of this.tasks.keys()) {
      this.clearCheckpointTimer(taskId);
      await this.checkpointStorage.deleteCheckpoint(taskId);
    }
    this.tasks.clear();
    this.processingTasks.clear();
    this.notifyProgress();
  }

  /**
   * 销毁处理器，清理资源
   */
  async destroy(): Promise<void> {
    await this.clearAll();
    this.progressCallbacks.clear();
  }
}