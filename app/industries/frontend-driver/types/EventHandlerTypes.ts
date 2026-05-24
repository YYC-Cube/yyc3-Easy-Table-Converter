/**
 * @file 事件处理器类型定义
 * @description 定义事件处理和交互功能的核心接口和类型
 * @module eventHandler
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 * @updated 2024-10-15
 */

/**
 * 事件数据接口
 */
export interface EventData {
  /** 事件类型 */
  type: string;
  /** 事件源 */
  source?: any;
  /** 事件时间戳 */
  timestamp: number;
  /** 其他事件数据 */
  [key: string]: any;
}

/**
 * 事件监听器函数类型
 */
export type EventListener<T extends EventData = EventData> = (
  event: T
) => void | Promise<void>;

/**
 * 事件过滤器函数类型
 */
export type EventFilter<T extends EventData = EventData> = (
  event: T
) => boolean;

/**
 * 事件处理器接口
 */
export interface EventHandlerInterface<T extends EventData = EventData> {
  /**
   * 添加事件监听器
   * @param eventType 事件类型
   * @param listener 事件监听器
   * @param options 监听选项
   * @returns 监听器ID
   */
  on(eventType: string, listener: EventListener<T>, options?: ListenerOptions): string;

  /**
   * 添加一次性事件监听器
   * @param eventType 事件类型
   * @param listener 事件监听器
   * @param options 监听选项
   * @returns 监听器ID
   */
  once(eventType: string, listener: EventListener<T>, options?: ListenerOptions): string;

  /**
   * 移除事件监听器
   * @param eventType 事件类型
   * @param listenerOrId 事件监听器或监听器ID
   */
  off(eventType: string, listenerOrId: EventListener<T> | string): void;

  /**
   * 触发事件
   * @param event 事件数据
   * @returns Promise<void>
   */
  emit(event: T): Promise<void>;

  /**
   * 移除指定类型的所有事件监听器
   * @param eventType 事件类型
   */
  clear(eventType?: string): void;

  /**
   * 获取事件监听器数量
   * @param eventType 事件类型
   * @returns 监听器数量
   */
  getListenerCount(eventType?: string): number;

  /**
   * 销毁事件处理器，清理所有资源
   */
  destroy(): void;
}

/**
 * 监听器选项
 */
export interface ListenerOptions {
  /** 优先级，数字越大优先级越高 */
  priority?: number;
  /** 防抖延迟时间（毫秒） */
  debounce?: number;
  /** 节流延迟时间（毫秒） */
  throttle?: number;
  /** 事件过滤器 */
  filter?: EventFilter;
  /** 最大调用次数 */
  maxCalls?: number;
}

/**
 * 交互状态接口
 */
export interface InteractionState {
  /** 是否处于交互中 */
  isInteracting: boolean;
  /** 当前交互类型 */
  interactionType?: string;
  /** 交互开始时间 */
  startTime?: number;
  /** 交互结束时间 */
  endTime?: number;
  /** 交互数据 */
  data?: any;
}

/**
 * 手势事件数据接口
 */
export interface GestureEventData extends EventData {
  type: 'tap' | 'doubleTap' | 'press' | 'swipe' | 'pinch' | 'rotate' | 'pan';
  /** 触摸点信息 */
  touches: TouchInfo[];
  /** 手势位置 */
  position: { x: number; y: number };
  /** 手势方向 */
  direction?: 'up' | 'down' | 'left' | 'right';
  /** 手势距离 */
  distance?: number;
  /** 手势角度 */
  angle?: number;
}

/**
 * 触摸点信息接口
 */
export interface TouchInfo {
  id: number;
  x: number;
  y: number;
  startTime: number;
  endTime?: number;
}

/**
 * 键盘事件数据接口
 */
export interface KeyboardEventData extends EventData {
  type: 'keyDown' | 'keyUp' | 'keyPress';
  key: string;
  code: string;
  altKey: boolean;
  ctrlKey: boolean;
  metaKey: boolean;
  shiftKey: boolean;
  repeat: boolean;
}

/**
 * 拖拽事件数据接口
 */
export interface DragEventData extends EventData {
  type: 'dragStart' | 'dragMove' | 'dragEnd' | 'dragEnter' | 'dragLeave' | 'drop';
  source: any;
  target?: any;
  position: { x: number; y: number };
  delta: { x: number; y: number };
  data?: any;
}

/**
 * 动画事件数据接口
 */
export interface AnimationEventData extends EventData {
  type: 'animationStart' | 'animationUpdate' | 'animationEnd' | 'animationCancel';
  animationId: string;
  progress: number;
  duration: number;
  currentTime: number;
  data?: any;
}

/**
 * 事件总线配置接口
 */
export interface EventBusConfig {
  /** 是否启用事件日志 */
  enableLogging?: boolean;
  /** 是否启用事件节流 */
  enableThrottling?: boolean;
  /** 是否启用事件防抖 */
  enableDebouncing?: boolean;
  /** 全局默认优先级 */
  defaultPriority?: number;
}

/**
 * 交互配置接口
 */
export interface InteractionConfig {
  /** 双击间隔时间（毫秒） */
  doubleTapDelay?: number;
  /** 长按时间（毫秒） */
  longPressDelay?: number;
  /** 滑动最小距离 */
  swipeMinDistance?: number;
  /** 拖拽阈值 */
  dragThreshold?: number;
  /** 是否启用触摸反馈 */
  enableTouchFeedback?: boolean;
}
