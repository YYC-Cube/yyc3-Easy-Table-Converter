/**
 * @file 数据驱动管理器实现
 * @description 提供数据绑定、验证、转换等核心功能的管理器类
 * @module industries/frontend-driver/core/DataDrivenManager
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-26
 */

import {
  DataModel,
  DataField,
  DataChangeEvent,
  ValidationResult,
  ValidationError,
  ValidationRule,
  DataTransformer,
  DataDrivenConfig
} from '../types/DataDrivenTypes';

/**
 * 数据驱动管理器类
 * 负责处理数据模型、验证、绑定和转换等核心功能
 */
export class DataDrivenManager<T extends Record<string, any>> {
  private model: DataModel;
  private currentData: T;
  private initialData: T;
  private config: DataDrivenConfig;
  private listeners: ((event: DataChangeEvent) => void)[] = [];
  private transformers: Map<string, DataTransformer> = new Map();

  /**
   * 构造函数
   * @param model 数据模型
   * @param initialData 初始数据
   * @param config 配置选项
   */
  constructor(model: DataModel, initialData: T, config: DataDrivenConfig = {}) {
    this.model = model;
    this.config = {
      autoValidate: true,
      enableTwoWayBinding: true,
      ...config
    };
    
    // 初始化数据转换器
    if (config.transformers) {
      Object.entries(config.transformers).forEach(([key, transformer]) => {
        this.transformers.set(key, transformer);
      });
    }
    
    // 初始化数据，应用默认值
    this.initialData = this.applyDefaults(initialData);
    this.currentData = { ...this.initialData };
  }

  /**
   * 应用字段默认值
   * @param data 原始数据
   * @returns 应用默认值后的数据
   */
  private applyDefaults(data: T): T {
    // 创建一个新对象，而不是直接修改泛型类型
    const defaultsMap = {} as Record<string, any>;
    
    this.model.fields.forEach(field => {
      // 收集默认值
      if (data[field.name as keyof T] === undefined && field.defaultValue !== undefined) {
        defaultsMap[field.name] = field.defaultValue;
      }
    });
    
    // 使用Object.assign合并原始数据和默认值
    return Object.assign({}, data, defaultsMap) as T;
  }

  /**
   * 获取当前数据
   * @returns 当前数据
   */
  public getData(): T {
    return { ...this.currentData };
  }

  /**
   * 更新单个字段数据
   * @param field 字段名
   * @param value 新值
   * @returns 更新是否成功
   */
  public updateField(field: string, value: any): boolean {
    const fieldConfig = this.getFieldConfig(field);
    if (!fieldConfig) {
      console.error(`Field ${field} not found in model`);
      return false;
    }

    // 验证类型
    if (!this.validateFieldType(fieldConfig, value)) {
      console.error(`Invalid type for field ${field}`);
      return false;
    }

    const oldValue = this.currentData[field];
    
    // 如果启用自动验证，先验证
    if (this.config.autoValidate) {
      const validationErrors = this.validateField(field, value);
      if (validationErrors.length > 0) {
        console.error(`Validation failed for field ${field}:`, validationErrors);
        return false;
      }
    }

    // 创建新对象来更新数据，避免直接索引泛型类型
    this.currentData = Object.assign({}, this.currentData, { [field]: value });

    // 触发变更事件
    const event: DataChangeEvent = {
      field,
      value,
      oldValue,
      timestamp: Date.now()
    };
    
    this.notifyListeners(event);
    return true;
  }

  /**
   * 批量更新数据
   * @param changes 要更新的数据
   * @returns 更新是否成功
   */
  public batchUpdate(changes: Partial<T>): boolean {
    const oldData = { ...this.currentData };
    let hasChanges = false;
    const changesMap: Record<string, any> = {};
    
    // 应用所有变更
    Object.entries(changes).forEach(([field, value]) => {
      const fieldConfig = this.getFieldConfig(field);
      if (fieldConfig && this.validateFieldType(fieldConfig, value)) {
        changesMap[field] = value;
        hasChanges = true;
      }
    });
    
    // 一次性更新所有变更，避免直接索引泛型类型
    if (hasChanges) {
      this.currentData = Object.assign({}, this.currentData, changesMap) as T;
    }

    // 如果启用自动验证，验证所有数据
    if (hasChanges && this.config.autoValidate) {
      const validationResult = this.validateAll();
      if (!validationResult.isValid) {
        // 如果验证失败，回滚数据
        this.currentData = oldData;
        console.error('Batch update validation failed:', validationResult.errors);
        return false;
      }
    }

    // 触发所有变更的字段事件
    if (hasChanges) {
      Object.entries(changes).forEach(([field, value]) => {
        if (oldData[field] !== value) {
          const event: DataChangeEvent = {
            field,
            value,
            oldValue: oldData[field],
            timestamp: Date.now()
          };
          this.notifyListeners(event);
        }
      });
    }

    return hasChanges;
  }

  /**
   * 重置数据到初始状态
   */
  public reset(): void {
    const oldData = { ...this.currentData };
    this.currentData = { ...this.initialData };
    
    // 触发所有变更的字段事件
    Object.keys(this.currentData).forEach(field => {
      if (oldData[field] !== this.currentData[field]) {
        const event: DataChangeEvent = {
          field,
          value: this.currentData[field],
          oldValue: oldData[field],
          timestamp: Date.now()
        };
        this.notifyListeners(event);
      }
    });
  }

