/**
 * @file ConversionService集成测试
 * @description 测试转换服务与转换器的集成功能
 * @module services/ConversionService.test
 * @author YYC
 * @version 1.0.0
 * @created 2024-01-16
 */

import { ConversionService } from '../../src/services/ConversionService';
import { ConverterFactory } from '../../src/converters/ConverterFactory';
import { ConversionError } from '../../src/errors/ConversionError';
import { ConversionFormat } from '../../src/types/ConversionFormat';

// Mock依赖
jest.mock('../../src/converters/ConverterFactory');

const mockConverterFactory = ConverterFactory as jest.MockedClass<typeof ConverterFactory>;

describe('ConversionService', () => {
  let conversionService: ConversionService;
  let mockConverter: any;
  let originalGetInstance: any;

  beforeEach(() => {
    // 重置所有模拟
    jest.clearAllMocks();
    
    // 创建模拟转换器
    mockConverter = {
      convert: jest.fn()
    };
    
    // 模拟工厂方法
    mockConverterFactory.getInstance.mockReturnValue({
      createConverter: jest.fn().mockReturnValue(mockConverter),
      getSupportedConversions: jest.fn().mockReturnValue([
        { sourceFormat: 'csv', targetFormat: 'json' },
        { sourceFormat: 'json', targetFormat: 'csv' }
      ]),
      isConversionSupported: jest.fn((source: string, target: string) => {
        return (source === 'csv' && target === 'json') || 
               (source === 'json' && target === 'csv');
      })
    });
    
    conversionService = new ConversionService();
  });

  describe('convert', () => {
    it('应该成功执行转换并返回结果', async () => {
      const testData = 'test,data\n1,2';
      const expectedResult = '{"result":"converted"}';
      
      mockConverter.convert.mockResolvedValue(expectedResult);
      
      const result = await conversionService.convert(testData, 'csv', 'json');
      
      expect(result).toBe(expectedResult);
      expect(mockConverter.convert).toHaveBeenCalledWith(testData, 'csv', 'json');
    });

    it('应该在转换失败时抛出错误', async () => {
      const testData = 'invalid,data';
      const conversionError = new ConversionError('转换失败');
      
      mockConverter.convert.mockRejectedValue(conversionError);
      
      await expect(
        conversionService.convert(testData, 'csv', 'json')
      ).rejects.toThrow(ConversionError);
    });

    it('应该在工厂创建转换器失败时抛出错误', async () => {
      const testData = 'test,data';
      
      mockConverterFactory.getInstance.mockReturnValue({
        createConverter: jest.fn().mockRejectedValue(new Error('工厂错误'))
      });
      
      await expect(
        conversionService.convert(testData, 'csv', 'json')
      ).rejects.toThrow(ConversionError);
    });
  });

  describe('getSupportedConversions', () => {
    it('应该返回所有支持的转换格式', async () => {
      const expectedConversions: ConversionFormat[] = [
        { sourceFormat: 'csv', targetFormat: 'json' },
        { sourceFormat: 'json', targetFormat: 'csv' }
      ];
      
      mockConverterFactory.getInstance.mockReturnValue({
        getSupportedConversions: jest.fn().mockReturnValue(expectedConversions)
      });
      
      const result = await conversionService.getSupportedConversions();
      
      expect(result).toEqual(expectedConversions);
      expect(mockConverterFactory.getInstance().getSupportedConversions).toHaveBeenCalled();
    });
  });

  describe('isConversionSupported', () => {
    it('应该返回true对于支持的转换', () => {
      const result = conversionService.isConversionSupported('csv', 'json');
      
      expect(result).toBe(true);
      expect(mockConverterFactory.getInstance().isConversionSupported).toHaveBeenCalledWith('csv', 'json');
    });

    it('应该返回false对于不支持的转换', () => {
      const result = conversionService.isConversionSupported('csv', 'xml');
      
      expect(result).toBe(false);
    });
  });

  describe('批量转换功能', () => {
    it('应该成功执行批量转换', async () => {
      const batchData = [
        { id: '1', data: 'test1,data1', sourceFormat: 'csv', targetFormat: 'json' },
        { id: '2', data: 'test2,data2', sourceFormat: 'csv', targetFormat: 'json' }
      ];
      
      mockConverter.convert.mockResolvedValueOnce('result1').mockResolvedValueOnce('result2');
      
      const results = await conversionService.batchConvert(batchData);
      
      expect(results.length).toBe(2);
      expect(results[0].id).toBe('1');
      expect(results[0].result).toBe('result1');
      expect(results[1].id).toBe('2');
      expect(results[1].result).toBe('result2');
    });

    it('应该处理批量转换中的部分失败', async () => {
      const batchData = [
        { id: '1', data: 'test1,data1', sourceFormat: 'csv', targetFormat: 'json' },
        { id: '2', data: 'invalid', sourceFormat: 'csv', targetFormat: 'json' }
      ];
      
      mockConverter.convert
        .mockResolvedValueOnce('result1')
        .mockRejectedValueOnce(new ConversionError('转换失败'));
      
      const results = await conversionService.batchConvert(batchData);
      
      expect(results.length).toBe(2);
      expect(results[0].success).toBe(true);
      expect(results[0].result).toBe('result1');
      expect(results[1].success).toBe(false);
      expect(results[1].error).toBeDefined();
    });
  });
});