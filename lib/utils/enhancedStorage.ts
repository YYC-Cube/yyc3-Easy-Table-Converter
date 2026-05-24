/**
 * @file 增强的本地存储管理器
 * @description 提供更强大的本地存储功能，包括错误处理、容量监控和数据管理
 * @module lib/utils/enhancedStorage
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 */

/**
 * 增强的本地存储管理器类
 * 提供更健壮的localStorage操作，包含容量监控和错误处理
 */
export class EnhancedStorage {
  private static readonly DEFAULT_TTL: number = 7 * 24 * 60 * 60 * 1000; // 默认7天
  private static readonly STORAGE_INFO_KEY: string = 'enhanced_storage_info';
  
  /**
   * 存储数据到localStorage
   * @param key 存储键名
   * @param value 要存储的值
   * @param ttl 可选的过期时间(毫秒)
   * @returns 是否存储成功
   */
  static setItem<T>(key: string, value: T, ttl?: number): boolean {
    if (typeof window === 'undefined') {
      return false;
    }

    try {
      const item = {
        value,
        timestamp: Date.now(),
        expires: ttl ? Date.now() + ttl : undefined
      };

      localStorage.setItem(key, JSON.stringify(item));
      this.updateStorageInfo(key, item);
      return true;
    } catch (error) {
      console.error(`[EnhancedStorage] 存储数据失败 (${key}):`, error);
      // 尝试清理空间
      if (this.isStorageFull()) {
        this.evictOldestItems();
        try {
          const item = {
            value,
            timestamp: Date.now(),
            expires: ttl ? Date.now() + ttl : undefined
          };
          localStorage.setItem(key, JSON.stringify(item));
          this.updateStorageInfo(key, item);
          return true;
        } catch (retryError) {
          console.error(`[EnhancedStorage] 重试存储失败 (${key}):`, retryError);
        }
      }
      return false;
    }
  }

  /**
   * 从localStorage获取数据
   * @param key 存储键名
   * @returns 存储的值或null（如果不存在或已过期）
   */
  static getItem<T>(key: string): T | null {
    if (typeof window === 'undefined') {
      return null;
    }

    try {
      const itemStr = localStorage.getItem(key);
      if (!itemStr) return null;

      const item = JSON.parse(itemStr);
      
      // 检查是否过期
      if (item.expires && Date.now() > item.expires) {
        this.removeItem(key);
        return null;
      }

      return item.value as T;
    } catch (error) {
      console.error(`[EnhancedStorage] 获取数据失败 (${key}):`, error);
      return null;
    }
  }

  /**
   * 从localStorage移除数据
   * @param key 存储键名
   */
  static removeItem(key: string): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      localStorage.removeItem(key);
      this.removeStorageInfo(key);
    } catch (error) {
      console.error(`[EnhancedStorage] 移除数据失败 (${key}):`, error);
    }
  }

  /**
   * 清空所有存储数据
   */
  static clear(): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      localStorage.clear();
      // 重新设置存储信息键
      localStorage.setItem(this.STORAGE_INFO_KEY, JSON.stringify({ items: {} }));
    } catch (error) {
      console.error('[EnhancedStorage] 清空数据失败:', error);
    }
  }

  /**
   * 检查存储是否已满
   * @returns 存储是否已满
   */
  private static isStorageFull(): boolean {
    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return false;
    } catch (e) {
      return true;
    }
  }

  /**
   * 驱逐最旧的数据项以腾出空间
   */
  private static evictOldestItems(): void {
    const storageInfo = this.getStorageInfo();
    const keys = Object.keys(storageInfo.items);
    
    // 按时间戳排序，删除最旧的5个项目
    keys.sort((a, b) => {
      return (storageInfo.items[a]?.timestamp || 0) - (storageInfo.items[b]?.timestamp || 0);
    });
    
    const itemsToRemove = keys.slice(0, 5);
    itemsToRemove.forEach(key => {
      localStorage.removeItem(key);
      delete storageInfo.items[key];
    });
    
    localStorage.setItem(this.STORAGE_INFO_KEY, JSON.stringify(storageInfo));
  }

  /**
   * 获取存储信息
   * @returns 存储信息对象
   */
  private static getStorageInfo(): { items: Record<string, { size: number, timestamp: number }> } {
    try {
      const infoStr = localStorage.getItem(this.STORAGE_INFO_KEY);
      return infoStr ? JSON.parse(infoStr) : { items: {} };
    } catch {
      return { items: {} };
    }
  }

  /**
   * 更新存储信息
   * @param key 存储键名
   * @param item 存储的项目
   */
  private static updateStorageInfo(key: string, item: any): void {
    try {
      const info = this.getStorageInfo();
      const itemSize = new Blob([JSON.stringify(item)]).size;
      
      info.items[key] = {
        size: itemSize,
        timestamp: item.timestamp
      };
      
      localStorage.setItem(this.STORAGE_INFO_KEY, JSON.stringify(info));
    } catch (error) {
      // 存储信息更新失败时静默忽略
    }
  }

  /**
   * 移除存储信息
   * @param key 存储键名
   */
  private static removeStorageInfo(key: string): void {
    try {
      const info = this.getStorageInfo();
      delete info.items[key];
      localStorage.setItem(this.STORAGE_INFO_KEY, JSON.stringify(info));
    } catch (error) {
      // 存储信息更新失败时静默忽略
    }
  }

  /**
   * 获取存储使用统计信息
   * @returns 存储统计对象
   */
  static getStorageStats(): {
    itemCount: number;
    estimatedSize: number;
    percentUsed: number;
  } {
    if (typeof window === 'undefined') {
      return { itemCount: 0, estimatedSize: 0, percentUsed: 0 };
    }

    try {
      const info = this.getStorageInfo();
      const itemCount = Object.keys(info.items).length;
      const estimatedSize = Object.values(info.items).reduce((total, item) => total + item.size, 0);
      
      // 估算localStorage容量(通常为5MB)
      const maxSize = 5 * 1024 * 1024;
      const percentUsed = Math.min(100, (estimatedSize / maxSize) * 100);
      
      return { itemCount, estimatedSize, percentUsed };
    } catch {
      return { itemCount: 0, estimatedSize: 0, percentUsed: 0 };
    }
  }

  /**
   * 导出存储的数据
   * @param keys 可选的要导出的键数组，不提供则导出所有
   * @returns 导出的数据对象
   */
  static exportData(keys?: string[]): Record<string, any> {
    if (typeof window === 'undefined') {
      return {};
    }

    try {
      const exportData: Record<string, any> = {};
      const allKeys = keys || Object.keys(localStorage);
      
      allKeys.forEach(key => {
        // 跳过存储信息键
        if (key !== this.STORAGE_INFO_KEY) {
          const item = this.getItem(key);
          if (item !== null) {
            exportData[key] = item;
          }
        }
      });
      
      return exportData;
    } catch (error) {
      console.error('[EnhancedStorage] 导出数据失败:', error);
      return {};
    }
  }

  /**
   * 导入存储的数据
   * @param data 要导入的数据对象
   * @returns 导入成功的键数量
   */
  static importData(data: Record<string, any>): number {
    if (typeof window === 'undefined') {
      return 0;
    }

    let successCount = 0;
    
    try {
      Object.entries(data).forEach(([key, value]) => {
        // 跳过存储信息键
        if (key !== this.STORAGE_INFO_KEY && this.setItem(key, value)) {
          successCount++;
        }
      });
    } catch (error) {
      console.error('[EnhancedStorage] 导入数据失败:', error);
    }
    
    return successCount;
  }
}
