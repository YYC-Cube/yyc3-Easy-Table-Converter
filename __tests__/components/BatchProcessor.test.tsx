/**
 * @file BatchProcessor 组件单元测试
 * @description 测试批量文本处理组件的核心功能和用户交互
 * @module __tests__/components/BatchProcessor.test.tsx
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-16
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BatchProcessor } from '../../components/text-tools/BatchProcessor';
import { useToast } from '@/hooks/use-toast';

// Mock useToast hook
jest.mock('@/hooks/use-toast', () => ({
  useToast: jest.fn(() => jest.fn())
}));

describe('BatchProcessor Component', () => {
  // 模拟处理器函数
  const mockProcessorFn = jest.fn(async (input: string, index: number) => {
    // 模拟异步处理
    await new Promise(resolve => setTimeout(resolve, 10));
    return input.toUpperCase();
  });

  const mockProcessorWithErrorFn = jest.fn(async (input: string, index: number) => {
    await new Promise(resolve => setTimeout(resolve, 10));
    if (input.includes('error')) {
      throw new Error('处理失败');
    }
    return input.toUpperCase();
  });

  const mockProcessorWithMetadataFn = jest.fn(async (input: string, index: number) => {
    await new Promise(resolve => setTimeout(resolve, 10));
    return {
      result: input.toUpperCase(),
      metadata: {
        length: input.length,
        processedAt: new Date().toISOString()
      }
    };
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('应该正确渲染组件并显示默认标题和描述', () => {
    render(<BatchProcessor processorFn={mockProcessorFn} />);

    // 验证标题和描述
    expect(screen.getByText('批量文本处理')).toBeInTheDocument();
    expect(screen.getByText('批量处理多条文本数据')).toBeInTheDocument();
  });

  test('应该正确渲染自定义标题和描述', () => {
    render(
      <BatchProcessor 
        processorFn={mockProcessorFn} 
        title="自定义批量处理"
        description="这是一个自定义描述"
      />
    );

    expect(screen.getByText('自定义批量处理')).toBeInTheDocument();
    expect(screen.getByText('这是一个自定义描述')).toBeInTheDocument();
  });

  test('应该正确处理输入文本并显示处理结果', async () => {
    render(<BatchProcessor processorFn={mockProcessorFn} />);

    // 输入文本
    const textarea = screen.getByRole('textbox', { name: /输入文本/i });
    fireEvent.change(textarea, { target: { value: 'hello\nworld' } });

    // 点击处理按钮
    const processButton = screen.getByRole('button', { name: /开始批量处理/i });
    fireEvent.click(processButton);

    // 等待处理完成
    await waitFor(() => {
      expect(screen.getByText('处理结果')).toBeInTheDocument();
    }, { timeout: 1000 });

    // 切换到结果标签页
    const resultsTab = screen.getByRole('tab', { name: /处理结果/i });
    fireEvent.click(resultsTab);

    // 验证处理结果
    await waitFor(() => {
      expect(screen.getByText('HELLO')).toBeInTheDocument();
      expect(screen.getByText('WORLD')).toBeInTheDocument();
    }, { timeout: 1000 });
  });

  test('应该正确处理错误情况', async () => {
    render(<BatchProcessor processorFn={mockProcessorWithErrorFn} />);

    // 输入包含错误的文本
    const textarea = screen.getByRole('textbox', { name: /输入文本/i });
    fireEvent.change(textarea, { target: { value: 'success\nerror-case' } });

    // 点击处理按钮
    const processButton = screen.getByRole('button', { name: /开始批量处理/i });
    fireEvent.click(processButton);

    // 等待处理完成
    await waitFor(() => {
      expect(screen.getByText('处理结果')).toBeInTheDocument();
    }, { timeout: 1000 });

    // 切换到结果标签页
    const resultsTab = screen.getByRole('tab', { name: /处理结果/i });
    fireEvent.click(resultsTab);

    // 验证成功和错误结果
    await waitFor(() => {
      expect(screen.getByText('SUCCESS')).toBeInTheDocument();
      expect(screen.getByText('处理失败')).toBeInTheDocument();
    }, { timeout: 1000 });
  });

  test('应该正确处理带有元数据的结果', async () => {
    render(<BatchProcessor processorFn={mockProcessorWithMetadataFn} />);

    // 输入文本
    const textarea = screen.getByRole('textbox', { name: /输入文本/i });
    fireEvent.change(textarea, { target: { value: 'test' } });

    // 点击处理按钮
    const processButton = screen.getByRole('button', { name: /开始批量处理/i });
    fireEvent.click(processButton);

    // 等待处理完成并切换到结果标签页
    await waitFor(() => {
      const resultsTab = screen.getByRole('tab', { name: /处理结果/i });
      fireEvent.click(resultsTab);
    }, { timeout: 1000 });

    // 验证元数据显示
    await waitFor(() => {
      expect(screen.getByText('元数据:')).toBeInTheDocument();
      expect(screen.getByText(/length:/i)).toBeInTheDocument();
      expect(screen.getByText(/processedAt:/i)).toBeInTheDocument();
    }, { timeout: 1000 });
  });

  test('应该正确处理自定义分隔符', async () => {
    render(<BatchProcessor processorFn={mockProcessorFn} />);

    // 打开选项并启用自定义分隔符
    const optionsButton = screen.getByRole('button', { name: /选项/i });
    fireEvent.click(optionsButton);

    const customDelimiterSwitch = screen.getByRole('checkbox', { name: /使用自定义分隔符/i });
    fireEvent.click(customDelimiterSwitch);

    // 设置自定义分隔符为逗号
    const delimiterInput = screen.getByRole('textbox', { name: /自定义分隔符/i });
    fireEvent.change(delimiterInput, { target: { value: ',' } });

    // 输入用逗号分隔的文本
    const textarea = screen.getByRole('textbox', { name: /输入文本/i });
    fireEvent.change(textarea, { target: { value: 'hello,world' } });

    // 点击处理按钮
    const processButton = screen.getByRole('button', { name: /开始批量处理/i });
    fireEvent.click(processButton);

    // 等待处理完成并切换到结果标签页
    await waitFor(() => {
      const resultsTab = screen.getByRole('tab', { name: /处理结果/i });
      fireEvent.click(resultsTab);
    }, { timeout: 1000 });

    // 验证两个独立的结果
    await waitFor(() => {
      expect(screen.getAllByText('HELLO').length).toBe(1);
      expect(screen.getAllByText('WORLD').length).toBe(1);
    }, { timeout: 1000 });
  });

  test('应该正确响应批量完成回调', async () => {
    const onBatchComplete = jest.fn();
    
    render(<BatchProcessor processorFn={mockProcessorFn} onBatchComplete={onBatchComplete} />);

    // 输入文本
    const textarea = screen.getByRole('textbox', { name: /输入文本/i });
    fireEvent.change(textarea, { target: { value: 'test' } });

    // 点击处理按钮
    const processButton = screen.getByRole('button', { name: /开始批量处理/i });
    fireEvent.click(processButton);

    // 等待回调被调用
    await waitFor(() => {
      expect(onBatchComplete).toHaveBeenCalled();
      expect(onBatchComplete.mock.calls[0][0].length).toBe(1);
    }, { timeout: 1000 });
  });

  test('应该正确清空输入', () => {
    render(<BatchProcessor processorFn={mockProcessorFn} />);

    // 输入文本
    const textarea = screen.getByRole('textbox', { name: /输入文本/i });
    fireEvent.change(textarea, { target: { value: 'test text' } });
    expect(textarea).toHaveValue('test text');

    // 点击清空按钮
    const clearButton = screen.getByRole('button', { name: /清空/i });
    fireEvent.click(clearButton);

    // 验证输入被清空
    expect(textarea).toHaveValue('');
  });

  test('处理按钮在没有输入时应该被禁用', () => {
    render(<BatchProcessor processorFn={mockProcessorFn} />);

    // 验证按钮初始状态为禁用
    const processButton = screen.getByRole('button', { name: /开始批量处理/i });
    expect(processButton).toBeDisabled();

    // 输入文本后按钮应该启用
    const textarea = screen.getByRole('textbox', { name: /输入文本/i });
    fireEvent.change(textarea, { target: { value: 'test' } });
    expect(processButton).toBeEnabled();

    // 清空输入后按钮应该再次禁用
    fireEvent.change(textarea, { target: { value: '' } });
    expect(processButton).toBeDisabled();
  });
});
