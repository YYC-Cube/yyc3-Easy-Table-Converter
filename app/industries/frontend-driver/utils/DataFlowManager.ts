/**
 * @file 数据流管理器
 * @description 提供应用状态管理和数据流控制的核心功能
 * @module industries/frontend-driver/utils/DataFlowManager
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-26
 */

import { EventBus, eventBus } from './EventBus';

/**
 * 数据流操作类型
 */
export enum DataFlowOperation {
  SET = 'SET',
  UPDATE = 'UPDATE',
  MERGE = 'MERGE',
  DELETE = 'DELETE',
  CLEAR = 'CLEAR'
}

/**
 * 数据流操作接口
 */
export interface DataFlowAction<T = any> {
  /**
   * 操作类型
   */
  type: DataFlowOperation;
  
  /**
   * 数据路径
   */
  path: string;
  
  /**
   * 数据值
   */
  value?: T;
  
  /**
   * 操作ID
   */
  id?: string;
  
  /**
   * 操作时间戳
   */
  timestamp?: number;
}

/**
 * 数据流监听器函数类型
 */
export type DataFlowListener<T = any> = (action: DataFlowAction<T>, oldValue: T | undefined, newValue: T | undefined) => void;

/**
 * 数据路径选项接口
 */
export interface PathOptions {
  /**
   * 分隔符
   */
  separator?: string;
  
  /**
   * 是否严格模式
   */
  strict?: boolean;
}

/**
 * 数据流管理器配置接口
 */
export interface DataFlowManagerConfig {
  /**
   * 初始数据
   */
  initialData?: any;
  
  /**
   * 路径配置
   */
  pathOptions?: PathOptions;
  
  /**
   * 是否启用历史记录
   */
  enableHistory?: boolean;
  
  /**
   * 历史记录最大长度
   */
  maxHistoryLength?: number;
  
  /**
   * 事件总线实例
   */
  eventBus?: EventBus;
}

/**
 * 数据流历史记录接口
 */
export interface DataFlowHistory {
  action: DataFlowAction;
  oldValue: any;
  timestamp: number;
}

/**
 * 数据流管理器接口
 */
export interface DataFlowManagerInterface {
  /**
   * 获取数据
   * @param path 数据路径
   * @returns 数据值
   */
  get<T = any>(path?: string): T;
  
  /**
   * 设置数据
   * @param path 数据路径
   * @param value 数据值
   * @returns 操作ID
   */
  set<T = any>(path: string, value: T): string;
  
  /**
   * 更新数据
   * @param path 数据路径
   * @param value 数据值
   * @returns 操作ID
   */
  update<T = any>(path: string, value: T): string;
  
  /**
   * 合并数据
   * @param path 数据路径
   * @param value 数据值
   * @returns 操作ID
   */
  merge<T = any>(path: string, value: T): string;
  
  /**
   * 删除数据
   * @param path 数据路径
   * @returns 操作ID
   */
  delete(path: string): string;
  
  /**
   * 清空数据
   * @returns 操作ID
   */
  clear(): string;
  
  /**
   * 执行操作
   * @param action 操作对象
   * @returns 操作ID
   */
  dispatch<T = any>(action: DataFlowAction<T>): string;
  
  /**
   * 监听数据变化
   * @param path 数据路径
   * @param listener 监听器函数
   * @returns 取消监听函数
   */
  subscribe<T = any>(path: string | string[], listener: DataFlowListener<T>): () => void;
  
  /**
   * 获取所有监听路径
   * @returns 监听路径数组
   */
  getListenerPaths(): string[];
  
  /**
   * 获取数据快照
   * @returns 数据快照
   */
  getSnapshot(): any;
  
  /**
   * 重置数据
   * @param data 重置数据
   */
  reset(data?: any): void;
  
  /**
   * 撤销上一步操作
   * @returns 是否撤销成功
   */
  undo(): boolean;
  
  /**
   * 重做下一步操作
   * @returns 是否重做成功
   */
  redo(): boolean;
  
  /**
   * 清空历史记录
   */
  clearHistory(): void;
  
