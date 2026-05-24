/**
 * @file PerformanceMonitorService单元测试
 * @description 测试性能监控服务的功能
 * @module services/PerformanceMonitorService.test
 * @author YYC
 * @version 1.0.0
 * @created 2024-01-16
 */

import { PerformanceMonitorService, PerformanceMetrics } from '../../src/services/PerformanceMonitorService';
import { LoggerService } from '../../src/services/LoggerService';

// Mock依赖
jest.mock('../../src/services/LoggerService');

const mockLoggerService = LoggerService as jest.MockedClass<typeof LoggerService>;
let mockLogger: any;

describe('PerformanceMonitorService', () => {
  let monitorService: PerformanceMonitorService;
  let originalProcessHrtime: typeof process.hrtime;
  
  // 模拟时间戳生成
  const mockTime = 1000000000; // 1秒
  
  beforeEach(() => {
    // 重置所有模拟
    jest.clearAllMocks();
    
    // 创建模拟日志器
    mockLogger = {
      debug: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    };
    mockLoggerService.mockImplementation(() => mockLogger);
    
    // 保存原始的process.hrtime方法
    originalProcessHrtime = process.hrtime;
    
    // 模拟process.hrtime
    let callCount = 0;
    process.hrtime = jest.fn(() => {
      callCount++;
      if (callCount === 1) return [0, 0]; // 第一次调用返回开始时间
      return [1, 500000000]; // 第二次调用返回1秒500毫秒后
    }) as any;
    
    // 确保每次测试使用新实例
    jest.spyOn(PerformanceMonitorService, 'getInstance').mockImplementation(() => {
      return new PerformanceMonitorService();
    });
    
    monitorService = PerformanceMonitorService.getInstance();
  });
  
  afterEach(() => {
    // 恢复原始方法
    process.hrtime = originalProcessHrtime;
  });
  
  describe('单例模式', () => {
    it('应该返回相同的实例', () => {
      const instance1 = PerformanceMonitorService.getInstance();
      const instance2 = PerformanceMonitorService.getInstance();
      
      expect(instance1).toBe(instance2);
    });
  });
  
  describe('基本监控功能', () => {
    it('应该成功开始和结束操作监控', () => {
      const operationId = 'test-op-123';
      
      monitorService.startOperation(operationId, 'testOperation', { testKey: 'testValue' });
      const metrics = monitorService.endOperation(operationId, true);
      
      expect(metrics).toBeDefined();
      expect(metrics.operation).toBe('testOperation');
      expect(metrics.durationMs).toBeGreaterThan(0);
      expect(metrics.success).toBe(true);
    });
    
    it('应该正确处理失败的操作', () => {
      const operationId = 'test-op-456';
      
      monitorService.startOperation(operationId, 'testOperation');
      const metrics = monitorService.endOperation(operationId, false, {
        errorMessage: '操作失败原因'
      });
      
      expect(metrics.success).toBe(false);
      expect(metrics.errorMessage).toBe('操作失败原因');
    });
    
    it('应该在未找到开始记录时抛出错误', () => {
      expect(() => {
        monitorService.endOperation('nonexistent-operation');
      }).toThrow('未找到操作ID: nonexistent-operation 的开始记录');
    });
  });
  
  describe('异步函数监控', () => {
    it('应该成功监控异步函数的执行', async () => {
      const mockFn = jest.fn().mockResolvedValue('test-result');
      
      const result = await monitorService.monitorAsync('testAsyncOp', mockFn, {
        formatInfo: { source: 'csv', target: 'json' }
      });
      
      expect(result).toBe('test-result');
      expect(mockFn).toHaveBeenCalled();
      expect(mockLogger.debug).toHaveBeenCalled();
    });
    
    it('应该正确处理异步函数抛出的错误', async () => {
      const mockFn = jest.fn().mockRejectedValue(new Error('异步操作失败'));
      
      await expect(
        monitorService.monitorAsync('testAsyncOp', mockFn)
      ).rejects.toThrow('异步操作失败');
      
      // 验证错误被记录
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });
  
  describe('性能统计', () => {
    it('应该返回正确的性能统计信息', () => {
      const stats = monitorService.getStats();
      
      expect(stats).toHaveProperty('activeOperations');
      expect(stats).toHaveProperty('memoryUsage');
      expect(stats).toHaveProperty('uptime');
      
      expect(typeof stats.activeOperations).toBe('number');
      expect(typeof stats.uptime).toBe('number');
      expect(typeof stats.memoryUsage).toBe('object');
    });
  });
  
  describe('日志记录', () => {
    it('应该为正常操作记录debug日志', () => {
      const operationId = 'log-test-1';
      
      monitorService.startOperation(operationId, 'normalOperation');
      monitorService.endOperation(operationId, true);
      
      expect(mockLogger.debug).toHaveBeenCalled();
      expect(mockLogger.warn).not.toHaveBeenCalled();
    });
    
    // 注意：这里我们不测试慢操作警告，因为我们模拟的时间是固定的
    // 实际使用中，需要根据阈值进行测试
  });
});