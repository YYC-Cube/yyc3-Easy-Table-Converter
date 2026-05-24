// OpenAI适配器实现
import axios, { AxiosInstance, AxiosError } from 'axios';
import { 
  BaseAIAdapter, 
  AIModelConfig, 
  ChatMessage, 
  ChatRequest, 
  ChatResponse, 
  StreamCallback,
  EmbeddingRequest,
  EmbeddingResponse
} from './base';

/**
 * OpenAI特定的API响应格式
 */
interface OpenAIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * OpenAI流式响应格式
 */
interface OpenAIStreamResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    delta: {
      role?: string;
      content?: string;
    };
    finish_reason: string | null;
  }>;
}

/**
 * OpenAI嵌入响应格式
 */
interface OpenAIEmbeddingResponse {
  object: string;
  data: Array<{
    object: string;
    index: number;
    embedding: number[];
  }>;
  model: string;
  usage: {
    prompt_tokens: number;
    total_tokens: number;
  };
}

/**
 * OpenAI适配器类
 */
export class OpenAIAdapter extends BaseAIAdapter {
  /**
   * Axios实例
   */
  private axiosInstance: AxiosInstance;

  /**
   * 流请求的AbortController映射
   */
  private streamControllers: Map<string, AbortController> = new Map();

  /**
   * 构造函数
   * @param config 配置对象
   */
  constructor(config: AIModelConfig) {
    super(config);
    
    // 创建axios实例
    this.axiosInstance = axios.create({
      baseURL: this.config.baseUrl || 'https://api.openai.com/v1',
      timeout: this.config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
      },
    });
  }

  /**
   * 初始化适配器
   */
  async initialize(): Promise<void> {
    try {
      // 验证API密钥
      await this.validateApiKey();
      console.log('OpenAI adapter initialized successfully');
    } catch (error) {
      console.error('Failed to initialize OpenAI adapter:', error);
      throw error;
    }
  }

  /**
   * 发送聊天请求
   * @param request 聊天请求
   * @returns 聊天响应
   */
  async chat(request: ChatRequest): Promise<ChatResponse> {
    try {
      // 合并配置
      const effectiveConfig = {
        ...this.config,
        ...request.modelConfig,
      };

      // 准备请求数据
      const data = {
        model: effectiveConfig.modelName,
        messages: request.messages.map(msg => ({
          role: msg.role,
          content: msg.content,
        })),
        temperature: request.temperature || 0.7,
        max_tokens: request.maxTokens || 1000,
        stop: request.stop,
      };

      // 发送请求
      const response = await this.axiosInstance.post<OpenAIResponse>('/chat/completions', data);

      // 处理响应
      const choice = response.data.choices[0];
      const chatResponse: ChatResponse = {
        message: {
          role: choice.message.role as 'system' | 'user' | 'assistant',
          content: choice.message.content,
          id: response.data.id,
          timestamp: response.data.created,
        },
        usage: {
          promptTokens: response.data.usage.prompt_tokens,
          completionTokens: response.data.usage.completion_tokens,
          totalTokens: response.data.usage.total_tokens,
        },
        id: response.data.id,
        model: response.data.model,
      };

      return chatResponse;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * 发送流式聊天请求
   * @param request 聊天请求
   * @param callback 回调函数
   * @returns 取消函数
   */
  streamChat(request: ChatRequest, callback: StreamCallback): () => void {
    const requestId = Date.now().toString();
    const controller = new AbortController();
    this.streamControllers.set(requestId, controller);

    // 合并配置
    const effectiveConfig = {
      ...this.config,
      ...request.modelConfig,
    };

    // 准备请求数据
    const data = {
      model: effectiveConfig.modelName,
      messages: request.messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      })),
      temperature: request.temperature || 0.7,
      max_tokens: request.maxTokens || 1000,
      stop: request.stop,
      stream: true,
    };

    // 发送流式请求
    this.axiosInstance.post('/chat/completions', data, {
      responseType: 'stream',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${effectiveConfig.apiKey}`,
      },
    })
    .then(response => {
      let accumulatedContent = '';
      let assistantRole = 'assistant';
      let responseId = '';
      let modelName = '';
      let createdAt = 0;

      const reader = response.data.getReader();
      const decoder = new TextDecoder();

      const readStream = async () => {
        const { done, value } = await reader.read();
        
        if (done) {
          // 完成回调
          callback.onComplete({
            message: {
              role: assistantRole as 'assistant',
              content: accumulatedContent,
              id: responseId,
              timestamp: createdAt || Date.now(),
            },
            id: responseId,
            model: modelName,
          });
          this.streamControllers.delete(requestId);
          return;
        }

        // 解码数据
        const chunk = decoder.decode(value, { stream: true });
        
        // 处理SSE格式
        const lines = chunk.split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data:')) {
            const dataStr = line.substring(5).trim();
            if (dataStr === '[DONE]') continue;
            
            try {
              const parsed: OpenAIStreamResponse = JSON.parse(dataStr);
              
              if (parsed.choices && parsed.choices.length > 0) {
                const choice = parsed.choices[0];
                
                if (choice.delta.content) {
                  accumulatedContent += choice.delta.content;
                  callback.onData(choice.delta.content);
                }
                
                if (choice.delta.role) {
                  assistantRole = choice.delta.role;
                }
                
                responseId = parsed.id;
                modelName = parsed.model;
                createdAt = parsed.created;
              }
            } catch (e) {
              console.error('Error parsing SSE chunk:', e);
            }
          }
        }

        // 继续读取流
        readStream();
      };

      readStream();
    })
    .catch((error: AxiosError) => {
      callback.onError(error);
      this.streamControllers.delete(requestId);
    });

    // 返回取消函数
    return () => {
      controller.abort();
      this.streamControllers.delete(requestId);
    };
  }

  /**
   * 生成文本嵌入
   * @param request 嵌入请求
   * @returns 嵌入响应
   */
  async embed(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    try {
      // 合并配置
      const effectiveConfig = {
        ...this.config,
        ...request.modelConfig,
      };

      // 准备请求数据
      const data = {
        model: effectiveConfig.modelName,
        input: request.texts,
        dimensions: request.dimensions,
      };

      // 发送请求
      const response = await this.axiosInstance.post<OpenAIEmbeddingResponse>('/embeddings', data);

      // 处理响应
      const embeddingResponse: EmbeddingResponse = {
        embeddings: response.data.data.map(item => item.embedding),
        usage: {
          promptTokens: response.data.usage.prompt_tokens,
          totalTokens: response.data.usage.total_tokens,
        },
        id: Date.now().toString(), // OpenAI embedding API doesn't return an id
        model: response.data.model,
      };

      return embeddingResponse;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * 获取模型信息
   * @returns 模型信息
   */
  async getModelInfo(): Promise<any> {
    try {
      const response = await this.axiosInstance.get(`/models/${this.config.modelName}`);
      return response.data;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  /**
   * 验证API密钥
   * @returns 是否有效
   */
  async validateApiKey(): Promise<boolean> {
    try {
      await this.axiosInstance.get('/models');
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * 获取可用模型列表
   * @returns 模型列表
   */
  async getAvailableModels(): Promise<string[]> {
    try {
      const response = await this.axiosInstance.get('/models');
      // 过滤出聊天模型
      return response.data.data
        .filter((model: any) => model.id.startsWith('gpt-'))
        .map((model: any) => model.id);
    } catch (error) {
      this.handleError(error);
      return [];
    }
  }

  /**
   * 清理资源
   */
  async cleanup(): Promise<void> {
    // 取消所有活跃的流请求
    for (const [id, controller] of this.streamControllers) {
      controller.abort();
    }
    this.streamControllers.clear();
  }

  /**
   * 处理错误
   * @param error 错误对象
   */
  private handleError(error: any): void {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      if (axiosError.response) {
        // 服务器返回错误状态码
        console.error(`OpenAI API Error: ${axiosError.response.status} ${axiosError.response.statusText}`);
        console.error('Response data:', axiosError.response.data);
      } else if (axiosError.request) {
        // 请求已发送但未收到响应
        console.error('OpenAI API No Response:', axiosError.request);
      } else {
        // 请求配置错误
        console.error('OpenAI API Request Error:', axiosError.message);
      }
    } else {
      // 其他错误
      console.error('OpenAI API Error:', error);
    }
  }
}