  /**
   * 获取历史记录
   * @returns 历史记录数组
   */
  getHistory(): DataFlowHistory[];
}

/**
 * 数据路径解析器类
 */
export class PathResolver {
  /**
   * 解析数据路径
   * @param path 数据路径
   * @param options 路径选项
   * @returns 路径段数组
   */
  static parsePath(path: string, options: PathOptions = {}): string[] {
    const { separator = '.', strict = false } = options;
    
    if (!path || path.trim() === '') {
      return [];
    }
    
    const segments = path.split(separator);
    
    if (strict) {
      segments.forEach(segment => {
        if (!segment || segment.trim() === '') {
          throw new Error(`Invalid path segment: '${segment}'`);
        }
      });
    }
    
    return segments.filter(segment => segment && segment.trim() !== '');
  }
  
  /**
   * 构建数据路径
   * @param segments 路径段数组
   * @param options 路径选项
   * @returns 数据路径
   */
  static buildPath(segments: string[], options: PathOptions = {}): string {
    const { separator = '.' } = options;
    return segments.join(separator);
  }
  
  /**
   * 获取对象中的数据
   * @param obj 对象
   * @param path 数据路径
   * @param options 路径选项
   * @returns 数据值
   */
  static get(obj: any, path: string | string[], options: PathOptions = {}): any {
    const segments = Array.isArray(path) ? path : this.parsePath(path, options);
    
    if (segments.length === 0) {
      return obj;
    }
    
    let current: any = obj;
    
    for (const segment of segments) {
      if (current === null || current === undefined) {
        return undefined;
      }
      
      current = current[segment];
    }
    
    return current;
  }
  
  /**
   * 设置对象中的数据
   * @param obj 对象
   * @param path 数据路径
   * @param value 数据值
   * @param options 路径选项
   * @returns 更新后的对象
   */
  static set(obj: any, path: string | string[], value: any, options: PathOptions = {}): any {
    const segments = Array.isArray(path) ? path : this.parsePath(path, options);
    
    if (segments.length === 0) {
      return value;
    }
    
    // 创建深拷贝
    const newObj = Array.isArray(obj) ? [...obj] : { ...obj };
    
    let current: any = newObj;
    
    for (let i = 0; i < segments.length - 1; i++) {
      const segment = segments[i];
      const nextSegment = segments[i + 1];
      
      // 确定下一层的数据类型
      const nextIsArrayIndex = !isNaN(parseInt(nextSegment, 10)) && nextSegment === parseInt(nextSegment, 10).toString();
      
      if (current[segment] === null || current[segment] === undefined) {
        current[segment] = nextIsArrayIndex ? [] : {};
      } else if (Array.isArray(current[segment]) !== nextIsArrayIndex) {
        // 如果类型不匹配，转换类型
        current[segment] = nextIsArrayIndex ? [] : { ...current[segment] };
      } else if (typeof current[segment] === 'object') {
        // 创建浅拷贝
        current[segment] = Array.isArray(current[segment]) ? [...current[segment]] : { ...current[segment] };
      }
      
      current = current[segment];
    }
    
    // 设置最终值
    const lastSegment = segments[segments.length - 1];
    current[lastSegment] = value;
    
    return newObj;
  }
  
  /**
   * 删除对象中的数据
   * @param obj 对象
   * @param path 数据路径
   * @param options 路径选项
   * @returns 更新后的对象
   */
  static delete(obj: any, path: string | string[], options: PathOptions = {}): any {
    const segments = Array.isArray(path) ? path : this.parsePath(path, options);
    
    if (segments.length === 0) {
      return {};
    }
    
    // 创建深拷贝
    const newObj = Array.isArray(obj) ? [...obj] : { ...obj };
    
    let current: any = newObj;
    let parent: any = null;
    let parentSegment: string | undefined;
    
    for (const segment of segments) {
      if (current === null || current === undefined) {
        return newObj;
      }
      
      parent = current;
      parentSegment = segment;
      current = current[segment];
    }
    
    if (parent !== null && parentSegment !== undefined) {
      if (Array.isArray(parent)) {
        parent.splice(parseInt(parentSegment, 10), 1);
      } else {
        delete parent[parentSegment];
      }
    }
    
    return newObj;
  }
  
