/**
 * @file 性能监控服务
 * @description 提供转换操作的性能监控、资源管理和指标收集
 * @module services/PerformanceMonitorService
 * @author YYC
 * @version 2.0.0
 * @created 2024-01-16
 * @updated 2024-11-24
 */

import { LoggerService } from './LoggerService';

// 性能指标接口
export interface PerformanceMetrics {
  operation: string;
  durationMs: number;
  timestamp: number;
  memoryUsage?: number;
  dataSize?: number;
  formatInfo?: {
    sourceFormat: string;
    targetFormat: string;
  };
  success: boolean;
  errorMessage?: string;
  requestId?: string;
  traceId?: string;
  concurrencyLevel?: number;
}

// 任务指标接口
export interface TaskMetrics {
  requestId: string;
  path: string;
  method: string;
  durationMs: number;
  statusCode: number;
  isSlowTask: boolean;
  startTime: string;
  concurrencyLevel?: number;
  memoryPeak?: number;
}

// 资源限制接口
export interface ResourceLimits {
  maxMemoryUsage: number; // 字节
  maxConcurrency: number;
  maxOperationTime: number; // 毫秒
  maxDataSize: number; // 字节
}

// 性能监控服务类
export class PerformanceMonitorService {
  private static instance: PerformanceMonitorService;
  private logger: LoggerService;
  private operationStartTime: Map<string, [number, number]>;
  private operationMetadata: Map<string, any>;
  private taskMetricsHistory: TaskMetrics[];
  private currentConcurrency: number;
  private memoryHistory: Array<{ timestamp: number; usage: number }>;
  private resourceLimits: ResourceLimits;
  private taskMetricsLimit: number;
  
  private constructor() {
    this.logger = new LoggerService('PerformanceMonitor');
    this.operationStartTime = new Map();
    this.operationMetadata = new Map();
    this.taskMetricsHistory = [];
    this.currentConcurrency = 0;
    this.memoryHistory = [];
    this.taskMetricsLimit = 1000; // 保留最近1000条任务记录
    
    // 资源限制配置
    this.resourceLimits = {
      maxMemoryUsage: process.platform === 'win32' ? 2 * 1024 * 1024 * 1024 : 4 * 1024 * 1024 * 1024, // Windows 2GB, 其他 4GB
      maxConcurrency: 10,
      maxOperationTime: 60 * 1000, // 60秒
      maxDataSize: 500 * 1024 * 1024, // 500MB
    };
    
    // 启动内存监控
    this.startMemoryMonitoring();
  }
  
  /**
   * 获取单例实例
   */
  public static getInstance(): PerformanceMonitorService {
    if (!PerformanceMonitorService.instance) {
      PerformanceMonitorService.instance = new PerformanceMonitorService();
    }
    return PerformanceMonitorService.instance;
  }
  
  /**
   * 开始监控操作
   * @param operationId 操作ID
   * @param operation 操作名称
   * @param metadata 操作元数据
   */
  public startOperation(operationId: string, operation: string, metadata?: any): void {
    // 增加并发计数
    this.currentConcurrency++;
    
    this.operationStartTime.set(operationId, process.hrtime());
    this.operationMetadata.set(operationId, {
      operation,
      startTime: Date.now(),
      concurrencyLevel: this.currentConcurrency,
      ...metadata,
    });
  }
  
