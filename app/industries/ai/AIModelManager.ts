/**
 * @file AI模型管理器
 * @description 管理不同行业的AI模型和提供模型选择功能
 * @module industries/ai
 * @author YYC
 * @version 1.0.0
 * @created 2024-01-01
 * @updated 2024-01-01
 */

/**
 * AI模型配置接口
 */
export interface AIModelConfig {
  /** 模型ID */
  modelId: string;
  /** 模型名称 */
  modelName: string;
  /** 模型版本 */
  version: string;
  /** 模型类型 */
  modelType: AIModelType;
  /** 适用行业 */
  industries: string[];
  /** 适用任务类型 */
  taskTypes: TaskType[];
  /** 模型描述 */
  description: string;
  /** 模型参数配置 */
  parameters: Record<string, any>;
  /** 模型性能指标 */
  performance?: {
    accuracy?: number;
    precision?: number;
    recall?: number;
    f1Score?: number;
    latency?: number;
    throughput?: number;
  };
  /** 是否默认模型 */
  isDefault?: boolean;
  /** 模型提供商 */
  provider?: string;
  /** 创建时间 */
  createdAt: string;
  /** 更新时间 */
  updatedAt: string;
}

/**
 * AI模型类型枚举
 */
export enum AIModelType {
  /** 文本生成模型 */
  TEXT_GENERATION = 'text_generation',
  /** 文本理解模型 */
  TEXT_UNDERSTANDING = 'text_understanding',
  /** 图像识别模型 */
  IMAGE_RECOGNITION = 'image_recognition',
  /** 图像生成模型 */
  IMAGE_GENERATION = 'image_generation',
  /** 预测模型 */
  PREDICTION = 'prediction',
  /** 分类模型 */
  CLASSIFICATION = 'classification',
  /** 问答模型 */
  QUESTION_ANSWERING = 'question_answering',
  /** 多模态模型 */
  MULTIMODAL = 'multimodal'
}

/**
 * 任务类型枚举
 */
export enum TaskType {
  /** 文本分类 */
  TEXT_CLASSIFICATION = 'text_classification',
  /** 实体识别 */
  ENTITY_RECOGNITION = 'entity_recognition',
  /** 情感分析 */
  SENTIMENT_ANALYSIS = 'sentiment_analysis',
  /** 图像分类 */
  IMAGE_CLASSIFICATION = 'image_classification',
  /** 对象检测 */
  OBJECT_DETECTION = 'object_detection',
  /** 实例分割 */
  INSTANCE_SEGMENTATION = 'instance_segmentation',
  /** 产量预测 */
  YIELD_PREDICTION = 'yield_prediction',
  /** 疾病检测 */
  DISEASE_DETECTION = 'disease_detection',
  /** 学习进度预测 */
  LEARNING_PROGRESS_PREDICTION = 'learning_progress_prediction',
  /** 知识评估 */
  KNOWLEDGE_ASSESSMENT = 'knowledge_assessment',
  /** 智能问答 */
  INTELLIGENT_QA = 'intelligent_qa',
  /** 报告生成 */
  REPORT_GENERATION = 'report_generation',
  /** 数据分析 */
  DATA_ANALYSIS = 'data_analysis'
}

/**
 * 行业枚举
 */
export enum Industry {
  /** 智慧农业 */
  AGRICULTURE = 'agriculture',
  /** 智能教育 */
  EDUCATION = 'education',
  /** 医疗健康 */
  HEALTHCARE = 'healthcare',
  /** 金融服务 */
  FINANCE = 'finance',
  /** 制造业 */
  MANUFACTURING = 'manufacturing',
  /** 零售电商 */
  RETAIL = 'retail',
  /** 物流运输 */
  LOGISTICS = 'logistics',
  /** 能源管理 */
  ENERGY = 'energy',
  /** 通用 */
  GENERAL = 'general'
}

/**
 * AI模型管理器类
 * 管理不同行业的AI模型和提供模型选择功能
 */
export class AIModelManager {
  /** 单例实例 */
  private static instance: AIModelManager;
  
  /** 模型配置映射 */
  private modelConfigs: Map<string, AIModelConfig>;
  
  /** 行业默认模型映射 */
  private industryDefaultModels: Map<string, Map<AIModelType, string>>;
  
  /** 任务类型默认模型映射 */
  private taskTypeDefaultModels: Map<TaskType, string>;
  