  /**
   * 合并对象中的数据
   * @param obj 对象
   * @param path 数据路径
   * @param value 合并值
   * @param options 路径选项
   * @returns 更新后的对象
   */
  static merge(obj: any, path: string | string[], value: any, options: PathOptions = {}): any {
    const segments = Array.isArray(path) ? path : this.parsePath(path, options);
    const targetValue = this.get(obj, segments, options);
    
    // 如果目标值不存在或不是对象，直接设置
    if (targetValue === null || targetValue === undefined || typeof targetValue !== 'object') {
      return this.set(obj, segments, value, options);
    }
    
    // 合并对象
    const mergedValue = Array.isArray(targetValue) ? [...targetValue] : { ...targetValue };
    
    if (typeof value === 'object' && value !== null) {
      if (Array.isArray(value) && Array.isArray(mergedValue)) {
        // 数组合并
        value.forEach((item, index) => {
          if (index < mergedValue.length) {
            if (typeof item === 'object' && item !== null && typeof mergedValue[index] === 'object' && mergedValue[index] !== null) {
              // 递归合并嵌套对象
              mergedValue[index] = Array.isArray(item) ? [...mergedValue[index], ...item] : { ...mergedValue[index], ...item };
            } else {
              mergedValue[index] = item;
            }
          } else {
            mergedValue.push(item);
          }
        });
      } else if (!Array.isArray(value) && !Array.isArray(mergedValue)) {
        // 对象合并
        Object.keys(value).forEach(key => {
          if (typeof value[key] === 'object' && value[key] !== null && typeof mergedValue[key] === 'object' && mergedValue[key] !== null) {
            // 递归合并嵌套对象
            mergedValue[key] = Array.isArray(value[key]) ? [...mergedValue[key], ...value[key]] : { ...mergedValue[key], ...value[key] };
          } else {
            mergedValue[key] = value[key];
          }
        });
      }
    }
    
    return this.set(obj, segments, mergedValue, options);
  }
  
  /**
   * 检查路径是否匹配
   * @param path 数据路径
   * @param pattern 匹配模式
   * @returns 是否匹配
   */
  static matchPath(path: string, pattern: string): boolean {
    if (pattern === path || pattern === '*') {
      return true;
    }
    
    // 简单的通配符匹配
    const pathSegments = path.split('.');
    const patternSegments = pattern.split('.');
    
    if (pathSegments.length !== patternSegments.length) {
      return false;
    }
    
    for (let i = 0; i < pathSegments.length; i++) {
      if (patternSegments[i] !== '*' && patternSegments[i] !== pathSegments[i]) {
        return false;
      }
    }
    
    return true;
  }
}

/**
 * 数据流管理器实现类
 */
export class DataFlowManager implements DataFlowManagerInterface {
  /**
   * 当前数据
   */
  private data: any;
  
  /**
   * 路径配置
   */
  private pathOptions: PathOptions;
  
  /**
   * 监听器映射表
   */
  private listeners: Map<string, DataFlowListener[]>;
  
  /**
   * 是否启用历史记录
   */
  private enableHistory: boolean;
  
  /**
   * 历史记录
   */
  private history: DataFlowHistory[];
  
  /**
   * 历史记录最大长度
   */
  private maxHistoryLength: number;
  
  /**
   * 重做历史记录
   */
  private redoStack: DataFlowHistory[];
  
  /**
   * 事件总线实例
   */
  private eventBus?: EventBus;
  
  /**
   * 操作ID计数器
   */
  private actionCounter: number;
  
  constructor(config: DataFlowManagerConfig = {}) {
    const { 
      initialData = {}, 
      pathOptions = {}, 
      enableHistory = false, 
      maxHistoryLength = 100, 
      eventBus 
    } = config;
    
    this.data = JSON.parse(JSON.stringify(initialData)); // 深拷贝
    this.pathOptions = pathOptions;
    this.listeners = new Map();
    this.enableHistory = enableHistory;
    this.history = [];
    this.redoStack = [];
    this.maxHistoryLength = maxHistoryLength;
    if (eventBus !== undefined) {
      this.eventBus = eventBus;
    }
    this.actionCounter = 0;
  }
  
