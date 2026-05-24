/**
 * @file 转换器工厂类
 * @description 负责创建和管理各种数据格式转换器的工厂类
 * @module converters/ConverterFactory
 * @author YYC
 * @version 1.0.0
 * @created 2024-01-15
 * @updated 2024-01-16
 */

import { IConverter, ConversionFormat, DataFormat } from '../types';
import { BaseConverter } from './BaseConverter';
import { CsvJsonConverter } from './CsvJsonConverter';
import { ExcelConverter } from './ExcelConverter';
import { HtmlTableConverter } from './HtmlTableConverter';
import { logger } from '../utils/logger';

/**
 * 转换器类型
 */
export enum ConverterType {
  CSV_JSON = 'csv_json',
  EXCEL = 'excel',
  HTML = 'html'
}

/**
 * 转换器工厂类
 */
export class ConverterFactory {
  private static readonly converters: Map<string, () => Promise<IConverter>> = new Map();
  private static initialized = false;
  
  /**
   * 初始化转换器工厂
   */
  private static initialize(): void {
    if (this.initialized) {
      return;
    }
    
    // 注册转换器
    this.registerConverter(ConverterType.CSV_JSON, () => Promise.resolve(new CsvJsonConverter()));
    this.registerConverter(ConverterType.EXCEL, () => Promise.resolve(new ExcelConverter()));
    this.registerConverter(ConverterType.HTML, () => Promise.resolve(new HtmlTableConverter()));
    
    this.initialized = true;
    logger.info('转换器工厂初始化完成', { converterCount: this.converters.size });
  }
  
  /**
   * 注册转换器
   * @param type 转换器类型
   * @param factory 创建转换器的工厂函数
   */
  public static registerConverter(type: string, factory: () => Promise<IConverter>): void {
    this.converters.set(type, factory);
    logger.info(`转换器已注册: ${type}`);
  }
  
