/**
 * @file 响应式UI管理器
 * @description 实现响应式UI更新系统的核心功能
 * @module industries/frontend-driver/utils/ReactiveUIManager
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-26
 */

import {
  ReactiveUIManager,
  ReactiveState,
  ReactiveStateOptions,
  ComputedState,
  ReactiveEffect,
  ReactiveEffectOptions,
  ReactiveListener,
  ComputedFn,
  EffectFn,
  ReactiveContext,
  ReactiveUpdateEvent,
  ReactiveHistory,
  ReactiveBatchProcessor,
  BatchOptions
} from '../types/ReactiveUITypes';

/**
 * 默认的相等比较函数
 * @param a 值A
 * @param b 值B
 * @returns 是否相等
 */
function defaultEquals<T>(a: T, b: T): boolean {
  return a === b;
}

/**
 * 深度相等比较函数
 * @param a 值A
 * @param b 值B
 * @returns 是否相等
 */
function deepEquals<T>(a: T, b: T): boolean {
  // 处理基本类型和null
  if (a === b || (a === null && b === null) || (a === undefined && b === undefined)) {
    return true;
  }
  
  // 处理数组
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, index) => deepEquals(item, b[index]));
  }
  
  // 处理对象
  if (typeof a === 'object' && typeof b === 'object' && a !== null && b !== null) {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    
    if (keysA.length !== keysB.length) return false;
    
    return keysA.every(key => 
      keysB.includes(key) && deepEquals((a as any)[key], (b as any)[key])
    );
  }
  
  return false;
}

/**
 * 生成唯一ID
 * @returns 唯一ID字符串
 */
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * 防抖函数
 * @param func 要防抖的函数
 * @param wait 等待时间（毫秒）
 * @returns 防抖后的函数
 */
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return function(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * 节流函数
 * @param func 要节流的函数
 * @param wait 等待时间（毫秒）
 * @returns 节流后的函数
 */
function throttle<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
  let lastCall = 0;
  
  return function(...args: Parameters<T>) {
    const now = Date.now();
    if (now - lastCall >= wait) {
      lastCall = now;
      func(...args);
    }
  };
}

/**
 * 响应式历史记录实现
 */
class ReactiveHistoryImpl<T> implements ReactiveHistory<T> {
  private _records: ReactiveUpdateEvent<T>[] = [];
  private _maxLength: number;
  private _currentIndex: number = -1;
  
  constructor(maxLength: number = 100) {
    this._maxLength = maxLength;
  }
  
  get records(): ReactiveUpdateEvent<T>[] {
    return this._records;
  }
  
  get maxLength(): number {
    return this._maxLength;
  }
  
  add(event: ReactiveUpdateEvent<T>): void {
    // 如果当前不在最后位置，截断后面的历史记录
    if (this._currentIndex < this._records.length - 1) {
      this._records = this._records.slice(0, this._currentIndex + 1);
    }
    
    // 添加新记录
    this._records.push(event);
    
    // 保持最大长度
    if (this._records.length > this._maxLength) {
      this._records.shift();
    } else {
      this._currentIndex++;
    }
  }
  
  clear(): void {
    this._records = [];
    this._currentIndex = -1;
  }
  
  get(): ReactiveUpdateEvent<T>[] {
    return this._records;
  }
  
  undo(): ReactiveUpdateEvent<T> | undefined {
    if (this._currentIndex >= 0) {
      return this._records[this._currentIndex--];
    }
    return undefined;
  }
  
  redo(): ReactiveUpdateEvent<T> | undefined {
    if (this._currentIndex < this._records.length - 1) {
      return this._records[++this._currentIndex];
    }
    return undefined;
  }
}

/**
 * 响应式状态实现
 */
class ReactiveStateImpl<T> implements ReactiveState<T> {
  private _value: T;
  private _listeners: Set<ReactiveListener<T>> = new Set();
  private _equals: (a: T, b: T) => boolean;
  private _history?: ReactiveHistory<T>;
  private _name?: string;
  private _updateFn: (newValue: T | ((prevValue: T) => T)) => void;
  private _trackable: boolean;
  
  constructor(initialValue: T, options: ReactiveStateOptions<T> = {}) {
    this._value = initialValue;
    this._equals = options.equals || defaultEquals;
    this._name = options.name || '';
    this._trackable = options.trackable !== false;
    
    // 启用历史记录
    if (this._trackable) {
      this._history = new ReactiveHistoryImpl<T>();
    }
    
    // 创建更新函数（可能包含防抖或节流）
    this._updateFn = this.createUpdateFn(options);
  }
  
