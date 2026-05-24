/**
 * @file AI功能状态管理
 * @description 提供AI功能的全局状态管理和服务集成
 * @context AIContext
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-24
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AIModelConfig, AIUsageStats, AIProvider } from '../types/ai';
import { toast } from '../../hooks/use-toast';

// 默认模型配置数据
const DEFAULT_MODELS: AIModelConfig[] = [
  {
    id: 'gpt-4',
    name: 'GPT-4',
    provider: AIProvider.OPENAI,
    type: 'text',
    capabilities: ['text', 'multi'],
    description: '功能强大的通用AI模型，适合复杂任务',
    maxTokens: 8192,
    temperature: 0.7,
    isEnabled: true,
    costPerToken: 0.00003
  },
  {
    id: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    provider: AIProvider.OPENAI,
    type: 'text',
    capabilities: ['text'],
    description: '平衡性能和成本的通用AI模型',
    maxTokens: 4096,
    temperature: 0.7,
    isEnabled: true,
    costPerToken: 0.0000025
  },
  {
    id: 'bert-base-uncased',
    name: 'BERT Base',
    provider: AIProvider.HUGGINGFACE,
    type: 'text',
    capabilities: ['text'],
    description: '强大的自然语言理解模型',
    maxTokens: 512,
    temperature: 0.3,
    isEnabled: true,
    costPerToken: 0
  },
  {
    id: 'llava-hf/llava-1.5-7b-hf',
    name: 'LLaVA 1.5',
    provider: AIProvider.HUGGINGFACE,
    type: 'image',
    capabilities: ['image', 'multi'],
    description: '多模态模型，支持图像和文本',
    maxTokens: 4096,
    temperature: 0.7,
    isEnabled: true,
    costPerToken: 0
  }
];

// 模拟使用统计数据
const DEFAULT_USAGE_STATS: AIUsageStats = {
  totalCalls: 124,
  successfulCalls: 118,
  failedCalls: 6,
  totalTokens: 45623,
  modelUsage: [
    { modelId: 'gpt-3.5-turbo', calls: 85, tokens: 32100 },
    { modelId: 'gpt-4', calls: 35, tokens: 12800 },
    { modelId: 'bert-base-uncased', calls: 4, tokens: 723 }
  ],
  dailyUsage: [
    { date: '2024-11-20', calls: 23 },
    { date: '2024-11-21', calls: 31 },
    { date: '2024-11-22', calls: 28 },
    { date: '2024-11-23', calls: 42 }
  ]
};

interface AIContextType {
  // 状态
  availableModels: AIModelConfig[];
  selectedModel: string;
  usageStats: AIUsageStats;
  isLoading: boolean;
  apiKeys: Partial<Record<AIProvider, string>>;
  providerStatus: Partial<Record<AIProvider, boolean>>;
  
  // 方法
  loadModels: () => Promise<void>;
  updateModelConfig: (modelId: string, config: Partial<AIModelConfig>) => Promise<void>;
  enableModel: (modelId: string, enabled: boolean) => Promise<void>;
  setSelectedModel: (modelId: string) => void;
  updateApiKey: (provider: AIProvider, apiKey: string) => Promise<void>;
  testApiConnection: (provider: AIProvider) => Promise<boolean>;
  loadUsageStats: () => Promise<void>;
  submitPreview: (type: 'text' | 'image' | 'data', input: string, modelId: string) => Promise<string>;
}

const AIContext = createContext<AIContextType | undefined>(undefined);

export const useAI = () => {
  const context = useContext(AIContext);
  if (!context) {
    throw new Error('useAI must be used within an AIProvider');
  }
  return context;
};

interface AIContentProviderProps {
  children: ReactNode;
}

export const AIContentProvider: React.FC<AIContentProviderProps> = ({ children }) => {
  const [availableModels, setAvailableModels] = useState<AIModelConfig[]>(DEFAULT_MODELS);
  const [selectedModel, setSelectedModel] = useState<string>(DEFAULT_MODELS[0]?.id || '');
  const [usageStats, setUsageStats] = useState<AIUsageStats>(DEFAULT_USAGE_STATS);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [apiKeys, setApiKeys] = useState<Partial<Record<AIProvider, string>>>({
    [AIProvider.OPENAI]: '',
    [AIProvider.HUGGINGFACE]: '',
    [AIProvider.ANTHROPIC]: '',
    [AIProvider.GOOGLE]: '',
    [AIProvider.CUSTOM]: ''
  });
  const [providerStatus, setProviderStatus] = useState<Partial<Record<AIProvider, boolean>>>({
    [AIProvider.OPENAI]: false,
    [AIProvider.HUGGINGFACE]: false,
    [AIProvider.ANTHROPIC]: false,
    [AIProvider.GOOGLE]: false,
    [AIProvider.CUSTOM]: false
  });

  // 从本地存储加载API密钥
  useEffect(() => {
    const loadApiKeys = () => {
      try {
        const savedKeys = localStorage.getItem('ai-api-keys');
        if (savedKeys) {
          setApiKeys(JSON.parse(savedKeys));
        }
        
        const savedSelectedModel = localStorage.getItem('selected-ai-model');
        if (savedSelectedModel) {
          setSelectedModel(savedSelectedModel);
        }
      } catch (error) {
        console.error('加载API密钥失败:', error);
      }
    };

    loadApiKeys();
    // 初始化时加载模型配置
    loadModels();
    loadUsageStats();
  }, []);

  // 加载模型配置
  const loadModels = async () => {
    setIsLoading(true);
    try {
      // 实际项目中应该从API获取模型配置
      // const response = await fetch('/api/ai/config/models');
      // const data = await response.json();
      // setAvailableModels(data);
      
      // 模拟API延迟
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 检查本地存储是否有自定义配置
      const savedModels = localStorage.getItem('ai-models');
      if (savedModels) {
        const parsedModels = JSON.parse(savedModels);
        setAvailableModels(parsedModels);
      }
    } catch (error) {
      console.error('加载模型配置失败:', error);
      toast({ title: '错误', description: '加载模型配置失败', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  // 更新模型配置
  const updateModelConfig = async (modelId: string, config: Partial<AIModelConfig>) => {
    setIsLoading(true);
    try {
      // 实际项目中应该调用API更新模型配置
      // const response = await fetch(`/api/ai/config/models/${modelId}`, {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(config)
      // });
      
      // 模拟API延迟
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const updatedModels = availableModels.map(model => 
        model.id === modelId ? { ...model, ...config } : model
      );
      setAvailableModels(updatedModels);
      
      // 保存到本地存储
      localStorage.setItem('ai-models', JSON.stringify(updatedModels));
      
      toast({ title: '成功', description: `模型 ${modelId} 配置已更新` });
    } catch (error) {
      console.error('更新模型配置失败:', error);
      toast({ title: '错误', description: '更新模型配置失败', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  // 启用/禁用模型
  const enableModel = async (modelId: string, enabled: boolean) => {
    await updateModelConfig(modelId, { isEnabled: enabled });
    
    // 如果禁用的是当前选中的模型，切换到第一个启用的模型
    if (!enabled && selectedModel === modelId) {
      const firstEnabled = availableModels.find(model => 
        model.id !== modelId && model.isEnabled
      );
      if (firstEnabled) {
        setSelectedModel(firstEnabled.id);
        localStorage.setItem('selected-ai-model', firstEnabled.id);
      }
    }
  };

  // 更新API密钥
  const updateApiKey = async (provider: AIProvider, apiKey: string) => {
    setIsLoading(true);
    try {
      // 实际项目中应该调用API更新API密钥
      // const response = await fetch(`/api/ai/config/providers/${provider}/key`, {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ apiKey })
      // });
      
      // 模拟API延迟
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const updatedKeys = { ...apiKeys, [provider]: apiKey };
      setApiKeys(updatedKeys);
      
      // 保存到本地存储
      localStorage.setItem('ai-api-keys', JSON.stringify(updatedKeys));
      
      // 测试连接
      const isConnected = await testApiConnection(provider);
      setProviderStatus(prev => ({ ...prev, [provider]: isConnected }));
      
      if (isConnected) {
        toast({ title: '成功', description: `${provider} API 密钥已更新并连接成功` });
      } else {
        toast({ title: '错误', description: `${provider} API 密钥已更新但连接失败，请检查密钥是否正确`, variant: 'destructive' });
      }
    } catch (error) {
      console.error('更新API密钥失败:', error);
      toast({ title: '错误', description: '更新API密钥失败', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  // 测试API连接
  const testApiConnection = async (provider: AIProvider): Promise<boolean> => {
    try {
      const apiKey = apiKeys[provider];
      if (!apiKey) return false;
      
      // 实际项目中应该调用API测试连接
      // const response = await fetch(`/api/ai/config/providers/${provider}/test`, {
      //   headers: { 'Authorization': `Bearer ${apiKey}` }
      // });
      
      // 模拟API延迟
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 模拟连接测试，实际项目中应该根据API响应判断
      // 这里简单模拟，如果API密钥不为空且长度大于10，则认为连接成功
      return apiKey.length > 10;
    } catch (error) {
      console.error('测试API连接失败:', error);
      return false;
    }
  };

  // 加载使用统计
  const loadUsageStats = async () => {
    setIsLoading(true);
    try {
      // 实际项目中应该从API获取使用统计
      // const response = await fetch('/api/ai/stats');
      // const data = await response.json();
      // setUsageStats(data);
      
      // 模拟API延迟
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // 从本地存储加载
      const savedStats = localStorage.getItem('ai-usage-stats');
      if (savedStats) {
        setUsageStats(JSON.parse(savedStats));
      }
    } catch (error) {
      console.error('加载使用统计失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 提交预览请求
  const submitPreview = async (type: 'text' | 'image' | 'data', input: string, modelId: string): Promise<string> => {
    setIsLoading(true);
    try {
      // 实际项目中应该调用相应的AI处理API
      // const response = await fetch('/api/ai/preview', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ type, input, modelId })
      // });
      // const data = await response.json();
      // return data.result;
      
      // 模拟API延迟
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // 模拟AI响应
      const model = availableModels.find(m => m.id === modelId);
      let result = '';
      
      switch (type) {
        case 'text':
          result = `这是模型 ${model?.name || modelId} 对文本的分析结果：\n\n${input.length > 50 ? '文本内容较长，AI已对其进行了分析和处理。' : `"${input}"\n\n这是一段测试文本，AI系统对其进行了智能分析和处理。`}`;
          break;
        case 'image':
          result = `这是模型 ${model?.name || modelId} 对图像的分析结果：\n\n图像内容已成功处理。系统识别到了图像中的主要元素，并生成了相应的描述。`;
          break;
        case 'data':
          const lines = input.split('\n');
          result = `这是模型 ${model?.name || modelId} 对数据的分析结果：\n\n数据共包含 ${lines.length} 行。\n第一行似乎是表头：${lines[0] || '无表头'}\n数据行数量：${lines.length - 1}\n\nAI系统已对数据进行了统计分析，识别出了数据的基本特征和模式。`;
          break;
      }
      
      // 更新使用统计（实际项目中应该由后端处理）
      updateLocalUsageStats(modelId);
      
      return result;
    } catch (error) {
      console.error('AI预览请求失败:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // 更新本地使用统计
  const updateLocalUsageStats = (modelId: string) => {
    const updatedStats = {
      ...usageStats,
      totalCalls: usageStats.totalCalls + 1,
      successfulCalls: usageStats.successfulCalls + 1,
      modelUsage: usageStats.modelUsage.map(item => 
        item.modelId === modelId 
          ? { ...item, calls: item.calls + 1, tokens: item.tokens + Math.floor(Math.random() * 1000) + 200 }
          : item
      )
    };
    
    // 更新今日使用统计
    const today = new Date().toISOString().split('T')[0];
    const todayUsage = updatedStats.dailyUsage.find(item => item.date === today);
    
    if (todayUsage) {
      todayUsage.calls += 1;
    } else {
      updatedStats.dailyUsage.push({ date: today, calls: 1 });
      // 保留最近7天的数据
      if (updatedStats.dailyUsage.length > 7) {
        updatedStats.dailyUsage.shift();
      }
    }
    
    setUsageStats(updatedStats);
    localStorage.setItem('ai-usage-stats', JSON.stringify(updatedStats));
  };

  const value: AIContextType = {
    availableModels,
    selectedModel,
    usageStats,
    isLoading,
    apiKeys,
    providerStatus,
    loadModels,
    updateModelConfig,
    enableModel,
    setSelectedModel: (modelId: string) => {
      setSelectedModel(modelId);
      localStorage.setItem('selected-ai-model', modelId);
    },
    updateApiKey,
    testApiConnection,
    loadUsageStats,
    submitPreview
  };

  return (
    <AIContext.Provider value={value}>
      {children}
    </AIContext.Provider>
  );
};

export default AIContext;