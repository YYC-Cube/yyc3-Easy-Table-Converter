/**
 * @file 事件总线
 * @description 提供组件间通信和事件管理的事件总线实现
 * @module industries/frontend-driver/utils/EventBus
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-26
 */

/**
 * 事件处理器函数类型
 */
export type EventHandler<T = any> = (data?: T) => void;

/**
 * 事件订阅ID类型
 */
export type SubscriptionId = string;

/**
 * 事件总线接口
 */
export interface EventBusInterface {
  /**
   * 订阅事件
   * @param eventName 事件名称
   * @param handler 事件处理器
   * @returns 订阅ID
   */
  on<T = any>(eventName: string, handler: EventHandler<T>): SubscriptionId;
  
  /**
   * 订阅事件，只执行一次
   * @param eventName 事件名称
   * @param handler 事件处理器
   * @returns 订阅ID
   */
  once<T = any>(eventName: string, handler: EventHandler<T>): SubscriptionId;
  
  /**
   * 取消事件订阅
   * @param eventName 事件名称
   * @param handler 事件处理器
   */
  off(eventName: string, handler?: EventHandler): void;
  
  /**
   * 通过订阅ID取消订阅
   * @param subscriptionId 订阅ID
   */
  offById(subscriptionId: SubscriptionId): void;
  
  /**
   * 触发事件
   * @param eventName 事件名称
   * @param data 事件数据
   * @returns 是否有处理器被调用
   */
  emit<T = any>(eventName: string, data?: T): boolean;
  
  /**
   * 取消所有事件订阅
   */
  clear(): void;
  
  /**
   * 获取指定事件的订阅数量
   * @param eventName 事件名称
   * @returns 订阅数量
   */
  getListenerCount(eventName: string): number;
  
  /**
   * 获取所有事件名称
   * @returns 事件名称数组
   */
  getEventNames(): string[];
}

/**
 * 事件订阅信息接口
 */
interface SubscriptionInfo {
  id: SubscriptionId;
  handler: EventHandler;
  once: boolean;
}

/**
 * 事件总线实现类
 */
export class EventBus implements EventBusInterface {
  /**
   * 事件订阅映射表
   */
  private eventMap: Map<string, SubscriptionInfo[]>;
  
  /**
   * 订阅ID计数器
   */
  private subscriptionCounter: number;
  
  /**
   * 订阅ID映射表
   */
  private subscriptionMap: Map<SubscriptionId, { eventName: string; index: number }>;
  
  /**
   * 是否在触发事件中
   */
  private isEmitting: Set<string>;
  
  /**
   * 待移除的订阅队列
   */
  private pendingRemovals: { eventName: string; index: number }[];
  
  constructor() {
    this.eventMap = new Map();
    this.subscriptionCounter = 0;
    this.subscriptionMap = new Map();
    this.isEmitting = new Set();
    this.pendingRemovals = [];
  }
  
  /**
   * 生成订阅ID
   * @returns 唯一的订阅ID
   */
  private generateSubscriptionId(): SubscriptionId {
    return `sub_${Date.now()}_${++this.subscriptionCounter}`;
  }
  
  /**
   * 获取指定事件的订阅列表
   * @param eventName 事件名称
   * @returns 订阅信息数组
   */
  private getSubscriptions(eventName: string): SubscriptionInfo[] {
    if (!this.eventMap.has(eventName)) {
      this.eventMap.set(eventName, []);
    }
    return this.eventMap.get(eventName)!;
  }
  
  /**
   * 处理待移除的订阅
   */
  private processPendingRemovals(): void {
    if (this.pendingRemovals.length === 0) return;
    
    for (const { eventName, index } of this.pendingRemovals) {
      const subscriptions = this.getSubscriptions(eventName);
      if (index >= 0 && index < subscriptions.length) {
        const subscriptionId = subscriptions[index].id;
        subscriptions.splice(index, 1);
        this.subscriptionMap.delete(subscriptionId);
        
        // 如果事件没有订阅者了，删除事件
        if (subscriptions.length === 0) {
          this.eventMap.delete(eventName);
        }
      }
    }
    
    this.pendingRemovals = [];
  }
  