  /**
   * 创建更新函数
   */
  private createUpdateFn(options: ReactiveStateOptions<T>): (newValue: T | ((prevValue: T) => T)) => void {
    const updateFn = (newValue: T | ((prevValue: T) => T)) => {
      const oldValue = this._value;
      const finalValue = typeof newValue === 'function' 
        ? (newValue as (prev: T) => T)(oldValue)
        : newValue;
      
      // 检查值是否变化
      if (!this._equals(oldValue, finalValue)) {
        this._value = finalValue;
        
        // 记录历史
        if (this._history && this._trackable) {
          const event: ReactiveUpdateEvent<T> = {
            oldValue,
            newValue: finalValue,
            timestamp: Date.now(),
            updateId: generateId()
          };
          this._history.add(event);
        }
        
        // 通知所有监听器
        this._listeners.forEach(listener => {
          try {
            listener(finalValue);
          } catch (error) {
            console.error(`Error in reactive state listener${this._name ? ` (${this._name})` : ''}:`, error);
          }
        });
      }
    };
    
    // 应用防抖
    if (options.debounce) {
      return debounce(updateFn, options.debounce);
    }
    
    // 应用节流
    if (options.throttle) {
      return throttle(updateFn, options.throttle);
    }
    
    return updateFn;
  }
  
  get value(): T {
    // 记录当前活跃的Effect作为依赖
    const currentEffect = getCurrentEffect();
    if (currentEffect && this._trackable) {
      currentEffect.addDependency(this);
    }
    
    return this._value;
  }
  
  get(): T {
    return this.value;
  }
  
  set(newValue: T | ((prevValue: T) => T)): void {
    this.update(newValue);
  }
  
  update(newValue: T | ((prevValue: T) => T)): void {
    this._updateFn(newValue);
  }
  
  subscribe(listener: ReactiveListener<T>): () => void {
    this._listeners.add(listener);
    
    // 返回取消订阅函数
    return () => {
      this._listeners.delete(listener);
    };
  }
  
  /**
   * 获取历史记录（内部使用）
   */
  getHistory(): ReactiveHistory<T> | undefined {
    return this._history;
  }
  
  /**
   * 获取订阅者数量（用于调试）
   */
  getSubscriberCount(): number {
    return this._listeners.size;
  }
}

/**
 * 计算状态实现
 */
class ComputedStateImpl<T> implements ComputedState<T> {
  private _computeFn: ComputedFn<T>;
  private _value: T | undefined;
  private _dirty: boolean = true;
  private _listeners: Set<ReactiveListener<T>> = new Set();
  private _dependencies: Set<any> = new Set();
  
  constructor(computeFn: ComputedFn<T>) {
    this._computeFn = computeFn;
  }
  
  /**
   * 计算并缓存值
   */
  private computeValue(): T {
    // 保存当前活跃的Effect
    const previousEffect = getCurrentEffect();
    
    try {
      // 设置当前计算状态作为活跃的依赖跟踪器
      setCurrentEffect({ addDependency: (dep: any) => this._dependencies.add(dep) } as any);
      
      // 清除所有依赖
      this._dependencies.clear();
      
      // 计算新值
      this._value = this._computeFn();
      this._dirty = false;
      
      return this._value;
    } finally {
      // 恢复之前的Effect
      setCurrentEffect(previousEffect);
    }
  }
  
  // markDirty方法被移除，因为未使用
  
  get value(): T {
    if (this._dirty) {
      return this.computeValue();
    }
    
    // 记录当前活跃的Effect作为依赖
    const currentEffect = getCurrentEffect();
    if (currentEffect) {
      currentEffect.addDependency(this);
    }
    
    return this._value!;
  }
  
  get(): T {
    return this.value;
  }
  
  subscribe(listener: ReactiveListener<T>): () => void {
    this._listeners.add(listener);
    
    // 返回取消订阅函数
    return () => {
      this._listeners.delete(listener);
    };
  }
  
  /**
   * 获取订阅者数量（用于调试）
   */
  getSubscriberCount(): number {
    return this._listeners.size;
  }
}

/**
 * Effect实现
 */
class ReactiveEffectImpl implements ReactiveEffect {
  private _effectFn: EffectFn;
  private _cleanupFn: (() => void) | undefined = undefined;
  private _dependencies: Set<any> = new Set();
  private _isActive: boolean = true;
  private _options: ReactiveEffectOptions;
  private _name?: string;
  
  constructor(effectFn: EffectFn, options: ReactiveEffectOptions = {}) {
    this._effectFn = effectFn;
    this._options = options;
    this._name = options.name || '';
    
    // 立即执行
    if (options.immediate !== false) {
      this.run();
    }
  }
  
