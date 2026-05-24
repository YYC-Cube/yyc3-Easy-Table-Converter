// 提示词策略管理器
import { BasePromptStrategy, PromptStrategyConfig, PromptContext, ChatMessage } from './base';
import { createEnterpriseCreditStrategy } from './enterpriseCredit';
import { AIProviderType } from '../../adapters/factory';

// 提示词策略管理器类
export class PromptStrategyManager {
  // 单例实例
  private static instance: PromptStrategyManager;
  
  // 策略集合
  private strategies: Map<string, BasePromptStrategy> = new Map();
  
  // 默认策略
  private defaultStrategy?: BasePromptStrategy;

  /**
   * 私有构造函数（单例模式）
   */
  private constructor() {
    this.initializeDefaultStrategies();
  }

  /**
   * 获取策略管理器实例
   * @returns 策略管理器实例
   */
  public static getInstance(): PromptStrategyManager {
    if (!PromptStrategyManager.instance) {
      PromptStrategyManager.instance = new PromptStrategyManager();
    }
    return PromptStrategyManager.instance;
  }

  /**
   * 初始化默认策略
   */
  private initializeDefaultStrategies(): void {
    try {
      // 创建并注册默认策略
      this.registerStrategy(createEnterpriseCreditStrategy());
      
      // 设置默认策略（如需要）
      // this.setDefaultStrategy('defaultStrategy');
      
      console.log(`Initialized ${this.strategies.size} prompt strategies`);
    } catch (error) {
      console.error('Error initializing default strategies:', error);
    }
  }

  /**
   * 注册新策略
   * @param strategy 提示词策略实例
   * @returns 是否注册成功
   */
  public registerStrategy(strategy: BasePromptStrategy): boolean {
    try {
      const name = strategy.name;
      this.strategies.set(name, strategy);
      console.log(`Registered prompt strategy: ${name}`);
      return true;
    } catch (error) {
      console.error('Failed to register strategy:', error);
      return false;
    }
  }

  /**
   * 注销策略
   * @param name 策略名称
   * @returns 是否注销成功
   */
  public unregisterStrategy(name: string): boolean {
    if (this.strategies.has(name)) {
      this.strategies.delete(name);
      console.log(`Unregistered prompt strategy: ${name}`);
      return true;
    }
    return false;
  }

  /**
   * 设置默认策略
   * @param name 策略名称
   * @returns 是否设置成功
   */
  public setDefaultStrategy(name: string): boolean {
    if (this.strategies.has(name)) {
      this.defaultStrategy = this.strategies.get(name);
      console.log(`Set default prompt strategy: ${name}`);
      return true;
    }
    return false;
  }

  /**
   * 获取指定策略
   * @param name 策略名称
   * @returns 策略实例或undefined
   */
  public getStrategy(name: string): BasePromptStrategy | undefined {
    return this.strategies.get(name);
  }

  /**
   * 获取所有策略
   * @param includeDisabled 是否包含禁用的策略
   * @returns 策略实例数组
   */
  public getAllStrategies(includeDisabled = false): BasePromptStrategy[] {
    const strategies = Array.from(this.strategies.values());
    return includeDisabled 
      ? strategies 
      : strategies.filter(s => s.isEnabled());
  }

  /**
   * 根据上下文选择最佳策略
   * @param context 提示词上下文
   * @returns 最佳策略实例或默认策略
   */
  public selectBestStrategy(context: PromptContext): BasePromptStrategy | undefined {
    // 获取所有启用的策略
    const enabledStrategies = this.getAllStrategies(false);
    
    // 按适用性和优先级排序
    const applicableStrategies = enabledStrategies
      .filter(strategy => 
        strategy.isApplicableToTask(context.taskType) && 
        strategy.isApplicableToIndustry(context.industry)
      )
      .sort((a, b) => b.getPriority() - a.getPriority());
    
    // 返回优先级最高的适用策略或默认策略
    return applicableStrategies[0] || this.defaultStrategy;
  }

  /**
   * 生成提示词消息
   * @param context 提示词上下文
   * @param strategyName 可选的策略名称
   * @returns 生成的消息数组
   */
  public generateMessages(
    context: PromptContext,
    strategyName?: string
  ): ChatMessage[] {
    let strategy: BasePromptStrategy | undefined;
    
    // 如果指定了策略名称，使用该策略
    if (strategyName) {
      strategy = this.getStrategy(strategyName);
      if (!strategy || !strategy.isEnabled()) {
        throw new Error(`Strategy '${strategyName}' not found or disabled`);
      }
    } else {
      // 否则选择最佳策略
      strategy = this.selectBestStrategy(context);
      if (!strategy) {
        throw new Error('No suitable prompt strategy found');
      }
    }
    
    // 生成消息
    const messages = strategy.generateMessages(context);
    
    console.log(`Using prompt strategy: ${strategy.name} for task: ${context.taskType}`);
    
    return messages;
  }

  /**
   * 启用或禁用策略
   * @param name 策略名称
   * @param enabled 是否启用
   * @returns 是否操作成功
   */
  public setStrategyEnabled(name: string, enabled: boolean): boolean {
    const strategy = this.getStrategy(name);
    if (strategy) {
      strategy.setEnabled(enabled);
      console.log(`${enabled ? 'Enabled' : 'Disabled'} prompt strategy: ${name}`);
      return true;
    }
    return false;
  }

  /**
   * 更新策略配置
   * @param name 策略名称
   * @param config 新配置
   * @returns 是否更新成功
   */
  public updateStrategyConfig(
    name: string,
    config: Partial<PromptStrategyConfig>
  ): boolean {
    const strategy = this.getStrategy(name);
    if (strategy) {
      strategy.updateConfig(config);
      console.log(`Updated prompt strategy config: ${name}`);
      return true;
    }
    return false;
  }

