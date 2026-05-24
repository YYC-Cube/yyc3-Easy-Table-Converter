/**
 * @file 错误处理中间件
 * @description 提供统一的错误捕获、日志记录和格式化响应
 * @module services/conversion-service/src/middleware/errorHandler
 * @author YYC
 * @version 2.0.0
 * @created 2024-11-23
 */

import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';
import { LoggerService } from '../services/LoggerService';
import { PerformanceMonitorService } from '../services/PerformanceMonitorService';

// 自定义错误类型
export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public isOperational = true,
    public details?: Record<string, any>,
    public errorCode?: string
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

// 验证错误类
export class ValidationError extends AppError {
  constructor(message: string, public validationErrors?: Record<string, string>) {
    super(400, message, true, { validationErrors });
    this.name = 'ValidationError';
  }
}

// 授权错误类
export class AuthorizationError extends AppError {
  constructor(message: string = '权限不足') {
    super(403, message, true);
    this.name = 'AuthorizationError';
  }
}

// 资源未找到错误类
export class NotFoundError extends AppError {
  constructor(resourceType: string, resourceId?: string) {
    const message = resourceId 
      ? `资源 ${resourceType} (ID: ${resourceId}) 未找到` 
      : `资源 ${resourceType} 未找到`;
    super(404, message, true, { resourceType, resourceId });
    this.name = 'NotFoundError';
  }
}

// 业务逻辑错误类
export class BusinessLogicError extends AppError {
  constructor(message: string, errorCode?: string) {
    super(422, message, true, undefined, errorCode);
    this.name = 'BusinessLogicError';
  }
}

// 文件格式错误
export class FileFormatError extends AppError {
  constructor(message: string, data?: Record<string, any>) {
    super(400, message, true, data || {}, 'FILE_FORMAT_ERROR');
    this.name = 'FileFormatError';
  }
}

// 转换错误
export class FormatConversionError extends AppError {
  constructor(message: string, data?: Record<string, any>) {
    super(400, message, true, data || {}, 'CONVERSION_ERROR');
    this.name = 'FormatConversionError';
  }
}

// 服务不可用错误
export class ServiceUnavailableError extends AppError {
  constructor(message: string, data?: Record<string, any>) {
    super(503, message, true, data || {}, 'SERVICE_UNAVAILABLE');
    this.name = 'ServiceUnavailableError';
  }
}

// 错误响应接口
interface ErrorResponse {
  error: string;
  message: string;
  statusCode: number;
  requestId?: string;
  errorCode?: string;
  details?: Record<string, any>;
  stack?: string;
}

/**
 * @description 获取请求ID的辅助函数
 */
