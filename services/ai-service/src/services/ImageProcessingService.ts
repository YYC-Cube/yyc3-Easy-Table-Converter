/**
 * @file AI图像处理服务
 * @description 提供图像分析、识别、分类、转换等AI图像处理功能
 * @module services/ImageProcessingService
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-23
 */

import { 
  ImageProcessingRequest, 
  ImageProcessingResponse, 
  ImageOperation, 
  AIProvider, 
  AIModelConfig,
  ImageAnalysisResult,
  ImageClassificationResult,
  ObjectDetectionResult,
  TextExtractionResult
} from '../types';
import { logger } from '../utils/logger';
import { AIConfigService } from './AIConfigService';
import OpenAI from 'openai';
import { HfInference } from '@huggingface/inference';
import * as fs from 'fs';
import * as path from 'path';

/**
 * AI图像处理服务类
 */
export class ImageProcessingService {
  private configService: AIConfigService;
  private openaiClient: OpenAI | null = null;
  private hfClient: HfInference | null = null;
  private tempDir: string;

  /**
   * 构造函数
   */
  constructor() {
    this.configService = AIConfigService.getInstance();
    this.initializeClients();
    this.tempDir = path.join(__dirname, '../../temp');
    this.ensureTempDirectory();
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
      logger.info('OpenAI图像处理客户端初始化成功');
    }

