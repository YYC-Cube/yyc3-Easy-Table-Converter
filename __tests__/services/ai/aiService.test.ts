import { AIService, AIProviderType, getAIService } from '@/services/ai';

// 模拟AI适配器
jest.mock('@/services/ai/adapters/factory', () => {
  const mockAdapter = {
    chat: jest.fn().mockResolvedValue({
      id: 'test-chat-123',
      content: 'Mock response content',
      usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
    }),
    embed: jest.fn().mockResolvedValue({
      embeddings: [[0.1, 0.2, 0.3]],
      usage: { promptTokens: 5, totalTokens: 5 },
    }),
    streamChat: jest.fn().mockReturnValue(() => {}),
  };

  return {
    AIAdapterFactory: {
      getInstance: jest.fn().mockReturnValue({
        getAdapter: jest.fn().mockResolvedValue(mockAdapter),
        clearCache: jest.fn(),
      }),
    },
    AIProviderType: {
      OPENAI: 'openai',
      AZURE_OPENAI: 'azure-openai',
      CLAUDE: 'claude',
      GEMINI: 'gemini',
      LOCAL: 'local',
    },
  };
});

// 模拟模型配置管理
jest.mock('@/services/ai/models/config', () => {
  return {
    modelConfigManager: {
      getModelByName: jest.fn().mockReturnValue({
        name: 'gpt-3.5-turbo',
        provider: 'openai',
        enabled: true,
        baseUrl: 'https://api.openai.com/v1',
        supportsStreaming: true,
        supportsEmbeddings: true,
      }),
      getAllModels: jest.fn().mockReturnValue([
        {
          name: 'gpt-3.5-turbo',
          provider: 'openai',
          enabled: true,
          baseUrl: 'https://api.openai.com/v1',
          supportsStreaming: true,
          supportsEmbeddings: true,
        },
        {
          name: 'claude-3-haiku-20240307',
          provider: 'claude',
          enabled: true,
          baseUrl: 'https://api.anthropic.com/v1',
          supportsStreaming: true,
          supportsEmbeddings: false,
        },
      ]),
    },
  };
});

// 模拟提示词策略管理
jest.mock('@/services/ai/prompts/strategies/manager', () => {
  return {
    PromptStrategyManager: {
      getInstance: jest.fn().mockReturnValue({
        generateMessages: jest.fn().mockReturnValue([
          { role: 'system', content: 'Mock system prompt' },
          { role: 'user', content: 'Mock user prompt' },
        ]),
      }),
    },
  };
});

