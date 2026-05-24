/**
 * @file 历史记录 Hook
 * @description 提供历史记录管理功能和数据同步支持
 * @module hooks/useHistory
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 */

"use client"

import { useState, useEffect, useCallback } from 'react';
import { HistoryManager, HistoryItem } from '../lib/utils/historyManager';
import { useEnhancedStorage } from './useEnhancedStorage';

// 定义存储同步键名
const HISTORY_SYNC_KEY = 'history_sync_event';

/**
 * 历史记录 Hook
 * @param type 可选的历史记录类型筛选
 * @returns 历史记录管理功能和状态
 */
export function useHistory(type?: string) {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  // 使用增强的存储钩子来监听跨标签页的历史记录变化
  const { getItem: getSyncItem, setItem: setSyncItem } = useEnhancedStorage();

  // 初始化历史记录
  const initializeHistory = useCallback(() => {
    try {
      setLoading(true);
      const manager = HistoryManager.getInstance();
      const historyData = manager.getHistory(type);
      setHistory(historyData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('初始化历史记录失败'));
      console.error('[useHistory] 初始化历史记录失败:', err);
    } finally {
      setLoading(false);
    }
  }, [type]);

  // 监听存储事件以实现跨标签页同步
  useEffect(() => {
    // 监听 storage 事件
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === HISTORY_SYNC_KEY && event.newValue) {
        try {
          const syncData = JSON.parse(event.newValue);
          // 只有当同步事件不是由当前页面触发时才更新
          if (!syncData.source || syncData.source !== window.location.href) {
            initializeHistory();
          }
        } catch (err) {
          console.error('[useHistory] 处理同步事件失败:', err);
        }
      }
    };

    // 监听自定义事件（用于同一页面内的同步）
    const handleCustomSync = () => {
      initializeHistory();
    };

    // 添加事件监听器
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener(HISTORY_SYNC_KEY, handleCustomSync);

    // 初始化历史记录
    initializeHistory();

    // 清理事件监听器
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener(HISTORY_SYNC_KEY, handleCustomSync);
    };
  }, [initializeHistory]);

  // 触发同步事件
  const triggerSync = useCallback(() => {
    try {
      // 触发存储事件（用于跨标签页同步）
      const syncData = {
        timestamp: Date.now(),
        source: window.location.href
      };
      setSyncItem(HISTORY_SYNC_KEY, syncData, 1000); // 1秒后过期
      
      // 触发自定义事件（用于同一页面内的同步）
      window.dispatchEvent(new CustomEvent(HISTORY_SYNC_KEY));
    } catch (err) {
      console.error('[useHistory] 触发同步事件失败:', err);
    }
  }, [setSyncItem]);

  /**
   * 添加历史记录项
   * @param item 历史记录项（不包含id和timestamp）
   * @returns 创建的历史记录项
   */
  const addHistoryItem = useCallback((item: Omit<HistoryItem, 'id' | 'timestamp'>): HistoryItem | null => {
    try {
      const manager = HistoryManager.getInstance();
      const newItem = manager.addItem(item);
      
      // 更新本地状态
      setHistory(prev => [newItem, ...prev.filter(i => i.id !== newItem.id).slice(0, 49)]);
      
      // 触发同步
      triggerSync();
      
      return newItem;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('添加历史记录失败'));
      console.error('[useHistory] 添加历史记录失败:', err);
      return null;
    }
  }, [triggerSync]);

  /**
   * 移除历史记录项
   * @param id 要移除的历史记录ID
   * @returns 是否移除成功
   */
  const removeHistoryItem = useCallback((id: string): boolean => {
    try {
      const manager = HistoryManager.getInstance();
      manager.removeItem(id);
      
      // 更新本地状态
      setHistory(prev => prev.filter(item => item.id !== id));
      
      // 触发同步
      triggerSync();
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('移除历史记录失败'));
      console.error('[useHistory] 移除历史记录失败:', err);
      return false;
    }
  }, [triggerSync]);

  /**
   * 清空历史记录
   * @returns 是否清空成功
   */
  const clearHistory = useCallback((): boolean => {
    try {
      const manager = HistoryManager.getInstance();
      manager.clearHistory(type);
      
      // 更新本地状态
      setHistory([]);
      
      // 触发同步
      triggerSync();
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('清空历史记录失败'));
      console.error('[useHistory] 清空历史记录失败:', err);
      return false;
    }
  }, [type, triggerSync]);

  /**
   * 获取单个历史记录项
   * @param id 历史记录ID
   * @returns 历史记录项或undefined
   */
  const getHistoryItem = useCallback((id: string): HistoryItem | undefined => {
    try {
      const manager = HistoryManager.getInstance();
      return manager.getItem(id);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('获取历史记录项失败'));
      console.error('[useHistory] 获取历史记录项失败:', err);
      return undefined;
    }
  }, []);

  /**
   * 导出历史记录
   * @returns 导出的历史记录数据
   */
  const exportHistory = useCallback((): HistoryItem[] => {
    try {
      const manager = HistoryManager.getInstance();
      return manager.exportHistory(type);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('导出历史记录失败'));
      console.error('[useHistory] 导出历史记录失败:', err);
      return [];
    }
  }, [type]);

  /**
   * 导入历史记录
   * @param importedHistory 要导入的历史记录数据
   * @returns 导入成功的记录数量
   */
  const importHistory = useCallback((importedHistory: HistoryItem[]): number => {
    try {
      const manager = HistoryManager.getInstance();
      const importedCount = manager.importHistory(importedHistory);
      
      // 重新初始化历史记录以反映导入的变化
      initializeHistory();
      
      // 触发同步
      triggerSync();
      
      return importedCount;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('导入历史记录失败'));
      console.error('[useHistory] 导入历史记录失败:', err);
      return 0;
    }
  }, [initializeHistory, triggerSync]);

  /**
   * 获取历史记录统计信息
   * @returns 历史记录统计对象
   */
  const getHistoryStats = useCallback(() => {
    try {
      const manager = HistoryManager.getInstance();
      return manager.getStats();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('获取历史记录统计失败'));
      console.error('[useHistory] 获取历史记录统计失败:', err);
      return {
        totalItems: 0,
        byType: {},
        oldestItem: null,
        newestItem: null
      };
    }
  }, []);

  return {
    history,
    loading,
    error,
    addHistoryItem,
    removeHistoryItem,
    clearHistory,
    getHistoryItem,
    exportHistory,
    importHistory,
    getHistoryStats,
    refreshHistory: initializeHistory // 提供手动刷新历史记录的方法
  };
}
