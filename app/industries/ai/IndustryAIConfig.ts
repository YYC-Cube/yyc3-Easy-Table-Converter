/**
 * @file 行业AI工具配置
 * @description 配置不同行业的AI功能和工具
 * @module industries/ai
 * @author YYC
 * @version 1.0.0
 * @created 2024-01-01
 * @updated 2024-01-01
 */

import { AIModelType, TaskType, Industry } from './AIModelManager';

/**
 * 行业AI工具配置接口
 */
export interface IndustryAIConfig {
  /** 行业ID */
  industryId: string;
  /** 行业名称 */
  industryName: string;
  /** 支持的AI工具列表 */
  tools: IndustryAIToolConfig[];
  /** 默认启用的工具ID列表 */
  defaultEnabledToolIds: string[];
  /** 行业特定的AI配置 */
  aiConfig?: Record<string, any>;
  /** 是否启用AI功能 */
  aiEnabled: boolean;
}

/**
 * 行业AI工具配置接口
 */
export interface IndustryAIToolConfig {
  /** 工具ID */
  toolId: string;
  /** 工具名称 */
  toolName: string;
  /** 工具描述 */
  description: string;
  /** 工具类型 */
  toolType: IndustryAIToolType;
  /** 支持的任务类型 */
  taskTypes: TaskType[];
  /** 使用的模型类型 */
  modelType: AIModelType;
  /** 工具配置参数 */
  config: Record<string, any>;
  /** 是否默认启用 */
  defaultEnabled: boolean;
  /** 工具依赖的其他工具ID列表 */
  dependencies?: string[];
  /** 工具提供的数据源类型 */
  providesDataTypes?: string[];
  /** 工具需要的数据源类型 */
  requiresDataTypes?: string[];
  /** 工具的输入参数模式 */
  inputSchema?: Record<string, any>;
  /** 工具的输出参数模式 */
  outputSchema?: Record<string, any>;
  /** 工具的执行周期（如果是定期执行的工具） */
  executionFrequency?: 'realtime' | 'hourly' | 'daily' | 'weekly' | 'manual';
  /** 工具的资源消耗级别 */
  resourceConsumption?: 'low' | 'medium' | 'high';
  /** 工具的优先级 */
  priority?: number;
  /** 工具的版本 */
  version: string;
  /** 工具的支持平台 */
  supportedPlatforms?: ('web' | 'mobile' | 'desktop')[];
  /** 工具的权限要求 */
  permissionRequirements?: string[];
  /** 工具的错误处理策略 */
  errorHandlingStrategy?: 'retry' | 'fallback' | 'notify' | 'ignore';
  /** 工具的重试配置（如果错误处理策略是重试） */
  retryConfig?: {
    maxRetries: number;
    retryDelayMs: number;
  };
  /** 工具的回退配置（如果错误处理策略是回退） */
  fallbackConfig?: {
    fallbackToolId?: string;
    fallbackStrategy?: string;
  };
}

/**
 * 行业AI工具类型枚举
 */
// IndustryAIToolType 枚举已在文件上部定义，无需重复定义

/**
 * 行业AI配置管理器类
 * 管理不同行业的AI功能配置
 */
export class IndustryAIConfigManager {
  /** 单例实例 */
  private static instance: IndustryAIConfigManager;
  
  /** 行业AI配置映射 */
  private industryConfigs: Map<string, IndustryAIConfig>;
  
  /**
   * 私有构造函数
   */
  private constructor() {
    this.industryConfigs = new Map();
    
    // 初始化默认行业AI配置
    this.initializeDefaultConfigs();
  }
  
  /**
   * 获取单例实例
   */
  public static getInstance(): IndustryAIConfigManager {
    if (!IndustryAIConfigManager.instance) {
      IndustryAIConfigManager.instance = new IndustryAIConfigManager();
    }
    return IndustryAIConfigManager.instance;
  }
  
