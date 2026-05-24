/**
 * @file 请求日志中间件
 * @description 提供HTTP请求的详细日志记录和性能监控，专为转换服务优化
 * @module middleware/loggerMiddleware
 * @author YYC
 * @version 2.0.0
 * @created 2024-11-22
 * @updated 2024-11-24
 */

import { Request, Response, NextFunction } from 'express';
import { LoggerService } from '../services/LoggerService';
import { ConfigService } from '../services/ConfigService';
import { PerformanceMonitorService } from '../services/PerformanceMonitorService';

// 请求日志配置接口
interface LoggerMiddlewareOptions {
  skipPaths?: string[];
  skipMethods?: string[];
  logRequestBody?: boolean;
  logResponseBody?: boolean;
  maxBodySize?: number;
  includeHeaders?: string[];
  excludeHeaders?: string[];
  ignoreHealthChecks?: boolean;
  // 转换服务特有配置
  trackConversionTasks?: boolean;
  conversionTaskThreshold?: number; // 毫秒
  requestTraceId?: boolean;
  sensitiveDataFields?: string[];
}

// 请求信息接口
interface RequestInfo {
  requestId: string;
  traceId?: string;
  method: string;
  url: string;
  path: string;
  ip?: string;
  userAgent?: string;
  queryParams?: Record<string, any>;
  headers?: Record<string, string>;
  body?: Record<string, any>;
  // 转换任务相关信息
  conversionType?: string;
  sourceFormat?: string;
  targetFormat?: string;
}

// 响应信息接口
interface ResponseInfo {
  statusCode: number;
  responseTime: number;
  contentLength?: number;
  body?: Record<string, any>;
}

/**
 * @description 获取请求ID的辅助函数
 */
function getRequestId(req: Request): string {
  // 尝试从请求头获取请求ID
  const existingId = req.headers['x-request-id'] as string || 
                    req.headers['request-id'] as string;
  
  if (existingId) {
    return existingId;
  }
  
  // 生成新的请求ID
  return `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function getTraceId(req: Request): string {
  // 尝试从请求头获取跟踪ID
  const existingTraceId = req.headers['x-trace-id'] as string ||
                         req.headers['trace-id'] as string;
  
  if (existingTraceId) {
    return existingTraceId;
  }
  
  // 生成新的跟踪ID
  return `trace-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * @description 格式化请求体的辅助函数（避免记录敏感信息）
 */
function formatRequestBody(req: Request, maxSize: number, sensitiveFields?: string[]): Record<string, any> | undefined {
  if (!req.body || typeof req.body !== 'object') {
    return undefined;
  }
  
  // 合并默认敏感字段和自定义敏感字段
  const defaultSensitiveFields = ['password', 'token', 'secret', 'key', 'credentials', 'auth'];
  const allSensitiveFields = [...defaultSensitiveFields, ...(sensitiveFields || [])];
  
  const sanitizedBody: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(req.body)) {
    const lowerKey = key.toLowerCase();
    
    if (allSensitiveFields.some(field => lowerKey.includes(field))) {
      sanitizedBody[key] = '[REDACTED]';
    } else {
      // 检查大小
      const serialized = JSON.stringify(value);
      if (serialized.length > maxSize) {
        sanitizedBody[key] = '[TOO LARGE]';
      } else {
        sanitizedBody[key] = value;
      }
    }
  }
  
  // 提取转换任务相关信息
  if (req.path.includes('/convert') && req.body) {
    sanitizedBody._conversionInfo = {
      type: req.body.type || 'unknown',
      sourceFormat: req.body.sourceFormat || 'unknown',
      targetFormat: req.body.targetFormat || 'unknown',
    };
  }
  
  return sanitizedBody;
}

/**
 * @description 格式化请求头的辅助函数
 */
function formatHeaders(req: Request, includeHeaders?: string[], excludeHeaders?: string[]): Record<string, string> | undefined {
  const headersToExclude = new Set([
    'authorization', 'token', 'password', 'secret',
    ...(excludeHeaders || [])
  ]);
  
  const formattedHeaders: Record<string, string> = {};
  const includeAll = !includeHeaders || includeHeaders.length === 0;
  
  for (const [key, value] of Object.entries(req.headers)) {
    const lowerKey = key.toLowerCase();
    
    // 排除敏感头
    if (headersToExclude.has(lowerKey)) {
      formattedHeaders[key] = '[REDACTED]';
      continue;
    }
    
    // 如果指定了包含的头，只包含这些
    if (!includeAll && !includeHeaders?.some(h => h.toLowerCase() === lowerKey)) {
      continue;
    }
    
    formattedHeaders[key] = Array.isArray(value) ? value.join(', ') : String(value);
  }
  
  return formattedHeaders;
}

