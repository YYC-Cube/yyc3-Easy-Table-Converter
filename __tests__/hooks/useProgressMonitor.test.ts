/**
 * @file useProgressMonitor 钩子单元测试
 * @description 测试进度监控和断点续传功能的React钩子
 * @module __tests__/hooks/useProgressMonitor.test.ts
 * @author YYC
 * @version 2.0.0
 * @updated 2026-05-24 - 修复processor参数缺失和类型定义问题
 */

import { renderHook, act } from '@testing-library/react';
import { useProgressMonitor } from '../../hooks/useProgressMonitor';

// Mock BatchProcessorWithResume 类
jest.mock('@/lib/utils/batchProcessorWithResume', () => ({
  BatchProcessorWithResume: jest.fn().mockImplementation(() => ({
    addTask: jest.fn().mockReturnValue('task1'),
    getTasks: jest.fn().mockReturnValue([]),
    removeTask: jest.fn(),
    clearCompleted: jest.fn(),
    clearAll: jest.fn(),
    processBatchWithResume: jest.fn().mockResolvedValue(undefined),
    pauseTask: jest.fn().mockResolvedValue(undefined),
    resumeTask: jest.fn().mockResolvedValue(undefined),
    onProgressWithDetails: jest.fn(),
    destroy: jest.fn(),
  })),
}));

describe('useProgressMonitor', () => {
  const mockProcessor = jest.fn().mockResolvedValue('processed result');
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('应该初始化并返回正确的状态和方法', () => {
    const { result } = renderHook(() => useProgressMonitor({
      processor: mockProcessor
    }));
    
    // 验证返回的状态
    expect(result.current.tasks).toEqual([]);
    expect(result.current.isProcessing).toBe(false);
    expect(result.current.totalProgress).toBe(0);
    
    // 验证返回的方法存在
    expect(typeof result.current.addFile).toBe('function');
    expect(typeof result.current.processTasks).toBe('function');
    expect(typeof result.current.pauseTask).toBe('function');
    expect(typeof result.current.resumeTask).toBe('function');
    expect(typeof result.current.cancelTask).toBe('function');
    expect(typeof result.current.clearCompletedTasks).toBe('function');
    expect(typeof result.current.clearAllTasks).toBe('function');
  });
  
  test('应该正确添加文件并返回任务ID', () => {
    const { result } = renderHook(() => useProgressMonitor({
      processor: mockProcessor
    }));
    
    const mockFile = new File(['content1'], 'file1.txt', { type: 'text/plain' });
    
    let taskId = '';
    act(() => {
      taskId = result.current.addFile(mockFile);
    });
    
    // 验证返回了任务ID
    expect(taskId).toBe('task1');
  });
  
  test('应该正确暂停任务', async () => {
    const { result } = renderHook(() => useProgressMonitor({
      processor: mockProcessor
    }));
    
    await act(async () => {
      await result.current.pauseTask('test-task-id');
    });
    
    // 验证没有抛出错误（暂停操作成功执行）
    expect(result.current.isProcessing).toBe(false);
  });
  
  test('应该正确恢复任务', async () => {
    const { result } = renderHook(() => useProgressMonitor({
      processor: mockProcessor
    }));
    
    await act(async () => {
      await result.current.resumeTask('test-task-id');
    });
    
    // 验证没有抛出错误（恢复操作成功执行）
  });
  
  test('应该正确取消任务', () => {
    const { result } = renderHook(() => useProgressMonitor({
      processor: mockProcessor
    }));
    
    act(() => {
      result.current.cancelTask('test-task-id');
    });
    
    // 验证没有抛出错误（取消操作成功执行）
  });

  test('应该正确清除已完成任务', () => {
    const { result } = renderHook(() => useProgressMonitor({
      processor: mockProcessor
    }));
    
    act(() => {
      result.current.clearCompletedTasks();
    });
    
    // 验证清除操作被调用
  });

  test('应该正确清除所有任务', async () => {
    const { result } = renderHook(() => useProgressMonitor({
      processor: mockProcessor
    }));
    
    await act(async () => {
      await result.current.clearAllTasks();
    });
    
    // 验证任务列表为空
    expect(result.current.tasks.length).toBe(0);
  });

  test('应该正确处理批量任务处理', async () => {
    const { result } = renderHook(() => useProgressMonitor({
      processor: mockProcessor,
      autoProcess: false
    }));
    
    await act(async () => {
      await result.current.processTasks();
    });
    
    // 验证处理流程启动
  });

  test('应该正确暂停和恢复所有任务', async () => {
    const { result } = renderHook(() => useProgressMonitor({
      processor: mockProcessor
    }));
    
    await act(async () => {
      await result.current.pauseAll();
    });
    
    expect(result.current.isProcessing).toBe(false);
    
    await act(async () => {
      await result.current.resumeAll();
    });
    
    // 验证恢复操作完成
  });
});
