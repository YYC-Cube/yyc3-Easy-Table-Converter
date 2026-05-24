/**
 * @file 事件处理器实现
 * @description 实现事件处理和交互功能的核心逻辑
 * @module eventHandler
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 * @updated 2024-10-15
 */

import {
  EventData,
  EventListener,
  EventHandlerInterface,
  ListenerOptions,
  EventBusConfig
} from '../types/EventHandlerTypes';

/**
 * 监听器包装器，包含原始监听器和相关配置
 */
interface ListenerWrapper<T extends EventData = EventData> {
  /** 监听器ID */
  id: string;
  /** 原始监听器 */
  originalListener: EventListener<T>;
  /** 处理后的监听器 */
  wrappedListener: EventListener<T>;
  /** 监听器选项 */
  options: ListenerOptions;
  /** 调用次数 */
  callCount: number;
}

/**
 * 事件处理器实现类
 */
class EventHandler<T extends EventData = EventData> implements EventHandlerInterface<T> {
  /** 事件监听器映射 */
  private listeners: Map<string, ListenerWrapper<T>[]> = new Map();
  /** 配置信息 */
  private config: EventBusConfig;
  /** 防抖定时器映射 */
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();
  /** 节流时间戳映射 */
  private throttleTimestamps: Map<string, number> = new Map();

  /**
   * 构造函数
   * @param config 事件总线配置
   */
  constructor(config: EventBusConfig = {}) {
    this.config = {
      enableLogging: false,
      enableThrottling: true,
      enableDebouncing: true,
      defaultPriority: 0,
      ...config
    };
  }

