/**
 * @file 插件基类
 * @description 定义行业工具插件系统的核心接口和基类
 * @module industries/plugins/PluginBase
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-20
 * @updated 2024-11-20
 */

import { IndustryType, Tool, ToolParameter, ToolExecutionResult } from '../types/index';

/**
 * 插件配置接口
 */
export interface PluginConfig {
  /** 插件唯一标识符 */
  id: string;
  /** 插件名称 */
  name: string;
  /** 插件版本 */
  version: string;
  /** 插件描述 */
  description: string;
  /** 作者信息 */
  author: {
    name: string;
    email?: string;
    url?: string;
  };
  /** 支持的行业类型 */
  supportedIndustries: IndustryType[];
  /** 插件依赖 */
  dependencies?: {
    [key: string]: string;
  };
  /** 插件配置项 */
  settings?: Record<string, any>;
  /** 是否为核心插件 */
  isCore?: boolean;
  /** 插件加载优先级 */
  priority?: number;
}

/**
 * 插件上下文接口
 */
export interface PluginContext {
  /** 获取所有行业 */
  getIndustries: () => Array<{ id: IndustryType; name: string }>;
  /** 获取指定行业的工具 */
  getToolsByIndustry: (industryId: IndustryType) => Tool[];
  /** 注册工具 */
  registerTool: (tool: Tool) => boolean;
  /** 获取配置 */
  getConfig: <T = any>(key?: string, defaultValue?: T) => T;
  /** 设置配置 */
  setConfig: (key: string, value: any) => void;
  /** 记录日志 */
  logger: {
    info: (message: string, data?: any) => void;
    warn: (message: string, data?: any) => void;
    error: (message: string, error?: Error, data?: any) => void;
    debug: (message: string, data?: any) => void;
  };
}

/**
 * 插件基类
 * 所有行业工具插件必须继承此类并实现相应方法
 */
export abstract class PluginBase {
  /** 插件配置 */
  public readonly config: PluginConfig;
  /** 插件上下文 */
  protected readonly context: PluginContext;
  /** 插件是否已初始化 */
  protected isInitialized: boolean = false;
  /** 插件是否已启用 */
  protected isEnabled: boolean = false;

  /**
   * 构造函数
   * @param config 插件配置
   * @param context 插件上下文
   */
  constructor(config: PluginConfig, context: PluginContext) {
    this.config = config;
    this.context = context;
  }

  /**
   * 获取插件ID
   */
  get id(): string {
    return this.config.id;
  }

  /**
   * 获取插件名称
   */
  get name(): string {
    return this.config.name;
  }

  /**
   * 获取插件版本
   */
  get version(): string {
    return this.config.version;
  }

  /**
   * 获取插件状态
   */
  get status(): { initialized: boolean; enabled: boolean } {
    return {
      initialized: this.isInitialized,
      enabled: this.isEnabled
    };
  }

  /**
   * 插件初始化
   * 在插件加载时调用
   */
  async initialize(): Promise<boolean> {
    try {
      this.context.logger.info(`正在初始化插件: ${this.name} (v${this.version})`);
      const result = await this.onInitialize();
      this.isInitialized = true;
      this.context.logger.info(`插件初始化成功: ${this.name}`);
      return result;
    } catch (error) {
      this.context.logger.error(`插件初始化失败: ${this.name}`, error as Error);
      return false;
    }
  }

