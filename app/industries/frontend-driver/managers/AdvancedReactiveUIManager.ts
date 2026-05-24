/**
 * @file 高级响应式UI管理器
 * @description 提供高级响应式UI功能和性能优化
 * @module industries/frontend-driver/managers/AdvancedReactiveUIManager
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-26
 */

/**
   * 响应式状态配置选项
   */
  // 工具类型定义
  type EffectCleanup = () => void;
  type BatchCallback = () => void;
  
  // ReactionOptions接口定义
  interface ReactionOptions<T> {
    equals?: (a: T, b: T) => boolean;
    lazy?: boolean;
    id?: string;
  }
  
  // ComputedOptions接口定义
  interface ComputedOptions<T> {
    equals?: (a: T, b: T) => boolean;
    cache?: boolean;
    cacheTime?: number;
    cacheKey?: string;
    id?: string;
  }

import {
  ReactiveState,
  ComputedState,
  ReactiveEffect
} from '../types/ReactiveUITypes';
import {
  batch,
  batchManager,
  debounce,
  throttle,
  deepEquals,
  ComputedCache
} from '../utils/ReactiveUtils';

/**
 * 高级响应式状态实现
 */
export class AdvancedReactiveState<T> implements ReactiveState<T> {
  private _value: T;
  private _listeners = new Set<(value: T, oldValue?: T) => void>();
  private _options: ReactionOptions<T>;
  private _isUpdating = false;
  private _version = 0;
  private _pendingUpdates: T[] = [];

  /**
   * 构造函数
   * @param initialValue 初始值
   * @param options 配置选项
   */
  constructor(initialValue: T, options: ReactionOptions<T> = {}) {
    this._value = initialValue;
    this._options = {
      equals: deepEquals,
      lazy: false,
      ...options
    };
  }

  /**
   * 获取当前值
   */
  get value(): T {
    return this._value;
  }

  /**
   * 设置新值
   */
  set(newValue: T | ((prevValue: T) => T)): void {
    const value = typeof newValue === 'function' ? (newValue as Function)(this._value) : newValue;
    this._set(value);
  }

  /**
   * 使用函数更新值
   */
  update(newValue: T | ((prevValue: T) => T)): void {
    const value = typeof newValue === 'function' ? (newValue as Function)(this._value) : newValue;
    this._set(value);
  }

  /**
   * 获取当前值
   */
  get(): T {
    return this._value;
  }

  /**
   * 批量更新值
   */
  batchUpdate(callback: (state: ReactiveState<T>) => void): void {
    batch(() => {
      callback(this);
    });
  }

  /**
   * 订阅值变化
   */
  subscribe(listener: (value: T, oldValue?: T) => void): () => void {
    this._listeners.add(listener);
    
    // 如果不是懒模式，立即通知当前值
    if (!this._options.lazy) {
      listener(this._value);
    }
    
    // 返回取消订阅函数
    return () => {
      this._listeners.delete(listener);
    };
  }

  /**
   * 监听值变化（一次性）
   */
  once(listener: (value: T, oldValue?: T) => void): () => void {
    const onceListener = (value: T, oldValue?: T) => {
      listener(value, oldValue);
      unsubscribe();
    };
    
    const unsubscribe = this.subscribe(onceListener);
    return unsubscribe;
  }

  /**
   * 清空所有监听器
   */
  clearListeners(): void {
    this._listeners.clear();
  }

  /**
   * 获取监听器数量
   */
  get listenerCount(): number {
    return this._listeners.size;
  }

  /**
   * 获取版本号
   */
  get version(): number {
    return this._version;
  }

  /**
   * 触发值变化通知
   */
  private _notify(oldValue?: T): void {
    this._listeners.forEach(listener => {
      try {
        listener(this._value, oldValue);
      } catch (error) {
        console.error('响应式状态监听器错误:', error);
      }
    });
  }

  /**
   * 设置值的内部实现
   */
  private _set(value: T): void {
    // 检查是否需要更新
    if (this._options.equals && this._options.equals(this._value, value)) {
      return;
    }

    // 如果正在暂停更新，将更新添加到待处理列表
    if (this._isUpdating) {
      this._pendingUpdates.push(value);
      return;
    }

    const oldValue = this._value;
    this._value = value;
    this._version++;

    // 使用批量更新管理器触发通知
    batchManager.triggerUpdate(() => {
      this._notify(oldValue);
    });
  }

