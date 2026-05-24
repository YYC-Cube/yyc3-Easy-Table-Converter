/**
 * @file 性能优化模块
 * @description 提供系统性能优化工具和技术
 * @module performance
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-20
 */

import { Logger } from './PerformanceMonitor';

/**
 * 缓存配置接口
 */
export interface CacheConfig {
  /** 缓存键前缀 */
  keyPrefix?: string;
  /** 缓存默认过期时间（毫秒） */
  defaultTtl?: number;
  /** 最大缓存条目数 */
  maxItems?: number;
  /** 是否启用缓存统计 */
  enableStats?: boolean;
  /** 是否使用LRU策略 */
  useLRU?: boolean;
}

/**
 * 缓存统计信息接口
 */
export interface CacheStats {
  /** 缓存命中率 */
  hitRate: number;
  /** 缓存总访问次数 */
  totalAccesses: number;
  /** 缓存命中次数 */
  hits: number;
  /** 缓存未命中次数 */
  misses: number;
  /** 当前缓存条目数 */
  currentItems: number;
  /** 缓存最大条目数 */
  maxItems: number;
}

/**
 * 缓存条目接口
 */
interface CacheItem<T> {
  /** 缓存值 */
  value: T;
  /** 过期时间戳 */
  expiry: number;
  /** 最后访问时间戳（用于LRU） */
  lastAccess: number;
  /** 访问次数 */
  accessCount: number;
}

/**
 * 缓存类
 * 提供内存缓存功能，支持TTL和LRU策略
 */
export class Cache<T = any> {
  private store: Map<string, CacheItem<T>> = new Map();
  private config: Required<CacheConfig>;
  private stats: {
    totalAccesses: number;
    hits: number;
    misses: number;
  } = {
    totalAccesses: 0,
    hits: 0,
    misses: 0,
  };
  private logger: Logger;

  /**
   * 创建缓存实例
   * @param config 缓存配置
   * @param logger 日志记录器
   */
  constructor(
    config: Partial<CacheConfig> = {},
    logger: Logger = console
  ) {
    this.config = {
      keyPrefix: config.keyPrefix || 'cache:',
      defaultTtl: config.defaultTtl || 3600000, // 默认1小时
      maxItems: config.maxItems || 1000,
      enableStats: config.enableStats !== false,
      useLRU: config.useLRU !== false,
    };
    this.logger = logger;

    // 设置定期清理过期项的定时器
    this.setupCleanup();
  }

  /**
   * 设置定期清理过期项的定时器
   */
  private setupCleanup(): void {
    // 每5分钟清理一次过期项
    setInterval(() => this.cleanup(), 300000);
  }

  /**
   * 清理过期的缓存项
   */
  private cleanup(): void {
    const now = Date.now();
    let removed = 0;

    for (const [key, item] of this.store.entries()) {
      if (item.expiry < now) {
        this.store.delete(key);
        removed++;
      }
    }

    if (removed > 0) {
      this.logger.debug(`缓存清理: 移除了 ${removed} 个过期项`);
    }

    // 如果启用了LRU并且缓存条目数超过最大值的80%，则清理最旧的项
    if (this.config.useLRU && this.store.size > this.config.maxItems * 0.8) {
      this.evictLRU();
    }
  }

  /**
   * 使用LRU策略驱逐最旧的缓存项
   */
  private evictLRU(): void {
    // 按最后访问时间排序
    const sortedItems = Array.from(this.store.entries()).sort(
      ([, a], [, b]) => a.lastAccess - b.lastAccess
    );

    // 计算需要移除的项数
    const itemsToRemove = sortedItems.length - this.config.maxItems;
    if (itemsToRemove > 0) {
      for (let i = 0; i < itemsToRemove; i++) {
        this.store.delete(sortedItems[i][0]);
      }
      this.logger.debug(`LRU缓存驱逐: 移除了 ${itemsToRemove} 个最旧的项`);
    }
  }

  /**
   * 生成带前缀的缓存键
   * @param key 原始键
   * @returns 带前缀的键
   */
  private getKey(key: string): string {
    return `${this.config.keyPrefix}${key}`;
  }

  /**
   * 设置缓存项
   * @param key 缓存键
   * @param value 缓存值
   * @param ttl 过期时间（毫秒）
   */
  set(key: string, value: T, ttl?: number): void {
    const cacheKey = this.getKey(key);
    const now = Date.now();
    const expiry = now + (ttl || this.config.defaultTtl);

    // 检查是否需要清理空间
    if (this.store.size >= this.config.maxItems) {
      this.evictLRU();
    }

    this.store.set(cacheKey, {
      value,
      expiry,
      lastAccess: now,
      accessCount: 0,
    });
  }

