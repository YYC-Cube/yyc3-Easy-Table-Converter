/**
 * @file 基础转换器类
 * @description 所有具体转换器的基类，提供通用功能
 * @module services/conversion-service/src/converters/BaseConverter
 * @author YYC
 * @version 2.0.0
 * @created 2024-11-23
 */

import { IConverter, ConversionResult, ValidationResult, ConversionOptions } from './IConverter';
import { DataFormat } from '../types';
import { LoggerService } from '../services/LoggerService';
import { PerformanceMonitorService } from '../services/PerformanceMonitorService';

/**
 * 基础转换器抽象类
 */
export abstract class BaseConverter implements IConverter {
  protected readonly logger: LoggerService;
  protected readonly performanceMonitor: PerformanceMonitorService;

  constructor() {
    this.logger = LoggerService.getInstance();
    this.performanceMonitor = PerformanceMonitorService.getInstance();
  }
  /**
   * 获取转换器支持的源格式
   */
  abstract getSupportedSourceFormat(): DataFormat;

  /**
   * 获取转换器支持的目标格式列表
   */
  abstract getSupportedTargetFormats(): DataFormat[];

  /**
   * 检查是否支持从源格式到目标格式的转换
   * @param sourceFormat 源格式
   * @param targetFormat 目标格式
   */
  canConvert(sourceFormat: DataFormat, targetFormat: DataFormat): boolean {
    const sourceSupported = this.getSupportedSourceFormat() === sourceFormat;
    const targetSupported = this.getSupportedTargetFormats().includes(targetFormat);
    
    this.logger.debug(`[BaseConverter] 检查转换支持: ${sourceFormat} -> ${targetFormat}: ${sourceSupported && targetSupported}`);
    
    return sourceSupported && targetSupported;
  }
  
  /**
   * 向后兼容: 获取支持的源格式数组
   * @returns 支持的源数据格式数组
   */
  getSupportedSourceFormats(): string[] {
    return [this.getSupportedSourceFormat()];
  }
  
  /**
   * 向后兼容: 检查是否支持指定的源格式
   * @param format 数据格式
   * @returns 是否支持
   */
  supportsSourceFormat(format: string): boolean {
    return this.getSupportedSourceFormat() === format;
  }
  
  /**
   * 向后兼容: 检查是否支持指定的目标格式
   * @param format 数据格式
   * @returns 是否支持
   */
  supportsTargetFormat(format: string): boolean {
    return this.getSupportedTargetFormats().includes(format as DataFormat);
  }
  
  /**
   * 执行转换（实现新接口）
   * @param sourceData 源数据
   * @param targetFormat 目标格式
   * @param options 转换选项
   */
  async convert(sourceData: Buffer, targetFormat: DataFormat, options?: ConversionOptions): Promise<ConversionResult> {
    const startTime = Date.now();
    const taskId = this.generateTaskId();
    
    this.logger.info(`[BaseConverter] 开始转换任务: ${taskId}, 格式: ${this.getSupportedSourceFormat()} -> ${targetFormat}`);
    
    try {
      if (!this.canConvert(this.getSupportedSourceFormat(), targetFormat)) {
        throw new Error(`不支持的格式转换: ${this.getSupportedSourceFormat()} -> ${targetFormat}`);
      }
      
      // 调用具体实现类的转换方法
      const result = await this.performConversion(sourceData, targetFormat, options || {});
      
      const endTime = Date.now();
      
      const conversionResult: ConversionResult = {
        success: true,
        data: result.data,
        metadata: {
          ...result.metadata,
          processingTime: endTime - startTime
        },
        taskId
      };
      
      this.logger.info(`[BaseConverter] 转换任务完成: ${taskId}, 耗时: ${conversionResult.metadata.processingTime}ms`);
      
      return conversionResult;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知转换错误';
      
      this.logger.error(`[BaseConverter] 转换任务失败: ${taskId}, 错误: ${errorMessage}`);
      
      return {
        success: false,
        data: Buffer.alloc(0),
        metadata: {
          rows: 0,
          columns: 0,
          processingTime: Date.now() - startTime
        },
        taskId,
        error: errorMessage
      };
    }
  }
  
  /**
   * 向后兼容: 执行数据转换
   * @param data 待转换的数据
   * @param options 转换选项（包含源格式和目标格式）
   * @returns 转换结果
   */
  async convertLegacy(data: string | Buffer, options: ConversionOptions & { sourceFormat: DataFormat; targetFormat: DataFormat }): Promise<string> {
    // 生成操作ID和执行转换操作（包含性能监控）
    const operationName = `${this.constructor.name}.convert`;
    const { sourceFormat, targetFormat } = options;
    const metadata = {
      formatInfo: {
        sourceFormat,
        targetFormat
      },
      dataSize: typeof data === 'string' ? data.length : data.byteLength
    };
    
    try {
      // 验证输入数据
      this.validateInput(data);
      
      // 检查是否支持该转换
      if (!this.supportsSourceFormat(sourceFormat) || 
          !this.supportsTargetFormat(targetFormat)) {
        throw new Error(`不支持从 ${sourceFormat} 转换到 ${targetFormat}`);
      }
      
      // 使用性能监控服务包装转换操作
      const result = await this.performanceMonitor.monitorAsync(operationName, async () => {
          // 执行具体的转换逻辑（由子类实现）
          const bufferData = typeof data === 'string' ? Buffer.from(data) : data;
          const conversionResult = await this.convert(bufferData, targetFormat, options);
          return conversionResult.data.toString('utf-8');
        }, metadata);
      
      return result;
    } catch (error) {
      this.logger.error('转换失败', { error, sourceFormat, targetFormat });
      // 返回错误信息字符串
      throw error instanceof Error ? error : new Error('未知转换错误');
    }
  }
  
  /**
   * 执行具体的转换（由子类实现）
   * @param sourceData 源数据
   * @param targetFormat 目标格式
   * @param options 转换选项
   */
  protected abstract performConversion(sourceData: Buffer, targetFormat: DataFormat, options: ConversionOptions): Promise<{
    data: Buffer;
    metadata: {
      rows: number;
      columns: number;
      [key: string]: any;
    };
  }>;
  
  /**
   * 向后兼容: 执行具体的转换逻辑
   * @param data 待转换的数据
   * @param options 转换选项
   * @returns 转换结果
   */
  protected abstract performConversionLegacy(data: string | Buffer, options: ConversionOptions): Promise<string>;
  
  /**
   * 生成任务ID
   * @private
   */
  private generateTaskId(): string {
    return `${this.getSupportedSourceFormat()}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * 验证输入数据
   * @param data 待转换的数据
   * @throws Error 当输入数据无效时
   */
  protected validateInput(data: string | Buffer): void {
    if (!data) {
      throw new Error('输入数据不能为空');
    }
  }
  
  /**
   * 验证转换选项
   * @param options 转换选项
   * @throws Error 当转换选项无效时
   */
  protected validateOptions(options: ConversionOptions): void {
    if (!options) {
      throw new Error('转换选项不能为空');
    }
  }
  
  /**
   * 格式化错误验证结果
   * @param message 错误消息
   * @param line 行号（可选）
   * @param column 列号（可选）
   */
  protected createValidationError(message: string, line?: number, column?: number): ValidationResult {
    return {
      isValid: false,
      issues: [{
        message,
        line,
        column,
        severity: 'error'
      }]
    };
  }
  
  /**
   * 创建成功验证结果
   */
  protected createValidationSuccess(): ValidationResult {
    return {
      isValid: true,
      issues: []
    };
  }
}
