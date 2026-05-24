/**
 * @file BaseConverter单元测试
 * @description 测试转换器基类的功能和错误处理
 * @module converters/BaseConverter.test
 * @author YYC
 * @version 1.0.0
 * @created 2024-01-16
 */

import { BaseConverter } from '../../src/converters/BaseConverter';
import { ConversionError } from '../../src/errors/ConversionError';
import { PerformanceMonitorService } from '../../src/services/PerformanceMonitorService';

// Mock依赖
jest.mock('../../src/services/PerformanceMonitorService');

// 创建测试用的子类
class TestConverter extends BaseConverter {
  getSupportedSourceFormats(): string[] {
    return ['test-format'];
  }

  getSupportedTargetFormats(): string[] {
    return ['test-target'];
  }

  protected async performConversion(sourceData: string, sourceFormat: string, targetFormat: string): Promise<string> {
    return `Converted: ${sourceData} from ${sourceFormat} to ${targetFormat}`;
  }
}

// 模拟转换失败的转换器
class FailingConverter extends BaseConverter {
  getSupportedSourceFormats(): string[] {
    return ['failing-format'];
  }

  getSupportedTargetFormats(): string[] {
    return ['failing-target'];
  }

  protected async performConversion(sourceData: string, sourceFormat: string, targetFormat: string): Promise<string> {
    throw new Error('模拟转换失败');
  }
}

describe('BaseConverter', () => {
  let converter: TestConverter;
  let failingConverter: FailingConverter;
  let monitorMock: jest.Mocked<ReturnType<typeof PerformanceMonitorService.getInstance>>;

  beforeEach(() => {
    // 重置所有模拟
    jest.clearAllMocks();
    
    // 获取性能监控服务的模拟实例
    monitorMock = {
      monitorAsync: jest.fn(),
      startOperation: jest.fn(),
      endOperation: jest.fn(),
      getStats: jest.fn()
    } as any;
    
    // 模拟单例方法
    (PerformanceMonitorService.getInstance as jest.Mock).mockReturnValue(monitorMock);
    
    converter = new TestConverter();
    failingConverter = new FailingConverter();
  });

  describe('supportsSourceFormat', () => {
    it('应该返回true对于支持的源格式', () => {
      expect(converter.supportsSourceFormat('test-format')).toBe(true);
    });

    it('应该返回false对于不支持的源格式', () => {
      expect(converter.supportsSourceFormat('unknown-format')).toBe(false);
    });
  });

  describe('supportsTargetFormat', () => {
    it('应该返回true对于支持的目标格式', () => {
      expect(converter.supportsTargetFormat('test-target')).toBe(true);
    });

    it('应该返回false对于不支持的目标格式', () => {
      expect(converter.supportsTargetFormat('unknown-target')).toBe(false);
    });
  });

  describe('convert', () => {
    it('应该成功执行转换并返回结果', async () => {
      const mockResult = 'Mocked conversion result';
      monitorMock.monitorAsync.mockImplementation(async (_, fn) => fn());
      
      const result = await converter.convert('test-data', 'test-format', 'test-target');
      
      expect(result).toBe('Converted: test-data from test-format to test-target');
      expect(monitorMock.monitorAsync).toHaveBeenCalledTimes(1);
    });

    it('应该在源格式不支持时抛出错误', async () => {
      await expect(
        converter.convert('test-data', 'unsupported-format', 'test-target')
      ).rejects.toThrow(ConversionError);
      await expect(
        converter.convert('test-data', 'unsupported-format', 'test-target')
      ).rejects.toThrow('不支持的源格式: unsupported-format');
    });

    it('应该在目标格式不支持时抛出错误', async () => {
      await expect(
        converter.convert('test-data', 'test-format', 'unsupported-target')
      ).rejects.toThrow(ConversionError);
      await expect(
        converter.convert('test-data', 'test-format', 'unsupported-target')
      ).rejects.toThrow('不支持的目标格式: unsupported-target');
    });

    it('应该正确包装和传递转换错误', async () => {
      await expect(
        failingConverter.convert('test-data', 'failing-format', 'failing-target')
      ).rejects.toThrow(ConversionError);
    });
  });

  describe('性能监控集成', () => {
    it('应该在转换过程中调用性能监控服务', async () => {
      const mockResult = 'Mocked result';
      monitorMock.monitorAsync.mockImplementation(async (_, fn) => fn());
      
      await converter.convert('test-data', 'test-format', 'test-target');
      
      expect(monitorMock.monitorAsync).toHaveBeenCalledWith(
        'TestConverter.convert',
        expect.any(Function),
        {
          formatInfo: {
            sourceFormat: 'test-format',
            targetFormat: 'test-target'
          },
          dataSize: 9 // 'test-data'的长度
        }
      );
    });
  });
});