/**
 * @file 响应式UI类型定义
 * @description 定义响应式UI更新系统的核心接口和类型
 * @module industries/frontend-driver/types/ReactiveUITypes
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-26
 */

import { ReactNode, Dispatch, SetStateAction } from 'react';

/**
 * 响应式状态类型
 */
export interface ReactiveState<T> {
  /**
   * 当前值
   */
  value: T;
  
  /**
   * 更新函数
   */
  update: (newValue: T | ((prevValue: T) => T)) => void;
  
  /**
   * 订阅函数
   */
  subscribe: (listener: (value: T) => void) => () => void;
  
  /**
   * 获取当前值
   */
  get: () => T;
  
  /**
   * 设置值
   */
  set: (newValue: T | ((prevValue: T) => T)) => void;
}

/**
 * 响应式计算状态类型
 */
export interface ComputedState<T> {
  /**
   * 当前值
   */
  value: T;
  
  /**
   * 获取当前值
   */
  get: () => T;
  
  /**
   * 订阅函数
   */
  subscribe: (listener: (value: T) => void) => () => void;
}

/**
 * 响应式Effect类型
 */
export interface ReactiveEffect {
  /**
   * 销毁Effect
   */
  destroy: () => void;
  
  /**
   * 重新执行Effect
   */
  rerun: () => void;
}

/**
 * 响应式监听器类型
 */
export type ReactiveListener<T> = (value: T) => void;

/**
 * 响应式状态工厂函数类型
 */
export type ReactiveStateFactory<T> = () => ReactiveState<T>;

/**
 * 响应式计算函数类型
 */
export type ComputedFn<T> = () => T;

/**
 * 响应式Effect函数类型
 */
export type EffectFn = () => void | (() => void);

/**
 * 响应式依赖类型
 */
export interface ReactiveDependency {
  /**
   * 依赖ID
   */
  id: string;
  
  /**
   * 获取依赖值
   */
  getValue: () => any;
  
  /**
   * 添加订阅者
   */
  addSubscriber: (subscriber: ReactiveListener<any>) => void;
  
  /**
   * 移除订阅者
   */
  removeSubscriber: (subscriber: ReactiveListener<any>) => void;
}

/**
 * 响应式上下文类型
 */
export interface ReactiveContext {
  /**
   * 当前活跃的Effect
   */
  activeEffect: ReactiveEffect | null;
  
  /**
   * 设置当前活跃的Effect
   */
  setActiveEffect: (effect: ReactiveEffect | null) => void;
  
  /**
   * 运行Effect
   */
  runEffect: (effect: EffectFn) => ReactiveEffect;
}

/**
 * 响应式组件Props类型
 */
export interface ReactiveComponentProps<T = any> {
  /**
   * 响应式状态
   */
  state?: ReactiveState<T> | ComputedState<T>;
  
  /**
   * 子组件
   */
  children?: ReactNode;
  
  /**
   * 渲染函数
   */
  render?: (value: T) => ReactNode;
  
  /**
   * 变化回调
   */
  onChange?: (value: T) => void;
  
  /**
   * 其他属性
   */
  [key: string]: any;
}

/**
 * 响应式组件Hooks类型
 */
export interface ReactiveHooks {
  /**
   * 创建响应式状态
   */
  useReactiveState: <T>(initialValue: T) => ReactiveState<T>;
  
  /**
   * 创建计算状态
   */
  useComputedState: <T>(computeFn: ComputedFn<T>) => ComputedState<T>;
  
  /**
   * 创建Effect
   */
  useReactiveEffect: (effectFn: EffectFn, deps?: any[]) => ReactiveEffect;
  
  /**
   * 订阅响应式状态
   */
  useSubscribe: <T>(state: ReactiveState<T> | ComputedState<T>, listener: ReactiveListener<T>, options?: { immediate?: boolean }) => void;
  
  /**
   * 响应式状态到React状态的绑定
   */
  useReactiveBinding: <T>(state: ReactiveState<T>) => [T, Dispatch<SetStateAction<T>>];
}

/**
 * 响应式UI管理器类型
 */
export interface ReactiveUIManager {
  /**
   * 创建响应式状态
   */
  createState: <T>(initialValue: T) => ReactiveState<T>;
  
  /**
   * 创建计算状态
   */
  createComputed: <T>(computeFn: ComputedFn<T>) => ComputedState<T>;
  
  /**
   * 创建Effect
   */
  createEffect: (effectFn: EffectFn) => ReactiveEffect;
  
  /**
   * 批量更新
   */
  batch: (updates: () => void) => void;
  
  /**
   * 获取当前上下文
   */
  getContext: () => ReactiveContext;
  
  /**
   * 设置上下文
   */
  setContext: (context: ReactiveContext) => void;
  
  /**
   * 运行批处理
   */
  runBatch: () => void;
}

/**
 * 响应式状态选项类型
 */
export interface ReactiveStateOptions<T> {
  /**
   * 相等比较函数
   */
  equals?: (a: T, b: T) => boolean;
  
  /**
   * 延迟更新
   */
  debounce?: number;
  
  /**
   * 节流更新
   */
  throttle?: number;
  
  /**
   * 调试名称
   */
  name?: string;
  
  /**
   * 是否可跟踪
   */
  trackable?: boolean;
}

