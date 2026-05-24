/**
 * @file 资源管理中间件
 * @description 提供请求并发控制、资源使用限制和负载均衡功能
 * @module middleware/resourceManagerMiddleware
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-24
 */

import { Request, Response, NextFunction } from 'express';
import { PerformanceMonitorService } from '../services/PerformanceMonitorService';
import { LoggerService } from '../services/LoggerService';
import { FileFormatError, ServiceUnavailableError } from './errorHandler';

// 中间件配置接口
interface ResourceManagerConfig {
  /** 是否启用请求限流 */
  enableRateLimiting: boolean;
  /** 每分钟最大请求数 */
  requestsPerMinute: number;
  /** 是否启用请求大小限制 */
  enableSizeLimiting: boolean;
  /** 最大请求体大小（字节） */
  maxRequestSize: number;
  /** 是否启用资源使用监控 */
  enableResourceMonitoring: boolean;
  /** 慢请求阈值（毫秒） */
  slowRequestThreshold: number;
  /** 是否记录任务指标 */
  recordTaskMetrics: boolean;
}

// 请求状态接口
interface RequestState {
  startTime: [number, number];
  requestSize?: number;
  memoryBefore?: NodeJS.MemoryUsage;
}

/**
 * 资源管理中间件类
 */
class ResourceManager {
  private performanceMonitor: PerformanceMonitorService;
  private logger: LoggerService;
  private config: ResourceManagerConfig;
  private requestStates: Map<string, RequestState>;
  private rateLimitMap: Map<string, {
    count: number;
    resetTime: number;
  }>;

  constructor(config?: Partial<ResourceManagerConfig>) {
    this.performanceMonitor = PerformanceMonitorService.getInstance();
    this.logger = new LoggerService('ResourceManager');
    this.requestStates = new Map();
    this.rateLimitMap = new Map();

    // 默认配置
    this.config = {
      enableRateLimiting: true,
      requestsPerMinute: 60,
      enableSizeLimiting: true,
      maxRequestSize: 10 * 1024 * 1024, // 10MB
      enableResourceMonitoring: true,
      slowRequestThreshold: 2000, // 2秒
      recordTaskMetrics: true,
      ...config,
    };

    this.logger.info('资源管理器初始化完成', { config: this.config });
  }

  /**
   * 获取请求ID
   */
  private getRequestId(req: Request): string {
    return (
      req.headers['x-request-id'] as string ||
      req.headers['trace-id'] as string ||
      req.ip + '-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9)
    );
  }

  /**
   * 检查速率限制
   */
  private checkRateLimit(req: Request): boolean {
    if (!this.config.enableRateLimiting) return true;

    const clientKey = req.ip;
    const now = Date.now();
    const limit = this.rateLimitMap.get(clientKey);

    if (!limit) {
      // 首次请求，创建记录
      this.rateLimitMap.set(clientKey, {
        count: 1,
        resetTime: now + 60000, // 1分钟后重置
      });
      return true;
    }

    // 检查是否需要重置计数
    if (now > limit.resetTime) {
      limit.count = 1;
      limit.resetTime = now + 60000;
      return true;
    }

    // 检查是否超过限制
    if (limit.count >= this.config.requestsPerMinute) {
      const retryAfter = Math.ceil((limit.resetTime - now) / 1000);
      (req as any).retryAfter = retryAfter;
      return false;
    }

    // 增加计数
    limit.count++;
    return true;
  }

  /**
   * 检查请求大小
   */
  private checkRequestSize(req: Request): boolean {
    if (!this.config.enableSizeLimiting) return true;

    const contentLength = req.headers['content-length'];
    if (contentLength) {
      const size = parseInt(contentLength, 10);
      if (!isNaN(size) && size > this.config.maxRequestSize) {
        (req as any).requestSizeTooLarge = true;
        return false;
      }
    }

    return true;
  }

  /**
   * 检查系统资源
   */
  private checkSystemResources(): boolean {
    if (!this.config.enableResourceMonitoring) return true;

    // 使用性能监控服务检查资源
    const resourceSummary = this.performanceMonitor.getResourceSummary();

    // 检查内存使用
    if (resourceSummary.memoryPercentage > 90) {
      this.logger.warn('系统内存使用率过高，拒绝新请求', resourceSummary);
      return false;
    }

    // 检查并发数
    if (!this.performanceMonitor.canExecuteOperation()) {
      return false;
    }

    return true;
  }

