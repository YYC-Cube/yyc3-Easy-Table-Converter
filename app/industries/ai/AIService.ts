/**
 * @file AI服务接口
 * @description 为行业插件提供AI增强功能支持的核心接口
 * @module industries/ai
 * @author YYC
 * @version 1.0.0
 * @created 2024-01-01
 * @updated 2024-01-01
 */

/**
 * 多模态数据类型
 */
export interface MultiModalData {
  /**
   * 文本数据
   */
  text?: string;
  
  /**
   * 图像数据 (Base64或URL)
   */
  image?: string;
  
  /**
   * 音频数据 (Base64或URL)
   */
  audio?: string;
  
  /**
   * 视频数据 (Base64或URL)
   */
  video?: string;
  
  /**
   * 表格数据
   */
  tabular?: Record<string, any>[];
}

/**
 * 多模态分析选项
 */
export interface MultiModalAnalysisOptions {
  /**
   * 模型ID
   */
  modelId?: string;
  
  /**
   * 置信度阈值
   */
  confidenceThreshold?: number;
  
  /**
   * 关注的模态
   */
  focusModalities?: Array<'text' | 'image' | 'audio' | 'video' | 'tabular'>;
  
  /**
   * 输出格式
   */
  outputFormat?: 'text' | 'json' | 'markdown';
  
  /**
   * 是否启用跨模态理解
   */
  enableCrossModalUnderstanding?: boolean;
  
  /**
   * 是否启用合成
   */
  enableSynthesis?: boolean;
}

/**
 * 多模态分析结果
 */
export interface MultiModalAnalysisResult {
  /**
   * 综合结果
   */
  combinedResult?: string;
  
  /**
   * 各模态独立结果
   */
  individualResults?: {
    text?: any;
    image?: any;
    audio?: any;
    video?: any;
    tabular?: any;
  };
  
  /**
   * 跨模态关系
   */
  crossModalRelationships?: Array<{
    sourceModality: string;
    targetModality: string;
    relationship: string;
    confidence: number;
  }>;
  
  /**
   * 关键洞察
   */
  keyInsights?: string[];
  
  /**
   * 置信度
   */
  confidence?: number;
  
  /**
   * 处理时间
   */
  processedAt?: string;
}

/**
 * 多模态内容生成选项
 */
export interface MultiModalGenerationOptions {
  /**
   * 模型ID
   */
  modelId?: string;
  
  /**
   * 温度参数
   */
  temperature?: number;
  
  /**
   * 最大生成长度
   */
  maxLength?: number;
  
  /**
   * 目标模态
   */
  targetModality?: 'text' | 'image';
  
  /**
   * 引导尺度
   */
  guidanceScale?: number;
}

/**
 * AI服务接口定义
 * 提供各种AI增强功能的抽象接口
 */
export interface AIService {
  /**
   * 文本生成功能
   * @param prompt 提示文本
   * @param options 生成选项
   * @returns 生成的文本
   */
  generateText(prompt: string, options?: GenerateTextOptions): Promise<string>;
  
  /**
   * 图像识别功能
   * @param imageData 图像数据（Base64或URL）
   * @param options 识别选项
   * @returns 识别结果
   */
  recognizeImage(imageData: string, options?: RecognizeImageOptions): Promise<ImageRecognitionResult>;
  
  /**
   * 自然语言理解
   * @param text 要分析的文本
   * @param options 理解选项
   * @returns 理解结果
   */
  understandText(text: string, options?: UnderstandTextOptions): Promise<TextUnderstandingResult>;
  
  /**
   * 预测分析
   * @param data 输入数据
   * @param modelId 模型ID
   * @param options 预测选项
   * @returns 预测结果
   */
  predict(data: any, modelId: string, options?: PredictOptions): Promise<PredictionResult>;
  
  /**
   * 数据分类
   * @param data 要分类的数据
   * @param categories 分类类别
   * @param options 分类选项
   * @returns 分类结果
   */
  classify(data: any, categories: string[], options?: ClassifyOptions): Promise<ClassificationResult>;
  