/**
 * 响应式Effect选项类型
 */
export interface ReactiveEffectOptions {
  /**
   * 是否立即执行
   */
  immediate?: boolean;
  
  /**
   * 依赖数组
   */
  deps?: any[];
  
  /**
   * 错误处理函数
   */
  onError?: (error: any) => void;
  
  /**
   * 调试名称
   */
  name?: string;
}

/**
 * 批量更新选项类型
 */
export interface BatchOptions {
  /**
   * 是否异步执行
   */
  async?: boolean;
  
  /**
   * 延迟执行时间
   */
  delay?: number;
}

/**
 * 响应式订阅选项类型
 */
export interface SubscribeOptions {
  /**
   * 是否立即执行
   */
  immediate?: boolean;
  
  /**
   * 是否只执行一次
   */
  once?: boolean;
  
  /**
   * 过滤器
   */
  filter?: (value: any) => boolean;
}

/**
 * 响应式更新事件类型
 */
export interface ReactiveUpdateEvent<T> {
  /**
   * 旧值
   */
  oldValue: T;
  
  /**
   * 新值
   */
  newValue: T;
  
  /**
   * 更新时间
   */
  timestamp: number;
  
  /**
   * 更新ID
   */
  updateId: string;
}

/**
 * 响应式状态历史记录类型
 */
export interface ReactiveHistory<T> {
  /**
   * 历史记录
   */
  records: ReactiveUpdateEvent<T>[];
  
  /**
   * 最大历史记录数
   */
  maxLength: number;
  
  /**
   * 添加历史记录
   */
  add: (event: ReactiveUpdateEvent<T>) => void;
  
  /**
   * 清空历史记录
   */
  clear: () => void;
  
  /**
   * 获取历史记录
   */
  get: () => ReactiveUpdateEvent<T>[];
  
  /**
   * 撤销
   */
  undo: () => ReactiveUpdateEvent<T> | undefined;
  
  /**
   * 重做
   */
  redo: () => ReactiveUpdateEvent<T> | undefined;
}

/**
 * 响应式批处理器类型
 */
export interface ReactiveBatchProcessor {
  /**
   * 添加更新操作
   */
  add: (updateFn: () => void) => void;
  
  /**
   * 执行批处理
   */
  flush: () => void;
  
  /**
   * 取消批处理
   */
  cancel: () => void;
  
  /**
   * 是否有等待的更新
   */
  hasPending: () => boolean;
}

/**
 * 响应式上下文提供者类型
 */
export interface ReactiveContextProviderProps {
  /**
   * 子组件
   */
  children: ReactNode;
  
  /**
   * 自定义管理器
   */
  manager?: ReactiveUIManager;
}

/**
 * 响应式组件类型
 */
export interface ReactiveComponent<T = any> {
  /**
   * 组件名称
   */
  displayName?: string;
  
  /**
   * 组件属性
   */
  propTypes?: any;
  
  /**
   * 组件默认属性
   */
  defaultProps?: Partial<ReactiveComponentProps<T>>;
}

/**
 * 响应式状态工厂选项类型
 */
export interface ReactiveStateFactoryOptions<T> extends ReactiveStateOptions<T> {
  /**
   * 初始值
   */
  initialValue: T;
}

/**
 * 响应式性能监控数据类型
 */
export interface ReactivePerformanceMetrics {
  /**
   * 更新次数
   */
  updateCount: number;
  
  /**
   * 订阅者数量
   */
  subscriberCount: number;
  
  /**
   * 平均更新时间
   */
  averageUpdateTime: number;
  
  /**
   * 最后更新时间
   */
  lastUpdateTime: number;
  
  /**
   * 首次创建时间
   */
  createdAt: number;
}

/**
 * 响应式状态配置类型
 */
export interface ReactiveConfig {
  /**
   * 是否启用开发模式
   */
  devMode?: boolean;
  
  /**
   * 是否启用性能监控
   */
  enablePerformanceTracking?: boolean;
  
  /**
   * 全局相等比较函数
   */
  equalsFn?: <T>(a: T, b: T) => boolean;
  
  /**
   * 默认批处理延迟
   */
  defaultBatchDelay?: number;
}

/**
 * 响应式工具函数类型
 */
export interface ReactiveUtils {
  /**
   * 深度比较两个值
   */
  deepEqual: <T>(a: T, b: T) => boolean;
  
  /**
   * 创建防抖函数
   */
  debounce: <T extends (...args: any[]) => any>(func: T, wait: number) => (...args: Parameters<T>) => void;
  
  /**
   * 创建节流函数
   */
  throttle: <T extends (...args: any[]) => any>(func: T, wait: number) => (...args: Parameters<T>) => void;
  
  /**
   * 生成唯一ID
   */
  generateId: () => string;
  
  /**
   * 检查是否为对象
   */
  isObject: (value: any) => boolean;
  
  /**
   * 检查是否为函数
   */
  isFunction: (value: any) => boolean;
  
  /**
   * 检查是否为数组
   */
  isArray: (value: any) => boolean;
  
  /**
   * 检查是否为响应式状态
   */
  isReactiveState: (value: any) => value is ReactiveState<any>;
  
  /**
   * 检查是否为计算状态
   */
  isComputedState: (value: any) => value is ComputedState<any>;
}