/**
 * @file React响应式UI钩子
 * @description 提供React与响应式UI系统集成的钩子
 * @module industries/frontend-driver/hooks/useReactive
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-26
 */

import React, { useState, useEffect, useCallback, useRef, useMemo, useDebugValue } from 'react';
import {
  ReactiveState,
  ComputedState,
  ReactiveEffect,
  createState,
  createComputed,
  createEffect,
  batch,
  ReactiveStateOptions
} from '../utils/ReactiveUIManager';

/**
 * 响应式状态钩子 - 包装ReactiveState以在React组件中使用
 */
export function useReactiveState<T>(
  initialValue: T | (() => T),
  options?: ReactiveStateOptions<T>
): ReactiveState<T> {
  // 使用useMemo创建响应式状态，确保状态实例在组件重新渲染时保持一致
  const state = useMemo(() => {
    const value = typeof initialValue === 'function' 
      ? (initialValue as () => T)() 
      : initialValue;
    return createState<T>(value, options);
  }, []);

  // 使用useDebugValue在React开发工具中显示状态值
  useDebugValue(state.value);

  return state;
}

/**
 * 响应式引用钩子 - 创建类似React ref的响应式引用
 */
export function useReactiveRef<T>(initialValue: T): ReactiveState<T> {
  return useReactiveState<T>(initialValue, { name: 'useReactiveRef' });
}

// 深度相等比较函数
function deepEqual(a: any, b: any): boolean {
  // 如果引用相同，直接返回true
  if (a === b) return true;
  
  // 处理null和undefined情况
  if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') {
    return a === b;
  }
  
  // 数组比较
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, index) => deepEqual(item, b[index]));
  }
  
  // 对象比较
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  
  if (keysA.length !== keysB.length) return false;
  
  // 比较每个键对应的值
  for (const key of keysA) {
    if (!keysB.includes(key)) return false;
    if (!deepEqual(a[key], b[key])) return false;
  }
  
  return true;
}

/**
 * 响应式对象钩子 - 创建响应式对象状态（使用深度相等比较）
 */
export function useReactiveObject<T extends object>(initialValue: T): ReactiveState<T> {
  return useReactiveState<T>(initialValue, {
    equals: deepEqual,
    name: 'useReactiveObject'
  });
}

// 静态方法 - 深度相等比较
(useReactiveObject as any).equals = deepEqual;

/**
 * 响应式数组钩子 - 创建响应式数组状态
 */
export function useReactiveArray<T>(initialValue: T[] = []): ReactiveState<T[]> {
  return useReactiveState<T[]>(initialValue, {
    equals: deepEqual,
    name: 'useReactiveArray'
  });
}

/**
 * 计算状态钩子 - 创建依赖响应式状态的计算属性
 */
export function useReactiveComputed<T>(
  computeFn: () => T,
  dependencies: any[] = []
): ComputedState<T> {
  // 使用useMemo创建计算状态，依赖项变化时重新创建
  const computedState = useMemo(() => {
    return createComputed<T>(computeFn);
  }, dependencies);

  // 使用useDebugValue在React开发工具中显示计算值
  useDebugValue(computedState.value);

  return computedState;
}

/**
 * 副作用钩子 - 在组件中创建响应式副作用
 */
export function useReactiveEffect(
  effectFn: () => (void | (() => void)),
  dependencies: any[] = []
): ReactiveEffect {
  // 使用useRef存储effect实例
  const effectRef = useRef<ReactiveEffect>();
  
  // 使用useCallback包装effectFn，确保依赖项变化时函数引用更新
  const wrappedEffectFn = useCallback(() => {
    // 执行原始effect函数，捕获可能的清理函数
    const cleanupFn = effectFn();
    
    // 返回清理函数
    return () => {
      if (typeof cleanupFn === 'function') {
        cleanupFn();
      }
    };
  }, dependencies);

  // 使用useMemo创建effect
  const effect = useMemo(() => {
    return createEffect(wrappedEffectFn, { 
      name: 'useReactiveEffect',
      onError: (error) => {
        console.error('Error in useReactiveEffect:', error);
      }
    });
  }, [wrappedEffectFn]);

  // 保存effect实例到ref
  useEffect(() => {
    effectRef.current = effect;
  }, [effect]);

  // 组件卸载时销毁effect
  useEffect(() => {
    return () => {
      if (effectRef.current) {
        effectRef.current.destroy();
      }
    };
  }, []);

  return effect;
}

