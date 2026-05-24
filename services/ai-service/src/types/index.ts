/**
 * @file AI服务类型定义
 * @description 定义AI服务中使用的所有接口、类型和常量
 * @module types
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-23
 */

// 通用类型定义

/**
 * AI服务响应基础接口
 */
export interface AIResponseBase {
  success: boolean;
  message?: string;
  error?: string;
  timestamp: string;
  processingTime?: number;
}

/**
 * AI配置选项
 */
export interface AIConfigOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  apiKey?: string;
  provider?: AIProvider;
}

/**
 * AI服务提供商枚举
 */
export enum AIProvider {
  OPENAI = 'openai',
  HUGGINGFACE = 'huggingface',
  LOCAL = 'local',
  CUSTOM = 'custom'
}

/**
 * 处理优先级枚举
 */
export enum ProcessingPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// 文本处理相关类型

/**
 * 文本处理请求接口
 */
export interface TextProcessingRequest {
  text: string;
  operation: TextOperation;
  options?: TextProcessingOptions;
  priority?: ProcessingPriority;
}

/**
 * 文本处理响应接口
 */
export interface TextProcessingResponse extends AIResponseBase {
  result?: {
    processedText: string;
    statistics?: TextStatistics;
    suggestions?: string[];
    entities?: TextEntity[];
  };
}

/**
 * 文本操作类型枚举
 */
export enum TextOperation {
  SUMMARIZE = 'summarize',
  TRANSLATE = 'translate',
  CORRECT = 'correct',
  ENHANCE = 'enhance',
  EXTRACT_KEYWORDS = 'extract_keywords',
  CLASSIFY = 'classify',
  GENERATE = 'generate',
  ANALYZE_SENTIMENT = 'analyze_sentiment',
  PARSE_TABLE = 'parse_table',
  FORMAT_CONVERT = 'format_convert'
}

/**
 * 文本处理选项
 */
export interface TextProcessingOptions extends AIConfigOptions {
  targetLanguage?: string; // 翻译目标语言
  maxLength?: number; // 最大长度限制
  minLength?: number; // 最小长度限制
  style?: 'formal' | 'casual' | 'professional' | 'friendly'; // 文本风格
  tone?: 'positive' | 'neutral' | 'negative' | 'professional'; // 文本语调
  categorySchema?: string[]; // 分类模式
  keywordsCount?: number; // 提取关键词数量
  formatOptions?: {
    inputFormat?: string;
    outputFormat?: string;
  };
}

/**
 * 文本统计信息
 */
export interface TextStatistics {
  originalLength: number;
  processedLength: number;
  wordCount: number;
  sentenceCount: number;
  paragraphCount: number;
}

/**
 * 文本实体信息
 */
export interface TextEntity {
  type: string;
  text: string;
  start: number;
  end: number;
  confidence?: number;
  metadata?: Record<string, any>;
}

// 图像处理相关类型

/**
 * 图像处理请求接口
 */
export interface ImageProcessingRequest {
  image: string; // Base64编码的图像数据
  operation: ImageOperation;
  options?: ImageProcessingOptions;
  priority?: ProcessingPriority;
}

/**
 * 图像处理响应接口
 */
export interface ImageProcessingResponse extends AIResponseBase {
  result?: {
    processedImage?: string; // Base64编码的处理后图像
    analysisResults?: ImageAnalysisResult[];
    detectedObjects?: DetectedObject[];
    extractedText?: string;
    imageMetadata?: ImageMetadata;
  };
}

/**
 * 图像操作类型枚举
 */
export enum ImageOperation {
  ANALYZE = 'analyze',
  ENHANCE = 'enhance',
  RESIZE = 'resize',
  CROP = 'crop',
  ROTATE = 'rotate',
  FILTER = 'filter',
  EXTRACT_TEXT = 'extract_text',
  DETECT_OBJECTS = 'detect_objects',
  RECOGNIZE_TABLES = 'recognize_tables',
  CONVERT_FORMAT = 'convert_format',
  GENERATE_THUMBNAIL = 'generate_thumbnail'
}

/**
 * 图像处理选项
 */
