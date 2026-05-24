/**
 * @file 数据转换服务
 * @description 核心数据处理服务，统一处理表格数据转换逻辑
 * @module app/services/dataConverterService
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 * @updated 2024-10-15
 */

/**
 * 转换选项接口
 */
export interface ConvertOptions {
  delimiter?: string;
  headers?: boolean;
  precision?: number;
  includeBOM?: boolean;
  compact?: boolean;
}

/**
 * 转换结果接口
 */
export interface ConvertResult {
  success: boolean;
  data: string | object | object[];
  format: string;
  error?: string;
  statistics?: {
    rows: number;
    columns: number;
    size: number;
    time: number;
  };
}

/**
 * 数据格式类型
 */
export type DataFormat = 'csv' | 'json' | 'xml' | 'markdown' | 'xlsx' | 'tsv' | 'html';

/**
 * 数据转换服务类
 */
export class DataConverterService {
  /**
   * 静态缓存，提高频繁转换的性能
   */
  private static readonly cache = new Map<string, { result: ConvertResult; timestamp: number }>();
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存

  /**
   * 执行数据转换
   */
  static async convert(
    data: any,
    fromFormat: DataFormat,
    toFormat: DataFormat,
    options: ConvertOptions = {}
  ): Promise<ConvertResult> {
    const startTime = performance.now();
    const cacheKey = this.generateCacheKey(data, fromFormat, toFormat, options);
    
    // 检查缓存
    const cached = this.getCachedResult(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      // 规范化数据
      const normalizedData = this.normalizeData(data, fromFormat, options);
      
      // 执行转换
      const result = this.doConvert(normalizedData, toFormat, options);
      
      // 计算统计信息
      const statistics = {
        rows: Array.isArray(normalizedData) ? normalizedData.length : 1,
        columns: Array.isArray(normalizedData) && normalizedData.length > 0 
          ? Object.keys(normalizedData[0]).length 
          : Object.keys(normalizedData).length,
        size: typeof result === 'string' ? result.length : JSON.stringify(result).length,
        time: performance.now() - startTime
      };

      const finalResult: ConvertResult = {
        success: true,
        data: result,
        format: toFormat,
        statistics
      };
      
      // 设置缓存
      this.setCachedResult(cacheKey, finalResult);
      
      return finalResult;
    } catch (error) {
      return {
        success: false,
        data: '',
        format: toFormat,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * 规范化输入数据
   */
  private static normalizeData(
    data: any,
    format: DataFormat,
    options: ConvertOptions
  ): any[] | object {
    // 已经是对象或对象数组的情况
    if (typeof data === 'object' && data !== null) {
      return Array.isArray(data) ? data : [data];
    }

    // 字符串类型数据，根据格式解析
    if (typeof data === 'string') {
      switch (format) {
        case 'json':
          try {
            return JSON.parse(data);
          } catch (e) {
            throw new Error('无效的JSON格式');
          }
        case 'csv':
          return this.parseCSV(data, options);
        case 'tsv':
          return this.parseCSV(data, { ...options, delimiter: '\t' });
        default:
          throw new Error(`不支持直接解析 ${format} 格式的字符串`);
      }
    }

    throw new Error('不支持的数据类型');
  }

  /**
   * 执行实际的转换逻辑
   */
  private static doConvert(
    data: any[] | object,
    format: DataFormat,
    options: ConvertOptions
  ): string | object | object[] {
    const normalizedData = Array.isArray(data) ? data : [data];

    switch (format) {
      case 'json':
        return this.toJSON(normalizedData, options);
      case 'csv':
        return this.toCSV(normalizedData, options);
      case 'tsv':
        return this.toCSV(normalizedData, { ...options, delimiter: '\t' });
      case 'xml':
        return this.toXML(normalizedData, options);
      case 'markdown':
        return this.toMarkdown(normalizedData, options);
      case 'html':
        return this.toHTML(normalizedData, options);
      default:
        throw new Error(`不支持的目标格式: ${format}`);
    }
  }

  /**
   * 解析CSV数据
   */
  private static parseCSV(csv: string, options: ConvertOptions): object[] {
    const delimiter = options.delimiter || ',';
    const lines = csv.trim().split('\n');
    
    if (lines.length === 0) {
      return [];
    }

    // 移除BOM字符
    const firstLine = lines[0].replace(/^\ufeff/, '');
    const headers = firstLine.split(delimiter).map(h => h.trim());
    const result: object[] = [];

    // 从第二行开始解析数据
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = this.splitCSVLine(line, delimiter);
      const row: Record<string, any> = {};

      headers.forEach((header, index) => {
        let value: any = values[index] || '';
        
        // 尝试转换为数字
        if (value && !isNaN(Number(value))) {
          value = Number(value);
        }
        // 尝试转换为布尔值
        else if (value.toLowerCase() === 'true') {
          value = true;
        } else if (value.toLowerCase() === 'false') {
          value = false;
        }
        // 尝试转换为null
        else if (value.toLowerCase() === 'null') {
          value = null;
        }

        row[header] = value;
      });

      result.push(row);
    }

    return result;
  }

  /**
   * 安全地分割CSV行，处理引号内的分隔符
   */
  private static splitCSVLine(line: string, delimiter: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    let quoteChar = '"';

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"' || char === "'") {
        if (!inQuotes) {
          inQuotes = true;
          quoteChar = char;
        } else if (char === quoteChar) {
          // 检查是否是转义的引号
          if (i + 1 < line.length && line[i + 1] === quoteChar) {
            current += quoteChar;
            i++; // 跳过下一个引号
          } else {
            inQuotes = false;
          }
        } else {
          current += char;
        }
      } else if (char === delimiter && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current);
    return result;
  }

  /**
   * 转换为JSON格式
   */
  private static toJSON(data: any[], options: ConvertOptions): string {
    const processedData = this.processNumericPrecision(data, options);
    return JSON.stringify(processedData, null, options.compact ? 0 : 2);
  }

  /**
   * 转换为CSV格式
   */
  private static toCSV(data: any[], options: ConvertOptions): string {
    if (data.length === 0) {
      return '';
    }

    const delimiter = options.delimiter || ',';
    const headers = Object.keys(data[0]);
    let csv = options.includeBOM ? '\ufeff' : '';
    csv += headers.join(delimiter) + '\n';

    // 处理数值精度
    const processedData = this.processNumericPrecision(data, options);

    for (const row of processedData) {
      const values = headers.map(header => {
        let value = row[header];
        
        if (value === null || value === undefined) {
          return '';
        }

        if (typeof value === 'string') {
          // 处理包含特殊字符的字符串
          if (value.includes(delimiter) || value.includes('"') || value.includes('\n')) {
            value = `"${value.replace(/"/g, '""')}"`;
          }
        }

        return String(value);
      });

      csv += values.join(delimiter) + '\n';
    }

    return csv;
  }

  /**
   * 转换为XML格式
   */
  private static toXML(data: any[], options: ConvertOptions): string {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<data>\n';
    
    const processedData = this.processNumericPrecision(data, options);

    for (const [index, item] of processedData.entries()) {
      xml += `  <item id="${index + 1}">\n`;
      
      for (const [key, value] of Object.entries(item)) {
        const safeKey = this.sanitizeXMLName(key);
        const safeValue = this.sanitizeXMLValue(value);
        
        xml += `    <${safeKey}>${safeValue}</${safeKey}>\n`;
      }
      
      xml += '  </item>\n';
    }
    
    xml += '</data>';
    return xml;
  }

  /**
   * 转换为Markdown表格格式
   */
  private static toMarkdown(data: any[], options: ConvertOptions): string {
    if (data.length === 0) {
      return '';
    }

    const headers = Object.keys(data[0]);
    const processedData = this.processNumericPrecision(data, options);
    
    // 创建表头
    let md = '| ' + headers.join(' | ') + ' |\n';
    
    // 创建分隔线
    md += '| ' + headers.map(() => '---').join(' | ') + ' |\n';
    
    // 创建数据行
    for (const row of processedData) {
      const values = headers.map(header => {
        let value = row[header];
        
        if (value === null || value === undefined) {
          return '\-';
        }
        
        // 处理特殊字符
        if (typeof value === 'string') {
          value = value
            .replace(/\|/g, '\\|') // 转义竖线
            .replace(/\n/g, '<br>'); // 替换换行符
        }
        
        return String(value);
      });
      
      md += '| ' + values.join(' | ') + ' |\n';
    }
    
    return md;
  }

  /**
   * 转换为HTML表格格式
   */
  private static toHTML(data: any[], options: ConvertOptions): string {
    if (data.length === 0) {
      return '<table></table>';
    }

    const headers = Object.keys(data[0]);
    const processedData = this.processNumericPrecision(data, options);
    
    let html = '<table border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse; width: 100%;">\n';
    
    // 创建表头
    html += '  <thead>\n    <tr>\n';
    for (const header of headers) {
      html += `      <th>${header}</th>\n`;
    }
    html += '    </tr>\n  </thead>\n';
    
    // 创建表体
    html += '  <tbody>\n';
    for (const row of processedData) {
      html += '    <tr>\n';
      for (const header of headers) {
        const value = row[header] ?? '';
        html += `      <td>${String(value)}</td>\n`;
      }
      html += '    </tr>\n';
    }
    html += '  </tbody>\n</table>';
    
    return html;
  }

  /**
   * 处理数值精度
   */
  private static processNumericPrecision(data: any[], options: ConvertOptions): any[] {
    if (options.precision === undefined) {
      return data;
    }

    return data.map(row => {
      const processedRow: any = {};
      
      for (const [key, value] of Object.entries(row)) {
        if (typeof value === 'number') {
          processedRow[key] = Number(value.toFixed(options.precision));
        } else {
          processedRow[key] = value;
        }
      }
      
      return processedRow;
    });
  }

  /**
   * 清理XML名称
   */
  private static sanitizeXMLName(name: string): string {
    // 移除或替换无效的XML名称字符
    return name
      .replace(/[^a-zA-Z0-9_\-:.]/g, '_')
      .replace(/^[0-9\-]/, '_$&');
  }

  /**
   * 清理XML值
   */
  private static sanitizeXMLValue(value: any): string {
    if (value === null || value === undefined) {
      return '';
    }

    const str = String(value);
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * 生成缓存键
   */
  private static generateCacheKey(
    data: any,
    fromFormat: DataFormat,
    toFormat: DataFormat,
    options: ConvertOptions
  ): string {
    const dataStr = typeof data === 'string' ? data : JSON.stringify(data);
    return `${dataStr}_${fromFormat}_${toFormat}_${JSON.stringify(options)}`;
  }

  /**
   * 获取缓存结果
   */
  private static getCachedResult(key: string): ConvertResult | null {
    const cached = this.cache.get(key);
    
    if (!cached) {
      return null;
    }

    const now = Date.now();
    if (now - cached.timestamp > this.CACHE_DURATION) {
      this.cache.delete(key);
      return null;
    }

    return cached.result;
  }

  /**
   * 设置缓存结果
   */
  private static setCachedResult(key: string, result: ConvertResult): void {
    // 限制缓存大小
    if (this.cache.size > 100) {
      // 移除最早的缓存
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      result,
      timestamp: Date.now()
    });
  }

  /**
   * 清除缓存
   */
  static clearCache(): void {
    this.cache.clear();
  }
}

/**
 * 导出便捷的转换函数
 */
export const convertData = DataConverterService.convert.bind(DataConverterService);
export const clearConversionCache = DataConverterService.clearCache.bind(DataConverterService);