/**
 * 响应式订阅钩子 - 订阅响应式状态的变化并在组件中使用
 */
export function useReactiveSubscribe<T>(
  state: ReactiveState<T> | ComputedState<T>,
  initialValue?: T
): T {
  // 使用useState保存状态值，确保组件在状态变化时重新渲染
  const [value, setValue] = useState<T>(() => {
    try {
      // 尝试获取状态的当前值
      return 'get' in state ? state.get() : (state as any).value;
    } catch {
      // 如果失败，使用初始值
      return initialValue as T;
    }
  });

  // 使用useEffect订阅状态变化
  useEffect(() => {
    // 创建订阅函数
    const updateValue = () => {
      try {
        const newValue = 'get' in state ? state.get() : (state as any).value;
        setValue(newValue);
      } catch (error) {
        console.error('Error in useReactiveSubscribe:', error);
      }
    };

    // 立即更新一次值
    updateValue();

    // 订阅状态变化
    const unsubscribe = 'subscribe' in state 
      ? state.subscribe(updateValue) 
      : undefined;

    // 组件卸载时取消订阅
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [state]);

  return value;
}

/**
 * 批处理钩子 - 在组件中使用响应式批处理
 */
export function useReactiveBatch() {
  // 使用useCallback返回批处理函数，确保函数引用稳定
  return useCallback((fn: () => void) => {
    batch(fn);
  }, []);
}

/**
 * 防抖状态钩子 - 创建带有防抖功能的响应式状态
 */
export function useDebouncedState<T>(
  initialValue: T,
  delay: number,
  options?: ReactiveStateOptions<T>
): ReactiveState<T> {
  return useReactiveState<T>(initialValue, {
    ...options,
    debounce: delay,
    name: `useDebouncedState(${delay}ms)`
  });
}

/**
 * 节流状态钩子 - 创建带有节流功能的响应式状态
 */
export function useThrottledState<T>(
  initialValue: T,
  delay: number,
  options?: ReactiveStateOptions<T>
): ReactiveState<T> {
  return useReactiveState<T>(initialValue, {
    ...options,
    throttle: delay,
    name: `useThrottledState(${delay}ms)`
  });
}

/**
 * 响应式状态转换钩子 - 将响应式状态转换为另一种格式
 */
export function useReactiveTransform<T, U>(
  source: ReactiveState<T> | ComputedState<T>,
  transformFn: (value: T) => U,
  dependencies: any[] = []
): U {
    // 使用计算状态进行转换
    const computedValue = useReactiveComputed(
      () => {
        const sourceValue = 'get' in source ? source.get() : (source as any).value;
        return transformFn(sourceValue);
      }, [source, ...dependencies]);
    
    // 订阅计算值，确保组件更新
    return useReactiveSubscribe(computedValue);
  }

/**
 * 响应式状态历史钩子 - 跟踪响应式状态的变更历史
 */
export function useReactiveHistory<T>(
  state: ReactiveState<T>,
  maxLength: number = 100
): { history: T[][]; undo: () => void; redo: () => void; clear: () => void } {
  // 保存历史记录的状态
  const history = useReactiveArray<T[]>([]);
  const position = useReactiveState<number>(-1);

  // 订阅源状态变化，记录历史
  useEffect(() => {
    const unsubscribe = state.subscribe((newValue: T) => {
      // 获取当前历史记录
      const currentHistory = history.value;
      
      // 如果当前位置不是最后一个，截断历史
      if (position.value < currentHistory.length - 1) {
        currentHistory.length = position.value + 1;
      }
      
      // 添加新记录
      currentHistory.push([...(newValue as any)]);
      
      // 保持最大长度
      if (currentHistory.length > maxLength) {
        currentHistory.shift();
      } else {
        position.set(currentHistory.length - 1);
      }
    });

    return unsubscribe;
  }, [state, maxLength]);

  // 撤销操作
  const undo = useCallback(() => {
    if (position.value > 0) {
      position.set(position.value - 1);
      state.set(history.value[position.value] as any);
    }
  }, [state, position, history]);

  // 重做操作
  const redo = useCallback(() => {
    if (position.value < history.value.length - 1) {
      position.set(position.value + 1);
      state.set(history.value[position.value] as any);
    }
  }, [state, position, history]);

  // 清除历史
  const clear = useCallback(() => {
    history.set([]);
    position.set(-1);
  }, [history, position]);

  return {
    history: history.value,
    undo,
    redo,
    clear
  };
}

/**
 * 响应式表单钩子 - 创建支持表单验证的响应式表单状态
 */
export function useReactiveForm<T extends Record<string, any>>(
  initialValues: T,
  validateFn?: (values: T) => Record<keyof T, string[]>
): {
  values: ReactiveState<T>;
  errors: ReactiveState<Record<keyof T, string[]>>;
  isValid: ReactiveState<boolean>;
  setValue: (field: keyof T, value: any) => void;
  setValues: (newValues: Partial<T>) => void;
  validate: () => boolean;
  reset: () => void;
} {
  // 创建表单值状态
  const values = useReactiveObject<T>(initialValues);
  
  // 创建错误状态
  const errors = useReactiveObject<Record<keyof T, string[]>>({
    ...(Object.fromEntries(Object.keys(initialValues).map(key => [key, []])) as unknown as Record<keyof T, string[]>)
  });
  
  // 创建验证状态
  const isValid = useReactiveState<boolean>(true);

  // 验证函数
  const validate = useCallback(() => {
    if (!validateFn) return true;
    
    const validationErrors = validateFn(values.value);
    errors.set(validationErrors);
    
    // 检查是否有错误
    const hasErrors = Object.values(validationErrors).some(messages => messages.length > 0);
    isValid.set(!hasErrors);
    
    return !hasErrors;
  }, [values, errors, isValid, validateFn]);

  // 设置单个字段值
  const setValue = useCallback((field: keyof T, value: any) => {
    values.update(prev => ({ ...prev, [field]: value }));
  }, [values]);

  // 设置多个字段值
  const setValues = useCallback((newValues: Partial<T>) => {
    values.update(prev => ({ ...prev, ...newValues }));
  }, [values]);

  // 重置表单
  const reset = useCallback(() => {
    values.set(initialValues);
    errors.set((Object.fromEntries(Object.keys(initialValues).map(key => [key, []])) as unknown) as Record<keyof T, string[]>);
    isValid.set(true);
  }, [values, errors, isValid, initialValues]);

  // 当表单值变化时自动验证
  useEffect(() => {
    validate();
  }, [values.value, validate]);

  return {
    values,
    errors,
    isValid,
    setValue,
    setValues,
    validate,
    reset
  };
}

/**
 * 响应式条件渲染钩子 - 根据响应式状态条件渲染组件
 */
export function useReactiveConditional<T>(
  condition: ReactiveState<boolean> | ComputedState<boolean>,
  renderWhenTrue: () => T,
  renderWhenFalse: () => T
): T {
  // 获取条件值
  const isTrue = useReactiveSubscribe(condition);
  
  // 根据条件渲染
  return isTrue ? renderWhenTrue() : renderWhenFalse();
}

/**
 * 响应式列表渲染钩子 - 高效渲染响应式数组
 */
export function useReactiveList<T, U>(
  items: ReactiveState<T[]> | ComputedState<T[]>,
  renderFn: (item: T, index: number) => U,
  keyFn: (item: T, index: number) => string = (_, index) => index.toString()
): Record<string, U> {
  // 获取列表项
  const listItems = useReactiveSubscribe(items);
  
  // 使用useMemo进行高效渲染
  return useMemo(() => {
    return listItems.reduce<Record<string, U>>((result, item, index) => {
      const key = keyFn(item, index);
      result[key] = renderFn(item, index);
      return result;
    }, {});
  }, [listItems, renderFn, keyFn]);
}

/**
 * 响应式状态加载钩子 - 处理异步加载状态
 */
export function useReactiveLoading<T>(
  loadFn: () => Promise<T>,
  initialValue?: T,
  options?: {
    autoLoad?: boolean;
    dependencies?: any[];
  }
): {
  data: ReactiveState<T | undefined>;
  loading: ReactiveState<boolean>;
  error: ReactiveState<Error | undefined>;
  load: () => Promise<T>;
  reload: () => Promise<T>;
  reset: () => void;
} {
  // 创建状态
  const data = useReactiveState<T | undefined>(initialValue);
  const loading = useReactiveState<boolean>(false);
  const error = useReactiveState<Error | undefined>(undefined);
  
  // 加载函数
  const load = useCallback(async (): Promise<T> => {
    try {
      loading.set(true);
      error.set(undefined);
      
      const result = await loadFn();
      data.set(result);
      
      return result;
    } catch (err) {
      error.set(err instanceof Error ? err : new Error(String(err)));
      throw err;
    } finally {
      loading.set(false);
    }
  }, [loadFn, data, loading, error]);

  // 自动加载
  const deps = options?.dependencies || [];
  useEffect(() => {
    if (options?.autoLoad !== false) {
      load();
    }
  }, deps);

  // 重置状态
  const reset = useCallback(() => {
    data.set(initialValue);
    error.set(undefined);
  }, [data, error, initialValue]);

  return {
    data,
    loading,
    error,
    load,
    reload: load,
    reset
  };
}

/**
 * 响应式状态持久化钩子 - 将响应式状态持久化到本地存储
 */
export function useReactivePersist<T>(
  key: string,
  initialValue: T,
  options?: {
    storage?: Storage;
    serializer?: { 
      serialize: (value: T) => string;
      deserialize: (str: string) => T;
    };
    debounce?: number;
  }
): ReactiveState<T> {
  // 获取存储和序列化器
  const storage = options?.storage || localStorage;
  const serializer = options?.serializer || {
    serialize: JSON.stringify,
    deserialize: JSON.parse
  };
  
  // 从存储加载初始值
  const loadInitialValue = useCallback((): T => {
    try {
      const stored = storage.getItem(key);
      if (stored !== null) {
        return serializer.deserialize(stored);
      }
    } catch (error) {
      console.error(`Error loading persisted state for key "${key}":`, error);
    }
    return initialValue;
  }, [key, storage, serializer, initialValue]);

  // 创建状态
  const state = useReactiveState<T>(loadInitialValue, {
    ...(options?.debounce !== undefined && { debounce: options.debounce }),
    name: `useReactivePersist(${key})`
  });

  // 订阅状态变化，保存到存储
  useEffect(() => {
    const unsubscribe = state.subscribe((value: T) => {
      try {
        storage.setItem(key, serializer.serialize(value));
      } catch (error) {
        console.error(`Error saving persisted state for key "${key}":`, error);
      }
    });

    return unsubscribe;
  }, [key, state, storage, serializer]);

  return state;
}

/**
 * 响应式组件包装器 - 将普通组件转换为响应式组件
 */
export function withReactiveProps<P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    memoize?: boolean;
  }
): React.FC<P> {
  const WrappedComponent: React.FC<P> = (props) => {
    return <Component {...props} />;
  };

  WrappedComponent.displayName = `withReactiveProps(${Component.displayName || Component.name})`;

  if (options?.memoize !== false) {
    return React.memo(WrappedComponent);
  }

  return WrappedComponent;
}

