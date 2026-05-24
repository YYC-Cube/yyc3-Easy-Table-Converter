/**
 * @file 数据驱动核心类型定义
 * @description 定义前端驱动组件的数据驱动机制所需的接口和类型
 * @module industries/frontend-driver/types/DataDrivenTypes
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-26
 */

/**
 * 数据字段定义接口
 */
export interface DataField {
  /** 字段名称 */
  name: string;
  /** 字段类型 */
  type: 'string' | 'number' | 'boolean' | 'date' | 'object' | 'array';
  /** 字段标签 */
  label: string;
  /** 是否必填 */
  required?: boolean;
  /** 默认值 */
  defaultValue?: any;
  /** 验证规则 */
  validations?: ValidationRule[];
  /** 额外配置 */
  meta?: Record<string, any>;
}

/**
 * 验证规则接口
 */
export interface ValidationRule {
  /** 规则类型 */
  type: 'required' | 'min' | 'max' | 'pattern' | 'custom';
  /** 规则值 */
  value?: any;
  /** 错误消息 */
  message: string;
  /** 自定义验证函数 */
  validator?: (value: any) => boolean;
}

/**
 * 数据模型接口
 */
export interface DataModel {
  /** 模型名称 */
  name: string;
  /** 字段定义 */
  fields: DataField[];
  /** 主键字段 */
  primaryKey?: string;
  /** 模型描述 */
  description?: string;
}

/**
 * 数据绑定配置接口
 */
export interface DataBindingConfig {
  /** 绑定的数据字段 */
  field: string;
  /** 绑定模式 */
  mode?: 'oneWay' | 'twoWay';
  /** 格式化函数 */
  formatter?: (value: any) => any;
  /** 解析函数 */
  parser?: (value: any) => any;
  /** 变更回调 */
  onChange?: (value: any, oldValue: any) => void;
}

/**
 * 数据变更事件接口
 */
export interface DataChangeEvent {
  /** 变更的字段名 */
  field: string;
  /** 新值 */
  value: any;
  /** 旧值 */
  oldValue: any;
  /** 变更时间戳 */
  timestamp: number;
}

/**
 * 数据验证结果接口
 */
export interface ValidationResult {
  /** 是否验证通过 */
  isValid: boolean;
  /** 错误信息列表 */
  errors: ValidationError[];
}

/**
 * 验证错误接口
 */
export interface ValidationError {
  /** 错误的字段 */
  field: string;
  /** 错误消息 */
  message: string;
}

/**
 * 数据驱动组件属性接口
 */
export interface DataDrivenComponentProps<T = any> {
  /** 数据模型 */
  model: DataModel;
  /** 数据源 */
  data: T;
  /** 数据变更处理函数 */
  onDataChange?: (data: T, event: DataChangeEvent) => void;
  /** 验证状态处理函数 */
  onValidationChange?: (result: ValidationResult) => void;
  /** 是否禁用 */
  disabled?: boolean;
  /** 额外配置 */
  config?: Record<string, any>;
}

/**
 * 数据驱动上下文接口
 */
export interface DataDrivenContextType<T = any> {
  /** 当前数据 */
  data: T;
  /** 更新数据 */
  updateData: (field: string, value: any) => void;
  /** 批量更新数据 */
  batchUpdateData: (changes: Partial<T>) => void;
  /** 重置数据 */
  resetData: () => void;
  /** 验证数据 */
  validateData: () => ValidationResult;
  /** 验证指定字段 */
  validateField: (field: string) => ValidationError[];
  /** 获取字段配置 */
  getFieldConfig: (field: string) => DataField | undefined;
  /** 是否已初始化 */
  isInitialized: boolean;
}

/**
 * 数据转换接口
 */
export interface DataTransformer {
  /** 转换名称 */
  name: string;
  /** 转换函数 */
  transform: (data: any, options?: Record<string, any>) => any;
  /** 反向转换函数 */
  reverseTransform?: (data: any, options?: Record<string, any>) => any;
}

/**
 * 数据驱动配置接口
 */
export interface DataDrivenConfig {
  /** 是否启用自动验证 */
  autoValidate?: boolean;
  /** 是否启用双向绑定 */
  enableTwoWayBinding?: boolean;
  /** 数据转换配置 */
  transformers?: Record<string, DataTransformer>;
  /** 默认的验证规则 */
  defaultValidations?: ValidationRule[];
}