  /**
   * 初始化默认行业AI配置
   */
  private initializeDefaultConfigs(): void {
    // 初始化智慧农业行业AI配置
    this.registerIndustryConfig({
      industryId: Industry.AGRICULTURE,
      industryName: '智慧农业',
      tools: [
        {
          toolId: 'agriculture_disease_detection_tool',
          toolName: '病虫害识别工具',
          description: '通过图像识别技术检测作物病虫害',
          toolType: IndustryAIToolType.DETECTION,
          taskTypes: [TaskType.DISEASE_DETECTION],
          modelType: AIModelType.IMAGE_RECOGNITION,
          config: {
            confidenceThreshold: 0.7,
            maxDetectionsPerImage: 5,
            supportedDiseaseTypes: [
              '水稻稻瘟病',
              '水稻纹枯病',
              '小麦锈病',
              '小麦赤霉病',
              '玉米叶斑病',
              '玉米螟',
              '棉花枯萎病',
              '棉花蚜虫'
            ],
            enableImageEnhancement: true,
            enableAutomaticCropTypeDetection: true
          },
          defaultEnabled: true,
          version: '1.0.0',
          resourceConsumption: 'medium',
          priority: 1,
          executionFrequency: 'realtime',
          errorHandlingStrategy: 'retry',
          retryConfig: {
            maxRetries: 3,
            retryDelayMs: 1000
          },
          supportedPlatforms: ['web', 'mobile']
        },
        {
          toolId: 'agriculture_yield_prediction_tool',
          toolName: '产量预测工具',
          description: '基于历史数据和环境因素预测作物产量',
          toolType: IndustryAIToolType.PREDICTION,
          taskTypes: [TaskType.YIELD_PREDICTION],
          modelType: AIModelType.PREDICTION,
          config: {
            predictionHorizon: 30, // 预测未来30天
            historicalDataRequiredMonths: 12,
            confidenceLevel: 0.95,
            enableWeatherFactor: true,
            enableSoilFactor: true,
            enableCropVarietyFactor: true,
            supportedCropTypes: [
              '水稻',
              '小麦',
              '玉米',
              '大豆',
              '棉花',
              '油菜'
            ]
          },
          defaultEnabled: true,
          version: '1.0.0',
          resourceConsumption: 'high',
          priority: 2,
          executionFrequency: 'daily',
          errorHandlingStrategy: 'notify',
          supportedPlatforms: ['web']
        },
        {
          toolId: 'agriculture_crop_recommendation_tool',
          toolName: '种植推荐工具',
          description: '基于土壤、气候和市场数据提供作物种植建议',
          toolType: IndustryAIToolType.RECOMMENDATION,
          taskTypes: [TaskType.TEXT_CLASSIFICATION],
          modelType: AIModelType.TEXT_UNDERSTANDING,
          config: {
            recommendationFactors: ['soil', 'climate', 'market', 'profit'],
            maxRecommendations: 5,
            enableProfitAnalysis: true,
            enableRiskAnalysis: true,
            enableHistoricalPerformance: true,
            supportedCropTypes: [
              '水稻',
              '小麦',
              '玉米',
              '大豆',
              '棉花',
              '油菜',
              '蔬菜',
              '水果'
            ]
          },
          defaultEnabled: true,
          version: '1.0.0',
          resourceConsumption: 'medium',
          priority: 3,
          executionFrequency: 'manual',
          errorHandlingStrategy: 'fallback',
          fallbackConfig: {
            fallbackStrategy: 'useDefaultRecommendations'
          },
          supportedPlatforms: ['web', 'mobile']
        },
        {
          toolId: 'agriculture_pest_forecast_tool',
          toolName: '病虫害预测工具',
          description: '基于气象数据和历史记录预测病虫害发生趋势',
          toolType: IndustryAIToolType.PREDICTION,
          taskTypes: [TaskType.DATA_ANALYSIS],
          modelType: AIModelType.PREDICTION,
          config: {
            forecastHorizon: 7, // 预测未来7天
            temperatureSensitivity: true,
            humiditySensitivity: true,
            rainfallSensitivity: true,
            windSpeedSensitivity: true,
            supportedPestTypes: [
              '稻飞虱',
              '稻纵卷叶螟',
              '小麦蚜虫',
              '玉米螟',
              '棉花红蜘蛛'
            ]
          },
          defaultEnabled: false,
          version: '1.0.0',
          resourceConsumption: 'medium',
          priority: 2,
          executionFrequency: 'daily',
          errorHandlingStrategy: 'retry',
          retryConfig: {
            maxRetries: 2,
            retryDelayMs: 1000
          },
          supportedPlatforms: ['web']
        },
        {
          toolId: 'agriculture_field_analysis_tool',
          toolName: '农田分析工具',
          description: '分析农田的土壤质量、地形和灌溉条件',
          toolType: IndustryAIToolType.ANALYSIS,
          taskTypes: [TaskType.DATA_ANALYSIS],
          modelType: AIModelType.TEXT_UNDERSTANDING,
          config: {
            analysisFactors: ['soil_quality', 'topography', 'irrigation', 'drainage'],
            enableSatelliteImageAnalysis: true,
            enableSoilTestDataAnalysis: true,
            enableHistoricalYieldCorrelation: true,
            supportedSoilTypes: [
              '沙壤土',
              '黏土',
              '壤土',
              '砂土',
              '盐碱土'
            ]
          },
          defaultEnabled: true,
          version: '1.0.0',
          resourceConsumption: 'high',
          priority: 1,
          executionFrequency: 'weekly',
          errorHandlingStrategy: 'notify',
          supportedPlatforms: ['web']
        },
        {
          toolId: 'agriculture_intelligent_qa_tool',
          toolName: '农业智能问答工具',
          description: '回答用户关于农业生产的问题',
          toolType: IndustryAIToolType.QUESTION_ANSWERING,
          taskTypes: [TaskType.INTELLIGENT_QA],
          modelType: AIModelType.QUESTION_ANSWERING,
          config: {
            knowledgeBaseSources: ['agriculture_expert_system', 'agriculture_research_papers', 'agriculture_best_practices'],
            enableContextUnderstanding: true,
            enableFollowUpQuestions: true,
            maxResponseLength: 1024,
            supportedQuestionCategories: [
              '种植技术',
              '病虫害防治',
              '土壤管理',
              '灌溉技术',
              '肥料使用',
              '收获储存',
              '市场信息'
            ]
          },
          defaultEnabled: true,
          version: '1.0.0',
          resourceConsumption: 'medium',
          priority: 3,
          executionFrequency: 'realtime',
          errorHandlingStrategy: 'fallback',
          fallbackConfig: {
            fallbackStrategy: 'useGeneralKnowledgeBase'
          },
          supportedPlatforms: ['web', 'mobile', 'desktop']
        }
      ],
      defaultEnabledToolIds: [
        'agriculture_disease_detection_tool',
        'agriculture_yield_prediction_tool',
        'agriculture_crop_recommendation_tool',
        'agriculture_field_analysis_tool',
        'agriculture_intelligent_qa_tool'
      ],
      aiConfig: {
        enableBatchProcessing: true,
        batchProcessingTimeoutMs: 30000,
        maxConcurrentJobs: 5,
        enableAutomaticModelSelection: true,
        defaultModelSelectionStrategy: 'performance_based',
        enableModelCaching: true,
        modelCacheTTLMs: 3600000
      },
      aiEnabled: true
    });

    // 初始化智能教育行业AI配置
    this.registerIndustryConfig({
      industryId: Industry.EDUCATION,
      industryName: '智能教育',
      tools: [
        {
          toolId: 'education_learning_progress_prediction_tool',
          toolName: '学习进度预测工具',
          description: '预测学生的学习进度和表现',
          toolType: IndustryAIToolType.PREDICTION,
          taskTypes: [TaskType.LEARNING_PROGRESS_PREDICTION],
          modelType: AIModelType.PREDICTION,
          config: {
            predictionHorizon: 14, // 预测未来14天
            historicalDataRequiredDays: 30,
            confidenceLevel: 0.9,
            enableLearningStyleFactor: true,
            enableTeacherFeedbackFactor: true,
            enablePeerInteractionFactor: true,
            supportedSubjects: [
              '数学',
              '语文',
              '英语',
              '物理',
              '化学',
              '生物',
              '历史',
              '地理',
              '政治'
            ],
            enablePersonalizedFactors: true,
            enableInterventionSuggestions: true
          },
          defaultEnabled: true,
          version: '1.0.0',
          resourceConsumption: 'high',
          priority: 1,
          executionFrequency: 'daily',
          errorHandlingStrategy: 'notify',
          supportedPlatforms: ['web', 'mobile']
        },
        {
          toolId: 'education_knowledge_assessment_tool',
          toolName: '知识评估工具',
          description: '评估学生的知识掌握程度',
          toolType: IndustryAIToolType.ASSESSMENT,
          taskTypes: [TaskType.KNOWLEDGE_ASSESSMENT],
          modelType: AIModelType.TEXT_UNDERSTANDING,
          config: {
            assessmentMethods: ['quiz', 'assignment', 'participation', 'project'],
            knowledgeMapDepth: 3,
            enableAdaptiveAssessment: true,
            enableConceptMasteryTracking: true,
            supportedDifficultyLevels: ['elementary', 'intermediate', 'advanced', 'expert'],
            supportedQuestionFormats: [
              '选择题',
              '填空题',
              '简答题',
              '论述题',
              '计算题',
              '编程题'
            ],
            enableAutomaticQuestionGeneration: true
          },
          defaultEnabled: true,
          version: '1.0.0',
          resourceConsumption: 'medium',
          priority: 1,
          executionFrequency: 'realtime',
          errorHandlingStrategy: 'retry',
          retryConfig: {
            maxRetries: 3,
            retryDelayMs: 1000
          },
          supportedPlatforms: ['web']
        },
        {
          toolId: 'education_personalized_learning_tool',
          toolName: '个性化学习推荐工具',
          description: '基于学习数据分析提供个性化学习路径',
          toolType: IndustryAIToolType.RECOMMENDATION,
          taskTypes: [TaskType.TEXT_CLASSIFICATION],
          modelType: AIModelType.TEXT_UNDERSTANDING,
          config: {
            recommendationFactors: ['knowledge_gaps', 'learning_style', 'interests', 'goals'],
            maxLearningPathLength: 10,
            enableMicroLearningUnits: true,
            enableMultiModalContent: true,
            enableSocialLearning: true,
            supportedContentTypes: [
              '视频教程',
              '文章',
              '互动练习',
              '讨论题',
              '案例分析',
              '模拟实验'
            ],
            enableProgressTracking: true,
            enableFeedbackCollection: true
          },
          defaultEnabled: true,
          version: '1.0.0',
          resourceConsumption: 'medium',
          priority: 2,
          executionFrequency: 'realtime',
          errorHandlingStrategy: 'fallback',
          fallbackConfig: {
            fallbackStrategy: 'useStandardLearningPath'
          },
          supportedPlatforms: ['web', 'mobile']
        },
        {
          toolId: 'education_report_generation_tool',
          toolName: '报告生成工具',
          description: '生成学生学习报告和分析',
          toolType: IndustryAIToolType.GENERATION,
          taskTypes: [TaskType.REPORT_GENERATION],
          modelType: AIModelType.TEXT_GENERATION,
          config: {
            reportFormats: ['summary', 'detailed', 'parent', 'teacher'],
            enableVisualization: true,
            enableComparativeAnalysis: true,
            enableStrengthWeaknessAnalysis: true,
            supportedVisualizationTypes: [
              'progress_chart',
              'skill_radar',
              'comparison_bar',
              'heat_map',
              'timeline'
            ],
            enableActionableInsights: true,
            enableAutomaticScheduling: true
          },
          defaultEnabled: true,
          version: '1.0.0',
          resourceConsumption: 'medium',
          priority: 3,
          executionFrequency: 'weekly',
          errorHandlingStrategy: 'retry',
          retryConfig: {
            maxRetries: 2,
            retryDelayMs: 2000
          },
          supportedPlatforms: ['web']
        },
        {
          toolId: 'education_intelligent_qa_tool',
          toolName: '教育智能问答工具',
          description: '回答学生和教师的教育相关问题',
          toolType: IndustryAIToolType.QUESTION_ANSWERING,
          taskTypes: [TaskType.INTELLIGENT_QA],
          modelType: AIModelType.QUESTION_ANSWERING,
          config: {
            knowledgeBaseSources: ['curriculum_content', 'education_research', 'teaching_methods', 'assessment_strategies'],
            enableSubjectSpecificAnswers: true,
            enableGradeSpecificAnswers: true,
            maxResponseLength: 1024,
            supportedQuestionCategories: [
              '课程内容',
              '教学方法',
              '学习技巧',
              '评估策略',
              '教育政策',
              '特殊教育',
              '职业规划'
            ],
            enableMultilingualSupport: true,
            supportedLanguages: ['zh', 'en']
          },
          defaultEnabled: true,
          version: '1.0.0',
          resourceConsumption: 'medium',
          priority: 2,
          executionFrequency: 'realtime',
          errorHandlingStrategy: 'fallback',
          fallbackConfig: {
            fallbackStrategy: 'useGeneralEducationKnowledgeBase'
          },
          supportedPlatforms: ['web', 'mobile', 'desktop']
        },
        {
          toolId: 'education_learning_analytics_tool',
          toolName: '学习分析工具',
          description: '分析学习行为和效果数据',
          toolType: IndustryAIToolType.ANALYSIS,
          taskTypes: [TaskType.TEXT_CLASSIFICATION],
          modelType: AIModelType.TEXT_UNDERSTANDING,
          config: {
            analysisDimensions: ['engagement', 'achievement', 'persistence', 'collaboration'],
            enableLearningPathAnalysis: true,
            enableContentEffectivenessAnalysis: true,
            enablePeerInfluenceAnalysis: true,
            enableTimeSeriesAnalysis: true,
            supportedVisualizationTypes: [
              'heatmap',
              'sankey',
              'network',
              'bubble',
              'scatter',
              'bar'
            ],
            enablePredictiveInsights: true,
            enableRecommendationGeneration: true
          },
          defaultEnabled: false,
          version: '1.0.0',
          resourceConsumption: 'high',
          priority: 2,
          executionFrequency: 'daily',
          errorHandlingStrategy: 'notify',
          supportedPlatforms: ['web']
        }
      ],
      defaultEnabledToolIds: [
        'education_learning_progress_prediction_tool',
        'education_knowledge_assessment_tool',
        'education_personalized_learning_tool',
        'education_report_generation_tool',
        'education_intelligent_qa_tool'
      ],
      aiConfig: {
        enableBatchProcessing: true,
        batchProcessingTimeoutMs: 45000,
        maxConcurrentJobs: 8,
        enableAutomaticModelSelection: true,
        defaultModelSelectionStrategy: 'accuracy_based',
        enableModelCaching: true,
        modelCacheTTLMs: 7200000,
        enablePrivacyEnhancedProcessing: true,
        dataAnonymizationStrategy: 'k_anonymity'
      },
      aiEnabled: true
    });
  }