/**
 * 响应式上下文钩子 - 创建响应式状态的React上下文
 */
export function createReactiveContext<T>(
  defaultValue: T,
  options?: ReactiveStateOptions<T>
): {
  Provider: React.FC<{ value?: T; children: React.ReactNode }>;
  useContext: () => ReactiveState<T>;
  useContextValue: () => T;
} {
  // 创建普通React上下文
  const ReactContext = React.createContext<ReactiveState<T> | undefined>(undefined);

  // Provider组件
  const Provider: React.FC<{ value?: T; children: React.ReactNode }> = ({ value: providerValue, children }) => {
    // 创建或使用提供的值作为响应式状态
    const state = useReactiveState<T>(
      providerValue !== undefined ? providerValue : defaultValue,
      options
    );

    return (
      <ReactContext.Provider value={state}>
        {children}
      </ReactContext.Provider>
    );
  };

  // 自定义hook以使用上下文
  const useContext = (): ReactiveState<T> => {
    const context = React.useContext(ReactContext);
    
    if (!context) {
      throw new Error('useReactiveContext must be used within a ReactiveContext.Provider');
    }
    
    return context;
  };

  // 自定义hook以直接使用上下文值
  const useContextValue = (): T => {
    const context = useContext();
    return useReactiveSubscribe(context);
  };

  return {
    Provider,
    useContext,
    useContextValue
  };
}