  /**
   * 订阅事件
   * @param eventName 事件名称
   * @param handler 事件处理器
   * @param once 是否只执行一次
   * @returns 订阅ID
   */
  private subscribe(eventName: string, handler: EventHandler, once: boolean = false): SubscriptionId {
    if (typeof handler !== 'function') {
      throw new TypeError('Handler must be a function');
    }
    
    const subscriptionId = this.generateSubscriptionId();
    const subscriptions = this.getSubscriptions(eventName);
    const index = subscriptions.length;
    
    subscriptions.push({
      id: subscriptionId,
      handler,
      once
    });
    
    this.subscriptionMap.set(subscriptionId, { eventName, index });
    
    return subscriptionId;
  }
  
  /**
   * 订阅事件
   * @param eventName 事件名称
   * @param handler 事件处理器
   * @returns 订阅ID
   */
  on<T = any>(eventName: string, handler: EventHandler<T>): SubscriptionId {
    return this.subscribe(eventName, handler, false);
  }
  
  /**
   * 订阅事件，只执行一次
   * @param eventName 事件名称
   * @param handler 事件处理器
   * @returns 订阅ID
   */
  once<T = any>(eventName: string, handler: EventHandler<T>): SubscriptionId {
    return this.subscribe(eventName, handler, true);
  }
  
  /**
   * 取消事件订阅
   * @param eventName 事件名称
   * @param handler 事件处理器
   */
  off(eventName: string, handler?: EventHandler): void {
    if (!this.eventMap.has(eventName)) return;
    
    const subscriptions = this.getSubscriptions(eventName);
    
    if (!handler) {
      // 取消该事件的所有订阅
      for (let i = 0; i < subscriptions.length; i++) {
        this.subscriptionMap.delete(subscriptions[i].id);
      }
      this.eventMap.delete(eventName);
    } else {
      // 取消特定处理器的订阅
      for (let i = 0; i < subscriptions.length; i++) {
        if (subscriptions[i].handler === handler) {
          this.subscriptionMap.delete(subscriptions[i].id);
          
          if (this.isEmitting.has(eventName)) {
            // 如果正在触发事件，将移除操作加入队列
            this.pendingRemovals.push({ eventName, index: i });
            // 标记为null以便跳过
            subscriptions[i] = null as any;
          } else {
            subscriptions.splice(i, 1);
            i--; // 调整索引
          }
        }
      }
      
      // 如果没有订阅者了，删除事件
      if (subscriptions.length === 0) {
        this.eventMap.delete(eventName);
      }
    }
  }
  
  /**
   * 通过订阅ID取消订阅
   * @param subscriptionId 订阅ID
   */
  offById(subscriptionId: SubscriptionId): void {
    const subscriptionInfo = this.subscriptionMap.get(subscriptionId);
    if (!subscriptionInfo) return;
    
    const { eventName } = subscriptionInfo;
    if (!this.eventMap.has(eventName)) return;
    
    const subscriptions = this.getSubscriptions(eventName);
    
    // 查找对应的订阅
    for (let i = 0; i < subscriptions.length; i++) {
      if (subscriptions[i].id === subscriptionId) {
        this.subscriptionMap.delete(subscriptionId);
        
        if (this.isEmitting.has(eventName)) {
          // 如果正在触发事件，将移除操作加入队列
          this.pendingRemovals.push({ eventName, index: i });
          // 标记为null以便跳过
          subscriptions[i] = null as any;
        } else {
          subscriptions.splice(i, 1);
        }
        break;
      }
    }
    
    // 如果没有订阅者了，删除事件
    if (subscriptions.length === 0) {
      this.eventMap.delete(eventName);
    }
  }
  
