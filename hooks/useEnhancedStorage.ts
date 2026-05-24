"use client"

/**
 * @file 增强版存储Hook
 * @description 提供带有TTL、同步功能的持久化存储解决方案
 * @module hooks/useEnhancedStorage
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-12
 * @updated 2024-11-12
 */

import { useState, useEffect, useCallback } from 'react';
import { EnhancedStorage } from '../lib/utils/enhancedStorage';

/**
 * 增强存储Hook
 * @param key 存储键名
 * @param initialValue 初始值
 * @param options 配置选项
 * @returns 存储操作相关的状态和方法
 */
export function useEnhancedStorage<T>(
  key: string,
  initialValue: T,
  options?: {
    ttl?: number;
    sync?: boolean;
  }
) {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [error, setError] = useState<Error | null>(null);
  
  const { ttl, sync = true } = options || {};

  // 初始化时从存储中读取值
  useEffect(() => {
    try {
      const value = EnhancedStorage.getItem<T>(key);
      if (value !== null) {
        setStoredValue(value);
      } else if (sync) {
        // 如果存储中没有值且需要同步，则保存初始值
        EnhancedStorage.setItem(key, initialValue, ttl);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('未知错误'));
      console.error(`[useEnhancedStorage] 初始化失败 (${key}):`, err);
    }
  }, [key, initialValue, ttl, sync]);

  // 监听存储事件以同步其他标签页的更改
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === key && event.newValue) {
        try {
          const item = JSON.parse(event.newValue);
          // 检查是否过期
          if (!item.expires || Date.now() <= item.expires) {
            setStoredValue(item.value as T);
          } else {
            // 已过期，删除并使用初始值
            EnhancedStorage.removeItem(key);
            setStoredValue(initialValue);
          }
        } catch (err) {
          setError(err instanceof Error ? err : new Error('解析存储值失败'));
        }
      } else if (event.key === key && event.newValue === null) {
        // 值被删除
        setStoredValue(initialValue);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [key, initialValue]);

  // 设置值的函数
  const setValue = useCallback((value: T | ((val: T) => T)) => {
    try {
      // 允许值为函数
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      
      // 更新状态
      setStoredValue(valueToStore);
      
      // 保存到存储
      const success = EnhancedStorage.setItem(key, valueToStore, ttl);
      if (!success) {
        throw new Error('存储失败');
      }
      
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('设置值失败'));
      console.error(`[useEnhancedStorage] 设置值失败 (${key}):`, err);
    }
  }, [key, storedValue, ttl]);

  // 删除值的函数
  const removeValue = useCallback(() => {
    try {
      EnhancedStorage.removeItem(key);
      setStoredValue(initialValue);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('删除值失败'));
      console.error(`[useEnhancedStorage] 删除值失败 (${key}):`, err);
    }
  }, [key, initialValue]);

  // 检查是否过期
  const isExpired = useCallback(() => {
    const itemStr = typeof window !== 'undefined' ? localStorage.getItem(key) : null;
    if (!itemStr) return false;
    
    try {
      const item = JSON.parse(itemStr);
      return item.expires && Date.now() > item.expires;
    } catch {
      return false;
    }
  }, [key]);

  return {
    value: storedValue,
    setValue,
    removeValue,
    error,
    isExpired,
    // 提供直接访问EnhancedStorage的方法
    storageStats: EnhancedStorage.getStorageStats,
    exportData: EnhancedStorage.exportData,
    importData: EnhancedStorage.importData
  };
}

/**
 * 创建一个持久化的状态Hook
 * 与useEnhancedStorage类似，但提供更简洁的接口
 * @param key 存储键名
 * @param initialValue 初始值
 * @param options 配置选项
 * @returns [状态值, 设置状态的函数]
 */
export function usePersistentState<T>(
  key: string,
  initialValue: T,
  options?: {
    ttl?: number;
  }
): [T, (value: T | ((val: T) => T)) => void] {
  const { value, setValue } = useEnhancedStorage(key, initialValue, options);
  return [value, setValue];
}
