// AI模型配置管理
import { AIProviderType } from '../adapters/factory';

// 模型配置接口
export interface ModelConfig {
  // 模型名称
  name: string;
  // AI提供商
  provider: AIProviderType;
  // 基础URL
  baseUrl: string;
  // 模型描述
  description: string;
  // 上下文窗口大小（token）
  contextWindow: number;
  // 最大输出token数
  maxOutputTokens: number;
  // 是否支持流式响应
  supportsStreaming: boolean;
  // 是否支持嵌入功能
  supportsEmbeddings: boolean;
  // 推荐的默认温度值
  defaultTemperature: number;
  // 支持的功能标签
  capabilities: string[];
  // 是否启用
  enabled: boolean;
  // 成本级别（1-5，1最低，5最高）
  costLevel: number;
}

// 预定义的模型配置列表
const PREDEFINED_MODELS: ModelConfig[] = [
  // OpenAI模型
  {
    name: 'gpt-4',
    provider: AIProviderType.OPENAI,
    baseUrl: 'https://api.openai.com/v1',
    description: 'OpenAI的高级GPT-4模型，适合复杂推理和创意任务',
    contextWindow: 128000,
    maxOutputTokens: 4096,
    supportsStreaming: true,
    supportsEmbeddings: false,
    defaultTemperature: 0.7,
    capabilities: ['chat', 'reasoning', 'vision', 'function_calling'],
    enabled: true,
    costLevel: 4,
  },
  {
    name: 'gpt-4-turbo',
    provider: AIProviderType.OPENAI,
    baseUrl: 'https://api.openai.com/v1',
    description: 'OpenAI的GPT-4 Turbo模型，平衡了性能和成本',
    contextWindow: 128000,
    maxOutputTokens: 4096,
    supportsStreaming: true,
    supportsEmbeddings: false,
    defaultTemperature: 0.7,
    capabilities: ['chat', 'reasoning', 'vision', 'function_calling'],
    enabled: true,
    costLevel: 3,
  },
  {
    name: 'gpt-3.5-turbo',
    provider: AIProviderType.OPENAI,
    baseUrl: 'https://api.openai.com/v1',
    description: 'OpenAI的GPT-3.5 Turbo模型，性价比高',
    contextWindow: 16385,
    maxOutputTokens: 4096,
    supportsStreaming: true,
    supportsEmbeddings: false,
    defaultTemperature: 0.7,
    capabilities: ['chat', 'reasoning', 'function_calling'],
    enabled: true,
    costLevel: 2,
  },
  {
    name: 'text-embedding-ada-002',
    provider: AIProviderType.OPENAI,
    baseUrl: 'https://api.openai.com/v1',
    description: 'OpenAI的嵌入模型，用于生成文本向量表示',
    contextWindow: 8191,
    maxOutputTokens: 0, // 嵌入模型不生成输出
    supportsStreaming: false,
    supportsEmbeddings: true,
    defaultTemperature: 0, // 嵌入模型不使用温度
    capabilities: ['embeddings'],
    enabled: true,
    costLevel: 1,
  },
  // Claude模型
  {
    name: 'claude-3-opus-20240229',
    provider: AIProviderType.CLAUDE,
    baseUrl: 'https://api.anthropic.com/v1',
    description: 'Anthropic的顶级Claude 3 Opus模型',
    contextWindow: 200000,
    maxOutputTokens: 4096,
    supportsStreaming: true,
    supportsEmbeddings: false,
    defaultTemperature: 0.7,
    capabilities: ['chat', 'reasoning', 'vision'],
    enabled: false, // 待实现
    costLevel: 5,
  },
  {
    name: 'claude-3-sonnet-20240229',
    provider: AIProviderType.CLAUDE,
    baseUrl: 'https://api.anthropic.com/v1',
    description: 'Anthropic的Claude 3 Sonnet模型，平衡了性能和成本',
    contextWindow: 200000,
    maxOutputTokens: 4096,
    supportsStreaming: true,
    supportsEmbeddings: false,
    defaultTemperature: 0.7,
    capabilities: ['chat', 'reasoning', 'vision'],
    enabled: false, // 待实现
    costLevel: 3,
  },
  // Gemini模型
  {
    name: 'gemini-pro',
    provider: AIProviderType.GEMINI,
    baseUrl: 'https://generativelanguage.googleapis.com/v1',
    description: 'Google的Gemini Pro模型',
    contextWindow: 32768,
    maxOutputTokens: 2048,
    supportsStreaming: true,
    supportsEmbeddings: true,
    defaultTemperature: 0.7,
    capabilities: ['chat', 'reasoning', 'vision'],
    enabled: false, // 待实现
    costLevel: 3,
  },
  // 本地模型
  {
    name: 'llama3:8b',
    provider: AIProviderType.LOCAL,
    baseUrl: 'http://localhost:11434',
    description: 'Meta的Llama 3 8B模型（本地运行）',
    contextWindow: 8192,
    maxOutputTokens: 4096,
    supportsStreaming: true,
    supportsEmbeddings: true,
    defaultTemperature: 0.7,
    capabilities: ['chat', 'reasoning'],
    enabled: false, // 待实现
    costLevel: 1,
  },
  {
    name: 'phi3',
    provider: AIProviderType.LOCAL,
    baseUrl: 'http://localhost:11434',
    description: 'Microsoft的Phi-3小型高效模型（本地运行）',
    contextWindow: 128000,
    maxOutputTokens: 4096,
    supportsStreaming: true,
    supportsEmbeddings: true,
    defaultTemperature: 0.7,
    capabilities: ['chat', 'reasoning'],
    enabled: false, // 待实现
    costLevel: 1,
  },
];

