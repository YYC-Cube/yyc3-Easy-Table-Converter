/**
 * @file 错误处理工具函数
 * @description 统一的错误处理工具函数和类
 * @module utils/errorHandler
 * @author YYC
 * @version 1.0.0
 * @created 2026-02-22
 */

export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly timestamp: Date;
  public readonly details?: any;

  constructor(
    message: string,
    code: string = 'UNKNOWN_ERROR',
    statusCode: number = 500,
    isOperational: boolean = true,
    details?: any
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.timestamp = new Date();
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', 400, true, details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = '认证失败') {
    super(message, 'AUTHENTICATION_ERROR', 401, true);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = '权限不足') {
    super(message, 'AUTHORIZATION_ERROR', 403, true);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource}不存在`, 'NOT_FOUND', 404, true);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 'CONFLICT', 409, true);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = '请求过于频繁，请稍后再试') {
    super(message, 'RATE_LIMIT', 429, true);
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, originalError?: Error) {
    super(
      `${service}服务暂不可用`,
      'EXTERNAL_SERVICE_ERROR',
      503,
      true,
      originalError?.message
    );
  }
}

interface ErrorLogEntry {
  timestamp: Date;
  level: 'error' | 'warn' | 'info';
  message: string;
  code?: string;
  stack?: string;
  details?: any;
  userId?: number;
  path?: string;
}

class ErrorHandler {
  private static logs: ErrorLogEntry[] = [];
  private static maxLogs: number = 1000;
  private static onErrorCallback?: (entry: ErrorLogEntry) => void;

  static configure(options: { maxLogs?: number; onError?: (entry: ErrorLogEntry) => void }) {
    if (options.maxLogs) {
      this.maxLogs = options.maxLogs;
    }
    if (options.onError) {
      this.onErrorCallback = options.onError;
    }
  }

  static handle(error: unknown, context?: string): AppError {
    let appError: AppError;

    if (error instanceof AppError) {
      appError = error;
    } else if (error instanceof Error) {
      appError = new AppError(
        error.message,
        'INTERNAL_ERROR',
        500,
        false,
        context
      );
    } else {
      appError = new AppError(
        '未知错误',
        'UNKNOWN_ERROR',
        500,
        false,
        context
      );
    }

    this.log(appError, context);
    return appError;
  }

  static log(error: AppError, context?: string) {
    const entry: ErrorLogEntry = {
      timestamp: new Date(),
      level: error.statusCode >= 500 ? 'error' : 'warn',
      message: error.message,
      code: error.code,
      stack: error.stack,
      details: error.details
    };

    this.logs.unshift(entry);

    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    if (this.onErrorCallback) {
      this.onErrorCallback(entry);
    }

    if (process.env.NODE_ENV !== 'production') {
      console.error(`[${context || 'ErrorHandler'}]`, error);
    }
  }

  static getLogs(): ErrorLogEntry[] {
    return [...this.logs];
  }

  static clearLogs() {
    this.logs = [];
  }

  static async reportToServer(error: AppError, additionalInfo?: any) {
    if (typeof window === 'undefined') return;

    try {
      await fetch('/api/error-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: error.message,
          code: error.code,
          statusCode: error.statusCode,
          stack: error.stack,
          details: error.details,
          timestamp: error.timestamp,
          additionalInfo,
          userAgent: navigator.userAgent,
          url: window.location.href
        })
      });
    } catch (e) {
      console.error('Failed to report error:', e);
    }
  }
}

function formatZodErrors(zodError: any): string {
  return zodError.errors
    .map((err: any) => `${err.path.join('.')}: ${err.message}`)
    .join('; ');
}

export function handleApiError(error: unknown): { message: string; statusCode: number; code: string } {
  if (error instanceof AppError) {
    return {
      message: error.message,
      statusCode: error.statusCode,
      code: error.code
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      statusCode: 500,
      code: 'INTERNAL_ERROR'
    };
  }

  return {
    message: '服务器错误',
    statusCode: 500,
    code: 'UNKNOWN_ERROR'
  };
}

export { ErrorHandler };
export default ErrorHandler;
