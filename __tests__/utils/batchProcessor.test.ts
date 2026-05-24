/**
 * @file BatchProcessor 测试
 * @description 批量处理工具类的完整单元测试
 * @module __tests__/utils/batchProcessor.test
 * @author YYC
 * @version 1.0.0
 * @created 2026-05-24
 */

import { BatchProcessor, BatchTask } from '@/lib/utils/batchProcessor';

describe('BatchProcessor', () => {
  let processor: BatchProcessor;

  beforeEach(() => {
    processor = new BatchProcessor();
  });

  describe('addTask', () => {
    it('should add a single task and return id', () => {
      const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
      const taskId = processor.addTask(file);
      
      expect(taskId).toBeDefined();
      expect(typeof taskId).toBe('string');
      
      const task = processor.getTask(taskId);
      expect(task).toBeDefined();
      expect(task?.status).toBe('pending');
      expect(task?.progress).toBe(0);
      expect(task?.file).toBe(file);
    });

    it('should generate unique ids for each task', () => {
      const file1 = new File(['content1'], 'file1.txt');
      const file2 = new File(['content2'], 'file2.txt');
      
      const id1 = processor.addTask(file1);
      const id2 = processor.addTask(file2);
      
      expect(id1).not.toBe(id2);
    });

    it('should initialize task with file size info', () => {
      const file = new File(['x'.repeat(1000)], 'large.txt');
      const taskId = processor.addTask(file);
      
      const task = processor.getTask(taskId);
      expect(task?.totalBytes).toBe(1000);
      expect(task?.bytesProcessed).toBe(0);
    });
  });

  describe('addTasks', () => {
    it('should add multiple tasks at once', () => {
      const files = [
        new File(['content1'], 'file1.txt'),
        new File(['content2'], 'file2.txt'),
        new File(['content3'], 'file3.txt'),
      ];
      
      const ids = processor.addTasks(files);
      
      expect(ids.length).toBe(3);
      expect(processor.getTasks().length).toBe(3);
    });

    it('should return empty array for empty input', () => {
      const ids = processor.addTasks([]);
      expect(ids).toEqual([]);
      expect(processor.getTasks().length).toBe(0);
    });
  });

  describe('getTasks', () => {
    it('should return all tasks', () => {
      processor.addTask(new File(['content1'], 'file1.txt'));
      processor.addTask(new File(['content2'], 'file2.txt'));
      
      const tasks = processor.getTasks();
      expect(tasks.length).toBe(2);
    });

    it('should return empty array when no tasks', () => {
      const tasks = processor.getTasks();
      expect(tasks).toEqual([]);
    });
  });

  describe('getTask', () => {
    it('should return task by id', () => {
      const file = new File(['content'], 'test.txt');
      const taskId = processor.addTask(file);
      
      const task = processor.getTask(taskId);
      expect(task).toBeDefined();
      expect(task?.id).toBe(taskId);
    });

    it('should return undefined for non-existent id', () => {
      const task = processor.getTask('non-existent-id');
      expect(task).toBeUndefined();
    });
  });

  describe('updateTask', () => {
    it('should update task properties', () => {
      const file = new File(['content'], 'test.txt');
      const taskId = processor.addTask(file);
      
      processor.updateTask(taskId, { 
        status: 'processing', 
        progress: 50 
      });
      
      const task = processor.getTask(taskId);
      expect(task?.status).toBe('processing');
      expect(task?.progress).toBe(50);
    });

    it('should not throw for non-existent task', () => {
      expect(() => {
        processor.updateTask('non-existent', { progress: 50 });
      }).not.toThrow();
    });

    it('should update multiple properties at once', () => {
      const file = new File(['content'], 'test.txt');
      const taskId = processor.addTask(file);
      
      processor.updateTask(taskId, { 
        status: 'completed',
        progress: 100,
        result: 'success'
      });
      
      const task = processor.getTask(taskId);
      expect(task?.status).toBe('completed');
      expect(task?.progress).toBe(100);
      expect(task?.result).toBe('success');
    });
  });

  describe('removeTask', () => {
    it('should remove task by id', () => {
      const file = new File(['content'], 'test.txt');
      const taskId = processor.addTask(file);
      
      expect(processor.getTasks().length).toBe(1);
      
      processor.removeTask(taskId);
      
      expect(processor.getTasks().length).toBe(0);
      expect(processor.getTask(taskId)).toBeUndefined();
    });

    it('should not throw for non-existent task', () => {
      expect(() => {
        processor.removeTask('non-existent');
      }).not.toThrow();
    });
  });

  describe('clearCompleted', () => {
    it('should remove only completed tasks', () => {
      const id1 = processor.addTask(new File(['content1'], 'file1.txt'));
      const id2 = processor.addTask(new File(['content2'], 'file2.txt'));
      const id3 = processor.addTask(new File(['content3'], 'file3.txt'));
      
      processor.updateTask(id1, { status: 'completed' });
      processor.updateTask(id2, { status: 'error' });
      
      processor.clearCompleted();
      
      const tasks = processor.getTasks();
      expect(tasks.length).toBe(2);
      expect(tasks.find(t => t.id === id1)).toBeUndefined();
      expect(tasks.find(t => t.id === id2)).toBeDefined();
      expect(tasks.find(t => t.id === id3)).toBeDefined();
    });

    it('should handle empty task list', () => {
      expect(() => processor.clearCompleted()).not.toThrow();
    });
  });

  describe('clearAll', () => {
    it('should remove all tasks', () => {
      processor.addTask(new File(['content1'], 'file1.txt'));
      processor.addTask(new File(['content2'], 'file2.txt'));
      processor.addTask(new File(['content3'], 'file3.txt'));
      
      processor.clearAll();
      
      expect(processor.getTasks().length).toBe(0);
    });
  });

  describe('onProgress callback', () => {
    it('should call onProgress when task is updated', () => {
      const mockCallback = jest.fn();
      processor.onProgress(mockCallback);
      
      const file = new File(['content'], 'test.txt');
      const taskId = processor.addTask(file);
      
      processor.updateTask(taskId, { progress: 50 });
      
      expect(mockCallback).toHaveBeenCalled();
      expect(mockCallback).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ id: expect.any(String) })])
      );
    });

    it('should support updating callback', () => {
      const mockCallback1 = jest.fn();
      const mockCallback2 = jest.fn();
      
      processor.onProgress(mockCallback1);
      const taskId1 = processor.addTask(new File(['content1'], 'test1.txt'));
      processor.updateTask(taskId1, { progress: 10 });
      
      processor.onProgress(mockCallback2);
      const taskId2 = processor.addTask(new File(['content2'], 'test2.txt'));
      processor.updateTask(taskId2, { progress: 20 });
      
      expect(mockCallback1).toHaveBeenCalledTimes(1);
      expect(mockCallback2).toHaveBeenCalledTimes(1);
    });

    it('should call onProgress when task is removed', () => {
      const mockCallback = jest.fn();
      processor.onProgress(mockCallback);
      
      const taskId = processor.addTask(new File(['content'], 'test.txt'));
      processor.updateTask(taskId, { status: 'completed' });
      
      processor.removeTask(taskId);
      
      expect(mockCallback).toHaveBeenCalled();
    });
  });

  describe('processBatch', () => {
    it('should process all pending tasks successfully', async () => {
      const files = [
        new File(['content1'], 'file1.txt'),
        new File(['content2'], 'file2.txt'),
        new File(['content3'], 'file3.txt'),
      ];
      
      processor.addTasks(files);
      
      const mockProcessor = jest.fn((file: File) => 
        Promise.resolve(`processed-${file.name}`)
      );
      
      await processor.processBatch(mockProcessor, 2);
      
      expect(mockProcessor).toHaveBeenCalledTimes(3);
      
      const tasks = processor.getTasks();
      expect(tasks.every(t => t.status === 'completed')).toBe(true);
      expect(tasks.every(t => t.progress === 100)).toBe(true);
    });

    it('should handle processing errors gracefully', async () => {
      const file1 = new File(['content1'], 'file1.txt');
      const file2 = new File(['content2'], 'file2.txt');
      
      processor.addTask(file1);
      processor.addTask(file2);
      
      const mockProcessor = jest.fn((file: File) => {
        if (file.name === 'file1.txt') {
          return Promise.reject(new Error('Processing failed'));
        }
        return Promise.resolve('success');
      });
      
      await processor.processBatch(mockProcessor, 1);
      
      const tasks = processor.getTasks();
      const task1 = tasks.find(t => t.file.name === 'file1.txt');
      const task2 = tasks.find(t => t.file.name === 'file2.txt');
      
      expect(task1?.status).toBe('error');
      expect(task1?.error).toBe('Processing failed');
      expect(task2?.status).toBe('completed');
    });

    it('should respect concurrency limit', async () => {
      const files = Array.from({ length: 6 }, (_, i) => 
        new File([`content${i}`], `file${i}.txt`)
      );
      
      processor.addTasks(files);
      
      let concurrentCount = 0;
      let maxConcurrent = 0;
      
      const mockProcessor = jest.fn((file: File) => {
        concurrentCount++;
        maxConcurrent = Math.max(maxConcurrent, concurrentCount);
        
        return new Promise(resolve => {
          setTimeout(() => {
            concurrentCount--;
            resolve(`processed-${file.name}`);
          }, 10);
        });
      });
      
      await processor.processBatch(mockProcessor, 2);
      
      expect(maxConcurrent).toBeLessThanOrEqual(2);
    });

    it('should update progress during processing', async () => {
      const file = new File(['content'], 'test.txt');
      processor.addTask(file);
      
      const progressUpdates: number[] = [];
      
      const mockProcessor = jest.fn((_file: File, onProgress?: (progress: number) => void) => {
        for (let i = 0; i <= 100; i += 20) {
          onProgress?.(i);
        }
        return Promise.resolve('done');
      });
      
      await processor.processBatch(mockProcessor, 1);
      
      const task = processor.getTasks()[0];
      expect(task.progress).toBeGreaterThan(0);
    });

    it('should only process pending tasks', async () => {
      const file1 = new File(['content1'], 'file1.txt');
      const file2 = new File(['content2'], 'file2.txt');
      
      const id1 = processor.addTask(file1);
      const id2 = processor.addTask(file2);
      
      processor.updateTask(id1, { status: 'completed' });
      
      const mockProcessor = jest.fn(() => Promise.resolve('done'));
      
      await processor.processBatch(mockProcessor, 1);
      
      expect(mockProcessor).toHaveBeenCalledTimes(1);
    });

    it('should handle empty task list', async () => {
      const mockProcessor = jest.fn();
      
      await expect(processor.processBatch(mockProcessor)).resolves.not.toThrow();
      expect(mockProcessor).not.toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('should handle large number of tasks efficiently', () => {
      const files = Array.from({ length: 100 }, (_, i) => 
        new File([`content${i}`], `file${i}.txt`)
      );
      
      const startTime = Date.now();
      const ids = processor.addTasks(files);
      const endTime = Date.now();
      
      expect(ids.length).toBe(100);
      expect(endTime - startTime).toBeLessThan(100); // Should be fast
    });

    it('should handle files with special characters in name', () => {
      const file = new File(['content'], '文件 名称 (特殊).txt');
      const taskId = processor.addTask(file);
      
      const task = processor.getTask(taskId);
      expect(task).toBeDefined();
      expect(task?.file.name).toContain('特殊');
    });

    it('should handle empty files', () => {
      const file = new File([], 'empty.txt');
      const taskId = processor.addTask(file);
      
      const task = processor.getTask(taskId);
      expect(task?.totalBytes).toBe(0);
    });
  });
});