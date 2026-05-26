/**
 * @file BatchProcessor 单元测试
 * @description 测试批量处理工具类
 */

import { BatchProcessor, BatchTask } from '@/lib/utils/batchProcessor';

describe('BatchProcessor', () => {
  let processor: BatchProcessor;

  beforeEach(() => {
    processor = new BatchProcessor();
  });

  const createMockFile = (name: string = 'test.txt', size: number = 1000): File => {
    const content = 'x'.repeat(size);
    return new File([content], name, { type: 'text/plain' });
  };

  describe('addTask', () => {
    it('应该成功添加单个任务', () => {
      const file = createMockFile();
      const taskId = processor.addTask(file);

      expect(taskId).toBeDefined();
      expect(typeof taskId).toBe('string');

      const task = processor.getTask(taskId);
      expect(task).toBeDefined();
      expect(task?.status).toBe('pending');
      expect(task?.progress).toBe(0);
      expect(task?.file).toBe(file);
    });

    it('应该为每个任务生成唯一ID', () => {
      const file1 = createMockFile('file1.txt');
      const file2 = createMockFile('file2.txt');

      const id1 = processor.addTask(file1);
      const id2 = processor.addTask(file2);

      expect(id1).not.toBe(id2);
    });

    it('应该初始化任务的元数据', () => {
      const file = createMockFile('test.csv', 5000);
      const taskId = processor.addTask(file);

      const task = processor.getTask(taskId);
      
      expect(task?.totalBytes).toBe(5000);
      expect(task?.bytesProcessed).toBe(0);
      expect(task?.startTime).toBeUndefined();
      expect(task?.lastUpdated).toBeUndefined();
    });
  });

  describe('addTasks', () => {
    it('应该批量添加多个文件', () => {
      const files = [
        createMockFile('file1.txt'),
        createMockFile('file2.txt'),
        createMockFile('file3.txt')
      ];

      const taskIds = processor.addTasks(files);

      expect(taskIds).toHaveLength(3);
      expect(processor.getTasks()).toHaveLength(3);
    });

    it('应该为空数组返回空结果', () => {
      const taskIds = processor.addTasks([]);

      expect(taskIds).toEqual([]);
      expect(processor.getTasks()).toHaveLength(0);
    });
  });

  describe('getTasks & getTask', () => {
    it('应该返回所有任务', () => {
      processor.addTask(createMockFile('a.txt'));
      processor.addTask(createMockFile('b.txt'));

      const tasks = processor.getTasks();

      expect(tasks).toHaveLength(2);
    });

    it('应该根据ID获取特定任务', () => {
      const file = createMockFile('specific.txt');
      const taskId = processor.addTask(file);

      const task = processor.getTask(taskId);

      expect(task).toBeDefined();
      expect(task?.file.name).toBe('specific.txt');
    });

    it('应该返回undefined对于不存在的ID', () => {
      const task = processor.getTask('nonexistent-id');

      expect(task).toBeUndefined();
    });
  });

  describe('updateTask', () => {
    it('应该更新任务属性', () => {
      const taskId = processor.addTask(createMockFile());

      processor.updateTask(taskId, {
        status: 'processing',
        progress: 50,
        bytesProcessed: 500
      });

      const task = processor.getTask(taskId);

      expect(task?.status).toBe('processing');
      expect(task?.progress).toBe(50);
      expect(task?.bytesProcessed).toBe(500);
    });

    it('不应该影响未指定的属性', () => {
      const taskId = processor.addTask(createMockFile());
      
      processor.updateTask(taskId, { status: 'completed' });

      const task = processor.getTask(taskId);
      
      // 其他属性应保持不变
      expect(task?.progress).toBe(0); // 默认值
    });

    it('应该安全处理不存在的任务ID', () => {
      expect(() => {
        processor.updateTask('invalid-id', { status: 'error' });
      }).not.toThrow();
    });

    it('应该支持更新所有可更新字段', () => {
      const taskId = processor.addTask(createMockFile());

      const updates: Partial<BatchTask> = {
        status: 'completed',
        progress: 100,
        result: 'processed data',
        startTime: Date.now() - 1000,
        lastUpdated: Date.now(),
        bytesProcessed: 1000,
      };

      processor.updateTask(taskId, updates);
      const task = processor.getTask(taskId);

      expect(task?.status).toBe('completed');
      expect(task?.progress).toBe(100);
      expect(task?.result).toBe('processed data');
      expect(task?.bytesProcessed).toBe(1000);
    });
  });

  describe('removeTask', () => {
    it('应该正确删除指定任务', () => {
      const taskId = processor.addTask(createMockFile());
      expect(processor.getTasks()).toHaveLength(1);

      processor.removeTask(taskId);

      expect(processor.getTasks()).toHaveLength(0);
      expect(processor.getTask(taskId)).toBeUndefined();
    });

    it('应该安全处理删除不存在的任务', () => {
      expect(() => {
        processor.removeTask('nonexistent');
      }).not.toThrow();
    });
  });

  describe('clearCompleted', () => {
    it('只应该清除已完成的任务', () => {
      const id1 = processor.addTask(createMockFile());
      const id2 = processor.addTask(createMockFile());
      const id3 = processor.addTask(createMockFile());

      processor.updateTask(id1, { status: 'completed' });
      processor.updateTask(id2, { status: 'error' });
      // id3保持pending

      processor.clearCompleted();

      expect(processor.getTasks()).toHaveLength(2);
      expect(processor.getTask(id1)).toBeUndefined(); // 已完成，被删除
      expect(processor.getTask(id2)).toBeDefined();   // 错误状态，保留
      expect(processor.getTask(id3)).toBeDefined();   // pending状态，保留
    });

    it('应该在无已完成任务时不做任何操作', () => {
      processor.addTask(createMockFile());
      processor.addTask(createMockFile());

      processor.clearCompleted();

      expect(processor.getTasks()).toHaveLength(2);
    });
  });

  describe('clearAll', () => {
    it('应该清空所有任务', () => {
      processor.addTask(createMockFile());
      processor.addTask(createMockFile());
      processor.addTask(createMockFile());

      processor.clearAll();

      expect(processor.getTasks()).toHaveLength(0);
    });

    it('应该能重新添加任务在清空后', () => {
      processor.addTask(createMockFile());
      processor.clearAll();

      const newId = processor.addTask(createMockFile());
      
      expect(processor.getTasks()).toHaveLength(1);
      expect(processor.getTask(newId)).toBeDefined();
    });
  });

  describe('进度回调', () => {
    it('应该在任务变更时触发进度回调', () => {
      const onProgress = jest.fn();
      (processor as any).onProgressCallback = onProgress;

      const taskId = processor.addTask(createMockFile());
      
      // addTask不触发回调（只有updateTask才触发）
      // 所以先清除可能的历史调用
      onProgress.mockClear();

      // updateTask应该触发回调
      processor.updateTask(taskId, { status: 'processing' });
      
      expect(onProgress).toHaveBeenCalledTimes(1);
    });

    it('应该在删除任务时触发回调', () => {
      const onProgress = jest.fn();
      (processor as any).onProgressCallback = onProgress;

      const taskId = processor.addTask(createMockFile());
      onProgress.mockClear();

      processor.removeTask(taskId);

      expect(onProgress).toHaveBeenCalled();
    });
  });

  describe('边界条件', () => {
    it('应该处理大量任务', () => {
      const files = Array.from({ length: 100 }, (_, i) => 
        createMockFile(`file${i}.txt`, i * 100)
      );

      const taskIds = processor.addTasks(files);

      expect(taskIds).toHaveLength(100);
      expect(processor.getTasks()).toHaveLength(100);
    });

    it('应该处理大文件', () => {
      const largeContent = 'x'.repeat(1024 * 1024); // 1MB
      const largeFile = new File([largeContent], 'large.bin');

      const taskId = processor.addTask(largeFile);
      const task = processor.getTask(taskId);

      expect(task?.totalBytes).toBe(1024 * 1024);
    });

    it('应该支持各种状态转换', () => {
      const taskId = processor.addTask(createMockFile());

      const states: BatchTask['status'][] = [
        'pending',
        'processing',
        'paused',
        'processing',
        'completed'
      ];

      states.forEach(status => {
        processor.updateTask(taskId, { status });
        expect(processor.getTask(taskId)?.status).toBe(status);
      });
    });

    it('应该正确跟踪错误状态', () => {
      const taskId = processor.addTask(createMockFile());

      processor.updateTask(taskId, {
        status: 'error',
        error: 'Processing failed: timeout'
      });

      const task = processor.getTask(taskId);

      expect(task?.status).toBe('error');
      expect(task?.error).toBe('Processing failed: timeout');
    });
  });
});