  /**
   * 获取字段配置
   * @param fieldName 字段名
   * @returns 字段配置或undefined
   */
  public getFieldConfig(fieldName: string): DataField | undefined {
    return this.model.fields.find(field => field.name === fieldName);
  }

  /**
   * 验证单个字段
   * @param fieldName 字段名
   * @param value 字段值（可选，默认为当前值）
   * @returns 验证错误列表
   */
  public validateField(fieldName: string, value?: any): ValidationError[] {
    const fieldConfig = this.getFieldConfig(fieldName);
    if (!fieldConfig) {
      return [{ field: fieldName, message: `字段 ${fieldName} 不存在` }];
    }

    const fieldValue = value !== undefined ? value : this.currentData[fieldName];
    const errors: ValidationError[] = [];
    const rules = [...(fieldConfig.validations || []), ...(this.config.defaultValidations || [])];

    rules.forEach(rule => {
      if (!this.applyValidationRule(rule, fieldValue, fieldConfig)) {
        errors.push({
          field: fieldName,
          message: rule.message
        });
      }
    });

    return errors;
  }

  /**
   * 验证所有字段
   * @returns 验证结果
   */
  public validateAll(): ValidationResult {
    const errors: ValidationError[] = [];

    this.model.fields.forEach(field => {
      const fieldErrors = this.validateField(field.name);
      errors.push(...fieldErrors);
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * 应用单个验证规则
   * @param rule 验证规则
   * @param value 字段值
   * @param field 字段配置
   * @returns 是否验证通过
   */
  private applyValidationRule(rule: ValidationRule, value: any, _: DataField): boolean {
    switch (rule.type) {
      case 'required':
        return value !== undefined && value !== null && value !== '';
      
      case 'min':
        if (typeof value === 'number') {
          return value >= rule.value;
        }
        if (typeof value === 'string') {
          return value.length >= rule.value;
        }
        return true;
      
      case 'max':
        if (typeof value === 'number') {
          return value <= rule.value;
        }
        if (typeof value === 'string') {
          return value.length <= rule.value;
        }
        return true;
      
      case 'pattern':
        if (typeof value === 'string' && rule.value instanceof RegExp) {
          return rule.value.test(value);
        }
        return true;
      
      case 'custom':
        if (rule.validator && typeof rule.validator === 'function') {
          return rule.validator(value);
        }
        return true;
      
      default:
        return true;
    }
  }

  /**
   * 验证字段类型
   * @param field 字段配置
   * @param value 字段值
   * @returns 类型是否匹配
   */
  private validateFieldType(field: DataField, value: any): boolean {
    // 如果值为undefined或null，且字段不是必填的，则通过验证
    if ((value === undefined || value === null) && !field.required) {
      return true;
    }

    // 检查类型
    switch (field.type) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number';
      case 'boolean':
        return typeof value === 'boolean';
      case 'date':
        return value instanceof Date || (typeof value === 'string' && !isNaN(Date.parse(value)));
      case 'object':
        return typeof value === 'object' && value !== null && !Array.isArray(value);
      case 'array':
        return Array.isArray(value);
      default:
        return true;
    }
  }

  /**
   * 添加数据变更监听器
   * @param listener 监听器函数
   * @returns 取消监听的函数
   */
  public addChangeListener(listener: (event: DataChangeEvent) => void): () => void {
    this.listeners.push(listener);
    
    // 返回取消监听的函数
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * 通知所有监听器
   * @param event 数据变更事件
   */
  private notifyListeners(event: DataChangeEvent): void {
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in data change listener:', error);
      }
    });
  }

  /**
   * 注册数据转换器
   * @param name 转换器名称
   * @param transformer 转换器对象
   */
  public registerTransformer(name: string, transformer: DataTransformer): void {
    this.transformers.set(name, transformer);
  }

  /**
   * 应用数据转换
   * @param transformerName 转换器名称
   * @param value 要转换的值
   * @param options 转换选项
   * @returns 转换后的值
   */
  public transform(transformerName: string, value: any, options?: Record<string, any>): any {
    const transformer = this.transformers.get(transformerName);
    if (!transformer) {
      console.warn(`Transformer ${transformerName} not found`);
      return value;
    }
    
    return transformer.transform(value, options);
  }

  /**
   * 应用反向数据转换
   * @param transformerName 转换器名称
   * @param value 要反向转换的值
   * @param options 转换选项
   * @returns 反向转换后的值
   */
  public reverseTransform(transformerName: string, value: any, options?: Record<string, any>): any {
    const transformer = this.transformers.get(transformerName);
    if (!transformer || !transformer.reverseTransform) {
      console.warn(`Reverse transformer ${transformerName} not found or not implemented`);
      return value;
    }
    
    return transformer.reverseTransform(value, options);
  }

  /**
   * 获取数据模型
   * @returns 数据模型
   */
  public getModel(): DataModel {
    return { ...this.model };
  }

  /**
   * 检查数据是否已变更
   * @returns 是否已变更
   */
  public isChanged(): boolean {
    return JSON.stringify(this.currentData) !== JSON.stringify(this.initialData);
  }

  /**
   * 销毁管理器，清理资源
   */
  public destroy(): void {
    this.listeners = [];
    this.transformers.clear();
  }
}

// 默认导出
const defaultExport = DataDrivenManager;
export default defaultExport;
