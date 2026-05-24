/**
 * @file 数据适配器基类
 * @description 提供行业数据转换的统一接口和基础实现
 * @module industries/synergy/adapters
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-16
 * @updated 2024-10-16
 */

import { Industry } from '../IndustrySynergy';
import { DataFormat } from '../../types';

/**
 * 数据适配选项接口
 */
export interface DataAdapterOptions {
  /**
   * 源行业
   */
  sourceIndustry: Industry;
  
  /**
   * 目标行业
   */
  targetIndustry: Industry;
  
  /**
   * 源数据格式
   */
  sourceFormat: DataFormat;
  
  /**
   * 目标数据格式
   */
  targetFormat: DataFormat;
  
  /**
   * 附加配置
   */
  config?: Record<string, any>;
}

/**
 * 转换结果接口
 */
export interface ConversionResult {
  /**
   * 是否成功
   */
  success: boolean;
  
  /**
   * 转换后的数据
   */
  data?: any;
  
  /**
   * 错误信息
   */
  error?: string;
  
  /**
   * 处理时间(ms)
   */
  processingTime?: number;
  
  /**
   * 元数据
   */
  metadata?: Record<string, any>;
}

/**
 * 数据映射配置接口
 */
export interface DataMappingConfig {
  /**
   * 源字段路径
   */
  sourcePath: string;
  
  /**
   * 目标字段路径
   */
  targetPath: string;
  
  /**
   * 转换函数名称
   */
  transformer?: string;
  
  /**
   * 默认值
   */
  defaultValue?: any;
  
  /**
   * 是否必需
   */
  required?: boolean;
}

/**
 * 数据适配器基类
 * 所有具体行业数据适配器都继承自此类
 */
export abstract class DataAdapter {
  /**
   * 源行业
   */
  protected sourceIndustry: Industry;
  
  /**
   * 目标行业
   */
  protected targetIndustry: Industry;
  
  /**
   * 源数据格式
   */
  protected sourceFormat: DataFormat;
  
  /**
   * 目标数据格式
   */
  protected targetFormat: DataFormat;
  
  /**
   * 附加配置
   */
  protected config: Record<string, any>;
  
  /**
   * 数据映射配置
   */
  protected mappingConfig: DataMappingConfig[] = [];
  
  /**
   * 转换函数注册表
   */
  protected transformers: Record<string, (value: any) => any> = {
    // 基础转换函数
    string: (value: any) => String(value),
    number: (value: any) => Number(value),
    boolean: (value: any) => Boolean(value),
    date: (value: any) => new Date(value).toISOString(),
    jsonStringify: (value: any) => JSON.stringify(value),
    jsonParse: (value: any) => JSON.parse(value),
    uppercase: (value: any) => String(value).toUpperCase(),
    lowercase: (value: any) => String(value).toLowerCase(),
    trim: (value: any) => String(value).trim(),
    arrayLength: (value: any) => Array.isArray(value) ? value.length : 0,
    formatCurrency: (value: any) => `¥${Number(value).toFixed(2)}`,
    formatNumber: (value: any) => Number(value).toLocaleString(),
  };
  
  /**
   * 构造函数
   * @param options 适配选项
   */
  constructor(options: DataAdapterOptions) {
    this.sourceIndustry = options.sourceIndustry;
    this.targetIndustry = options.targetIndustry;
    this.sourceFormat = options.sourceFormat;
    this.targetFormat = options.targetFormat;
    this.config = options.config || {};
    
    // 初始化映射配置
    this.initializeMappingConfig();
    
    // 注册自定义转换器
    this.registerTransformers();
  }
  
  /**
   * 初始化映射配置
   * 子类需要重写此方法
   */
  protected abstract initializeMappingConfig(): void;
  
  /**
   * 注册自定义转换器
   * 子类可以重写此方法以添加行业特定的转换器
   */
  protected registerTransformers(): void {
    // 默认实现，子类可以扩展
  }
  