    const hfConfig = this.configService.getProviderConfig(AIProvider.HUGGINGFACE);
    if (hfConfig && hfConfig.apiKey) {
      this.hfClient = new HfInference(hfConfig.apiKey);
      logger.info('Hugging Face图像处理客户端初始化成功');
    }
  }

  /**
   * 确保临时目录存在
   */
  private ensureTempDirectory(): void {
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  /**
   * 处理图像请求
   */
  public async processImage(request: ImageProcessingRequest): Promise<ImageProcessingResponse> {
    try {
      logger.info(`处理图像请求: ${request.operation}`, { 
        modelId: request.modelId,
        provider: request.provider,
        imageType: request.imageData ? 'base64' : 'url'
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
        case ImageOperation.ANALYZE:
          return await this.analyzeImage(request, model);
        case ImageOperation.CLASSIFY:
          return await this.classifyImage(request, model);
        case ImageOperation.DETECT_OBJECTS:
          return await this.detectObjects(request, model);
        case ImageOperation.EXTRACT_TEXT:
          return await this.extractText(request, model);
        case ImageOperation.ENHANCE:
          return await this.enhanceImage(request, model);
        default:
          throw new Error(`不支持的操作: ${request.operation}`);
      }
    } catch (error) {
      logger.error(`图像处理失败: ${error instanceof Error ? error.message : String(error)}`, {
        operation: request.operation,
        error: error
      });
      throw error;
    }
  }

  /**
   * 获取推荐模型
   */
  private getRecommendedModel(operation: ImageOperation): AIModelConfig | undefined {
    const availableModels = this.configService.getModelsByType('image');
    
    // 根据操作类型推荐不同的模型
    switch (operation) {
      case ImageOperation.ANALYZE:
      case ImageOperation.EXTRACT_TEXT:
        // 这些操作需要多模态模型
        return availableModels.find(m => m.id === 'gpt-4') || availableModels[0];
      case ImageOperation.CLASSIFY:
      case ImageOperation.DETECT_OBJECTS:
        // 分类和检测任务可以使用专用模型
        return availableModels.find(m => m.id.includes('vit') || m.id.includes('yolo')) || availableModels[0];
      case ImageOperation.ENHANCE:
        // 图像增强需要特定模型
        return availableModels[0];
      default:
        return availableModels[0];
    }
  }

  /**
   * 分析图像
   */
  private async analyzeImage(
    request: ImageProcessingRequest, 
    model: AIModelConfig
  ): Promise<ImageProcessingResponse> {
    try {
      let analysis: ImageAnalysisResult;

      if (model.provider === AIProvider.OPENAI && this.openaiClient && model.id.includes('gpt-4')) {
        const imageContent = request.imageUrl ? 
          [{ type: 'image_url', image_url: { url: request.imageUrl } }] :
          [{ type: 'image_url', image_url: { url: `data:image/jpeg;base64,${request.imageData}` } }];

        const prompt = request.prompt || "请详细描述这张图像的内容，包括主要元素、场景、颜色、风格等。";

        const response = await this.openaiClient.chat.completions.create({
          model: model.id,
          messages: [{
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              ...imageContent
            ]
          }],
          temperature: request.options?.temperature || 0.3,
          max_tokens: request.options?.maxTokens || 1000
        });

        analysis = {
          description: response.choices[0]?.message.content || '',
          elements: [], // 需要进一步解析
          colors: [], // 需要进一步解析
          style: '' // 需要进一步解析
        };

        // 记录使用情况
        this.configService.recordUsage(AIProvider.OPENAI, ImageOperation.ANALYZE, {
          prompt: response.usage?.prompt_tokens || 0,
          completion: response.usage?.completion_tokens || 0
        });
      } else {
        throw new Error('当前仅支持GPT-4进行图像分析');
      }

      return {
        success: true,
        operation: request.operation,
        result: analysis,
        modelId: model.id,
        provider: model.provider
      };
    } catch (error) {
      logger.error('图像分析失败:', error);
      throw error;
    }
  }

  /**
   * 分类图像
   */
  private async classifyImage(
    request: ImageProcessingRequest, 
    model: AIModelConfig
  ): Promise<ImageProcessingResponse> {
    try {
      let classification: ImageClassificationResult;

      if (model.provider === AIProvider.HUGGINGFACE && this.hfClient) {
        let imageData: string | Buffer;
        
        if (request.imageUrl) {
          // 从URL获取图像
          const response = await fetch(request.imageUrl);
          imageData = await response.arrayBuffer();
          imageData = Buffer.from(imageData);
        } else if (request.imageData) {
          // 使用base64编码的图像
          imageData = Buffer.from(request.imageData, 'base64');
        } else {
          throw new Error('必须提供imageUrl或imageData');
        }

        const response = await this.hfClient.imageClassification({
          model: model.defaultConfig?.model || 'google/vit-base-patch16-224',
          data: imageData
        });

        classification = {
          classes: response.map(item => ({
            label: item.label,
            score: item.score
          })),
          topClass: response[0]?.label || 'unknown',
          confidence: response[0]?.score || 0
        };
      } else if (model.provider === AIProvider.OPENAI && this.openaiClient) {
        // 使用OpenAI进行图像分类
        const imageContent = request.imageUrl ? 
          [{ type: 'image_url', image_url: { url: request.imageUrl } }] :
          [{ type: 'image_url', image_url: { url: `data:image/jpeg;base64,${request.imageData}` } }];

        const prompt = "请将这张图像分类，并返回可能的类别及其置信度（0-1之间）。以JSON格式返回：{\"classes\":[{\"label\":\"类别1\",\"score\":0.9},{\"label\":\"类别2\",\"score\":0.8}]}。";

        const response = await this.openaiClient.chat.completions.create({
          model: 'gpt-4',
          messages: [{
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              ...imageContent
            ]
          }],
          temperature: 0.0,
          max_tokens: 200
        });

        try {
          const parsed = JSON.parse(response.choices[0]?.message.content || '{"classes":[]}');
          classification = {
            classes: parsed.classes || [],
            topClass: parsed.classes?.[0]?.label || 'unknown',
            confidence: parsed.classes?.[0]?.score || 0
          };
        } catch {
          classification = {
            classes: [],
            topClass: 'unknown',
            confidence: 0
          };
        }

        // 记录使用情况
        this.configService.recordUsage(AIProvider.OPENAI, ImageOperation.CLASSIFY, {
          prompt: response.usage?.prompt_tokens || 0,
          completion: response.usage?.completion_tokens || 0
        });
      } else {
        throw new Error('当前提供商不支持图像分类功能');
      }

      return {
        success: true,
        operation: request.operation,
        result: classification,
        modelId: model.id,
        provider: model.provider
      };
    } catch (error) {
      logger.error('图像分类失败:', error);
      throw error;
    }
  }

  /**
   * 检测对象
   */
  private async detectObjects(
    request: ImageProcessingRequest, 
    model: AIModelConfig
  ): Promise<ImageProcessingResponse> {
    try {
      let detection: ObjectDetectionResult;

      if (model.provider === AIProvider.HUGGINGFACE && this.hfClient) {
        let imageData: string | Buffer;
        
        if (request.imageUrl) {
          const response = await fetch(request.imageUrl);
          imageData = await response.arrayBuffer();
          imageData = Buffer.from(imageData);
        } else if (request.imageData) {
          imageData = Buffer.from(request.imageData, 'base64');
        } else {
          throw new Error('必须提供imageUrl或imageData');
        }

        // 使用对象检测模型
        const response = await this.hfClient.objectDetection({
          model: model.defaultConfig?.model || 'facebook/detr-resnet-50',
          data: imageData
        });

        detection = {
          objects: response.map(obj => ({
            label: obj.label,
            score: obj.score,
            box: {
              xmin: obj.box.xmin,
              ymin: obj.box.ymin,
              xmax: obj.box.xmax,
              ymax: obj.box.ymax
            }
          }))
        };
      } else {
        throw new Error('当前仅支持Hugging Face进行对象检测');
      }

      return {
        success: true,
        operation: request.operation,
        result: detection,
        modelId: model.id,
        provider: model.provider
      };
    } catch (error) {
      logger.error('对象检测失败:', error);
      throw error;
    }
  }

  /**
   * 提取文本
   */
  private async extractText(
    request: ImageProcessingRequest, 
    model: AIModelConfig
  ): Promise<ImageProcessingResponse> {
    try {
      let textExtraction: TextExtractionResult;

      if (model.provider === AIProvider.OPENAI && this.openaiClient && model.id.includes('gpt-4')) {
        const imageContent = request.imageUrl ? 
          [{ type: 'image_url', image_url: { url: request.imageUrl } }] :
          [{ type: 'image_url', image_url: { url: `data:image/jpeg;base64,${request.imageData}` } }];

        const prompt = "请提取图像中的所有文本内容，并尽可能保持原始格式和布局。如果有表格，请尝试以JSON格式表示表格数据。";

        const response = await this.openaiClient.chat.completions.create({
          model: model.id,
          messages: [{
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              ...imageContent
            ]
          }],
          temperature: 0.0,
          max_tokens: request.options?.maxTokens || 2000
        });

        textExtraction = {
          text: response.choices[0]?.message.content || '',
          formattedText: '', // 需要进一步解析
          confidence: 0.9
        };

        // 记录使用情况
        this.configService.recordUsage(AIProvider.OPENAI, ImageOperation.EXTRACT_TEXT, {
          prompt: response.usage?.prompt_tokens || 0,
          completion: response.usage?.completion_tokens || 0
        });
      } else {
        throw new Error('当前仅支持GPT-4进行文本提取');
      }

      return {
        success: true,
        operation: request.operation,
        result: textExtraction,
        modelId: model.id,
        provider: model.provider
      };
    } catch (error) {
      logger.error('文本提取失败:', error);
      throw error;
    }
  }

  /**
   * 增强图像
   */
  private async enhanceImage(
    request: ImageProcessingRequest, 
    model: AIModelConfig
  ): Promise<ImageProcessingResponse> {
    try {
      // 图像增强功能（示例实现，实际需要更复杂的处理）
      // 这里可以使用超分辨率模型、去噪模型等
      const enhancedImage = {
        imageData: request.imageData || '', // 示例：保持原样
        width: request.options?.targetWidth || 0,
        height: request.options?.targetHeight || 0,
        enhancementType: request.options?.enhancementType || 'basic'
      };

      return {
        success: true,
        operation: request.operation,
        result: enhancedImage,
        modelId: model.id,
        provider: model.provider
      };
    } catch (error) {
      logger.error('图像增强失败:', error);
      throw error;
    }
  }

  /**
   * 保存临时图像
   */
  private saveTempImage(base64Data: string, filename: string): string {
    const buffer = Buffer.from(base64Data, 'base64');
    const filePath = path.join(this.tempDir, filename);
    fs.writeFileSync(filePath, buffer);
    return filePath;
  }

  /**
   * 删除临时图像
   */
  private deleteTempImage(filePath: string): void {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  /**
   * 验证图像格式
   */
  public isValidImageFormat(format: string): boolean {
    const allowedFormats = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'tiff'];
    return allowedFormats.includes(format.toLowerCase());
  }

  /**
   * 获取图像信息
   */
  public async getImageInfo(imageData: string): Promise<{ width: number; height: number; format: string }> {
    // 示例实现，实际需要使用图像处理库如sharp或jimp
    return { width: 0, height: 0, format: 'unknown' };
  }
}