// AI适配器工厂
import { BaseAIAdapter, AIModelConfig } from './base';
import { OpenAIAdapter } from './openai';

// 支持的AI服务提供商类型
export enum AIProviderType {
  OPENAI = 'openai',
  AZURE_OPENAI = 'azure_openai',
  CLAUDE = 'claude',
  GEMINI = 'gemini',
  LOCAL = 'local',
}

// 适配器配置接口
export interface AdapterConfig extends AIModelConfig {
  provider: AIProviderType;
}

/**
 * AI适配器工厂类
 * 负责根据配置创建相应的AI适配器实例
 */
export class AIAdapterFactory {
  /**
   * 工厂单例实例
   */
  private static instance: AIAdapterFactory;

  /**
   * 已创建的适配器缓存
   */
  private adapterCache: Map<string, BaseAIAdapter> = new Map();

  /**
   * 私有构造函数（单例模式）
   */
  private constructor() {}

  /**
   * 获取工厂实例
   * @returns AIAdapterFactory实例
   */
  public static getInstance(): AIAdapterFactory {
    if (!AIAdapterFactory.instance) {
      AIAdapterFactory.instance = new AIAdapterFactory();
    }
    return AIAdapterFactory.instance;
  }

  /**
   * 创建或获取AI适配器实例
   * @param config 适配器配置
   * @returns AI适配器实例
   */
  public async getAdapter(config: AdapterConfig): Promise<BaseAIAdapter> {
    // 生成缓存键
    const cacheKey = this.generateCacheKey(config);
    
    // 检查缓存中是否已有实例
    if (this.adapterCache.has(cacheKey)) {
      return this.adapterCache.get(cacheKey)!;
    }
    
    // 创建新的适配器实例
    const adapter = this.createAdapter(config);
    
    // 初始化适配器
    await adapter.initialize();
    
    // 缓存适配器实例
    this.adapterCache.set(cacheKey, adapter);
    
    return adapter;
  }

  /**
   * 创建新的适配器实例
   * @param config 适配器配置
   * @returns 新创建的适配器实例
   */
  private createAdapter(config: AdapterConfig): BaseAIAdapter {
    switch (config.provider) {
      case AIProviderType.OPENAI:
        return new OpenAIAdapter(config);
      
      case AIProviderType.AZURE_OPENAI:
        // TODO: 实现Azure OpenAI适配器
        console.warn('Azure OpenAI adapter not implemented yet, falling back to OpenAI');
        return new OpenAIAdapter(config);
      
      case AIProviderType.CLAUDE:
        // TODO: 实现Claude适配器
        throw new Error('Claude adapter not implemented yet');
      
      case AIProviderType.GEMINI:
        // TODO: 实现Gemini适配器
        throw new Error('Gemini adapter not implemented yet');
      
      case AIProviderType.LOCAL:
        // TODO: 实现本地模型适配器
        throw new Error('Local model adapter not implemented yet');
      
      default:
        throw new Error(`Unsupported AI provider: ${config.provider}`);
    }
  }

  /**
   * 生成适配器缓存键
   * @param config 适配器配置
   * @returns 缓存键字符串
   */
  private generateCacheKey(config: AdapterConfig): string {
    // 基于配置的关键属性生成唯一键
    return `${config.provider}:${config.modelName}:${config.baseUrl || 'default'}`;
  }

  /**
   * 清除适配器缓存
   * @param providerType 可选的提供者类型过滤
   */
  public async clearCache(providerType?: AIProviderType): Promise<void> {
    const keysToRemove: string[] = [];
    
    // 查找需要移除的缓存键
    for (const [key, adapter] of this.adapterCache.entries()) {
      if (!providerType || key.startsWith(providerType)) {
        // 清理适配器资源
        try {
          await adapter.cleanup();
        } catch (error) {
          console.error('Error cleaning up adapter:', error);
        }
        keysToRemove.push(key);
      }
    }
    
    // 移除缓存项
    for (const key of keysToRemove) {
      this.adapterCache.delete(key);
    }
  }

  /**
   * 获取当前缓存的适配器数量
   * @returns 适配器数量
   */
  public getCacheSize(): number {
    return this.adapterCache.size;
  }

  /**
   * 获取支持的AI提供商列表
   * @returns 支持的提供商数组
   */
  public getSupportedProviders(): AIProviderType[] {
    return Object.values(AIProviderType);
  }

  /**
   * 检查提供商是否支持
   * @param provider 提供商类型
   * @returns 是否支持
   */
  public isProviderSupported(provider: string): boolean {
    return Object.values(AIProviderType).includes(provider as AIProviderType);
  }

  /**
   * 获取默认配置
   * @param provider 提供商类型
   * @returns 默认配置对象
   */
  public getDefaultConfig(provider: AIProviderType): AdapterConfig {
    const defaultConfigs: Record<AIProviderType, Omit<AdapterConfig, 'apiKey'>> = {
      [AIProviderType.OPENAI]: {
        provider: AIProviderType.OPENAI,
        modelName: 'gpt-4',
        baseUrl: 'https://api.openai.com/v1',
        timeout: 30000,
        maxRetries: 3,
      },
      [AIProviderType.AZURE_OPENAI]: {
        provider: AIProviderType.AZURE_OPENAI,
        modelName: 'gpt-4',
        baseUrl: '', // 需要用户提供
        timeout: 30000,
        maxRetries: 3,
      },
      [AIProviderType.CLAUDE]: {
        provider: AIProviderType.CLAUDE,
        modelName: 'claude-3-opus-20240229',
        baseUrl: 'https://api.anthropic.com/v1',
        timeout: 30000,
        maxRetries: 3,
      },
      [AIProviderType.GEMINI]: {
        provider: AIProviderType.GEMINI,
        modelName: 'gemini-pro',
        baseUrl: 'https://generativelanguage.googleapis.com/v1',
        timeout: 30000,
        maxRetries: 3,
      },
      [AIProviderType.LOCAL]: {
        provider: AIProviderType.LOCAL,
        modelName: 'llama3',
        baseUrl: 'http://localhost:11434',
        timeout: 60000,
        maxRetries: 2,
      },
    };

    return { ...defaultConfigs[provider], apiKey: '' }; // API密钥需要用户提供
  }
}