  /**
   * 插件启用
   */
  async enable(): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }
      
      this.context.logger.info(`正在启用插件: ${this.name}`);
      const result = await this.onEnable();
      this.isEnabled = result;
      
      if (result) {
        this.context.logger.info(`插件已启用: ${this.name}`);
      } else {
        this.context.logger.warn(`插件启用失败: ${this.name}`);
      }
      
      return result;
    } catch (error) {
      this.context.logger.error(`插件启用错误: ${this.name}`, error as Error);
      return false;
    }
  }

  /**
   * 插件禁用
   */
  async disable(): Promise<boolean> {
    try {
      this.context.logger.info(`正在禁用插件: ${this.name}`);
      const result = await this.onDisable();
      
      if (result) {
        this.isEnabled = false;
        this.context.logger.info(`插件已禁用: ${this.name}`);
      } else {
        this.context.logger.warn(`插件禁用失败: ${this.name}`);
      }
      
      return result;
    } catch (error) {
      this.context.logger.error(`插件禁用错误: ${this.name}`, error as Error);
      return false;
    }
  }

  /**
   * 插件卸载
   */
  async destroy(): Promise<void> {
    try {
      if (this.isEnabled) {
        await this.disable();
      }
      
      this.context.logger.info(`正在卸载插件: ${this.name}`);
      await this.onDestroy();
      this.isInitialized = false;
      this.context.logger.info(`插件已卸载: ${this.name}`);
    } catch (error) {
      this.context.logger.error(`插件卸载错误: ${this.name}`, error as Error);
    }
  }

  /**
   * 执行工具逻辑
   * @param toolId 工具ID
   * @param parameters 工具参数
   */
  async executeTool(toolId: string, parameters: Record<string, any>): Promise<ToolExecutionResult> {
    if (!this.isEnabled) {
      return {
        success: false,
        error: `插件 ${this.name} 未启用`,
        executionTime: 0,
        timestamp: Date.now(),
        toolId,
        industry: IndustryType.AGRICULTURE // 默认值
      };
    }

    try {
      const startTime = Date.now();
      const result = await this.onExecuteTool(toolId, parameters);
      
      return {
        ...result,
        executionTime: Date.now() - startTime,
        timestamp: Date.now(),
        toolId
      };
    } catch (error) {
      this.context.logger.error(`工具执行错误: ${toolId}`, error as Error, { parameters });
      return {
        success: false,
        error: error instanceof Error ? error.message : '未知错误',
        executionTime: 0,
        timestamp: Date.now(),
        toolId,
        industry: IndustryType.AGRICULTURE // 默认值
      };
    }
  }

  /**
   * 获取插件提供的工具列表
   */
  abstract getTools(): Tool[];

  /**
   * 插件初始化钩子
   * 子类可以重写此方法实现自定义初始化逻辑
   */
  protected abstract onInitialize(): Promise<boolean>;

  /**
   * 插件启用钩子
   * 子类可以重写此方法实现自定义启用逻辑
   */
  protected abstract onEnable(): Promise<boolean>;

  /**
   * 插件禁用钩子
   * 子类可以重写此方法实现自定义禁用逻辑
   */
  protected abstract onDisable(): Promise<boolean>;

  /**
   * 插件卸载钩子
   * 子类可以重写此方法实现自定义卸载逻辑
   */
  protected abstract onDestroy(): Promise<void>;

  /**
   * 工具执行钩子
   * 子类必须实现此方法处理工具执行逻辑
   */
  protected abstract onExecuteTool(toolId: string, parameters: Record<string, any>): Promise<ToolExecutionResult>;

  /**
   * 验证工具参数
   * @param parameters 工具参数
   * @param toolParameters 工具参数定义
   */
  protected validateParameters(parameters: Record<string, any>, toolParameters?: ToolParameter[]): { isValid: boolean; error?: string } {
    if (!toolParameters || toolParameters.length === 0) {
      return { isValid: true };
    }

    for (const param of toolParameters) {
      // 检查必填参数
      if (param.required && !(param.id in parameters)) {
        return {
          isValid: false,
          error: `缺少必填参数: ${param.name}`
        };
      }

      // 如果参数存在，验证值
      if (param.id in parameters) {
        const value = parameters[param.id];
        
        // 类型验证
        if (value !== undefined && value !== null) {
          if (param.type === 'number' && typeof value !== 'number') {
            return {
              isValid: false,
              error: `参数 ${param.name} 必须是数字类型`
            };
          }
          
          if (param.type === 'string' && typeof value !== 'string') {
            return {
              isValid: false,
              error: `参数 ${param.name} 必须是字符串类型`
            };
          }
          
          if (param.type === 'boolean' && typeof value !== 'boolean') {
            return {
              isValid: false,
              error: `参数 ${param.name} 必须是布尔类型`
            };
          }
          
          // 范围验证
          if (param.type === 'number') {
            const numValue = Number(value);
            if (param.minValue !== undefined && numValue < param.minValue) {
              return {
                isValid: false,
                error: `参数 ${param.name} 不能小于 ${param.minValue}`
              };
            }
            if (param.maxValue !== undefined && numValue > param.maxValue) {
              return {
                isValid: false,
                error: `参数 ${param.name} 不能大于 ${param.maxValue}`
              };
            }
          }
          
          // 字符串长度验证
          if (param.type === 'string') {
            const strValue = String(value);
            if (param.minLength !== undefined && strValue.length < param.minLength) {
              return {
                isValid: false,
                error: `参数 ${param.name} 长度不能小于 ${param.minLength}`
              };
            }
            if (param.maxLength !== undefined && strValue.length > param.maxLength) {
              return {
                isValid: false,
                error: `参数 ${param.name} 长度不能大于 ${param.maxLength}`
              };
            }
            
            // 正则表达式验证
            if (param.validation && !new RegExp(param.validation).test(strValue)) {
              return {
                isValid: false,
                error: `参数 ${param.name} 格式不正确`
              };
            }
          }
          
          // 选项验证
          if (param.options && param.options.length > 0) {
            const optionValues = param.options.map(opt => opt.value);
            if (!optionValues.includes(value)) {
              return {
                isValid: false,
                error: `参数 ${param.name} 值不在可选范围内`
              };
            }
          }
        }
      }
    }

    return { isValid: true };
  }
}

/**
 * 插件工厂接口
 */
export interface PluginFactory {
  /**
   * 创建插件实例
   * @param context 插件上下文
   */
  create(context: PluginContext): PluginBase;
}

/**
 * 插件模块导出接口
 */
export interface PluginModule {
  /** 插件工厂 */
  plugin: PluginFactory;
  /** 插件配置 */
  config: PluginConfig;
}

/**
 * 导出类型和接口已通过上面的export interface和export class声明完成
 */
