/**
 * @file CSV-JSON 转换器
 * @description 提供 CSV 和 JSON 格式之间的相互转换功能
 * @module converters/CsvJsonConverter
 * @author YYC
 * @version 1.0.0
 * @created 2024-01-15
 * @updated 2024-01-15
 */

import { BaseConverter } from './BaseConverter';
import { DataFormat, ConversionOptions } from '../types';
import { logger } from '../utils/logger';

/**
 * CSV-JSON 转换器类
 */
export class CsvJsonConverter extends BaseConverter {
  /**
   * 验证输入数据
   * @param data 输入数据
   */
  protected validateInput(data: string | Buffer): void {
    if (!data) {
      throw new Error('输入数据不能为空');
    }
  }
  /**
   * 获取支持的源格式
   * @returns 支持的源数据格式数组
   */
  getSupportedSourceFormats(): string[] {
    return [DataFormat.CSV, DataFormat.TSV, DataFormat.JSON];
  }
  
  /**
   * 获取支持的目标格式
   * @returns 支持的目标数据格式数组
   */
  getSupportedTargetFormats(): string[] {
    return [DataFormat.CSV, DataFormat.TSV, DataFormat.JSON];
  }
  
  /**
   * 执行具体的转换逻辑
   * @param data 待转换的数据
   * @param options 转换选项
   * @returns 转换结果
   */
  protected async performConversion(data: string | Buffer, options: ConversionOptions): Promise<string> {
    const { sourceFormat, targetFormat } = options;
    
    logger.debug(`开始CSV-JSON转换: ${sourceFormat} -> ${targetFormat}`);
    
    // CSV/TSV 转换为 JSON
    if ((sourceFormat === DataFormat.CSV || sourceFormat === DataFormat.TSV) && 
        targetFormat === DataFormat.JSON) {
      return this.csvToJson(data, sourceFormat, options);
    }
    
    // JSON 转换为 CSV/TSV
    if (sourceFormat === DataFormat.JSON && 
        (targetFormat === DataFormat.CSV || targetFormat === DataFormat.TSV)) {
      return this.jsonToCsv(data, targetFormat, options);
    }
    
    throw new Error(`不支持的转换组合: ${sourceFormat} -> ${targetFormat}`);
  }
  