  /** 模型缓存 */
  private modelCache: Map<string, any>;
  
  /**
   * 私有构造函数
   */
  private constructor() {
    this.modelConfigs = new Map();
    this.industryDefaultModels = new Map();
    this.taskTypeDefaultModels = new Map();
    this.modelCache = new Map();
    
    // 初始化默认模型
    this.initializeDefaultModels();
  }
  
  /**
   * 获取单例实例
   */
  public static getInstance(): AIModelManager {
    if (!AIModelManager.instance) {
      AIModelManager.instance = new AIModelManager();
    }
    return AIModelManager.instance;
  }
  
  /**
   * 初始化默认模型
   */
  private initializeDefaultModels(): void {
    // 添加农业行业模型
    this.registerModel({
      modelId: 'agriculture_image_recognition_v1',
      modelName: '农业图像识别模型v1',
      version: '1.0.0',
      modelType: AIModelType.IMAGE_RECOGNITION,
      industries: [Industry.AGRICULTURE],
      taskTypes: [TaskType.IMAGE_CLASSIFICATION, TaskType.DISEASE_DETECTION],
      description: '用于识别作物图像、病虫害检测的农业专用模型',
      parameters: {
        confidenceThreshold: 0.7,
        maxDetectedObjects: 5,
        imageSize: { width: 640, height: 640 }
      },
      performance: {
        accuracy: 0.92,
        precision: 0.89,
        recall: 0.91,
        f1Score: 0.90,
        latency: 250,
        throughput: 40
      },
      isDefault: true,
      provider: 'AI Service Provider',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    // 添加农业文本理解模型
    this.registerModel({
      modelId: 'agriculture_text_understanding_v1',
      modelName: '农业文本理解模型v1',
      version: '1.0.0',
      modelType: AIModelType.TEXT_UNDERSTANDING,
      industries: [Industry.AGRICULTURE],
      taskTypes: [TaskType.ENTITY_RECOGNITION, TaskType.SENTIMENT_ANALYSIS],
      description: '用于理解农业领域文本、提取实体和分析情感的模型',
      parameters: {
        maxTokens: 512,
        temperature: 0.7,
        topP: 0.9
      },
      performance: {
        accuracy: 0.94,
        precision: 0.92,
        recall: 0.93,
        f1Score: 0.925,
        latency: 150,
        throughput: 60
      },
      isDefault: true,
      provider: 'AI Service Provider',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    // 添加农业预测模型
    this.registerModel({
      modelId: 'agriculture_prediction_v1',
      modelName: '农业预测模型v1',
      version: '1.0.0',
      modelType: AIModelType.PREDICTION,
      industries: [Industry.AGRICULTURE],
      taskTypes: [TaskType.YIELD_PREDICTION],
      description: '用于作物产量预测、生长周期预测的农业专用模型',
      parameters: {
        confidenceInterval: 0.95,
        featureImportance: true,
        explainable: true
      },
      performance: {
        accuracy: 0.88,
        precision: 0.85,
        recall: 0.87,
        f1Score: 0.86,
        latency: 300,
        throughput: 30
      },
      isDefault: true,
      provider: 'AI Service Provider',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    // 添加教育行业模型
    this.registerModel({
      modelId: 'education_text_generation_v1',
      modelName: '教育文本生成模型v1',
      version: '1.0.0',
      modelType: AIModelType.TEXT_GENERATION,
      industries: [Industry.EDUCATION],
      taskTypes: [TaskType.REPORT_GENERATION],
      description: '用于生成教育报告、学习建议的教育专用模型',
      parameters: {
        maxTokens: 1024,
        temperature: 0.7,
        topP: 0.9,
        format: 'markdown'
      },
      performance: {
        accuracy: 0.93,
        precision: 0.91,
        recall: 0.92,
        f1Score: 0.915,
        latency: 200,
        throughput: 50
      },
      isDefault: true,
      provider: 'AI Service Provider',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    // 添加教育理解模型
    this.registerModel({
      modelId: 'education_text_understanding_v1',
      modelName: '教育文本理解模型v1',
      version: '1.0.0',
      modelType: AIModelType.TEXT_UNDERSTANDING,
      industries: [Industry.EDUCATION],
      taskTypes: [TaskType.KNOWLEDGE_ASSESSMENT, TaskType.ENTITY_RECOGNITION],
      description: '用于理解教育文本、评估知识点、提取关键信息的模型',
      parameters: {
        maxTokens: 512,
        temperature: 0.7,
        topP: 0.9
      },
      performance: {
        accuracy: 0.95,
        precision: 0.93,
        recall: 0.94,
        f1Score: 0.935,
        latency: 180,
        throughput: 55
      },
      isDefault: true,
      provider: 'AI Service Provider',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    // 添加教育预测模型
    this.registerModel({
      modelId: 'education_prediction_v1',
      modelName: '教育预测模型v1',
      version: '1.0.0',
      modelType: AIModelType.PREDICTION,
      industries: [Industry.EDUCATION],
      taskTypes: [TaskType.LEARNING_PROGRESS_PREDICTION],
      description: '用于预测学生学习进度、成绩发展趋势的教育专用模型',
      parameters: {
        confidenceInterval: 0.95,
        featureImportance: true,
        explainable: true
      },
      performance: {
        accuracy: 0.90,
        precision: 0.88,
        recall: 0.89,
        f1Score: 0.885,
        latency: 280,
        throughput: 35
      },
      isDefault: true,
      provider: 'AI Service Provider',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    // 添加通用问答模型
    this.registerModel({
      modelId: 'general_question_answering_v1',
      modelName: '通用问答模型v1',
      version: '1.0.0',
      modelType: AIModelType.QUESTION_ANSWERING,
      industries: [Industry.GENERAL, Industry.AGRICULTURE, Industry.EDUCATION],
      taskTypes: [TaskType.INTELLIGENT_QA],
      description: '用于智能问答、知识检索的通用模型',
      parameters: {
        maxTokens: 512,
        temperature: 0.7,
        topP: 0.9,
        contextWindowSize: 4096
      },
      performance: {
        accuracy: 0.91,
        precision: 0.89,
        recall: 0.90,
        f1Score: 0.895,
        latency: 220,
        throughput: 45
      },
      isDefault: true,
      provider: 'AI Service Provider',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    // 设置任务类型默认模型
    this.setTaskTypeDefaultModel(TaskType.IMAGE_CLASSIFICATION, 'agriculture_image_recognition_v1');
    this.setTaskTypeDefaultModel(TaskType.DISEASE_DETECTION, 'agriculture_image_recognition_v1');
    this.setTaskTypeDefaultModel(TaskType.ENTITY_RECOGNITION, 'agriculture_text_understanding_v1');
    this.setTaskTypeDefaultModel(TaskType.SENTIMENT_ANALYSIS, 'agriculture_text_understanding_v1');
    this.setTaskTypeDefaultModel(TaskType.YIELD_PREDICTION, 'agriculture_prediction_v1');
    this.setTaskTypeDefaultModel(TaskType.REPORT_GENERATION, 'education_text_generation_v1');
    this.setTaskTypeDefaultModel(TaskType.KNOWLEDGE_ASSESSMENT, 'education_text_understanding_v1');
    this.setTaskTypeDefaultModel(TaskType.LEARNING_PROGRESS_PREDICTION, 'education_prediction_v1');
    this.setTaskTypeDefaultModel(TaskType.INTELLIGENT_QA, 'general_question_answering_v1');
  }
  
  /**
   * 注册模型
   * @param modelConfig 模型配置
   */
  public registerModel(modelConfig: AIModelConfig): void {
    // 验证模型配置
    this.validateModelConfig(modelConfig);
    
    // 注册模型
    this.modelConfigs.set(modelConfig.modelId, modelConfig);
    
    // 如果是默认模型，更新行业默认模型映射
    if (modelConfig.isDefault) {
      modelConfig.industries.forEach(industry => {
        if (!this.industryDefaultModels.has(industry)) {
          this.industryDefaultModels.set(industry, new Map());
        }
        const industryModels = this.industryDefaultModels.get(industry)!;
        industryModels.set(modelConfig.modelType, modelConfig.modelId);
      });
    }
    
    console.log(`[AIModelManager] 成功注册模型: ${modelConfig.modelId}`);
  }
  
  /**
   * 注销模型
   * @param modelId 模型ID
   */
  public unregisterModel(modelId: string): void {
    const modelConfig = this.modelConfigs.get(modelId);
    if (!modelConfig) {
      throw new Error(`模型 ${modelId} 不存在`);
    }
    
    // 从行业默认模型映射中移除
    if (modelConfig.isDefault) {
      modelConfig.industries.forEach(industry => {
        const industryModels = this.industryDefaultModels.get(industry);
        if (industryModels) {
          industryModels.delete(modelConfig.modelType);
        }
      });
    }
    
    // 从任务类型默认模型映射中移除
    for (const [taskType, defaultModelId] of this.taskTypeDefaultModels.entries()) {
      if (defaultModelId === modelId) {
        this.taskTypeDefaultModels.delete(taskType);
      }
    }
    
    // 从缓存中移除
    this.modelCache.delete(modelId);
    
    // 移除模型配置
    this.modelConfigs.delete(modelId);
    
    console.log(`[AIModelManager] 成功注销模型: ${modelId}`);
  }
  
  /**
   * 获取模型配置
   * @param modelId 模型ID
   * @returns 模型配置
   */
  public getModelConfig(modelId: string): AIModelConfig {
    const modelConfig = this.modelConfigs.get(modelId);
    if (!modelConfig) {
      throw new Error(`模型 ${modelId} 不存在`);
    }
    return modelConfig;
  }
  
  /**
   * 获取行业默认模型
   * @param industry 行业
   * @param modelType 模型类型
   * @returns 模型ID
   */
  public getIndustryDefaultModel(industry: string, modelType: AIModelType): string | null {
    const industryModels = this.industryDefaultModels.get(industry);
    if (!industryModels) {
      return null;
    }
    return industryModels.get(modelType) || null;
  }
  
  /**
   * 获取任务类型默认模型
   * @param taskType 任务类型
   * @returns 模型ID
   */
  public getTaskTypeDefaultModel(taskType: TaskType): string | null {
    return this.taskTypeDefaultModels.get(taskType) || null;
  }
  
  /**
   * 设置任务类型默认模型
   * @param taskType 任务类型
   * @param modelId 模型ID
   */
  public setTaskTypeDefaultModel(taskType: TaskType, modelId: string): void {
    // 验证模型是否存在
    const modelConfig = this.modelConfigs.get(modelId);
    if (!modelConfig) {
      throw new Error(`模型 ${modelId} 不存在`);
    }
    
    // 验证模型是否支持该任务类型
    if (!modelConfig.taskTypes.includes(taskType)) {
      throw new Error(`模型 ${modelId} 不支持任务类型 ${taskType}`);
    }
    
    this.taskTypeDefaultModels.set(taskType, modelId);
    console.log(`[AIModelManager] 成功设置任务类型 ${taskType} 默认模型: ${modelId}`);
  }
  
  /**
   * 设置行业默认模型
   * @param industry 行业
   * @param modelType 模型类型
   * @param modelId 模型ID
   */
  public setIndustryDefaultModel(industry: string, modelType: AIModelType, modelId: string): void {
    // 验证模型是否存在
    const modelConfig = this.modelConfigs.get(modelId);
    if (!modelConfig) {
      throw new Error(`模型 ${modelId} 不存在`);
    }
    
    // 验证模型是否支持该行业
    if (!modelConfig.industries.includes(industry)) {
      throw new Error(`模型 ${modelId} 不支持行业 ${industry}`);
    }
    
    // 验证模型类型是否匹配
    if (modelConfig.modelType !== modelType) {
      throw new Error(`模型 ${modelId} 的类型 ${modelConfig.modelType} 与指定类型 ${modelType} 不匹配`);
    }
    
    // 更新模型配置
    modelConfig.isDefault = true;
    
    // 更新行业默认模型映射
    if (!this.industryDefaultModels.has(industry)) {
      this.industryDefaultModels.set(industry, new Map());
    }
    const industryModels = this.industryDefaultModels.get(industry)!;
    industryModels.set(modelType, modelId);
    
    console.log(`[AIModelManager] 成功设置行业 ${industry} 类型 ${modelType} 默认模型: ${modelId}`);
  }
  
  /**
   * 获取适用的模型列表
   * @param industry 行业（可选）
   * @param modelType 模型类型（可选）
   * @param taskType 任务类型（可选）
   * @returns 模型配置列表
   */
  public getAvailableModels(
    industry?: string,
    modelType?: AIModelType,
    taskType?: TaskType
  ): AIModelConfig[] {
    const models: AIModelConfig[] = [];
    
    this.modelConfigs.forEach(modelConfig => {
      // 检查行业匹配
      if (industry && !modelConfig.industries.includes(industry)) {
        return;
      }
      
      // 检查模型类型匹配
      if (modelType && modelConfig.modelType !== modelType) {
        return;
      }
      
      // 检查任务类型匹配
      if (taskType && !modelConfig.taskTypes.includes(taskType)) {
        return;
      }
      
      models.push(modelConfig);
    });
    
    return models;
  }
  
  /**
   * 选择最合适的模型
   * @param industry 行业
   * @param taskType 任务类型
   * @returns 模型ID和配置
   */
  public selectBestModel(industry: string, taskType: TaskType): { modelId: string; modelConfig: AIModelConfig } {
    // 尝试获取行业默认模型
    const industryDefaultModel = this.getIndustryDefaultModel(industry, this.getModelTypeByTaskType(taskType));
    if (industryDefaultModel) {
      return { modelId: industryDefaultModel, modelConfig: this.getModelConfig(industryDefaultModel) };
    }
    
    // 尝试获取任务类型默认模型
    const taskTypeDefaultModel = this.getTaskTypeDefaultModel(taskType);
    if (taskTypeDefaultModel) {
      return { modelId: taskTypeDefaultModel, modelConfig: this.getModelConfig(taskTypeDefaultModel) };
    }
    
    // 获取所有适用的模型
    const availableModels = this.getAvailableModels(industry, undefined, taskType);
    if (availableModels.length === 0) {
      // 尝试获取通用模型
      const generalModels = this.getAvailableModels(Industry.GENERAL, undefined, taskType);
      if (generalModels.length === 0) {
        throw new Error(`未找到适用于行业 ${industry} 和任务类型 ${taskType} 的模型`);
      }
      // 按性能排序并选择最佳模型
      generalModels.sort(this.compareModelPerformance);
      return { modelId: generalModels[0].modelId, modelConfig: generalModels[0] };
    }
    
    // 按性能排序并选择最佳模型
    availableModels.sort(this.compareModelPerformance);
    return { modelId: availableModels[0].modelId, modelConfig: availableModels[0] };
  }
  
  /**
   * 获取所有注册的模型
   * @returns 所有模型配置列表
   */
  public getAllModels(): AIModelConfig[] {
    return Array.from(this.modelConfigs.values());
  }
  
  /**
   * 验证模型配置
   * @param modelConfig 模型配置
   */
  private validateModelConfig(modelConfig: AIModelConfig): void {
    // 验证必要字段
    if (!modelConfig.modelId || typeof modelConfig.modelId !== 'string') {
      throw new Error('模型ID必须是非空字符串');
    }
    
    if (!modelConfig.modelName || typeof modelConfig.modelName !== 'string') {
      throw new Error('模型名称必须是非空字符串');
    }
    
    if (!modelConfig.version || typeof modelConfig.version !== 'string') {
      throw new Error('模型版本必须是非空字符串');
    }
    
    if (!modelConfig.description || typeof modelConfig.description !== 'string') {
      throw new Error('模型描述必须是非空字符串');
    }
    
    if (!modelConfig.industries || !Array.isArray(modelConfig.industries) || modelConfig.industries.length === 0) {
      throw new Error('模型必须支持至少一个行业');
    }
    
    if (!modelConfig.taskTypes || !Array.isArray(modelConfig.taskTypes) || modelConfig.taskTypes.length === 0) {
      throw new Error('模型必须支持至少一个任务类型');
    }
    
    if (!modelConfig.parameters || typeof modelConfig.parameters !== 'object') {
      throw new Error('模型参数必须是有效的对象');
    }
    
    if (!modelConfig.createdAt || !modelConfig.updatedAt) {
      throw new Error('创建时间和更新时间必须存在');
    }
  }
  
  /**
   * 根据任务类型获取模型类型
   * @param taskType 任务类型
   * @returns 模型类型
   */
  private getModelTypeByTaskType(taskType: TaskType): AIModelType {
    const taskTypeToModelType: Record<TaskType, AIModelType> = {
      [TaskType.TEXT_CLASSIFICATION]: AIModelType.TEXT_UNDERSTANDING,
      [TaskType.ENTITY_RECOGNITION]: AIModelType.TEXT_UNDERSTANDING,
      [TaskType.SENTIMENT_ANALYSIS]: AIModelType.TEXT_UNDERSTANDING,
      [TaskType.IMAGE_CLASSIFICATION]: AIModelType.IMAGE_RECOGNITION,
      [TaskType.OBJECT_DETECTION]: AIModelType.IMAGE_RECOGNITION,
      [TaskType.INSTANCE_SEGMENTATION]: AIModelType.IMAGE_RECOGNITION,
      [TaskType.YIELD_PREDICTION]: AIModelType.PREDICTION,
      [TaskType.DISEASE_DETECTION]: AIModelType.IMAGE_RECOGNITION,
      [TaskType.LEARNING_PROGRESS_PREDICTION]: AIModelType.PREDICTION,
      [TaskType.KNOWLEDGE_ASSESSMENT]: AIModelType.TEXT_UNDERSTANDING,
      [TaskType.INTELLIGENT_QA]: AIModelType.QUESTION_ANSWERING,
      [TaskType.REPORT_GENERATION]: AIModelType.TEXT_GENERATION,
      [TaskType.DATA_ANALYSIS]: AIModelType.PREDICTION
    };
    
    return taskTypeToModelType[taskType] || AIModelType.TEXT_UNDERSTANDING;
  }
  
  /**
   * 比较模型性能
   * @param a 模型A
   * @param b 模型B
   * @returns 比较结果
   */
  private compareModelPerformance(a: AIModelConfig, b: AIModelConfig): number {
    // 优先比较准确率
    const accuracyA = a.performance?.accuracy || 0;
    const accuracyB = b.performance?.accuracy || 0;
    if (accuracyA !== accuracyB) {
      return accuracyB - accuracyA; // 降序排序
    }
    
    // 其次比较F1分数
    const f1ScoreA = a.performance?.f1Score || 0;
    const f1ScoreB = b.performance?.f1Score || 0;
    if (f1ScoreA !== f1ScoreB) {
      return f1ScoreB - f1ScoreA;
    }
    
    // 再次比较延迟
    const latencyA = a.performance?.latency || 9999;
    const latencyB = b.performance?.latency || 9999;
    if (latencyA !== latencyB) {
      return latencyA - latencyB; // 升序排序，延迟越低越好
    }
    
    // 最后按更新时间排序
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
  }
  
  /**
   * 更新模型配置
   * @param modelId 模型ID
   * @param updatedConfig 更新的配置
   */
  public updateModelConfig(modelId: string, updatedConfig: Partial<AIModelConfig>): void {
    const modelConfig = this.modelConfigs.get(modelId);
    if (!modelConfig) {
      throw new Error(`模型 ${modelId} 不存在`);
    }
    
    // 更新配置
    const newConfig = {
      ...modelConfig,
      ...updatedConfig,
      updatedAt: new Date().toISOString()
    };
    
    // 验证新配置
    this.validateModelConfig(newConfig);
    
    // 保存更新后的配置
    this.modelConfigs.set(modelId, newConfig);
    
    // 如果更新了默认状态，更新行业默认模型映射
    if (updatedConfig.isDefault !== undefined) {
      if (updatedConfig.isDefault) {
        newConfig.industries.forEach(industry => {
          this.setIndustryDefaultModel(industry, newConfig.modelType, modelId);
        });
      } else {
        // 从行业默认模型映射中移除
        newConfig.industries.forEach(industry => {
          const industryModels = this.industryDefaultModels.get(industry);
          if (industryModels && industryModels.get(newConfig.modelType) === modelId) {
            industryModels.delete(newConfig.modelType);
          }
        });
      }
    }
    
    console.log(`[AIModelManager] 成功更新模型 ${modelId} 配置`);
  }
  
  /**
   * 清除模型缓存
   * @param modelId 可选的特定模型ID，如果不提供则清除所有缓存
   */
  public clearModelCache(modelId?: string): void {
    if (modelId) {
      this.modelCache.delete(modelId);
      console.log(`[AIModelManager] 成功清除模型 ${modelId} 缓存`);
    } else {
      this.modelCache.clear();
      console.log(`[AIModelManager] 成功清除所有模型缓存`);
    }
  }
  
  /**
   * 获取模型缓存
   * @param modelId 模型ID
   * @returns 缓存的数据
   */
  public getModelCache(modelId: string): any | null {
    return this.modelCache.get(modelId) || null;
  }
  
  /**
   * 设置模型缓存
   * @param modelId 模型ID
   * @param data 要缓存的数据
   */
  public setModelCache(modelId: string, data: any): void {
    this.modelCache.set(modelId, data);
    console.log(`[AIModelManager] 成功设置模型 ${modelId} 缓存`);
  }
}

// 导出单例实例
export const aiModelManager = AIModelManager.getInstance();

// 类型已在定义时导出