  /**
   * 注册行业AI配置
   * @param config 行业AI配置
   */
  public registerIndustryConfig(config: IndustryAIConfig): void {
    this.industryConfigs.set(config.industryId, config);
    console.log(`[IndustryAIConfigManager] 成功注册行业 ${config.industryId} 的AI配置`);
  }

  /**
   * 获取行业AI配置
   * @param industryId 行业ID
   * @returns 行业AI配置
   */
  public getIndustryConfig(industryId: string): IndustryAIConfig {
    const config = this.industryConfigs.get(industryId);
    if (!config) {
      throw new Error(`未找到行业 ${industryId} 的AI配置`);
    }
    return config;
  }

  /**
   * 获取所有行业AI配置
   * @returns 所有行业AI配置列表
   */
  public getAllIndustryConfigs(): IndustryAIConfig[] {
    return Array.from(this.industryConfigs.values());
  }

  /**
   * 更新行业AI配置
   * @param industryId 行业ID
   * @param updatedConfig 更新的配置
   */
  public updateIndustryConfig(industryId: string, updatedConfig: Partial<IndustryAIConfig>): void {
    const config = this.industryConfigs.get(industryId);
    if (!config) {
      throw new Error(`未找到行业 ${industryId} 的AI配置`);
    }
    
    const newConfig = {
      ...config,
      ...updatedConfig
    };
    
    this.industryConfigs.set(industryId, newConfig);
    console.log(`[IndustryAIConfigManager] 成功更新行业 ${industryId} 的AI配置`);
  }