  /**
   * 延迟设置值
   */
  delay(ms: number, value: T | ((current: T) => T)): void {
    setTimeout(() => {
      const newValue = typeof value === 'function' ? (value as Function)(this._value) : value;
      this._set(newValue);
    }, ms);
  }

  /**
   * 防抖更新
   */
  debounceUpdate(ms: number): (value: T | ((current: T) => T)) => void {
    const debouncedFn = debounce((value: T) => {
      this._set(value);
    }, ms);

    return (value: T | ((current: T) => T)) => {
      const newValue = typeof value === 'function' ? (value as Function)(this._value) : value;
      debouncedFn(newValue);
    };
  }

  /**
   * 节流更新
   */
  throttleUpdate(ms: number): (value: T | ((current: T) => T)) => void {
    const throttledFn = throttle((value: T) => {
      this._set(value);
    }, ms);

    return (value: T | ((current: T) => T)) => {
      const newValue = typeof value === 'function' ? (value as Function)(this._value) : value;
      throttledFn(newValue);
    };
  }

  /**
   * 暂停通知
   */
  pause(): void {
    this._isUpdating = true;
  }

  /**
   * 恢复通知并应用挂起的更新
   */
  resume(): void {
    this._isUpdating = false;
    
    if (this._pendingUpdates.length > 0) {
      const lastUpdate = this._pendingUpdates[this._pendingUpdates.length - 1];
      this._pendingUpdates = [];
      this._set(lastUpdate);
    }
  }
}

/**
 * 高级计算状态实现
 */
export class AdvancedComputedState<T> implements ComputedState<T> {
  private _computeFn: () => T;
  private _listeners = new Set<(value: T) => void>();
  private _options: ComputedOptions<T>;
  private _value: T | undefined;
  private _dependencies = new Set<ReactiveState<any>>();
  private _dependents = new Set<AdvancedComputedState<any>>();
  private _isComputing = false;
  private _isStale = true;
  private _cache?: ComputedCache;
  private _version = 0;

  /**
   * 构造函数
   * @param computeFn 计算函数
   * @param options 配置选项
   */
  constructor(computeFn: () => T, options: ComputedOptions<T> = {}) {
    this._computeFn = computeFn;
    this._options = {
      equals: deepEquals,
      cache: false,
      ...options
    };

    // 如果启用缓存，创建缓存实例
    if (this._options.cache) {
      this._cache = new ComputedCache(this._options.cacheTime);
    }
  }

  /**
   * 获取计算值
   */
  get value(): T {
    if (this._isStale) {
      this._computeValue();
    }
    return this._value!;
  }

  /**
   * 获取当前值（符合接口要求）
   */
  get(): T {
    return this.value;
  }

  /**
   * 订阅值变化
   */
  subscribe(listener: (value: T) => void): () => void {
    this._listeners.add(listener);
    
    // 立即通知当前值
    listener(this.value);
    
    // 返回取消订阅函数
    return () => {
      this._listeners.delete(listener);
    };
  }

  /**
   * 添加依赖项
   */
  addDependency(state: ReactiveState<any>): void {
    if (!this._dependencies.has(state)) {
      this._dependencies.add(state);
      state.subscribe(() => this.invalidate());
    }
  }

  /**
   * 添加依赖于此计算状态的其他计算状态
   */
  addDependent(dependent: AdvancedComputedState<any>): void {
    this._dependents.add(dependent);
  }

  /**
   * 使值失效，需要重新计算
   */
  invalidate(): void {
    if (!this._isStale) {
      this._isStale = true;
      
      // 通知所有依赖项
      this._dependents.forEach(dependent => dependent.invalidate());
      
      // 延迟计算和通知
      batchManager.triggerUpdate(() => {
        const oldValue = this._value;
        this._computeValue();
        
        // 如果值发生变化，通知监听器
        if (oldValue !== undefined && this._value !== undefined &&
            (!this._options.equals || !this._options.equals(oldValue, this._value))) {
          this._notify();
        }
      });
    }
  }