export interface ImageProcessingOptions extends AIConfigOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp' | 'avif';
  rotateAngle?: number;
  filterType?: 'grayscale' | 'sepia' | 'blur' | 'sharpen' | 'brightness';
  filterIntensity?: number;
  crop?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  textExtractionOptions?: {
    language?: string;
    detectOrientation?: boolean;
    recognizeTables?: boolean;
  };
}

/**
 * 图像分析结果
 */
export interface ImageAnalysisResult {
  label: string;
  score: number;
  category?: string;
}

/**
 * 检测到的对象
 */
export interface DetectedObject {
  class: string;
  confidence: number;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

/**
 * 图像元数据
 */
export interface ImageMetadata {
  originalWidth: number;
  originalHeight: number;
  processedWidth: number;
  processedHeight: number;
  format: string;
  size: number;
  mimeType: string;
}

// 数据分析相关类型

/**
 * 数据分析请求接口
 */
export interface DataAnalysisRequest {
  data: any[] | string; // 数据数组或JSON字符串
  operation: DataOperation;
  options?: DataAnalysisOptions;
  priority?: ProcessingPriority;
}

/**
 * 数据分析响应接口
 */
export interface DataAnalysisResponse extends AIResponseBase {
  result?: {
    analysis?: any;
    insights?: DataInsight[];
    patterns?: DataPattern[];
    recommendations?: string[];
    visualization?: VisualizationConfig;
    processedData?: any;
  };
}

/**
 * 数据操作类型枚举
 */
export enum DataOperation {
  ANALYZE = 'analyze',
  GENERATE_INSIGHTS = 'generate_insights',
  DETECT_PATTERNS = 'detect_patterns',
  SUMMARIZE = 'summarize',
  CLEANSE = 'cleanse',
  TRANSFORM = 'transform',
  RECOMMEND = 'recommend',
  VISUALIZE = 'visualize',
  PREDICT = 'predict',
  CLUSTER = 'cluster',
  OPTIMIZE = 'optimize',
  CONVERT_FORMAT = 'convert_format'
}

/**
 * 数据分析选项
 */
export interface DataAnalysisOptions extends AIConfigOptions {
  targetFormat?: string;
  fieldsToAnalyze?: string[];
  ignoreFields?: string[];
  groupingFields?: string[];
  aggregationMethod?: 'sum' | 'average' | 'min' | 'max' | 'count';
  dateField?: string;
  timeRange?: {
    start: string;
    end: string;
  };
  visualizationType?: 'bar' | 'line' | 'pie' | 'scatter' | 'heatmap' | 'table';
  predictionTarget?: string;
  predictionFeatures?: string[];
  cleansingOptions?: {
    removeDuplicates?: boolean;
    fixMissingValues?: boolean;
    normalizeData?: boolean;
  };
}

/**
 * 数据洞察
 */
export interface DataInsight {
  title: string;
  description: string;
  importance: number;
  confidence?: number;
  supportingData?: any[];
}

/**
 * 数据模式
 */
export interface DataPattern {
  type: string;
  description: string;
  evidence: any[];
  strength: number;
}

/**
 * 可视化配置
 */
export interface VisualizationConfig {
  type: string;
  data: any;
  options?: {
    title?: string;
    xLabel?: string;
    yLabel?: string;
    colors?: string[];
    dimensions?: {
      width?: number;
      height?: number;
    };
  };
}

// AI配置相关类型

/**
 * AI模型配置接口
 */
export interface AIModelConfig {
  id: string;
  name: string;
  provider: AIProvider;
  type: 'text' | 'image' | 'data' | 'multi';
  capabilities: string[];
  defaultConfig: AIConfigOptions;
  maxInputSize?: number;
  costPerToken?: number;
  isEnabled: boolean;
  lastUpdated: string;
}

/**
 * AI配置更新请求
 */
export interface AIConfigUpdateRequest {
  provider?: AIProvider;
  defaultModel?: string;
  apiKeys?: {
    [key: string]: string;
  };
  rateLimits?: {
    maxRequestsPerMinute?: number;
    maxTokensPerMinute?: number;
  };
  defaultOptions?: AIConfigOptions;
}

/**
 * AI使用统计接口
 */
export interface AIUsageStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  tokenUsage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  requestBreakdown: {
    [operation: string]: number;
  };
  averageProcessingTime: number;
  last24HoursUsage: {
    [hour: string]: number;
  };
}