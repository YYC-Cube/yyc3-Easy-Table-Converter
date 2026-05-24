/**
 * @file AI配置管理服务
 * @description 负责管理AI服务的配置、模型选择和API密钥
 * @module services/AIConfigService
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-23
 */

import { AIModelConfig, AIConfigOptions, AIProvider, AIConfigUpdateRequest } from '../types';
import { logger } from '../utils/logger';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

/**
 * AI配置管理服务类
 */
export class AIConfigService {
  private static instance: AIConfigService;
  private configFilePath: string;
  private models: AIModelConfig[];
  private providerConfigs: Map<string, any>;
  private usageStats: Map<string, any>;

  /**
   * 私有构造函数
   */
  private constructor() {
    this.configFilePath = path.join(__dirname, '../../config/ai-config.json');
    this.models = this.loadModels();
    this.providerConfigs = new Map();
    this.usageStats = new Map();
    this.initializeProviderConfigs();
    this.ensureConfigDirectory();
  }

  /**
   * 获取单例实例
   */
  public static getInstance(): AIConfigService {
    if (!AIConfigService.instance) {
      AIConfigService.instance = new AIConfigService();
    }
    return AIConfigService.instance;
  }

  /**
   * 确保配置目录存在
   */
  private ensureConfigDirectory(): void {
    const configDir = path.dirname(this.configFilePath);
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
  }

  /**
   * 加载模型配置
   */
  private loadModels(): AIModelConfig[] {
    try {
      // 如果配置文件存在，从文件加载
      if (fs.existsSync(this.configFilePath)) {
        const data = fs.readFileSync(this.configFilePath, 'utf-8');
        const config = JSON.parse(data);
        return config.models || this.getDefaultModels();
      }
    } catch (error) {
      logger.error('加载AI配置失败:', error);
    }
    return this.getDefaultModels();
  }

  /**
   * 获取默认模型配置
   */
  private getDefaultModels(): AIModelConfig[] {
    return [
      // OpenAI模型
      {
        id: 'gpt-4',
        name: 'GPT-4',
        provider: AIProvider.OPENAI,
        type: 'multi',
        capabilities: ['text', 'image', 'data'],
        defaultConfig: {
          model: 'gpt-4',
          temperature: 0.7,
          maxTokens: 4096
        },
        maxInputSize: 8192,
        costPerToken: 0.00003,
        isEnabled: true,
        lastUpdated: new Date().toISOString()
      },
      {
        id: 'gpt-3.5-turbo',
        name: 'GPT-3.5 Turbo',
        provider: AIProvider.OPENAI,
        type: 'text',
        capabilities: ['text', 'data'],
        defaultConfig: {
          model: 'gpt-3.5-turbo',
          temperature: 0.7,
          maxTokens: 4096
        },
        maxInputSize: 4096,
        costPerToken: 0.0000015,
        isEnabled: true,
        lastUpdated: new Date().toISOString()
      },
      // Hugging Face模型
      {
        id: 'bert-base-uncased',
        name: 'BERT Base Uncased',
        provider: AIProvider.HUGGINGFACE,
        type: 'text',
        capabilities: ['text', 'classify'],
        defaultConfig: {
          model: 'bert-base-uncased',
          temperature: 0.0,
          maxTokens: 512
        },
        maxInputSize: 512,
        costPerToken: 0,
        isEnabled: true,
        lastUpdated: new Date().toISOString()
      },
      {
        id: 'vit-base-patch16-224',
        name: 'Vision Transformer',
        provider: AIProvider.HUGGINGFACE,
        type: 'image',
        capabilities: ['image', 'detect'],
        defaultConfig: {
          model: 'google/vit-base-patch16-224'
        },
        maxInputSize: 224,
        costPerToken: 0,
        isEnabled: true,
        lastUpdated: new Date().toISOString()
      },
      // 本地模型
      {
        id: 'local-text-model',
        name: '本地文本模型',
        provider: AIProvider.LOCAL,
        type: 'text',
        capabilities: ['text'],
        defaultConfig: {
          model: 'local-text',
          temperature: 0.7,
          maxTokens: 1024
        },
        maxInputSize: 2048,
        costPerToken: 0,
        isEnabled: false,
        lastUpdated: new Date().toISOString()
      }
    ];
  }