  /**
   * 强制重新计算值
   */
  recompute(): void {
    this._isStale = true;
    this._computeValue();
  }

  /**
   * 计算值
   */
  private _computeValue(): void {
    if (this._isComputing) {
      throw new Error('检测到循环依赖');
    }

    try {
      this._isComputing = true;
      
      // 尝试从缓存获取
      if (this._cache) {
        const cacheKey = this._options.cacheKey || this._computeFn.toString();
        const cachedValue = this._cache.get(cacheKey);
        
        if (cachedValue !== null) {
          this._value = cachedValue;
          this._isStale = false;
          return;
        }
      }

      // 计算新值
      const newValue = this._computeFn();
      
      // 更新值并标记为有效
      this._value = newValue;
      this._isStale = false;
      this._version++;

      // 缓存结果
      if (this._cache) {
        const cacheKey = this._options.cacheKey || this._computeFn.toString();
        this._cache.set(cacheKey, newValue);
      }
    } catch (error) {
      console.error('计算状态错误:', error);
      throw error;
    } finally {
      this._isComputing = false;
    }
  }

  /**
   * 通知所有监听器
   */
  private _notify(): void {
    this._listeners.forEach(listener => {
      try {
        listener(this._value!);
      } catch (error) {
        console.error('计算状态监听器错误:', error);
      }
    });
  }

  /**
   * 获取计算状态的版本号
   */
  get version(): number {
    return this._version;
  }

  /**
   * 检查是否需要重新计算
   */
  get isStale(): boolean {
    return this._isStale;
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    if (this._cache) {
      this._cache.clear();
    }
  }
}

/**
 * 高级响应式副作用实现
 */
export class AdvancedReactiveEffect implements ReactiveEffect {
  private _effectFn: () => EffectCleanup | void;
  private _options: { lazy?: boolean; scheduler?: () => void };
  private _cleanupFn?: () => void;
  private _isRunning = false;
  private _isCleaned = false;
  private _dependencies = new Set<ReactiveState<any>>();

  /**
   * 构造函数
   * @param effectFn 副作用函数
   * @param options 配置选项
   */
  constructor(
    effectFn: () => EffectCleanup | void,
    options: { lazy?: boolean; scheduler?: () => void } = {}
  ) {
    this._effectFn = effectFn;
    this._options = options;

    // 如果不是懒模式，立即执行
    if (!this._options.lazy) {
      this.run();
    }
  }

  /**
   * 执行副作用
   */
  run(): void {
    if (this._isRunning) return;

    try {
      this._isRunning = true;
      
      // 清理之前的副作用
      this.cleanup();

      // 执行副作用函数
      const cleanup = this._effectFn();
      
      // 保存清理函数
      if (typeof cleanup === 'function') {
        this._cleanupFn = cleanup;
      }

      this._isCleaned = false;
    } catch (error) {
      console.error('响应式副作用错误:', error);
    } finally {
      this._isRunning = false;
    }
  }

  /**
   * 清理副作用
   */
  cleanup(): void {
    if (this._cleanupFn && !this._isCleaned) {
      try {
        this._cleanupFn();
      } catch (error) {
        console.error('副作用清理错误:', error);
      } finally {
        this._isCleaned = true;
      }
    }
  }

  /**
   * 添加依赖项
   */
  addDependency(state: ReactiveState<any>): void {
    this._dependencies.add(state);
  }

  /**
   * 重新执行副作用
   */
  reRun(): void {
    if (this._options.scheduler) {
      this._options.scheduler();
    } else {
      this.run();
    }
  }

  /**
   * 重新执行副作用（满足ReactiveEffect接口）
   */
  rerun(): void {
    this.reRun();
  }

  /**
   * 销毁副作用
   */
  destroy(): void {
    this.cleanup();
    this._dependencies.clear();
  }

  /**
   * 获取依赖项数量
   */
  get dependencyCount(): number {
    return this._dependencies.size;
  }
}

/**
 * 高级响应式UI管理器
 */
export class AdvancedReactiveUIManager {
  private static _instance: AdvancedReactiveUIManager;
  private _computedStates = new Map<string, ComputedState<any>>();
  private _reactiveStates = new Map<string, ReactiveState<any>>();
  private _effects = new Set<ReactiveEffect>();

