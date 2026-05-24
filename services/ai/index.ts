// AI服务主入口
import { AIAdapterFactory, AIProviderType, AdapterConfig } from './adapters/factory';
import { BaseAIAdapter, ChatRequest, ChatResponse, EmbeddingRequest, EmbeddingResponse, StreamCallback } from './adapters/base';
import { modelConfigManager, ModelConfig } from './models/config';
import { PromptStrategyManager, PromptContext } from './prompts/strategies/manager';

// 统一的AI服务配置接口
export interface AIServiceConfig {
  // 默认模型
  defaultModel: string;
  // API密钥配置
  apiKeys: Record<AIProviderType, string>;
  // 是否启用缓存
  enableCache: boolean;
  // 缓存TTL（毫秒）
  cacheTTL: number;
  // 日志级别
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

// 默认配置
const DEFAULT_CONFIG: AIServiceConfig = {
  defaultModel: 'gpt-4',
  apiKeys: {
    [AIProviderType.OPENAI]: '',
    [AIProviderType.AZURE_OPENAI]: '',
    [AIProviderType.CLAUDE]: '',
    [AIProviderType.GEMINI]: '',
    [AIProviderType.LOCAL]: '',
  },
  enableCache: true,
  cacheTTL: 3600000, // 1小时
  logLevel: 'info',
};

/**
 * AI服务主类
 * 集成所有AI相关组件，提供统一的服务接口
 */
export class AIService {
  // 单例实例
  private static instance: AIService;
  
  // 服务配置
  private config: AIServiceConfig;
  
  // 适配器工厂
  private adapterFactory: AIAdapterFactory;
  
  // 提示词策略管理器
  private promptManager: PromptStrategyManager;
  
  // 适配器缓存
  private adapterCache: Map<string, BaseAIAdapter> = new Map();

  /**
   * 私有构造函数
   * @param config 服务配置
   */
  private constructor(config: Partial<AIServiceConfig> = {}) {
    // 合并配置
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
      apiKeys: {
        ...DEFAULT_CONFIG.apiKeys,
        ...config.apiKeys,
      },
    };

    // 初始化组件
    this.adapterFactory = AIAdapterFactory.getInstance();
    this.promptManager = PromptStrategyManager.getInstance();

    // 初始化API密钥
    this.initializeApiKeys();

    console.log('AI Service initialized with config:', {
      defaultModel: this.config.defaultModel,
      enableCache: this.config.enableCache,
      logLevel: this.config.logLevel,
    });
  }

