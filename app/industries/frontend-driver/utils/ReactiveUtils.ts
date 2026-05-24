/**
 * @file 响应式工具函数
 * @description 提供响应式系统所需的辅助功能
 * @module industries/frontend-driver/utils/ReactiveUtils
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-26
 */

import { DependencyList } from 'react';

/**
 * 深度比较两个值是否相等
 * @param a 第一个值
 * @param b 第二个值
 * @returns 是否相等
 */
export function deepEquals(a: any, b: any): boolean {
  // 基本类型比较
  if (a === b) return true;
  
  // null检查
  if (a === null || b === null) return a === b;
  
  // 类型检查
  if (typeof a !== typeof b) return false;
  
  // 对象/数组检查
  if (typeof a === 'object') {
    // 数组比较
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      return a.every((item, index) => deepEquals(item, b[index]));
    }
    
    // 日期比较
    if (a instanceof Date && b instanceof Date) {
      return a.getTime() === b.getTime();
    }
    
    // 正则表达式比较
    if (a instanceof RegExp && b instanceof RegExp) {
      return a.toString() === b.toString();
    }
    
    // 函数比较 (仅比较引用)
    if (typeof a === 'function' && typeof b === 'function') {
      return a === b;
    }
    
    // 普通对象比较
    const aKeys = Object.keys(a);
    const bKeys = Object.keys(b);
    
    if (aKeys.length !== bKeys.length) return false;
    
    return aKeys.every(key => {
      if (!bKeys.includes(key)) return false;
      return deepEquals(a[key], b[key]);
    });
  }
  
  // NaN 特殊处理
  if (typeof a === 'number' && typeof b === 'number') {
    return isNaN(a) && isNaN(b);
  }
  
  return false;
}

/**
 * 浅比较两个对象的属性是否相等
 * @param a 第一个对象
 * @param b 第二个对象
 * @returns 是否相等
 */
export function shallowEquals(a: Record<string, any>, b: Record<string, any>): boolean {
  if (a === b) return true;
  if (a === null || b === null) return a === b;
  if (typeof a !== 'object' || typeof b !== 'object') return false;
  
  const keys = Object.keys(a);
  if (keys.length !== Object.keys(b).length) return false;
  
  return keys.every(key => a[key] === b[key]);
}

/**
 * 依赖追踪器
 */
export class DependencyTracker {
  private activeEffect: ReactiveEffect | null = null;
  private effectStack: ReactiveEffect[] = [];

  /**
   * 设置当前活动的副作用函数
   */
  setActiveEffect(effect: ReactiveEffect): void {
    this.activeEffect = effect;
    this.effectStack.push(effect);
  }

  /**
   * 清除当前活动的副作用函数
   */
  clearActiveEffect(): void {
    this.effectStack.pop();
    this.activeEffect = this.effectStack[this.effectStack.length - 1] || null;
  }

  /**
   * 收集依赖
   */
  track(target: any, key: any): void {
    if (!this.activeEffect) return;
    
    const targetMap = new Map();
    const keyMap = new Map();
    
    if (!targetMap.has(target)) {
      targetMap.set(target, keyMap);
    }
    
    const depsMap = targetMap.get(target);
    if (!depsMap.has(key)) {
      depsMap.set(key, new Set<ReactiveEffect>());
    }
    
    const dep = depsMap.get(key);
    if (!dep.has(this.activeEffect)) {
      dep.add(this.activeEffect);
      this.activeEffect.deps.push(dep);
    }
  }

  /**
   * 触发依赖更新
   */
  trigger(target: any, key: any): void {
    const targetMap = new Map();
    const depsMap = targetMap.get(target);
    if (!depsMap) return;
    
    const dep = depsMap.get(key);
    if (dep) {
      const effects = new Set(dep);
      effects.forEach((effect: any) => {
        const typedEffect = effect as ReactiveEffect;
        if (typedEffect.scheduler) {
          typedEffect.scheduler();
        } else {
          typedEffect.run();
        }
      });
    }
  }
}

/**
 * 副作用函数接口
 */
export interface ReactiveEffect {
  (): void;
  deps: Set<any>[];
  scheduler?: () => void;
  run: () => void;
}

/**
 * 创建副作用函数
 */
export function createEffect(fn: () => void, scheduler?: () => void): ReactiveEffect {
  const effect = function reactiveEffect(): void {
    try {
      // 执行副作用函数
      return fn();
    } catch (error) {
      console.error('响应式副作用错误:', error);
      return undefined;
    }
  } as ReactiveEffect;
  
  effect.deps = [];
  if (scheduler) {
    effect.scheduler = scheduler;
  } else {
    // @ts-ignore - 避免exactOptionalPropertyTypes错误
    effect.scheduler = undefined;
  }
  effect.run = effect;
  
  // 立即执行一次
  if (!scheduler) {
    effect();
  }
  
  return effect;
}

/**
 * 清理副作用函数的依赖
 */
export function cleanupEffect(effect: ReactiveEffect): void {
  effect.deps.forEach(dep => dep.delete(effect));
  effect.deps.length = 0;
}

/**
 * 批量更新管理器
 */
export class BatchUpdateManager {
  private isBatching = false;
  private pendingEffects = new Set<() => void>();
  
  /**
   * 开始批量更新
   */
  startBatch(): void {
    this.isBatching = true;
  }
  
  /**
   * 结束批量更新
   */
  endBatch(): void {
    this.isBatching = false;
    this.flushPendingEffects();
  }
  