function getRequestId(req: Request): string {
  return req.headers['x-request-id'] as string || 
         req.headers['request-id'] as string ||
         `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * @description 创建错误响应的辅助函数
 */
function createErrorResponse(
  error: Error | AppError,
  req: Request,
  showDetails: boolean
): ErrorResponse {
  const requestId = getRequestId(req);
  
  // 如果是自定义的AppError
  if (error instanceof AppError) {
    const response: ErrorResponse = {
      error: error.name || 'Error',
      message: error.message,
      statusCode: error.statusCode,
      requestId,
    };
    
    if (error.errorCode) {
      response.errorCode = error.errorCode;
    }
    
    if (showDetails && error.details) {
      response.details = error.details;
    }
    
    if (showDetails && error.stack) {
      response.stack = error.stack;
    }
    
    return response;
  }
  
  // 处理普通错误
  const response: ErrorResponse = {
    error: error.name || 'InternalServerError',
    message: showDetails ? error.message : '服务器内部错误',
    statusCode: 500,
    requestId,
  };
  
  if (showDetails && error.stack) {
    response.stack = error.stack;
  }
  
  return response;
}

/**
 * @description 记录错误日志的辅助函数
 */
function logError(
  error: Error,
  req: Request,
  logger?: LoggerService
): void {
  const requestId = getRequestId(req);
  const logContext = {
    requestId,
    method: req.method,
    url: req.url,
    path: req.path,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    error: error.message,
    stack: error.stack,
    errorType: error.name
  };
  
  // 如果有附加的错误详情，也记录下来
    if ('details' in error && error.details) {
      (logContext as any)['details'] = error.details;
    }
  
  // 根据错误类型选择日志级别
  if (error instanceof AppError) {
    if (error.statusCode >= 500) {
      (logger || console).error('业务错误 - 服务器内部错误', logContext);
    } else if (error.statusCode >= 400) {
      (logger || console).warn('业务错误 - 客户端错误', logContext);
    } else {
      (logger || console).info('业务错误 - 信息性错误', logContext);
    }
  } else {
    // 未捕获的异常，记录为错误
    (logger || console).error('未捕获的异常', logContext);
  }
}

/**
 * 错误处理中间件类
 */
export class ErrorHandlerMiddleware {
  private logger: LoggerService;
  private performanceMonitor: PerformanceMonitorService;

  constructor(logger: LoggerService, performanceMonitor: PerformanceMonitorService) {
    this.logger = logger;
    this.performanceMonitor = performanceMonitor;
  }

  /**
   * 错误处理函数
   */
  handle: ErrorRequestHandler = (error, req, res) => {
    // 获取日志服务
    const logger = req.app.locals?.logger instanceof LoggerService
      ? req.app.locals.logger
      : this.logger;
      
    // 获取性能监控服务
    const performanceMonitor = req.app.locals?.performanceMonitor instanceof PerformanceMonitorService
      ? req.app.locals.performanceMonitor
      : this.performanceMonitor;
    
    // 记录性能指标
    const taskId = req.headers['x-task-id'] as string;
    if (taskId) {
      performanceMonitor.endTask(taskId, 'failed');
    }
    
    // 确定是否显示详细错误信息
    const showDetails = process.env.NODE_ENV !== 'production';
    
    try {
      // 记录错误
      logError(error, req, logger);
      
      // 创建错误响应
      const errorResponse = createErrorResponse(error, req, showDetails);
      
      // 确保响应头中包含请求ID
      if (errorResponse.requestId) {
        res.setHeader('X-Request-ID', errorResponse.requestId);
      }
      
      // 发送错误响应
      res.status(errorResponse.statusCode).json(errorResponse);
    } catch (handlerError) {
      // 如果错误处理本身出错，记录并返回一个简单的500错误
      console.error('Error handler failed:', handlerError);
      res.status(500).json({
        error: 'ErrorHandlerFailure',
        message: '服务器内部错误',
        statusCode: 500
      });
    }
  };
}

/**
 * 默认错误处理中间件
 */
export const errorHandler: ErrorRequestHandler = new ErrorHandlerMiddleware(
  new LoggerService('ErrorHandler'),
  new PerformanceMonitorService()
).handle;

/**
 * @description 404错误处理中间件
 */
export const notFoundHandler = (req: Request, _res: Response, next: NextFunction) => {
  next(new NotFoundError('路由', `${req.method} ${req.path}`));
};

/**
 * @description 请求验证中间件工厂函数
 * @param schema - 验证模式对象
 */
export function validateRequest<_T>(schema: {
  body?: (data: any) => void;
  params?: (data: any) => void;
  query?: (data: any) => void;
}) {
  return (req: Request, __res: Response, next: NextFunction) => {
    try {
      // 验证请求体
      if (schema.body && req.body) {
        schema.body(req.body);
      }
      
      // 验证路径参数
      if (schema.params && req.params) {
        schema.params(req.params);
      }
      
      // 验证查询参数
      if (schema.query && req.query) {
        schema.query(req.query);
      }
      
      next();
    } catch (error) {
      const validationError = error instanceof Error 
        ? new ValidationError('请求参数验证失败', { [error.name]: error.message })
        : new ValidationError('请求参数验证失败');
      
      next(validationError);
    }
  };
}

/**
 * @description 异步错误捕获包装器（用于异步路由处理函数）
 */
export function asyncHandler<T extends (...args: any[]) => Promise<any>>(fn: T) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * @description 创建Zod验证包装器
 * @param schema - Zod模式
 */
export function zodValidator<T>(schema: {
  parse: (data: any) => T;
}) {
  return (data: any) => {
    try {
      return schema.parse(data);
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        const validationErrors: Record<string, string> = {};
        
        // 尝试提取Zod错误详情
        if ('issues' in error && Array.isArray(error.issues)) {
          error.issues.forEach((issue: any) => {
            const path = issue.path?.join('.') || 'unknown';
            validationErrors[path] = issue.message || '验证失败';
          });
        }
        
        throw new ValidationError('数据验证失败', validationErrors);
      }
      throw error;
    }
  };
}

// 创建请求ID中间件
export const requestIdMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const requestId = getRequestId(req);
  res.setHeader('x-request-id', requestId);
  req.headers['x-request-id'] = requestId;
  next();
};

export default errorHandler;