  /**
   * 情感分析
   * @param text 要分析的文本
   * @param options 分析选项
   * @returns 情感分析结果
   */
  analyzeSentiment(text: string, options?: AnalyzeSentimentOptions): Promise<SentimentAnalysisResult>;
  
  /**
   * 问答功能
   * @param question 问题
   * @param context 上下文信息
   * @param options 问答选项
   * @returns 回答结果
   */
  answerQuestion(question: string, context?: string, options?: AnswerQuestionOptions): Promise<QuestionAnswerResult>;
  
  /**
   * 健康检查
   * @returns 服务健康状态
   */
  healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details?: any }>;
}

/**
 * 多模态AI服务接口
 */
export interface MultiModalAIService extends AIService {
  /**
   * 分析多模态数据
   * @param data 多模态数据
   * @param options 分析选项
   * @returns 分析结果
   */
  analyzeMultiModal(data: MultiModalData, options?: MultiModalAnalysisOptions): Promise<MultiModalAnalysisResult>;

  /**
   * 基于多模态上下文生成内容
   * @param prompt 提示文本
   * @param context 多模态上下文
   * @param options 生成选项
   * @returns 生成结果
   */
  generateFromMultiModal(
    prompt: string,
    context: MultiModalData,
    options?: MultiModalGenerationOptions
  ): Promise<string | MultiModalData>;

  /**
   * 跨模态检索
   * @param query 查询内容
   * @param queryModality 查询模态
   * @param targetModality 目标模态
   * @param corpus 检索语料库
   * @param options 检索选项
   * @returns 检索结果
   */
  crossModalRetrieval(
    query: any,
    queryModality: 'text' | 'image' | 'audio',
    targetModality: 'text' | 'image' | 'audio',
    corpus: Array<{ id: string; data: MultiModalData }>,
    options?: { topK?: number; confidenceThreshold?: number }
  ): Promise<Array<{ id: string; score: number; data: MultiModalData }>>;

  /**
   * 获取可用的多模态模型
   * @returns 模型列表
   */
  getAvailableMultiModalModels(): Array<{ id: string; name: string; capabilities: string[] }>;
}

/**
 * 文本生成选项
 */
export interface GenerateTextOptions {
  maxLength?: number;
  temperature?: number;
  topP?: number;
  stopSequences?: string[];
  modelId?: string;
  format?: 'text' | 'json' | 'markdown';
}

/**
 * 图像识别选项
 */
export interface RecognizeImageOptions {
  modelId?: string;
  confidenceThreshold?: number;
  maxResults?: number;
  features?: string[];
}

/**
 * 图像识别结果
 */
export interface ImageRecognitionResult {
  objects?: Array<{
    name: string;
    confidence: number;
    boundingBox?: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  }>;
  labels?: Array<{
    name: string;
    confidence: number;
  }>;
  text?: string;
  description?: string;
  confidence?: number;
}

/**
 * 文本理解选项
 */
export interface UnderstandTextOptions {
  extractEntities?: boolean;
  extractKeywords?: boolean;
  summarize?: boolean;
  modelId?: string;
  language?: string;
}

/**
 * 文本理解结果
 */
export interface TextUnderstandingResult {
  entities?: Array<{
    text: string;
    type: string;
    confidence: number;
  }>;
  keywords?: Array<{
    text: string;
    score: number;
  }>;
  summary?: string;
  language?: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
}

/**
 * 预测选项
 */
export interface PredictOptions {
  confidenceThreshold?: number;
  includeProbabilities?: boolean;
  explainable?: boolean;
  inputFormat?: string;
  outputFormat?: string;
}

/**
 * 预测结果
 */
export interface PredictionResult {
  prediction: any;
  confidence?: number;
  probabilities?: Record<string, number>;
  explanation?: string;
  modelInfo?: {
    id: string;
    version: string;
  };
}

/**
 * 分类选项
 */
export interface ClassifyOptions {
  multiLabel?: boolean;
  confidenceThreshold?: number;
  modelId?: string;
}

/**
 * 分类结果
 */
export interface ClassificationResult {
  categories: Array<{
    category: string;
    confidence: number;
  }>;
  topCategory?: string;
  confidence?: number;
}

/**
 * 情感分析选项
 */
