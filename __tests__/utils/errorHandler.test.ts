/**
 * @file ErrorHandler 工具测试
 * @description 错误处理工具函数的单元测试
 * @module __tests__/utils/errorHandler.test
 * @author YYC
 * @version 1.0.0
 * @created 2026-02-22
 */

import {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  ExternalServiceError,
  ErrorHandler,
  handleApiError
} from '@/app/utils/errorHandler';

describe('ErrorHandler Utils', () => {
  beforeEach(() => {
    ErrorHandler.clearLogs();
  });

  describe('AppError', () => {
    it('should create an AppError with default values', () => {
      const error = new AppError('Test error');
      
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('UNKNOWN_ERROR');
      expect(error.statusCode).toBe(500);
      expect(error.isOperational).toBe(true);
      expect(error.timestamp).toBeInstanceOf(Date);
    });

    it('should create an AppError with custom values', () => {
      const details = { field: 'email' };
      const error = new AppError('Test error', 'CUSTOM_CODE', 400, true, details);
      
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('CUSTOM_CODE');
      expect(error.statusCode).toBe(400);
      expect(error.isOperational).toBe(true);
      expect(error.details).toEqual(details);
    });
  });

  describe('ValidationError', () => {
    it('should create a ValidationError with correct values', () => {
      const error = new ValidationError('Invalid email', { field: 'email' });
      
      expect(error.message).toBe('Invalid email');
      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.statusCode).toBe(400);
      expect(error.details).toEqual({ field: 'email' });
    });
  });

  describe('AuthenticationError', () => {
    it('should create an AuthenticationError with default message', () => {
      const error = new AuthenticationError();
      
      expect(error.message).toBe('认证失败');
      expect(error.code).toBe('AUTHENTICATION_ERROR');
      expect(error.statusCode).toBe(401);
    });

    it('should create an AuthenticationError with custom message', () => {
      const error = new AuthenticationError('Token已过期');
      
      expect(error.message).toBe('Token已过期');
    });
  });

  describe('AuthorizationError', () => {
    it('should create an AuthorizationError with correct values', () => {
      const error = new AuthorizationError();
      
      expect(error.message).toBe('权限不足');
      expect(error.code).toBe('AUTHORIZATION_ERROR');
      expect(error.statusCode).toBe(403);
    });
  });

  describe('NotFoundError', () => {
    it('should create a NotFoundError with correct message', () => {
      const error = new NotFoundError('User');
      
      expect(error.message).toBe('User不存在');
      expect(error.code).toBe('NOT_FOUND');
      expect(error.statusCode).toBe(404);
    });
  });

  describe('ConflictError', () => {
    it('should create a ConflictError with correct values', () => {
      const error = new ConflictError('资源已存在');
      
      expect(error.message).toBe('资源已存在');
      expect(error.code).toBe('CONFLICT');
      expect(error.statusCode).toBe(409);
    });
  });

  describe('RateLimitError', () => {
    it('should create a RateLimitError with default message', () => {
      const error = new RateLimitError();
      
      expect(error.message).toBe('请求过于频繁，请稍后再试');
      expect(error.code).toBe('RATE_LIMIT');
      expect(error.statusCode).toBe(429);
    });
  });

  describe('ExternalServiceError', () => {
    it('should create an ExternalServiceError with correct values', () => {
      const originalError = new Error('Connection refused');
      const error = new ExternalServiceError('Database', originalError);
      
      expect(error.message).toBe('Database服务暂不可用');
      expect(error.code).toBe('EXTERNAL_SERVICE_ERROR');
      expect(error.statusCode).toBe(503);
      expect(error.details).toBe('Connection refused');
    });
  });

  describe('ErrorHandler.handle', () => {
    it('should handle AppError', () => {
      const appError = new ValidationError('Test validation error');
      const result = ErrorHandler.handle(appError, 'test-context');
      
      expect(result).toBe(appError);
    });

    it('should wrap plain Error', () => {
      const plainError = new Error('Plain error');
      const result = ErrorHandler.handle(plainError, 'test-context');
      
      expect(result.message).toBe('Plain error');
      expect(result.code).toBe('INTERNAL_ERROR');
      expect(result.isOperational).toBe(false);
    });

    it('should handle unknown error', () => {
      const result = ErrorHandler.handle('string error', 'test-context');
      
      expect(result.message).toBe('未知错误');
      expect(result.code).toBe('UNKNOWN_ERROR');
    });
  });

  describe('handleApiError', () => {
    it('should handle AppError', () => {
      const error = new NotFoundError('User');
      const result = handleApiError(error);
      
      expect(result.message).toBe('User不存在');
      expect(result.statusCode).toBe(404);
      expect(result.code).toBe('NOT_FOUND');
    });

    it('should handle plain Error', () => {
      const error = new Error('Network error');
      const result = handleApiError(error);
      
      expect(result.message).toBe('Network error');
      expect(result.statusCode).toBe(500);
      expect(result.code).toBe('INTERNAL_ERROR');
    });

    it('should handle unknown error', () => {
      const result = handleApiError(null);
      
      expect(result.message).toBe('服务器错误');
      expect(result.statusCode).toBe(500);
    });
  });

  describe('ErrorHandler logging', () => {
    it('should log errors', () => {
      const error = new AppError('Test error');
      ErrorHandler.handle(error, 'test');
      
      const logs = ErrorHandler.getLogs();
      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0].message).toBe('Test error');
    });

    it('should clear logs', () => {
      const error = new AppError('Test error');
      ErrorHandler.handle(error, 'test');
      ErrorHandler.clearLogs();
      
      const logs = ErrorHandler.getLogs();
      expect(logs.length).toBe(0);
    });

    it('should limit log count', () => {
      for (let i = 0; i < 1005; i++) {
        ErrorHandler.handle(new AppError(`Error ${i}`), 'test');
      }
      
      const logs = ErrorHandler.getLogs();
      expect(logs.length).toBeLessThanOrEqual(1000);
    });
  });
});
