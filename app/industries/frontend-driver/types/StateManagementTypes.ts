/**
 * @file 状态管理类型定义
 * @description 定义状态管理和数据流的核心类型
 * @module industries/frontend-driver/types/StateManagementTypes
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-26
 */

/**
 * 状态更新回调函数类型
 */
export type StateListener<T> = (state: T, action: Action) => void;

/**
 * 中间件函数类型
 */
export type Middleware<T> = (
  store: Store<T>
) => (next: DispatchFunction) => (action: Action) => any;

/**
 * Action 基本接口
 */
export interface Action {
  /**
   * Action 类型标识
   */
  type: string;
  /**
   * Action 负载数据
   */
  payload?: any;
  /**
   * Action 元数据
   */
  meta?: any;
}

/**
 * Action 创建函数类型
 */
export type ActionCreator<P = any, M = any> = (
  payload?: P,
  meta?: M
) => Action & { payload?: P; meta?: M };

/**
 * 状态更新reducer函数类型
 */
export type Reducer<T> = (state: T, action: Action) => T;

/**
 * 组合Reducer配置类型
 */
export interface CombinedReducerMap {
  [key: string]: Reducer<any>;
}

/**
 * Dispatch 函数类型
 */
export type DispatchFunction = (action: Action) => any;

/**
 * 状态存储接口
 */
export interface Store<T> {
  /**
   * 获取当前状态
   */
  getState: () => T;
  /**
   * 分发Action
   */
  dispatch: DispatchFunction;
  /**
   * 订阅状态变化
   */
  subscribe: (listener: StateListener<T>) => () => void;
  /**
   * 替换reducer
   */
  replaceReducer: (reducer: Reducer<T>) => void;
  /**
   * 应用中间件
   */
  applyMiddleware: (...middlewares: Middleware<T>[]) => Store<T>;
}

/**
 * 状态存储配置接口
 */
export interface StoreConfig<T> {
  /**
   * 初始状态
   */
  initialState: T;
  /**
   * 根reducer函数
   */
  rootReducer: Reducer<T>;
  /**
   * 中间件数组
   */
  middlewares?: Middleware<T>[];
  /**
   * 是否启用devtools
   */
  devTools?: boolean;
}

/**
 * 异步Action类型
 */
export type AsyncAction<T> = (
  dispatch: DispatchFunction,
  getState: () => T,
  extraArgument?: any
) => Promise<any> | any;

/**
 * 选择器函数类型
 */
export type Selector<T, R> = (state: T) => R;

/**
 * 批量Action类型
 */
export interface BatchAction extends Action {
  type: '@@BATCH_ACTION';
  payload: Action[];
}

/**
 * Redux DevTools Extension接口
 */
interface ReduxDevToolsExtension {
  connect: (options?: any) => {
    init: (state: any) => void;
    send: (action: any, state: any) => void;
    subscribe: (callback: (message: any) => void) => () => void;
    unsubscribe: () => void;
  };
}

/**
 * 全局Window接口扩展
 */
declare global {
  interface Window {
    __REDUX_DEVTOOLS_EXTENSION__?: ReduxDevToolsExtension;
    __REDUX_DEVTOOLS_EXTENSION_COMPOSE__?: <R>(a: R) => R;
  }
}