  /**
   * 生成操作ID
   * @returns 操作ID
   */
  private generateActionId(): string {
    return `action_${Date.now()}_${++this.actionCounter}`;
  }
  
  /**
   * 添加历史记录
   * @param action 操作对象
   * @param oldValue 旧值
   */
  private addHistory(action: DataFlowAction, oldValue: any): void {
    if (!this.enableHistory) return;
    
    const historyItem: DataFlowHistory = {
      action,
      oldValue,
      timestamp: Date.now()
    };
    
    this.history.push(historyItem);
    
    // 限制历史记录长度
    if (this.history.length > this.maxHistoryLength) {
      this.history.shift();
    }
    
    // 清空重做栈
    this.redoStack = [];
  }
  
  /**
   * 通知监听器
   * @param action 操作对象
   * @param oldValue 旧值
   * @param newValue 新值
   */
  private notifyListeners<T = any>(action: DataFlowAction<T>, oldValue: T | undefined, newValue: T | undefined): void {
    const path = action.path || '';
    
    // 通知精确路径的监听器
    this.notifyPathListeners(path, action, oldValue, newValue);
    
    // 通知通配符监听器
    this.notifyWildcardListeners(path, action, oldValue, newValue);
    
    // 通过事件总线通知
    if (this.eventBus) {
      this.eventBus.emit(`dataflow:${path || 'root'}`, {
        action,
        oldValue,
        newValue
      });
    }
  }
  
  /**
   * 通知路径监听器
   * @param path 数据路径
   * @param action 操作对象
   * @param oldValue 旧值
   * @param newValue 新值
   */
  private notifyPathListeners<T = any>(path: string, action: DataFlowAction<T>, oldValue: T | undefined, newValue: T | undefined): void {
    const pathListeners = this.listeners.get(path);
    if (pathListeners) {
      pathListeners.forEach(listener => {
        try {
          listener(action, oldValue, newValue);
        } catch (error) {
          console.error(`Error in data flow listener for path '${path}':`, error);
        }
      });
    }
  }
  
  /**
   * 通知通配符监听器
   * @param path 数据路径
   * @param action 操作对象
   * @param oldValue 旧值
   * @param newValue 新值
   */
  private notifyWildcardListeners<T = any>(path: string, action: DataFlowAction<T>, oldValue: T | undefined, newValue: T | undefined): void {
    this.listeners.forEach((listeners, pattern) => {
      if (pattern !== path && PathResolver.matchPath(path, pattern)) {
        listeners.forEach(listener => {
          try {
            listener(action, oldValue, newValue);
          } catch (error) {
            console.error(`Error in data flow listener for pattern '${pattern}':`, error);
          }
        });
      }
    });
  }
  
  /**
   * 获取数据
   * @param path 数据路径
   * @returns 数据值
   */
  get<T = any>(path?: string): T {
    if (!path) {
      return JSON.parse(JSON.stringify(this.data)) as T; // 返回深拷贝
    }
    
    return PathResolver.get(this.data, path, this.pathOptions) as T;
  }
  
  /**
   * 设置数据
   * @param path 数据路径
   * @param value 数据值
   * @returns 操作ID
   */
  set<T = any>(path: string, value: T): string {
    return this.dispatch({
      type: DataFlowOperation.SET,
      path,
      value
    });
  }
  
  /**
   * 更新数据
   * @param path 数据路径
   * @param value 数据值
   * @returns 操作ID
   */
  update<T = any>(path: string, value: T): string {
    return this.dispatch({
      type: DataFlowOperation.UPDATE,
      path,
      value
    });
  }
  
  /**
   * 合并数据
   * @param path 数据路径
   * @param value 数据值
   * @returns 操作ID
   */
  merge<T = any>(path: string, value: T): string {
    return this.dispatch({
      type: DataFlowOperation.MERGE,
      path,
      value
    });
  }
  
