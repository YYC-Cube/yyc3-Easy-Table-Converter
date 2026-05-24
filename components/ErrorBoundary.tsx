/**
 * @file 错误边界组件
 * @description 捕获并处理React组件树中的JavaScript错误
 * @module components
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-18
 */
"use client"

import React, { Component, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallbackComponent?: React.ReactElement;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  retryable?: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // 更新状态，下一次渲染将显示降级UI
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // 记录错误信息
    console.error('🔴 [ErrorBoundary] 捕获到错误:', error, errorInfo);
    
    // 调用自定义错误处理回调
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
    
    // 可以在这里发送错误到监控服务
    this.logErrorToService(error, errorInfo);
    
    this.setState({
      errorInfo,
    });
  }

  private logErrorToService(error: Error, errorInfo: React.ErrorInfo) {
    // 实际项目中可以替换为真实的错误监控服务
    if (typeof window !== 'undefined') {
      console.error('🔴 错误详情:', {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        url: window.location.href,
      });
    }
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
    // 刷新组件
    window.location.reload();
  };

  render() {
    const { hasError, error, errorInfo } = this.state;
    const { fallbackComponent, retryable = true } = this.props;

    if (hasError) {
      // 如果提供了自定义降级组件，则渲染它
      if (fallbackComponent) {
        return fallbackComponent;
      }

      // 默认错误展示UI
      return (
        <div className="flex min-h-screen items-center justify-center p-4 bg-background">
          <Card className="w-full max-w-md border-destructive">
            <CardHeader>
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="h-6 w-6" />
                <CardTitle>操作出错</CardTitle>
              </div>
              <CardDescription>我们遇到了一个问题，请尝试以下解决方案</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-3 rounded-md bg-destructive/10 text-destructive">
                  <p className="font-medium">错误信息</p>
                  <p className="text-sm mt-1">{error?.message || '未知错误'}</p>
                </div>
                
                {process.env.NODE_ENV === 'development' && errorInfo && (
                  <div className="p-3 rounded-md bg-muted/50 text-muted-foreground text-xs overflow-auto max-h-40">
                    <pre>{errorInfo.componentStack}</pre>
                  </div>
                )}
                
                <div className="text-sm text-muted-foreground">
                  <p>可能的原因：</p>
                  <ul className="list-disc pl-5 mt-1 space-y-1">
                    <li>数据格式不正确</li>
                    <li>操作超时或网络问题</li>
                    <li>系统暂时不可用</li>
                  </ul>
                </div>
              </div>
            </CardContent>
            
            {retryable && (
              <div className="p-4 flex justify-center border-t">
                <Button onClick={this.handleReset} className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  重试操作
                </Button>
              </div>
            )}
          </Card>
        </div>
      );
    }

    // 正常渲染子组件
    return this.props.children;
  }
}

// 便捷的错误展示组件
export const ErrorDisplay: React.FC<{
  error: Error | string;
  onRetry?: () => void;
  showRetry?: boolean;
}> = ({ error, onRetry, showRetry = true }) => {
  const errorMessage = typeof error === 'string' ? error : error.message;
  
  return (
    <div className="p-4 rounded-md bg-destructive/10 text-destructive border border-destructive/20">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="font-medium">操作失败</p>
          <p className="text-sm mt-1">{errorMessage}</p>
          
          {showRetry && onRetry && (
            <Button 
              size="sm" 
              variant="default" 
              onClick={onRetry} 
              className="mt-3 gap-1 h-8"
            >
              <RefreshCw className="h-3 w-3" />
              重试
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

// 错误处理工具函数
export const handleError = (
  error: unknown,
  context: string,
  onErrorCallback?: (error: Error) => void
): Error => {
  const errorObj = error instanceof Error ? error : new Error(String(error));
  
  console.error(`🔴 [${context}] 错误:`, errorObj);
  
  // 调用回调
  if (onErrorCallback) {
    onErrorCallback(errorObj);
  }
  
  return errorObj;
};

// 业务错误类
export class BusinessError extends Error {
  code: string;
  metadata?: Record<string, any>;
  
  constructor(message: string, code: string, metadata: Record<string, any> = {}) {
    super(message);
    this.name = 'BusinessError';
    this.code = code;
    this.metadata = metadata;
  }
}