describe('AIService', () => {
  let aiService: AIService;

  beforeEach(() => {
    // 清除所有模拟的调用记录
    jest.clearAllMocks();
    
    // 创建AI服务实例
    aiService = getAIService({
      defaultModel: 'gpt-3.5-turbo',
      apiKeys: {
        [AIProviderType.OPENAI]: 'test-api-key',
      },
      enableCache: true,
      logLevel: 'debug',
    });
  });

  afterEach(() => {
    // 重置服务状态
    jest.resetModules();
  });

  describe('初始化', () => {
    test('应该正确创建AIService单例实例', () => {
      const service1 = getAIService();
      const service2 = getAIService();
      
      expect(service1).toBeInstanceOf(AIService);
      expect(service1).toBe(service2);
    });

    test('应该使用默认配置初始化', () => {
      const service = getAIService();
      
      expect(service).toBeInstanceOf(AIService);
    });
  });

  describe('聊天功能', () => {
    test('应该成功执行聊天请求', async () => {
      const request = {
        messages: [{ role: 'user', content: 'Hello world' }],
        model: 'gpt-3.5-turbo',
      };

      const response = await aiService.chat(request);
      
      expect(response).toBeDefined();
      expect(response.id).toBe('test-chat-123');
      expect(response.content).toBe('Mock response content');
      expect(response.usage).toBeDefined();
    });

    test('应该在没有指定模型时使用默认模型', async () => {
      const request = {
        messages: [{ role: 'user', content: 'Hello world' }],
      };

      const response = await aiService.chat(request);
      
      expect(response).toBeDefined();
    });

    test('应该在聊天请求失败时抛出错误', async () => {
      // 模拟适配器失败
      const mockAdapterModule = require('@/services/ai/adapters/factory');
      mockAdapterModule.AIAdapterFactory.getInstance().getAdapter.mockResolvedValue({
        chat: jest.fn().mockRejectedValue(new Error('Chat failed')),
      });

      const request = {
        messages: [{ role: 'user', content: 'Hello world' }],
      };

      await expect(aiService.chat(request)).rejects.toThrow('Chat failed');
    });
  });

  describe('嵌入功能', () => {
    test('应该成功生成文本嵌入', async () => {
      const request = {
        input: ['test text'],
        model: 'text-embedding-ada-002',
      };

      const response = await aiService.embed(request);
      
      expect(response).toBeDefined();
      expect(response.embeddings).toBeInstanceOf(Array);
      expect(response.embeddings[0]).toEqual([0.1, 0.2, 0.3]);
    });
  });

  describe('策略生成', () => {
    test('应该使用策略生成聊天请求', async () => {
      const context = {
        taskType: 'analysis',
        inputData: { text: 'Test input data' },
        contextInfo: { temperature: 0.5, maxTokens: 500 },
      };

      const response = await aiService.generateWithStrategy(context, 'test-strategy');
      
      expect(response).toBeDefined();
      expect(response.id).toBe('test-chat-123');
    });
  });

  describe('模型管理', () => {
    test('应该返回支持的模型列表', () => {
      const models = aiService.getSupportedModels();
      
      expect(models).toBeInstanceOf(Array);
      expect(models.length).toBeGreaterThan(0);
      expect(models[0].name).toBe('gpt-3.5-turbo');
    });

    test('应该能够设置API密钥', () => {
      // 模拟清除缓存的方法
      const clearCacheSpy = jest.spyOn(aiService as any, 'clearAdapterCache');
      
      aiService.setApiKey(AIProviderType.CLAUDE, 'new-claude-api-key');
      
      expect(clearCacheSpy).toHaveBeenCalledWith(AIProviderType.CLAUDE);
    });
  });

  describe('配置管理', () => {
    test('应该能够更新服务配置', () => {
      aiService.updateConfig({
        defaultModel: 'gpt-4',
        logLevel: 'info',
      });
      
      // 验证配置是否生效
      const status = aiService.getStatus();
      expect(status.defaultModel).toBe('gpt-4');
    });

    test('应该能够获取服务状态', () => {
      const status = aiService.getStatus();
      
      expect(status).toBeDefined();
      expect(status.initialized).toBe(true);
      expect(status.defaultModel).toBe('gpt-3.5-turbo');
      expect(status.supportedModels).toBeGreaterThan(0);
    });
  });

  describe('健康检查', () => {
    test('应该返回健康状态', async () => {
      const health = await aiService.healthCheck();
      
      expect(health).toBe(true);
    });

    test('应该在模型不可用时返回不健康状态', async () => {
      // 模拟模型配置返回undefined
      const mockModelModule = require('@/services/ai/models/config');
      mockModelModule.modelConfigManager.getModelByName.mockReturnValue(null);

      const health = await aiService.healthCheck();
      
      expect(health).toBe(false);
    });
  });

  describe('资源管理', () => {
    test('应该能够清除适配器缓存', async () => {
      await aiService.clearAdapterCache();
      
      // 验证缓存被清除
      const mockFactory = require('@/services/ai/adapters/factory');
      expect(mockFactory.AIAdapterFactory.getInstance().clearCache).toHaveBeenCalled();
    });

    test('应该能够关闭服务并清理资源', async () => {
      await aiService.shutdown();
      
      // 验证资源被清理
      const mockFactory = require('@/services/ai/adapters/factory');
      expect(mockFactory.AIAdapterFactory.getInstance().clearCache).toHaveBeenCalled();
    });
  });
});