// 模型配置管理器类
export class ModelConfigManager {
  private static instance: ModelConfigManager;
  private customModels: ModelConfig[] = [];
  private models: ModelConfig[] = [...PREDEFINED_MODELS];

  private constructor() {
    // 从环境或配置加载自定义模型配置
    this.loadCustomModels();
  }

  public static getInstance(): ModelConfigManager {
    if (!ModelConfigManager.instance) {
      ModelConfigManager.instance = new ModelConfigManager();
    }
    return ModelConfigManager.instance;
  }

  /**
   * 获取所有可用模型配置
   * @param includeDisabled 是否包含禁用的模型
   * @returns 模型配置数组
   */
  public getAllModels(includeDisabled = false): ModelConfig[] {
    return this.models.filter(model => includeDisabled || model.enabled);
  }

  /**
   * 根据名称获取模型配置
   * @param name 模型名称
   * @returns 模型配置或undefined
   */
  public getModelByName(name: string): ModelConfig | undefined {
    return this.models.find(model => model.name === name);
  }

  /**
   * 获取指定提供商的模型
   * @param provider AI提供商类型
   * @param includeDisabled 是否包含禁用的模型
   * @returns 模型配置数组
   */
  public getModelsByProvider(provider: AIProviderType, includeDisabled = false): ModelConfig[] {
    return this.models.filter(
      model => model.provider === provider && (includeDisabled || model.enabled)
    );
  }

  /**
   * 获取支持特定功能的模型
   * @param capability 功能名称
   * @param includeDisabled 是否包含禁用的模型
   * @returns 模型配置数组
   */
  public getModelsByCapability(capability: string, includeDisabled = false): ModelConfig[] {
    return this.models.filter(
      model => 
        model.capabilities.includes(capability) && 
        (includeDisabled || model.enabled)
    );
  }

  /**
   * 添加自定义模型配置
   * @param modelConfig 模型配置
   * @returns 是否添加成功
   */
  public addCustomModel(modelConfig: ModelConfig): boolean {
    try {
      // 验证配置
      if (!this.validateModelConfig(modelConfig)) {
        console.error('Invalid model configuration');
        return false;
      }

      // 检查是否已存在
      const existingIndex = this.models.findIndex(m => m.name === modelConfig.name);
      
      if (existingIndex >= 0) {
        // 更新现有模型
        this.models[existingIndex] = modelConfig;
      } else {
        // 添加新模型
        this.models.push(modelConfig);
        this.customModels.push(modelConfig);
      }
      
      // 保存自定义模型
      this.saveCustomModels();
      
      return true;
    } catch (error) {
      console.error('Failed to add custom model:', error);
      return false;
    }
  }

  /**
   * 启用/禁用模型
   * @param modelName 模型名称
   * @param enabled 是否启用
   * @returns 是否更新成功
   */
  public setModelEnabled(modelName: string, enabled: boolean): boolean {
    const model = this.models.find(m => m.name === modelName);
    if (model) {
      model.enabled = enabled;
      return true;
    }
    return false;
  }

  /**
   * 获取推荐的默认模型
   * @returns 推荐的模型配置
   */
  public getRecommendedModel(): ModelConfig | undefined {
    // 优先选择启用的、中等成本的通用模型
    return this.models.find(
      model => 
        model.enabled && 
        model.costLevel <= 3 && 
        model.capabilities.includes('chat')
    ) || this.models.find(m => m.enabled);
  }

  /**
   * 验证模型配置
   * @param config 模型配置
   * @returns 是否有效
   */
  private validateModelConfig(config: ModelConfig): boolean {
    if (!config.name || !config.provider) {
      return false;
    }
    
    if (config.contextWindow <= 0 || config.maxOutputTokens < 0) {
      return false;
    }
    
    if (config.costLevel < 1 || config.costLevel > 5) {
      return false;
    }
    
    return true;
  }

  /**
   * 加载自定义模型配置
   */
  private loadCustomModels(): void {
    try {
      // 在实际应用中，这里会从配置文件或环境变量加载自定义模型
      // 目前只是一个占位符实现
      console.log('Loading custom model configurations...');
      
      // 从环境变量加载API密钥
      this.loadApiKeys();
    } catch (error) {
      console.error('Failed to load custom models:', error);
    }
  }

  /**
   * 保存自定义模型配置
   */
  private saveCustomModels(): void {
    try {
      // 在实际应用中，这里会保存自定义模型到配置文件
      console.log(`Saved ${this.customModels.length} custom model configurations`);
    } catch (error) {
      console.error('Failed to save custom models:', error);
    }
  }

  /**
   * 加载API密钥
   */
  private loadApiKeys(): void {
    // 这里会根据环境变量加载不同提供商的API密钥
    // 实际应用中应该使用安全的方式管理API密钥
    console.log('Loading API keys from environment...');
  }
}

// 导出单例实例
export const modelConfigManager = ModelConfigManager.getInstance();