  /**
   * 获取行业的特定AI工具配置
   * @param industryId 行业ID
   * @param toolId 工具ID
   * @returns 工具配置
   */
  public getIndustryAIToolConfig(industryId: string, toolId: string): IndustryAIToolConfig {
    const industryConfig = this.getIndustryConfig(industryId);
    const toolConfig = industryConfig.tools.find(tool => tool.toolId === toolId);
    
    if (!toolConfig) {
      throw new Error(`未找到行业 ${industryId} 中ID为 ${toolId} 的工具配置`);
    }
    
    return toolConfig;
  }

  /**
   * 获取行业启用的AI工具配置列表
   * @param industryId 行业ID
   * @returns 启用的工具配置列表
   */
  public getEnabledIndustryAITools(industryId: string): IndustryAIToolConfig[] {
    const industryConfig = this.getIndustryConfig(industryId);
    
    if (!industryConfig.aiEnabled) {
      return [];
    }
    
    return industryConfig.tools.filter(tool => {
      return industryConfig.defaultEnabledToolIds.includes(tool.toolId);
    });
  }

  /**
   * 启用行业的特定AI工具
   * @param industryId 行业ID
   * @param toolId 工具ID
   */
  public enableIndustryAITool(industryId: string, toolId: string): void {
    const industryConfig = this.getIndustryConfig(industryId);
    const toolConfig = industryConfig.tools.find(tool => tool.toolId === toolId);
    
    if (!toolConfig) {
      throw new Error(`未找到行业 ${industryId} 中ID为 ${toolId} 的工具配置`);
    }
    
    // 更新默认启用的工具ID列表
    const newDefaultEnabledToolIds = [...industryConfig.defaultEnabledToolIds];
    if (!newDefaultEnabledToolIds.includes(toolId)) {
      newDefaultEnabledToolIds.push(toolId);
    }
    
    // 更新工具的默认启用状态
    const newTools = industryConfig.tools.map(tool => {
      if (tool.toolId === toolId) {
        return { ...tool, defaultEnabled: true };
      }
      return tool;
    });
    
    // 更新行业配置
    this.updateIndustryConfig(industryId, {
      defaultEnabledToolIds: newDefaultEnabledToolIds,
      tools: newTools
    });
    
    console.log(`[IndustryAIConfigManager] 成功启用行业 ${industryId} 的工具 ${toolId}`);
  }

