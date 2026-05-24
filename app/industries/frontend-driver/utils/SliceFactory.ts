/**
 * @file Slice工厂
 * @description 提供Redux风格的Slice创建和异步操作处理功能
 * @module industries/frontend-driver/utils/SliceFactory
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-26
 */

import { Action, Reducer, Middleware, DispatchFunction } from '../types/StateManagementTypes';
import { eventBus } from './EventBus';

/**
 * Slice状态类型
 */
export type SliceState<T> = T;

/**
 * Slice Reducer类型
 */
export type SliceReducer<S = any, A extends Action = Action> = (state: S, action: A) => S;

/**
 * Slice Reducers映射类型
 */
export type SliceReducers<S = any> = Record<string, SliceReducer<S, Action>>;

/**
 * Slice Action类型
 */
export interface SliceAction<T = any> extends Action {
  payload?: T;
  meta?: Record<string, any>;
  error?: any;
}

/**
 * Slice选项接口
 */
export interface SliceOptions<S = any> {
  /**
   * Slice名称
   */
  name: string;
  
  /**
   * 初始状态
   */
  initialState: S;
  
  /**
   * Reducers映射
   */
  reducers: SliceReducers<S>;
  
  /**
   * 额外Reducers
   */
  extraReducers?: (builder: ActionReducerMapBuilder<S>) => void;
  
  /**
   * 是否启用事件总线
   */
  enableEventBus?: boolean;
  
  /**
   * 事件总线前缀
   */
  eventBusPrefix?: string;
}

/**
 * Slice接口
 */
export interface Slice<S = any> {
  /**
   * Slice名称
   */
  name: string;
  
  /**
   * Reducer函数
   */
  reducer: Reducer<S>;
  
  /**
   * Actions创建器
   */
  actions: Record<string, (...args: any[]) => SliceAction>;
  
  /**
   * Selectors
   */
  selectors: Record<string, (state: S, ...args: any[]) => any>;
}

/**
 * Action Reducer Map Builder接口
 */
export interface ActionReducerMapBuilder<S = any> {
  /**
   * 添加Matcher
   */
  addMatcher<A extends Action>(matcher: (action: Action) => action is A, reducer: SliceReducer<S, A>): ActionReducerMapBuilder<S>;
  
  /**
   * 添加Case
   */
  addCase<A extends Action>(actionCreator: string | ((...args: any[]) => A), reducer: SliceReducer<S, A>): ActionReducerMapBuilder<S>;
  
  /**
   * 添加Default Case
   */
  addDefaultCase(reducer: SliceReducer<S>): ActionReducerMapBuilder<S>;
}

/**
 * Async Thunk配置接口
 */
export interface AsyncThunkConfig {
  /**
   * 状态类型
   */
  state?: any;
  
  /**
   * 调度类型
   */
  dispatch?: Action;
  
  /**
   * Extra参数类型
   */
  extra?: any;
  
  /**
   * RejectValue类型
   */
  rejectValue?: any;
  
  /**
   * SerializedError类型
   */
  serializedErrorType?: any;
}

/**
 * Async Thunk状态类型
 */
export type AsyncThunkState = 'idle' | 'pending' | 'fulfilled' | 'rejected';

/**
 * Async Thunk动作类型
 */
export interface AsyncThunkActions<Returned, ThunkArg = void> {
  /**
   * 基础动作类型
   */
  typePrefix: string;
  
  /**
   * Pending动作创建器
   */
  pending: (arg: ThunkArg) => SliceAction<ThunkArg>;
  
  /**
   * Fulfilled动作创建器
   */
  fulfilled: (returned: Returned, arg: ThunkArg) => SliceAction<{ returned: Returned; arg: ThunkArg }>;
  
  /**
   * Rejected动作创建器
   */
  rejected: (error: any, arg: ThunkArg) => SliceAction<{ error: any; arg: ThunkArg }>;
}

/**
 * Async Thunk接口
 */
export interface AsyncThunk<Returned, ThunkArg = void, Config extends AsyncThunkConfig = {}> {
  /**
   * Thunk函数
   */
  (arg: ThunkArg): (dispatch: DispatchFunction, getState: () => Config['state'], extra: Config['extra']) => Promise<Returned>;
  