export interface AnalyzeSentimentOptions {
  modelId?: string;
  language?: string;
  granularity?: 'document' | 'sentence' | 'entity';
}

/**
 * 情感分析结果
 */
export interface SentimentAnalysisResult {
  sentiment: 'positive' | 'negative' | 'neutral';
  score: number;
  details?: Array<{
    text: string;
    sentiment: 'positive' | 'negative' | 'neutral';
    score: number;
    startOffset?: number;
    endOffset?: number;
  }>;
}

/**
 * 问答选项
 */
export interface AnswerQuestionOptions {
  modelId?: string;
  maxAnswers?: number;
  temperature?: number;
  confidenceThreshold?: number;
}

/**
 * 问答结果
 */
export interface QuestionAnswerResult {
  answer: string;
  confidence?: number;
  source?: string;
  context?: string;
  alternatives?: Array<{
    answer: string;
    confidence: number;
  }>;
}

/**
 * AI服务工厂接口
 */
export interface AIServiceFactory {
  /**
   * 创建AI服务实例
   * @param config 配置参数
   * @returns AI服务实例
   */
  createService(config: AIServiceConfig): AIService;
  
  /**
   * 获取可用的模型列表
   * @returns 模型列表
   */
  getAvailableModels(): Array<{
    id: string;
    name: string;
    type: string;
    capabilities: string[];
  }>;
}

/**
 * 多模态AI服务工厂接口
 */
export interface MultiModalAIServiceFactory extends AIServiceFactory {
  /**
   * 创建多模态AI服务实例
   * @param config 配置参数
   * @returns 多模态AI服务实例
   */
  createService(config: AIServiceConfig): MultiModalAIService;
}

/**
 * AI服务配置
 */
export interface AIServiceConfig {
  provider?: string;
  apiKey?: string;
  baseUrl?: string;
  defaultModelId?: string;
  timeout?: number;
  retryCount?: number;
  maxConcurrentRequests?: number;
  cacheEnabled?: boolean;
  cacheTTL?: number;
  loggingEnabled?: boolean;
}

/**
 * 默认AI服务实现（模拟版本）
 */
export class DefaultAIService implements AIService {
  protected config: AIServiceConfig;
  private cache: Map<string, { data: any; timestamp: number }>;
  
  constructor(config: AIServiceConfig = {}) {
    this.config = {
      provider: 'default',
      timeout: 30000,
      retryCount: 3,
      maxConcurrentRequests: 10,
      cacheEnabled: true,
      cacheTTL: 3600000, // 1小时
      loggingEnabled: true,
      ...config
    };
    this.cache = new Map();
  }
  
  async generateText(prompt: string, options: GenerateTextOptions = {}): Promise<string> {
    // 缓存键
    const cacheKey = this.getCacheKey('generateText', { prompt, options });
    
    // 尝试从缓存获取
    if (this.config.cacheEnabled) {
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;
    }
    
    // 模拟生成文本
    console.log(`[AI Service] 生成文本: ${prompt.substring(0, 50)}...`);
    
    // 模拟延迟
    await this.sleep(300);
    
    // 简单的模拟生成
    const result = `模拟生成的文本响应。基于提示: "${prompt.substring(0, 100)}"...`;
    
    // 缓存结果
    if (this.config.cacheEnabled) {
      this.setCache(cacheKey, result);
    }
    
    return result;
  }
  
  async recognizeImage(imageData: string, options: RecognizeImageOptions = {}): Promise<ImageRecognitionResult> {
    const cacheKey = this.getCacheKey('recognizeImage', { imageData, options });
    
    if (this.config.cacheEnabled) {
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;
    }
    
    console.log('[AI Service] 识别图像...');
    await this.sleep(500);
    
    // 模拟图像识别结果
    const result: ImageRecognitionResult = {
      objects: [
        { name: '植物', confidence: 0.92 },
        { name: '叶子', confidence: 0.88 }
      ],
      labels: [
        { name: '绿色植物', confidence: 0.95 },
        { name: '自然', confidence: 0.85 },
        { name: '叶子', confidence: 0.88 }
      ],
      description: '这是一张展示绿色植物叶子的图像'
    };
    
    if (this.config.cacheEnabled) {
      this.setCache(cacheKey, result);
    }
    
    return result;
  }
  
