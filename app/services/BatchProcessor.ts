/**
 * @file 批处理服务
 * @description 提供文件批量处理和AI功能集成的核心服务
 * @module services/BatchProcessor
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-24
 */

import { v4 as uuidv4 } from 'uuid';
import aiService from './AIService';
import { BatchFile, BatchStatus, BatchTask, BatchTaskConfig, BatchTaskStats } from '../types/batch';
import { TaskProgressCallback } from '../types/common';
import { TextProcessingRequest } from '../types/ai';

/**
 * 批处理服务类
 * 负责管理和执行批量文件处理任务，支持AI功能集成
 */
export class BatchProcessor {
  private tasks: Map<string, BatchTask> = new Map();
  private isProcessing: Map<string, boolean> = new Map();
  private isPaused: Map<string, boolean> = new Map();

  /**
   * 创建新的批处理任务
   * @param files 待处理的文件列表
   * @param progressCallback 进度回调函数
   * @returns 任务ID
   */
  async createTask(files: BatchFile[], progressCallback?: TaskProgressCallback): Promise<string> {
    const taskId = uuidv4();
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);

    const task: BatchTask = {
      id: taskId,
      files: [...files],
      totalFiles: files.length,
      completedFiles: 0,
      failedFiles: 0,
      totalSize,
      processedSize: 0,
      status: 'pending',
      config: {
        useAI: false,
        aiModelId: '',
        aiProcessingType: 'text',
        retryConfig: {
          maxRetries: 0,
          retryDelay: 1000
        },
        timeout: 30000,
        chunking: {
          enabled: false,
          chunkSize: 1000,
          overlap: 0
        }
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      startedAt: null,
      completedAt: null,
      processingTime: 0,
      ...(progressCallback && { progressCallback })
    };

    this.tasks.set(taskId, task);
    this.isProcessing.set(taskId, false);
    this.isPaused.set(taskId, false);

    // 持久化任务信息
    this.saveTask(task);

    return taskId;
  }

