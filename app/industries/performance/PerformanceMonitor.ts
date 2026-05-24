/**
 * @file 性能监控模块
 * @description 提供系统性能监控、数据收集和分析功能
 * @module performance
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-20
 */

/**
 * 性能监控配置接口
 */
export interface PerformanceMonitorConfig {
  /** 采样率（0-1之间的小数） */
  samplingRate: number;
  /** 是否监控API响应时间 */
  monitorApiResponseTime: boolean;
  /** 是否监控页面加载性能 */
  monitorPageLoad: boolean;
  /** 是否监控内存使用情况 */
  monitorMemory: boolean;
  /** 是否监控错误率 */
  monitorErrors: boolean;
  /** 报告间隔（毫秒） */
  reportingInterval: number;
  /** 自定义日志记录器 */
  logger?: Logger;
}

/**
 * 日志记录器接口
 */
export interface Logger {
  info(message: string, data?: any): void;
  warn(message: string, data?: any): void;
  error(message: string, data?: any): void;
  debug(message: string, data?: any): void;
}

/**
 * 性能指标数据接口
 */
export interface PerformanceMetrics {
  /** 平均响应时间（毫秒） */
  averageResponseTime: number;
  /** 95百分位响应时间（毫秒） */
  p95ResponseTime: number;
  /** 99百分位响应时间（毫秒） */
  p99ResponseTime: number;
  /** 每秒请求数 */
  requestsPerSecond: number;
  /** 错误率（0-1之间的小数） */
  errorRate: number;
  /** 内存使用（MB） */
  memoryUsage?: number;
  /** 样本数量 */
  sampleCount: number;
  /** 监控时间段（毫秒） */
  timeWindow: number;
}

/**
 * 请求性能数据接口
 */
export interface RequestPerformanceData {
  /** 请求URL */
  url: string;
  /** 请求方法 */
  method: string;
  /** 响应状态码 */
  statusCode: number;
  /** 响应时间（毫秒） */
  responseTime: number;
  /** 请求开始时间 */
  startTime: number;
  /** 请求结束时间 */
  endTime: number;
  /** 是否为错误请求 */
  isError: boolean;
}

/**
 * 性能监控类
 * 提供系统性能监控、数据收集和分析功能
 */
export class PerformanceMonitor {
  private config: PerformanceMonitorConfig;
  private requestData: RequestPerformanceData[] = [];
  private startTime: number;
  private memorySnapshots: number[] = [];
  private reportInterval: NodeJS.Timeout | null = null;
  private errorCount = 0;
  private totalRequestCount = 0;

  /**
   * 创建性能监控实例
   * @param config 监控配置
   */
  constructor(config: Partial<PerformanceMonitorConfig> = {}) {
    this.config = {
      samplingRate: config.samplingRate || 1,
      monitorApiResponseTime: config.monitorApiResponseTime !== false,
      monitorPageLoad: config.monitorPageLoad !== false,
      monitorMemory: config.monitorMemory !== false,
      monitorErrors: config.monitorErrors !== false,
      reportingInterval: config.reportingInterval || 60000, // 默认1分钟
      logger: config.logger || this.getDefaultLogger(),
    };
    this.startTime = Date.now();

    if (this.config.monitorErrors) {
      this.setupErrorMonitoring();
    }

    if (this.config.monitorMemory && typeof performance !== 'undefined') {
      this.setupMemoryMonitoring();
    }

    this.startReporting();
  }

  /**
   * 获取默认日志记录器
   * @returns 默认日志记录器
   */
  private getDefaultLogger(): Logger {
    return {
      info: console.log,
      warn: console.warn,
      error: console.error,
      debug: console.debug || console.log,
    };
  }

  /**
   * 设置错误监控
   */
  private setupErrorMonitoring(): void {
    if (typeof window !== 'undefined') {
      // 监听全局错误
      window.addEventListener('error', (event) => {
        this.errorCount++;
        this.config.logger?.error('全局错误捕获', {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        });
      });

      // 监听未捕获的Promise错误
      window.addEventListener('unhandledrejection', (event) => {
        this.errorCount++;
        this.config.logger?.error('未处理的Promise错误', {
          reason: event.reason,
        });
      });
    }
  }