  /**
   * 禁用行业的特定AI工具
   * @param industryId 行业ID
   * @param toolId 工具ID
   */
  public disableIndustryAITool(industryId: string, toolId: string): void {
    const industryConfig = this.getIndustryConfig(industryId);
    
    // 检查工具是否存在
    const toolExists = industryConfig.tools.some(tool => tool.toolId === toolId);
    if (!toolExists) {
      throw new Error(`未找到行业 ${industryId} 中ID为 ${toolId} 的工具配置`);
    }
    
    // 更新默认启用的工具ID列表
    const newDefaultEnabledToolIds = industryConfig.defaultEnabledToolIds.filter(id => id !== toolId);
    
    // 更新工具的默认启用状态
    const newTools = industryConfig.tools.map(tool => {
      if (tool.toolId === toolId) {
        return { ...tool, defaultEnabled: false };
      }
      return tool;
    });
    
    // 更新行业配置
    this.updateIndustryConfig(industryId, {
      defaultEnabledToolIds: newDefaultEnabledToolIds,
      tools: newTools
    });
    
    console.log(`[IndustryAIConfigManager] 成功禁用行业 ${industryId} 的工具 ${toolId}`);
  }

  /**
   * 更新行业AI工具配置
   * @param industryId 行业ID
   * @param toolId 工具ID
   * @param updatedConfig 更新的工具配置
   */
  public updateIndustryAIToolConfig(industryId: string, toolId: string, updatedConfig: Partial<IndustryAIToolConfig>): void {
    const industryConfig = this.getIndustryConfig(industryId);
    
    // 更新工具配置
    const newTools = industryConfig.tools.map(tool => {
      if (tool.toolId === toolId) {
        return { ...tool, ...updatedConfig };
      }
      return tool;
    });
    
    // 更新行业配置
    this.updateIndustryConfig(industryId, { tools: newTools });
    
    console.log(`[IndustryAIConfigManager] 成功更新行业 ${industryId} 的工具 ${toolId} 配置`);
  }