  /**
   * 获取单例实例
   */
  static get instance(): AdvancedReactiveUIManager {
    if (!this._instance) {
      this._instance = new AdvancedReactiveUIManager();
    }
    return this._instance;
  }

  /**
   * 创建响应式状态
   */
  createState<T>(initialValue: T, options?: ReactionOptions<T>): ReactiveState<T> {
    const state = new AdvancedReactiveState(initialValue, options);
    
    // 可选的ID跟踪
    if (options?.id) {
      this._reactiveStates.set(options.id, state);
    }
    
    return state;
  }

  /**
   * 创建计算状态
   */
  createComputed<T>(computeFn: () => T, options?: ComputedOptions<T>): ComputedState<T> {
    const computed = new AdvancedComputedState(computeFn, options);
    
    // 可选的ID跟踪
    if (options?.id) {
      this._computedStates.set(options.id, computed);
    }
    
    return computed;
  }

  /**
   * 创建响应式副作用
   */
  createEffect(effectFn: () => EffectCleanup | void, options?: { lazy?: boolean; scheduler?: () => void }): ReactiveEffect {
    const effect = new AdvancedReactiveEffect(effectFn, options);
    this._effects.add(effect);
    
    return effect;
  }

  /**
   * 获取响应式状态
   */
  getState<T>(id: string): ReactiveState<T> | undefined {
    return this._reactiveStates.get(id);
  }

  /**
   * 获取计算状态
   */
  getComputed<T>(id: string): ComputedState<T> | undefined {
    return this._computedStates.get(id);
  }

  /**
   * 批量执行更新
   */
  batchUpdate(callback: BatchCallback): void {
    batch(callback);
  }

  /**
   * 清理所有副作用
   */
  cleanup(): void {
    this._effects.forEach(effect => {
      if ('destroy' in effect) {
        effect.destroy();
      }
    });
    
    this._effects.clear();
  }

  /**
   * 获取管理器统计信息
   */
  get stats(): {
    reactiveStates: number;
    computedStates: number;
    effects: number;
  } {
    return {
      reactiveStates: this._reactiveStates.size,
      computedStates: this._computedStates.size,
      effects: this._effects.size
    };
  }

  /**
   * 监听多个状态的变化
   */
  watchStates<T extends any[]>(
    states: Array<ReactiveState<any> | ComputedState<any>>,
    handler: (values: T) => void
  ): () => void {
    const unsubscribes = states.map(state => 
      state.subscribe(() => {
        const values = states.map(s => s.value) as T;
        handler(values);
      })
    );

    return () => {
      unsubscribes.forEach(unsubscribe => unsubscribe());
    };
  }

  /**
   * 创建派生状态
   */
  deriveState<T>(
    dependencies: Array<ReactiveState<any> | ComputedState<any>>,
    computeFn: (...values: any[]) => T,
    options?: ReactionOptions<T>
  ): ReactiveState<T> {
    // 获取初始依赖值
    const initialValues = dependencies.map(dep => dep.value);
    const initialValue = computeFn(...initialValues);
    
    // 创建派生状态
    const derivedState = this.createState(initialValue, options);
    
    // 监听依赖变化
    this.watchStates(dependencies, (values) => {
      const newValue = computeFn(...values);
      derivedState.set(newValue);
    });
    
    return derivedState;
  }
}

// 导出便捷的工厂函数
export function createState<T>(initialValue: T, options?: ReactionOptions<T>): ReactiveState<T> {
  return AdvancedReactiveUIManager.instance.createState(initialValue, options);
}

export function createComputed<T>(computeFn: () => T, options?: ComputedOptions<T>): ComputedState<T> {
  return AdvancedReactiveUIManager.instance.createComputed(computeFn, options);
}

export function createEffect(effectFn: () => EffectCleanup | void, options?: { lazy?: boolean; scheduler?: () => void }): ReactiveEffect {
  return AdvancedReactiveUIManager.instance.createEffect(effectFn, options);
}

export function batchUpdate(callback: BatchCallback): void {
  AdvancedReactiveUIManager.instance.batchUpdate(callback);
}