  /**
   * 计算请求处理时间
   */
  private calculateRequestTime(reqId: string): number {
    const state = this.requestStates.get(reqId);
    if (!state) return 0;

    const [seconds, nanoseconds] = process.hrtime(state.startTime);
    return seconds * 1000 + nanoseconds / 1e6;
  }

  /**
   * 记录请求指标
   */
  private recordRequestMetrics(req: Request, res: Response): void {
    if (!this.config.recordTaskMetrics) return;

    const reqId = this.getRequestId(req);
    const durationMs = this.calculateRequestTime(reqId);
    const isSlowTask = durationMs > this.config.slowRequestThreshold;

    const taskMetrics = {
      requestId: reqId,
      path: req.path,
      method: req.method,
      durationMs,
      statusCode: res.statusCode,
      isSlowTask,
      startTime: new Date().toISOString(),
    };

    // 记录任务指标
    this.performanceMonitor.recordTask(taskMetrics);

    // 记录慢请求
    if (isSlowTask) {
      this.logger.warn('慢请求警告', {
        path: req.path,
        method: req.method,
        durationMs,
        clientIp: req.ip,
        statusCode: res.statusCode,
      });
    }

    // 清理状态
    this.requestStates.delete(reqId);
  }

  /**
   * 主中间件函数
   */
  public middleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      const reqId = this.getRequestId(req);

      // 检查速率限制
      if (!this.checkRateLimit(req)) {
        const retryAfter = (req as any).retryAfter || 60;
        res.setHeader('Retry-After', retryAfter.toString());
        return next(new ServiceUnavailableError('请求过于频繁，请稍后再试'));
      }

      // 检查请求大小
      if (!this.checkRequestSize(req)) {
        return next(new FileFormatError('请求体过大'));
      }

      // 检查系统资源
      if (!this.checkSystemResources()) {
        return next(new ServiceUnavailableError('系统资源暂时不可用，请稍后再试'));
      }

      // 保存请求开始状态
      this.requestStates.set(reqId, {
        startTime: process.hrtime(),
        memoryBefore: process.memoryUsage(),
      });

      // 设置请求ID到响应头
      res.setHeader('X-Request-ID', reqId);

      // 监听数据事件以计算请求大小
      if (this.config.enableSizeLimiting) {
        let totalBytes = 0;
        (req as any).on('data', (chunk: Buffer) => {
          totalBytes += chunk.length;
          if (totalBytes > this.config.maxRequestSize) {
            this.logger.warn('请求体大小超过限制', {
              path: req.path,
              clientIp: req.ip,
              size: totalBytes,
              limit: this.config.maxRequestSize,
            });
            res.destroy();
          }
        });
        (req as any).on('end', () => {
          const state = this.requestStates.get(reqId);
          if (state) {
            state.requestSize = totalBytes;
          }
        });
      }

      // 捕获响应结束事件
      res.on('finish', () => {
        try {
          this.recordRequestMetrics(req, res);
        } catch (error) {
          this.logger.error('记录请求指标失败', { error });
        }
      });

      next();
    };
  }

  /**
   * 更新配置
   */
  public updateConfig(config: Partial<ResourceManagerConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    };
    this.logger.info('资源管理器配置已更新', { config: this.config });
  }

  /**
   * 获取当前资源状态
   */
  public getResourceStatus(): any {
    return {
      ...this.performanceMonitor.getResourceSummary(),
      activeRequests: this.requestStates.size,
      rateLimitInfo: {
        activeKeys: this.rateLimitMap.size,
        requestsPerMinute: this.config.requestsPerMinute,
      },
      config: this.config,
    };
  }
}

// 默认配置
const defaultConfig: ResourceManagerConfig = {
  enableRateLimiting: true,
  requestsPerMinute: 60,
  enableSizeLimiting: true,
  maxRequestSize: 10 * 1024 * 1024,
  enableResourceMonitoring: true,
  slowRequestThreshold: 2000,
  recordTaskMetrics: true,
};

// 创建默认资源管理器实例
const defaultResourceManager = new ResourceManager(defaultConfig);

/**
 * 资源管理中间件工厂函数
 */
export function createResourceManagerMiddleware(config?: Partial<ResourceManagerConfig>) {
  const manager = config ? new ResourceManager(config) : defaultResourceManager;
  return manager.middleware();
}

/**
 * 资源管理中间件（默认配置）
 */
export const resourceManagerMiddleware = defaultResourceManager.middleware();

/**
 * 获取资源管理器实例
 */
export function getResourceManagerInstance(): ResourceManager {
  return defaultResourceManager;
}

// 导出类供测试使用
export { ResourceManager, ResourceManagerConfig };