  /**
   * 获取支持指定任务类型的工具列表
   * @param industryId 行业ID
   * @param taskType 任务类型
   * @returns 支持该任务类型的工具配置列表
   */
  public getToolsByTaskType(industryId: string, taskType: TaskType): IndustryAIToolConfig[] {
    const industryConfig = this.getIndustryConfig(industryId);
    
    if (!industryConfig.aiEnabled) {
      return [];
    }
    
    return industryConfig.tools.filter(tool => {
      return tool.taskTypes.includes(taskType);
    });
  }

  /**
   * 获取工具的依赖工具列表
   * @param industryId 行业ID
   * @param toolId 工具ID
   * @returns 依赖的工具配置列表
   */
  public getToolDependencies(industryId: string, toolId: string): IndustryAIToolConfig[] {
    const industryConfig = this.getIndustryConfig(industryId);
    const toolConfig = industryConfig.tools.find(tool => tool.toolId === toolId);
    
    if (!toolConfig || !toolConfig.dependencies) {
      return [];
    }
    
    return toolConfig.dependencies
      .map(depId => industryConfig.tools.find(tool => tool.toolId === depId))
      .filter((tool): tool is IndustryAIToolConfig => tool !== undefined);
  }
}

/**
 * 行业AI工具类型枚举
 */
export enum IndustryAIToolType {
  /** 分析工具 */
  ANALYSIS = 'analysis',
  /** 预测工具 */
  PREDICTION = 'prediction',
  /** 检测工具 */
  DETECTION = 'detection',
  /** 生成工具 */
  GENERATION = 'generation',
  /** 优化工具 */
  OPTIMIZATION = 'optimization',
  /** 评估工具 */
  ASSESSMENT = 'assessment',
  /** 推荐工具 */
  RECOMMENDATION = 'recommendation',
  /** 问答工具 */
  QUESTION_ANSWERING = 'question_answering'
}

// 导出单例实例
export const industryAIConfigManager = IndustryAIConfigManager.getInstance();

// 所有类型和枚举已在定义时直接导出
