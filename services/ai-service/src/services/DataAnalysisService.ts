/**
 * @file AI数据分析服务
 * @description 提供表格数据的分析、预测、分类、异常检测等AI数据处理功能
 * @module services/DataAnalysisService
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-23
 */

import { 
  DataAnalysisRequest, 
  DataAnalysisResponse, 
  DataOperation, 
  AIProvider, 
  AIModelConfig,
  DataSummaryResult,
  DataPredictionResult,
  DataClassificationResult,
  AnomalyDetectionResult,
  DataVisualizationResult,
  DataInsight
} from '../types';
import { logger } from '../utils/logger';
import { AIConfigService } from './AIConfigService';
import OpenAI from 'openai';
import * as _ from 'lodash';
import * as math from 'mathjs';

/**
 * AI数据分析服务类
 */
export class DataAnalysisService {
  private configService: AIConfigService;
  private openaiClient: OpenAI | null = null;

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
      logger.info('OpenAI数据分析客户端初始化成功');
    }
  }

  /**
   * 处理数据分析请求
   */
  public async analyzeData(request: DataAnalysisRequest): Promise<DataAnalysisResponse> {
    try {
      logger.info(`处理数据分析请求: ${request.operation}`, { 
        modelId: request.modelId,
        provider: request.provider,
        recordCount: request.data?.length || 0
      });

      // 获取模型配置
      const model = request.modelId ? 
        this.configService.getModelById(request.modelId) : 
        this.getRecommendedModel(request.operation);

      if (!model || !model.isEnabled) {
        throw new Error('请求的模型不可用或已禁用');
      }

      // 验证数据
      if (!request.data || request.data.length === 0) {
        throw new Error('数据不能为空');
      }

      // 根据操作类型处理
      switch (request.operation) {
        case DataOperation.SUMMARIZE:
          return await this.summarizeData(request, model);
        case DataOperation.PREDICT:
          return await this.predictData(request, model);
        case DataOperation.CLASSIFY:
          return await this.classifyData(request, model);
        case DataOperation.DETECT_ANOMALIES:
          return await this.detectAnomalies(request, model);
        case DataOperation.GENERATE_INSIGHTS:
          return await this.generateInsights(request, model);
        case DataOperation.VISUALIZE_SUGGEST:
          return await this.suggestVisualizations(request, model);
        default:
          throw new Error(`不支持的操作: ${request.operation}`);
      }
    } catch (error) {
      logger.error(`数据分析失败: ${error instanceof Error ? error.message : String(error)}`, {
        operation: request.operation,
        error: error
      });
      throw error;
    }
  }

  /**
   * 获取推荐模型
   */
  private getRecommendedModel(operation: DataOperation): AIModelConfig | undefined {
    const availableModels = this.configService.getModelsByType('data');
    
    // 根据操作类型推荐不同的模型
    switch (operation) {
      case DataOperation.SUMMARIZE:
      case DataOperation.GENERATE_INSIGHTS:
      case DataOperation.VISUALIZE_SUGGEST:
        // 这些操作需要强大的语言理解能力
        return availableModels.find(m => m.id === 'gpt-4' || m.id === 'gpt-3.5-turbo') || availableModels[0];
      case DataOperation.PREDICT:
      case DataOperation.CLASSIFY:
      case DataOperation.DETECT_ANOMALIES:
        // 这些操作需要分析能力
        return availableModels.find(m => m.id === 'gpt-3.5-turbo') || availableModels[0];
      default:
        return availableModels[0];
    }
  }

  /**
   * 数据摘要
   */
  private async summarizeData(
    request: DataAnalysisRequest, 
    model: AIModelConfig
  ): Promise<DataAnalysisResponse> {
    try {
      let summary: DataSummaryResult;

      // 计算基本统计信息
      const basicStats = this.calculateBasicStats(request.data);

      if (model.provider === AIProvider.OPENAI && this.openaiClient) {
        // 准备数据样本（限制大小以避免超出token限制）
        const sampleData = request.data.slice(0, 50); // 仅使用前50条记录
        const dataSchema = this.extractDataSchema(request.data);
        
        const prompt = `请对以下表格数据进行详细分析和摘要。\n\n数据结构: ${JSON.stringify(dataSchema)}\n\n数据样本: ${JSON.stringify(sampleData)}\n\n基本统计信息: ${JSON.stringify(basicStats)}\n\n请提供: 1) 数据总体描述 2) 关键发现 3) 数据质量评估 4) 建议的后续分析方向`;

        const response = await this.openaiClient.chat.completions.create({
          model: model.id,
          messages: [{ role: 'user', content: prompt }],
          temperature: request.options?.temperature || 0.3,
          max_tokens: request.options?.maxTokens || 1500
        });

        summary = {
          overview: response.choices[0]?.message.content || '',
          statistics: basicStats,
          schema: dataSchema,
          recordCount: request.data.length
        };

        // 记录使用情况
        this.configService.recordUsage(AIProvider.OPENAI, DataOperation.SUMMARIZE, {
          prompt: response.usage?.prompt_tokens || 0,
          completion: response.usage?.completion_tokens || 0
        });
      } else {
        // 仅返回基本统计信息
        summary = {
          overview: '使用本地统计分析',
          statistics: basicStats,
          schema: this.extractDataSchema(request.data),
          recordCount: request.data.length
        };
      }

      return {
        success: true,
        operation: request.operation,
        result: summary,
        modelId: model.id,
        provider: model.provider
      };
    } catch (error) {
      logger.error('数据摘要失败:', error);
      throw error;
    }
  }

  /**
   * 数据预测
   */
  private async predictData(
    request: DataAnalysisRequest, 
    model: AIModelConfig
  ): Promise<DataAnalysisResponse> {
    try {
      let prediction: DataPredictionResult;

      if (!request.targetColumn) {
        throw new Error('预测任务需要指定目标列');
      }

      if (model.provider === AIProvider.OPENAI && this.openaiClient) {
        const dataSchema = this.extractDataSchema(request.data);
        const sampleData = request.data.slice(0, 100); // 限制样本大小
        
        const prompt = `基于以下数据，请对"${request.targetColumn}"列进行预测分析。\n\n数据结构: ${JSON.stringify(dataSchema)}\n\n数据样本: ${JSON.stringify(sampleData)}\n\n请提供: 1) 预测模型建议 2) 关键预测因子 3) 预测准确性估计 4) 预测结果示例（如果可能）`;

        const response = await this.openaiClient.chat.completions.create({
          model: model.id,
          messages: [{ role: 'user', content: prompt }],
          temperature: request.options?.temperature || 0.3,
          max_tokens: request.options?.maxTokens || 1000
        });

        prediction = {
          predictions: [], // 需要解析AI响应来填充
          modelSuggestion: '',
          confidence: 0.7,
          explanation: response.choices[0]?.message.content || ''
        };

        // 记录使用情况
        this.configService.recordUsage(AIProvider.OPENAI, DataOperation.PREDICT, {
          prompt: response.usage?.prompt_tokens || 0,
          completion: response.usage?.completion_tokens || 0
        });
      } else {
        throw new Error('当前仅支持OpenAI进行数据预测');
      }

      return {
        success: true,
        operation: request.operation,
        result: prediction,
        modelId: model.id,
        provider: model.provider
      };
    } catch (error) {
      logger.error('数据预测失败:', error);
      throw error;
    }
  }

  /**
   * 数据分类
   */
  private async classifyData(
    request: DataAnalysisRequest, 
    model: AIModelConfig
  ): Promise<DataAnalysisResponse> {
    try {
      let classification: DataClassificationResult;

      if (!request.targetColumn) {
        throw new Error('分类任务需要指定目标列');
      }

      if (model.provider === AIProvider.OPENAI && this.openaiClient) {
        const dataSchema = this.extractDataSchema(request.data);
        const sampleData = request.data.slice(0, 100);
        
        const prompt = `请对以下数据进行分类分析，目标列是"${request.targetColumn}"。\n\n数据结构: ${JSON.stringify(dataSchema)}\n\n数据样本: ${JSON.stringify(sampleData)}\n\n请提供: 1) 建议的分类方法 2) 关键分类特征 3) 分类结果示例 4) 分类准确性估计`;

        const response = await this.openaiClient.chat.completions.create({
          model: model.id,
          messages: [{ role: 'user', content: prompt }],
          temperature: request.options?.temperature || 0.3,
          max_tokens: request.options?.maxTokens || 1000
        });

        classification = {
          classes: [], // 需要解析AI响应
          classificationMethod: '',
          featureImportance: [],
          explanation: response.choices[0]?.message.content || ''
        };

        // 记录使用情况
        this.configService.recordUsage(AIProvider.OPENAI, DataOperation.CLASSIFY, {
          prompt: response.usage?.prompt_tokens || 0,
          completion: response.usage?.completion_tokens || 0
        });
      } else {
        throw new Error('当前仅支持OpenAI进行数据分类');
      }

      return {
        success: true,
        operation: request.operation,
        result: classification,
        modelId: model.id,
        provider: model.provider
      };
    } catch (error) {
      logger.error('数据分类失败:', error);
      throw error;
    }
  }

  /**
   * 异常检测
   */
  private async detectAnomalies(
    request: DataAnalysisRequest, 
    model: AIModelConfig
  ): Promise<DataAnalysisResponse> {
    try {
      // 先使用简单的统计方法检测异常
      const anomalies = this.detectStatisticalAnomalies(request.data);
      let detection: AnomalyDetectionResult;

      if (model.provider === AIProvider.OPENAI && this.openaiClient) {
        const dataSchema = this.extractDataSchema(request.data);
        
        const prompt = `请基于以下数据和初步检测到的异常，提供更深入的异常分析。\n\n数据结构: ${JSON.stringify(dataSchema)}\n\n初步检测到的异常: ${JSON.stringify(anomalies.slice(0, 10))}\n\n请提供: 1) 异常的可能原因 2) 异常对数据分析的影响 3) 建议的处理方法 4) 额外的异常检测建议`;

        const response = await this.openaiClient.chat.completions.create({
          model: model.id,
          messages: [{ role: 'user', content: prompt }],
          temperature: request.options?.temperature || 0.3,
          max_tokens: request.options?.maxTokens || 1000
        });

        detection = {
          anomalies: anomalies,
          anomalyCount: anomalies.length,
          explanation: response.choices[0]?.message.content || '',
          confidenceScores: anomalies.map(() => 0.8) // 示例置信度
        };

        // 记录使用情况
        this.configService.recordUsage(AIProvider.OPENAI, DataOperation.DETECT_ANOMALIES, {
          prompt: response.usage?.prompt_tokens || 0,
          completion: response.usage?.completion_tokens || 0
        });
      } else {
        detection = {
          anomalies: anomalies,
          anomalyCount: anomalies.length,
          explanation: '使用统计方法检测到的异常',
          confidenceScores: anomalies.map(() => 0.7)
        };
      }

      return {
        success: true,
        operation: request.operation,
        result: detection,
        modelId: model.id,
        provider: model.provider
      };
    } catch (error) {
      logger.error('异常检测失败:', error);
      throw error;
    }
  }

  /**
   * 生成洞察
   */
  private async generateInsights(
    request: DataAnalysisRequest, 
    model: AIModelConfig
  ): Promise<DataAnalysisResponse> {
    try {
      let insights: DataInsight[] = [];

      if (model.provider === AIProvider.OPENAI && this.openaiClient) {
        const dataSchema = this.extractDataSchema(request.data);
        const sampleData = request.data.slice(0, 100);
        
        const prompt = `请分析以下数据并提供有价值的业务洞察。\n\n数据结构: ${JSON.stringify(dataSchema)}\n\n数据样本: ${JSON.stringify(sampleData)}\n\n请提供: 1) 3-5个关键业务洞察 2) 数据中的趋势和模式 3) 基于数据的建议 4) 潜在的商业机会\n\n请以JSON格式返回，其中每个洞察包含: {"title": "洞察标题", "description": "详细描述", "importance": "高/中/低", "evidence": "支持证据"}`;

        const response = await this.openaiClient.chat.completions.create({
          model: model.id,
          messages: [{ role: 'user', content: prompt }],
          temperature: request.options?.temperature || 0.7,
          max_tokens: request.options?.maxTokens || 1500
        });

        try {
          insights = JSON.parse(response.choices[0]?.message.content || '[]');
        } catch {
          // 如果解析失败，使用默认洞察
          insights = [{ title: '需要进一步分析', description: '无法从数据中提取结构化洞察', importance: '中', evidence: 'AI响应格式不正确' }];
        }

        // 记录使用情况
        this.configService.recordUsage(AIProvider.OPENAI, DataOperation.GENERATE_INSIGHTS, {
          prompt: response.usage?.prompt_tokens || 0,
          completion: response.usage?.completion_tokens || 0
        });
      } else {
        insights = [{ title: '基本统计洞察', description: '需要AI模型进行更深入的分析', importance: '低', evidence: '使用本地处理' }];
      }

      return {
        success: true,
        operation: request.operation,
        result: { insights },
        modelId: model.id,
        provider: model.provider
      };
    } catch (error) {
      logger.error('生成洞察失败:', error);
      throw error;
    }
  }

  /**
   * 建议可视化
   */
  private async suggestVisualizations(
    request: DataAnalysisRequest, 
    model: AIModelConfig
  ): Promise<DataAnalysisResponse> {
    try {
      let visualizations: DataVisualizationResult;

      if (model.provider === AIProvider.OPENAI && this.openaiClient) {
        const dataSchema = this.extractDataSchema(request.data);
        const sampleData = request.data.slice(0, 50);
        
        const prompt = `基于以下数据，请建议最适合的可视化方式。\n\n数据结构: ${JSON.stringify(dataSchema)}\n\n数据样本: ${JSON.stringify(sampleData)}\n\n请提供: 1) 3-5种建议的可视化类型 2) 每种可视化的目的和优势 3) 适合的图表配置 4) 可视化的预期发现`;

        const response = await this.openaiClient.chat.completions.create({
          model: model.id,
          messages: [{ role: 'user', content: prompt }],
          temperature: request.options?.temperature || 0.5,
          max_tokens: request.options?.maxTokens || 1000
        });

        visualizations = {
          suggestions: [
            { type: 'bar', purpose: '', columns: [], config: {} },
            { type: 'line', purpose: '', columns: [], config: {} },
            { type: 'pie', purpose: '', columns: [], config: {} }
          ],
          explanation: response.choices[0]?.message.content || ''
        };

        // 记录使用情况
        this.configService.recordUsage(AIProvider.OPENAI, DataOperation.VISUALIZE_SUGGEST, {
          prompt: response.usage?.prompt_tokens || 0,
          completion: response.usage?.completion_tokens || 0
        });
      } else {
        visualizations = {
          suggestions: [
            { type: 'table', purpose: '原始数据展示', columns: Object.keys(request.data[0] || {}), config: {} }
          ],
          explanation: '基本可视化建议'
        };
      }

      return {
        success: true,
        operation: request.operation,
        result: visualizations,
        modelId: model.id,
        provider: model.provider
      };
    } catch (error) {
      logger.error('建议可视化失败:', error);
      throw error;
    }
  }

  /**
   * 计算基本统计信息
   */
  private calculateBasicStats(data: any[]): Record<string, any> {
    if (!data || data.length === 0) return {};

    const stats: Record<string, any> = {};
    const firstRecord = data[0];

    Object.keys(firstRecord).forEach(key => {
      const values = data.map(item => item[key]).filter(val => val !== null && val !== undefined && val !== '');
      
      if (values.length === 0) return;

      // 检查是否为数值型数据
      const numericValues = values.filter(val => !isNaN(Number(val))).map(val => Number(val));
      
      if (numericValues.length > 0) {
        stats[key] = {
          type: 'numeric',
          count: values.length,
          mean: math.mean(numericValues),
          median: math.median(numericValues),
          min: math.min(numericValues),
          max: math.max(numericValues),
          std: math.std(numericValues),
          uniqueCount: new Set(values).size
        };
      } else {
        // 非数值型数据
        const counts = _.countBy(values);
        const sorted = Object.entries(counts).sort(([,a], [,b]) => b - a);
        
        stats[key] = {
          type: 'categorical',
          count: values.length,
          uniqueCount: Object.keys(counts).length,
          topValues: sorted.slice(0, 5).map(([value, count]) => ({ value, count }))
        };
      }
    });

    return stats;
  }

  /**
   * 提取数据模式
   */
  private extractDataSchema(data: any[]): Record<string, string> {
    if (!data || data.length === 0) return {};

    const schema: Record<string, string> = {};
    const firstRecord = data[0];

    Object.keys(firstRecord).forEach(key => {
      const sampleValues = data.slice(0, 10).map(item => item[key]).filter(val => val !== null && val !== undefined);
      
      if (sampleValues.length === 0) {
        schema[key] = 'unknown';
      } else if (sampleValues.every(val => !isNaN(Number(val)))) {
        schema[key] = 'number';
      } else if (sampleValues.every(val => this.isDate(val))) {
        schema[key] = 'date';
      } else {
        schema[key] = 'string';
      }
    });

    return schema;
  }

  /**
   * 检测日期
   */
  private isDate(value: any): boolean {
    if (typeof value !== 'string') return false;
    const date = new Date(value);
    return !isNaN(date.getTime());
  }

  /**
   * 统计异常检测
   */
  private detectStatisticalAnomalies(data: any[]): any[] {
    const anomalies: any[] = [];
    const schema = this.extractDataSchema(data);

    Object.entries(schema).forEach(([key, type]) => {
      if (type === 'number') {
        const values = data.map((item, index) => ({
          value: Number(item[key]),
          index
        })).filter(item => !isNaN(item.value));

        if (values.length > 0) {
          const numericValues = values.map(v => v.value);
          const mean = math.mean(numericValues);
          const std = math.std(numericValues);
          const threshold = 3; // 3标准差法则

          values.forEach(({ value, index }) => {
            if (Math.abs(value - mean) > threshold * std) {
              anomalies.push({
                recordIndex: index,
                column: key,
                value,
                type: 'statistical_outlier',
                reason: `值偏离平均值超过${threshold}个标准差`
              });
            }
          });
        }
      }
    });

    return anomalies;
  }
}