/**
 * @file 批处理和AI功能集成测试
 * @description 测试批处理功能与AI功能的集成场景
 * @test BatchAIIntegration
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-24
 */

// 将vitest导入替换为Jest导入
import { describe, it, expect, beforeEach, afterEach, jest as vi } from '@jest/globals';
import { BatchProcessor } from '../services/BatchProcessor';
import aiService from '../services/AIService';
import { BatchFile, BatchStatus } from '../types/batch';

// 模拟数据
const mockFiles: BatchFile[] = [
  {
    id: 'file-1',
    name: 'sample1.csv',
    size: 1024,
    content: 'name,age\n张三,25\n李四,30',
    status: BatchStatus.PENDING,
    error: null,
    result: null,
    processedAt: null,
    processingTime: 0
  },
  {
    id: 'file-2',
    name: 'sample2.csv',
    size: 2048,
    content: 'product,price\n手机,5999\n电脑,8999',
    status: BatchStatus.PENDING,
    error: null,
    result: null,
    processedAt: null,
    processingTime: 0
  }
];

const mockAIResponse = {
  success: true,
  data: '这是AI处理后的结果',
  metadata: {
    model: 'gpt-3.5-turbo',
    tokens: 150,
    processingTime: 320
  }
};

describe('批处理和AI功能集成测试', () => {
  let batchProcessor: BatchProcessor;
  
  // 模拟AI服务
  const mockProcessText = vi.spyOn(aiService, 'processText').mockImplementation(
    async () => mockAIResponse
  );
  
  const mockProcessData = vi.spyOn(aiService, 'analyzeData').mockImplementation(
    async () => mockAIResponse
  );

  beforeEach(() => {
    // 重置所有模拟
    vi.clearAllMocks();
    
    // 创建批处理器实例
    batchProcessor = new BatchProcessor();
    
    // 模拟本地存储
    localStorage.clear();
    Storage.prototype.setItem = vi.fn();
    Storage.prototype.getItem = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('应该成功创建批处理任务并执行', async () => {
    // 准备
    const mockCallback = vi.fn();
    
    // 执行
    const taskId = await batchProcessor.createTask(mockFiles, mockCallback);
    
    // 验证
    expect(taskId).toBeTruthy();
    expect(batchProcessor.getTask(taskId)).toBeDefined();
    expect(batchProcessor.getTaskStatus(taskId).status).toBe('pending');
  });

  it('应该正确处理包含AI功能的批处理任务', async () => {
    // 准备
    const progressCallback = vi.fn();
    const taskId = await batchProcessor.createTask(mockFiles, progressCallback);
    
    // 配置任务使用AI处理
    batchProcessor.configureTask(taskId, {
      useAI: true,
      aiModelId: 'gpt-3.5-turbo',
      aiProcessingType: 'data'
    });
    
    // 执行
    await batchProcessor.processTask(taskId);
    
    // 验证
    const task = batchProcessor.getTask(taskId);
    expect(task).toBeDefined();
    expect(task.status).toBe('completed');
    
    // 验证所有文件都被处理
    const processedFiles = batchProcessor.getProcessedFiles(taskId);
    expect(processedFiles.every(file => file.status === BatchStatus.COMPLETED)).toBeTruthy();
    expect(processedFiles.every(file => file.result !== null)).toBeTruthy();
    
    // 验证AI服务被调用
    expect(mockProcessData).toHaveBeenCalledTimes(2);
  });

  it('应该在AI处理失败时正确处理错误', async () => {
    // 准备 - 模拟AI服务失败
    mockProcessData.mockRejectedValueOnce(new Error('AI处理失败'));
    
    const progressCallback = vi.fn();
    const taskId = await batchProcessor.createTask([mockFiles[0]], progressCallback);
    
    // 配置任务使用AI处理
    batchProcessor.configureTask(taskId, {
      useAI: true,
      aiModelId: 'gpt-3.5-turbo',
      aiProcessingType: 'data'
    });
    
    // 执行
    await batchProcessor.processTask(taskId);
    
    // 验证
    const processedFiles = batchProcessor.getProcessedFiles(taskId);
    expect(processedFiles[0].status).toBe(BatchStatus.ERROR);
    expect(processedFiles[0].error).toBe('AI处理失败');
  });

  it('应该在配置了重试时自动重试失败的AI请求', async () => {
    // 准备 - 模拟前两次失败，第三次成功
    mockProcessData
      .mockRejectedValueOnce(new Error('第一次失败'))
      .mockRejectedValueOnce(new Error('第二次失败'))
      .mockResolvedValue(mockAIResponse);
    
    const progressCallback = vi.fn();
    const taskId = await batchProcessor.createTask([mockFiles[0]], progressCallback);
    
    // 配置任务使用AI处理，并设置重试次数
    batchProcessor.configureTask(taskId, {
      useAI: true,
      aiModelId: 'gpt-3.5-turbo',
      aiProcessingType: 'data',
      retryConfig: {
        maxRetries: 3,
        retryDelay: 100
      }
    });
    
    // 执行
    await batchProcessor.processTask(taskId);
    
    // 验证
    expect(mockProcessData).toHaveBeenCalledTimes(3);
    
    const processedFiles = batchProcessor.getProcessedFiles(taskId);
    expect(processedFiles[0].status).toBe(BatchStatus.COMPLETED);
    expect(processedFiles[0].result).toBeTruthy();
  });

  it('应该正确处理批处理进度回调', async () => {
    // 准备
    const progressCallback = vi.fn();
    const taskId = await batchProcessor.createTask(mockFiles, progressCallback);
    
    // 配置任务使用AI处理
    batchProcessor.configureTask(taskId, {
      useAI: true,
      aiModelId: 'gpt-3.5-turbo',
      aiProcessingType: 'data'
    });
    
    // 执行
    await batchProcessor.processTask(taskId);
    
    // 验证进度回调被调用多次
    expect(progressCallback).toHaveBeenCalled();
    // 至少应该有初始和完成两个进度更新
    expect(progressCallback.mock.calls.length).toBeGreaterThanOrEqual(2);
    
    // 验证最终进度是100%
    const lastCall = progressCallback.mock.calls[progressCallback.mock.calls.length - 1][0];
    expect(lastCall.progress).toBe(100);
  });

  it('应该能够正确暂停和恢复批处理任务', async () => {
    // 准备
    const progressCallback = vi.fn();
    const taskId = await batchProcessor.createTask(mockFiles, progressCallback);
    
    // 配置任务使用AI处理
    batchProcessor.configureTask(taskId, {
      useAI: true,
      aiModelId: 'gpt-3.5-turbo',
      aiProcessingType: 'data'
    });
    
    // 开始处理
    const processPromise = batchProcessor.processTask(taskId);
    
    // 立即暂停
    setTimeout(() => {
      batchProcessor.pauseTask(taskId);
    }, 10);
    
    // 等待一段时间后恢复
    await new Promise(resolve => setTimeout(resolve, 100));
    batchProcessor.resumeTask(taskId);
    
    // 等待处理完成
    await processPromise;
    
    // 验证任务最终完成
    const task = batchProcessor.getTask(taskId);
    expect(task.status).toBe('completed');
  });

  it('应该能够正确取消批处理任务', async () => {
    // 准备
    const progressCallback = vi.fn();
    const taskId = await batchProcessor.createTask(mockFiles, progressCallback);
    
    // 配置任务使用AI处理
    batchProcessor.configureTask(taskId, {
      useAI: true,
      aiModelId: 'gpt-3.5-turbo',
      aiProcessingType: 'data'
    });
    
    // 开始处理
    const processPromise = batchProcessor.processTask(taskId);
    
    // 立即取消
    setTimeout(() => {
      batchProcessor.cancelTask(taskId);
    }, 10);
    
    // 等待处理完成
    await processPromise;
    
    // 验证任务被取消
    const task = batchProcessor.getTask(taskId);
    expect(task.status).toBe('cancelled');
  });

  it('应该正确处理批量文件的大小计算', async () => {
    // 准备
    const progressCallback = vi.fn();
    const taskId = await batchProcessor.createTask(mockFiles, progressCallback);
    
    // 配置任务使用AI处理
    batchProcessor.configureTask(taskId, {
      useAI: true,
      aiModelId: 'gpt-3.5-turbo',
      aiProcessingType: 'data'
    });
    
    // 执行
    await batchProcessor.processTask(taskId);
    
    // 验证
    const task = batchProcessor.getTask(taskId);
    expect(task.totalSize).toBe(mockFiles[0].size + mockFiles[1].size);
    expect(task.processedSize).toBe(task.totalSize);
  });

  it('应该正确处理不同类型的AI处理请求', async () => {
    // 准备
    const textFiles = [{
      ...mockFiles[0],
      content: '这是一段测试文本',
      name: 'sample.txt'
    }];
    
    const progressCallback = vi.fn();
    const taskId = await batchProcessor.createTask(textFiles, progressCallback);
    
    // 配置任务使用文本处理
    batchProcessor.configureTask(taskId, {
      useAI: true,
      aiModelId: 'gpt-3.5-turbo',
      aiProcessingType: 'text'
    });
    
    // 执行
    await batchProcessor.processTask(taskId);
    
    // 验证
    expect(mockProcessText).toHaveBeenCalledTimes(1);
    expect(mockProcessData).not.toHaveBeenCalled();
    
    const processedFiles = batchProcessor.getProcessedFiles(taskId);
    expect(processedFiles[0].status).toBe(BatchStatus.COMPLETED);
  });

  it('应该在任务完成后正确记录统计信息', async () => {
    // 准备
    const progressCallback = vi.fn();
    const taskId = await batchProcessor.createTask(mockFiles, progressCallback);
    
    // 配置任务使用AI处理
    batchProcessor.configureTask(taskId, {
      useAI: true,
      aiModelId: 'gpt-3.5-turbo',
      aiProcessingType: 'data'
    });
    
    // 执行
    await batchProcessor.processTask(taskId);
    
    // 验证
    const stats = batchProcessor.getTaskStatistics(taskId);
    expect(stats.totalFiles).toBe(2);
    expect(stats.completedFiles).toBe(2);
    expect(stats.failedFiles).toBe(0);
    expect(stats.processingTime).toBeGreaterThan(0);
  });
});

// Edge cases tests
describe('批处理和AI功能集成 - 边界情况', () => {
  let batchProcessor: BatchProcessor;
  
  beforeEach(() => {
    vi.clearAllMocks();
    batchProcessor = new BatchProcessor();
  });

  it('应该正确处理空文件列表', async () => {
    // 准备
    const progressCallback = vi.fn();
    
    // 执行
    const taskId = await batchProcessor.createTask([], progressCallback);
    await batchProcessor.processTask(taskId);
    
    // 验证
    const task = batchProcessor.getTask(taskId);
    expect(task.status).toBe('completed');
    expect(batchProcessor.getProcessedFiles(taskId)).toHaveLength(0);
  });

  it('应该处理超大文件的AI处理', async () => {
    // 准备 - 创建一个大文件
    const largeFile: BatchFile = {
      id: 'large-file',
      name: 'large.csv',
      size: 1024 * 1024, // 1MB
      content: 'header\n' + 'data,data\n'.repeat(10000), // 大量数据行
      status: BatchStatus.PENDING,
      error: null,
      result: null,
      processedAt: null,
      processingTime: 0
    };
    
    // 模拟大文件分块处理
    vi.spyOn(aiService, 'chunkText').mockResolvedValue(['chunk1', 'chunk2', 'chunk3']);
    vi.spyOn(aiService, 'batchProcessText').mockResolvedValue([
      { success: true, data: 'result1', metadata: {} },
      { success: true, data: 'result2', metadata: {} },
      { success: true, data: 'result3', metadata: {} }
    ]);
    
    const progressCallback = vi.fn();
    const taskId = await batchProcessor.createTask([largeFile], progressCallback);
    
    // 配置任务使用AI处理，并启用分块
    batchProcessor.configureTask(taskId, {
      useAI: true,
      aiModelId: 'gpt-3.5-turbo',
      aiProcessingType: 'text',
      chunking: {
        enabled: true,
        chunkSize: 1000,
        overlap: 100
      }
    });
    
    // 执行
    await batchProcessor.processTask(taskId);
    
    // 验证
    const processedFiles = batchProcessor.getProcessedFiles(taskId);
    expect(processedFiles[0].status).toBe(BatchStatus.COMPLETED);
    expect(processedFiles[0].result).toBeTruthy();
  });

  it('应该处理AI服务超时情况', async () => {
    // 准备 - 模拟超时
    vi.spyOn(aiService, 'analyzeData').mockImplementation(() => {
      return new Promise(() => {
        // 永远不解析，模拟超时
      });
    });
    
    const progressCallback = vi.fn();
    const taskId = await batchProcessor.createTask([mockFiles[0]], progressCallback);
    
    // 配置任务使用AI处理，并设置超时
    batchProcessor.configureTask(taskId, {
      useAI: true,
      aiModelId: 'gpt-3.5-turbo',
      aiProcessingType: 'data',
      timeout: 500 // 500ms超时
    });
    
    // 执行并捕获异常
    await expect(batchProcessor.processTask(taskId)).rejects.toThrow();
    
    // 取消任务以清理资源
    batchProcessor.cancelTask(taskId);
  });
});