  /**
   * 动作类型
   */
  typePrefix: string;
  
  /**
   * 动作创建器
   */
  pending: string;
  fulfilled: string;
  rejected: string;
}

/**
 * Action Reducer Map Builder实现类
 */
class ActionReducerMapBuilderImpl<S> implements ActionReducerMapBuilder<S> {
  /**
   * Reducers映射
   */
  private caseReducers: Map<string | ((action: Action) => boolean), SliceReducer<S>>;
  
  /**
   * 默认Reducer
   */
  private defaultReducer?: SliceReducer<S>;
  
  constructor() {
    this.caseReducers = new Map();
  }
  
  /**
   * 添加Matcher
   */
  addMatcher<A extends Action>(matcher: (action: Action) => action is A, reducer: SliceReducer<S, A>): ActionReducerMapBuilder<S> {
    this.caseReducers.set(matcher, reducer as SliceReducer<S, Action>);
    return this;
  }
  
  /**
   * 添加Case
   */
  addCase<A extends Action>(actionCreator: string | ((...args: any[]) => A) & { type?: string }, reducer: SliceReducer<S, A>): ActionReducerMapBuilder<S> {
    const actionType = typeof actionCreator === 'string' ? actionCreator : (actionCreator as any).type;
    this.caseReducers.set(actionType, reducer as SliceReducer<S, Action>);
    return this;
  }
  
  /**
   * 添加Default Case
   */
  addDefaultCase(reducer: SliceReducer<S>): ActionReducerMapBuilder<S> {
    this.defaultReducer = reducer;
    return this;
  }
  
  /**
   * 获取Case Reducers
   */
  getCaseReducers(): Map<string | Function, SliceReducer<S>> {
    return this.caseReducers;
  }
  
  /**
   * 获取默认Reducer
   */
  getDefaultReducer(): SliceReducer<S> | undefined {
    return this.defaultReducer;
  }
}

/**
 * 创建Slice
 * @param options Slice选项
 * @returns Slice实例
 */
export function createSlice<S>(options: SliceOptions<S>): Slice<S> {
  const { 
    name, 
    initialState, 
    reducers, 
    extraReducers,
    enableEventBus = true,
    eventBusPrefix = ''
  } = options;
  
  // 创建Actions
  const actions: Record<string, (...args: any[]) => SliceAction> = {};
  const actionTypes: Record<string, string> = {};
  
  // 生成Actions
  Object.keys(reducers).forEach(reducerKey => {
    const actionType = `${name}/${reducerKey}`;
    actionTypes[reducerKey] = actionType;
    
    actions[reducerKey] = ((...args: any[]) => {
      const action: SliceAction = {
        type: actionType,
        payload: args.length === 1 ? args[0] : args
      };
      
      // 发送事件总线事件
      if (enableEventBus) {
        const eventName = eventBusPrefix ? `${eventBusPrefix}:${name}/${reducerKey}` : `${name}/${reducerKey}`;
        eventBus.emit(eventName, action);
      }
      
      return action;
    }) as (...args: any[]) => SliceAction;
    
    // 添加类型属性
    Object.defineProperty(actions[reducerKey], 'type', {
      value: actionType,
      writable: false
    });
  });
  
  // 处理extraReducers
  const builder = new ActionReducerMapBuilderImpl<S>();
  if (extraReducers) {
    extraReducers(builder);
  }
  
  const caseReducers = builder.getCaseReducers();
  const defaultReducer = builder.getDefaultReducer();
  
  // 创建Combined Reducer
  const combinedReducer: Reducer<S> = (state = initialState, action) => {
    // 检查slice reducers
    const actionType = action.type;
    
    // 处理标准reducers
    if (actionType.startsWith(`${name}/`)) {
      const reducerKey = actionType.slice(name.length + 1);
      if (reducers[reducerKey]) {
        return reducers[reducerKey](state, action);
      }
    }
    
    // 处理case reducers
    for (const [key, reducer] of caseReducers.entries()) {
      if (typeof key === 'function') {
        // Matcher
        if (key(action)) {
          return reducer(state, action);
        }
      } else if (key === action.type) {
        // 精确匹配
        return reducer(state, action);
      }
    }
    
    // 处理默认reducer
    if (defaultReducer) {
      return defaultReducer(state, action);
    }
    
    // 返回当前状态
    return state;
  };
  
  // 创建Selectors
  const selectors = {
    selectAll: (state: S) => state,
    selectById: (state: S, id: any) => (Array.isArray(state) ? state.find(item => item && item.id === id) : undefined)
  };
  
  return {
    name,
    reducer: combinedReducer,
    actions,
    selectors
  };
}

