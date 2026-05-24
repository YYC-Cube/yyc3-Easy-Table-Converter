// 提示词策略基类
import { ChatMessage } from '../../adapters/base';

// 提示词策略配置接口
export interface PromptStrategyConfig {
  // 策略名称
  name: string;
  // 策略描述
  description: string;
  // 是否启用
  enabled: boolean;
  // 优先级（1-10，10最高）
  priority: number;
  // 适用的任务类型
  taskTypes: string[];
  // 适用的行业
  industries: string[];
  // 配置参数
  params: Record<string, any>;
}

// 提示词生成上下文接口
export interface PromptContext {
  // 任务类型
  taskType: string;
  // 行业
  industry?: string;
  // 用户输入
  userInput: string;
  // 历史对话
  history?: ChatMessage[];
  // 相关上下文信息
  contextInfo?: Record<string, any>;
  // 可用工具信息
  tools?: Array<{
    name: string;
    description: string;
    parameters: Record<string, any>;
  }>;
  // 格式要求
  format?: string;
}

/**
 * 提示词策略基类
 * 所有提示词策略都需要继承此类
 */
export abstract class BasePromptStrategy {
  // 策略配置
  protected config: PromptStrategyConfig;

  /**
   * 构造函数
   * @param config 策略配置
   */
  constructor(config: PromptStrategyConfig) {
    this.config = config;
  }

  /**
   * 获取策略名称
   * @returns 策略名称
   */
  get name(): string {
    return this.config.name;
  }

  /**
   * 获取策略描述
   * @returns 策略描述
   */
  get description(): string {
    return this.config.description;
  }

  /**
   * 检查策略是否启用
   * @returns 是否启用
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * 获取优先级
   * @returns 优先级值
   */
  getPriority(): number {
    return this.config.priority;
  }

  /**
   * 检查是否适用于指定任务类型
   * @param taskType 任务类型
   * @returns 是否适用
   */
  isApplicableToTask(taskType: string): boolean {
    return this.config.taskTypes.includes('*') || this.config.taskTypes.includes(taskType);
  }

  /**
   * 检查是否适用于指定行业
   * @param industry 行业
   * @returns 是否适用
   */
  isApplicableToIndustry(industry?: string): boolean {
    if (!industry) return true;
    return this.config.industries.includes('*') || this.config.industries.includes(industry);
  }

  /**
   * 生成提示词消息
   * @param context 提示词上下文
   * @returns 生成的消息数组
   */
  abstract generateMessages(context: PromptContext): ChatMessage[];

  /**
   * 更新策略配置
   * @param newConfig 新配置
   */
  updateConfig(newConfig: Partial<PromptStrategyConfig>): void {
    this.config = {
      ...this.config,
      ...newConfig,
      params: {
        ...this.config.params,
        ...(newConfig.params || {}),
      },
    };
  }

  /**
   * 启用或禁用策略
   * @param enabled 是否启用
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
  }

  /**
   * 获取配置参数
   * @param key 参数键名
   * @param defaultValue 默认值
   * @returns 参数值
   */
  getParam<T>(key: string, defaultValue: T): T {
    return (this.config.params[key] as T) ?? defaultValue;
  }

  /**
   * 设置配置参数
   * @param key 参数键名
   * @param value 参数值
   */
  setParam(key: string, value: any): void {
    this.config.params[key] = value;
  }

  /**
   * 格式化系统提示词
   * @param template 模板字符串
   * @param variables 变量对象
   * @returns 格式化后的字符串
   */
  protected formatTemplate(template: string, variables: Record<string, string>): string {
    let formatted = template;
    for (const [key, value] of Object.entries(variables)) {
      formatted = formatted.replace(new RegExp(`\{\{${key}\}\}`, 'g'), value);
    }
    return formatted;
  }

  /**
   * 创建系统消息
   * @param content 消息内容
   * @returns 聊天消息对象
   */
  protected createSystemMessage(content: string): ChatMessage {
    return {
      role: 'system',
      content,
    };
  }

  /**
   * 创建用户消息
   * @param content 消息内容
   * @returns 聊天消息对象
   */
  protected createUserMessage(content: string): ChatMessage {
    return {
      role: 'user',
      content,
    };
  }

  /**
   * 创建助手消息
   * @param content 消息内容
   * @returns 聊天消息对象
   */
  protected createAssistantMessage(content: string): ChatMessage {
    return {
      role: 'assistant',
      content,
    };
  }

  /**
   * 组合多个消息数组
   * @param messages 消息数组列表
   * @returns 合并后的消息数组
   */
  protected combineMessages(...messages: ChatMessage[][]): ChatMessage[] {
    return messages.flat();
  }

  /**
   * 从上下文中提取相关信息
   * @param context 提示词上下文
   * @param keys 要提取的键名列表
   * @returns 提取的信息对象
   */
  protected extractContextInfo(context: PromptContext, keys: string[]): Record<string, any> {
    const result: Record<string, any> = {};
    if (!context.contextInfo) return result;
    
    for (const key of keys) {
      if (key in context.contextInfo) {
        result[key] = context.contextInfo[key];
      }
    }
    return result;
  }

  /**
   * 生成格式指令
   * @param format 格式要求
   * @returns 格式指令字符串
   */
  protected generateFormatInstructions(format?: string): string {
    if (!format) return '';
    
    switch (format.toLowerCase()) {
      case 'json':
        return '请以严格的JSON格式返回结果，不要包含任何额外的文本或解释。';
      case 'markdown':
        return '请使用Markdown格式返回结果，包括适当的标题、列表和格式化。';
      case 'html':
        return '请使用HTML格式返回结果，确保HTML标记正确闭合。';
      default:
        return `请按照以下格式返回结果：${format}`;
    }
  }

  /**
   * 获取策略元数据
   * @returns 策略元数据
   */
  getMetadata(): Record<string, any> {
    return {
      name: this.config.name,
      description: this.config.description,
      taskTypes: this.config.taskTypes,
      industries: this.config.industries,
      enabled: this.config.enabled,
      priority: this.config.priority,
    };
  }
}