  /**
   * 生成唯一监听器ID
   * @returns 监听器ID
   */
  private generateListenerId(): string {
    return `listener_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 应用监听器选项包装原始监听器
   * @param listener 原始监听器
   * @param options 监听器选项
   * @param eventType 事件类型
   * @param listenerId 监听器ID
   * @returns 包装后的监听器
   */
  private wrapListener(
    listener: EventListener<T>,
    options: ListenerOptions,
    eventType: string,
    listenerId: string
  ): EventListener<T> {
    let wrappedListener = listener;

    // 应用过滤器
    if (options.filter) {
      const originalListener = wrappedListener;
      wrappedListener = (event: T) => {
        if (options.filter!(event)) {
          return originalListener(event);
        }
      };
    }

    // 应用最大调用次数
    if (options.maxCalls !== undefined) {
      const originalListener = wrappedListener;
      const wrapper = this.listeners.get(eventType)?.find(w => w.id === listenerId);
      wrappedListener = (event: T) => {
        if (!wrapper || wrapper.callCount < options.maxCalls!) {
          wrapper!.callCount++;
          const result = originalListener(event);
          if (wrapper && wrapper.callCount >= options.maxCalls!) {
            this.off(eventType, listenerId);
          }
          return result;
        }
      };
    }

    // 应用防抖
    if (this.config.enableDebouncing && options.debounce && options.debounce > 0) {
      const originalListener = wrappedListener;
      const debounceKey = `${eventType}_${listenerId}`;
      wrappedListener = async (event: T) => {
        const timerId = this.debounceTimers.get(debounceKey);
        if (timerId) {
          clearTimeout(timerId);
        }
        
        return new Promise<void>((resolve) => {
          const newTimerId = setTimeout(async () => {
            this.debounceTimers.delete(debounceKey);
            await originalListener(event);
            resolve();
          }, options.debounce);
          
          this.debounceTimers.set(debounceKey, newTimerId);
        });
      };
    }

    // 应用节流
    if (this.config.enableThrottling && options.throttle && options.throttle > 0) {
      const originalListener = wrappedListener;
      const throttleKey = `${eventType}_${listenerId}`;
      wrappedListener = async (event: T) => {
        const now = Date.now();
        const lastCall = this.throttleTimestamps.get(throttleKey) || 0;
        
        if (now - lastCall >= options.throttle!) {
          this.throttleTimestamps.set(throttleKey, now);
          return originalListener(event);
        }
      };
    }

    return wrappedListener;
  }

  /**
   * 添加事件监听器
   * @param eventType 事件类型
   * @param listener 事件监听器
   * @param options 监听选项
   * @returns 监听器ID
   */
  on(eventType: string, listener: EventListener<T>, options: ListenerOptions = {}): string {
    // 确保priority有默认值，避免undefined
    const priorityValue = options.priority ?? (this.config.defaultPriority ?? 0);
    const mergedOptions = {
      priority: priorityValue,
      ...options
    };

    const listenerId = this.generateListenerId();
    const wrappedListener = this.wrapListener(listener, mergedOptions, eventType, listenerId);

    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, []);
    }

    const listeners = this.listeners.get(eventType)!;
    const listenerWrapper: ListenerWrapper<T> = {
      id: listenerId,
      originalListener: listener,
      wrappedListener,
      options: mergedOptions,
      callCount: 0
    };

    // 按优先级排序插入
    const insertIndex = listeners.findIndex(l => l.options.priority! < mergedOptions.priority);
    if (insertIndex === -1) {
      listeners.push(listenerWrapper);
    } else {
      listeners.splice(insertIndex, 0, listenerWrapper);
    }

    if (this.config.enableLogging) {
      console.log(`[EventHandler] Added listener for event: ${eventType}`);
    }

    return listenerId;
  }

  /**
   * 添加一次性事件监听器
   * @param eventType 事件类型
   * @param listener 事件监听器
   * @param options 监听选项
   * @returns 监听器ID
   */
  once(eventType: string, listener: EventListener<T>, options: ListenerOptions = {}): string {
    const mergedOptions = {
      ...options,
      maxCalls: 1
    };
    return this.on(eventType, listener, mergedOptions);
  }

  /**
   * 移除事件监听器
   * @param eventType 事件类型
   * @param listenerOrId 事件监听器或监听器ID
   */
  off(eventType: string, listenerOrId: EventListener<T> | string): void {
    const listeners = this.listeners.get(eventType);
    if (!listeners) return;

    let indexToRemove = -1;
    if (typeof listenerOrId === 'string') {
      // 根据ID移除
      indexToRemove = listeners.findIndex(l => l.id === listenerOrId);
    } else {
      // 根据监听器函数引用移除
      indexToRemove = listeners.findIndex(l => l.originalListener === listenerOrId);
    }

    if (indexToRemove !== -1) {
      const removedListener = listeners.splice(indexToRemove, 1)[0];
      
      // 清理相关的定时器
      if (removedListener.options.debounce) {
        const debounceKey = `${eventType}_${removedListener.id}`;
        const timer = this.debounceTimers.get(debounceKey);
        if (timer) {
          clearTimeout(timer);
          this.debounceTimers.delete(debounceKey);
        }
      }

      if (this.config.enableLogging) {
        console.log(`[EventHandler] Removed listener for event: ${eventType}`);
      }
    }

    // 如果没有监听器了，删除整个事件类型
    if (listeners.length === 0) {
      this.listeners.delete(eventType);
    }
  }

  /**
   * 触发事件
   * @param event 事件数据
   * @returns Promise<void>
   */
  async emit(event: T): Promise<void> {
    const eventType = event.type;
    const listeners = this.listeners.get(eventType);

    if (!listeners || listeners.length === 0) {
      if (this.config.enableLogging) {
        console.log(`[EventHandler] No listeners for event: ${eventType}`);
      }
      return;
    }

    if (this.config.enableLogging) {
      console.log(`[EventHandler] Emitting event: ${eventType}`, event);
    }

    // 确保事件有时间戳
    if (!event.timestamp) {
      event.timestamp = Date.now();
    }

    // 异步执行所有监听器
    const promises = listeners.map(listener => 
      Promise.resolve().then(() => listener.wrappedListener(event))
    );

    // 等待所有监听器执行完成
    await Promise.all(promises);
  }

  /**
   * 移除指定类型的所有事件监听器
   * @param eventType 事件类型
   */
  clear(eventType?: string): void {
    if (eventType) {
      // 清理指定事件类型的所有监听器
      const listeners = this.listeners.get(eventType);
      if (listeners) {
        // 清理所有相关的定时器
        listeners.forEach(listener => {
          if (listener.options.debounce) {
            const debounceKey = `${eventType}_${listener.id}`;
            const timer = this.debounceTimers.get(debounceKey);
            if (timer) {
              clearTimeout(timer);
              this.debounceTimers.delete(debounceKey);
            }
          }
        });

        this.listeners.delete(eventType);
        
        if (this.config.enableLogging) {
          console.log(`[EventHandler] Cleared all listeners for event: ${eventType}`);
        }
      }
    } else {
      // 清理所有事件类型的监听器
      this.debounceTimers.clear();
      this.throttleTimestamps.clear();
      this.listeners.clear();

      if (this.config.enableLogging) {
        console.log('[EventHandler] Cleared all listeners');
      }
    }
  }

  /**
   * 获取事件监听器数量
   * @param eventType 事件类型
   * @returns 监听器数量
   */
  getListenerCount(eventType?: string): number {
    if (eventType) {
      return this.listeners.get(eventType)?.length || 0;
    }
    
    // 计算所有事件类型的监听器总数
    let totalCount = 0;
    for (const listeners of this.listeners.values()) {
      totalCount += listeners.length;
    }
    return totalCount;
  }

  /**
   * 获取所有注册的事件类型
   * @returns 事件类型数组
   */
  getRegisteredEventTypes(): string[] {
    return Array.from(this.listeners.keys());
  }

  /**
   * 销毁事件处理器
   */
  destroy(): void {
    this.clear();
    this.debounceTimers.clear();
    this.throttleTimestamps.clear();
  }
}

/**
 * 创建事件处理器实例
 * @param config 事件总线配置
 * @returns 事件处理器实例
 */
export function createEventHandler<T extends EventData = EventData>(
  config: EventBusConfig = {}
): EventHandlerInterface<T> {
  return new EventHandler<T>(config);
}

/**
 * 全局事件总线实例
 */
export const globalEventHandler = createEventHandler();

export default EventHandler;
