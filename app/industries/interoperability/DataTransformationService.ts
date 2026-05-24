/**
 * @file 数据转换服务实现
 * @description 实现行业间数据转换的核心服务逻辑
 * @module industries/interoperability
 * @author YYC
 * @version 1.0.0
 * @created 2024-01-01
 * @updated 2024-01-01
 */

import {
  DataConverter,
  DataExchangeRequest,
  DataExchangeResponse,
  DataSchema,
  DataTransformationService as IDataTransformationService,
  DataExchangeError,
  ErrorCodes,
  validateRequest,
  createRequestId
} from './DataExchangeProtocol';

/**
 * 数据转换服务实现类
 */
export class DataTransformationService implements IDataTransformationService {
  private converters: Map<string, DataConverter> = new Map();
  private schemas: Map<string, DataSchema> = new Map();
  private static instance: DataTransformationService;
  
  /**
   * 获取服务单例
   */
  public static getInstance(): DataTransformationService {
    if (!DataTransformationService.instance) {
      DataTransformationService.instance = new DataTransformationService();
    }
    return DataTransformationService.instance;
  }
  
  /**
   * 注册数据转换器
   * @param converter 数据转换器实例
   */
  public registerConverter(converter: DataConverter): void {
    const key = `${converter.sourceIndustry}:${converter.targetIndustry}`;
    this.converters.set(key, converter);
    console.log(`🔌 注册数据转换器: ${converter.sourceIndustry} → ${converter.targetIndustry}`);
  }
  
  /**
   * 注销数据转换器
   * @param sourceIndustry 源行业
   * @param targetIndustry 目标行业
   */
  public unregisterConverter(sourceIndustry: string, targetIndustry: string): void {
    const key = `${sourceIndustry}:${targetIndustry}`;
    this.converters.delete(key);
    console.log(`🔌 注销数据转换器: ${sourceIndustry} → ${targetIndustry}`);
  }
  
  /**
   * 获取数据转换器
   * @param sourceIndustry 源行业
   * @param targetIndustry 目标行业
   * @returns 转换器实例或null
   */
  public getConverter(sourceIndustry: string, targetIndustry: string): DataConverter | null {
    const key = `${sourceIndustry}:${targetIndustry}`;
    return this.converters.get(key) || null;
  }
  
  /**
   * 转换数据
   * @param request 数据交换请求
   * @returns 转换响应
   */
  public async transformData(request: DataExchangeRequest): Promise<DataExchangeResponse> {
    try {
      // 验证请求
      if (!validateRequest(request)) {
        throw new DataExchangeError('无效的请求格式', ErrorCodes.INVALID_REQUEST);
      }
      
      // 验证源数据模式
      const sourceSchema = this.schemas.get(request.schemaId);
      if (!sourceSchema) {
        throw new DataExchangeError(`数据模式 ${request.schemaId} 不存在`, ErrorCodes.SCHEMA_NOT_FOUND);
      }
      
      // 获取转换器
      const converter = this.getConverter(request.source, request.target);
      if (!converter) {
        throw new DataExchangeError(
          `未找到 ${request.source} 到 ${request.target} 的转换器`, 
          ErrorCodes.CONVERTER_NOT_FOUND
        );
      }
      
      // 检查转换器是否支持该数据
      if (!converter.canConvert(request.data, sourceSchema)) {
        throw new DataExchangeError(
          '转换器不支持当前数据格式或模式', 
          ErrorCodes.CONVERSION_FAILED
        );
      }
      
      // 执行转换
      const response = await converter.convert(request);
      console.log(`📊 数据转换完成: ${request.source} → ${request.target}, 请求ID: ${request.requestId}`);
      return response;
    } catch (error) {
      console.error(`❌ 数据转换失败:`, error);
      
      const exchangeError = error instanceof DataExchangeError 
        ? error 
        : new DataExchangeError('转换过程中发生未知错误', ErrorCodes.CONVERSION_FAILED);
      
      return {
        requestId: request.requestId,
        success: false,
        error: exchangeError.message,
        timestamp: Date.now(),
      };
    }
  }
  
