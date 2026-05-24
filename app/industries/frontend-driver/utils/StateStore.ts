/**
 * @file 状态管理核心实现
 * @description 实现状态管理和数据流的核心功能
 * @module industries/frontend-driver/utils/StateStore
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-26
 */

import { 
  Action, 
  ActionCreator, 
  Reducer, 
  Store, 
  StoreConfig, 
  StateListener, 
  Middleware,
  CombinedReducerMap,
  BatchAction,
  DispatchFunction
} from '../types/StateManagementTypes';

/**
 * 创建Action的辅助函数
 * @param type Action类型
 * @returns Action创建函数
 */
export function createAction<P = any, M = any>(
  type: string
): ActionCreator<P, M> {
  return (payload?: P, meta?: M): Action & { payload?: P | undefined; meta?: M | undefined } => {
    const action = { type } as Action & { payload?: P | undefined; meta?: M | undefined };
    if (payload !== undefined) {
      action.payload = payload;
    }
    if (meta !== undefined) {
      action.meta = meta;
    }
    return action;
  };
}

/**
 * 组合多个reducer函数
 * @param reducers reducer映射对象
 * @returns 组合后的reducer函数
 */
export function combineReducers<T extends Record<string, any>>(
  reducers: CombinedReducerMap
): Reducer<T> {
  return (state: T = {} as T, action: Action): T => {
    const nextState: T = {} as T;
    let hasChanged = false;
    
    for (const key in reducers) {
      if (reducers.hasOwnProperty(key)) {
        const previousStateForKey = state[key];
        const nextStateForKey = reducers[key](previousStateForKey, action);
        (nextState as Record<string, any>)[key] = nextStateForKey;
        hasChanged = hasChanged || nextStateForKey !== previousStateForKey;
      }
    }
    
    return hasChanged ? nextState : state;
  };
}

/**
 * 批量处理Action的辅助函数
 * @param actions 要批量处理的Action数组
 * @returns 批量Action
 */
export function batchActions(actions: Action[]): BatchAction {
  return {
    type: '@@BATCH_ACTION',
    payload: actions
  };
}

/**
 * 批量处理中间件
 * @returns 中间件函数
 */
export const batchActionMiddleware = <T>() => ({
  dispatch,
  getState: _getState
}: { dispatch: Function; getState: Function }) => {
  return (next: Function) => (action: any) => {
    if (action.type === '@@BATCH_ACTION') {
      action.payload.forEach((subAction: Action) => {
        dispatch(subAction);
      });
      return action.payload;
    }
    return next(action);
  };
};

/**
 * 日志中间件
 * @returns 中间件函数
 */
export const loggerMiddleware = <T>() => ({
  dispatch: _dispatch,
  getState
}: { dispatch: Function; getState: Function }) => {
  return (next: Function) => (action: Action) => {
    console.log('dispatching action:', action);
    const result = next(action);
    console.log('new state:', getState());
    return result;
  };
};

/**
 * 错误处理中间件
 * @returns 中间件函数
 */
export const errorMiddleware = <T>() => ({
  dispatch: _dispatch,
  getState: _getState
}: { dispatch: Function; getState: Function }) => {
  return (next: Function) => (action: Action) => {
    try {
      return next(action);
    } catch (error) {
      console.error('Error in action:', error);
      throw error;
    }
  };
};

/**
 * 创建状态存储
 * @param config 存储配置
 * @returns 状态存储实例
 */
