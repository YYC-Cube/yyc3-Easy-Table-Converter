/**
 * @file useLoadingState Hook
 * @description 用于管理各种异步操作的加载状态、进度和错误
 * @module hooks/useLoadingState
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 * @updated 2024-10-15
 */

import { useState, useCallback, useRef, useEffect } from 'react';

// 加载状态类型
export type LoadingStateType = 'idle' | 'loading' | 'processing' | 'success' | 'error';

// Hook返回接口
export interface UseLoadingStateReturn<T = any> {
  // 状态
  state: LoadingStateType;
  data: T | null;
  error: Error | null;
  progress: number;
  
  // 控制方法
  start: () => void;
  process: () => void;
  success: (data?: T) => void;
  fail: (error: Error | string) => void;
  updateProgress: (progress: number) => void;
  reset: () => void;
  
  // 辅助方法
  isIdle: boolean;
  isLoading: boolean;
  isProcessing: boolean;
  isSuccess: boolean;
  isError: boolean;
  isPending: boolean;
}

// Hook参数接口
export interface UseLoadingStateOptions<T = any> {
  /** 最小显示时间（毫秒），确保加载状态至少显示一段时间 */
  minDuration?: number;
  /** 最大进度值，默认为100 */
  maxProgress?: number;
  /** 初始数据 */
  initialData?: T | null;
  /** 初始状态 */
  initialState?: LoadingStateType;
  /** 状态变化回调 */
  onStateChange?: (state: LoadingStateType) => void;
  /** 进度变化回调 */
  onProgressChange?: (progress: number) => void;
}

/**
 * @description 加载状态管理Hook
 * @param {UseLoadingStateOptions<T>} options 配置选项
 * @returns {UseLoadingStateReturn<T>} 状态和控制方法
 */
export function useLoadingState<T = any>(
  options: UseLoadingStateOptions<T> = {}
): UseLoadingStateReturn<T> {
  const {
    minDuration = 300,
    maxProgress = 100,
    initialData = null,
    initialState = 'idle',
    onStateChange,
    onProgressChange
  } = options;

  // 状态管理
  const [state, setState] = useState<LoadingStateType>(initialState);
  const [data, setData] = useState<T | null>(initialData);
  const [error, setError] = useState<Error | null>(null);
  const [progress, setProgress] = useState(0);

  // 引用
  const startTimeRef = useRef<number>(0);
  const progressRef = useRef(0);
  const stateChangeTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 状态变化处理
  useEffect(() => {
    if (onStateChange) {
      onStateChange(state);
    }
  }, [state, onStateChange]);

  // 进度变化处理
  useEffect(() => {
    if (onProgressChange) {
      onProgressChange(progress);
    }
  }, [progress, onProgressChange]);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (stateChangeTimerRef.current) {
        clearTimeout(stateChangeTimerRef.current);
      }
    };
  }, []);

  // 开始加载
  const start = useCallback(() => {
    startTimeRef.current = Date.now();
    setState('loading');
    setError(null);
    updateProgress(0);
  }, []);

  // 处理中
  const process = useCallback(() => {
    setState('processing');
  }, []);

  // 成功处理
  const success = useCallback((result?: T) => {
    const elapsed = Date.now() - startTimeRef.current;
    
    // 确保最小显示时间
    if (elapsed < minDuration) {
      const remainingTime = minDuration - elapsed;
      
      if (stateChangeTimerRef.current) {
        clearTimeout(stateChangeTimerRef.current);
      }
      
      stateChangeTimerRef.current = setTimeout(() => {
        updateProgress(maxProgress);
        setState('success');
        if (result !== undefined) {
          setData(result);
        }
      }, remainingTime);
    } else {
      updateProgress(maxProgress);
      setState('success');
      if (result !== undefined) {
        setData(result);
      }
    }
  }, [minDuration, maxProgress]);

  // 失败处理
  const fail = useCallback((err: Error | string) => {
    const errorObj = err instanceof Error ? err : new Error(err);
    setError(errorObj);
    setState('error');
  }, []);

  // 更新进度
  const updateProgress = useCallback((newProgress: number) => {
    // 确保进度在有效范围内
    const clampedProgress = Math.max(0, Math.min(newProgress, maxProgress));
    progressRef.current = clampedProgress;
    setProgress(clampedProgress);
  }, [maxProgress]);

  // 重置状态
  const reset = useCallback(() => {
    if (stateChangeTimerRef.current) {
      clearTimeout(stateChangeTimerRef.current);
    }
    setState('idle');
    setData(initialData);
    setError(null);
    setProgress(0);
    progressRef.current = 0;
  }, [initialData]);

  // 辅助属性
  const isIdle = state === 'idle';
  const isLoading = state === 'loading';
  const isProcessing = state === 'processing';
  const isSuccess = state === 'success';
  const isError = state === 'error';
  const isPending = isLoading || isProcessing;

  return {
    // 状态
    state,
    data,
    error,
    progress,
    
    // 控制方法
    start,
    process,
    success,
    fail,
    updateProgress,
    reset,
    
    // 辅助方法
    isIdle,
    isLoading,
    isProcessing,
    isSuccess,
    isError,
    isPending
  };
}

/**
 * @description 创建一个异步任务执行器，自动管理加载状态
 * @param {Function} asyncFn 异步函数
 * @param {UseLoadingStateOptions<T>} options 加载状态选项
 * @returns {Object} 执行器和状态
 */
export function createAsyncLoader<T = any>(
  asyncFn: (...args: any[]) => Promise<T>,
  options: UseLoadingStateOptions<T> = {}
) {
  const loadingState = useLoadingState(options);
  const { start, process, success, fail, updateProgress } = loadingState;

  const execute = useCallback(async (...args: any[]) => {
    start();
    try {
      // 如果有进度回调参数，传递给异步函数
      const result = await asyncFn(...args, {
        updateProgress
      });
      success(result);
      return result;
    } catch (err) {
      fail(err instanceof Error ? err : new Error('Unknown error'));
      throw err;
    }
  }, [asyncFn, start, success, fail, updateProgress]);

  return {
    ...loadingState,
    execute
  };
}

export default useLoadingState;