  /**
   * 注册数据模式
   * @param schema 数据模式
   */
  public registerSchema(schema: DataSchema): void {
    this.schemas.set(schema.id, schema);
    console.log(`📋 注册数据模式: ${schema.name} (${schema.id})`);
  }
  
  /**
   * 获取数据模式
   * @param schemaId 模式ID
   * @returns 数据模式或null
   */
  public getSchema(schemaId: string): DataSchema | null {
    return this.schemas.get(schemaId) || null;
  }
  
  /**
   * 验证数据是否符合模式
   * @param data 待验证数据
   * @param schemaId 模式ID
   * @returns 是否有效
   */
  public validateData(data: any, schemaId: string): boolean {
    try {
      const schema = this.getSchema(schemaId);
      if (!schema) {
        return false;
      }
      
      // 如果数据是数组，验证每个元素
      if (Array.isArray(data)) {
        return data.every(item => this.validateDataAgainstSchema(item, schema));
      }
      
      // 验证单个对象
      return this.validateDataAgainstSchema(data, schema);
    } catch (error) {
      console.error(`❌ 数据验证失败:`, error);
      return false;
    }
  }
  
  /**
   * 获取支持的转换对
   * @returns 支持的行业转换对列表
   */
  public getSupportedTransformations(): Array<{source: string, target: string}> {
    const transformations: Array<{source: string, target: string}> = [];
    
    this.converters.forEach((_converter, key) => {
      const [source, target] = key.split(':');
      transformations.push({ source, target });
    });
    
    return transformations;
  }
  
  /**
   * 批量转换数据
   * @param requests 批量请求
   * @returns 批量响应
   */
  public async transformBatchData(requests: DataExchangeRequest[]): Promise<DataExchangeResponse[]> {
    const responses = await Promise.allSettled(requests.map(req => this.transformData(req)));
    
    return responses.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          requestId: requests[index]?.requestId || createRequestId(),
          success: false,
          error: result.reason?.message || '批量转换失败',
          timestamp: Date.now(),
        };
      }
    });
  }
  
  /**
   * 获取所有已注册的模式
   */
  public getAllSchemas(): DataSchema[] {
    return Array.from(this.schemas.values());
  }
  
  /**
   * 清理所有注册的转换器和模式
   */
  public clear(): void {
    this.converters.clear();
    this.schemas.clear();
    console.log(`🧹 数据转换服务已清理`);
  }
  
  /**
   * 内部方法：根据模式验证数据
   */
  private validateDataAgainstSchema(data: any, schema: DataSchema): boolean {
    if (typeof data !== 'object' || data === null) {
      return false;
    }
    
    // 检查必填字段
    for (const field of schema.fields) {
      if (field.required && !(field.id in data)) {
        console.warn(`⚠️ 缺少必填字段: ${field.id}`);
        return false;
      }
      
      // 如果字段存在，验证类型
      if (field.id in data && data[field.id] !== null && data[field.id] !== undefined) {
        if (!this.validateFieldType(data[field.id], field.type)) {
          console.warn(`⚠️ 字段类型不匹配: ${field.id}, 期望: ${field.type}, 实际: ${typeof data[field.id]}`);
          return false;
        }
      }
    }
    
    return true;
  }
  
  /**
   * 内部方法：验证字段类型
   */
  private validateFieldType(value: any, expectedType: string): boolean {
    const actualType = typeof value;
    
    switch (expectedType) {
      case 'text':
      case 'string':
        return actualType === 'string';
      case 'number':
        return actualType === 'number' && !isNaN(value);
      case 'boolean':
        return actualType === 'boolean';
      case 'object':
        return actualType === 'object' && value !== null;
      case 'array':
        return Array.isArray(value);
      case 'date':
        return value instanceof Date || !isNaN(new Date(value).getTime());
      default:
        return true;
    }
  }
}

// 导出默认实例
export const dataTransformationService = DataTransformationService.getInstance();
