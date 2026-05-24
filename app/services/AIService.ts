/**
 * @file AI服务集成模块
 * @description 提供与后端AI服务的通信接口
 * @service AIService
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-24
 */

import { AIModelConfig, AIProvider, AIUsageStats, TextProcessingRequest, ImageProcessingRequest, DataAnalysisRequest, AIResponse } from '../types/ai';

// API基础URL配置
const API_BASE_URL = process.env.NEXT_PUBLIC_AI_SERVICE_URL || '/api/ai';

class AIService {
  private apiKeyCache: Map<AIProvider, string> = new Map();
  private maxRetries = 3;
  private retryDelay = 1000;

  /**
   * 设置提供商API密钥
   */
  setApiKey(provider: AIProvider, apiKey: string): void {
    this.apiKeyCache.set(provider, apiKey);
  }

  /**
   * 获取提供商API密钥
   */
  getApiKey(provider: AIProvider): string | undefined {
    return this.apiKeyCache.get(provider);
  }

  /**
   * 基础请求方法，包含错误处理和重试逻辑
   */
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    
    // 添加默认头部
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const response = await fetch(url, {
          ...options,
          headers
        });

        if (!response.ok) {
          // 4xx错误通常不需要重试
          if (response.status >= 400 && response.status < 500) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || `请求失败: ${response.status}`);
          }
          throw new Error(`服务器错误: ${response.status}`);
        }

        return await response.json();
      } catch (error) {
        // 最后一次尝试失败，抛出错误
        if (attempt === this.maxRetries - 1) {
          throw error;
        }
        
        // 重试前等待
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * Math.pow(2, attempt)));
      }
    }

    throw new Error('请求失败，已达到最大重试次数');
  }

  /**
   * 获取所有可用模型配置
   */
  async getModels(): Promise<AIModelConfig[]> {
    try {
      return await this.request<AIModelConfig[]>('/config/models');
    } catch (error) {
      console.error('获取模型列表失败:', error);
      throw error;
    }
  }

  /**
   * 获取单个模型配置
   */
  async getModel(modelId: string): Promise<AIModelConfig> {
    try {
      return await this.request<AIModelConfig>(`/config/models/${modelId}`);
    } catch (error) {
      console.error(`获取模型 ${modelId} 配置失败:`, error);
      throw error;
    }
  }

  /**
   * 更新模型配置
   */
  async updateModel(modelId: string, config: Partial<AIModelConfig>): Promise<AIModelConfig> {
    try {
      return await this.request<AIModelConfig>(`/config/models/${modelId}`, {
        method: 'PUT',
        body: JSON.stringify(config)
      });
    } catch (error) {
      console.error(`更新模型 ${modelId} 配置失败:`, error);
      throw error;
    }
  }

  /**
   * 启用/禁用模型
   */
  async toggleModel(modelId: string, enabled: boolean): Promise<AIModelConfig> {
    return this.updateModel(modelId, { isEnabled: enabled });
  }

  /**
   * 获取所有提供商配置
   */
  async getProviders(): Promise<{ provider: AIProvider; isEnabled: boolean }[]> {
    try {
      return await this.request<{ provider: AIProvider; isEnabled: boolean }[]>('/config/providers');
    } catch (error) {
      console.error('获取提供商配置失败:', error);
      throw error;
    }
  }

  /**
   * 更新提供商API密钥
   */
  async updateApiKey(provider: AIProvider, apiKey: string): Promise<void> {
    try {
      await this.request(`/config/providers/${provider}/key`, {
        method: 'PUT',
        body: JSON.stringify({ apiKey })
      });
      // 更新本地缓存
      this.setApiKey(provider, apiKey);
    } catch (error) {
      console.error(`更新 ${provider} API密钥失败:`, error);
      throw error;
    }
  }

  /**
   * 测试API连接
   */
  async testApiConnection(provider: AIProvider): Promise<{ success: boolean; message: string }> {
    try {
      const apiKey = this.getApiKey(provider);
      if (!apiKey) {
        return { success: false, message: 'API密钥未设置' };
      }

      return await this.request<{ success: boolean; message: string }>(`/config/providers/${provider}/test`, {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });
    } catch (error) {
      console.error(`测试 ${provider} API连接失败:`, error);
      return {
        success: false,
        message: error instanceof Error ? error.message : '连接测试失败'
      };
    }
  }

  /**
   * 获取使用统计
   */
  async getUsageStats(): Promise<AIUsageStats> {
    try {
      return await this.request<AIUsageStats>('/stats');
    } catch (error) {
      console.error('获取使用统计失败:', error);
      throw error;
    }
  }

  /**
   * 重新加载配置
   */
  async reloadConfig(): Promise<void> {
    try {
      await this.request('/config/reload', {
        method: 'POST'
      });
    } catch (error) {
      console.error('重新加载配置失败:', error);
      throw error;
    }
  }

  /**
   * 保存配置到持久化存储
   */
  async saveConfig(): Promise<void> {
    try {
      await this.request('/config/save', {
        method: 'POST'
      });
    } catch (error) {
      console.error('保存配置失败:', error);
      throw error;
    }
  }

  /**
   * 文本处理
   */
  async processText(request: TextProcessingRequest): Promise<AIResponse<string>> {
    try {
      const provider = this.getModelProvider(request.modelId);
      const apiKey = this.getApiKey(provider);
      
      return await this.request<AIResponse<string>>('/process/text', {
        method: 'POST',
        headers: apiKey ? {
          'Authorization': `Bearer ${apiKey}`
        } : {},
        body: JSON.stringify(request)
      });
    } catch (error) {
      console.error('文本处理失败:', error);
      throw error;
    }
  }

  /**
   * 图像处理
   */
  async processImage(request: ImageProcessingRequest): Promise<AIResponse<string>> {
    try {
      const provider = this.getModelProvider(request.modelId);
      const apiKey = this.getApiKey(provider);
      
      return await this.request<AIResponse<string>>('/process/image', {
        method: 'POST',
        headers: apiKey ? {
          'Authorization': `Bearer ${apiKey}`
        } : {},
        body: JSON.stringify(request)
      });
    } catch (error) {
      console.error('图像处理失败:', error);
      throw error;
    }
  }

  /**
   * 数据分析
   */
  async analyzeData(request: DataAnalysisRequest): Promise<AIResponse<any>> {
    try {
      const provider = this.getModelProvider(request.modelId);
      const apiKey = this.getApiKey(provider);
      
      return await this.request<AIResponse<any>>('/process/data', {
        method: 'POST',
        headers: apiKey ? {
          'Authorization': `Bearer ${apiKey}`
        } : {},
        body: JSON.stringify(request)
      });
    } catch (error) {
      console.error('数据分析失败:', error);
      throw error;
    }
  }

  /**
   * 批量文本处理
   */
  async batchProcessText(requests: TextProcessingRequest[]): Promise<AIResponse<string>[]> {
    try {
      // 按模型和提供商分组请求
      const groupedRequests = this.groupRequestsByModel(requests);
      const results: AIResponse<string>[] = [];
      
      // 并行处理每组请求
      await Promise.all(
        Object.entries(groupedRequests).map(async ([modelId, batchRequests]) => {
          const provider = this.getModelProvider(modelId);
          const apiKey = this.getApiKey(provider);
          
          const batchResults = await this.request<AIResponse<string>[]>('/process/text/batch', {
            method: 'POST',
            headers: apiKey ? {
              'Authorization': `Bearer ${apiKey}`
            } : {},
            body: JSON.stringify({ requests: batchRequests })
          });
          
          results.push(...batchResults);
        })
      );
      
      return results;
    } catch (error) {
      console.error('批量文本处理失败:', error);
      throw error;
    }
  }

  /**
   * 获取批处理任务状态
   */
  async getBatchTaskStatus(taskId: string): Promise<{
    taskId: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress: number;
    results?: any[];
    error?: string;
  }> {
    try {
      return await this.request(`/tasks/${taskId}`);
    } catch (error) {
      console.error(`获取批处理任务 ${taskId} 状态失败:`, error);
      throw error;
    }
  }

  /**
   * 取消批处理任务
   */
  async cancelBatchTask(taskId: string): Promise<void> {
    try {
      await this.request(`/tasks/${taskId}/cancel`, {
        method: 'POST'
      });
    } catch (error) {
      console.error(`取消批处理任务 ${taskId} 失败:`, error);
      throw error;
    }
  }

  /**
   * 估算文本处理成本
   */
  async estimateCost(text: string, modelId: string): Promise<{
    estimatedTokens: number;
    estimatedCost: number;
    currency: string;
  }> {
    try {
      return await this.request(`/utils/estimate-cost`, {
        method: 'POST',
        body: JSON.stringify({ text, modelId })
      });
    } catch (error) {
      console.error('估算成本失败:', error);
      throw error;
    }
  }

  /**
   * 文本分块处理
   */
  async chunkText(text: string, modelId: string, chunkSize: number = 2000, overlap: number = 200): Promise<string[]> {
    try {
      return await this.request<string[]>(`/utils/chunk-text`, {
        method: 'POST',
        body: JSON.stringify({ text, modelId, chunkSize, overlap })
      });
    } catch (error) {
      console.error('文本分块失败:', error);
      throw error;
    }
  }

  /**
   * 辅助方法：根据模型ID推断提供商
   */
  private getModelProvider(modelId: string): AIProvider {
    // 简单的模型ID到提供商的映射逻辑
    if (modelId.includes('gpt') || modelId.includes('davinci') || modelId.includes('curie')) {
      return AIProvider.OPENAI;
    } else if (modelId.includes('/') || modelId.includes('bert') || modelId.includes('llama')) {
      return AIProvider.HUGGINGFACE;
    }
    return AIProvider.CUSTOM;
  }

  /**
   * 辅助方法：按模型分组请求
   */
  private groupRequestsByModel(requests: any[]): Record<string, any[]> {
    return requests.reduce((groups, request) => {
      const modelId = request.modelId;
      if (!groups[modelId]) {
        groups[modelId] = [];
      }
      groups[modelId].push(request);
      return groups;
    }, {} as Record<string, any[]>);
  }

  /**
   * 健康检查
   */
  async healthCheck(): Promise<{ status: string; uptime: number; models: number }> {
    try {
      return await this.request('/health');
    } catch (error) {
      console.error('健康检查失败:', error);
      throw error;
    }
  }
}

// 创建单例实例
const aiService = new AIService();

export default aiService;
export { AIService };