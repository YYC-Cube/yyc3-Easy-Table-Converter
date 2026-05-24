/**
 * @file 数据交换协议定义
 * @description 定义行业间数据交换的标准化协议和接口
 * @module industries/interoperability
 * @author YYC
 * @version 1.0.0
 * @created 2024-01-01
 * @updated 2024-01-01
 */

// 数据类型枚举
export enum DataType {
  TEXT = 'text',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  DATE = 'date',
  OBJECT = 'object',
  ARRAY = 'array',
  IMAGE = 'image',
  AUDIO = 'audio',
  VIDEO = 'video',
  DOCUMENT = 'document',
}

// 数据格式枚举
export enum DataFormat {
  JSON = 'json',
  CSV = 'csv',
  XML = 'xml',
  YAML = 'yaml',
  MARKDOWN = 'markdown',
  HTML = 'html',
  PDF = 'pdf',
  EXCEL = 'excel',
}

// 数据字段定义接口
export interface DataField {
  id: string;           // 字段唯一标识
  name: string;         // 字段名称
  description?: string; // 字段描述
  type: DataType;       // 字段类型
  required?: boolean;   // 是否必填
  defaultValue?: any;   // 默认值
  constraints?: any;    // 约束条件
  format?: string;      // 数据格式
}

// 数据模式定义
export interface DataSchema {
  id: string;           // 模式唯一标识
  name: string;         // 模式名称
  description?: string; // 模式描述
  version: string;      // 版本号
  fields: DataField[];  // 字段定义列表
  metadata?: Record<string, any>; // 元数据
}

// 数据交换请求接口
export interface DataExchangeRequest {
  source: string;       // 数据源行业标识
  target: string;       // 目标行业标识
  schemaId: string;     // 使用的数据模式ID
  format: DataFormat;   // 请求的数据格式
  data: any;            // 要交换的数据
  options?: Record<string, any>; // 交换选项
  timestamp: number;    // 请求时间戳
  requestId: string;    // 请求唯一标识
}

// 数据交换响应接口
export interface DataExchangeResponse {
  requestId: string;    // 对应的请求ID
  success: boolean;     // 是否成功
  data?: any;           // 交换后的数据
  error?: string;       // 错误信息
  warnings?: string[];  // 警告信息
  timestamp: number;    // 响应时间戳
  schemaMapping?: Record<string, string>; // 字段映射关系
}

// 数据转换器接口
export interface DataConverter {
  sourceIndustry: string; // 源行业
  targetIndustry: string; // 目标行业
  canConvert(sourceData: any, targetSchema?: DataSchema): boolean; // 检查是否可以转换
  convert(request: DataExchangeRequest): Promise<DataExchangeResponse>; // 执行转换
  getSupportedSchemas(): string[]; // 获取支持的数据模式
  validateSchema(schema: DataSchema): boolean; // 验证数据模式
}

// 数据映射规则接口
export interface DataMappingRule {
  sourceField: string;  // 源字段
  targetField: string;  // 目标字段
  transform?: (value: any) => any; // 转换函数
  default?: any;        // 默认值
  condition?: (data: any) => boolean; // 条件函数
}

// 数据映射配置接口
export interface DataMappingConfig {
  sourceSchemaId: string; // 源模式ID
  targetSchemaId: string; // 目标模式ID
  rules: DataMappingRule[]; // 映射规则列表
  version: string;        // 映射版本
  description?: string;   // 描述
}

// 数据转换服务接口
export interface DataTransformationService {
  registerConverter(converter: DataConverter): void; // 注册转换器
  unregisterConverter(sourceIndustry: string, targetIndustry: string): void; // 注销转换器
  getConverter(sourceIndustry: string, targetIndustry: string): DataConverter | null; // 获取转换器
  transformData(request: DataExchangeRequest): Promise<DataExchangeResponse>; // 转换数据
  registerSchema(schema: DataSchema): void; // 注册数据模式
  getSchema(schemaId: string): DataSchema | null; // 获取数据模式
  validateData(data: any, schemaId: string): boolean; // 验证数据
  getSupportedTransformations(): Array<{source: string, target: string}>; // 获取支持的转换
}

// 错误处理类
export class DataExchangeError extends Error {
  public code: string;
  public details: Record<string, any>;

  constructor(message: string, code: string, details?: Record<string, any>) {
    super(message);
    this.name = 'DataExchangeError';
    this.code = code;
    this.details = details || {};
  }
}

// 预定义错误代码
export const ErrorCodes = {
  SCHEMA_NOT_FOUND: 'SCHEMA_NOT_FOUND',
  CONVERTER_NOT_FOUND: 'CONVERTER_NOT_FOUND',
  DATA_VALIDATION_ERROR: 'DATA_VALIDATION_ERROR',
  CONVERSION_FAILED: 'CONVERSION_FAILED',
  INVALID_FORMAT: 'INVALID_FORMAT',
  TIMEOUT: 'TIMEOUT',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  INVALID_REQUEST: 'INVALID_REQUEST',
};

/**
 * 创建唯一请求ID
 */
export function createRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 验证请求格式
 */
export function validateRequest(request: DataExchangeRequest): boolean {
  try {
    // 检查必填字段
    if (!request.source || !request.target || !request.schemaId || !request.format || !request.data) {
      return false;
    }
    
    // 验证请求ID
    if (!request.requestId) {
      return false;
    }
    
    // 验证时间戳
    if (!request.timestamp || request.timestamp > Date.now() + 3600000) { // 允许1小时的时间误差
      return false;
    }
    
    return true;
  } catch (error) {
    return false;
  }
}
