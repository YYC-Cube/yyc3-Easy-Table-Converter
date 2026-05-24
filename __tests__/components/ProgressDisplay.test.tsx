/**
 * @file ProgressDisplay 组件单元测试
 * @description 测试进度显示组件的UI渲染和交互功能
 * @module __tests__/components/ProgressDisplay.test.tsx
 * @author YYC
 * @version 2.1.0
 * @updated 2026-05-24 - 修复按钮选择器和类型定义问题
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { ProgressDisplay } from '../../components/progress/ProgressDisplay';
import { BatchTaskExtended } from '../../lib/types/progress.types';

describe('ProgressDisplay Component', () => {
  // Mock任务数据
  const createMockTask = (overrides: Partial<BatchTaskExtended> = {}): BatchTaskExtended => ({
    id: 'task1',
    file: new File(['test content'], 'large-file.pdf'),
    status: 'processing',
    progress: 50,
    totalChunks: 10,
    completedChunks: 5,
    chunkSize: 1048576,
    uploadedBytes: 5242880,
    startTime: Date.now(),
    lastUpdateTime: Date.now(),
    retryCount: 0,
    chunksMap: new Map([[0, true], [1, true], [2, true], [3, true], [4, true]]),
    ...overrides
  });

  const mockTasks: BatchTaskExtended[] = [
    createMockTask({
      id: 'task1',
      status: 'processing',
      progress: 50,
      uploadedBytes: 5242880,
      file: new File(['test content'], 'large-file.pdf')
    }),
    createMockTask({
      id: 'task2',
      status: 'paused',
      progress: 25,
      totalChunks: 4,
      completedChunks: 1,
      chunkSize: 1048576,
      uploadedBytes: 1048576,
      file: new File(['test content'], 'document.docx')
    })
  ];

  test('应该正确渲染任务列表和总体进度', () => {
    render(
      <ProgressDisplay
        tasks={mockTasks}
        onPauseTask={jest.fn()}
        onResumeTask={jest.fn()}
        onCancelTask={jest.fn()}
        onDownload={jest.fn()}
      />
    );

    // 验证任务文件名显示
    expect(screen.getByText('large-file.pdf')).toBeInTheDocument();
    expect(screen.getByText('document.docx')).toBeInTheDocument();
    
    // 验证任务状态存在（使用getAllByText因为可能有重复文本）
    const processingElements = screen.getAllByText(/处理中/i);
    const pausedElements = screen.getAllByText(/已暂停/i);
    
    expect(processingElements.length).toBeGreaterThan(0);
    expect(pausedElements.length).toBeGreaterThan(0);
  });

  test('应该正确处理暂停任务点击事件', () => {
    const onPauseTask = jest.fn();
    
    render(
      <ProgressDisplay
        tasks={[createMockTask({ id: 'task1' })]}
        onPauseTask={onPauseTask}
        onResumeTask={jest.fn()}
        onCancelTask={jest.fn()}
        onDownload={jest.fn()}
      />
    );

    // 查找带有title="暂停"属性的按钮
    const pauseButton = screen.getByTitle('暂停');
    fireEvent.click(pauseButton);
    
    expect(onPauseTask).toHaveBeenCalledWith('task1');
  });

  test('应该正确处理恢复任务点击事件', () => {
    const onResumeTask = jest.fn();
    
    render(
      <ProgressDisplay
        tasks={[createMockTask({ id: 'task1', status: 'paused' })]}
        onPauseTask={jest.fn()}
        onResumeTask={onResumeTask}
        onCancelTask={jest.fn()}
        onDownload={jest.fn()}
      />
    );

    // 查找带有title="继续"属性的按钮
    const resumeButton = screen.getByTitle('继续');
    fireEvent.click(resumeButton);
    
    expect(onResumeTask).toHaveBeenCalledWith('task1');
  });

  test('应该正确处理取消任务点击事件', () => {
    const onCancelTask = jest.fn();
    
    render(
      <ProgressDisplay
        tasks={[createMockTask({ id: 'task1' })]}
        onPauseTask={jest.fn()}
        onResumeTask={jest.fn()}
        onCancelTask={onCancelTask}
        onDownload={jest.fn()}
      />
    );

    // 查找带有title="删除"属性的按钮
    const cancelButton = screen.getByTitle('删除');
    fireEvent.click(cancelButton);
    
    expect(onCancelTask).toHaveBeenCalledWith('task1');
  });

  test('应该正确处理下载按钮点击事件', () => {
    const onDownload = jest.fn();
    
    render(
      <ProgressDisplay
        tasks={[createMockTask({ 
          id: 'task1', 
          status: 'completed',
          progress: 100,
          result: new Blob(['processed content'])
        })]}
        onPauseTask={jest.fn()}
        onResumeTask={jest.fn()}
        onCancelTask={jest.fn()}
        onDownload={onDownload}
      />
    );

    // 查找带有title="下载结果"属性的按钮
    const downloadButton = screen.getByTitle('下载结果');
    fireEvent.click(downloadButton);
    
    expect(onDownload).toHaveBeenCalledWith('task1');
  });

  test('当没有任务时应该返回null', () => {
    const { container } = render(
      <ProgressDisplay
        tasks={[]}
        onPauseTask={jest.fn()}
        onResumeTask={jest.fn()}
        onCancelTask={jest.fn()}
        onDownload={jest.fn()}
      />
    );

    expect(container.innerHTML).toBe('');
  });

  test('应该正确处理错误状态的任务', () => {
    render(
      <ProgressDisplay
        tasks={[createMockTask({ 
          id: 'error-task',
          status: 'error',
          error: '处理失败：文件格式不支持'
        })]}
        onPauseTask={jest.fn()}
        onResumeTask={jest.fn()}
        onCancelTask={jest.fn()}
        onDownload={jest.fn()}
      />
    );

    // 验证错误状态存在（使用getAllByText因为可能有多个"处理失败"文本）
    const errorElements = screen.getAllByText(/处理失败/i);
    expect(errorElements.length).toBeGreaterThan(0);
  });
});
