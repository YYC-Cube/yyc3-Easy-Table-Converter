/**
 * @file 转换服务数据模型和类型定义
 * @description 定义表格转换服务的核心数据结构和类型
 * @module types/converter
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 */

/**
 * 支持的文件格式枚举
 */
export enum FileFormat {
  CSV = 'csv',
  JSON = 'json',
  XML = 'xml',
  MARKDOWN = 'markdown',
  PARQUET = 'parquet',
  EXCEL = 'excel',
  YAML = 'yaml',
  TOML = 'toml',
}

/**
 * 转换选项接口
 */
export interface ConversionOptions {
  /** 分隔符，适用于CSV等格式 */
  delimiter?: string;
  /** 是否包含标题行 */
  headers?: boolean;
  /** 数值精度 */
  precision?: number;
  /** 是否压缩输出 */
  compressed?: boolean;
  /** 字符编码 */
  encoding?: string;
  /** 特殊格式选项 */
  formatSpecificOptions?: Record<string, any>;
}

/**
 * 转换请求接口
 */
export interface ConversionRequest {
  /** 目标格式 */
  format: FileFormat | string;
  /** 要转换的数据 */
  data: any;
  /** 转换选项 */
  options?: ConversionOptions;
  /** 请求ID，用于追踪 */
  requestId?: string;
}

/**
 * 转换响应接口
 */
export interface ConversionResponse {
  /** 是否成功 */
  success: boolean;
  /** 转换后的数据 */
  data?: any;
  /** 源格式 */
  sourceFormat?: string;
  /** 目标格式 */
  targetFormat: string;
  /** 转换统计信息 */
  stats?: {
    rows: number;
    columns: number;
    processingTime: number;
    outputSize?: number;
  };
  /** 错误信息，如果有的话 */
  error?: string;
  /** 错误详情 */
  errorDetails?: any;
  /** 时间戳 */
  timestamp: string;
  /** 请求ID */
  requestId?: string;
}

/**
 * 转换引擎接口
 */
export interface ConversionEngine {
  /**
   * 执行转换
   * @param request 转换请求
   * @returns 转换响应
   */
  convert(request: ConversionRequest): Promise<ConversionResponse>;
  
  /**
   * 获取支持的格式列表
   * @returns 支持的格式数组
   */
  getSupportedFormats(): string[];
  
  /**
   * 检查格式是否支持
   * @param format 要检查的格式
   * @returns 是否支持
   */
  isFormatSupported(format: string): boolean;
}

/**
 * 格式转换器接口
 */
export interface FormatConverter {
  /**
   * 从通用数据格式转换为特定格式
   * @param data 通用数据
   * @param options 转换选项
   * @returns 转换后的数据
   */
  convertTo(data: any, options?: ConversionOptions): Promise<any>;
  
  /**
   * 从特定格式转换为通用数据格式
   * @param data 特定格式数据
   * @param options 转换选项
   * @returns 通用数据
   */
  convertFrom(data: any, options?: ConversionOptions): Promise<any>;
  
  /**
   * 获取格式名称
   * @returns 格式名称
   */
  getFormatName(): string;
}

/**
 * 转换错误类
 */
export class ConversionError extends Error {
  /** 错误代码 */
  code: string;
  /** 错误详情 */
  details?: any;
  
  constructor(message: string, code: string, details?: any) {
    super(message);
    this.name = 'ConversionError';
    this.code = code;
    this.details = details;
  }
}

/**
 * 转换统计接口
 */
export interface ConversionStats {
  /** 开始时间 */
  startTime: number;
  /** 结束时间 */
  endTime?: number;
  /** 处理行数 */
  rowsProcessed: number;
  /** 处理列数 */
  columnsProcessed: number;
  /** 输入大小（字节） */
  inputSize?: number;
  /** 输出大小（字节） */
  outputSize?: number;
}

/**
 * 通用表格数据接口
 */
export interface TableData {
  /** 表头 */
  headers: string[];
  /** 数据行 */
  rows: any[][];
  /** 元数据 */
  metadata?: {
    source?: string;
    createdAt?: string;
    updatedAt?: string;
    description?: string;
  };
}