  /**
   * 删除数据
   * @param path 数据路径
   * @returns 操作ID
   */
  delete(path: string): string {
    return this.dispatch({
      type: DataFlowOperation.DELETE,
      path
    });
  }
  
  /**
   * 清空数据
   * @returns 操作ID
   */
  clear(): string {
    return this.dispatch({
      type: DataFlowOperation.CLEAR,
      path: ''
    });
  }
  
  /**
   * 执行操作
   * @param action 操作对象
   * @returns 操作ID
   */
  dispatch<T = any>(action: DataFlowAction<T>): string {
    const actionId = this.generateActionId();
    const timestamp = Date.now();
    
    const processedAction: DataFlowAction<T> = {
      ...action,
      id: actionId,
      timestamp
    };
    
    // 获取旧值
    const oldValue = this.get(action.path);
    let newValue: T | undefined = oldValue;
    
    // 执行数据操作
    try {
      switch (action.type) {
        case DataFlowOperation.SET:
        case DataFlowOperation.UPDATE:
          this.data = PathResolver.set(this.data, action.path, action.value, this.pathOptions);
          newValue = action.value;
          break;
        
        case DataFlowOperation.MERGE:
          this.data = PathResolver.merge(this.data, action.path, action.value, this.pathOptions);
          newValue = this.get(action.path);
          break;
        
        case DataFlowOperation.DELETE:
          this.data = PathResolver.delete(this.data, action.path, this.pathOptions);
          newValue = undefined;
          break;
        
        case DataFlowOperation.CLEAR:
          this.data = {};
          newValue = undefined;
          break;
      }
      
      // 添加历史记录
      this.addHistory(processedAction, oldValue);
      
      // 通知监听器
      this.notifyListeners(processedAction, oldValue, newValue);
      
    } catch (error) {
      console.error('Data flow dispatch error:', error);
      throw error;
    }
    
    return actionId;
  }
  
  /**
   * 监听数据变化
   * @param path 数据路径
   * @param listener 监听器函数
   * @returns 取消监听函数
   */
  subscribe<T = any>(path: string | string[], listener: DataFlowListener<T>): () => void {
    const paths = Array.isArray(path) ? path : [path];
    
    paths.forEach(p => {
      if (!this.listeners.has(p)) {
        this.listeners.set(p, []);
      }
      this.listeners.get(p)!.push(listener);
    });
    
    // 返回取消监听函数
    return () => {
      paths.forEach(p => {
        const pathListeners = this.listeners.get(p);
        if (pathListeners) {
          const index = pathListeners.indexOf(listener);
          if (index > -1) {
            pathListeners.splice(index, 1);
          }
          
          if (pathListeners.length === 0) {
            this.listeners.delete(p);
          }
        }
      });
    };
  }
  
  /**
   * 获取所有监听路径
   * @returns 监听路径数组
   */
  getListenerPaths(): string[] {
    return Array.from(this.listeners.keys());
  }
  
  /**
   * 获取数据快照
   * @returns 数据快照
   */
  getSnapshot(): any {
    return JSON.parse(JSON.stringify(this.data)); // 返回深拷贝
  }
  
  /**
   * 重置数据
   * @param data 重置数据
   */
  reset(data: any = {}): void {
    const oldData = this.getSnapshot();
    this.data = JSON.parse(JSON.stringify(data)); // 深拷贝
    
    // 清空历史记录
    this.history = [];
    this.redoStack = [];
    
    // 通知根路径监听器
    const action: DataFlowAction = {
      type: DataFlowOperation.CLEAR,
      path: '',
      id: this.generateActionId(),
      timestamp: Date.now()
    };
    
    this.notifyListeners(action, oldData, this.data);
  }
  
