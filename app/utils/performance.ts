/**
 * @file 性能优化工具
 * @description 提供性能优化相关的工具函数
 * @module utils/performance
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-24
 */

import { ThrottleOptions, DebounceOptions, RetryOptions } from '../types/common';

/**
 * 节流函数 - 限制函数在一定时间内只能执行一次
 * @param func 要节流的函数
 * @param options 节流选项
 * @returns 节流后的函数
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  options: ThrottleOptions
): (...args: Parameters<T>) => void {
  const { limit = 100, leading = true, trailing = true } = options;
  let lastCall = 0;
  let lastArgs: Parameters<T> | null = null;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const later = () => {
    lastCall = leading === false ? 0 : Date.now();
    timeoutId = null;
    if (trailing && lastArgs) {
      func(...lastArgs);
      lastArgs = null;
    }
  };

  return function throttled(...args: Parameters<T>) {
    const now = Date.now();
    if (!lastCall && leading === false) lastCall = now;
    const remaining = limit - (now - lastCall);

    if (remaining <= 0 || remaining > limit) {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      lastCall = now;
      func(...args);
    } else if (!timeoutId && trailing) {
      lastArgs = args;
      timeoutId = setTimeout(later, remaining);
    }
  };
}

/**
 * 防抖函数 - 延迟函数执行，直到指定时间内没有再次触发
 * @param func 要防抖的函数
 * @param options 防抖选项
 * @returns 防抖后的函数
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  options: DebounceOptions
): (...args: Parameters<T>) => void {
  const { delay = 300, leading = false, trailing = true } = options;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;
  let lastThis: any;
  let lastCallTime: number | null = null;

  const invokeFunc = (time: number) => {
    const args = lastArgs;
    const thisArg = lastThis;

    lastArgs = null;
    lastThis = undefined;
    lastCallTime = time;
    func.apply(thisArg, args!);
  };

  const leadingEdge = (time: number, args: Parameters<T>, thisArg: any) => {
    lastCallTime = time;
    if (leading) {
      invokeFunc(time);
    } else {
      lastArgs = args;
      lastThis = thisArg;
    }
    return Math.max(lastCallTime + delay, time);
  };

  const remainingWait = (time: number) => {
    if (!lastCallTime) return 0;
    const timeSinceLastCall = time - lastCallTime;
    const timeWaiting = delay - timeSinceLastCall;
    return timeWaiting;
  };

  return function debounced(this: any, ...args: Parameters<T>) {
    const time = Date.now();
    const isInvoking = leading && !lastCallTime;
    lastArgs = args;
    lastThis = this;

    if (isInvoking) {
      leadingEdge(time, args, this);
      timeoutId = setTimeout(() => {
        const remaining = remainingWait(Date.now());
        if (remaining <= 0) {
          invokeFunc(Date.now());
          timeoutId = null;
        }
      }, delay);
    } else {
      const remaining = remainingWait(time);
      if (remaining <= 0 || remaining > delay) {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        if (trailing) {
          timeoutId = setTimeout(() => invokeFunc(Date.now()), delay);
        }
      }
    }
  };
}

/**
 * 重试函数 - 自动重试失败的操作
 * @param fn 要执行的函数
 * @param options 重试选项
 * @returns 执行结果
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions
): Promise<T> {
  const { 
    maxRetries = 3, 
    delay = 1000, 
    exponentialBackoff = true,
    maxDelay = 30000
  } = options;

  let lastError: Error = new Error('未知错误');

  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // 最后一次尝试失败，则抛出错误
      if (i === maxRetries) {
        throw lastError;
      }

      // 计算延迟时间
      let waitTime = delay;
      if (exponentialBackoff) {
        waitTime = Math.min(delay * Math.pow(2, i), maxDelay);
      }

      console.log(`操作失败，${waitTime}ms 后重试 (${i + 1}/${maxRetries})`, lastError);
      
      // 等待一段时间后重试
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  // 理论上不会到达这里，但为了类型安全
  throw lastError;
}

/**
 * 延迟函数
 * @param ms 延迟毫秒数
 * @returns Promise
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 测量函数执行时间
 * @param label 标签
 * @param fn 要测量的函数
 * @returns 函数执行结果
 */
