/**
 * @file ErrorBoundary 组件测试
 * @description 全局错误边界组件的单元测试
 * @module __tests__/components/ErrorBoundary.test
 * @author YYC
 * @version 1.0.0
 * @created 2026-02-22
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ErrorBoundary } from '@/app/components/ErrorBoundary';

describe('ErrorBoundary', () => {
  const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  
  afterEach(() => {
    errorSpy.mockClear();
  });
  
  afterAll(() => {
    errorSpy.mockRestore();
  });

  it('should render children when no error occurs', () => {
    render(
      <ErrorBoundary>
        <div>Child Content</div>
      </ErrorBoundary>
    );
    
    expect(screen.getByText('Child Content')).toBeInTheDocument();
  });

  it('should render fallback when error occurs', () => {
    const ThrowError = () => {
      throw new Error('Test error');
    };

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText('出现了一些问题')).toBeInTheDocument();
    expect(screen.getByText('应用程序遇到了一个意外错误')).toBeInTheDocument();
  });

  it('should call onError callback when error occurs', () => {
    const onError = jest.fn();
    const ThrowError = () => {
      throw new Error('Test error');
    };

    render(
      <ErrorBoundary onError={onError}>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(onError).toHaveBeenCalled();
    expect(onError.mock.calls[0][0]).toBeInstanceOf(Error);
    expect(onError.mock.calls[0][0].message).toBe('Test error');
  });

  it('should reset error state when reset button is clicked', async () => {
    const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
      if (shouldThrow) {
        throw new Error('Test error');
      }
      return <div>No Error</div>;
    };

    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    expect(screen.getByText('出现了一些问题')).toBeInTheDocument();

    // 使用key强制重新挂载来模拟重置
    rerender(
      <ErrorBoundary key="reset">
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );

    await waitFor(() => {
      expect(screen.getByText('No Error')).toBeInTheDocument();
    });
  });

  it('should render custom fallback when provided', () => {
    const ThrowError = () => {
      throw new Error('Test error');
    };

    const CustomFallback = () => <div>Custom Error UI</div>;

    render(
      <ErrorBoundary fallback={<CustomFallback />}>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText('Custom Error UI')).toBeInTheDocument();
    expect(screen.queryByText('出现了一些问题')).not.toBeInTheDocument();
  });

  it('should have working return home button', () => {
    const ThrowError = () => {
      throw new Error('Test error');
    };

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    const homeButton = screen.getByText('返回首页');
    expect(homeButton).toBeInTheDocument();
    
    fireEvent.click(homeButton);
    expect(window.location.href).toBe('http://localhost/');
  });

  it('should display error details in development mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    const ThrowError = () => {
      throw new Error('Test error message');
    };

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText(/Test error message/)).toBeInTheDocument();

    process.env.NODE_ENV = originalEnv;
  });
});