  /**
   * 撤销上一步操作
   * @returns 是否撤销成功
   */
  undo(): boolean {
    if (this.history.length === 0) return false;
    
    const historyItem = this.history.pop()!;
    const { action, oldValue } = historyItem;
    
    // 保存当前值用于重做
    const currentValue = this.get(action.path);
    const redoItem: DataFlowHistory = {
      action: {
        ...action,
        type: this.getUndoActionType(action.type),
        value: currentValue
      },
      oldValue: currentValue,
      timestamp: Date.now()
    };
    
    this.redoStack.push(redoItem);
    
    // 执行撤销操作
    const undoAction: DataFlowAction = {
      type: DataFlowOperation.SET,
      path: action.path,
      value: oldValue
    };
    
    this.data = PathResolver.set(this.data, action.path, oldValue, this.pathOptions);
    
    // 通知监听器（不记录历史）
    const tempEnableHistory = this.enableHistory;
    this.enableHistory = false;
    this.notifyListeners(undoAction, currentValue, oldValue);
    this.enableHistory = tempEnableHistory;
    
    return true;
  }
  
  /**
   * 获取撤销操作类型
   * @param actionType 操作类型
   * @returns 撤销操作类型
   */
  private getUndoActionType(actionType: DataFlowOperation): DataFlowOperation {
    switch (actionType) {
      case DataFlowOperation.SET:
      case DataFlowOperation.UPDATE:
      case DataFlowOperation.MERGE:
        return DataFlowOperation.SET;
      case DataFlowOperation.DELETE:
        return DataFlowOperation.SET;
      case DataFlowOperation.CLEAR:
        return DataFlowOperation.SET;
      default:
        return DataFlowOperation.SET;
    }
  }
  
  /**
   * 重做下一步操作
   * @returns 是否重做成功
   */
  redo(): boolean {
    if (this.redoStack.length === 0) return false;
    
    const redoItem = this.redoStack.pop()!;
    const { action } = redoItem;
    
    // 获取当前值
    const currentValue = this.get(action.path);
    
    // 执行重做操作
    this.data = PathResolver.set(this.data, action.path, action.value, this.pathOptions);
    
    // 通知监听器（不记录历史）
    const tempEnableHistory = this.enableHistory;
    this.enableHistory = false;
    this.notifyListeners(action, currentValue, action.value);
    this.enableHistory = tempEnableHistory;
    
    return true;
  }
  
  /**
   * 清空历史记录
   */
  clearHistory(): void {
    this.history = [];
    this.redoStack = [];
  }
  
  /**
   * 获取历史记录
   * @returns 历史记录数组
   */
  getHistory(): DataFlowHistory[] {
    return [...this.history];
  }
}

/**
 * 创建数据流管理器
 * @param config 配置参数
 * @returns 数据流管理器实例
 */
export function createDataFlowManager(config: DataFlowManagerConfig = {}): DataFlowManagerInterface {
  return new DataFlowManager(config);
}

/**
 * 全局数据流管理器实例
 */
export const globalDataFlowManager = createDataFlowManager({
  eventBus,
  enableHistory: true
});

/**
 * React Hook：使用数据流
 * @param path 数据路径
 * @param defaultValue 默认值
 * @returns 数据和操作函数
 */
export function useDataFlow<T = any>(path?: string, defaultValue?: T): [T, (value: T) => void, DataFlowManagerInterface] {
  const [data, setData] = React.useState<T>(() => {
    const value = globalDataFlowManager.get<T>(path);
    return value !== undefined ? value : defaultValue as T;
  });
  
  React.useEffect(() => {
    const unsubscribe = globalDataFlowManager.subscribe<T>(path || '', (_action, _oldValue, newValue) => {
      setData(newValue !== undefined ? newValue : defaultValue as T);
    });
    
    return unsubscribe;
  }, [path, defaultValue]);
  
  const updateData = React.useCallback((value: T) => {
    if (path) {
      globalDataFlowManager.set(path, value);
    }
  }, [path]);
  
  return [data, updateData, globalDataFlowManager];
}

/**
 * React Hook：使用数据流管理器
 * @returns 数据流管理器实例
 */
export function useDataFlowManager(): DataFlowManagerInterface {
  return globalDataFlowManager;
}

// 导入React用于hooks功能
import * as React from 'react';

// 为非React环境提供兼容性
if (typeof window === 'undefined') {
  (global as any).useDataFlow = () => [undefined, () => {}, globalDataFlowManager];
  (global as any).useDataFlowManager = () => globalDataFlowManager;
}
