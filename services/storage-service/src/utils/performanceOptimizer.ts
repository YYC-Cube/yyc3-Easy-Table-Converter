/**
 * @file 性能优化工具
 * @description 提供存储服务的性能优化功能
 * @module utils/performanceOptimizer
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-25
 * @updated 2024-11-25
 */

import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { FileDocument } from '../models/File';

// 配置项
export const PERFORMANCE_CONFIG = {
  // 大文件分块阈值 (5MB)
  CHUNK_SIZE_THRESHOLD: 5 * 1024 * 1024,
  // 分块大小 (1MB)
  CHUNK_SIZE: 1 * 1024 * 1024,
  // 并行上传限制
  MAX_PARALLEL_UPLOADS: 5,
  // 内存缓存大小 (100MB)
  MEMORY_CACHE_SIZE: 100 * 1024 * 1024,
  // 是否启用压缩
  ENABLE_COMPRESSION: true,
  // 压缩阈值 (100KB)
  COMPRESSION_THRESHOLD: 100 * 1024,
};

// 内存缓存简单实现
class MemoryCache {
  private cache: Map<string, { data: Buffer; timestamp: number; size: number }> = new Map();
  private totalSize = 0;

  /**
   * 添加缓存项
   */
  set(key: string, data: Buffer): void {
    // 如果缓存已满，清理最旧的项目
    while (this.totalSize + data.length > PERFORMANCE_CONFIG.MEMORY_CACHE_SIZE) {
      this.evictOldest();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      size: data.length,
    });
    this.totalSize += data.length;
  }

  /**
   * 获取缓存项
   */
  get(key: string): Buffer | null {
    const item = this.cache.get(key);
    if (item) {
      // 更新时间戳
      item.timestamp = Date.now();
      return item.data;
    }
    return null;
  }

  /**
   * 检查缓存项是否存在
   */
  has(key: string): boolean {
    return this.cache.has(key);
  }

  /**
   * 删除缓存项
   */
  delete(key: string): void {
    const item = this.cache.get(key);
    if (item) {
      this.totalSize -= item.size;
      this.cache.delete(key);
    }
  }

  /**
   * 清理最旧的缓存项
   */
  private evictOldest(): void {
    let oldestKey = null;
    let oldestTimestamp = Infinity;

    for (const [key, item] of this.cache.entries()) {
      if (item.timestamp < oldestTimestamp) {
        oldestTimestamp = item.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.delete(oldestKey);
    }
  }

  /**
   * 清理过期缓存
   */
  clearExpired(maxAgeMs: number): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > maxAgeMs) {
        this.delete(key);
      }
    }
  }
}

// 导出单例实例
export const memoryCache = new MemoryCache();

/**
 * 并行处理数组项
 */
export async function parallelProcess<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  concurrency: number = PERFORMANCE_CONFIG.MAX_PARALLEL_UPLOADS
): Promise<R[]> {
  const results: R[] = [];
  const queue = [...items];
  const workers: Promise<void>[] = [];

  const processNext = async () => {
    while (queue.length > 0) {
      const item = queue.shift();
      if (item) {
        const result = await processor(item);
        results.push(result);
      }
    }
  };

  // 创建工作线程
  for (let i = 0; i < Math.min(concurrency, items.length); i++) {
    workers.push(processNext());
  }

  await Promise.all(workers);
  return results;
}

/**
 * 检测文件是否过大需要分块
 */
export function shouldUseChunking(fileSize: number): boolean {
  return fileSize > PERFORMANCE_CONFIG.CHUNK_SIZE_THRESHOLD;
}

/**
 * 分割Buffer为块
 */
export function chunkBuffer(buffer: Buffer, chunkSize: number = PERFORMANCE_CONFIG.CHUNK_SIZE): Buffer[] {
  const chunks: Buffer[] = [];
  for (let i = 0; i < buffer.length; i += chunkSize) {
    chunks.push(buffer.slice(i, i + chunkSize));
  }
  return chunks;
}

/**
 * 合并Buffer块
 */
export function mergeChunks(chunks: Buffer[]): Buffer {
  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const result = Buffer.alloc(totalLength);
  let offset = 0;
  
  for (const chunk of chunks) {
    chunk.copy(result, offset);
    offset += chunk.length;
  }
  
  return result;
}

/**
 * 检查文件路径是否安全（防止路径遍历攻击）
 */
export function isSafeFilePath(basePath: string, filePath: string): boolean {
  const resolvedPath = path.resolve(basePath, filePath);
  return resolvedPath.startsWith(basePath);
}

/**
 * 安全地创建目录
 */
export async function safeMkdir(dirPath: string): Promise<void> {
  try {
    if (!fs.existsSync(dirPath)) {
      await promisify(fs.mkdir)(dirPath, { recursive: true });
    }
  } catch (error) {
    console.error(`❌ 目录创建失败: ${dirPath}`, error);
    throw new Error('目录创建失败');
  }
}

/**
 * 生成文件访问统计信息
 */
export function generateFileStats(files: FileDocument[]): {
  totalFiles: number;
  totalSize: number;
  avgSize: number;
  storageTypeDistribution: Record<string, number>;
  formatDistribution: Record<string, number>;
} {
  const totalFiles = files.length;
  const totalSize = files.reduce((sum, file) => sum + file.size, 0);
  const avgSize = totalFiles > 0 ? totalSize / totalFiles : 0;
  
  const storageTypeDistribution: Record<string, number> = {};
  const formatDistribution: Record<string, number> = {};
  
  files.forEach(file => {
    // 统计存储类型分布
    storageTypeDistribution[file.storageType] = 
      (storageTypeDistribution[file.storageType] || 0) + 1;
    
    // 统计文件格式分布
    formatDistribution[file.format] = 
      (formatDistribution[file.format] || 0) + 1;
  });
  
  return {
    totalFiles,
    totalSize,
    avgSize,
    storageTypeDistribution,
    formatDistribution
  };
}

/**
 * 限流装饰器
 */
export function rateLimit<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  ms: number
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  let lastCall = 0;
  
  return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    const now = Date.now();
    const timeSinceLastCall = now - lastCall;
    
    if (timeSinceLastCall < ms) {
      await new Promise(resolve => setTimeout(resolve, ms - timeSinceLastCall));
    }
    
    lastCall = Date.now();
    return fn(...args);
  };
}

/**
 * 重试装饰器
 */
export function retry<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  maxRetries: number = 3,
  delayMs: number = 1000
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn(...args);
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < maxRetries) {
          const backoffTime = delayMs * Math.pow(2, attempt);
          console.warn(`⚠️ 操作失败，${backoffTime}ms后重试 (${attempt + 1}/${maxRetries})`, error);
          await new Promise(resolve => setTimeout(resolve, backoffTime));
        }
      }
    }
    
    throw lastError;
  };
}
