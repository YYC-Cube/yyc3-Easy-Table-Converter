/**
 * @file 转换服务类型定义
 * @description 定义转换服务的核心接口、数据结构和枚举类型
 * @module types
 * @author YYC
 * @version 1.0.0
 * @created 2024-01-15
 * @updated 2024-01-15
 */

/**
 * 数据格式枚举
 */
export enum DataFormat {
  CSV = 'csv',
  JSON = 'json',
  EXCEL = 'excel',
  PARQUET = 'parquet',
  ARROW = 'arrow',
  XML = 'xml',
  YAML = 'yaml',
  TOML = 'toml',
  TSV = 'tsv',
  MARKDOWN = 'markdown',
  SQL = 'sql',
  HTML = 'html'
}

/**
 * 转换选项接口
 */
export interface ConversionOptions {
  /** 分隔符（用于CSV/TSV） */
  delimiter?: string;
  /** 是否包含表头 */
  headers?: boolean;
  /** JSON缩进空格数 */
  jsonIndent?: number;
  /** Excel工作表名称 */
  sheetName?: string;
  /** 是否压缩输出 */
  compress?: boolean;
  /** 自定义配置 */
  customConfig?: Record<string, any>;
  /** 返回类型（string或buffer） */
  returnType?: 'string' | 'buffer';
  /** 是否美化JSON输出 */
  pretty?: boolean;
  /** HTML表格CSS类名 */
  htmlTableClass?: string;
  /** 是否包含HTML样式 */
  includeHtmlStyles?: boolean;
}

/**
 * 转换请求接口
 */
export interface ConversionRequest {
  /** 源数据格式 */
  sourceFormat: DataFormat;
  /** 目标数据格式 */
  targetFormat: DataFormat;
  /** 源数据内容 */
  sourceData: string | Buffer;
  /** 转换选项 */
  options?: ConversionOptions;
}

/**
 * 转换响应接口
 */
export interface ConversionResponse {
  /** 转换后的数据 */
  data: string | Buffer;
  /** 数据格式 */
  format: DataFormat;
  /** 转换统计信息 */
  stats?: {
    /** 处理的行数 */
    rowCount: number;
    /** 处理的列数 */
    columnCount: number;
    /** 转换耗时（毫秒） */
    processingTime: number;
  };
  /** 是否成功 */
  success: boolean;
  /** 错误信息（如果有） */
  error?: string;
}

/**
 * 转换器接口
 */
export interface IConverter {
  /**
   * 检查是否支持指定的源格式
   * @param format 数据格式
   * @returns 是否支持
   */
  supportsSourceFormat(format: string): boolean;
  
  /**
   * 检查是否支持指定的目标格式
   * @param format 数据格式
   * @returns 是否支持
   */
  supportsTargetFormat(format: string): boolean;
  
  /**
   * 获取支持的源数据格式
   * @returns 支持的源数据格式数组
   */
  getSupportedSourceFormats(): string[];
  
  /**
   * 获取支持的目标数据格式
   * @returns 支持的目标数据格式数组
   */
  getSupportedTargetFormats(): string[];
  
  /**
   * 执行数据转换
   * @param data 待转换的数据
   * @param options 转换选项（包含源格式和目标格式）
   * @returns 转换结果
   */
  convert(data: string | Buffer, options: ConversionOptions & { sourceFormat: DataFormat; targetFormat: DataFormat }): Promise<string>;
}

/**
 * 转换服务接口
 */
export interface IConversionService {
  /**
   * 获取支持的转换路径
   */
  getSupportedConversions(): Promise<Array<{ from: DataFormat; to: DataFormat }>>;
  
  /**
   * 执行转换
   */
  convert(request: ConversionRequest): Promise<ConversionResponse>;
  
  /**
   * 批量转换
   * @returns 批量转换任务ID
   */
  batchConvert(requests: ConversionRequest[]): Promise<string>;
  
  /**
   * 检查是否支持指定的格式转换
   */
  isConversionSupported(sourceFormat: DataFormat, targetFormat: DataFormat): Promise<boolean>;
}

/**
 * 转换状态枚举
 */
export enum ConversionStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

/**
 * 批量转换任务接口
 */
export interface BatchConversionTask {
  id: string;
  requests: ConversionRequest[];
  responses: ConversionResponse[];
  status: ConversionStatus;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

/**
 * 转换任务接口
 */
export interface ConversionTask {
  /** 任务ID */
  id: string;
  /** 源数据 */
  sourceData: string | Buffer;
  /** 源格式 */
  sourceFormat: DataFormat;
  /** 目标格式 */
  targetFormat: DataFormat;
  /** 转换选项 */
  options: ConversionOptions;
  /** 任务状态 */
  status: ConversionStatus;
  /** 元数据 */
  metadata?: {
    fileName?: string;
    userId?: string;
    clientInfo?: any;
    requestId?: string;
    batchJobId?: string;
    taskIndex?: number;
  };
}