  /**
   * 触发事件
   * @param eventName 事件名称
   * @param data 事件数据
   * @returns 是否有处理器被调用
   */
  emit<T = any>(eventName: string, data?: T): boolean {
    if (!this.eventMap.has(eventName)) return false;
    
    const subscriptions = this.getSubscriptions(eventName);
    let hasListeners = false;
    
    // 标记开始触发事件
    this.isEmitting.add(eventName);
    
    try {
      // 触发所有处理器
      for (let i = 0; i < subscriptions.length; i++) {
        const subscription = subscriptions[i];
        
        // 跳过已标记为移除的订阅
        if (!subscription) continue;
        
        hasListeners = true;
        
        try {
          subscription.handler(data);
          
          // 如果是一次性订阅，标记为移除
          if (subscription.once) {
            this.subscriptionMap.delete(subscription.id);
            this.pendingRemovals.push({ eventName, index: i });
            subscriptions[i] = null as any;
          }
        } catch (error) {
          console.error(`Error in event handler for '${eventName}':`, error);
        }
      }
    } finally {
      // 标记结束触发事件
      this.isEmitting.delete(eventName);
      
      // 处理待移除的订阅
      this.processPendingRemovals();
      
      // 清理null项
      const cleanedSubscriptions = subscriptions.filter(sub => sub !== null);
      if (cleanedSubscriptions.length !== subscriptions.length) {
        if (cleanedSubscriptions.length === 0) {
          this.eventMap.delete(eventName);
        } else {
          this.eventMap.set(eventName, cleanedSubscriptions);
          // 更新订阅索引映射
          this.updateSubscriptionIndices(eventName, cleanedSubscriptions);
        }
      }
    }
    
    return hasListeners;
  }
  
  /**
   * 更新订阅索引映射
   * @param eventName 事件名称
   * @param subscriptions 订阅列表
   */
  private updateSubscriptionIndices(eventName: string, subscriptions: SubscriptionInfo[]): void {
    for (let i = 0; i < subscriptions.length; i++) {
      this.subscriptionMap.set(subscriptions[i].id, { eventName, index: i });
    }
  }
  
  /**
   * 取消所有事件订阅
   */
  clear(): void {
    this.eventMap.clear();
    this.subscriptionMap.clear();
    this.pendingRemovals = [];
  }
  
  /**
   * 获取指定事件的订阅数量
   * @param eventName 事件名称
   * @returns 订阅数量
   */
  getListenerCount(eventName: string): number {
    if (!this.eventMap.has(eventName)) return 0;
    return this.getSubscriptions(eventName).filter(sub => sub !== null).length;
  }
  
  /**
   * 获取所有事件名称
   * @returns 事件名称数组
   */
  getEventNames(): string[] {
    return Array.from(this.eventMap.keys());
  }
}

/**
 * 全局事件总线实例
 */
export const eventBus = new EventBus();

/**
 * React Hook：使用事件总线
 * @param eventName 事件名称
 * @param handler 事件处理器
 * @param options 选项配置
 */
export function useEventBus<T = any>(
  eventName: string,
  handler: EventHandler<T>,
  options: { once?: boolean; deps?: any[] } = {}
): void {
  const { once = false, deps = [] } = options;
  
  React.useEffect(() => {
    const subscriptionMethod = once ? eventBus.once.bind(eventBus) : eventBus.on.bind(eventBus);
    const subscriptionId = subscriptionMethod(eventName, handler);
    
    // 清理函数
    return () => {
      eventBus.offById(subscriptionId);
    };
  }, [eventName, handler, once, ...deps]);
}

/**
 * React Hook：使用事件总线（返回emit函数）
 * @returns emit函数
 */
export function useEventEmitter(): <T = any>(eventName: string, data?: T) => boolean {
  return React.useCallback((eventName: string, data?: any) => {
    return eventBus.emit(eventName, data);
  }, []);
}

// 避免在Node.js环境中引用React
let React: any;
try {
  React = require('react');
} catch (error) {
  // 非浏览器环境，提供空的Hook实现
  (global as any).useEventBus = () => {};
  (global as any).useEventEmitter = () => () => false;
}
