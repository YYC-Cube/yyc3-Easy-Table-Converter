/**
 * @file CSV到JSON转换器
 * @description 实现CSV格式到JSON格式的转换功能
 * @module services/conversion-service/src/converters/CsvToJsonConverter
 * @author YYC
 * @version 2.0.0
 * @created 2024-11-23
 */

import { BaseConverter } from './BaseConverter';
import { DataFormat } from '../types';
import { ConversionOptions } from './IConverter';

/**
 * CSV到JSON转换器类
 */
export class CsvToJsonConverter extends BaseConverter {
  /**
   * 获取支持的源格式
   */
  getSupportedSourceFormat(): DataFormat {
    return DataFormat.CSV;
  }

  /**
   * 获取支持的目标格式列表
   */
  getSupportedTargetFormats(): DataFormat[] {
    return [DataFormat.JSON];
  }

  /**
   * 执行CSV到JSON的转换
   * @param sourceData CSV源数据
   * @param targetFormat 目标格式
   * @param options 转换选项
   */
  protected async performConversion(
    sourceData: Buffer,
    targetFormat: DataFormat,
    options: ConversionOptions
  ): Promise<{
    data: Buffer;
    metadata: {
      rows: number;
      columns: number;
      [key: string]: any;
    };
  }> {
    this.logger.info(`[CsvToJsonConverter] 开始CSV到JSON转换，选项: ${JSON.stringify(options)}`);
    
    // 获取转换选项
    const headers = options.headers !== false; // 默认使用第一行为表头
    const delimiter = options.delimiter || ',';
    const quote = options.quote || '"';
    const escape = options.escape || '\\';
    const skipEmptyLines = options.skipEmptyLines !== false;
    
    // 将Buffer转换为字符串
    const csvContent = sourceData.toString('utf-8');
    
    // 解析CSV数据
    const parsed = this.parseCsv(csvContent, {
      headers,
      delimiter,
      quote,
      escape,
      skipEmptyLines
    });
    
    // 将解析结果转换为JSON字符串
    const jsonString = JSON.stringify(parsed.data, null, options.pretty ? 2 : 0);
    
    this.logger.info(`[CsvToJsonConverter] CSV转换完成，解析了 ${parsed.rows} 行，${parsed.columns} 列`);
    
    return {
      data: Buffer.from(jsonString),
      metadata: {
        rows: parsed.rows,
        columns: parsed.columns,
        delimiter,
        hasHeaders: headers
      }
    };
  }

  /**
   * 向后兼容：执行CSV到JSON的转换
   * @param data CSV数据
   * @param options 转换选项
   */
  protected async performConversionLegacy(
    data: string | Buffer,
    options: ConversionOptions
  ): Promise<string> {
    const bufferData = typeof data === 'string' ? Buffer.from(data) : data;
    const result = await this.performConversion(bufferData, DataFormat.JSON, options);
    return result.data.toString('utf-8');
  }

  /**
   * 验证CSV文件
   * @param data CSV数据
   */
  async validate(data: Buffer): Promise<any> {
    try {
      // 尝试解析CSV数据来验证
      const csvContent = data.toString('utf-8');
      const parsed = this.parseCsv(csvContent, {
        headers: true,
        delimiter: ',',
        quote: '"',
        escape: '\\',
        skipEmptyLines: true
      });
      
      // 检查是否有数据
      if (parsed.rows === 0) {
        return this.createValidationError('CSV文件为空');
      }
      
      // 检查列数一致性
      if (!this.validateColumnConsistency(parsed.rawRows, parsed.columns)) {
        return this.createValidationError('CSV文件中各行的列数不一致');
      }
      
      return this.createValidationSuccess();
    } catch (error) {
      return this.createValidationError(
        error instanceof Error ? error.message : 'CSV文件格式无效'
      );
    }
  }

  /**
   * 解析CSV字符串
   * @param csv CSV字符串
   * @param options 解析选项
   */
  private parseCsv(
    csv: string,
    options: {
      headers: boolean;
      delimiter: string;
      quote: string;
      escape: string;
      skipEmptyLines: boolean;
    }
  ): {
    data: any[];
    rows: number;
    columns: number;
    headers?: string[];
    rawRows: string[][];
  } {
    const lines = csv.split(/\r?\n/);
    const result: any[] = [];
    const rawRows: string[][] = [];
    let headers: string[] = [];
    
    // 解析每一行
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // 跳过空行
      if (options.skipEmptyLines && line === '') {
        continue;
      }
      
      // 解析当前行
      const parsedLine = this.parseCsvLine(line, options.delimiter, options.quote, options.escape);
      rawRows.push(parsedLine);
      
      // 处理表头
      if (i === 0 && options.headers) {
        headers = parsedLine;
        continue;
      }
      
      // 构建数据对象
      if (options.headers && headers.length > 0) {
        const obj: any = {};
        for (let j = 0; j < parsedLine.length; j++) {
          const header = headers[j] !== undefined ? headers[j] : `column_${j + 1}`;
          obj[header] = parsedLine[j];
        }
        result.push(obj);
      } else {
        result.push(parsedLine);
      }
    }
    
    // 计算列数
    let columnCount = 0;
    if (options.headers && headers.length > 0) {
      columnCount = headers.length;
    } else if (rawRows.length > 0) {
      columnCount = rawRows[0].length;
    }
    
    return {
      data: result,
      rows: result.length,
      columns: columnCount,
      headers: options.headers ? headers : undefined,
      rawRows
    };
  }

  /**
   * 解析CSV单行
   * @param line CSV行
   * @param delimiter 分隔符
   * @param quote 引号
   * @param escape 转义字符
   */
  private parseCsvLine(line: string, delimiter: string, quote: string, escape: string): string[] {
    const result: string[] = [];
    let currentField = '';
    let inQuotes = false;
    let escapeNext = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      // 处理转义字符
      if (escapeNext) {
        currentField += char;
        escapeNext = false;
        continue;
      }
      
      // 处理转义标记
      if (char === escape) {
        escapeNext = true;
        continue;
      }
      
      // 处理引号
      if (char === quote) {
        inQuotes = !inQuotes;
        continue;
      }
      
      // 处理分隔符
      if (char === delimiter && !inQuotes) {
        result.push(currentField);
        currentField = '';
        continue;
      }
      
      // 添加字符到当前字段
      currentField += char;
    }
    
    // 添加最后一个字段
    result.push(currentField);
    
    return result;
  }

  /**
   * 验证所有行的列数是否一致
   * @param rows 解析后的行
   * @param expectedColumns 期望的列数
   */
  private validateColumnConsistency(rows: string[][], expectedColumns: number): boolean {
    for (const row of rows) {
      if (row.length !== expectedColumns) {
        return false;
      }
    }
    return true;
  }
}