/**
 * 创建Async Thunk
 * @param typePrefix 类型前缀
 * @param payloadCreator Payload创建器
 * @param options 选项
 * @returns Async Thunk函数
 */
export function createAsyncThunk<Returned, ThunkArg = void, Config extends AsyncThunkConfig = {}>(
  typePrefix: string,
  payloadCreator: (arg: ThunkArg, thunkAPI: {
    dispatch: DispatchFunction;
    getState: () => Config['state'];
    extra: Config['extra'];
    rejectWithValue: <T = Config['rejectValue']>(value: T) => T;
  }) => Promise<Returned>,
  options?: {
    /**
     * 条件
     */
    condition?: (arg: ThunkArg, { getState }: { getState: () => Config['state'] }) => boolean | Promise<boolean>;
    
    /**
     * 序列化Error
     */
    serializeError?: (error: any) => any;
    
    /**
     * 是否启用事件总线
     */
    enableEventBus?: boolean;
  }
): AsyncThunk<Returned, ThunkArg, Config> {
  const { condition, serializeError, enableEventBus = true } = options || {};
  
  // 创建动作类型
  const pendingType = `${typePrefix}/pending`;
  const fulfilledType = `${typePrefix}/fulfilled`;
  const rejectedType = `${typePrefix}/rejected`;
  
  // 创建Async Thunk函数
  const thunkFunction = ((arg: ThunkArg) => {
    return async (dispatch: DispatchFunction, getState: () => Config['state'], extra: Config['extra']) => {
      // 检查条件
      if (condition) {
        const result = await condition(arg, { getState });
        if (!result) {
          return new Promise<Returned>(resolve => resolve({} as Returned));
        }
      }
      
      // 发送Pending事件
      const requestId = Date.now().toString();
      const pendingAction: SliceAction = {
        type: pendingType,
        payload: arg,
        meta: { requestId, arg }
      };
      
      if (enableEventBus) {
        eventBus.emit(`${typePrefix}/pending`, pendingAction);
      }
      
      dispatch(pendingAction);
      
      try {
        // 执行Payload Creator
        const result = await payloadCreator(
          arg,
          {
            dispatch,
            getState,
            extra,
            rejectWithValue: (value: any) => value
          }
        );
        
        // 发送Fulfilled事件
        const fulfilledAction: SliceAction = {
          type: fulfilledType,
          payload: result,
          meta: { requestId, arg }
        };
        
        if (enableEventBus) {
          eventBus.emit(`${typePrefix}/fulfilled`, fulfilledAction);
        }
        
        dispatch(fulfilledAction);
        return result;
        
      } catch (error) {
        // 序列化错误
        const errorValue = serializeError ? serializeError(error) : error;
        
        // 发送Rejected事件
        const rejectedAction: SliceAction = {
          type: rejectedType,
          error: errorValue,
          meta: { requestId, arg }
        };
        
        if (enableEventBus) {
          eventBus.emit(`${typePrefix}/rejected`, rejectedAction);
        }
        
        dispatch(rejectedAction);
        throw error;
      }
    };
  }) as AsyncThunk<Returned, ThunkArg, Config>;
  
  // 添加属性
  thunkFunction.typePrefix = typePrefix;
  thunkFunction.pending = pendingType;
  thunkFunction.fulfilled = fulfilledType;
  thunkFunction.rejected = rejectedType;
  
  // 添加动作创建器
  Object.defineProperty(thunkFunction, 'pending', {
    value: pendingType,
    writable: false
  });
  
  Object.defineProperty(thunkFunction, 'fulfilled', {
    value: fulfilledType,
    writable: false
  });
  
  Object.defineProperty(thunkFunction, 'rejected', {
    value: rejectedType,
    writable: false
  });
  
  return thunkFunction;
}