  /**
   * 运行Effect
   */
  public run(): void {
    if (!this._isActive) return;
    
    // 清除之前的依赖
    this._cleanupDependencies();
    
    // 保存当前活跃的Effect
    const previousEffect = getCurrentEffect();
    
    try {
      // 设置当前Effect为活跃
      setCurrentEffect(this);
      
      // 执行清理函数
      if (this._cleanupFn) {
        try {
          this._cleanupFn();
        } catch (error) {
          console.error(`Error in effect cleanup${this._name ? ` (${this._name})` : ''}:`, error);
        }
        this._cleanupFn = undefined;
      }
      
      // 执行Effect函数
      this._cleanupFn = this._effectFn() || undefined;
    } catch (error) {
      // 处理错误
      if (this._options.onError) {
        this._options.onError(error);
      } else {
        console.error(`Error in reactive effect${this._name ? ` (${this._name})` : ''}:`, error);
      }
    } finally {
      // 恢复之前的Effect
      setCurrentEffect(previousEffect);
    }
  }
  
  /**
   * 清理依赖
   */
  private _cleanupDependencies(): void {
    this._dependencies.clear();
  }
  
  /**
   * 添加依赖
   */
  addDependency(dependency: any): void {
    this._dependencies.add(dependency);
  }
  
  /**
   * 销毁Effect
   */
  destroy(): void {
    if (this._isActive) {
      this._isActive = false;
      this._cleanupDependencies();
      
      // 执行清理函数
      if (this._cleanupFn) {
        try {
          this._cleanupFn();
        } catch (error) {
          console.error(`Error in effect cleanup during destroy${this._name ? ` (${this._name})` : ''}:`, error);
        }
        this._cleanupFn = undefined;
      }
    }
  }
  
  /**
   * 重新执行Effect
   */
  rerun(): void {
    if (this._isActive) {
      this.run();
    }
  }
  
  /**
   * 获取依赖数量（用于调试）
   */
  getDependencyCount(): number {
    return this._dependencies.size;
  }
  
  /**
   * 是否活跃
   */
  isActive(): boolean {
    return this._isActive;
  }
}

/**
 * 批处理器实现
 */
class BatchProcessorImpl implements ReactiveBatchProcessor {
  private _updates: Set<() => void> = new Set();
  private _scheduled: boolean = false;
  private _delay: number = 0;
  private _timeoutId: NodeJS.Timeout | null = null;
  
  constructor(delay: number = 0) {
    this._delay = delay;
  }
  
  add(updateFn: () => void): void {
    this._updates.add(updateFn);
    this.scheduleFlush();
  }
  
  /**
   * 调度刷新
   */
  private scheduleFlush(): void {
    if (!this._scheduled) {
      this._scheduled = true;
      
      if (this._delay > 0) {
        this._timeoutId = setTimeout(() => this.flush(), this._delay);
      } else {
        // 在下一个微任务中执行
        Promise.resolve().then(() => this.flush());
      }
    }
  }
  
  flush(): void {
    if (!this._scheduled) return;
    
    // 清除超时
    if (this._timeoutId) {
      clearTimeout(this._timeoutId);
      this._timeoutId = null;
    }
    
    // 重置状态
    this._scheduled = false;
    const updates = this._updates;
    this._updates = new Set();
    
    // 执行所有更新
    updates.forEach(updateFn => {
      try {
        updateFn();
      } catch (error) {
        console.error('Error in batch update:', error);
      }
    });
  }
  
  cancel(): void {
    this._scheduled = false;
    if (this._timeoutId) {
      clearTimeout(this._timeoutId);
      this._timeoutId = null;
    }
    this._updates.clear();
  }
  
  hasPending(): boolean {
    return this._scheduled || this._updates.size > 0;
  }
}

// 全局上下文
let currentContext: ReactiveContext = {
  activeEffect: null,
  setActiveEffect: (effect) => {
    currentContext.activeEffect = effect;
  },
  runEffect: (effectFn) => {
    const effect = new ReactiveEffectImpl(effectFn);
    const prevEffect = currentContext.activeEffect;
    currentContext.activeEffect = effect;
    try {
      effect.run();
    } finally {
      currentContext.activeEffect = prevEffect;
    }
    return effect;
  }
};

/**
 * 获取当前活跃的Effect
 */
function getCurrentEffect(): any {
  return currentContext.activeEffect;
}

/**
 * 设置当前活跃的Effect
 */
function setCurrentEffect(effect: any): void {
  currentContext.setActiveEffect(effect);
}

/**
 * 响应式UI管理器实现
 */
class ReactiveUIManagerImpl implements ReactiveUIManager {
  private _batchProcessor: ReactiveBatchProcessor;
  private _context: ReactiveContext;
  private _config: { enablePerformanceTracking?: boolean } = {};
  