  /**
   * 获取缓存项
   * @param key 缓存键
   * @returns 缓存值或undefined（如果不存在或已过期）
   */
  get(key: string): T | undefined {
    const cacheKey = this.getKey(key);
    const now = Date.now();

    if (this.config.enableStats) {
      this.stats.totalAccesses++;
    }

    const item = this.store.get(cacheKey);
    if (!item) {
      if (this.config.enableStats) {
        this.stats.misses++;
      }
      return undefined;
    }

    // 检查是否过期
    if (item.expiry < now) {
      this.store.delete(cacheKey);
      if (this.config.enableStats) {
        this.stats.misses++;
      }
      return undefined;
    }

    // 更新访问信息
    item.lastAccess = now;
    item.accessCount++;

    if (this.config.enableStats) {
      this.stats.hits++;
    }

    return item.value;
  }

  /**
   * 检查缓存项是否存在且未过期
   * @param key 缓存键
   * @returns 是否存在且未过期
   */
  has(key: string): boolean {
    const cacheKey = this.getKey(key);
    const now = Date.now();

    const item = this.store.get(cacheKey);
    if (!item || item.expiry < now) {
      if (item && item.expiry < now) {
        this.store.delete(cacheKey); // 惰性删除
      }
      return false;
    }

    return true;
  }

  /**
   * 删除缓存项
   * @param key 缓存键
   * @returns 是否成功删除
   */
  delete(key: string): boolean {
    const cacheKey = this.getKey(key);
    return this.store.delete(cacheKey);
  }

  /**
   * 清除所有缓存项
   */
  clear(): void {
    this.store.clear();
    // 重置统计信息
    if (this.config.enableStats) {
      this.stats = {
        totalAccesses: 0,
        hits: 0,
        misses: 0,
      };
    }
  }

  /**
   * 获取缓存统计信息
   * @returns 缓存统计信息
   */
  getStats(): CacheStats {
    const totalAccesses = this.stats.totalAccesses;
    const hitRate = totalAccesses > 0 
      ? this.stats.hits / totalAccesses 
      : 0;

    return {
      hitRate,
      totalAccesses,
      hits: this.stats.hits,
      misses: this.stats.misses,
      currentItems: this.store.size,
      maxItems: this.config.maxItems,
    };
  }

  /**
   * 获取缓存大小
   * @returns 当前缓存条目数
   */
  getSize(): number {
    return this.store.size;
  }

  /**
   * 带缓存的函数执行
   * @param key 缓存键
   * @param fetcher 数据获取函数
   * @param ttl 过期时间（毫秒）
   * @returns Promise<T> 获取的数据
   */
  async getWithCache<R>(
    key: string,
    fetcher: () => Promise<R>,
    ttl?: number
  ): Promise<R> {
    // 尝试从缓存获取
    const cached = this.get(key);
    if (cached !== undefined) {
      return cached as R;
    }

    // 缓存未命中，执行数据获取函数
    const result = await fetcher();
    
    // 存入缓存
    this.set(key, result as any, ttl);
    
    return result;
  }
}

/**
 * 批量请求配置接口
 */
export interface BatchRequestConfig {
  /** 批量处理间隔（毫秒） */
  batchInterval: number;
  /** 最大批量请求数 */
  maxBatchSize: number;
  /** 是否启用错误重试 */
  enableRetry?: boolean;
  /** 最大重试次数 */
  maxRetries?: number;
}

/**
 * 批处理器接口
 */
export interface BatchProcessor<Input, Output> {
  /**
   * 处理单个请求
   * @param input 请求输入
   * @returns Promise<Output> 请求输出
   */
  process(input: Input): Promise<Output>;
  
  /**
   * 处理批量请求
   * @param inputs 请求输入数组
   * @returns Promise<Output[]> 请求输出数组
   */
  processBatch(inputs: Input[]): Promise<Output[]>;
}

/**
 * 批量请求处理类
 * 将多个相似请求合并为批量请求以提高性能
 */
export class BatchRequestHandler<Input, Output> {
  private config: Required<BatchRequestConfig>;
  private processor: BatchProcessor<Input, Output>;
  private pendingRequests: Map<string, Promise<Output>>;
  private batchQueue: { input: Input; resolve: (value: Output) => void; reject: (reason: any) => void; key: string }[];
  private batchTimer: NodeJS.Timeout | null = null;
  private logger: Logger;

