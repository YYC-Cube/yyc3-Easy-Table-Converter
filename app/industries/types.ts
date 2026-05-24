/**
 * @file 行业数据类型定义
 * @description 定义行业协同和数据转换所需的基础类型
 * @module industries/types
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-16
 * @updated 2024-10-16
 */

/**
 * 数据格式枚举
 */
export enum DataFormat {
  JSON = 'JSON',
  XML = 'XML',
  CSV = 'CSV',
  EXCEL = 'EXCEL',
  API = 'API',
  DATABASE = 'DATABASE',
}

/**
 * 数据类型枚举
 */
export enum DataType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  DATE = 'date',
  OBJECT = 'object',
  ARRAY = 'array',
  NULL = 'null',
  UNDEFINED = 'undefined',
}

/**
 * 数据转换接口
 */
export interface DataTransformation {
  /**
   * 源数据类型
   */
  sourceType: DataType;
  
  /**
   * 目标数据类型
   */
  targetType: DataType;
  
  /**
   * 转换函数名称
   */
  transformFunction?: string;
  
  /**
   * 是否需要验证
   */
  validate?: boolean;
  
  /**
 * 验证规则
 */
  validationRules?: Record<string, any>;
}

/**
 * 行业类型枚举
 */
export enum IndustryType {
  RETAIL = 'retail',
  MANUFACTURING = 'manufacturing',
  FINANCE = 'finance',
  HEALTHCARE = 'healthcare',
  EDUCATION = 'education',
  LOGISTICS = 'logistics',
  ECOMMERCE = 'ecommerce',
  GOVERNMENT = 'government'
}