/**
 * 合并Reducers
 * @param reducers Reducers映射
 * @returns 合并后的Reducer
 */
export function combineReducers<S>(reducers: Record<string, Reducer<any>>): Reducer<S> {
  return (state: S = {} as S, action: Action): S => {
    const nextState: any = {};
    let hasChanged = false;

    Object.keys(reducers).forEach(key => {
      const reducer = reducers[key];
      const previousStateForKey = (state as Record<string, any>)[key];
      const nextStateForKey = reducer(previousStateForKey, action);
      
      nextState[key] = nextStateForKey;
      hasChanged = hasChanged || nextStateForKey !== previousStateForKey;
    });
    
    return hasChanged ? nextState : state;
  };
}

/**
 * 创建Action
 * @param type Action类型
 * @param payload Payload
 * @param meta 元数据
 * @returns Action对象
 */
export function createAction<T = any>(type: string, payload?: T, meta?: Record<string, any>): SliceAction<T> {
  const action: any = { type };
  if (payload !== undefined) {
    action.payload = payload;
  }
  if (meta !== undefined) {
    action.meta = meta;
  }
  return action;
}

/**
 * 创建Matcher
 * @param predicate 谓词函数
 * @returns Matcher函数
 */
export function createActionMatcher<T extends Action>(predicate: (action: Action) => action is T) {
  return predicate;
}

/**
 * 创建Selectors
 * @param sliceName Slice名称
 * @returns Selectors对象
 */
export function createSelectors<S, K extends keyof S>(sliceName: string) {
  return {
    /**
     * 选择整个Slice
     */
    selectSlice: (state: { [key: string]: S }): S => state[sliceName],
    
    /**
     * 选择Slice属性
     */
    selectProperty: <P extends K>(property: P) => (state: { [key: string]: S }): S[P] | undefined => {
      return state[sliceName]?.[property];
    },
    
    /**
     * 创建自定义Selector
     */
    createSelector: <R>(selectorFn: (sliceState: S, ...args: any[]) => R) => {
      return (state: { [key: string]: S }, ...args: any[]): R => {
        return selectorFn(state[sliceName], ...args);
      };
    }
  };
}

/**
 * 创建实体Adapter
 * @returns 实体Adapter
 */