  /**
   * 创建批量请求处理器
   * @param processor 批处理器
   * @param config 配置选项
   * @param logger 日志记录器
   */
  constructor(
    processor: BatchProcessor<Input, Output>,
    config: Partial<BatchRequestConfig>,
    logger: Logger = console
  ) {
    this.processor = processor;
    this.config = {
      batchInterval: config.batchInterval || 50,
      maxBatchSize: config.maxBatchSize || 50,
      enableRetry: config.enableRetry !== false,
      maxRetries: config.maxRetries || 3,
    };
    this.pendingRequests = new Map();
    this.batchQueue = [];
    this.logger = logger;
  }

  /**
   * 生成请求键
   * @param input 请求输入
   * @returns 请求键
   */
  private getRequestKey(input: Input): string {
    // 默认使用JSON序列化作为键
    return JSON.stringify(input);
  }

  /**
   * 处理单个请求（可能被批量处理）
   * @param input 请求输入
   * @returns Promise<Output> 请求输出
   */
  async handleRequest(input: Input): Promise<Output> {
    const key = this.getRequestKey(input);
    
    // 检查是否已有相同的请求在处理中
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key)!;
    }
    
    const promise = new Promise<Output>((resolve, reject) => {
      // 将请求添加到队列
      this.batchQueue.push({ input, resolve, reject, key });
      
      // 确保批处理定时器已启动
      this.ensureBatchProcessing();
    });
    
    // 记录挂起的请求
    this.pendingRequests.set(key, promise);
    
    // 请求完成后清理
    promise.finally(() => {
      this.pendingRequests.delete(key);
    });
    
    return promise;
  }

  /**
   * 确保批处理定时器已启动
   */
  private ensureBatchProcessing(): void {
    if (!this.batchTimer) {
      this.batchTimer = setTimeout(() => {
        this.processBatch();
      }, this.config.batchInterval);
    }
  }

  /**
   * 处理批次请求
   */
  private async processBatch(): Promise<void> {
    // 清除定时器
    this.batchTimer = null;
    
    // 如果队列为空，则直接返回
    if (this.batchQueue.length === 0) {
      return;
    }
    
    // 获取当前批次的请求
    const batch = this.batchQueue.splice(0, this.config.maxBatchSize);
    
    const inputs = batch.map(item => item.input);
    
    try {
      // 处理批量请求
      const results = await this.processor.processBatch(inputs);
      
      // 分发结果
      batch.forEach((item, index) => {
        item.resolve(results[index]);
      });
      
      this.logger.debug(`批量请求处理成功: ${inputs.length} 个请求`);
    } catch (error) {
      this.logger.error('批量请求处理失败', error);
      
      // 如果启用了重试，可以尝试单个处理失败的请求
      if (this.config.enableRetry) {
        await this.retryFailedRequests(batch);
      } else {
        // 否则将错误传播给所有请求
        batch.forEach(item => {
          item.reject(error);
        });
      }
    }
  }

  /**
   * 重试失败的请求
   * @param failedBatch 失败的请求批次
   */
  private async retryFailedRequests(
    failedBatch: { input: Input; resolve: (value: Output) => void; reject: (reason: any) => void; key: string }[]
  ): Promise<void> {
    for (const item of failedBatch) {
      let attempts = 0;
      let lastError: any;
      
      while (attempts <= this.config.maxRetries) {
        try {
          // 尝试单独处理请求
          const result = await this.processor.process(item.input);
          item.resolve(result);
          break;
        } catch (error) {
          lastError = error;
          attempts++;
          
          // 如果达到最大重试次数，则拒绝请求
          if (attempts > this.config.maxRetries) {
            item.reject(lastError);
          } else {
            // 指数退避延迟
            const delay = Math.pow(2, attempts - 1) * 100; // 100ms, 200ms, 400ms...
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }
    }
  }
}

/**
 * 性能优化工具类
 * 提供各种性能优化工具和技术
 */
export class PerformanceOptimizer {
  private logger: Logger;
  private caches: Map<string, Cache>;

  /**
   * 创建性能优化工具实例
   * @param logger 日志记录器
   */
  constructor(logger: Logger = console) {
    this.logger = logger;
    this.caches = new Map();
  }

  /**
   * 创建或获取缓存实例
   * @param name 缓存名称
   * @param config 缓存配置
   * @returns 缓存实例
   */
  createCache<T = any>(name: string, config: Partial<CacheConfig> = {}): Cache<T> {
    if (this.caches.has(name)) {
      return this.caches.get(name)! as Cache<T>;
    }

    const cache = new Cache<T>(config, this.logger);
    this.caches.set(name, cache);
    return cache;
  }

  /**
   * 获取所有缓存统计信息
   * @returns 缓存名称到统计信息的映射
   */
  getAllCacheStats(): Map<string, CacheStats> {
    const stats = new Map<string, CacheStats>();
    
    for (const [name, cache] of this.caches.entries()) {
      stats.set(name, cache.getStats());
    }
    
    return stats;
  }

  /**
   * 压缩数据（使用JSON压缩技巧）
   * @param data 要压缩的数据
   * @returns 压缩后的字符串
   */
  compressData<T>(data: T): string {
    // 这里使用简单的JSON字符串压缩
    // 在实际项目中可以考虑使用更复杂的压缩算法
    return JSON.stringify(data, (_key, value) => {
      // 移除undefined值
      if (value === undefined) return null;
      return value;
    });
  }

  /**
   * 解压缩数据
   * @param compressed 压缩的数据字符串
   * @returns 解压缩后的数据
   */
  decompressData<T>(compressed: string): T {
    return JSON.parse(compressed);
  }

  /**
   * 防抖函数
   * @param func 要防抖的函数
   * @param delay 延迟时间（毫秒）
   * @returns 防抖后的函数
   */
  debounce<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout | null = null;
    
    return (...args: Parameters<T>) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      timeoutId = setTimeout(() => {
        func(...args);
      }, delay);
    };
  }

  /**
   * 节流函数
   * @param func 要节流的函数
   * @param limit 时间限制（毫秒）
   * @returns 节流后的函数
   */
  throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle = false;
    
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => {
          inThrottle = false;
        }, limit);
      }
    };
  }

  /**
   * 延迟执行函数
   * @param ms 延迟毫秒数
   * @returns Promise<void>
   */
  delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 测量函数执行时间
   * @param label 测量标签
   * @param func 要测量的函数
   * @returns 函数执行结果
   */
  async measureTime<T>(label: string, func: () => Promise<T>): Promise<T> {
    const startTime = performance.now();
    try {
      const result = await func();
      const endTime = performance.now();
      this.logger.info(`${label} 执行时间: ${(endTime - startTime).toFixed(2)}ms`);
      return result;
    } catch (error) {
      const endTime = performance.now();
      this.logger.error(`${label} 执行时间: ${(endTime - startTime).toFixed(2)}ms (发生错误)`);
      throw error;
    }
  }

  /**
   * 批量处理函数
   * @param items 要处理的项目数组
   * @param batchSize 批次大小
   * @param processor 处理器函数
   * @returns Promise<Result[]> 处理结果数组
   */
  async batchProcess<Item, Result>(
    items: Item[],
    batchSize: number,
    processor: (batch: Item[]) => Promise<Result[]>
  ): Promise<Result[]> {
    const results: Result[] = [];
    const totalBatches = Math.ceil(items.length / batchSize);
    
    for (let i = 0; i < totalBatches; i++) {
      const startIndex = i * batchSize;
      const endIndex = Math.min(startIndex + batchSize, items.length);
      const batch = items.slice(startIndex, endIndex);
      
      const batchResults = await processor(batch);
      results.push(...batchResults);
    }
    
    return results;
  }

  /**
   * 内存使用优化检查
   * @returns 内存使用优化建议
   */
  checkMemoryOptimization(): string[] {
    const suggestions: string[] = [];
    
    // 检查全局性能对象
    if (typeof performance !== 'undefined' && 'memory' in performance) {
      const memory = (performance as any).memory;
      const usedMemoryMB = memory.usedJSHeapSize / (1024 * 1024);
      const totalMemoryMB = memory.totalJSHeapSize / (1024 * 1024);
      
      this.logger.info(`当前内存使用: ${usedMemoryMB.toFixed(2)}MB / ${totalMemoryMB.toFixed(2)}MB`);
      
      // 如果内存使用率超过70%，提供建议
      if (usedMemoryMB / totalMemoryMB > 0.7) {
        suggestions.push('内存使用率超过70%，建议检查内存泄漏');
        suggestions.push('考虑使用虚拟化技术处理大型数据集');
        suggestions.push('检查是否有未清除的事件监听器');
      }
    }
    
    return suggestions;
  }
}

/**
 * 全局性能优化实例
 */
export const defaultOptimizer = new PerformanceOptimizer();
