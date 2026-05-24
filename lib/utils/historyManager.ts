/**
 * @file 历史记录管理器
 * @description 保存转换历史，支持快速重用和增强的存储功能
 * @module lib/utils/historyManager
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 */

import { EnhancedStorage } from './enhancedStorage';

export interface HistoryItem {
  id: string;
  type: "table" | "image" | "base64" | "color" | "unit" | "json-xml" | "timestamp" | string;
  timestamp: number;
  input: {
    format?: string;
    value?: string;
    fileName?: string;
  };
  output: {
    format?: string;
    value?: string;
  };
  settings?: Record<string, any>;
}

const STORAGE_KEY = "converter_history";
const MAX_HISTORY_ITEMS = 50;
const HISTORY_TTL = 30 * 24 * 60 * 60 * 1000; // 30天过期

export class HistoryManager {
  private static instance: HistoryManager;
  private history: HistoryItem[] = [];

  private constructor() {
    this.loadFromStorage();
  }

  static getInstance(): HistoryManager {
    if (!HistoryManager.instance) {
      HistoryManager.instance = new HistoryManager();
    }
    return HistoryManager.instance;
  }

  /**
   * 添加历史记录项
   * @param item 历史记录项（不包含id和timestamp）
   * @returns 创建的历史记录项
   */
  addItem(item: Omit<HistoryItem, "id" | "timestamp">): HistoryItem {
    const newItem: HistoryItem = {
      ...item,
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      timestamp: Date.now(),
    };

    this.history.unshift(newItem);

    // 限制历史记录数量
    if (this.history.length > MAX_HISTORY_ITEMS) {
      this.history = this.history.slice(0, MAX_HISTORY_ITEMS);
    }

    this.saveToStorage();
    return newItem;
  }

  /**
   * 获取历史记录
   * @param type 可选的历史记录类型筛选
   * @returns 符合条件的历史记录数组
   */
  getHistory(type?: string): HistoryItem[] {
    if (type) {
      return this.history.filter((item) => item.type === type);
    }
    return this.history;
  }

  /**
   * 根据ID获取历史记录项
   * @param id 历史记录ID
   * @returns 历史记录项或undefined
   */
  getItem(id: string): HistoryItem | undefined {
    return this.history.find((item) => item.id === id);
  }

  /**
   * 移除历史记录项
   * @param id 要移除的历史记录ID
   */
  removeItem(id: string): void {
    this.history = this.history.filter((item) => item.id !== id);
    this.saveToStorage();
  }

  /**
   * 清空历史记录
   * @param type 可选的历史记录类型筛选，不提供则清空所有
   */
  clearHistory(type?: string): void {
    if (type) {
      this.history = this.history.filter((item) => item.type !== type);
    } else {
      this.history = [];
    }
    this.saveToStorage();
  }

  /**
   * 从存储加载历史记录
   */
  private loadFromStorage(): void {
    if (typeof window === "undefined") return;

    try {
      const stored = EnhancedStorage.getItem<HistoryItem[]>(STORAGE_KEY);
      if (stored && Array.isArray(stored)) {
        // 过滤掉可能无效的历史记录项
        this.history = stored.filter(item => 
          item.id && item.type && item.timestamp && item.input && item.output
        );
      }
    } catch (error) {
      console.error("[HistoryManager] 加载历史记录失败:", error);
      // 尝试迁移旧数据格式
      this.tryMigrateOldData();
    }
  }

  /**
   * 保存历史记录到存储
   */
  private saveToStorage(): void {
    if (typeof window === "undefined") return;

    try {
      const success = EnhancedStorage.setItem(STORAGE_KEY, this.history, HISTORY_TTL);
      if (!success) {
        console.error("[HistoryManager] 保存历史记录失败: 存储容量不足");
      }
    } catch (error) {
      console.error("[HistoryManager] 保存历史记录失败:", error);
    }
  }

  /**
   * 尝试迁移旧版存储格式的数据
   */
  private tryMigrateOldData(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const oldHistory = JSON.parse(stored);
        if (Array.isArray(oldHistory)) {
          this.history = oldHistory;
          this.saveToStorage();
          console.log("[HistoryManager] 成功迁移旧版历史记录");
        }
      }
    } catch (migrateError) {
      console.error("[HistoryManager] 迁移旧版数据失败:", migrateError);
      this.history = []; // 重置历史记录以避免持续错误
    }
  }

  /**
   * 导出历史记录
   * @param type 可选的历史记录类型筛选
   * @returns 导出的历史记录数据
   */
  exportHistory(type?: string): HistoryItem[] {
    return this.getHistory(type);
  }

  /**
   * 导入历史记录
   * @param importedHistory 要导入的历史记录数据
   * @returns 导入成功的记录数量
   */
  importHistory(importedHistory: HistoryItem[]): number {
    if (!Array.isArray(importedHistory)) return 0;

    let importedCount = 0;
    
    importedHistory.forEach(item => {
      // 验证导入的数据
      if (item.type && item.timestamp && item.input && item.output) {
        // 生成新ID以避免冲突
        const newItem: HistoryItem = {
          ...item,
          id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        };
        
        this.history.unshift(newItem);
        importedCount++;
      }
    });

    // 限制历史记录数量
    if (this.history.length > MAX_HISTORY_ITEMS) {
      this.history = this.history.slice(0, MAX_HISTORY_ITEMS);
    }

    this.saveToStorage();
    return importedCount;
  }

  /**
   * 获取历史记录统计信息
   * @returns 历史记录统计对象
   */
  getStats(): {
    totalItems: number;
    byType: Record<string, number>;
    oldestItem: number | null;
    newestItem: number | null;
  } {
    const byType: Record<string, number> = {};
    let oldestTimestamp: number | null = null;
    let newestTimestamp: number | null = null;

    this.history.forEach(item => {
      // 统计类型
      byType[item.type] = (byType[item.type] || 0) + 1;
      
      // 检查时间戳
      if (oldestTimestamp === null || item.timestamp < oldestTimestamp) {
        oldestTimestamp = item.timestamp;
      }
      if (newestTimestamp === null || item.timestamp > newestTimestamp) {
        newestTimestamp = item.timestamp;
      }
    });

    return {
      totalItems: this.history.length,
      byType,
      oldestItem: oldestTimestamp,
      newestItem: newestTimestamp
    };
  }
}