  /**
   * 获取服务实例
   * @param config 可选的配置
   * @returns AI服务实例
   */
  public static getInstance(config?: Partial<AIServiceConfig>): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService(config);
    }
    return AIService.instance;
  }

  /**
   * 初始化API密钥
   */
  private initializeApiKeys(): void {
    // 从环境变量加载API密钥（如果可用）
    try {
      for (const provider of Object.values(AIProviderType)) {
        const envKey = `AI_API_KEY_${provider.toUpperCase()}`;
        const apiKey = process.env[envKey];
        if (apiKey) {
          this.config.apiKeys[provider] = apiKey;
        }
      }
    } catch (error) {
      console.warn('Failed to load API keys from environment:', error);
    }
  }

  /**
   * 获取指定模型的适配器
   * @param modelName 模型名称
   * @returns AI适配器实例
   */
  private async getAdapterForModel(modelName: string): Promise<BaseAIAdapter> {
    // 检查缓存
    if (this.config.enableCache && this.adapterCache.has(modelName)) {
      return this.adapterCache.get(modelName)!;
    }

    // 获取模型配置
    const modelConfig = modelConfigManager.getModelByName(modelName);
    if (!modelConfig) {
      throw new Error(`Model '${modelName}' not found`);
    }

    if (!modelConfig.enabled) {
      throw new Error(`Model '${modelName}' is disabled`);
    }

    // 获取API密钥
    const apiKey = this.config.apiKeys[modelConfig.provider];
    if (!apiKey) {
      throw new Error(`API key for ${modelConfig.provider} not configured`);
    }

    // 创建适配器配置
    const adapterConfig: AdapterConfig = {
      provider: modelConfig.provider,
      modelName: modelConfig.name,
      apiKey,
      baseUrl: modelConfig.baseUrl,
      timeout: 30000,
      maxRetries: 3,
    };

    // 获取或创建适配器
    const adapter = await this.adapterFactory.getAdapter(adapterConfig);

    // 缓存适配器
    if (this.config.enableCache) {
      this.adapterCache.set(modelName, adapter);
    }

    return adapter;
  }

  /**
   * 发送聊天请求
   * @param request 聊天请求
   * @returns 聊天响应
   */
  public async chat(request: ChatRequest): Promise<ChatResponse> {
    try {
      // 确定使用的模型
      const modelName = request.model || this.config.defaultModel;
      
      // 获取适配器
      const adapter = await this.getAdapterForModel(modelName);
      
      // 发送请求
      const response = await adapter.chat(request);
      
      // 记录日志
      if (this.config.logLevel === 'debug') {
        console.log('Chat response:', {
          model: modelName,
          responseId: response.id,
          usage: response.usage,
        });
      }
      
      return response;
    } catch (error) {
      this.logError('Chat request failed:', error);
      throw error;
    }
  }

  /**
   * 发送流式聊天请求
   * @param request 聊天请求
   * @param callback 回调函数
   * @returns 取消函数
   */
  public async streamChat(request: ChatRequest, callback: StreamCallback): Promise<() => void> {
    try {
      // 确定使用的模型
      const modelName = request.model || this.config.defaultModel;
      
      // 获取模型配置，检查是否支持流式
      const modelConfig = modelConfigManager.getModelByName(modelName);
      if (!modelConfig?.supportsStreaming) {
        throw new Error(`Model '${modelName}' does not support streaming`);
      }
      
      // 获取适配器
      const adapter = await this.getAdapterForModel(modelName);
      
      // 发送流式请求
      const cancelFn = adapter.streamChat(request, callback);
      
      return cancelFn;
    } catch (error) {
      this.logError('Stream chat request failed:', error);
      callback.onError(error as Error);
      return () => {};
    }
  }

  /**
   * 生成文本嵌入
   * @param request 嵌入请求
   * @returns 嵌入响应
   */
  public async embed(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    try {
      // 确定使用的模型（嵌入模型可能与聊天模型不同）
      const modelName = request.model || 'text-embedding-ada-002';
      
      // 获取模型配置，检查是否支持嵌入
      const modelConfig = modelConfigManager.getModelByName(modelName);
      if (!modelConfig?.supportsEmbeddings) {
        throw new Error(`Model '${modelName}' does not support embeddings`);
      }
      
      // 获取适配器
      const adapter = await this.getAdapterForModel(modelName);
      
      // 发送请求
      const response = await adapter.embed(request);
      
      return response;
    } catch (error) {
      this.logError('Embedding request failed:', error);
      throw error;
    }
  }

  /**
   * 生成带策略的聊天请求
   * @param context 提示词上下文
   * @param strategyName 可选的策略名称
   * @param model 可选的模型名称
   * @returns 聊天响应
   */
  public async generateWithStrategy(
    context: PromptContext,
    strategyName?: string,
    model?: string
  ): Promise<ChatResponse> {
    try {
      // 生成提示词消息
      const messages = this.promptManager.generateMessages(context, strategyName);
      
      // 创建聊天请求
      const chatRequest: ChatRequest = {
        messages,
        model: model || this.config.defaultModel,
        temperature: context.contextInfo?.temperature || 0.7,
        maxTokens: context.contextInfo?.maxTokens || 1000,
      };
      
      // 发送请求
      return await this.chat(chatRequest);
    } catch (error) {
      this.logError('Strategy generation failed:', error);
      throw error;
    }
  }

  /**
   * 获取支持的模型列表
   * @param includeDisabled 是否包含禁用的模型
   * @returns 模型配置数组
   */
  public getSupportedModels(includeDisabled = false): ModelConfig[] {
    return modelConfigManager.getAllModels(includeDisabled);
  }

  /**
   * 设置API密钥
   * @param provider 提供商类型
   * @param apiKey API密钥
   */
  public setApiKey(provider: AIProviderType, apiKey: string): void {
    this.config.apiKeys[provider] = apiKey;
    
    // 清除相关缓存
    this.clearAdapterCache(provider);
  }

  /**
   * 更新服务配置
   * @param newConfig 新配置
   */
  public updateConfig(newConfig: Partial<AIServiceConfig>): void {
    this.config = {
      ...this.config,
      ...newConfig,
      apiKeys: {
        ...this.config.apiKeys,
        ...(newConfig.apiKeys || {}),
      },
    };
    
    // 清除缓存
    if (newConfig.defaultModel && newConfig.defaultModel !== this.config.defaultModel) {
      this.clearAdapterCache();
    }
  }

  /**
   * 清除适配器缓存
   * @param provider 可选的提供商过滤
   */
  public async clearAdapterCache(provider?: AIProviderType): Promise<void> {
    await this.adapterFactory.clearCache(provider);
    
    if (provider) {
      // 只清除特定提供商的缓存
      for (const [key, adapter] of this.adapterCache.entries()) {
        // 这里可以通过适配器元数据过滤，简化版本直接清除所有
        this.adapterCache.delete(key);
      }
    } else {
      // 清除所有缓存
      this.adapterCache.clear();
    }
  }

  /**
   * 健康检查
   * @returns 是否健康
   */
  public async healthCheck(): Promise<boolean> {
    try {
      // 测试默认模型是否可用
      const adapter = await this.getAdapterForModel(this.config.defaultModel);
      return true;
    } catch (error) {
      this.logError('Health check failed:', error);
      return false;
    }
  }

  /**
   * 日志记录
   */
  private logError(message: string, error: any): void {
    if (this.config.logLevel === 'error' || this.config.logLevel === 'debug') {
      console.error(message, error);
    }
  }

  /**
   * 获取服务状态信息
   * @returns 状态信息
   */
  public getStatus(): Record<string, any> {
    return {
      initialized: true,
      defaultModel: this.config.defaultModel,
      supportedModels: this.getSupportedModels().length,
      cacheSize: this.adapterCache.size,
      enableCache: this.config.enableCache,
    };
  }

  /**
   * 关闭服务，清理资源
   */
  public async shutdown(): Promise<void> {
    try {
      // 清除所有适配器缓存
      await this.clearAdapterCache();
      
      // 清除工厂缓存
      await this.adapterFactory.clearCache();
      
      console.log('AI Service shutdown completed');
    } catch (error) {
      console.error('Error during service shutdown:', error);
    }
  }
}

// 导出便捷函数
export const getAIService = (config?: Partial<AIServiceConfig>): AIService => {
  return AIService.getInstance(config);
};

// 导出核心类型
export { AIProviderType };
export type { 
  ChatRequest,
  ChatResponse,
  EmbeddingRequest,
  EmbeddingResponse,
  StreamCallback,
  PromptContext,
  AIServiceConfig,
  ModelConfig
};

// 导出服务类
export { AIService };
// 默认导出
export default AIService;