/**
 * @description 检查是否应该跳过日志记录
 */
function shouldSkipLogging(
  req: Request,
  options: LoggerMiddlewareOptions
): boolean {
  // 跳过指定的路径
  if (options.skipPaths?.some(path => req.path.includes(path))) {
    return true;
  }
  
  // 跳过指定的方法
  if (options.skipMethods?.includes(req.method)) {
    return true;
  }
  
  // 跳过健康检查
  if (options.ignoreHealthChecks) {
    const healthCheckPaths = ['/health', '/ping', '/status', '/ready'];
    if (healthCheckPaths.some(path => req.path.toLowerCase().includes(path))) {
      return true;
    }
  }
  
  return false;
}

/**
 * @description 获取日志级别
 */
function getLogLevel(statusCode: number): 'info' | 'warn' | 'error' {
  if (statusCode >= 500) return 'error';
  if (statusCode >= 400) return 'warn';
  return 'info';
}

/**
 * @description 记录请求开始信息
 */
function logRequestStart(req: Request, logger: LoggerService, options: LoggerMiddlewareOptions): void {
  const requestId = getRequestId(req);
  
  // 存储请求ID到请求对象
  (req as any).requestId = requestId;
  
  // 设置请求开始时间
  const startTime = Date.now();
  (req as any)._startTime = startTime;
  
  // 构建请求信息
  const requestInfo: RequestInfo = {
    requestId,
    method: req.method,
    url: req.originalUrl,
    path: req.path,
    ip: req.ip || undefined,
    userAgent: req.headers['user-agent'] as string,
    queryParams: Object.keys(req.query).length > 0 ? req.query : undefined,
  };
  
  // 记录请求头
  if (options.includeHeaders || options.excludeHeaders) {
    requestInfo.headers = formatHeaders(req, options.includeHeaders, options.excludeHeaders);
  }
  
  // 记录请求体
  if (options.logRequestBody && (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH')) {
    requestInfo.body = formatRequestBody(req, options.maxBodySize || 1000);
  }
  
  logger.info('请求开始', requestInfo);
}

/**
 * @description 记录请求结束信息
 */
function logRequestEnd(
  req: Request,
  res: Response,
  logger: LoggerService,
  _options: LoggerMiddlewareOptions
): void {
  const requestId = (req as any).requestId || getRequestId(req);
  const startTime = (req as any)._startTime || Date.now();
  const responseTime = Date.now() - startTime;
  
  // 构建响应信息
  const responseInfo: ResponseInfo = {
    statusCode: res.statusCode,
    responseTime,
    contentLength: Number(res.get('content-length')) || undefined,
  };
  
  // 综合日志内容
  const logContent = {
    requestId,
    method: req.method,
    url: req.originalUrl,
    path: req.path,
    statusCode: res.statusCode,
    responseTime,
    contentLength: responseInfo.contentLength,
  };
  
  // 获取日志级别
  const logLevel = getLogLevel(res.statusCode);
  
  // 记录请求完成日志
  logger[logLevel](`请求完成 (${res.statusCode})`, logContent);
  
  // 性能监控：记录慢请求
  const slowRequestThreshold = 1000; // 1秒
  if (responseTime > slowRequestThreshold) {
    logger.warn('慢请求检测', {
      ...logContent,
      warning: `请求处理时间超过阈值 (${slowRequestThreshold}ms)`,
    });
  }
}

/**
 * @description 请求日志中间件工厂函数
 * @param customOptions - 自定义配置选项
 */
export function createLoggerMiddleware(customOptions: LoggerMiddlewareOptions = {}): (req: Request, res: Response, next: NextFunction) => void {
  // 默认配置
  const defaultOptions: LoggerMiddlewareOptions = {
    skipPaths: [],
    skipMethods: ['OPTIONS'],
    logRequestBody: false,
    logResponseBody: false,
    maxBodySize: 1000,
    includeHeaders: [],
    excludeHeaders: [],
    ignoreHealthChecks: true,
    // 转换服务特有默认配置
    trackConversionTasks: true,
    conversionTaskThreshold: 3000, // 3秒
    requestTraceId: true,
    sensitiveDataFields: ['apiKey', 'accessToken', 'privateKey'],
  };
  
  // 合并配置
  const options = { ...defaultOptions, ...customOptions };
  
  // 创建性能监控服务实例
  const performanceMonitor = PerformanceMonitorService.getInstance();
  
  // 创建中间件函数
  return (req: Request, res: Response, next: NextFunction) => {
    // 获取日志服务和配置服务
    ConfigService.getInstance();
    
    const logger = req.app.locals?.logger instanceof LoggerService
      ? req.app.locals.logger
      : new LoggerService('RequestLogger');
    
    // 检查是否跳过日志记录
    if (shouldSkipLogging(req, options)) {
      next();
      return;
    }
    
    // 获取请求ID并设置响应头
    const requestId = getRequestId(req);
    res.setHeader('X-Request-ID', requestId);
    
    // 如果启用了跟踪ID，生成并设置
    if (options.requestTraceId) {
      const traceId = getTraceId(req);
      (req as any).traceId = traceId;
      res.setHeader('X-Trace-ID', traceId);
    }
    
    // 开始性能监控
    const startTime = process.hrtime();
    (req as any)._startTime = startTime;
    
    // 记录请求开始
    logRequestStart(req, logger, options);
    
    // 保存原始的end方法引用
    const originalEnd = res.end;
    
    // 重写end方法以记录响应和性能指标
    res.end = function(_chunk?: any, _encoding?: any, _cb?: () => void) {
      // 计算执行时间
      const [seconds, nanoseconds] = process.hrtime((req as any)._startTime);
      const durationMs = seconds * 1000 + nanoseconds / 1e6;
      
      // 记录请求结束
      logRequestEnd(req, res, logger, options);
      
      // 性能监控：记录转换任务
      if (options.trackConversionTasks && req.path.includes('/convert')) {
        const isSlowTask = durationMs > options.conversionTaskThreshold!;
        
        // 收集任务指标
        const taskMetrics = {
          requestId,
          path: req.path,
          method: req.method,
          durationMs,
          statusCode: res.statusCode,
          isSlowTask,
          startTime: new Date((req as any)._startTime[0] * 1000).toISOString(),
        };
        
        // 记录性能指标
        performanceMonitor.recordTask(taskMetrics);
        
        // 记录慢任务警告
        if (isSlowTask) {
          logger.warn('慢转换任务检测', {
            ...taskMetrics,
            warning: `转换任务执行时间超过阈值 (${options.conversionTaskThreshold}ms)`,
          });
        }
      }
      
      // 调用原始的end方法
      return originalEnd.apply(this, arguments as any);
    };
    
    next();
  };
}

/**
 * @description 速率限制日志中间件
 */
export function rateLimitLoggerMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    // 检查是否是速率限制响应
    const isRateLimited = res.statusCode === 429;
    const retryAfter = res.get('Retry-After');
    
    if (isRateLimited && retryAfter) {
      const logger = req.app.locals?.logger instanceof LoggerService
        ? req.app.locals.logger
        : new LoggerService('RateLimitLogger');
      
      logger.warn('速率限制触发', {
        ip: req.ip,
        method: req.method,
        path: req.path,
        retryAfter,
        requestId: (req as any).requestId || getRequestId(req),
      });
    }
    
    next();
  };
}

/**
 * @description 性能监控中间件
 */
export function performanceMonitoringMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    const startTime = process.hrtime();
    const requestId = getRequestId(req);
    
    res.on('finish', () => {
      const [seconds, nanoseconds] = process.hrtime(startTime);
      const durationMs = seconds * 1000 + nanoseconds / 1e6;
      
      // 记录性能指标
      const performanceMetrics = {
        requestId,
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        durationMs,
        memoryUsage: process.memoryUsage().heapUsed,
      };
      
      // 可以在这里将性能指标发送到监控系统
      const logger = req.app.locals?.logger instanceof LoggerService
        ? req.app.locals.logger
        : new LoggerService('PerformanceMonitor');
      
      // 只有在开发环境或调试模式下才记录详细信息
      if (process.env.NODE_ENV === 'development' || process.env.DEBUG) {
        logger.debug('性能监控指标', performanceMetrics);
      }
      
      // 对于特别慢的请求，总是记录警告
      if (durationMs > 2000) { // 2秒
        logger.warn('性能警告：慢请求', performanceMetrics);
      }
    });
    
    next();
  };
}

// 默认的日志中间件实例
export const loggerMiddleware = createLoggerMiddleware();

export default loggerMiddleware;