  async understandText(text: string, options: UnderstandTextOptions = {}): Promise<TextUnderstandingResult> {
    const cacheKey = this.getCacheKey('understandText', { text, options });
    
    if (this.config.cacheEnabled) {
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;
    }
    
    console.log(`[AI Service] 理解文本: ${text.substring(0, 50)}...`);
    await this.sleep(200);
    
    // 模拟文本理解结果
    const result: TextUnderstandingResult = {
      entities: [
        { text: '植物', type: '生物', confidence: 0.9 },
        { text: '病虫害', type: '问题', confidence: 0.85 }
      ],
      keywords: [
        { text: '植物健康', score: 0.9 },
        { text: '病虫害防治', score: 0.85 },
        { text: '作物产量', score: 0.8 }
      ],
      summary: '这是一段关于植物健康和病虫害防治的文本',
      sentiment: 'neutral'
    };
    
    if (this.config.cacheEnabled) {
      this.setCache(cacheKey, result);
    }
    
    return result;
  }
  
  async predict(_data: any, modelId: string, _options: PredictOptions = {}): Promise<PredictionResult> {
    console.log(`[AI Service] 进行预测: 模型=${modelId}`);
    await this.sleep(400);
    
    // 模拟预测结果
    return {
      prediction: {
        value: 78.5,
        category: 'high'
      },
      confidence: 0.85,
      modelInfo: {
        id: modelId,
        version: '1.0.0'
      }
    };
  }
  
  async classify(_data: any, categories: string[], _options: ClassifyOptions = {}): Promise<ClassificationResult> {
    console.log(`[AI Service] 进行分类: ${categories.join(', ')}`);
    await this.sleep(300);
    
    // 模拟分类结果
    return {
      categories: categories.map((cat, index) => ({
        category: cat,
        confidence: Math.max(0, 0.8 - (index * 0.1)) + Math.random() * 0.1
      })),
      topCategory: categories[0],
      confidence: 0.85
    };
  }
  
  async analyzeSentiment(text: string, options: AnalyzeSentimentOptions = {}): Promise<SentimentAnalysisResult> {
    const cacheKey = this.getCacheKey('analyzeSentiment', { text, options });
    
    if (this.config.cacheEnabled) {
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;
    }
    
    console.log(`[AI Service] 分析情感: ${text.substring(0, 50)}...`);
    await this.sleep(200);
    
    // 简单的情感分析模拟
    let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
    let score = 0;
    
    const positiveWords = ['好', '成功', '高', '增长', '优秀'];
    const negativeWords = ['差', '失败', '低', '减少', '问题'];
    
    const positiveCount = positiveWords.filter(w => text.includes(w)).length;
    const negativeCount = negativeWords.filter(w => text.includes(w)).length;
    
    if (positiveCount > negativeCount) {
      sentiment = 'positive';
      score = 0.5 + (positiveCount * 0.1);
    } else if (negativeCount > positiveCount) {
      sentiment = 'negative';
      score = -0.5 - (negativeCount * 0.1);
    }
    
    const result: SentimentAnalysisResult = {
      sentiment,
      score: Math.min(1, Math.max(-1, score))
    };
    
    if (this.config.cacheEnabled) {
      this.setCache(cacheKey, result);
    }
    
    return result;
  }
  
  async answerQuestion(question: string, context: string = '', options: AnswerQuestionOptions = {}): Promise<QuestionAnswerResult> {
    const cacheKey = this.getCacheKey('answerQuestion', { question, context, options });
    
    if (this.config.cacheEnabled) {
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;
    }
    
    console.log(`[AI Service] 回答问题: ${question}`);
    await this.sleep(500);
    
    // 模拟回答
    const result: QuestionAnswerResult = {
      answer: `这是一个模拟的回答，针对问题: "${question}"${context ? '，基于提供的上下文信息。' : '。'}`,
      confidence: 0.85,
      source: context || '默认知识库'
    };
    
    if (this.config.cacheEnabled) {
      this.setCache(cacheKey, result);
    }
    
    return result;
  }
  
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details?: any }> {
    return {
      status: 'healthy',
      details: {
        version: '1.0.0',
        uptime: process.uptime(),
        lastCheck: new Date().toISOString()
      }
    };
  }
  
  // 辅助方法
  protected getCacheKey(method: string, params: any): string {
    return `${method}:${JSON.stringify(params)}`;
  }
  
  protected getFromCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    
    // 检查缓存是否过期
    if (Date.now() - cached.timestamp > this.config.cacheTTL!) {
      this.cache.delete(key);
      return null;
    }
    
    return cached.data;
  }
  
  protected setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
    
    // 清理过期缓存
    this.cleanupCache();
  }
  
  private cleanupCache(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.config.cacheTTL!) {
        this.cache.delete(key);
      }
    }
  }
  
  protected async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * AI服务管理器
 */
