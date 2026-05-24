// 基础AI适配器接口定义

/**
 * AI模型配置接口
 */
export interface AIModelConfig {
  /**
   * API密钥
   */
  apiKey: string;
  
  /**
   * 模型名称
   */
  modelName: string;
  
  /**
   * 基础URL
   */
  baseUrl?: string;
  
  /**
   * 超时设置（毫秒）
   */
  timeout?: number;
  
  /**
   * 其他配置选项
   */
  [key: string]: any;
}

/**
 * 聊天消息接口
 */
export interface ChatMessage {
  /**
   * 消息角色：system, user, assistant
   */
  role: 'system' | 'user' | 'assistant';
  
  /**
   * 消息内容
   */
  content: string;
  
  /**
   * 消息ID
   */
  id?: string;
  
  /**
   * 时间戳
   */
  timestamp?: number;
}

/**
 * 聊天请求接口
 */
export interface ChatRequest {
  /**
   * 消息列表
   */
  messages: ChatMessage[];
  
  /**
   * 模型配置
   */
  modelConfig?: Partial<AIModelConfig>;
  
  /**
   * 温度参数
   */
  temperature?: number;
  
  /**
   * 最大令牌数
   */
  maxTokens?: number;
  
  /**
   * 是否使用流式输出
   */
  stream?: boolean;
  
  /**
   * 停止词列表
   */
  stop?: string[];
}

/**
 * 聊天响应接口
 */
export interface ChatResponse {
  /**
   * 模型生成的消息
   */
  message: ChatMessage;
  
  /**
   * 令牌使用统计
   */
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  
  /**
   * 响应ID
   */
  id: string;
  
  /**
   * 模型名称
   */
  model: string;
}

/**
 * 流式响应回调接口
 */
export interface StreamCallback {
  /**
   * 接收数据时的回调
   */
  onData: (chunk: string) => void;
  
  /**
   * 完成时的回调
   */
  onComplete: (response: ChatResponse) => void;
  
  /**
   * 错误时的回调
   */
  onError: (error: Error) => void;
}

/**
 * 文本嵌入请求接口
 */
export interface EmbeddingRequest {
  /**
   * 要嵌入的文本列表
   */
  texts: string[];
  
  /**
   * 模型配置
   */
  modelConfig?: Partial<AIModelConfig>;
  
  /**
   * 嵌入维度
   */
  dimensions?: number;
}

/**
 * 文本嵌入响应接口
 */
export interface EmbeddingResponse {
  /**
   * 嵌入向量列表
   */
  embeddings: number[][];
  
  /**
   * 令牌使用统计
   */
  usage?: {
    promptTokens: number;
    totalTokens: number;
  };
  
  /**
   * 响应ID
   */
  id: string;
  
  /**
   * 模型名称
   */
  model: string;
}

/**
 * 基础AI适配器接口
 * 所有AI模型适配器必须实现此接口
 */
export abstract class BaseAIAdapter {
  /**
   * 配置对象
   */
  protected config: AIModelConfig;

  /**
   * 构造函数
   * @param config 模型配置
   */
  constructor(config: AIModelConfig) {
    this.config = config;
  }

  /**
   * 初始化适配器
   */
  abstract initialize(): Promise<void>;

  /**
   * 发送聊天请求
   * @param request 聊天请求
   * @returns 聊天响应
   */
  abstract chat(request: ChatRequest): Promise<ChatResponse>;

  /**
   * 发送流式聊天请求
   * @param request 聊天请求
   * @param callback 回调函数
   * @returns 取消函数
   */
  abstract streamChat(request: ChatRequest, callback: StreamCallback): () => void;

  /**
   * 生成文本嵌入
   * @param request 嵌入请求
   * @returns 嵌入响应
   */
  abstract embed(request: EmbeddingRequest): Promise<EmbeddingResponse>;

  /**
   * 获取模型信息
   */
  abstract getModelInfo(): Promise<any>;

  /**
   * 验证API密钥
   * @returns 是否有效
   */
  abstract validateApiKey(): Promise<boolean>;

  /**
   * 获取可用模型列表
   * @returns 模型列表
   */
  abstract getAvailableModels(): Promise<string[]>;

  /**
   * 清理资源
   */
  abstract cleanup(): Promise<void>;
}
