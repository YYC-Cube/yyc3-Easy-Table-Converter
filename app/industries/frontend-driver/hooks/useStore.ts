/**
 * @file 状态管理React Hooks
 * @description 提供React组件访问状态存储的Hooks
 * @module industries/frontend-driver/hooks/useStore
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-26
 */

import React, { useContext, createContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { Store, Action, Selector } from '../types/StateManagementTypes';

/**
 * 状态存储上下文类型
 */
interface StoreContextType<T = any> {
  store: Store<T>;
}

/**
 * 创建状态存储上下文
 */
function createStoreContext<T>() {
  return createContext<StoreContextType<T> | undefined>(undefined);
}

/**
 * 状态存储提供者组件属性类型
 */
interface StoreProviderProps<T> {
  store: Store<T>;
  children: ReactNode;
}

/**
 * 创建状态存储提供者组件
 * @param storeContext 状态存储上下文
 * @returns 状态存储提供者组件
 */
function createStoreProvider<T>(context: React.Context<StoreContextType<T> | undefined>) {
  // 确保context变量被使用
  if (!context) {
    throw new Error('Context is required');
  }
  
  const StoreProvider: React.FC<StoreProviderProps<T>> = ({ store, children }) => {
    // 确保children被使用
    if (children === undefined) {
      throw new Error('StoreProvider must have children');
    }
    
    // 使用React.createElement避免JSX类型推断问题
    return React.createElement(context.Provider, { value: { store } }, children);
  };

  return StoreProvider;
}

/**
 * 使用状态存储的Hook
 * @param storeContext 状态存储上下文
 * @returns 状态存储对象
 */
function useStoreBase<T>(storeContext: React.Context<StoreContextType<T> | undefined>): Store<T> {
  const context = useContext(storeContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context.store;
}

/**
 * 创建状态管理相关的工具函数和Hooks
 * @returns 状态管理工具集
 */
export function createStoreHooks<T>() {
  const storeContext = createStoreContext<T>();
  const StoreProvider = createStoreProvider(storeContext);
  const useStore = () => useStoreBase(storeContext);
  
  /**
   * 使用状态的Hook
   * @param selector 状态选择器函数
   * @returns 选择的状态值
   */
  const useSelector = <R>(selector: Selector<T, R>): R => {
    const store = useStore();
    const [state, setState] = useState<R>(() => selector(store.getState()));
    
    useEffect(() => {
      const updateState = () => {
        setState(selector(store.getState()));
      };
      
      // 订阅状态变化
      const unsubscribe = store.subscribe(updateState);
      
      // 组件卸载时取消订阅
      return () => {
        unsubscribe();
      };
    }, [store, selector]);
    
    return state;
  };
  
  /**
   * 使用Dispatch的Hook
   * @returns Dispatch函数
   */
  const useDispatch = (): Store<T>['dispatch'] => {
    const store = useStore();
    return store.dispatch;
  };
  
  /**
   * 使用Action Creator的Hook
   * @param actionCreator Action创建函数
   * @returns 绑定了dispatch的Action创建函数
   */
  const useActionCreator = <P = any, M = any>(
    actionCreator: (payload?: P, meta?: M) => Action
  ) => {
    const dispatch = useDispatch();
    
    return useCallback(
      (payload?: P, meta?: M) => {
        const action = actionCreator(payload, meta);
        return dispatch(action);
      },
      [actionCreator, dispatch]
    );
  };
  
  /**
   * 使用多个Action Creator的Hook
   * @param actionCreators Action创建函数映射对象
   * @returns 绑定了dispatch的Action创建函数映射对象
   */
  const useActionCreators = <
    ActionCreators extends Record<string, (...args: any[]) => Action>
  >(
    actionCreators: ActionCreators
  ) => {
    const dispatch = useDispatch();
    
    return useCallback(
      () => {
        const boundActionCreators: Partial<{
          [K in keyof ActionCreators]: (...args: Parameters<ActionCreators[K]>) => ReturnType<typeof dispatch>
        }> = {};
        
        for (const key in actionCreators) {
          if (actionCreators.hasOwnProperty(key)) {
            boundActionCreators[key] = (...args: any[]) => {
              return dispatch(actionCreators[key](...args));
            };
          }
        }
        
        return boundActionCreators as {
          [K in keyof ActionCreators]: (...args: Parameters<ActionCreators[K]>) => ReturnType<typeof dispatch>
        };
      },
      [actionCreators, dispatch]
    )();
  };
  
  /**
   * 使用状态和Dispatch的Hook
   * @param selector 状态选择器函数
   * @returns 包含状态和Dispatch的对象
   */
  const useStoreState = <R>(selector: Selector<T, R>) => {
    const state = useSelector(selector);
    const dispatch = useDispatch();
    
    return { state, dispatch };
  };
  
  return {
    StoreProvider,
    useStore,
    useSelector,
    useDispatch,
    useActionCreator,
    useActionCreators,
    useStoreState
  };
}

/**
 * 创建状态切片的辅助函数
 * @param name 切片名称
 * @param initialState 初始状态
 * @param reducers reducer函数映射对象
 * @returns 状态切片对象
 */
export function createSlice<T>(
  name: string,
  initialState: T,
  reducers: Record<string, (state: T, action: Action) => T>
) {
  // 生成action类型
  const actionTypes: Record<string, string> = {};
  const actionCreators: Record<string, Function> = {};
  
  // 创建action creators
  for (const key in reducers) {
    if (reducers.hasOwnProperty(key)) {
      const type = `${name}/${key}`;
      actionTypes[key] = type;
      actionCreators[key] = (payload?: any, meta?: any) => ({
        type,
        payload,
        meta
      });
    }
  }
  
  // 创建reducer函数
  const reducer: (state: T | undefined, action: Action) => T = (state = initialState, action) => {
    const [namespace] = action.type.split('/');
    
    if (namespace !== name) {
      return state;
    }
    
    const actionType = action.type.substring(name.length + 1);
    const handler = reducers[actionType];
    
    if (handler) {
      return handler(state, action);
    }
    
    return state;
  };
  
  return {
    name,
    reducer,
    actions: actionCreators,
    actionTypes,
    initialState
  };
}

/**
 * 异步Action创建器
 * @param asyncFn 异步函数
 * @returns 异步Action创建函数
 */
export function createAsyncAction<T>(
  asyncFn: (dispatch: Function, getState: () => T, extraArgument?: any) => Promise<any>
) {
  return (extraArgument?: any) => {
    return (dispatch: Function, getState: () => T) => {
      return asyncFn(dispatch, getState, extraArgument);
    };
  };
}

/**
 * 创建异步Thunk Action
 * @param typePrefix Action类型前缀
 * @param payloadCreator 负载创建函数
 * @returns 异步Thunk Action创建函数
 */
export function createAsyncThunk<TState, TPayload = void>(
  typePrefix: string,
  payloadCreator: (arg: TPayload, thunkAPI: {
    dispatch: Function;
    getState: () => TState;
  }) => Promise<any>
) {
  const pendingType = `${typePrefix}/pending`;
  const fulfilledType = `${typePrefix}/fulfilled`;
  const rejectedType = `${typePrefix}/rejected`;
  
  return (arg: TPayload) => {
    return async (dispatch: Function, getState: () => TState) => {
      // 分发pending action
      dispatch({ type: pendingType, meta: { arg } });
      
      try {
        // 执行异步操作
        const result = await payloadCreator(arg, { dispatch, getState });
        // 分发fulfilled action
        dispatch({ 
          type: fulfilledType, 
          payload: result,
          meta: { arg }
        });
        return result;
      } catch (error) {
        // 分发rejected action
        dispatch({ 
          type: rejectedType, 
          payload: error,
          error: true,
          meta: { arg }
        });
        return Promise.reject(error);
      }
    };
  };
}