  /**
   * 初始化提供商配置
   */
  private initializeProviderConfigs(): void {
    // 从环境变量加载API密钥
    this.providerConfigs.set(AIProvider.OPENAI, {
      apiKey: process.env.OPENAI_API_KEY || '',
      baseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
      defaultModel: 'gpt-3.5-turbo'
    });

    this.providerConfigs.set(AIProvider.HUGGINGFACE, {
      apiKey: process.env.HUGGINGFACE_API_KEY || '',
      baseUrl: process.env.HUGGINGFACE_BASE_URL || 'https://api-inference.huggingface.co/models',
      defaultModel: 'bert-base-uncased'
    });

    this.providerConfigs.set(AIProvider.LOCAL, {
      baseUrl: process.env.LOCAL_MODEL_BASE_URL || 'http://localhost:8080',
      defaultModel: 'local-text-model'
    });
  }

  /**
   * 获取所有可用模型
   */
  public getAvailableModels(): AIModelConfig[] {
    return this.models.filter(model => model.isEnabled);
  }

  /**
   * 获取特定类型的模型
   */
  public getModelsByType(type: 'text' | 'image' | 'data' | 'multi'): AIModelConfig[] {
    return this.models.filter(model => model.isEnabled && (model.type === type || model.type === 'multi'));
  }

  /**
   * 根据ID获取模型配置
   */
  public getModelById(modelId: string): AIModelConfig | undefined {
    return this.models.find(model => model.id === modelId);
  }

  /**
   * 获取提供商配置
   */
  public getProviderConfig(provider: AIProvider): any {
    return this.providerConfigs.get(provider);
  }

  /**
   * 更新AI配置
   */
  public updateConfig(config: AIConfigUpdateRequest): boolean {
    try {
      if (config.provider && config.apiKeys) {
        const providerConfig = this.providerConfigs.get(config.provider);
        if (providerConfig) {
          this.providerConfigs.set(config.provider, {
            ...providerConfig,
            apiKey: config.apiKeys[config.provider] || providerConfig.apiKey,
            defaultModel: config.defaultModel || providerConfig.defaultModel
          });
        }
      }

      // 保存配置到文件
      this.saveConfig();
      logger.info('AI配置更新成功');
      return true;
    } catch (error) {
      logger.error('更新AI配置失败:', error);
      return false;
    }
  }

  /**
   * 保存配置到文件
   */
  private saveConfig(): void {
    try {
      const configData = {
        models: this.models,
        providers: Object.fromEntries(this.providerConfigs),
        updatedAt: new Date().toISOString()
      };
      
      fs.writeFileSync(this.configFilePath, JSON.stringify(configData, null, 2), 'utf-8');
    } catch (error) {
      logger.error('保存AI配置失败:', error);
    }
  }

  /**
   * 启用或禁用模型
   */
  public toggleModel(modelId: string, isEnabled: boolean): boolean {
    const model = this.getModelById(modelId);
    if (!model) {
      return false;
    }

    model.isEnabled = isEnabled;
    model.lastUpdated = new Date().toISOString();
    this.saveConfig();
    return true;
  }

  /**
   * 获取默认配置选项
   */
  public getDefaultOptions(modelId?: string): AIConfigOptions {
    if (modelId) {
      const model = this.getModelById(modelId);
      if (model) {
        return { ...model.defaultConfig };
      }
    }
    
    // 返回通用默认选项
    return {
      temperature: 0.7,
      maxTokens: 2048,
      provider: AIProvider.OPENAI
    };
  }

  /**
   * 记录API使用情况
   */
  public recordUsage(provider: AIProvider, operation: string, tokens: { prompt: number; completion: number }): void {
    const key = `${provider}-${operation}`;
    const current = this.usageStats.get(key) || { count: 0, promptTokens: 0, completionTokens: 0 };
    
    this.usageStats.set(key, {
      count: current.count + 1,
      promptTokens: current.promptTokens + tokens.prompt,
      completionTokens: current.completionTokens + tokens.completion
    });
  }

  /**
   * 获取使用统计
   */
  public getUsageStats(): any {
    return Object.fromEntries(this.usageStats);
  }
}