  /**
   * 获取转换器实例
   * @param type 转换器类型
   * @returns 转换器实例
   */
  public static async getConverter(type: string): Promise<IConverter> {
    // 确保工厂已初始化
    this.initialize();
    
    const factory = this.converters.get(type);
    if (!factory) {
      throw new Error(`未找到类型为 ${type} 的转换器`);
    }
    
    try {
      const converter = await factory();
      logger.debug(`获取转换器实例成功: ${type}`);
      return converter;
    } catch (error) {
      logger.error(`创建转换器实例失败: ${type}`, { error });
      throw new Error(`创建转换器实例失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }
  
  /**
   * 获取支持的所有转换器类型
   * @returns 转换器类型数组
   */
  public static getSupportedConverters(): string[] {
    // 确保工厂已初始化
    this.initialize();
    
    return Array.from(this.converters.keys());
  }
  
  /**
   * 根据源格式和目标格式自动选择合适的转换器
   * @param sourceFormat 源数据格式
   * @param targetFormat 目标数据格式
   * @returns 转换器实例
   */
  public static async getConverterByFormats(sourceFormat: string, targetFormat: string): Promise<IConverter> {
    // 确保工厂已初始化
    this.initialize();
    
    // 尝试所有转换器，看哪个能处理指定的格式转换
    for (const [type, factory] of this.converters.entries()) {
      try {
        const converter = await factory();
        
        // 检查转换器是否支持指定的格式
        if (converter.supportsSourceFormat(sourceFormat) && converter.supportsTargetFormat(targetFormat)) {
          logger.debug(`为格式转换选择转换器: ${sourceFormat} -> ${targetFormat}`, { converter: type });
          return converter;
        }
      } catch (error) {
        logger.warn(`检查转换器 ${type} 时出错`, { error });
        // 继续尝试下一个转换器
        continue;
      }
    }
    
    throw new Error(`未找到支持从 ${sourceFormat} 转换到 ${targetFormat} 的转换器`);
  }
  
  /**
   * 检查是否支持指定的格式转换
   * @param sourceFormat 源数据格式
   * @param targetFormat 目标数据格式
   * @returns 是否支持
   */
  public static async isFormatConversionSupported(sourceFormat: string, targetFormat: string): Promise<boolean> {
    try {
      await this.getConverterByFormats(sourceFormat, targetFormat);
      return true;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * 获取所有支持的格式转换对
   * @returns 支持的格式转换对数组
   */
  public static async getSupportedFormats(): Promise<Array<{ from: DataFormat; to: DataFormat }>> {
    // 确保工厂已初始化
    this.initialize();
    
    // 使用 Set 来避免重复的转换对
    const uniqueConversions = new Set<string>();
    const result: Array<{ from: DataFormat; to: DataFormat }> = [];
    
    // 遍历所有转换器类型
    for (const type of Object.values(ConverterType)) {
      try {
        const converter = await this.getConverter(type);
        
        // 获取支持的源格式和目标格式
        const sourceFormats = converter.getSupportedSourceFormats();
        const targetFormats = converter.getSupportedTargetFormats();
        
        // 生成所有可能的转换对
        for (const source of sourceFormats) {
          for (const target of targetFormats) {
            // 使用字符串作为 Set 的键来检测重复
            const key = `${source}:${target}`;
            if (!uniqueConversions.has(key)) {
              uniqueConversions.add(key);
              result.push({ from: source as DataFormat, to: target as DataFormat });
            }
          }
        }
      } catch (error) {
        // 如果初始化转换器失败，继续处理下一个
        logger.warn(`Failed to initialize converter ${type}:`, error);
      }
    }
    
    return result;
  }
  
  /**
   * 获取支持的转换格式
   * @returns 支持的转换格式列表
   */
  public static async getSupportedConversions(): Promise<ConversionFormat[]> {
    // 确保工厂已初始化
    this.initialize();
    
    // 使用 Set 来避免重复的转换对
    const uniqueConversions = new Set<string>();
    const conversions: ConversionFormat[] = [];
    
    // 遍历所有转换器类型
    for (const type of Object.values(ConverterType)) {
      try {
        const converter = await this.getConverter(type);
        const sourceFormats = converter.getSupportedSourceFormats();
        const targetFormats = converter.getSupportedTargetFormats();
        
        // 生成所有可能的转换对
        for (const sourceFormat of sourceFormats) {
          for (const targetFormat of targetFormats) {
            // 使用字符串作为 Set 的键来检测重复
            const key = `${sourceFormat}:${targetFormat}`;
            if (!uniqueConversions.has(key)) {
              uniqueConversions.add(key);
              conversions.push({
                sourceFormat: sourceFormat as DataFormat,
                targetFormat: targetFormat as DataFormat,
                converterType: type
              });
            }
          }
        }
      } catch (error) {
        logger.warn(`Failed to initialize converter ${type}:`, error);
      }
    }
    
    return conversions;
  }
  
  /**
   * 检查是否支持指定的格式转换
   * @param sourceFormat 源数据格式
   * @param targetFormat 目标数据格式
   * @returns 是否支持转换
   */
  public static async isConversionSupported(sourceFormat: DataFormat, targetFormat: DataFormat): Promise<boolean> {
    try {
      // 确保工厂已初始化
      this.initialize();
      
      // 遍历所有转换器类型
      for (const type of Object.values(ConverterType)) {
        try {
          const converter = await this.getConverter(type);
          
          // 检查是否支持源格式和目标格式
          if (converter.supportsSourceFormat(sourceFormat.toString()) && 
              converter.supportsTargetFormat(targetFormat.toString())) {
            return true;
          }
        } catch (error) {
          logger.warn(`Error checking converter ${type}:`, error);
        }
      }
      
      return false;
    } catch (error) {
      logger.warn('Error checking conversion support:', error);
      return false;
    }
  }
  
  /**
   * 重置转换器工厂（用于测试）
   */
  public static reset(): void {
    this.converters.clear();
    this.initialized = false;
    logger.info('转换器工厂已重置');
  }
}