export function createStore<T>(config: StoreConfig<T>): Store<T> {
  const { initialState, middlewares = [] } = config;
  let rootReducer = config.rootReducer;
  
  let currentState = initialState;
  const listeners: StateListener<T>[] = [];
  let isDispatching = false;
  let devToolsEnhancer: any = null;
  
  // 初始化Redux DevTools
  if (config.devTools && typeof window !== 'undefined' && window.__REDUX_DEVTOOLS_EXTENSION__) {
    devToolsEnhancer = window.__REDUX_DEVTOOLS_EXTENSION__.connect();
    devToolsEnhancer.init(currentState);
  }
  
  /**
   * 获取当前状态
   */
  const getState = (): T => {
    if (isDispatching) {
      throw new Error('You may not call getState() while dispatching an action.');
    }
    return currentState;
  };
  
  /**
   * 订阅状态变化
   */
  const subscribe = (listener: StateListener<T>): () => void => {
    if (typeof listener !== 'function') {
      throw new Error('Expected the listener to be a function.');
    }
    
    if (isDispatching) {
      throw new Error('You may not call subscribe() while dispatching an action.');
    }
    
    listeners.push(listener);
    
    // 返回取消订阅函数
    return (): void => {
      if (isDispatching) {
        throw new Error('You may not call unsubscribe() while dispatching an action.');
      }
      
      const index = listeners.indexOf(listener);
      listeners.splice(index, 1);
    };
  };
  
  /**
   * 分发Action
   */
  let dispatch: DispatchFunction = (action: Action): any => {
    if (typeof action !== 'object' || action === null) {
      throw new Error('Actions must be plain objects.');
    }
    
    if (typeof action.type === 'undefined') {
      throw new Error('Actions must have a type property.');
    }
    
    if (isDispatching) {
      throw new Error('Reducers may not dispatch actions.');
    }
    
    try {
      isDispatching = true;
      const nextState = rootReducer(currentState, action);
      currentState = nextState;
      
      // 更新Redux DevTools
      if (devToolsEnhancer) {
        devToolsEnhancer.send(action, currentState);
      }
      
      return action;
    } finally {
      isDispatching = false;
    }
  };
  
  /**
   * 替换reducer
   */
  const replaceReducer = (newReducer: Reducer<T>): void => {
    if (typeof newReducer !== 'function') {
      throw new Error('Expected the nextReducer to be a function.');
    }
    
    rootReducer = newReducer;
    dispatch({ type: '@@INIT' });
  };
  
  /**
   * 应用中间件
   */
  const applyMiddleware = (...middlewares: Middleware<T>[]): Store<T> => {
    // 创建中间件链
    const middlewareAPI = {
      getState,
      dispatch: (action: Action) => dispatch(action)
    };
    
    const chain = middlewares.map(middleware => 
      middleware({ getState, dispatch: middlewareAPI.dispatch, subscribe, replaceReducer, applyMiddleware })
    );
    
    // 组合中间件并应用到dispatch
    dispatch = chain.reduce(
      (prev, current) => current(prev),
      dispatch
    );
    
    return { getState, dispatch, subscribe, replaceReducer, applyMiddleware };
  };
  
  // 应用初始中间件
  if (middlewares.length > 0) {
    applyMiddleware(...middlewares);
  }
  
  // 初始化状态
  dispatch({ type: '@@INIT' });
  
  return { getState, dispatch, subscribe, replaceReducer, applyMiddleware };
}

/**
 * 创建选择器函数
 * @param selector 选择器函数
 * @returns 增强的选择器函数
 */
export function createSelector<T, R>(
  selector: (state: T) => R
): (state: T) => R {
  let lastState: T | null = null;
  let lastResult: R | null = null;
  
  return (state: T): R => {
    // 简单的缓存逻辑
    if (lastState !== state) {
      lastResult = selector(state);
      lastState = state;
    }
    return lastResult!;
  };
}

/**
 * 连接React组件和状态存储的辅助函数
 * @param mapStateToProps 将状态映射到组件属性
 * @param mapDispatchToProps 将dispatch映射到组件属性
 * @returns 高阶组件函数
 */
export function connect<TState, TProps>(
  _mapStateToProps?: (state: TState, ownProps?: TProps) => Partial<TProps>,
  _mapDispatchToProps?: (dispatch: Function, ownProps?: TProps) => Partial<TProps>
) {
  return (Component: React.ComponentType<TProps>) => {
    // 这里简化实现，实际应该返回一个React高阶组件
    return Component;
  };
}