  /**
   * 结束监控操作
   * @param operationId 操作ID
   * @param success 是否成功
   * @param additionalData 附加数据
   */
  public endOperation(operationId: string, success: boolean = true, additionalData?: any): PerformanceMetrics {
    const startTime = this.operationStartTime.get(operationId);
    const metadata = this.operationMetadata.get(operationId);
    
    if (!startTime || !metadata) {
      throw new Error(`未找到操作ID: ${operationId} 的开始记录`);
    }
    
    // 计算持续时间
    const [seconds, nanoseconds] = process.hrtime(startTime);
    const durationMs = seconds * 1000 + nanoseconds / 1e6;
    
    // 收集内存使用情况
    const memoryUsage = process.memoryUsage().heapUsed;
    
    // 构建性能指标
    const metrics: PerformanceMetrics = {
      operation: metadata.operation,
      durationMs,
      timestamp: Date.now(),
      memoryUsage,
      formatInfo: metadata.formatInfo,
      success,
      errorMessage: additionalData?.errorMessage,
      requestId: metadata.requestId,
      traceId: metadata.traceId,
      concurrencyLevel: metadata.concurrencyLevel,
      ...additionalData,
    };
    
    // 记录性能指标
    this.logMetrics(metrics);
    
    // 清理记录
    this.operationStartTime.delete(operationId);
    this.operationMetadata.delete(operationId);
    
    // 减少并发计数
    if (this.currentConcurrency > 0) {
      this.currentConcurrency--;
    }
    
    return metrics;
  }
  
  /**
   * 记录性能指标
   * @param metrics 性能指标
   */
  private logMetrics(metrics: PerformanceMetrics): void {
    // 记录所有操作的基本信息
    this.logger.debug('操作性能指标', metrics);
    
    // 对于慢操作，记录警告
    const slowOperationThreshold = 2000; // 2秒
    if (metrics.durationMs > slowOperationThreshold) {
      this.logger.warn('性能警告：慢操作', {
        ...metrics,
        warning: `操作执行时间超过阈值 (${slowOperationThreshold}ms)`,
        concurrency: this.currentConcurrency,
      });
    }
    
    // 对于失败的操作，记录错误
    if (!metrics.success) {
      this.logger.error('操作执行失败', metrics);
    }
    
    // 检查资源使用是否超过阈值
    this.checkResourceThresholds(metrics);
    
    // 可以在这里将指标发送到外部监控系统
    // 例如 Prometheus, Grafana, New Relic 等
  }
  
  /**
   * 检查资源使用是否超过阈值
   */
  private checkResourceThresholds(metrics: PerformanceMetrics): void {
    // 检查内存使用
    if (metrics.memoryUsage && metrics.memoryUsage > this.resourceLimits.maxMemoryUsage * 0.8) {
      this.logger.warn('内存使用警告', {
        memoryUsage: metrics.memoryUsage,
        threshold: this.resourceLimits.maxMemoryUsage * 0.8,
        operation: metrics.operation,
      });
    }
    
    // 检查操作时间
    if (metrics.durationMs > this.resourceLimits.maxOperationTime * 0.8) {
      this.logger.warn('操作时间警告', {
        durationMs: metrics.durationMs,
        threshold: this.resourceLimits.maxOperationTime * 0.8,
        operation: metrics.operation,
      });
    }
  }
  
  /**
   * 记录任务指标
   */
  public recordTask(metrics: TaskMetrics): void {
    // 添加并发级别
    const enrichedMetrics = {
      ...metrics,
      concurrencyLevel: this.currentConcurrency,
      memoryPeak: process.memoryUsage().heapUsed,
    };
    
    // 保存到历史记录
    this.taskMetricsHistory.push(enrichedMetrics);
    
    // 限制历史记录大小
    if (this.taskMetricsHistory.length > this.taskMetricsLimit) {
      this.taskMetricsHistory.shift(); // 移除最旧的记录
    }
    
    // 记录慢任务
    if (enrichedMetrics.isSlowTask) {
      this.logger.warn('慢任务记录', enrichedMetrics);
    }
  }
  
  /**
   * 开始内存监控
   */
  private startMemoryMonitoring(): void {
    // 每30秒收集一次内存使用情况
    setInterval(() => {
      const memoryUsage = process.memoryUsage();
      this.memoryHistory.push({
        timestamp: Date.now(),
        usage: memoryUsage.heapUsed,
      });
      
      // 限制历史记录大小
      if (this.memoryHistory.length > 100) {
        this.memoryHistory.shift();
      }
      
      // 检查内存使用是否超过阈值
      if (memoryUsage.heapUsed > this.resourceLimits.maxMemoryUsage * 0.9) {
        this.logger.warn('内存使用率高', {
          memoryUsage: memoryUsage.heapUsed,
          memoryLimit: this.resourceLimits.maxMemoryUsage,
          percentage: (memoryUsage.heapUsed / this.resourceLimits.maxMemoryUsage * 100).toFixed(2) + '%',
        });
      }
    }, 30000);
  }
  
