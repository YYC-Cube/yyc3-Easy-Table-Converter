/**
 * @file 基础数据转换器
 * @description 提供数据转换器的抽象基类实现
 * @module industries/interoperability
 * @author YYC
 * @version 1.0.0
 * @created 2024-01-01
 * @updated 2024-01-01
 */

import {
  DataConverter,
  DataExchangeRequest,
  DataExchangeResponse
} from './DataExchangeProtocol';

import {
  DataSchema,
  DataMappingConfig
} from './DataExchangeProtocol';

/**
 * 基础数据转换器抽象类
 */
export abstract class BaseDataConverter implements DataConverter {
  protected mappings: Map<string, DataMappingConfig> = new Map();
  protected supportedSchemas: Set<string> = new Set();
  
  constructor(
    public sourceIndustry: string,
    public targetIndustry: string
  ) {
    this.initializeMappings();
  }
  
  /**
   * 初始化映射配置
   */
  protected abstract initializeMappings(): void;
  
  /**
   * 检查是否可以转换
   * @param sourceData 源数据
   * @param targetSchema 目标模式
   * @returns 是否可以转换
   */
  public canConvert(sourceData: any, targetSchema?: DataSchema): boolean {
    try {
      // 验证数据格式
      if (typeof sourceData !== 'object' || sourceData === null) {
        return false;
      }
      
      // 如果提供了目标模式，检查是否支持
      if (targetSchema && !this.supportedSchemas.has(targetSchema.id)) {
        return false;
      }
      
      // 验证是否有可用的映射配置
      if (this.mappings.size === 0) {
        return false;
      }
      
      return true;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * 执行数据转换
   * @param request 数据交换请求
   * @returns 转换响应
   */
  public async convert(request: DataExchangeRequest): Promise<DataExchangeResponse> {
    try {
      console.log(`🔄 开始转换: ${this.sourceIndustry} → ${this.targetIndustry}`);
      
      // 获取映射配置
      const mapping = this.getMappingForSchema(request.schemaId);
      if (!mapping) {
        return {
          requestId: request.requestId,
          success: false,
          error: `未找到与模式 ${request.schemaId} 对应的映射配置`,
          timestamp: Date.now(),
        };
      }
      
      // 执行转换
      let transformedData: any;
      
      if (Array.isArray(request.data)) {
        // 批量转换
        transformedData = await Promise.all(
          request.data.map(item => this.transformItem(item, mapping))
        );
      } else {
        // 单个对象转换
        transformedData = await this.transformItem(request.data, mapping);
      }
      
      // 应用格式转换
      const formattedData = this.applyFormat(transformedData, request.format);
      
      return {
        requestId: request.requestId,
        success: true,
        data: formattedData,
        timestamp: Date.now(),
        schemaMapping: mapping.rules.reduce((acc, rule) => {
          acc[rule.sourceField] = rule.targetField;
          return acc;
        }, {} as Record<string, string>),
      };
    } catch (error) {
      console.error(`❌ 转换失败:`, error);
      return {
        requestId: request.requestId,
        success: false,
        error: error instanceof Error ? error.message : '转换过程中发生未知错误',
        timestamp: Date.now(),
      };
    }
  }
  
  /**
   * 获取支持的数据模式
   */
  public getSupportedSchemas(): string[] {
    return Array.from(this.supportedSchemas);
  }
  
  /**
   * 验证数据模式
   * @param schema 数据模式
   */
  public validateSchema(schema: DataSchema): boolean {
    try {
      if (!schema || !schema.id || !schema.fields || !Array.isArray(schema.fields)) {
        return false;
      }
      
      // 检查必要的字段属性
      for (const field of schema.fields) {
        if (!field.id || !field.type) {
          return false;
        }
      }
      
      return true;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * 注册映射配置
   * @param config 映射配置
   */
  protected registerMapping(config: DataMappingConfig): void {
    this.mappings.set(config.sourceSchemaId, config);
    this.supportedSchemas.add(config.sourceSchemaId);
    console.log(`📋 注册映射配置: ${config.sourceSchemaId} → ${config.targetSchemaId}`);
  }
  
  /**
   * 获取特定模式的映射配置
   * @param schemaId 模式ID
   */
  protected getMappingForSchema(schemaId: string): DataMappingConfig | null {
    return this.mappings.get(schemaId) || null;
  }
  
  /**
   * 转换单个数据项
   * @param item 数据项
   * @param mapping 映射配置
   */
  protected async transformItem(item: any, mapping: DataMappingConfig): Promise<any> {
    const transformed = {} as Record<string, any>;
    const warnings: string[] = [];
    
    // 应用所有映射规则
    for (const rule of mapping.rules) {
      try {
        // 检查条件
        if (rule.condition && !rule.condition(item)) {
          continue;
        }
        
        // 获取源值
        const sourceValue = this.getValueFromPath(item, rule.sourceField);
        
        // 应用转换函数
        let targetValue;
        if (rule.transform && sourceValue !== undefined) {
          targetValue = rule.transform(sourceValue);
        } else if (sourceValue !== undefined) {
          targetValue = sourceValue; // 直接映射
        } else if (rule.default !== undefined) {
          targetValue = rule.default; // 使用默认值
        } else {
          continue; // 跳过未定义且无默认值的字段
        }
        
        // 设置目标值
        this.setValueFromPath(transformed, rule.targetField, targetValue);
      } catch (error) {
        warnings.push(`字段 ${rule.sourceField} → ${rule.targetField} 转换失败`);
      }
    }
    
    // 应用后处理
    return await this.postProcessTransformedData(transformed, warnings);
  }
  
  /**
   * 应用格式转换
   * @param data 转换后的数据
   * @param format 目标格式
   */
  protected applyFormat(data: any, format: string): any {
    // 根据请求的格式进行转换
    switch (format.toLowerCase()) {
      case 'json':
      default:
        return data; // JSON格式不需要额外处理
      case 'csv':
        return this.convertToCSV(data);
      case 'xml':
        return this.convertToXML(data);
    }
  }
  
  /**
   * 后处理转换后的数据
   * @param transformed 转换后的数据
   * @param original 原始数据
   * @param warnings 警告信息
   */
  protected async postProcessTransformedData(
    transformed: any,
    warnings: string[]
  ): Promise<any> {
    // 默认实现：添加元数据
    return {
      ...transformed,
      _metadata: {
        sourceIndustry: this.sourceIndustry,
        targetIndustry: this.targetIndustry,
        transformedAt: new Date().toISOString(),
        warnings: warnings.length > 0 ? warnings : undefined,
      }
    };
  }
  
  /**
   * 从对象路径获取值
   * @param obj 源对象
   * @param path 路径字符串
   */
  protected getValueFromPath(obj: any, path: string): any {
    if (!path || typeof obj !== 'object') {
      return undefined;
    }
    
    const keys = path.split('.');
    let value = obj;
    
    for (const key of keys) {
      if (value === null || value === undefined) {
        return undefined;
      }
      value = value[key];
    }
    
    return value;
  }
  
  /**
   * 设置对象路径的值
   * @param obj 目标对象
   * @param path 路径字符串
   * @param value 要设置的值
   */
  protected setValueFromPath(obj: any, path: string, value: any): void {
    if (!path || typeof obj !== 'object') {
      return;
    }
    
    const keys = path.split('.');
    let current: any = obj;
    
    // 遍历除最后一个键外的所有键
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!current[key]) {
        current[key] = {};
      }
      current = current[key];
    }
    
    // 设置最后一个键的值
    current[keys[keys.length - 1]] = value;
  }
  
  /**
   * 转换为CSV格式
   * @param data 数据
   */
  protected convertToCSV(data: any): string {
    try {
      if (!Array.isArray(data) || data.length === 0) {
        return '';
      }
      
      // 获取所有键
      const headers = new Set();
      data.forEach(item => {
        if (typeof item === 'object' && item !== null) {
          Object.keys(item).forEach(key => headers.add(key));
        }
      });
      
      const headerArray = Array.from(headers);
      const rows = [headerArray.join(',')];
      
      // 生成行
      data.forEach(item => {
        const row = headerArray.map(key => {
          const value = item[key as string];
          // 处理需要引号的值
          if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value || '';
        });
        rows.push(row.join(','));
      });
      
      return rows.join('\n');
    } catch (error) {
      console.error('❌ CSV转换失败:', error);
      return '';
    }
  }
  
  /**
   * 转换为XML格式
   * @param data 数据
   */
  protected convertToXML(data: any): string {
    try {
      const root = 'root';
      const itemName = 'item';
      let xml = `<${root}>`;
      
      if (Array.isArray(data)) {
        data.forEach(item => {
          xml += `\n  <${itemName}>`;
          xml += this.buildXMLElement(item, '    ');
          xml += `\n  </${itemName}>`;
        });
      } else {
        xml += this.buildXMLElement(data, '  ');
      }
      
      xml += `\n</${root}>`;
      return xml;
    } catch (error) {
      console.error('❌ XML转换失败:', error);
      return '';
    }
  }
  
  /**
   * 构建XML元素
   */
  private buildXMLElement(data: any, indent: string): string {
    let xml = '';
    
    if (typeof data === 'object' && data !== null) {
      Object.entries(data).forEach(([key, value]) => {
        if (key.startsWith('_')) {
          return; // 跳过元数据
        }
        
        xml += `\n${indent}<${key}>`;
        
        if (typeof value === 'object' && value !== null) {
          xml += this.buildXMLElement(value, indent + '  ');
        } else {
          xml += this.escapeXML(value !== null && value !== undefined ? String(value) : '');
        }
        
        xml += `</${key}>`;
      });
    }
    
    return xml;
  }
  
  /**
   * 转义XML特殊字符
   */
  private escapeXML(text: string): string {
    return text
      .replace(/&/g, '\u0026amp;')
      .replace(/</g, '\u0026lt;')
      .replace(/>/g, '\u0026gt;')
      .replace(/"/g, '\u0026quot;')
      .replace(/'/g, '\u0026apos;');
  }
}
