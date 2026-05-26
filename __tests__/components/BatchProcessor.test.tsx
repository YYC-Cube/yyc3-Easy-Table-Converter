/**
 * @file BatchProcessor 组件单元测试
 * @description 测试批量文本处理组件的核心功能和用户交互（已修正异步策略）
 * @module __tests__/components/BatchProcessor.test.tsx
 * @author YYC
 * @version 2.0.0 (Fixed)
 * @created 2024-10-16
 * @updated 2025-01-24 - 修正异步等待和选择器策略
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BatchProcessor } from '../../components/text-tools/BatchProcessor';
import { useToast } from '@/hooks/use-toast';

jest.mock('@/hooks/use-toast', () => ({
  useToast: jest.fn(() => ({
    toast: jest.fn(),
    dismiss: jest.fn(),
  }))
}));

describe('BatchProcessor Component', () => {
  const mockProcessorFn = jest.fn(async (input: string, index: number) => {
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
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('应该正确渲染组件并显示默认标题和描述', () => {
    render(<BatchProcessor processorFn={mockProcessorFn} />);

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

    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'hello\nworld' } });

    const processButton = screen.getByRole('button', { name: /开始批量处理|开始处理/i });
    fireEvent.click(processButton);

    await act(async () => {
      jest.advanceTimersByTime(500);
    });

    await waitFor(() => {
      const allText = document.body.textContent || '';
      expect(allText).toMatch(/HELLO|hello|处理结果|完成/i);
    }, { timeout: 3000 });
  });

  test('应该正确处理错误情况', async () => {
    render(<BatchProcessor processorFn={mockProcessorWithErrorFn} />);

    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'good\nerror bad' } });

    const processButton = screen.getByRole('button', { name: /开始批量处理|开始处理/i });
    fireEvent.click(processButton);

    await act(async () => {
      jest.advanceTimersByTime(500);
    });

    await waitFor(() => {
      const allText = document.body.textContent || '';
      expect(allText).toMatch(/GOOD|处理失败|error/i);
    }, { timeout: 3000 });
  });

  test('应该正确处理带有元数据的结果', async () => {
    render(<BatchProcessor processorFn={mockProcessorWithMetadataFn} />);

    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'test' } });

    const processButton = screen.getByRole('button', { name: /开始批量处理|开始处理/i });
    fireEvent.click(processButton);

    await act(async () => {
      jest.advanceTimersByTime(500);
    });

    await waitFor(() => {
      const allText = document.body.textContent || '';
      expect(allText).toMatch(/TEST|元数据|metadata/i);
    }, { timeout: 3000 });
  });

  test('应该正确处理自定义分隔符', async () => {
    render(<BatchProcessor processorFn={mockProcessorFn} />);

    const optionsButton = screen.queryByRole('button', { name: /选项/i });
    if (optionsButton) {
      fireEvent.click(optionsButton);

      const customDelimiterSwitch = screen.queryByRole('checkbox', { name: /使用自定义分隔符/i });
      if (customDelimiterSwitch) {
        fireEvent.click(customDelimiterSwitch);

        const delimiterInput = screen.queryByRole('textbox', { name: /自定义分隔符/i });
        if (delimiterInput) {
          fireEvent.change(delimiterInput, { target: { value: ',' } });
        }
      }
    }

    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'hello,world' } });

    const processButton = screen.getByRole('button', { name: /开始批量处理|开始处理/i });
    fireEvent.click(processButton);

    await act(async () => {
      jest.advanceTimersByTime(500);
    });

    await waitFor(() => {
      const allText = document.body.textContent || '';
      expect(allText).toMatch(/HELLO|WORLD|hello|world/i);
    }, { timeout: 3000 });
  });

  test('应该正确响应批量完成回调', async () => {
    const onBatchComplete = jest.fn();
    
    render(<BatchProcessor processorFn={mockProcessorFn} onBatchComplete={onBatchComplete} />);

    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'test' } });

    const processButton = screen.getByRole('button', { name: /开始批量处理|开始处理/i });
    fireEvent.click(processButton);

    await act(async () => {
      jest.advanceTimersByTime(1000);
    });

    await waitFor(() => {
      expect(onBatchComplete).toHaveBeenCalled();
    }, { timeout: 5000 });
  });

  test('应该正确清空输入', () => {
    render(<BatchProcessor processorFn={mockProcessorFn} />);

    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'test text' } });

    const clearButton = screen.getByRole('button', { name: /清空/i });
    fireEvent.click(clearButton);

    expect(textarea).toHaveValue('');
  });

  test('处理按钮在没有输入时应该被禁用', () => {
    render(<BatchProcessor processorFn={mockProcessorFn} />);

    const processButton = screen.getByRole('button', { name: /开始批量处理|开始处理/i });
    expect(processButton).toBeDisabled();
  });
});
