/**
 * @file 转换器接口
 * @description 定义所有格式转换器必须实现的接口
 * @module services/conversion-service/src/converters/IConverter
 * @author YYC
 * @version 2.0.0
 * @created 2024-11-23
 */

import { DataFormat } from '../types';

/**
 * 转换选项接口
 */
export interface ConversionOptions {
  [key: string]: any;
}

/**
 * 转换结果接口
 */
export interface ConversionResult {
  /** 转换是否成功 */
  success: boolean;
  /** 转换后的二进制数据 */
  data: Buffer;
  /** 转换元数据 */
  metadata: {
    /** 行数 */
    rows: number;
    /** 列数 */
    columns: number;
    /** 转换耗时（毫秒） */
    processingTime?: number;
    /** 其他自定义元数据 */
    [key: string]: any;
  };
  /** 任务ID */
  taskId: string;
  /** 错误信息（如果失败） */
  error?: string;
}

/**
 * 验证结果接口
 */
export interface ValidationResult {
  /** 文件是否有效 */
  isValid: boolean;
  /** 验证问题列表 */
  issues: Array<{
    /** 问题消息 */
    message: string;
    /** 行号（如果适用） */
    line?: number;
    /** 列号（如果适用） */
    column?: number;
    /** 严重程度 */
    severity: 'error' | 'warning' | 'info';
  }>;
}

/**
 * 转换器接口
 */
export interface IConverter {
  /**
   * 获取转换器支持的源格式
   */
  getSupportedSourceFormat(): DataFormat;

  /**
   * 获取转换器支持的目标格式列表
   */
  getSupportedTargetFormats(): DataFormat[];

  /**
   * 检查是否支持从源格式到目标格式的转换
   * @param sourceFormat 源格式
   * @param targetFormat 目标格式
   */
  canConvert(sourceFormat: DataFormat, targetFormat: DataFormat): boolean;

  /**
   * 执行转换
   * @param sourceData 源数据
   * @param targetFormat 目标格式
   * @param options 转换选项
   */
  convert(sourceData: Buffer, targetFormat: DataFormat, options?: ConversionOptions): Promise<ConversionResult>;

  /**
   * 验证文件格式
   * @param data 文件数据
   */
  validate(data: Buffer): Promise<ValidationResult>;
}