  /**
   * 执行数据转换
   * @param data 源数据
   * @returns 转换结果
   */
  async convert(data: any): Promise<ConversionResult> {
    const startTime = Date.now();
    
    try {
      // 验证输入数据
      const validation = this.validateInput(data);
      if (!validation.valid) {
        return {
          success: false,
          error: validation.error,
          processingTime: Date.now() - startTime,
        };
      }
      
      // 格式转换（如果需要）
      const intermediateData = await this.formatConversion(data);
      
      // 行业特定数据转换
      const transformedData = this.transformData(intermediateData);
      
      // 后处理
      const finalData = await this.postProcess(transformedData);
      
      return {
        success: true,
        data: finalData,
        processingTime: Date.now() - startTime,
        metadata: {
          sourceIndustry: this.sourceIndustry,
          targetIndustry: this.targetIndustry,
          sourceFormat: this.sourceFormat,
          targetFormat: this.targetFormat,
          timestamp: Date.now(),
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '转换过程发生错误',
        processingTime: Date.now() - startTime,
      };
    }
  }
  
  /**
   * 验证输入数据
   * @param data 输入数据
   * @returns 验证结果
   */
  protected validateInput(data: any): { valid: boolean; error: string } {
    // 默认实现，子类可以扩展
    if (data === undefined || data === null) {
      return { valid: false, error: '输入数据不能为空' };
    }
    return { valid: true, error: '' };
  }
  
  /**
   * 格式转换
   * @param data 源数据
   * @returns 转换后的数据
   */
  protected async formatConversion(data: any): Promise<any> {
    // 如果源格式和目标格式相同，直接返回
    if (this.sourceFormat === this.targetFormat) {
      return data;
    }
    
    // 执行格式转换
    try {
      // 目前支持的格式转换主要是JSON与其他格式之间的转换
      switch (this.sourceFormat) {
        case DataFormat.JSON:
          return await this.jsonToOtherFormat(data);
        case DataFormat.CSV:
          return await this.csvToOtherFormat(data as string);
        case DataFormat.XML:
          return await this.xmlToOtherFormat(data as string);
        case DataFormat.EXCEL:
          return await this.excelToOtherFormat(data);
        default:
          throw new Error(`不支持的源格式: ${this.sourceFormat}`);
      }
    } catch (error) {
      throw new Error(`格式转换失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }
  
  /**
   * JSON转其他格式
   * @param data JSON数据
   * @returns 转换后的数据
   */
  protected async jsonToOtherFormat(data: any): Promise<any> {
    switch (this.targetFormat) {
      case DataFormat.CSV:
        return this.jsonToCsv(data);
      case DataFormat.XML:
        return this.jsonToXml(data);
      case DataFormat.EXCEL:
        return this.jsonToExcel(data);
      default:
        throw new Error(`不支持的目标格式: ${this.targetFormat}`);
    }
  }
  
  /**
   * CSV转其他格式
   * @param data CSV字符串
   * @returns 转换后的数据
   */
  protected async csvToOtherFormat(data: string): Promise<any> {
    const jsonData = this.csvToJson(data);
    
    switch (this.targetFormat) {
      case DataFormat.JSON:
        return jsonData;
      case DataFormat.XML:
        return this.jsonToXml(jsonData);
      case DataFormat.EXCEL:
        return this.jsonToExcel(jsonData);
      default:
        throw new Error(`不支持的目标格式: ${this.targetFormat}`);
    }
  }
  
  /**
   * XML转其他格式
   * @param data XML字符串
   * @returns 转换后的数据
   */
  protected async xmlToOtherFormat(data: string): Promise<any> {
    const jsonData = this.xmlToJson(data);
    
    switch (this.targetFormat) {
      case DataFormat.JSON:
        return jsonData;
      case DataFormat.CSV:
        return this.jsonToCsv(jsonData);
      case DataFormat.EXCEL:
        return this.jsonToExcel(jsonData);
      default:
        throw new Error(`不支持的目标格式: ${this.targetFormat}`);
    }
  }
  
  /**
   * Excel转其他格式
   * @param data Excel数据
   * @returns 转换后的数据
   */
  protected async excelToOtherFormat(data: any): Promise<any> {
    // 假设data已经是解析后的JSON格式
    const jsonData = data;
    
    switch (this.targetFormat) {
      case DataFormat.JSON:
        return jsonData;
      case DataFormat.CSV:
        return this.jsonToCsv(jsonData);
      case DataFormat.XML:
        return this.jsonToXml(jsonData);
      default:
        throw new Error(`不支持的目标格式: ${this.targetFormat}`);
    }
  }
  
  /**
   * JSON转CSV
   * @param data JSON数据
   * @returns CSV字符串
   */
  protected jsonToCsv(data: any): string {
    if (!Array.isArray(data)) {
      data = [data];
    }
    
    if (data.length === 0) {
      return '';
    }
    
    // 获取所有字段名
    const headers = Object.keys(data[0]);
    
    // 构建CSV内容
    let csv = headers.join(',') + '\n';
    
    data.forEach((row: Record<string, any>) => {
      const values = headers.map(header => {
        let value = row[header];
        // 处理包含逗号、引号或换行符的值
        if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
          value = '"' + value.replace(/"/g, '""') + '"';
        }
        return value !== undefined && value !== null ? value : '';
      });
      csv += values.join(',') + '\n';
    });
    
    return csv;
  }
  
  /**
   * CSV转JSON
   * @param csv CSV字符串
   * @returns JSON数据
   */
  protected csvToJson(csv: string): any[] {
    const lines = csv.split('\n').filter(line => line.trim());
    if (lines.length === 0) {
      return [];
    }
    
    // 获取标题行
    const headers = lines[0].split(',').map(header => header.trim());
    
    // 解析数据行
    const result: any[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      const values = this.parseCsvLine(line);
      const row: any = {};
      
      headers.forEach((header, index) => {
        row[header] = values[index] !== undefined ? values[index] : '';
      });
      
      result.push(row);
    }
    
    return result;
  }
  
  /**
   * 解析CSV行
   * @param line CSV行字符串
   * @returns 解析后的值数组
   */
  private parseCsvLine(line: string): string[] {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    let quoteCount = 0;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
        quoteCount++;
        // 处理双引号
        if (i < line.length - 1 && line[i + 1] === '"') {
          current += '"';
          i++;
          quoteCount = 0;
        } else if (quoteCount === 2) {
          quoteCount = 0;
        }
      } else if (char === ',' && !inQuotes) {
        values.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    
    values.push(current);
    return values;
  }
  
  /**
   * JSON转XML
   * @param data JSON数据
   * @returns XML字符串
   */
  protected jsonToXml(data: any): string {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += this.buildXmlNode('root', data);
    return xml;
  }
  
  /**
   * 构建XML节点
   * @param name 节点名称
   * @param value 节点值
   * @returns XML节点字符串
   */
  private buildXmlNode(name: string, value: any): string {
    if (value === null || value === undefined) {
      return `<${name}/>`;
    }
    
    if (typeof value !== 'object') {
      // 转义特殊字符
      const escapedValue = String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
      return `<${name}>${escapedValue}</${name}>`;
    }
    
    if (Array.isArray(value)) {
      return value.map(item => this.buildXmlNode(name, item)).join('');
    }
    
    let xml = `<${name}>`;
    Object.keys(value).forEach(key => {
      xml += this.buildXmlNode(key, value[key]);
    });
    xml += `</${name}>`;
    return xml;
  }
  
  /**
   * XML转JSON
   * @param xml XML字符串
   * @returns JSON数据
   */
  protected xmlToJson(xml: string): any {
    // 简化的XML转JSON实现
    // 实际项目中可能需要更复杂的实现或使用专门的库
    try {
      // 移除XML声明
      xml = xml.replace(/<\?xml[^>]*\?>/, '');
      
      // 解析根节点
      const match = xml.match(/<([^>]+)>([\s\S]*)<\/\1>/);
      if (!match) {
        throw new Error('无效的XML格式');
      }
      
      const rootName = match[1];
      const rootContent = match[2];
      
      const result: any = {};
      result[rootName] = this.parseXmlContent(rootContent);
      
      return result;
    } catch (error) {
      throw new Error(`XML解析失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }
  
  /**
   * 解析XML内容
   * @param content XML内容
   * @returns 解析后的对象
   */
  private parseXmlContent(content: string): any {
    // 如果内容不包含标签，返回文本值
    if (!content.includes('<')) {
      return content.trim();
    }
    
    const result: any = {};
    
    // 简单的节点解析
    const nodeRegex = /<([^>]+)>([\s\S]*?)<\/\1>/g;
    let match;
    
    while ((match = nodeRegex.exec(content)) !== null) {
      const nodeName = match[1];
      const nodeContent = match[2];
      
      const nodeValue = this.parseXmlContent(nodeContent);
      
      // 处理重复节点（转为数组）
      if (result[nodeName] !== undefined) {
        if (!Array.isArray(result[nodeName])) {
          result[nodeName] = [result[nodeName]];
        }
        result[nodeName].push(nodeValue);
      } else {
        result[nodeName] = nodeValue;
      }
    }
    
    return result;
  }
  
  /**
   * JSON转Excel格式（这里返回处理后的数据对象）
   * @param data JSON数据
   * @returns Excel数据对象
   */
  protected jsonToExcel(data: any): any {
    // 在实际实现中，这里可能需要使用专门的Excel处理库
    // 这里简单返回处理后的数据结构
    return {
      sheets: [
        {
          name: 'Sheet1',
          data: Array.isArray(data) ? data : [data]
        }
      ],
      metadata: {
        createdBy: 'IndustrySynergySystem',
        createdAt: new Date().toISOString(),
      }
    };
  }
  
  /**
   * 数据转换
   * 使用映射配置转换数据
   * @param data 中间数据
   * @returns 转换后的数据
   */
  protected transformData(data: any): any {
    const result: any = {};
    
    // 应用数据映射
    this.mappingConfig.forEach(mapping => {
      try {
        // 从源数据获取值
        let sourceValue = this.getValueByPath(data, mapping.sourcePath);
        
        // 处理默认值
        if (sourceValue === undefined || sourceValue === null) {
          if (mapping.required) {
            throw new Error(`必需字段缺失: ${mapping.sourcePath}`);
          }
          sourceValue = mapping.defaultValue;
        }
        
        // 应用转换器
        if (sourceValue !== undefined && sourceValue !== null && mapping.transformer) {
          const transformer = this.transformers[mapping.transformer];
          if (transformer) {
            sourceValue = transformer(sourceValue);
          } else {
            console.warn(`未找到转换器: ${mapping.transformer}`);
          }
        }
        
        // 设置到目标路径
        if (sourceValue !== undefined) {
          this.setValueByPath(result, mapping.targetPath, sourceValue);
        }
      } catch (error) {
        console.error(`映射转换失败 [${mapping.sourcePath} -> ${mapping.targetPath}]:`, error);
        if (mapping.required) {
          throw error;
        }
      }
    });
    
    // 应用行业特定转换逻辑
    return this.applyIndustrySpecificLogic(result, data);
  }
  
  /**
   * 应用行业特定逻辑
   * @param transformedData 已转换的数据
   * @param originalData 原始数据
   * @returns 最终数据
   */
  protected abstract applyIndustrySpecificLogic(transformedData: any, originalData: any): any;
  
  /**
   * 根据路径获取值
   * @param obj 对象
   * @param path 路径（支持点号分隔）
   * @returns 值
   */
  protected getValueByPath(obj: any, path: string): any {
    if (!obj || !path) {
      return undefined;
    }
    
    const keys = path.split('.');
    let value = obj;
    
    for (const key of keys) {
      if (value === undefined || value === null) {
        return undefined;
      }
      value = value[key];
    }
    
    return value;
  }
  
  /**
   * 根据路径设置值
   * @param obj 对象
   * @param path 路径（支持点号分隔）
   * @param value 值
   */
  protected setValueByPath(obj: any, path: string, value: any): void {
    if (!obj || !path) {
      return;
    }
    
    const keys = path.split('.');
    let current = obj;
    
    // 遍历除最后一个键以外的所有键
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!current[key] || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }
    
    // 设置最后一个键的值
    current[keys[keys.length - 1]] = value;
  }
  
  /**
   * 后处理
   * @param data 转换后的数据
   * @returns 处理后的数据
   */
  protected async postProcess(data: any): Promise<any> {
    // 默认实现，子类可以扩展
    return data;
  }
  
  /**
   * 获取适配器信息
   * @returns 适配器信息
   */
  public getAdapterInfo(): Record<string, any> {
    return {
      sourceIndustry: this.sourceIndustry,
      targetIndustry: this.targetIndustry,
      sourceFormat: this.sourceFormat,
      targetFormat: this.targetFormat,
      mappingCount: this.mappingConfig.length,
      transformerCount: Object.keys(this.transformers).length,
    };
  }
}

/**
 * 数据适配器工厂类
 * 用于创建特定的行业数据适配器
 */
export class DataAdapterFactory {
  private static adapters: Map<string, new (options: DataAdapterOptions) => DataAdapter> = new Map();
  
  /**
   * 注册适配器
   * @param key 适配器键
   * @param adapterClass 适配器类
   */
  public static register(key: string, adapterClass: new (options: DataAdapterOptions) => DataAdapter): void {
    this.adapters.set(key, adapterClass);
  }
  
  /**
   * 创建适配器
   * @param options 适配选项
   * @returns 数据适配器实例
   */
  public static create(options: DataAdapterOptions): DataAdapter {
    const key = `${options.sourceIndustry}_${options.targetIndustry}`;
    const adapterClass = this.adapters.get(key);
    
    if (!adapterClass) {
      // 如果没有找到特定的适配器，使用通用适配器
      return new GenericDataAdapter(options);
    }
    
    return new adapterClass(options);
  }
}

/**
 * 通用数据适配器
 * 当没有特定行业适配器时使用
 */
class GenericDataAdapter extends DataAdapter {
  protected initializeMappingConfig(): void {
    // 通用适配器不预设映射配置
    // 可以通过配置传入或使用默认的浅拷贝方式
  }
  
  protected applyIndustrySpecificLogic(transformedData: any, originalData: any): any {
    // 如果没有映射配置，返回原始数据的浅拷贝
    if (this.mappingConfig.length === 0) {
      return { ...originalData };
    }
    return transformedData;
  }
}