  /**
   * CSV/TSV 转换为 JSON
   * @param csvData CSV/TSV 数据
   * @param sourceFormat 源数据格式
   * @param options 转换选项
   * @returns JSON字符串
   */
  private csvToJson(
    csvData: string,
    sourceFormat: DataFormat,
    options?: ConversionOptions
  ): string {
    try {
      // 确定分隔符
      const delimiter = options?.delimiter || 
                       (sourceFormat === DataFormat.TSV ? '\t' : ',');
      
      // 确定是否包含表头
      const hasHeaders = options?.headers !== false;
      
      // 分割行
      const lines = csvData.trim().split(/\r?\n/);
      if (lines.length === 0) {
        return '[]';
      }
      
      // 解析表头
      let headers: string[] = [];
      let startRowIndex = 0;
      
      if (hasHeaders) {
        headers = this.parseCsvRow(lines[0], delimiter);
        startRowIndex = 1;
      }
      
      // 解析数据行
      const result: any[] = [];
      
      for (let i = startRowIndex; i < lines.length; i++) {
        if (!lines[i].trim()) continue; // 跳过空行
        
        const values = this.parseCsvRow(lines[i], delimiter);
        
        const row: any = {};
        
        if (hasHeaders) {
          // 使用表头作为键
          values.forEach((value, index) => {
            const key = headers[index] !== undefined ? headers[index] : `column_${index + 1}`;
            row[key] = this.convertValue(value);
          });
        } else {
          // 使用索引作为键
          values.forEach((value, index) => {
            row[`column_${index + 1}`] = this.convertValue(value);
          });
        }
        
        result.push(row);
      }
      
      // 格式化 JSON
      const jsonIndent = options?.jsonIndent || 2;
      return JSON.stringify(result, null, jsonIndent);
    } catch (error) {
      throw new Error(`CSV 转 JSON 失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }
  
  /**
   * JSON 转换为 CSV/TSV
   * @param jsonData JSON 数据
   * @param targetFormat 目标数据格式
   * @param options 转换选项
   * @returns CSV/TSV字符串
   */
  private jsonToCsv(
    jsonData: string,
    targetFormat: DataFormat,
    options?: ConversionOptions
  ): string {
    try {
      // 解析 JSON
      const data = JSON.parse(jsonData);
      
      // 确保数据是数组
      if (!Array.isArray(data)) {
        throw new Error('JSON 数据必须是数组格式');
      }
      
      if (data.length === 0) {
        return '';
      }
      
      // 确定分隔符
      const delimiter = options?.delimiter || 
                       (targetFormat === DataFormat.TSV ? '\t' : ',');
      
      // 提取所有唯一的键作为表头
      const allKeys = new Set<string>();
      data.forEach(item => {
        if (typeof item === 'object' && item !== null) {
          Object.keys(item).forEach(key => allKeys.add(key));
        }
      });
      
      const headers = Array.from(allKeys);
      const rows: string[] = [];
      
      // 添加表头行
      rows.push(this.formatCsvRow(headers, delimiter));
      
      // 添加数据行
      data.forEach(item => {
        if (typeof item !== 'object' || item === null) {
          // 处理非对象数据
          rows.push(this.formatCsvRow([String(item)], delimiter));
        } else {
          const rowValues = headers.map(key => {
            const value = item[key];
            return this.formatValueForCsv(value);
          });
          rows.push(this.formatCsvRow(rowValues, delimiter));
        }
      });
      
      return rows.join('\n');
    } catch (error) {
      throw new Error(`JSON 转 CSV 失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }
  
  /**
   * 解析 CSV 行
   * @param row 行数据
   * @param delimiter 分隔符
   * @returns 解析后的值数组
   */
  private parseCsvRow(row: string, delimiter: string): string[] {
    const results: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < row.length; i++) {
      const char = row[i];
      
      if (char === '"') {
        if (inQuotes && i + 1 < row.length && row[i + 1] === '"') {
          // 处理转义引号
          current += '"';
          i++; // 跳过下一个引号
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === delimiter && !inQuotes) {
        results.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    
    results.push(current);
    return results;
  }
  
  /**
   * 格式化 CSV 行
   * @param values 值数组
   * @param delimiter 分隔符
   * @returns 格式化后的行字符串
   */
  private formatCsvRow(values: string[], delimiter: string): string {
    return values.map(value => this.escapeCsvValue(value)).join(delimiter);
  }
  
  /**
   * 转义 CSV 值
   * @param value 值
   * @returns 转义后的值
   */
  private escapeCsvValue(value: string): string {
    // 如果值包含引号、分隔符或换行符，需要用引号包围
    if (value.includes('"') || value.includes(',') || value.includes('\n') || value.includes('\t')) {
      // 将引号替换为双引号（转义）
      const escapedValue = value.replace(/"/g, '""');
      return `"${escapedValue}"`;
    }
    return value;
  }
  
  /**
   * 格式化值以便写入 CSV
   * @param value 值
   * @returns 格式化后的字符串
   */
  private formatValueForCsv(value: any): string {
    if (value === null || value === undefined) {
      return '';
    }
    
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    
    return String(value);
  }
  
  /**
   * 转换值为适当的数据类型
   * @param value 字符串值
   * @returns 转换后的值
   */
  private convertValue(value: string): any {
    const trimmed = value.trim();
    
    // 尝试转换为数字
    if (/^-?\d+$/.test(trimmed)) {
      return parseInt(trimmed, 10);
    }
    
    if (/^-?\d+\.\d+$/.test(trimmed)) {
      return parseFloat(trimmed);
    }
    
    // 尝试转换为布尔值
    if (trimmed.toLowerCase() === 'true') {
      return true;
    }
    
    if (trimmed.toLowerCase() === 'false') {
      return false;
    }
    
    // 尝试转换为 null
    if (trimmed.toLowerCase() === 'null') {
      return null;
    }
    
    // 尝试转换为空
    if (trimmed.toLowerCase() === 'undefined') {
      return undefined;
    }
    
    // 保持为字符串
    return value;
  }
}