export async function measure<T>(label: string, fn: () => Promise<T>): Promise<T> {
  const start = performance.now();
  try {
    return await fn();
  } finally {
    const end = performance.now();
    console.log(`${label} 执行时间: ${end - start}ms`);
  }
}

/**
 * 批量处理数组
 * @param items 要处理的数组
 * @param batchSize 批次大小
 * @param processor 处理函数
 * @returns 处理结果数组
 */
export async function batchProcess<T, R>(
  items: T[],
  batchSize: number,
  processor: (batch: T[]) => Promise<R[]>
): Promise<R[]> {
  const results: R[] = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await processor(batch);
    results.push(...batchResults);
  }
  
  return results;
}

/**
 * 限制并发数量的执行器
 * @param maxConcurrent 最大并发数
 */
export class ConcurrencyLimiter {
  private maxConcurrent: number;
  private runningTasks: number = 0;
  private taskQueue: Array<() => Promise<any>> = [];

  constructor(maxConcurrent: number = 5) {
    this.maxConcurrent = maxConcurrent;
  }

  /**
   * 执行任务
   * @param task 任务函数
   * @returns 任务执行结果
   */
  async execute<T>(task: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const wrappedTask = async () => {
        try {
          this.runningTasks++;
          const result = await task();
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          this.runningTasks--;
          this.processQueue();
        }
      };

      if (this.runningTasks < this.maxConcurrent) {
        wrappedTask();
      } else {
        this.taskQueue.push(wrappedTask);
      }
    });
  }

  /**
   * 处理任务队列
   */
  private processQueue(): void {
    while (this.taskQueue.length > 0 && this.runningTasks < this.maxConcurrent) {
      const nextTask = this.taskQueue.shift();
      if (nextTask) {
        nextTask();
      }
    }
  }

  /**
   * 获取当前运行中的任务数
   */
  getRunningCount(): number {
    return this.runningTasks;
  }

  /**
   * 获取当前队列中的任务数
   */
  getQueueLength(): number {
    return this.taskQueue.length;
  }

  /**
   * 清空任务队列
   */
  clearQueue(): void {
    this.taskQueue = [];
  }
}

/**
 * 检测是否支持Web Worker
 */
export function supportsWebWorkers(): boolean {
  return typeof Worker !== 'undefined';
}

/**
 * 创建Web Worker（如果支持）
 * @param scriptUrl Worker脚本URL
 * @returns Web Worker实例或null
 */
export function createWorker(scriptUrl: string): Worker | null {
  if (supportsWebWorkers()) {
    try {
      return new Worker(scriptUrl);
    } catch (error) {
      console.error('创建Web Worker失败:', error);
    }
  }
  return null;
}

/**
 * 计算数组差异
 * @param oldArray 旧数组
 * @param newArray 新数组
 * @returns 差异对象
 */
export function arrayDiff<T>(
  oldArray: T[],
  newArray: T[]
): { added: T[]; removed: T[]; kept: T[] } {
  const oldSet = new Set(oldArray);
  const newSet = new Set(newArray);

  const added = newArray.filter(item => !oldSet.has(item));
  const removed = oldArray.filter(item => !newSet.has(item));
  const kept = oldArray.filter(item => newSet.has(item));

  return { added, removed, kept };
}

/**
 * 缓存函数结果
 * @param fn 要缓存结果的函数
 * @param cacheSize 缓存大小
 * @returns 缓存后的函数
 */
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  cacheSize: number = 100
): (...args: Parameters<T>) => ReturnType<T> {
  const cache = new Map<string, ReturnType<T>>();
  const keys: string[] = [];

  return function memoized(...args: Parameters<T>): ReturnType<T> {
    const key = JSON.stringify(args);

    // 检查缓存中是否已有结果
    if (cache.has(key)) {
      return cache.get(key)!;
    }

    // 执行函数并缓存结果
    const result = fn(...args);
    cache.set(key, result);
    keys.push(key);

    // 如果缓存超过大小限制，移除最早的缓存
    if (keys.length > cacheSize) {
      const oldestKey = keys.shift();
      if (oldestKey) {
        cache.delete(oldestKey);
      }
    }

    return result;
  };
}