/**
 * @file AI相关类型定义
 * @description 定义AI功能所需的接口和类型
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-24
 */

// AI提供商枚举
export enum AIProvider {
  OPENAI = 'openai',
  HUGGINGFACE = 'huggingface',
  ANTHROPIC = 'anthropic',
  GOOGLE = 'google',
  CUSTOM = 'custom'
}

// AI模型配置接口
export interface AIModelConfig {
  id: string;
  name: string;
  provider: AIProvider;
  type: 'text' | 'image' | 'multi';
  capabilities: string[];
  description: string;
  maxTokens: number;
  temperature: number;
  isEnabled: boolean;
  costPerToken: number;
}

// AI配置更新请求接口
export interface AIConfigUpdateRequest {
  provider: AIProvider;
  modelId?: string;
  settings: Record<string, any>;
}

// AI使用统计接口
export interface AIUsageStats {
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  totalTokens: number;
  modelUsage: Array<{
    modelId: string;
    calls: number;
    tokens: number;
  }>;
  dailyUsage: Array<{
    date: string;
    calls: number;
  }>;
}

// 文本处理请求接口
export interface TextProcessingRequest {
  modelId: string;
  text: string;
  prompt?: string;
  temperature?: number;
  maxTokens?: number;
}

// 图像处理请求接口
export interface ImageProcessingRequest {
  modelId: string;
  imageData: string; // Base64编码的图像数据
  prompt?: string;
  taskType?: 'description' | 'analysis' | 'enhancement';
}

// 数据分析请求接口
export interface DataAnalysisRequest {
  modelId: string;
  data: any;
  analysisType: string;
  parameters?: Record<string, any>;
}

// AI响应接口
export interface AIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  tokensUsed?: number;
  processingTime?: number;
}

// AI配置接口
export interface AIConfig {
  defaultModel: string;
  providerSettings: {
    [key in AIProvider]?: {
      apiKey: string;
      baseUrl?: string;
      enabled: boolean;
    };
  };
  modelParameters: {
    temperature: number;
    maxTokens: number;
  };
}
