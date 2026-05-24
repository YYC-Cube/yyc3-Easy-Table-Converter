/**
 * @file AI文本处理服务
 * @description 提供文本分析、摘要、分类、生成等AI文本处理功能
 * @module services/TextProcessingService
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-23
 */

import { 
  TextProcessingRequest, 
  TextProcessingResponse, 
  TextOperation, 
  AIProvider, 
  AIModelConfig,
  TextAnalysisResult,
  TextClassificationResult,
  TextSummarizationResult,
  TextGenerationResult
} from '../types';
import { logger } from '../utils/logger';
import { AIConfigService } from './AIConfigService';
import OpenAI from 'openai';
import { HfInference } from '@huggingface/inference';

/**
 * AI文本处理服务类
 */
export class TextProcessingService {
  private configService: AIConfigService;
  private openaiClient: OpenAI | null = null;
  private hfClient: HfInference | null = null;

  /**
   * 构造函数
   */
  constructor() {
    this.configService = AIConfigService.getInstance();
    this.initializeClients();
  }

  /**
   * 初始化AI客户端
   */
  private initializeClients(): void {
    const openaiConfig = this.configService.getProviderConfig(AIProvider.OPENAI);
    if (openaiConfig && openaiConfig.apiKey) {
      this.openaiClient = new OpenAI({
        apiKey: openaiConfig.apiKey,
        baseURL: openaiConfig.baseUrl
      });
      logger.info('OpenAI客户端初始化成功');
    }

    const hfConfig = this.configService.getProviderConfig(AIProvider.HUGGINGFACE);
    if (hfConfig && hfConfig.apiKey) {
      this.hfClient = new HfInference(hfConfig.apiKey);
      logger.info('Hugging Face客户端初始化成功');
    }
  }

  /**
   * 处理文本请求
   */
  public async processText(request: TextProcessingRequest): Promise<TextProcessingResponse> {
    try {
      logger.info(`处理文本请求: ${request.operation}`, { 
        modelId: request.modelId, 
        provider: request.provider 
      });

      // 获取模型配置
      const model = request.modelId ? 
        this.configService.getModelById(request.modelId) : 
        this.getRecommendedModel(request.operation);

      if (!model || !model.isEnabled) {
        throw new Error('请求的模型不可用或已禁用');
      }

      // 根据操作类型处理
      switch (request.operation) {
        case TextOperation.ANALYZE:
          return await this.analyzeText(request, model);
        case TextOperation.SUMMARIZE:
          return await this.summarizeText(request, model);
        case TextOperation.CLASSIFY:
          return await this.classifyText(request, model);
        case TextOperation.GENERATE:
          return await this.generateText(request, model);
        case TextOperation.EXTRACT_KEYWORDS:
          return await this.extractKeywords(request, model);
        default:
          throw new Error(`不支持的操作: ${request.operation}`);
      }
    } catch (error) {
      logger.error(`文本处理失败: ${error instanceof Error ? error.message : String(error)}`, {
        operation: request.operation,
        error: error
      });
      throw error;
    }
  }

  /**
   * 获取推荐模型
   */
  private getRecommendedModel(operation: TextOperation): AIModelConfig | undefined {
    const availableModels = this.configService.getModelsByType('text');
    
    // 根据操作类型推荐不同的模型
    switch (operation) {
      case TextOperation.ANALYZE:
      case TextOperation.SUMMARIZE:
        // 这些操作需要更高级的模型
        return availableModels.find(m => m.id === 'gpt-4' || m.id === 'gpt-3.5-turbo') || availableModels[0];
      case TextOperation.CLASSIFY:
        // 分类任务可以使用专用模型
        return availableModels.find(m => m.id.includes('bert') || m.id === 'gpt-3.5-turbo') || availableModels[0];
      case TextOperation.GENERATE:
        // 生成任务需要生成式模型
        return availableModels.find(m => m.id === 'gpt-3.5-turbo') || availableModels[0];
      default:
        return availableModels[0];
    }
  }