export function createEntityAdapter<T extends { id: any }>(options?: {
  selectId?: (model: T) => any;
  sortComparer?: (a: T, b: T) => number;
}) {
  const { selectId = (model: T) => model.id, sortComparer } = options || {};
  
  return {
    /**
     * 获取初始状态
     */
    getInitialState: <ExtraState = {}>(extraState?: ExtraState) => ({
      ids: [] as any[],
      entities: {} as Record<string, T>,
      ...(extraState || {})
    }),
    
    /**
     * 添加One
     */
    addOne: (state: any, entity: T) => {
      const id = selectId(entity);
      if (!state.ids.includes(id)) {
        state.ids.push(id);
        state.entities[id] = entity;
        
        if (sortComparer) {
          state.ids.sort((a: any, b: any) => sortComparer(state.entities[a], state.entities[b]));
        }
      }
    },
    
    /**
     * 添加Many
     */
    addMany: (state: any, entities: T[]) => {
      entities.forEach(entity => {
        const id = selectId(entity);
        if (!state.ids.includes(id)) {
          state.ids.push(id);
          state.entities[id] = entity;
        }
      });
      
      if (sortComparer) {
        state.ids.sort((a: any, b: any) => sortComparer(state.entities[a], state.entities[b]));
      }
    },
    
    /**
     * 设置One
     */
    setOne: (state: any, entity: T) => {
      const id = selectId(entity);
      if (!state.ids.includes(id)) {
        state.ids.push(id);
        
        if (sortComparer) {
          state.ids.sort((a: any, b: any) => sortComparer(state.entities[a], state.entities[b]));
        }
      }
      
      state.entities[id] = entity;
    },
    
    /**
     * 设置Many
     */
    setMany: (state: any, entities: T[]) => {
      entities.forEach(entity => {
        const id = selectId(entity);
        state.entities[id] = entity;
        
        if (!state.ids.includes(id)) {
          state.ids.push(id);
        }
      });
      
      if (sortComparer) {
        state.ids.sort((a: any, b: any) => sortComparer(state.entities[a], state.entities[b]));
      }
    },
    
    /**
     * 移除One
     */
    removeOne: (state: any, id: any) => {
      const index = state.ids.indexOf(id);
      if (index !== -1) {
        state.ids.splice(index, 1);
        delete state.entities[id];
      }
    },
    
    /**
     * 移除Many
     */
    removeMany: (state: any, ids: any[]) => {
      ids.forEach(id => {
        const index = state.ids.indexOf(id);
        if (index !== -1) {
          state.ids.splice(index, 1);
          delete state.entities[id];
        }
      });
    },
    
    /**
     * 移除All
     */
    removeAll: (state: any) => {
      state.ids = [];
      state.entities = {};
    },
    
    /**
     * 更新One
     */
    updateOne: (state: any, update: { id: any; changes: Partial<T> }) => {
      const { id, changes } = update;
      const entity = state.entities[id];
      if (entity) {
        state.entities[id] = { ...entity, ...changes };
        
        if (sortComparer) {
          state.ids.sort((a: any, b: any) => sortComparer(state.entities[a], state.entities[b]));
        }
      }
    },
    
    /**
     * 更新Many
     */
    updateMany: (state: any, updates: Array<{ id: any; changes: Partial<T> }>) => {
      updates.forEach(update => {
        const { id, changes } = update;
        const entity = state.entities[id];
        if (entity) {
          state.entities[id] = { ...entity, ...changes };
        }
      });
      
      if (sortComparer) {
        state.ids.sort((a: any, b: any) => sortComparer(state.entities[a], state.entities[b]));
      }
    },
    
    /**
     * UpsertOne
     */
    upsertOne: (state: any, entity: T) => {
      const id = selectId(entity);
      const exists = state.ids.includes(id);
      
      state.entities[id] = entity;
      
      if (!exists) {
        state.ids.push(id);
        
        if (sortComparer) {
          state.ids.sort((a: any, b: any) => sortComparer(state.entities[a], state.entities[b]));
        }
      }
    },
    
    /**
     * UpsertMany
     */
    upsertMany: (state: any, entities: T[]) => {
      entities.forEach(entity => {
        const id = selectId(entity);
        const exists = state.ids.includes(id);
        
        state.entities[id] = entity;
        
        if (!exists) {
          state.ids.push(id);
        }
      });
      
      if (sortComparer) {
        state.ids.sort((a: any, b: any) => sortComparer(state.entities[a], state.entities[b]));
      }
    },
    
    /**
     * 获取Selectors
     */
    getSelectors: () => {
      return {
        selectIds: (state: any) => state.ids,
        selectEntities: (state: any) => state.entities,
        selectAll: (state: any) => state.ids.map((id: any) => state.entities[id]),
        selectTotal: (state: any) => state.ids.length,
        selectById: (state: any, id: any) => state.entities[id]
      };
    }
  };
}

/**
 * 批量处理中间件
 */
export function batchMiddleware<T>(): Middleware<T> {
  return () => next => action => {
    if (Array.isArray(action)) {
      return action.map(a => next(a));
    }
    return next(action);
  };
}

/**
 * 日志中间件
 */
export function loggerMiddleware<T>(): Middleware<T> {
  return _store => next => action => {
    console.log('dispatching action:', action);
    const result = next(action);
    console.log('next state:', _store.getState());
    return result;
  };
}

/**
 * 错误处理中间件
 */
export function errorMiddleware<T>(): Middleware<T> {
  return _store => next => action => {
    try {
      return next(action);
    } catch (error) {
      console.error('Unhandled action error:', error);
      console.error('Action:', action);
      throw error;
    }
  };
}

/**
 * 事件总线中间件
 */
export function eventBusMiddleware<T>(prefix: string = ''): Middleware<T> {
  return () => next => action => {
    const result = next(action);
    
    const eventName = prefix ? `${prefix}:${action.type}` : action.type;
    eventBus.emit(eventName, { action, result });
    
    return result;
  };
}

// Node.js环境兼容性处理