  /**
   * 检查是否可以执行新操作
   */
  public canExecuteOperation(dataSize?: number): boolean {
    // 检查并发数
    if (this.currentConcurrency >= this.resourceLimits.maxConcurrency) {
      this.logger.warn('并发数已达上限', {
        current: this.currentConcurrency,
        max: this.resourceLimits.maxConcurrency,
      });
      return false;
    }
    
    // 检查数据大小
    if (dataSize && dataSize > this.resourceLimits.maxDataSize) {
      this.logger.warn('数据大小超过限制', {
        size: dataSize,
        max: this.resourceLimits.maxDataSize,
      });
      return false;
    }
    
    // 检查内存使用
    const currentMemory = process.memoryUsage().heapUsed;
    if (currentMemory > this.resourceLimits.maxMemoryUsage * 0.95) {
      this.logger.warn('内存使用过高，拒绝新操作', {
        memoryUsage: currentMemory,
        memoryLimit: this.resourceLimits.maxMemoryUsage,
      });
      return false;
    }
    
    return true;
  }
  
  /**
   * 获取资源使用摘要
   */
  public getResourceSummary(): {
    concurrency: number;
    memoryUsage: number;
    memoryLimit: number;
    memoryPercentage: number;
    avgOperationTime: number;
    slowOperationsCount: number;
  } {
    // 计算平均操作时间
    let totalTime = 0;
    let slowCount = 0;
    
    for (const metrics of this.taskMetricsHistory.slice(-100)) {
      totalTime += metrics.durationMs;
      if (metrics.isSlowTask) slowCount++;
    }
    
    const avgTime = this.taskMetricsHistory.length > 0 ? totalTime / this.taskMetricsHistory.length : 0;
    const memoryUsage = process.memoryUsage().heapUsed;
    
    return {
      concurrency: this.currentConcurrency,
      memoryUsage,
      memoryLimit: this.resourceLimits.maxMemoryUsage,
      memoryPercentage: (memoryUsage / this.resourceLimits.maxMemoryUsage) * 100,
      avgOperationTime: avgTime,
      slowOperationsCount: slowCount,
    };
  }
  
  /**
   * 设置资源限制
   */
  public setResourceLimits(limits: Partial<ResourceLimits>): void {
    this.resourceLimits = {
      ...this.resourceLimits,
      ...limits,
    };
    this.logger.info('资源限制已更新', this.resourceLimits);
  }
  
  /**
   * 监控异步函数的性能
   * @param operationName 操作名称
   * @param fn 要执行的函数
   * @param metadata 元数据
   */
  public async monitorAsync<T>(
    operationName: string,
    fn: () => Promise<T>,
    metadata?: any
  ): Promise<T> {
    // 检查是否可以执行
    if (metadata?.dataSize && !this.canExecuteOperation(metadata.dataSize)) {
      throw new Error('资源限制：无法执行新操作');
    }
    
    const operationId = `${operationName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    this.startOperation(operationId, operationName, metadata);
    
    // 设置超时
    const timeoutId = setTimeout(() => {
      this.logger.error('操作执行超时', {
        operationName,
        operationId,
        maxTime: this.resourceLimits.maxOperationTime,
      });
    }, this.resourceLimits.maxOperationTime);
    
    try {
      const result = await fn();
      clearTimeout(timeoutId);
      this.endOperation(operationId, true);
      return result;
    } catch (error) {
      clearTimeout(timeoutId);
      this.endOperation(operationId, false, {
        errorMessage: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }
  
  /**
   * 获取性能统计摘要
   */
  public getStats(): {
    activeOperations: number;
    memoryUsage: NodeJS.MemoryUsage;
    uptime: number;
  } {
    return {
      activeOperations: this.operationStartTime.size,
      memoryUsage: process.memoryUsage(),
      uptime: process.uptime(),
    };
  }
}