  /**
   * 分析文本
   */
  private async analyzeText(
    request: TextProcessingRequest, 
    model: AIModelConfig
  ): Promise<TextProcessingResponse> {
    try {
      let analysis: TextAnalysisResult;

      if (model.provider === AIProvider.OPENAI && this.openaiClient) {
        const prompt = `请分析以下文本，提供主题、情感倾向、关键观点和写作风格的详细分析。\n\n文本: ${request.text}`;

        const response = await this.openaiClient.chat.completions.create({
          model: model.id,
          messages: [{ role: 'user', content: prompt }],
          temperature: request.options?.temperature || 0.3,
          max_tokens: request.options?.maxTokens || 1000
        });

        analysis = {
          summary: response.choices[0]?.message.content || '',
          topics: [], // 需要进一步解析
          sentiment: 'neutral', // 需要进一步解析
          confidence: 0.9,
          keyPoints: [] // 需要进一步解析
        };

        // 记录使用情况
        this.configService.recordUsage(AIProvider.OPENAI, TextOperation.ANALYZE, {
          prompt: response.usage?.prompt_tokens || 0,
          completion: response.usage?.completion_tokens || 0
        });
      } else {
        // 使用Hugging Face或其他提供商实现
        throw new Error('当前仅支持OpenAI进行文本分析');
      }

      return {
        success: true,
        operation: request.operation,
        result: analysis,
        modelId: model.id,
        provider: model.provider
      };
    } catch (error) {
      logger.error('文本分析失败:', error);
      throw error;
    }
  }

  /**
   * 摘要文本
   */
  private async summarizeText(
    request: TextProcessingRequest, 
    model: AIModelConfig
  ): Promise<TextProcessingResponse> {
    try {
      let summary: TextSummarizationResult;

      if (model.provider === AIProvider.OPENAI && this.openaiClient) {
        const prompt = `请生成以下文本的简明摘要，保留核心信息和关键观点。摘要长度应控制在原文的20%左右。\n\n文本: ${request.text}`;

        const response = await this.openaiClient.chat.completions.create({
          model: model.id,
          messages: [{ role: 'user', content: prompt }],
          temperature: request.options?.temperature || 0.1,
          max_tokens: request.options?.maxTokens || 500
        });

        summary = {
          summary: response.choices[0]?.message.content || '',
          length: {
            original: request.text.length,
            summary: response.choices[0]?.message.content?.length || 0
          },
          method: 'extractive'
        };

        // 记录使用情况
        this.configService.recordUsage(AIProvider.OPENAI, TextOperation.SUMMARIZE, {
          prompt: response.usage?.prompt_tokens || 0,
          completion: response.usage?.completion_tokens || 0
        });
      } else if (model.provider === AIProvider.HUGGINGFACE && this.hfClient) {
        // 使用Hugging Face的摘要模型
        const response = await this.hfClient.summarization({
          model: model.defaultConfig?.model || 'facebook/bart-large-cnn',
          inputs: request.text,
          parameters: {
            max_length: request.options?.maxTokens || 150,
            min_length: 30
          }
        });

        summary = {
          summary: response.summary_text,
          length: {
            original: request.text.length,
            summary: response.summary_text.length
          },
          method: 'extractive'
        };
      } else {
        throw new Error('当前提供商不支持文本摘要功能');
      }

      return {
        success: true,
        operation: request.operation,
        result: summary,
        modelId: model.id,
        provider: model.provider
      };
    } catch (error) {
      logger.error('文本摘要失败:', error);
      throw error;
    }
  }

  /**
   * 分类文本
   */
  private async classifyText(
    request: TextProcessingRequest, 
    model: AIModelConfig
  ): Promise<TextProcessingResponse> {
    try {
      let classification: TextClassificationResult;

      if (model.provider === AIProvider.OPENAI && this.openaiClient) {
        const categories = request.options?.categories || ['科技', '金融', '教育', '医疗', '娱乐', '体育', '其他'];
        const prompt = `请将以下文本分类为以下类别之一: ${categories.join(', ')}。\n\n文本: ${request.text}\n\n请以JSON格式返回结果: {"category": "分类结果", "confidence": 置信度(0-1)}`;

        const response = await this.openaiClient.chat.completions.create({
          model: model.id,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.0,
          max_tokens: 100
        });

        try {
          classification = JSON.parse(response.choices[0]?.message.content || '{}');
        } catch {
          classification = {
            category: '其他',
            confidence: 0.5
          };
        }

        // 记录使用情况
        this.configService.recordUsage(AIProvider.OPENAI, TextOperation.CLASSIFY, {
          prompt: response.usage?.prompt_tokens || 0,
          completion: response.usage?.completion_tokens || 0
        });
      } else if (model.provider === AIProvider.HUGGINGFACE && this.hfClient) {
        // 使用Hugging Face的分类模型
        const response = await this.hfClient.textClassification({
          model: model.defaultConfig?.model || 'distilbert-base-uncased-finetuned-sst-2-english',
          inputs: request.text
        });

        classification = {
          category: response[0]?.label || 'neutral',
          confidence: response[0]?.score || 0.5
        };
      } else {
        throw new Error('当前提供商不支持文本分类功能');
      }

      return {
        success: true,
        operation: request.operation,
        result: classification,
        modelId: model.id,
        provider: model.provider
      };
    } catch (error) {
      logger.error('文本分类失败:', error);
      throw error;
    }
  }

