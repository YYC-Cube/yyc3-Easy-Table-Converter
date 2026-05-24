/**
 * @file 数据驱动React Hooks
 * @description 提供在React组件中使用数据驱动机制的Hooks
 * @module industries/frontend-driver/hooks/useDataDriven
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-26
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { DataDrivenManager } from '../core/DataDrivenManager';
import {
  DataModel,
  DataChangeEvent,
  ValidationResult,
  DataDrivenContextType,
  DataDrivenConfig
} from '../types/DataDrivenTypes';

// 数据驱动上下文接口
interface DataDrivenProviderProps<T extends Record<string, any>> {
  model: DataModel;
  initialData: T;
  config?: DataDrivenConfig;
  children: ReactNode;
  onDataChange?: (data: T, event: DataChangeEvent) => void;
  onValidationChange?: (result: ValidationResult) => void;
}

// 创建上下文
const DataDrivenContext = createContext<DataDrivenContextType | null>(null);

/**
 * 数据驱动提供者组件
 * 为子组件提供数据驱动功能
 */
export function DataDrivenProvider<T extends Record<string, any>>({ 
  model, 
  initialData, 
  config = {},
  children,
  onDataChange,
  onValidationChange
}: DataDrivenProviderProps<T>) {
  // 创建数据驱动管理器
  const manager = useMemo(() => {
    return new DataDrivenManager<T>(model, initialData, config);
  }, [model, initialData, JSON.stringify(config)]);

  // 状态管理
  const [data, setData] = useState<T>(manager.getData());
  const [isInitialized, setIsInitialized] = useState(false);

  // 初始化
  useEffect(() => {
    setIsInitialized(true);
    
    // 初始验证
    if (config.autoValidate) {
      const result = manager.validateAll();
      onValidationChange?.(result);
    }

    // 清理函数
    return () => {
      manager.destroy();
    };
  }, []);

  // 监听数据变更
  useEffect(() => {
    const unsubscribe = manager.addChangeListener((event: DataChangeEvent) => {
      const newData = manager.getData();
      setData(newData);
      
      // 触发外部回调
      onDataChange?.(newData, event);
      
      // 自动验证
      if (config.autoValidate) {
        const result = manager.validateAll();
        onValidationChange?.(result);
      }
    });

    return unsubscribe;
  }, [manager, config.autoValidate, onDataChange, onValidationChange]);

  // 更新单个字段
  const updateData = useCallback((field: string, value: any) => {
    manager.updateField(field, value);
  }, [manager]);

  // 批量更新数据
  const batchUpdateData = useCallback((changes: Partial<T>) => {
    manager.batchUpdate(changes);
  }, [manager]);

  // 重置数据
  const resetData = useCallback(() => {
    manager.reset();
  }, [manager]);

  // 验证整个数据模型
  const validateData = useCallback(() => {
    const result = manager.validateAll();
    onValidationChange?.(result);
    return result;
  }, [manager, onValidationChange]);

  // 验证单个字段
  const validateField = useCallback((field: string) => {
    return manager.validateField(field);
  }, [manager]);

  // 获取字段配置
  const getFieldConfig = useCallback((field: string) => {
    return manager.getFieldConfig(field);
  }, [manager]);

  // 上下文值
  const contextValue: DataDrivenContextType<T> = {
    data,
    updateData,
    batchUpdateData,
    resetData,
    validateData,
    validateField,
    getFieldConfig,
    isInitialized
  };

  return (
    <DataDrivenContext.Provider value={contextValue}>
      {children}
    </DataDrivenContext.Provider>
  );
}

/**
 * 使用数据驱动的Hook
 * 在组件中获取数据驱动功能
 */
export function useDataDriven<T = Record<string, any>>(): DataDrivenContextType<T> {
  const context = useContext(DataDrivenContext);
  
  if (!context) {
    throw new Error('useDataDriven must be used within a DataDrivenProvider');
  }
  
  return context as DataDrivenContextType<T>;
}

/**
 * 绑定数据到表单控件的Hook
 * 简化表单控件的数据绑定
 */
export function useDataBinding<T extends Record<string, any>>(fieldName: string) {
  const { data, updateData, validateField, getFieldConfig } = useDataDriven<T>();
  const [errors, setErrors] = useState<string[]>([]);
  
  // 字段配置
  const fieldConfig = getFieldConfig(fieldName);
  const value = data[fieldName];
  
  // 当字段值变化时验证
  useEffect(() => {
    const fieldErrors = validateField(fieldName);
    setErrors(fieldErrors.map(err => err.message));
  }, [value, validateField, fieldName]);
  
  // 处理值变化
  const handleChange = useCallback((newValue: any) => {
    updateData(fieldName, newValue);
  }, [updateData, fieldName]);
  
  return {
    value,
    onChange: handleChange,
    errors,
    hasError: errors.length > 0,
    fieldConfig
  };
}

/**
 * 条件数据绑定Hook
 * 根据条件决定是否启用数据绑定
 */
export function useConditionalDataBinding<T extends Record<string, any>>(
  fieldName: string,
  condition: boolean
) {
  const binding = useDataBinding<T>(fieldName);
  
  return {
    ...binding,
    // 当条件不满足时，禁用更新功能
    onChange: condition ? binding.onChange : () => {},
    disabled: !condition
  };
}

/**
 * 批量数据绑定Hook
 * 一次绑定多个字段
 */
export function useBatchDataBinding<T extends Record<string, any>>(
  fieldNames: string[]
) {
  const { data, batchUpdateData } = useDataDriven<T>();
  const bindings = useMemo(() => {
    const result: Record<string, { value: any; onChange: (value: any) => void }> = {};
    
    fieldNames.forEach(fieldName => {
      result[fieldName] = {
        value: data[fieldName],
        onChange: (value: any) => {
          batchUpdateData({ [fieldName]: value } as Partial<T>);
        }
      };
    });
    
    return result;
  }, [data, batchUpdateData, fieldNames]);
  
  // 批量设置多个字段的值
  const setValues = useCallback((values: Partial<T>) => {
    batchUpdateData(values);
  }, [batchUpdateData]);
  
  return {
    bindings,
    setValues
  };
}

/**
 * 表单数据提交Hook
 * 简化表单提交逻辑
 */
export function useFormSubmit<T extends Record<string, any>>(
  onSubmit: (data: T) => Promise<void> | void
) {
  const { data, validateData } = useDataDriven<T>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  
  // 提交函数
  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);
    
    try {
      // 验证数据
      const validationResult = validateData();
      
      if (!validationResult.isValid) {
        throw new Error('数据验证失败');
      }
      
      // 执行提交
      await onSubmit(data);
      setSubmitSuccess(true);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : '提交失败');
    } finally {
      setIsSubmitting(false);
    }
  }, [data, validateData, onSubmit]);
  
  // 重置提交状态
  const resetSubmitState = useCallback(() => {
    setSubmitError(null);
    setSubmitSuccess(false);
  }, []);
  
  return {
    handleSubmit,
    isSubmitting,
    submitError,
    submitSuccess,
    resetSubmitState
  };
}