  /**
   * 获取策略元数据
   * @returns 所有策略的元数据
   */
  public getStrategiesMetadata(): Record<string, any>[] {
    return Array.from(this.strategies.values())
      .map(strategy => strategy.getMetadata());
  }

  /**
   * 获取支持的任务类型
   * @returns 支持的任务类型集合
   */
  public getSupportedTaskTypes(): Set<string> {
    const taskTypes = new Set<string>();
    
    for (const strategy of this.strategies.values()) {
      const metadata = strategy.getMetadata();
      if (metadata.taskTypes && Array.isArray(metadata.taskTypes)) {
        metadata.taskTypes.forEach(taskType => taskTypes.add(taskType));
      }
    }
    
    return taskTypes;
  }

  /**
   * 获取支持的行业
   * @returns 支持的行业集合
   */
  public getSupportedIndustries(): Set<string> {
    const industries = new Set<string>();
    
    for (const strategy of this.strategies.values()) {
      const metadata = strategy.getMetadata();
      if (metadata.industries && Array.isArray(metadata.industries)) {
        metadata.industries.forEach(industry => industries.add(industry));
      }
    }
    
    return industries;
  }

  /**
   * 根据提供商优化提示词
   * @param messages 提示词消息
   * @param provider 提供商类型
   * @returns 优化后的消息
   */
  public optimizeMessagesForProvider(
    messages: ChatMessage[],
    provider: AIProviderType
  ): ChatMessage[] {
    // 根据不同的AI提供商优化提示词
    switch (provider) {
      case AIProviderType.OPENAI:
        return this.optimizeForOpenAI(messages);
      
      case AIProviderType.AZURE_OPENAI:
        return this.optimizeForAzureOpenAI(messages);
      
      case AIProviderType.CLAUDE:
        return this.optimizeForClaude(messages);
      
      case AIProviderType.GEMINI:
        return this.optimizeForGemini(messages);
      
      case AIProviderType.LOCAL:
        return this.optimizeForLocalModels(messages);
      
      default:
        return messages;
    }
  }

  /**
   * 为OpenAI优化提示词
   */
  private optimizeForOpenAI(messages: ChatMessage[]): ChatMessage[] {
    return messages.map(msg => {
      // OpenAI模型偏好简洁但结构化的提示词
      let content = msg.content;
      
      // 移除过多的空行
      content = content.replace(/\n{3,}/g, '\n\n');
      
      return {
        ...msg,
        content,
      };
    });
  }

  /**
   * 为Azure OpenAI优化提示词
   */
  private optimizeForAzureOpenAI(messages: ChatMessage[]): ChatMessage[] {
    // Azure OpenAI与OpenAI基本相同，但可能需要额外的格式调整
    return this.optimizeForOpenAI(messages);
  }

  /**
   * 为Claude优化提示词
   */
  private optimizeForClaude(messages: ChatMessage[]): ChatMessage[] {
    return messages.map(msg => {
      // Claude喜欢更多的上下文和详细的指令
      let content = msg.content;
      
      // 在提示词开头添加额外的上下文
      if (msg.role === 'system') {
        content = `你是一个专业的AI助手，擅长遵循详细的指令并生成高质量的回答。\n\n${content}`;
      }
      
      return {
        ...msg,
        content,
      };
    });
  }

  /**
   * 为Gemini优化提示词
   */
  private optimizeForGemini(messages: ChatMessage[]): ChatMessage[] {
    return messages.map(msg => {
      // Gemini偏好结构化程度高的提示词
      let content = msg.content;
      
      // 确保有明确的任务定义
      if (msg.role === 'system' && !content.includes('任务定义')) {
        content += '\n\n请严格按照上述任务定义执行，不要添加任何额外信息。';
      }
      
      return {
        ...msg,
        content,
      };
    });
  }

  /**
   * 为本地模型优化提示词
   */
  private optimizeForLocalModels(messages: ChatMessage[]): ChatMessage[] {
    return messages.map(msg => {
      // 本地模型通常上下文窗口较小，需要更简洁的提示词
      let content = msg.content;
      
      // 移除冗余内容
      content = content
        .replace(/\n{3,}/g, '\n\n')
        .replace(/\s{2,}/g, ' ');
      
      // 简化结构，使其更适合本地模型
      if (msg.role === 'system') {
        content = `任务：${content.split('\n').filter(line => line.trim()).join('. ')}`;
      }
      
      return {
        ...msg,
        content,
      };
    });
  }

  /**
   * 清除所有策略
   */
  public clearStrategies(): void {
    this.strategies.clear();
    this.defaultStrategy = undefined;
    console.log('All prompt strategies cleared');
  }

  /**
   * 获取策略数量
   */
  public getStrategyCount(): number {
    return this.strategies.size;
  }

  /**
   * 导入自定义策略
   * @param strategyClass 策略类
   * @param config 策略配置
   * @returns 是否导入成功
   */
  public importCustomStrategy(
    strategyClass: new (config: PromptStrategyConfig) => BasePromptStrategy,
    config: PromptStrategyConfig
  ): boolean {
    try {
      const strategy = new strategyClass(config);
      return this.registerStrategy(strategy);
    } catch (error) {
      console.error('Failed to import custom strategy:', error);
      return false;
    }
  }
}

/**
 * 获取策略管理器实例
 * 便捷函数，简化调用
 */
export function getPromptStrategyManager(): PromptStrategyManager {
  return PromptStrategyManager.getInstance();
}