  /**
   * 设置内存监控
   */
  private setupMemoryMonitoring(): void {
    if (typeof performance !== 'undefined' && 'memory' in performance) {
      const memoryCheckInterval = setInterval(() => {
        try {
          // 检查performance.memory是否存在（非标准属性）并使用类型断言避免TypeScript错误
          if ('memory' in performance) {
            const memoryInfo = (performance as any).memory;
            // 使用可选链操作符确保安全访问
            if (memoryInfo?.usedJSHeapSize !== undefined) {
              this.memorySnapshots.push(memoryInfo.usedJSHeapSize / (1024 * 1024)); // 转换为MB
              
              // 限制内存快照数量，保留最近100个
              if (this.memorySnapshots.length > 100) {
                this.memorySnapshots.shift();
              }
            }
          }
        } catch (error) {
          this.config.logger?.warn('内存监控失败', error);
        }
      }, 5000); // 每5秒检查一次内存

      // 清理函数
      this.cleanupCallbacks.push(() => clearInterval(memoryCheckInterval));
    }
  }

  // 清理回调函数数组
  private cleanupCallbacks: (() => void)[] = [];

  /**
   * 开始性能报告生成
   */
  private startReporting(): void {
    this.reportInterval = setInterval(() => {
      const metrics = this.generateMetrics();
      this.config.logger?.info('性能指标报告', metrics);
      this.emitMetrics(metrics);
      this.resetMetrics();
    }, this.config.reportingInterval);
  }

  /**
   * 生成性能指标
   * @returns 性能指标数据
   */
  private generateMetrics(): PerformanceMetrics {
    const now = Date.now();
    const timeWindow = now - this.startTime;
    
    // 计算响应时间统计
    const responseTimes = this.requestData.map(data => data.responseTime).sort((a, b) => a - b);
    const averageResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length
      : 0;
    
    const p95Index = Math.ceil(responseTimes.length * 0.95) - 1;
    const p95ResponseTime = p95Index >= 0 ? responseTimes[p95Index] : 0;
    
    const p99Index = Math.ceil(responseTimes.length * 0.99) - 1;
    const p99ResponseTime = p99Index >= 0 ? responseTimes[p99Index] : 0;
    
    // 计算每秒请求数
    const requestsPerSecond = this.requestData.length / (timeWindow / 1000);
    
    // 计算错误率
    const errorRate = this.totalRequestCount > 0
      ? this.errorCount / this.totalRequestCount
      : 0;
    
    // 计算平均内存使用
    const memoryUsage = this.memorySnapshots.length > 0
      ? this.memorySnapshots.reduce((sum, usage) => sum + usage, 0) / this.memorySnapshots.length
      : 0; // 默认值为0而不是undefined
    
    return {
      averageResponseTime,
      p95ResponseTime,
      p99ResponseTime,
      requestsPerSecond,
      errorRate,
      memoryUsage,
      sampleCount: this.requestData.length,
      timeWindow,
    };
  }

  /**
   * 重置性能指标
   */
  private resetMetrics(): void {
    // 保留一部分数据用于连续监控
    const keepCount = Math.ceil(this.requestData.length * 0.2);
    if (keepCount > 0) {
      this.requestData = this.requestData.slice(-keepCount);
    } else {
      this.requestData = [];
    }
    
    this.startTime = Date.now();
    // 不重置错误计数，因为它是累计的
    // 但可以添加一个重置机制
  }

  /**
   * 发送性能指标
   * @param metrics 性能指标数据
   */
  private emitMetrics(metrics: PerformanceMetrics): void {
    // 这里可以添加指标发送到服务器的逻辑
    // 例如：fetch('/api/performance-metrics', { method: 'POST', body: JSON.stringify(metrics) });
    
    // 检查性能指标是否超出阈值
    this.checkPerformanceThresholds(metrics);
  }

