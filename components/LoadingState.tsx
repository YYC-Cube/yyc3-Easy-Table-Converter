/**
 * @file 加载状态组件
 * @description 提供优雅的数据加载状态展示和反馈
 * @module components
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-18
 */
"use client"

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription } from './ui/card';
import { Skeleton } from './ui/skeleton';
import { Loader2, Clock, Activity, ArrowUpDown, Filter, Zap, Download, Upload } from 'lucide-react';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';

interface LoadingStateProps {
  isLoading: boolean;
  message?: string;
  operation?: 'loading' | 'processing' | 'saving'   | 'exporting' | 'importing' | 'sorting' | 'filtering';
  progress?: number; // 0-100
  showProgress?: boolean;
  compact?: boolean;
  fullScreen?: boolean;
  minDuration?: number; // 最小显示时间（毫秒）
}

const operationIcons: Record<LoadingStateProps['operation'], React.ReactNode> = {
  loading: <Loader2 className="h-5 w-5" />,
  processing: <Activity className="h-5 w-5" />,
  saving: <Download className="h-5 w-5" />,
  exporting: <Download className="h-5 w-5" />,
  importing: <Upload className="h-5 w-5" />,
  sorting: <ArrowUpDown className="h-5 w-5" />,
  filtering: <Filter className="h-5 w-5" />,
};

const operationMessages: Record<LoadingStateProps['operation'], string> = {
  loading: '正在加载数据...',
  processing: '正在处理数据...',
  saving: '正在保存数据...',
  exporting: '正在导出数据...',
  importing: '正在导入数据...',
  sorting: '正在排序数据...',
  filtering: '正在筛选数据...',
};

export const LoadingState: React.FC<LoadingStateProps> = ({
  isLoading,
  message,
  operation = 'loading',
  progress,
  showProgress = true,
  compact = false,
  fullScreen = false,
  minDuration = 300,
}) => {
  const [visible, setVisible] = useState(isLoading);
  const [displayProgress, setDisplayProgress] = useState(progress || 0);
  const [startTime, setStartTime] = useState<number | null>(null);

  // 确保最小显示时间
  useEffect(() => {
    if (isLoading && !startTime) {
      setStartTime(Date.now());
      setVisible(true);
    }

    if (!isLoading && startTime) {
      const elapsed = Date.now() - startTime;
      if (elapsed < minDuration) {
        const timer = setTimeout(() => {
          setVisible(false);
          setStartTime(null);
        }, minDuration - elapsed);
        return () => clearTimeout(timer);
      } else {
        setVisible(false);
        setStartTime(null);
      }
    }
  }, [isLoading, minDuration, startTime]);

  // 动画进度条
  useEffect(() => {
    if (progress !== undefined) {
      // 平滑过渡到目标进度
      const timer = setTimeout(() => {
        setDisplayProgress(progress);
      }, 100);
      return () => clearTimeout(timer);
    } else if (isLoading) {
      // 加载中但无具体进度时的动画
      let currentValue = displayProgress;
      const interval = setInterval(() => {
        currentValue = (currentValue + 0.5) % 100;
        setDisplayProgress(currentValue);
      }, 30);
      return () => clearInterval(interval);
    }
  }, [isLoading, progress, displayProgress]);

  if (!visible) {
    return null;
  }

  const operationIcon = operationIcons[operation];
  const defaultMessage = operationMessages[operation];
  const displayMessage = message || defaultMessage;

  // 紧凑模式
  if (compact) {
    return (
      <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
        <span className="animate-spin">{operationIcon}</span>
        <span>{displayMessage}</span>
        {progress !== undefined && (
          <Badge variant="outline" className="ml-2">
            {Math.round(progress)}%
          </Badge>
        )}
      </div>
    );
  }

  // 全屏模式
  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <Card className="w-full max-w-md border-0 shadow-xl">
          <CardContent className="p-8 space-y-6">
            <div className="flex flex-col items-center gap-4">
              <div className="rounded-full bg-primary/10 p-4 animate-pulse">
                <span className="animate-spin text-primary">{operationIcon}</span>
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-lg font-medium">{displayMessage}</h3>
                <CardDescription className="text-sm">
                  {operation === 'loading' && '正在加载数据，请稍候...'}
                  {operation === 'processing' && '数据处理中，请勿关闭页面...'}
                  {operation === 'saving' && '保存中，确保数据安全...'}
                  {operation === 'exporting' && '正在准备导出文件...'}
                  {operation === 'importing' && '正在处理导入的数据...'}
                  {operation === 'sorting' && '正在重新排序数据...'}
                  {operation === 'filtering' && '正在筛选符合条件的数据...'}
                </CardDescription>
              </div>
              
              {showProgress && (
                <div className="w-full space-y-2">
                  <Progress value={displayProgress} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{displayMessage}</span>
                    <span>{Math.round(displayProgress)}%</span>
                  </div>
                </div>
              )}
              
              <div className="flex items-center text-xs text-muted-foreground">
                <Clock className="h-3 w-3 mr-1" />
                <span>操作开始于: {startTime ? new Date(startTime).toLocaleTimeString() : new Date().toLocaleTimeString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 默认内联模式
  return (
    <div className="relative w-full rounded-md border bg-muted/50 p-6 text-center">
      <div className="flex flex-col items-center gap-3">
        <div className="animate-spin text-primary">{operationIcon}</div>
        <div className="space-y-1">
          <p className="text-sm font-medium">{displayMessage}</p>
          <p className="text-xs text-muted-foreground">
            数据处理中，请稍候...
          </p>
        </div>
        
        {showProgress && (
          <div className="w-full max-w-xs space-y-1 mt-2">
            <Progress value={displayProgress} className="h-1.5" />
            <div className="text-right text-xs text-muted-foreground">
              {Math.round(displayProgress)}%
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// 数据表格加载骨架
export const TableLoadingSkeleton: React.FC<{
  columns: number;
  rows: number;
}> = ({ columns = 5, rows = 8 }) => {
  return (
    <div className="w-full overflow-hidden rounded-md border">
      <div className="grid grid-cols-1 divide-y">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="flex items-center gap-4 p-4 animate-pulse">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <div key={colIndex} className="flex-1">
                <Skeleton className="h-5 w-full" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

// 加载指示器钩子
export const useLoadingIndicator = () => {
  const [loadingState, setLoadingState] = useState<{
    isLoading: boolean;
    operation: LoadingStateProps['operation'];
    message: string;
    progress?: number;
  }>({
    isLoading: false,
    operation: 'loading',
    message: '',
  });

  const startLoading = (
    operation: LoadingStateProps['operation'] = 'loading',
    message?: string
  ) => {
    setLoadingState({
      isLoading: true,
      operation,
      message: message || operationMessages[operation],
    });
  };

  const updateProgress = (progress: number) => {
    setLoadingState(prev => ({
      ...prev,
      progress,
    }));
  };

  const stopLoading = () => {
    setLoadingState(prev => ({
      ...prev,
      isLoading: false,
    }));
  };

  return {
    loadingState,
    startLoading,
    updateProgress,
    stopLoading,
  };
};