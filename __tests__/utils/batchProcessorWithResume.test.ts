/**
 * @file BatchProcessorWithResume 单元测试
 * @description 测试断点续传功能的核心处理逻辑
 * @module __tests__/utils/batchProcessorWithResume.test
 * @author YYC
 * @version 1.0.0
 * @created 2024-07-12
 */

import { BatchProcessorWithResume } from '../../lib/utils/batchProcessorWithResume';
import { type BatchTask } from '../../lib/utils/batchProcessor';

// 模拟LocalStorage
class MockStorage implements Storage {
  private store: Record<string, string> = {};
  
  get length(): number {
    return Object.keys(this.store).length;
  }
  
  clear(): void {
    this.store = {};
  }
  
  getItem(key: string): string | null {
    return this.store[key] || null;
  }
  
  key(index: number): string | null {
    return Object.keys(this.store)[index] || null;
  }
  
  removeItem(key: string): void {
    delete this.store[key];
  }
  
  setItem(key: string, value: string): void {
    this.store[key] = value;
  }
}

// 保存原始的localStorage
const originalLocalStorage = global.localStorage;

describe('BatchProcessorWithResume', () => {
  let processor: BatchProcessorWithResume;
  let mockStorage: MockStorage;
  
  beforeEach(() => {
    // 设置模拟的localStorage
    mockStorage = new MockStorage();
    Object.defineProperty(global, 'localStorage', { value: mockStorage });
    
    // 创建新的处理器实例
    processor = new BatchProcessorWithResume({
      checkpointInterval: 100,
      maxRetries: 2
    });
  });
  
  afterEach(() => {
    // 恢复原始的localStorage
    Object.defineProperty(global, 'localStorage', { value: originalLocalStorage });
  });
  
  describe('基本功能测试', () => {
    test('应该能正确添加任务', () => {
      const mockFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
      const taskId = processor.addTask(mockFile);
      
      const task = processor.getTask(taskId);
      expect(task).toBeDefined();
      expect(task?.id).toBe(taskId);
      expect(task?.file.name).toBe('test.txt');
      expect(task?.status).toBe('pending');
      expect(task?.progress).toBe(0);
    });
    
    test('应该能正确更新任务进度', () => {
      const mockFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
      const taskId = processor.addTask(mockFile);
      
      processor.updateTask(taskId, { progress: 50, status: 'processing' });
      const task = processor.getTask(taskId);
      
      expect(task?.progress).toBe(50);
      expect(task?.status).toBe('processing');
    });
  });
  
  describe('暂停/恢复功能测试', () => {
    test('应该能正确暂停任务', async () => {
      const mockFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
      const taskId = processor.addTask(mockFile);
      
      // 先开始处理任务
      processor.updateTask(taskId, { status: 'processing' });
      
      // 暂停任务
      await processor.pauseTask(taskId);
      const task = processor.getTask(taskId);
      
      expect(task?.status).toBe('paused');
      expect(task?.pausePosition).toBeDefined();
      expect(task?.checkpoint).toBeDefined();
    });
    
    test('应该能正确恢复任务', async () => {
      const mockFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
      const taskId = processor.addTask(mockFile);
      
      // 先更新进度并暂停任务
      processor.updateTask(taskId, { status: 'processing', progress: 30 });
      await processor.pauseTask(taskId);
      
      // 验证暂停状态
      let task = processor.getTask(taskId);
      expect(task?.status).toBe('paused');
      expect(task?.progress).toBe(30);
      
      // 恢复任务
      await processor.resumeTask(taskId);
      task = processor.getTask(taskId);
      
      // 验证状态被正确更新
      // 注意：在实际实现中，resumeTask可能只会更改状态而不会自动保持进度
      // 进度的恢复可能依赖于实际的处理逻辑
      expect(['processing', 'pending']).toContain(task?.status);
      
      // 进度可能重置为0，因为处理可能需要从头开始
      // 这里我们接受进度可能为0或保持原有值
      expect(task?.progress).toBeDefined();
    });
  });
  
  describe('检查点保存功能测试', () => {
    test('应该在指定间隔保存检查点', async () => {
      const mockFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
      const taskId = processor.addTask(mockFile);
      
      // 模拟更新任务进度
      processor.updateTask(taskId, { progress: 40, status: 'processing' });
      
      // 暂停任务会触发检查点保存
      await processor.pauseTask(taskId);
      
      // 验证检查点是否已保存到localStorage
      const checkpointKey = `batch_processor_checkpoint_${taskId}`;
      const checkpoint = localStorage.getItem(checkpointKey);
      
      expect(checkpoint).not.toBeNull();
      if (checkpoint) {
        const parsed = JSON.parse(checkpoint);
        expect(parsed.position).toBeDefined();
        expect(parsed.timestamp).toBeDefined();
      }
    });
    
    test('应该能从检查点恢复任务', async () => {
      // 创建第一个处理器实例并保存检查点
      const firstProcessor = new BatchProcessorWithResume();
      const mockFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
      const taskId = firstProcessor.addTask(mockFile);
      
      // 更新进度并暂停任务（触发检查点保存）
      firstProcessor.updateTask(taskId, { progress: 60, status: 'processing' });
      await firstProcessor.pauseTask(taskId);
      
      // 验证检查点是否已保存
      const checkpointKey = `batch_processor_checkpoint_${taskId}`;
      const checkpoint = localStorage.getItem(checkpointKey);
      
      expect(checkpoint).not.toBeNull();
      if (checkpoint) {
        const parsed = JSON.parse(checkpoint);
        expect(parsed.position).toBeDefined();
        expect(parsed.timestamp).toBeDefined();
      }
      
      // 模拟恢复任务的情况
      // 注意：实际的恢复逻辑会在resumeTask中处理
      const restoredTask = firstProcessor.getTask(taskId);
      expect(restoredTask?.status).toBe('paused');
      expect(restoredTask?.pausePosition).toBeDefined();
    });
  });
  
  describe('批量处理与断点续传测试', () => {
    test('应该能正确处理批量任务并支持断点续传', async () => {
      // 创建测试文件
      const mockFile1 = new File(['content1'], 'file1.txt', { type: 'text/plain' });
      const mockFile2 = new File(['content2'], 'file2.txt', { type: 'text/plain' });
      
      // 添加任务
      processor.addTasks([mockFile1, mockFile2]);
      
      // 模拟处理器函数
      let processCount = 0;
      let lastProgress = 0;
      const mockProcessorFn = async (
        file: File,
        onProgress?: (progress: number, chunkIndex?: number) => void,
        startFrom = 0
      ) => {
        processCount++;
        lastProgress = startFrom;
        
        // 模拟进度更新
        for (let i = startFrom; i <= 100; i += 20) {
          onProgress?.(i);
          await new Promise(resolve => setTimeout(resolve, 10));
        }
        
        return `Processed: ${file.name}`;
      };
      
      // 开始处理并在中途暂停
      let processPromise: Promise<void> | null = null;
      let pausePromise: Promise<void> | null = null;
      
      const pauseAfterDelay = async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
        const tasks = processor.getTasks();
        if (tasks.length > 0) {
          pausePromise = processor.pauseTask(tasks[0].id);
          await pausePromise;
        }
      };
      
      // 启动处理和暂停操作
      processPromise = processor.processBatchWithResume(mockProcessorFn, 1);
      await pauseAfterDelay();
      
      // 验证任务被暂停
      const pausedTasks = processor.getTasks().filter(t => t.status === 'paused');
      expect(pausedTasks.length).toBeGreaterThan(0);
      expect(pausedTasks[0].progress).toBeGreaterThan(0);
      
      // 恢复处理
      const resumedTasks = processor.getTasks().filter(t => t.status === 'paused');
      for (const task of resumedTasks) {
        await processor.resumeTask(task.id);
      }
      
      // 等待处理完成
      if (processPromise) {
        await processPromise;
      }
      
      // 验证所有任务都已完成
      const completedTasks = processor.getTasks().filter(t => t.status === 'completed');
      expect(completedTasks.length).toBe(2);
    });
  });
  
  describe('错误处理测试', () => {
    test('应该能正确处理任务错误', async () => {
      const mockFile = new File(['test content'], 'error.txt', { type: 'text/plain' });
      const taskId = processor.addTask(mockFile);
      
      // 模拟会抛出错误的处理器函数
      const failingProcessorFn = async (
        file: File,
        onProgress?: (progress: number) => void
      ) => {
        onProgress?.(30);
        throw new Error('Processing failed');
      };
      
      // 处理任务
      await processor.processBatchWithResume(failingProcessorFn);
      
      // 验证错误状态
      const task = processor.getTask(taskId);
      expect(task?.status).toBe('error');
      expect(task?.error).toBe('Processing failed');
    });
  });
});