  /**
   * 配置批处理任务
   * @param taskId 任务ID
   * @param config 任务配置
   */
  configureTask(taskId: string, config: Partial<BatchTaskConfig>): void {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`任务 ${taskId} 不存在`);
    }

    task.config = {
      ...task.config,
      ...config,
      retryConfig: {
        ...task.config.retryConfig,
        ...(config.retryConfig || {})
      },
      chunking: {
        ...task.config.chunking,
        ...(config.chunking || {})
      }
    };

    task.updatedAt = new Date();
    this.saveTask(task);
  }

  /**
   * 获取任务信息
   * @param taskId 任务ID
   * @returns 任务信息
   */
  getTask(taskId: string): BatchTask | undefined {
    return this.tasks.get(taskId);
  }

  /**
   * 获取任务状态
   * @param taskId 任务ID
   * @returns 任务状态信息
   */
  getTaskStatus(taskId: string): { status: string; progress: number } {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`任务 ${taskId} 不存在`);
    }

    const progress = task.totalFiles > 0 
      ? Math.round((task.completedFiles + task.failedFiles) / task.totalFiles * 100)
      : 0;

    return {
      status: task.status,
      progress
    };
  }

  /**
   * 获取已处理的文件列表
   * @param taskId 任务ID
   * @returns 已处理的文件列表
   */
  getProcessedFiles(taskId: string): BatchFile[] {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`任务 ${taskId} 不存在`);
    }

    return [...task.files];
  }

  /**
   * 获取任务统计信息
   * @param taskId 任务ID
   * @returns 任务统计信息
   */
  getTaskStatistics(taskId: string): BatchTaskStats {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`任务 ${taskId} 不存在`);
    }

    return {
      totalFiles: task.totalFiles,
      completedFiles: task.completedFiles,
      failedFiles: task.failedFiles,
      processingTime: task.processingTime,
      averageProcessingTime: task.completedFiles > 0 
        ? task.processingTime / task.completedFiles
        : 0
    };
  }

  /**
   * 处理任务
   * @param taskId 任务ID
   */
  async processTask(taskId: string): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`任务 ${taskId} 不存在`);
    }

    if (this.isProcessing.get(taskId)) {
      throw new Error(`任务 ${taskId} 正在处理中`);
    }

    this.isProcessing.set(taskId, true);
    task.status = 'processing';
    task.startedAt = new Date();
    task.updatedAt = new Date();

    const startTime = performance.now();
    let isCancelled = false;

    // 处理取消事件的清理函数
    const cleanup = () => {
      this.isProcessing.set(taskId, false);
      task.updatedAt = new Date();
      this.saveTask(task);
    };

    try {
      // 执行文件处理
      for (let i = 0; i < task.files.length && !isCancelled; i++) {
        // 检查任务是否被暂停
        while (this.isPaused.get(taskId) && !isCancelled) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        // 检查任务是否被取消
        if (task.status as any === 'cancelled') {
          isCancelled = true;
          break;
        }

        const file = task.files[i];
        await this.processFile(file, task.config);

        // 更新任务状态
        if (file.status === BatchStatus.COMPLETED) {
          task.completedFiles++;
        } else if (file.status === BatchStatus.ERROR) {
          task.failedFiles++;
        }

        task.processedSize += file.size;
        task.updatedAt = new Date();
        this.saveTask(task);

        // 触发进度回调
        if (task.progressCallback) {
          const progress = Math.round((task.completedFiles + task.failedFiles) / task.totalFiles * 100);
          task.progressCallback({
            taskId,
            progress,
            completedFiles: task.completedFiles,
            failedFiles: task.failedFiles,
            totalFiles: task.totalFiles
          });
        }
      }

      // 更新任务完成状态
      if (!isCancelled) {
        task.status = task.failedFiles > 0 ? 'completed_with_errors' : 'completed';
      }
    } catch (error) {
      console.error(`任务 ${taskId} 处理失败:`, error);
      task.status = 'error';
      throw error;
    } finally {
      if ((task.status as any) !== 'cancelled') {
        task.completedAt = new Date();
        task.processingTime = Math.round(performance.now() - startTime);
      }
      cleanup();
    }
  }

  /**
   * 暂停任务
   * @param taskId 任务ID
   */
  pauseTask(taskId: string): void {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`任务 ${taskId} 不存在`);
    }

    if (this.isProcessing.get(taskId)) {
      this.isPaused.set(taskId, true);
      task.status = 'paused';
      task.updatedAt = new Date();
      this.saveTask(task);
    }
  }

  /**
   * 恢复任务
   * @param taskId 任务ID
   */
  resumeTask(taskId: string): void {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`任务 ${taskId} 不存在`);
    }

    this.isPaused.set(taskId, false);
    task.status = 'processing';
    task.updatedAt = new Date();
    this.saveTask(task);
  }

  /**
   * 取消任务
   * @param taskId 任务ID
   */
  cancelTask(taskId: string): void {
    const task = this.tasks.get(taskId);
    if (!task) {
      throw new Error(`任务 ${taskId} 不存在`);
    }

    task.status = 'cancelled';
    task.updatedAt = new Date();
    this.isPaused.set(taskId, false);
    this.saveTask(task);
  }

  /**
   * 删除任务
   * @param taskId 任务ID
   */
  deleteTask(taskId: string): void {
    this.tasks.delete(taskId);
    this.isProcessing.delete(taskId);
    this.isPaused.delete(taskId);
    
    // 从存储中删除
    try {
      localStorage.removeItem(`batch_task_${taskId}`);
    } catch (error) {
      console.error('删除任务存储失败:', error);
    }
  }

  /**
   * 获取所有任务
   * @returns 所有任务列表
   */
  getAllTasks(): BatchTask[] {
    return Array.from(this.tasks.values());
  }

  /**
   * 清理过期任务
   * @param days 过期天数
   */
  cleanupOldTasks(days: number = 7): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    for (const [taskId, task] of this.tasks.entries()) {
      if (task.createdAt < cutoffDate && 
          (task.status === 'completed' || 
           task.status === 'completed_with_errors' || 
           task.status === 'error' || 
           task.status === 'cancelled')) {
        this.deleteTask(taskId);
      }
    }
  }

  /**
   * 处理单个文件
   * @param file 文件对象
   * @param config 处理配置
   */
  private async processFile(file: BatchFile, config: BatchTaskConfig): Promise<void> {
    const startTime = performance.now();
    
    try {
      file.status = BatchStatus.PROCESSING;

      // 根据配置决定是否使用AI处理
      if (config.useAI && config.aiModelId) {
        await this.processWithAI(file, config);
      } else {
        // 基础处理逻辑
        file.result = await this.basicProcess(file);
      }

      file.status = BatchStatus.COMPLETED;
    } catch (error) {
      console.error(`文件 ${file.name} 处理失败:`, error);
      file.status = BatchStatus.ERROR;
      file.error = error instanceof Error ? error.message : String(error);
    } finally {
      file.processedAt = new Date();
      file.processingTime = Math.round(performance.now() - startTime);
    }
  }

  /**
   * 使用AI处理文件
   * @param file 文件对象
   * @param config 处理配置
   */
  private async processWithAI(file: BatchFile, config: BatchTaskConfig): Promise<void> {
    let retries = 0;
    let lastError: Error | null = null;

    while (retries <= config.retryConfig.maxRetries) {
      try {
        // 创建带超时的Promise
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('AI处理超时')), config.timeout);
        });

        let aiResult;

        // 根据处理类型调用不同的AI服务方法
        switch (config.aiProcessingType) {
          case 'text':
            // 检查是否需要分块处理
            if (config.chunking.enabled && file.content.length > config.chunking.chunkSize) {
              // 大文件分块处理
              const chunks = await aiService.chunkText(file.content, config.aiModelId, config.chunking.chunkSize, config.chunking.overlap);
              
              // 将 chunks 转换为 TextProcessingRequest[] 类型
              const textRequests: TextProcessingRequest[] = chunks.map(chunk => ({
                modelId: config.aiModelId,
                text: chunk,
                temperature: 0.7,
                maxTokens: 1000
              }));
              
              aiResult = await aiService.batchProcessText(textRequests);
              
              // 合并结果
              file.result = {
                success: aiResult.every(r => r.success),
                data: aiResult.map(r => r.data || '').join('\n'),
                metadata: {
                  chunks: aiResult.length,
                  tokens: aiResult.reduce((sum, r) => sum + (r.tokensUsed || 0), 0)
                }
              };
            } else {
              // 普通文本处理
              aiResult = await Promise.race([
                aiService.processText({ modelId: config.aiModelId, text: file.content, temperature: 0.7, maxTokens: 1000 }),
                timeoutPromise
              ]);
              // 将 AIResponse 转换为 BatchResult 类型，确保 data 属性有值
              file.result = {
                success: aiResult.success,
                data: aiResult.data || '',
                metadata: {
                  tokens: aiResult.tokensUsed,
                  processingTime: aiResult.processingTime
                }
              };
            }
            break;

          case 'data':
            aiResult = await Promise.race([
              aiService.analyzeData({ modelId: config.aiModelId, data: file.content, analysisType: 'batch' }),
              timeoutPromise
            ]);
            // 将 AIResponse 转换为 BatchResult 类型，确保 data 属性有值
            file.result = {
              success: aiResult.success,
              data: aiResult.data || {},
              metadata: {
                tokens: aiResult.tokensUsed,
                processingTime: aiResult.processingTime
              }
            };
            break;

          case 'image':
            // 这里简化处理，实际应该处理图像内容
            aiResult = await Promise.race([
              aiService.processImage({ modelId: config.aiModelId, imageData: file.content, prompt: '分析图像内容' }),
              timeoutPromise
            ]);
            // 将 AIResponse 转换为 BatchResult 类型，确保 data 属性有值
            file.result = {
              success: aiResult.success,
              data: aiResult.data || '',
              metadata: {
                tokens: aiResult.tokensUsed,
                processingTime: aiResult.processingTime
              }
            };
            break;

          default:
            throw new Error(`不支持的AI处理类型: ${config.aiProcessingType}`);
        }

        return; // 成功处理，退出循环
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (retries < config.retryConfig.maxRetries) {
          // 重试前等待
          await new Promise(resolve => 
            setTimeout(resolve, config.retryConfig.retryDelay)
          );
          retries++;
          console.log(`文件 ${file.name} 重试第 ${retries} 次`);
        } else {
          // 达到最大重试次数，抛出错误
          throw lastError;
        }
      }
    }
  }

  /**
   * 基础文件处理逻辑
   * @param file 文件对象
   * @returns 处理结果
   */
  private async basicProcess(file: BatchFile): Promise<any> {
    // 这里实现基础的文件处理逻辑
    // 根据文件类型进行不同的处理
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || '';

    switch (fileExtension) {
      case 'csv':
        // 简单的CSV处理示例
        return {
          success: true,
          data: `处理完成CSV文件 ${file.name}，包含 ${file.content.split('\n').length - 1} 行数据`,
          metadata: {
            rows: file.content.split('\n').length - 1,
            size: file.size
          }
        };

      case 'json':
        // JSON文件处理示例
        try {
          const parsed = JSON.parse(file.content);
          return {
            success: true,
            data: `处理完成JSON文件 ${file.name}`,
            metadata: {
              type: Array.isArray(parsed) ? 'array' : 'object',
              size: file.size
            }
          };
        } catch (error) {
          throw new Error('JSON解析失败');
        }

      case 'txt':
        // 文本文件处理示例
        return {
          success: true,
          data: `处理完成文本文件 ${file.name}，包含 ${file.content.length} 个字符`,
          metadata: {
            characters: file.content.length,
            lines: file.content.split('\n').length,
            size: file.size
          }
        };

      default:
        // 默认处理
        return {
          success: true,
          data: `处理完成文件 ${file.name}`,
          metadata: {
            size: file.size
          }
        };
    }
  }

  /**
   * 保存任务到本地存储
   * @param task 任务对象
   */
  private saveTask(task: BatchTask): void {
    try {
      // 保存精简版本以减少存储空间
      const simplifiedTask = {
        id: task.id,
        files: task.files.map(file => ({
          id: file.id,
          name: file.name,
          size: file.size,
          status: file.status,
          error: file.error,
          result: file.result ? { success: file.result.success } : null,
          processedAt: file.processedAt,
          processingTime: file.processingTime
        })),
        totalFiles: task.totalFiles,
        completedFiles: task.completedFiles,
        failedFiles: task.failedFiles,
        status: task.status,
        createdAt: task.createdAt,
        updatedAt: task.updatedAt,
        completedAt: task.completedAt
      };

      localStorage.setItem(`batch_task_${task.id}`, JSON.stringify(simplifiedTask));
    } catch (error) {
      console.error('保存任务失败:', error);
    }
  }

  /**
   * 从本地存储加载任务
   * @param taskId 任务ID
   * @returns 任务对象或null
   */
  private loadTask(taskId: string): BatchTask | null {
    try {
      const stored = localStorage.getItem(`batch_task_${taskId}`);
      if (stored) {
        return JSON.parse(stored) as BatchTask;
      }
    } catch (error) {
      console.error('加载任务失败:', error);
    }
    return null;
  }

  /**
   * 恢复所有已保存的任务
   */
  restoreTasks(): void {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('batch_task_')) {
          const taskId = key.replace('batch_task_', '');
          const task = this.loadTask(taskId);
          if (task) {
            this.tasks.set(taskId, task);
            this.isProcessing.set(taskId, false);
            this.isPaused.set(taskId, false);
          }
        }
      }
    } catch (error) {
      console.error('恢复任务失败:', error);
    }
  }
}

// 导出单例实例
export default new BatchProcessor();