  /**
   * 检查性能指标是否超出阈值
   * @param metrics 性能指标数据
   */
  private checkPerformanceThresholds(metrics: PerformanceMetrics): void {
    // 根据评估指标体系文档中的标准进行检查
    const thresholds = {
      averageResponseTime: 200, // 平均响应时间阈值（毫秒）
      errorRate: 0.001, // 错误率阈值（0.1%）
    };
    
    if (metrics.averageResponseTime > thresholds.averageResponseTime) {
      this.config.logger?.warn(
        `响应时间超出阈值: ${metrics.averageResponseTime.toFixed(2)}ms > ${thresholds.averageResponseTime}ms`,
        metrics
      );
    }
    
    if (metrics.errorRate > thresholds.errorRate) {
      this.config.logger?.warn(
        `错误率超出阈值: ${(metrics.errorRate * 100).toFixed(4)}% > ${(thresholds.errorRate * 100).toFixed(2)}%`,
        metrics
      );
    }
  }

  /**
   * 记录API请求性能
   * @param url 请求URL
   * @param method 请求方法
   * @param statusCode 响应状态码
   * @param startTime 请求开始时间
   * @param endTime 请求结束时间
   */
  public recordApiRequest(
    url: string,
    method: string,
    statusCode: number,
    startTime: number,
    endTime: number
  ): void {
    if (Math.random() > this.config.samplingRate) {
      return; // 根据采样率跳过记录
    }
    
    this.totalRequestCount++;
    const isError = statusCode >= 400;
    if (isError) {
      this.errorCount++;
    }
    
    const requestData: RequestPerformanceData = {
      url,
      method,
      statusCode,
      responseTime: endTime - startTime,
      startTime,
      endTime,
      isError,
    };
    
    this.requestData.push(requestData);
    
    // 限制数据量，防止内存溢出
    if (this.requestData.length > 10000) {
      this.requestData.shift(); // 移除最旧的数据
    }
  }

  /**
   * 包装fetch API以监控性能
   * @param fetch 原始fetch函数
   * @returns 包装后的fetch函数
   */
  public wrapFetch(fetch: typeof window.fetch): typeof window.fetch {
    const monitor = this;
    return function wrappedFetch(...args) {
      const startTime = Date.now();
      const url = typeof args[0] === 'string' ? args[0] : (args[0] as Request).url;
      let method = 'GET';
      
      // 确保args[0]是Request对象而不是URL对象，然后再访问method属性
      if (typeof args[0] !== 'string' && 'method' in args[0]) {
        method = args[0].method;
      } else if (args[1] && 'method' in args[1]) {
        method = args[1].method;
      }
      
      return fetch(...args).then((response) => {
        const endTime = Date.now();
        monitor.recordApiRequest(url, method, response.status, startTime, endTime);
        return response;
      }).catch((error) => {
        const endTime = Date.now();
        monitor.recordApiRequest(url, method, 0, startTime, endTime);
        throw error;
      });
    };
  }

  /**
   * 手动记录错误
   * @param error 错误对象
   */
  public recordError(error: Error): void {
    this.errorCount++;
    this.config.logger?.error('手动记录错误', error);
  }

  /**
   * 获取当前性能指标
   * @returns 当前性能指标
   */
  public getCurrentMetrics(): PerformanceMetrics {
    return this.generateMetrics();
  }

  /**
   * 停止性能监控
   */
  public stop(): void {
    if (this.reportInterval) {
      clearInterval(this.reportInterval);
      this.reportInterval = null;
    }
    
    // 执行清理回调
    this.cleanupCallbacks.forEach(callback => callback());
    this.cleanupCallbacks = [];
    
    this.config.logger?.info('性能监控已停止');
  }

  /**
   * 导出所有收集的数据
   * @returns 收集的性能数据
   */
  public exportData(): {
    requestData: RequestPerformanceData[];
    metrics: PerformanceMetrics;
    memorySnapshots: number[];
  } {
    return {
      requestData: this.requestData,
      metrics: this.getCurrentMetrics(),
      memorySnapshots: this.memorySnapshots,
    };
  }
}

/**
 * 创建性能监控实例的工厂函数
 * @param config 监控配置
 * @returns 性能监控实例
 */
export function createPerformanceMonitor(config?: Partial<PerformanceMonitorConfig>): PerformanceMonitor {
  return new PerformanceMonitor(config);
}

/**
 * 默认性能监控实例
 */
export const defaultMonitor = createPerformanceMonitor();