  constructor() {
    this._batchProcessor = new BatchProcessorImpl();
    this._context = {
      activeEffect: null,
      setActiveEffect: (effect) => {
        this._context.activeEffect = effect;
      },
      runEffect: (effectFn) => {
        return this.createEffect(effectFn);
      }
    };
    
    // 设置全局上下文
    this.setContext(this._context);
  }
  
  createState<T>(initialValue: T, options?: ReactiveStateOptions<T>): ReactiveState<T> {
    return new ReactiveStateImpl<T>(initialValue, options || {});
  }
  
  createComputed<T>(computeFn: ComputedFn<T>): ComputedState<T> {
    return new ComputedStateImpl<T>(computeFn);
  }
  
  createEffect(effectFn: EffectFn, options?: ReactiveEffectOptions): ReactiveEffect {
    return new ReactiveEffectImpl(effectFn, options || {});
  }
  
  batch(updates: () => void, options?: BatchOptions): void {
    if (options?.async) {
      // 异步批处理
      this._batchProcessor.add(updates);
    } else {
      // 同步批处理
      updates();
    }
  }
  
  getContext(): ReactiveContext {
    return this._context;
  }
  
  setContext(context: ReactiveContext): void {
    currentContext = context;
    this._context = context;
  }
  
  runBatch(): void {
    this._batchProcessor.flush();
  }
  
  /**
   * 启用性能跟踪
   */
  enablePerformanceTracking(): void {
    this._config.enablePerformanceTracking = true;
  }
  
  /**
   * 禁用性能跟踪
   */
  disablePerformanceTracking(): void {
    this._config.enablePerformanceTracking = false;
  }
  
  /**
   * 检查是否启用性能跟踪
   */
  isPerformanceTrackingEnabled(): boolean {
    return this._config.enablePerformanceTracking === true;
  }
  
  /**
   * 创建ReactiveState工厂函数
   */
  createStateFactory<T>(initialValue: T, options?: ReactiveStateOptions<T>): () => ReactiveState<T> {
    return () => this.createState(initialValue, options);
  }
  
  /**
   * 创建ComputedState工厂函数
   */
  createComputedFactory<T>(computeFn: ComputedFn<T>): () => ComputedState<T> {
    return () => this.createComputed(computeFn);
  }
}

// 创建默认的管理器实例
const defaultManager = new ReactiveUIManagerImpl();

// 导出管理器实例
export const reactiveManager = defaultManager;

// 导出便捷函数
export const {
  createState,
  createComputed,
  createEffect,
  batch,
  getContext,
  setContext,
  runBatch
} = defaultManager;

// 导出类型
export * from '../types/ReactiveUITypes';

/**
 * 创建响应式状态的便捷函数
 */
export function reactive<T>(initialValue: T, options?: ReactiveStateOptions<T>): ReactiveState<T> {
  return createState(initialValue, options);
}

/**
 * 创建计算状态的便捷函数
 */
export function computed<T>(computeFn: ComputedFn<T>): ComputedState<T> {
  return createComputed(computeFn);
}

/**
 * 创建副作用的便捷函数
 */
export function effect(effectFn: EffectFn, options?: ReactiveEffectOptions): ReactiveEffect {
  return createEffect(effectFn, options);
}

/**
 * 响应式引用
 */
export function ref<T>(initialValue: T): ReactiveState<T> {
  return createState(initialValue, { name: `ref<${typeof initialValue}>` });
}

/**
 * 响应式对象
 */
export function reactiveObject<T extends object>(initialValue: T): ReactiveState<T> {
  return createState(initialValue, { equals: deepEquals, name: 'reactiveObject' });
}

/**
 * 响应式数组
 */
export function reactiveArray<T>(initialValue: T[] = []): ReactiveState<T[]> {
  return createState(initialValue, { equals: deepEquals, name: 'reactiveArray' });
}

/**
 * 防抖状态
 */
export function debouncedState<T>(initialValue: T, wait: number): ReactiveState<T> {
  return createState(initialValue, { debounce: wait, name: `debouncedState(${wait}ms)` });
}

/**
 * 节流状态
 */
export function throttledState<T>(initialValue: T, wait: number): ReactiveState<T> {
  return createState(initialValue, { throttle: wait, name: `throttledState(${wait}ms)` });
}

/**
 * 异步批处理
 */
export function asyncBatch(updates: () => void, delay: number = 0): void {
  const batchProcessor = new BatchProcessorImpl(delay);
  batchProcessor.add(updates);
  batchProcessor.flush();
}

// 兼容性导出（避免Node.js环境错误）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    ...module.exports,
    reactiveManager,
    createState,
    createComputed,
    createEffect,
    batch,
    getContext,
    setContext,
    runBatch,
    reactive,
    computed,
    effect,
    ref,
    reactiveObject,
    reactiveArray,
    debouncedState,
    throttledState,
    asyncBatch
  };
}