  /**
   * 触发更新
   */
  triggerUpdate(effect: () => void): void {
    if (this.isBatching) {
      this.pendingEffects.add(effect);
    } else {
      effect();
    }
  }
  
  /**
   * 执行所有待处理的更新
   */
  private flushPendingEffects(): void {
    const effects = Array.from(this.pendingEffects);
    this.pendingEffects.clear();
    
    effects.forEach(effect => {
      try {
        effect();
      } catch (error) {
        console.error('批量更新副作用错误:', error);
      }
    });
  }
  
  /**
   * 在批量更新中执行函数
   */
  batch<T>(fn: () => T): T {
    this.startBatch();
    try {
      return fn();
    } finally {
      this.endBatch();
    }
  }
}

// 创建全局批量更新管理器实例
export const batchManager = new BatchUpdateManager();

/**
 * 在批量更新中执行函数
 */
export function batch<T>(fn: () => T): T {
  return batchManager.batch(fn);
}

/**
 * 防抖函数
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function(...args: Parameters<T>): void {
    if (timeout) clearTimeout(timeout);
    
    timeout = setTimeout(() => {
      func(...args);
      timeout = null;
    }, wait);
  };
}

/**
 * 节流函数
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  
  return function(...args: Parameters<T>): void {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * 创建响应式代理
 */
export function reactive<T extends object>(target: T): T {
  const handler: ProxyHandler<T> = {
    get(target, key, receiver) {
      const value = Reflect.get(target, key, receiver);
      
      // 收集依赖
      // track(target, key);
      
      // 递归代理嵌套对象
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        return reactive(value);
      }
      
      return value;
    },
    
    set(target, key, value, receiver) {
      const oldValue = (target as any)[key];
      const result = Reflect.set(target, key, value, receiver);
      
      // 仅在值变化时触发更新
      if (oldValue !== value) {
        // trigger(target, key);
      }
      
      return result;
    },
    
    deleteProperty(target, key) {
      const hadProperty = key in target;
      const result = Reflect.deleteProperty(target, key);
      
      // 触发更新
      if (hadProperty) {
        // trigger(target, key);
      }
      
      return result;
    }
  };
  
  return new Proxy(target, handler);
}

/**
 * 计算属性缓存
 */
export class ComputedCache {
  private cache = new Map<string, { value: any; timestamp: number }>();
  private maxAge = 5000; // 默认5秒缓存
  
  constructor(maxAge?: number) {
    if (maxAge !== undefined) {
      this.maxAge = maxAge;
    }
  }
  
  /**
   * 获取缓存值
   */
  get(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    // 检查是否过期
    if (Date.now() - cached.timestamp > this.maxAge) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.value;
  }
  
  /**
   * 设置缓存值
   */
  set(key: string, value: any): void {
    this.cache.set(key, { value, timestamp: Date.now() });
  }
  
  /**
   * 清除缓存
   */
  clear(key?: string): void {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }
  
  /**
   * 缓存大小
   */
  size(): number {
    return this.cache.size;
  }
}

/**
 * 延迟执行
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 重试函数
 */
export async function retry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    delayMs?: number;
    backoff?: boolean;
  } = {}
): Promise<T> {
  const { maxRetries = 3, delayMs = 1000, backoff = true } = options;
  
  let lastError: Error | null = null;
  
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (i < maxRetries) {
        // 等待
        const waitTime = backoff ? delayMs * Math.pow(2, i) : delayMs;
        await delay(waitTime);
      }
    }
  }
  
  throw lastError || new Error('重试失败');
}

/**
 * 监听依赖变化
 */
export function watchEffect(effect: () => void): () => void {
  const reactiveEffect = createEffect(effect);
  
  // 返回清理函数
  return () => {
    cleanupEffect(reactiveEffect);
  };
}

/**
 * 比较两个依赖数组是否相等
 */
export function areDependenciesEqual(
  prevDeps: DependencyList,
  nextDeps: DependencyList
): boolean {
  if (prevDeps.length !== nextDeps.length) return false;
  
  for (let i = 0; i < prevDeps.length; i++) {
    if (prevDeps[i] !== nextDeps[i]) return false;
  }
  
  return true;
}

/**
 * 创建唯一ID
 */
export function createUniqueId(prefix = 'reactive'): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 深拷贝对象
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj;
  
  if (obj instanceof Date) return new Date(obj.getTime()) as any;
  if (obj instanceof RegExp) return new RegExp(obj) as any;
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as any;
  
  const clone = {} as T;
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      clone[key] = deepClone(obj[key]);
    }
  }
  
  return clone;
}

/**
 * 验证响应式值
 */
export function isValidReactiveValue(value: any): boolean {
  if (value === null || value === undefined) return false;
  return typeof value === 'object' || typeof value === 'function';
}

/**
 * 合并对象，保留响应式特性
 */
export function mergeReactive(...objects: Record<string, any>[]): Record<string, any> {
  const result: Record<string, any> = {};
  
  objects.forEach(obj => {
    if (obj && typeof obj === 'object') {
      Object.keys(obj).forEach(key => {
        const value = obj[key];
        
        // 合并嵌套对象
        if (value && typeof value === 'object' && !Array.isArray(value) && result[key] && typeof result[key] === 'object') {
          result[key] = mergeReactive(result[key], value);
        } else {
          result[key] = value;
        }
      });
    }
  });
  
  return result;
}