/**
 * @file CsvJsonConverter单元测试
 * @description 测试CSV与JSON之间的转换功能
 * @module converters/CsvJsonConverter.test
 * @author YYC
 * @version 1.0.0
 * @created 2024-01-16
 */

import { CsvJsonConverter } from '../../src/converters/CsvJsonConverter';
import { ConversionError } from '../../src/errors/ConversionError';

const converter = new CsvJsonConverter();

describe('CsvJsonConverter', () => {
  describe('支持的格式', () => {
    it('应该支持正确的源格式', () => {
      const sourceFormats = converter.getSupportedSourceFormats();
      expect(sourceFormats).toContain('csv');
      expect(sourceFormats).toContain('tsv');
      expect(sourceFormats).toContain('json');
    });

    it('应该支持正确的目标格式', () => {
      const targetFormats = converter.getSupportedTargetFormats();
      expect(targetFormats).toContain('csv');
      expect(targetFormats).toContain('tsv');
      expect(targetFormats).toContain('json');
    });

    it('应该正确检测支持的格式', () => {
      expect(converter.supportsSourceFormat('csv')).toBe(true);
      expect(converter.supportsTargetFormat('json')).toBe(true);
      expect(converter.supportsSourceFormat('xml')).toBe(false);
    });
  });

  describe('CSV到JSON转换', () => {
    it('应该成功将CSV转换为JSON', async () => {
      const csvData = 'name,age,city\nJohn,30,New York\nAlice,25,Boston';
      const result = await converter.convert(csvData, 'csv', 'json');
      const parsedResult = JSON.parse(result);
      
      expect(Array.isArray(parsedResult)).toBe(true);
      expect(parsedResult.length).toBe(2);
      expect(parsedResult[0]).toEqual({ name: 'John', age: '30', city: 'New York' });
      expect(parsedResult[1]).toEqual({ name: 'Alice', age: '25', city: 'Boston' });
    });

    it('应该成功将TSV转换为JSON', async () => {
      const tsvData = 'name\tage\tcity\nJohn\t30\tNew York\nAlice\t25\tBoston';
      const result = await converter.convert(tsvData, 'tsv', 'json');
      const parsedResult = JSON.parse(result);
      
      expect(Array.isArray(parsedResult)).toBe(true);
      expect(parsedResult.length).toBe(2);
      expect(parsedResult[0]).toEqual({ name: 'John', age: '30', city: 'New York' });
    });

    it('应该处理包含逗号的CSV数据', async () => {
      const csvData = 'name,city\nJohn,"New York, NY"\nAlice,Boston';
      const result = await converter.convert(csvData, 'csv', 'json');
      const parsedResult = JSON.parse(result);
      
      expect(parsedResult[0].city).toBe('New York, NY');
    });

    it('应该处理空CSV数据', async () => {
      const csvData = 'name,age\n';
      const result = await converter.convert(csvData, 'csv', 'json');
      const parsedResult = JSON.parse(result);
      
      expect(Array.isArray(parsedResult)).toBe(true);
      expect(parsedResult.length).toBe(0);
    });

    it('应该处理只有表头的CSV数据', async () => {
      const csvData = 'name,age,city';
      const result = await converter.convert(csvData, 'csv', 'json');
      const parsedResult = JSON.parse(result);
      
      expect(Array.isArray(parsedResult)).toBe(true);
      expect(parsedResult.length).toBe(0);
    });
  });

  describe('JSON到CSV转换', () => {
    it('应该成功将JSON转换为CSV', async () => {
      const jsonData = JSON.stringify([
        { name: 'John', age: '30', city: 'New York' },
        { name: 'Alice', age: '25', city: 'Boston' }
      ]);
      const result = await converter.convert(jsonData, 'json', 'csv');
      
      expect(result).toContain('name,age,city');
      expect(result).toContain('John,30,New York');
      expect(result).toContain('Alice,25,Boston');
    });

    it('应该成功将JSON转换为TSV', async () => {
      const jsonData = JSON.stringify([
        { name: 'John', age: '30', city: 'New York' },
        { name: 'Alice', age: '25', city: 'Boston' }
      ]);
      const result = await converter.convert(jsonData, 'json', 'tsv');
      
      expect(result).toContain('name\tage\tcity');
      expect(result).toContain('John\t30\tNew York');
    });

    it('应该处理包含逗号的JSON数据', async () => {
      const jsonData = JSON.stringify([
        { name: 'John', city: 'New York, NY' }
      ]);
      const result = await converter.convert(jsonData, 'json', 'csv');
      
      expect(result).toContain('name,city');
      expect(result).toContain('John,"New York, NY"');
    });

    it('应该处理空JSON数组', async () => {
      const jsonData = JSON.stringify([]);
      await expect(
        converter.convert(jsonData, 'json', 'csv')
      ).rejects.toThrow(ConversionError);
    });
  });

  describe('错误处理', () => {
    it('应该处理无效的CSV格式', async () => {
      const invalidCsv = 'name,age\nJohn\nAlice,25';
      await expect(
        converter.convert(invalidCsv, 'csv', 'json')
      ).rejects.toThrow(ConversionError);
    });

    it('应该处理无效的JSON格式', async () => {
      const invalidJson = '{"name": "John",}';
      await expect(
        converter.convert(invalidJson, 'json', 'csv')
      ).rejects.toThrow(ConversionError);
    });

    it('应该处理不支持的转换方向', async () => {
      await expect(
        converter.convert('data', 'xml', 'json')
      ).rejects.toThrow(ConversionError);
    });
  });
});