  /**
   * 生成文本
   */
  private async generateText(
    request: TextProcessingRequest, 
    model: AIModelConfig
  ): Promise<TextProcessingResponse> {
    try {
      let generation: TextGenerationResult;

      if (model.provider === AIProvider.OPENAI && this.openaiClient) {
        const response = await this.openaiClient.chat.completions.create({
          model: model.id,
          messages: [{ role: 'user', content: request.text }],
          temperature: request.options?.temperature || 0.7,
          max_tokens: request.options?.maxTokens || 1000,
          top_p: request.options?.topP || 1,
          frequency_penalty: request.options?.frequencyPenalty || 0,
          presence_penalty: request.options?.presencePenalty || 0
        });

        generation = {
          generatedText: response.choices[0]?.message.content || '',
          tokens: {
            prompt: response.usage?.prompt_tokens || 0,
            completion: response.usage?.completion_tokens || 0,
            total: response.usage?.total_tokens || 0
          }
        };

        // 记录使用情况
        this.configService.recordUsage(AIProvider.OPENAI, TextOperation.GENERATE, {
          prompt: response.usage?.prompt_tokens || 0,
          completion: response.usage?.completion_tokens || 0
        });
      } else {
        throw new Error('当前仅支持OpenAI进行文本生成');
      }

      return {
        success: true,
        operation: request.operation,
        result: generation,
        modelId: model.id,
        provider: model.provider
      };
    } catch (error) {
      logger.error('文本生成失败:', error);
      throw error;
    }
  }

  /**
   * 提取关键词
   */
  private async extractKeywords(
    request: TextProcessingRequest, 
    model: AIModelConfig
  ): Promise<TextProcessingResponse> {
    try {
      let keywords: { keywords: { term: string; score: number }[] };

      if (model.provider === AIProvider.OPENAI && this.openaiClient) {
        const prompt = `请从以下文本中提取最重要的关键词，按相关性降序排列，并为每个关键词提供0-1的相关性分数。\n\n文本: ${request.text}\n\n请以JSON格式返回结果: {"keywords": [{"term": "关键词1", "score": 0.9}, {"term": "关键词2", "score": 0.8}]}`;

        const response = await this.openaiClient.chat.completions.create({
          model: model.id,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.0,
          max_tokens: 200
        });

        try {
          keywords = JSON.parse(response.choices[0]?.message.content || '{"keywords": []}');
        } catch {
          keywords = { keywords: [] };
        }

        // 记录使用情况
        this.configService.recordUsage(AIProvider.OPENAI, TextOperation.EXTRACT_KEYWORDS, {
          prompt: response.usage?.prompt_tokens || 0,
          completion: response.usage?.completion_tokens || 0
        });
      } else {
        throw new Error('当前仅支持OpenAI进行关键词提取');
      }

      return {
        success: true,
        operation: request.operation,
        result: keywords,
        modelId: model.id,
        provider: model.provider
      };
    } catch (error) {
      logger.error('关键词提取失败:', error);
      throw error;
    }
  }

  /**
   * 检查文本长度是否超过限制
   */
  public validateTextLength(text: string, maxLength: number): boolean {
    return text.length <= maxLength;
  }

  /**
   * 分割长文本
   */
  public splitLongText(text: string, maxChunkSize: number): string[] {
    const chunks: string[] = [];
    let currentChunk = '';
    
    const sentences = text.split(/[.!?]\s+/);
    
    for (const sentence of sentences) {
      if (currentChunk.length + sentence.length + 1 > maxChunkSize && currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = sentence;
      } else {
        currentChunk += (currentChunk ? ' ' : '') + sentence;
      }
    }
    
    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }
    
    return chunks;
  }
}