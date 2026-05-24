/**
 * @file AI模型配置类型定义
 * @description 定义AI模型、配置和API相关的类型
 * @module lib/types/ai
 * @author YYC
 * @version 1.0.0
 * @created 2026-02-23
 */

export type AIModelProvider = 'openai' | 'anthropic' | 'google' | 'azure' | 'custom';

export type AIModelType = 
  | 'gpt-4o'
  | 'gpt-4o-mini'
  | 'gpt-4-turbo'
  | 'gpt-3.5-turbo'
  | 'claude-3-5-sonnet'
  | 'claude-3-opus'
  | 'claude-3-haiku'
  | 'gemini-pro'
  | 'gemini-flash'
  | 'glm-4'
  | 'glm-4-flash'
  | 'qwen-turbo'
  | 'qwen-plus'
  | 'ERNIE-4'
  | 'ERNIE-3.5'
  | 'Spark'
  | 'custom';

export interface AIModelConfig {
  id: string;
  name: string;
  provider: AIModelProvider;
  modelType: AIModelType;
  apiKey?: string;
  baseUrl?: string;
  maxTokens: number;
  temperature: number;
  topP: number;
  enabled: boolean;
}

export interface AIChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  model?: AIModelType;
}

export interface AIChatSession {
  id: string;
  title: string;
  messages: AIChatMessage[];
  createdAt: Date;
  updatedAt: Date;
  model: AIModelType;
}

export interface AICompletionRequest {
  model: AIModelType;
  messages: AIChatMessage[];
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  stream?: boolean;
}

export interface AICompletionResponse {
  id: string;
  model: AIModelType;
  content: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason: 'stop' | 'length' | 'content_filter' | null;
}

export interface AIStreamChunk {
  id: string;
  delta: string;
  finishReason: 'stop' | 'length' | 'content_filter' | null;
}

export interface AISettings {
  defaultModel: AIModelType;
  apiKeys: Record<AIModelProvider, string>;
  baseUrls: Record<AIModelProvider, string>;
  customModels: AIModelConfig[];
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  enableStream: boolean;
  enableFloatingChat: boolean;
  floatingChatPosition: 'bottom-right' | 'bottom-left';
}

export const DEFAULT_AI_SETTINGS: AISettings = {
  defaultModel: 'gpt-4o-mini',
  apiKeys: {
    openai: '',
    anthropic: '',
    google: '',
    azure: '',
    custom: ''
  },
  baseUrls: {
    openai: 'https://api.openai.com/v1',
    anthropic: 'https://api.anthropic.com/v1',
    google: 'https://generativelanguage.googleapis.com/v1',
    azure: '',
    custom: ''
  },
  customModels: [],
  systemPrompt: '你是一个有用的AI助手，擅长回答各种问题。',
  temperature: 0.7,
  maxTokens: 2048,
  enableStream: true,
  enableFloatingChat: false,
  floatingChatPosition: 'bottom-right'
};

export const MODEL_PROVIDER_MAP: Record<AIModelType, AIModelProvider> = {
  'gpt-4o': 'openai',
  'gpt-4o-mini': 'openai',
  'gpt-4-turbo': 'openai',
  'gpt-3.5-turbo': 'openai',
  'claude-3-5-sonnet': 'anthropic',
  'claude-3-opus': 'anthropic',
  'claude-3-haiku': 'anthropic',
  'gemini-pro': 'google',
  'gemini-flash': 'google',
  'glm-4': 'custom',
  'glm-4-flash': 'custom',
  'qwen-turbo': 'custom',
  'qwen-plus': 'custom',
  'ERNIE-4': 'custom',
  'ERNIE-3.5': 'custom',
  'Spark': 'custom',
  'custom': 'custom'
};

export const MODEL_NAME_MAP: Record<AIModelType, string> = {
  'gpt-4o': 'GPT-4o',
  'gpt-4o-mini': 'GPT-4o Mini',
  'gpt-4-turbo': 'GPT-4 Turbo',
  'gpt-3.5-turbo': 'GPT-3.5 Turbo',
  'claude-3-5-sonnet': 'Claude 3.5 Sonnet',
  'claude-3-opus': 'Claude 3 Opus',
  'claude-3-haiku': 'Claude 3 Haiku',
  'gemini-pro': 'Gemini Pro',
  'gemini-flash': 'Gemini Flash',
  'glm-4': 'GLM-4',
  'glm-4-flash': 'GLM-4 Flash',
  'qwen-turbo': '通义千问 Turbo',
  'qwen-plus': '通义千问 Plus',
  'ERNIE-4': '文心4.0',
  'ERNIE-3.5': '文心一言 一言 3.5',
  'Spark': '讯飞星火',
  'custom': '自定义模型'
};