export class AIServiceManager {
  private static instance: AIServiceManager;
  private services: Map<string, AIService>;
  private defaultService: AIService;
  private factories: Map<string, AIServiceFactory>;
  
  private constructor() {
    this.services = new Map();
    this.factories = new Map();
    this.defaultService = new DefaultAIService();
  }
  
  /**
   * 获取管理器实例
   */
  public static getInstance(): AIServiceManager {
    if (!AIServiceManager.instance) {
      AIServiceManager.instance = new AIServiceManager();
    }
    return AIServiceManager.instance;
  }
  
  /**
   * 注册AI服务
   * @param name 服务名称
   * @param service 服务实例
   */
  public registerService(name: string, service: AIService): void {
    this.services.set(name, service);
    console.log(`[AI Manager] 注册服务: ${name}`);
  }
  
  /**
   * 注册服务工厂
   * @param factory 工厂
   */
  public registerFactory(factory: AIServiceFactory): void {
    this.factories.set(factory.getAvailableModels()[0]?.type || 'default', factory);
  }
  
  /**
   * 获取AI服务
   * @param name 服务名称（可选）
   * @returns AI服务实例
   */
  public getService(name?: string): AIService {
    if (name && this.services.has(name)) {
      return this.services.get(name)!;
    }
    return this.defaultService;
  }
  
  /**
   * 获取多模态AI服务
   * @param name 服务名称（可选）
   * @param config 配置参数（可选）
   * @returns 多模态AI服务实例
   */
  public getMultiModalService(name?: string, config?: AIServiceConfig): MultiModalAIService {
    // 如果指定了名称且存在，尝试强制转换（风险操作）
    if (name && this.services.has(name)) {
      return this.services.get(name) as MultiModalAIService;
    }
    
    // 查找多模态服务工厂
    for (const [_type, factory] of this.factories.entries()) {
      // 使用属性检查代替instanceof检查类型
      if (factory && typeof factory === 'object' && 'createService' in factory) {
        // 进行类型断言，确保返回MultiModalAIService类型
        return factory.createService(config || {}) as MultiModalAIService;
      }
    }
    
    // 如果没有找到，使用默认实现（在实际应用中应该抛出错误或提供专门的多模态实现）
    throw new Error('未找到可用的多模态AI服务实现');
  }
  
  /**
   * 获取所有可用服务
   * @returns 服务名称列表
   */
  public getAvailableServices(): string[] {
    return Array.from(this.services.keys());
  }
  
  /**
   * 检查所有服务健康状态
   * @returns 健康检查结果
   */
  public async checkAllServices(): Promise<Map<string, { status: string; details?: any }>> {
    const results = new Map<string, { status: string; details?: any }>();
    
    // 检查默认服务
    const defaultStatus = await this.defaultService.healthCheck();
    results.set('default', defaultStatus);
    
    // 检查所有注册的服务
    for (const [name, service] of this.services.entries()) {
      try {
        const status = await service.healthCheck();
        results.set(name, status);
      } catch (error) {
        results.set(name, { status: 'error', details: String(error) });
      }
    }
    
    return results;
  }
  
  /**
   * 清理所有服务
   */
  public clear(): void {
    this.services.clear();
    console.log('[AI Manager] 清理所有服务');
  }
}

// 导出默认实例
export const aiServiceManager = AIServiceManager.getInstance();
export const defaultAIService = new DefaultAIService();
