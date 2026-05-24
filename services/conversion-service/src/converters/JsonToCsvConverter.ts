/**
 * @file JSON到CSV转换器
 * @description 实现JSON格式到CSV格式的转换功能
 * @module services/conversion-service/src/converters/JsonToCsvConverter
 * @author YYC
 * @version 2.0.0
 * @created 2024-11-23
 */

import { BaseConverter } from './BaseConverter';
import { DataFormat } from '../types';
import { ConversionOptions } from './IConverter';

/**
 * JSON到CSV转换器类
 */
export class JsonToCsvConverter extends BaseConverter {
  /**
   * 获取支持的源格式
   */
  getSupportedSourceFormat(): DataFormat {
    return DataFormat.JSON;
  }

  /**
   * 获取支持的目标格式列表
   */
  getSupportedTargetFormats(): DataFormat {
    return DataFormat.CSV;
  }

  /**
   * 执行JSON到CSV的转换
   * @param sourceData JSON源数据
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
    this.logger.info(`[JsonToCsvConverter] 开始JSON到CSV转换，选项: ${JSON.stringify(options)}`);
    
    // 获取转换选项
    const includeHeaders = options.headers !== false; // 默认包含表头
    const delimiter = options.delimiter || ',';
    const quote = options.quote || '"';
    const escape = options.escape || '\\';
    const flatKeys = options.flatKeys || false;
    const keySeparator = options.keySeparator || '.';
    
    // 将Buffer转换为字符串
    const jsonString = sourceData.toString('utf-8');
    
    try {
      // 解析JSON数据
      const jsonData = JSON.parse(jsonString);
      
      // 确保数据是数组形式
      const dataArray = Array.isArray(jsonData) ? jsonData : [jsonData];
      
      // 提取所有唯一键作为表头
      const allKeys = this.extractUniqueKeys(dataArray, flatKeys, keySeparator);
      const columnCount = allKeys.length;
      
      // 生成CSV内容
      let csvContent = '';
      
      // 添加表头
      if (includeHeaders) {
        csvContent += this.convertToCsvRow(allKeys, delimiter, quote, escape) + '\n';
      }
      
      // 添加数据行
      for (const item of dataArray) {
        const rowValues = allKeys.map(key => this.getValueByKeyPath(item, key, keySeparator));
        csvContent += this.convertToCsvRow(rowValues, delimiter, quote, escape) + '\n';
      }
      
      this.logger.info(`[JsonToCsvConverter] JSON转换完成，生成了 ${dataArray.length} 行，${columnCount} 列`);
      
      return {
        data: Buffer.from(csvContent),
        metadata: {
          rows: dataArray.length,
          columns: columnCount,
          delimiter,
          hasHeaders: includeHeaders,
          flatKeys
        }
      };
    } catch (error) {
      this.logger.error(`[JsonToCsvConverter] JSON解析错误: ${error instanceof Error ? error.message : '未知错误'}`);
      throw new Error(`JSON解析失败: ${error instanceof Error ? error.message : '无效的JSON格式'}`);
    }
  }

  /**
   * 向后兼容：执行JSON到CSV的转换
   * @param data JSON数据
   * @param options 转换选项
   */
  protected async performConversionLegacy(
    data: string | Buffer,
    options: ConversionOptions
  ): Promise<string> {
    const bufferData = typeof data === 'string' ? Buffer.from(data) : data;
    const result = await this.performConversion(bufferData, DataFormat.CSV, options);
    return result.data.toString('utf-8');
  }

  /**
   * 验证JSON文件
   * @param data JSON数据
   */
  async validate(data: Buffer): Promise<any> {
    try {
      const jsonString = data.toString('utf-8');
      
      // 尝试解析JSON
      const jsonData = JSON.parse(jsonString);
      
      // 验证数据格式
      if (!Array.isArray(jsonData) && typeof jsonData !== 'object') {
        return this.createValidationError('JSON必须是对象或数组');
      }
      
      // 检查是否为空
      if ((Array.isArray(jsonData) && jsonData.length === 0) || 
          (typeof jsonData === 'object' && jsonData !== null && Object.keys(jsonData).length === 0)) {
        return this.createValidationError('JSON数据为空');
      }
      
      return this.createValidationSuccess();
    } catch (error) {
      return this.createValidationError(
        error instanceof Error ? error.message : 'JSON文件格式无效'
      );
    }
  }

  /**
   * 提取所有唯一键
   * @param dataArray 数据数组
   * @param flatKeys 是否扁平化键
   * @param keySeparator 键分隔符
   */
  private extractUniqueKeys(dataArray: any[], flatKeys: boolean, keySeparator: string): string[] {
    const keysSet = new Set<string>();
    
    for (const item of dataArray) {
      if (typeof item === 'object' && item !== null) {
        this.collectKeys(item, '', keysSet, flatKeys, keySeparator);
      }
    }
    
    return Array.from(keysSet);
  }

  /**
   * 递归收集键
   * @param obj 对象
   * @param currentPath 当前路径
   * @param keysSet 键集合
   * @param flatKeys 是否扁平化
   * @param keySeparator 键分隔符
   */
  private collectKeys(obj: any, currentPath: string, keysSet: Set<string>, flatKeys: boolean, keySeparator: string): void {
    if (typeof obj !== 'object' || obj === null) {
      return;
    }
    
    for (const [key, value] of Object.entries(obj)) {
      const newPath = currentPath ? `${currentPath}${keySeparator}${key}` : key;
      
      if (flatKeys && typeof value === 'object' && value !== null) {
        // 扁平化处理嵌套对象
        this.collectKeys(value, newPath, keysSet, flatKeys, keySeparator);
      } else {
        keysSet.add(newPath);
      }
    }
  }

  /**
   * 根据键路径获取值
   * @param obj 对象
   * @param keyPath 键路径
   * @param keySeparator 键分隔符
   */
  private getValueByKeyPath(obj: any, keyPath: string, keySeparator: string): any {
    if (!obj || typeof obj !== 'object') {
      return '';
    }
    
    const keys = keyPath.split(keySeparator);
    let current = obj;
    
    for (const key of keys) {
      if (current === null || typeof current !== 'object' || !(key in current)) {
        return '';
      }
      current = current[key];
    }
    
    // 处理对象和数组的情况
    if (typeof current === 'object' && current !== null) {
      return JSON.stringify(current);
    }
    
    return current !== undefined ? current : '';
  }

  /**
   * 将值数组转换为CSV行
   * @param values 值数组
   * @param delimiter 分隔符
   * @param quote 引号
   * @param escape 转义字符
   */
  private convertToCsvRow(values: any[], delimiter: string, quote: string, escape: string): string {
    return values
      .map(value => {
        const strValue = String(value);
        
        // 如果值包含分隔符、引号或换行符，需要加引号
        if (strValue.includes(delimiter) || strValue.includes(quote) || strValue.includes('\n') || strValue.includes('\r')) {
          // 转义内部的引号
          const escaped = strValue.replace(new RegExp(quote, 'g'), escape + quote);
          return quote + escaped + quote;
        }
        
        return strValue;
      })
      .join(delimiter);
  }
}
