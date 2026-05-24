/**
 * @file 数据交换服务
 * @description 提供简化的API接口，封装数据交换和转换功能
 * @module industries/interoperability
 * @author YYC
 * @version 1.0.0
 * @created 2024-01-01
 * @updated 2024-01-01
 */

import { 
  DataExchangeRequest, 
  DataExchangeResponse, 
  DataFormat, 
  DataSchema, 
  DataType,
  createRequestId 
} from './DataExchangeProtocol';
import { dataTransformationService } from './DataTransformationService';
import { AgricultureToEducationConverter } from './agriculture/AgricultureToEducationConverter';

/**
 * 数据交换服务类
 * 提供简化的API接口，管理行业间数据交换
 */
export class DataExchangeService {
  private static instance: DataExchangeService;
  private isInitialized = false;
  
  /**
   * 获取服务单例
   */
  public static getInstance(): DataExchangeService {
    if (!DataExchangeService.instance) {
      DataExchangeService.instance = new DataExchangeService();
    }
    return DataExchangeService.instance;
  }
  
  /**
   * 初始化数据交换服务
   * 注册所有转换器和模式
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('✅ 数据交换服务已经初始化');
      return;
    }
    
    console.log('🚀 开始初始化数据交换服务...');
    
    try {
      // 注册转换器
      this.registerConverters();
      
      // 注册标准数据模式
      this.registerStandardSchemas();
      
      this.isInitialized = true;
      console.log('✅ 数据交换服务初始化完成');
    } catch (error) {
      console.error('❌ 数据交换服务初始化失败:', error);
      throw new Error('数据交换服务初始化失败');
    }
  }
  
  /**
   * 交换数据
   * @param sourceIndustry 源行业
   * @param targetIndustry 目标行业
   * @param schemaId 数据模式ID
   * @param data 要交换的数据
   * @param format 目标格式
   * @param options 交换选项
   * @returns 交换结果
   */
  public async exchangeData(
    sourceIndustry: string,
    targetIndustry: string,
    schemaId: string,
    data: any,
    format: DataFormat = DataFormat.JSON,
    options: Record<string, any> = {}
  ): Promise<DataExchangeResponse> {
    // 确保服务已初始化
    await this.ensureInitialized();
    
    // 创建请求
    const request: DataExchangeRequest = {
      source: sourceIndustry,
      target: targetIndustry,
      schemaId,
      format,
      data,
      options,
      timestamp: Date.now(),
      requestId: createRequestId()
    };
    
    // 执行转换
    return dataTransformationService.transformData(request);
  }
  
  /**
   * 批量交换数据
   * @param exchanges 交换请求列表
   * @returns 交换结果列表
   */
  public async batchExchangeData(
    exchanges: Array<{
      source: string;
      target: string;
      schemaId: string;
      data: any;
      format?: DataFormat;
      options?: Record<string, any>;
    }>
  ): Promise<DataExchangeResponse[]> {
    // 确保服务已初始化
    await this.ensureInitialized();
    
    // 创建请求列表
    const requests: DataExchangeRequest[] = exchanges.map(exchange => ({
      source: exchange.source,
      target: exchange.target,
      schemaId: exchange.schemaId,
      format: exchange.format || DataFormat.JSON,
      data: exchange.data,
      options: exchange.options || {},
      timestamp: Date.now(),
      requestId: createRequestId()
    }));
    
    // 批量执行转换
    return dataTransformationService.transformBatchData(requests);
  }
  
  /**
   * 检查两个行业之间是否可以交换数据
   * @param sourceIndustry 源行业
   * @param targetIndustry 目标行业
   * @returns 是否可以交换
   */
  public canExchangeData(sourceIndustry: string, targetIndustry: string): boolean {
    return dataTransformationService.getConverter(sourceIndustry, targetIndustry) !== null;
  }
  
  /**
   * 获取支持的数据交换路径
   * @returns 支持的交换路径列表
   */
  public getSupportedExchanges(): Array<{source: string, target: string}> {
    return dataTransformationService.getSupportedTransformations();
  }
  
  /**
   * 注册新的数据模式
   * @param schema 数据模式
   */
  public registerSchema(schema: DataSchema): void {
    dataTransformationService.registerSchema(schema);
  }
  
  /**
   * 获取数据模式
   * @param schemaId 模式ID
   * @returns 数据模式或null
   */
  public getSchema(schemaId: string): DataSchema | null {
    return dataTransformationService.getSchema(schemaId);
  }
  
  /**
   * 获取所有可用的数据模式
   * @returns 数据模式列表
   */
  public getAllSchemas(): DataSchema[] {
    return dataTransformationService.getAllSchemas();
  }
  
  /**
   * 导出数据交换报告
   * @param requestIds 请求ID列表
   * @returns 交换报告
   */
  public async exportExchangeReport(requestIds: string[]): Promise<any> {
    // 生成简单的交换报告
    return {
      reportId: createRequestId(),
      generatedAt: new Date().toISOString(),
      requestCount: requestIds.length,
      supportedExchanges: this.getSupportedExchanges(),
      schemaCount: this.getAllSchemas().length
    };
  }
  
  /**
   * 清理服务
   */
  public clear(): void {
    dataTransformationService.clear();
    this.isInitialized = false;
    console.log('🧹 数据交换服务已清理');
  }
  
  /**
   * 内部方法：确保服务已初始化
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }
  
  /**
   * 内部方法：注册转换器
   */
  private registerConverters(): void {
    console.log('📋 注册数据转换器...');
    
    // 注册农业到教育的转换器
    dataTransformationService.registerConverter(new AgricultureToEducationConverter());
    
    // 可以在这里添加更多转换器
    // dataTransformationService.registerConverter(new EducationToAgricultureConverter());
    // dataTransformationService.registerConverter(new HealthcareToFinanceConverter());
    
    console.log(`✅ 转换器注册完成，共 ${dataTransformationService.getSupportedTransformations().length} 个转换路径`);
  }
  
  /**
   * 内部方法：注册标准数据模式
   */
  private registerStandardSchemas(): void {
    console.log('📋 注册标准数据模式...');
    
    // 注册农业相关模式
    dataTransformationService.registerSchema(this.createCropGrowthSchema());
    dataTransformationService.registerSchema(this.createSoilAnalysisSchema());
    dataTransformationService.registerSchema(this.createYieldPredictionSchema());
    
    // 注册教育相关模式
    dataTransformationService.registerSchema(this.createLearningProgressSchema());
    dataTransformationService.registerSchema(this.createLearningAbilitySchema());
    dataTransformationService.registerSchema(this.createGradePredictionSchema());
    
    console.log(`✅ 数据模式注册完成，共 ${dataTransformationService.getAllSchemas().length} 个模式`);
  }
  
  /**
   * 创建作物生长数据模式
   */
  private createCropGrowthSchema(): DataSchema {
    return {
      id: 'crop_growth_v1',
      name: '作物生长数据模式',
      description: '描述作物生长状态的数据结构',
      version: '1.0.0',
      fields: [
        { id: 'cropId', name: '作物ID', type: DataType.TEXT, required: true },
        { id: 'cropName', name: '作物名称', type: DataType.TEXT, required: true },
        { id: 'plantingDate', name: '种植日期', type: DataType.DATE, required: true },
        { id: 'growthStage', name: '生长阶段', type: DataType.TEXT, required: true },
        { id: 'height', name: '植株高度', type: DataType.NUMBER, required: true },
        { id: 'healthScore', name: '健康评分', type: DataType.NUMBER, required: true },
        { id: 'growthRate', name: '生长速率', type: DataType.NUMBER, required: true },
        { id: 'environmentalConditions', name: '环境条件', type: DataType.OBJECT, required: true },
        { id: 'pests', name: '病虫害情况', type: DataType.ARRAY, required: false },
        { id: 'estimatedHarvestDate', name: '预计收获日期', type: DataType.DATE, required: false },
        { id: 'estimatedYield', name: '预计产量', type: DataType.NUMBER, required: false }
      ],
      metadata: {
        industry: 'agriculture',
        category: 'growth_tracking',
        createdAt: new Date().toISOString()
      }
    };
  }
  
  /**
   * 创建土壤分析数据模式
   */
  private createSoilAnalysisSchema(): DataSchema {
    return {
      id: 'soil_analysis_v1',
      name: '土壤分析数据模式',
      description: '描述土壤养分和特性的数据结构',
      version: '1.0.0',
      fields: [
        { id: 'soilId', name: '土壤样本ID', type: DataType.TEXT, required: true },
        { id: 'location', name: '采样位置', type: DataType.TEXT, required: true },
        { id: 'analysisDate', name: '分析日期', type: DataType.DATE, required: true },
        { id: 'soilType', name: '土壤类型', type: DataType.TEXT, required: true },
        { id: 'pH', name: '酸碱度', type: DataType.NUMBER, required: true },
        { id: 'nutrients', name: '养分含量', type: DataType.OBJECT, required: true },
        { id: 'organicMatter', name: '有机质含量', type: DataType.NUMBER, required: true },
        { id: 'moisture', name: '含水率', type: DataType.NUMBER, required: true },
        { id: 'overallScore', name: '综合评分', type: DataType.NUMBER, required: true }
      ],
      metadata: {
        industry: 'agriculture',
        category: 'soil_health',
        createdAt: new Date().toISOString()
      }
    };
  }
  
  /**
   * 创建产量预测数据模式
   */
  private createYieldPredictionSchema(): DataSchema {
    return {
      id: 'yield_prediction_v1',
      name: '产量预测数据模式',
      description: '描述作物产量预测的数据结构',
      version: '1.0.0',
      fields: [
        { id: 'predictionId', name: '预测ID', type: DataType.TEXT, required: true },
        { id: 'cropType', name: '作物类型', type: DataType.TEXT, required: true },
        { id: 'predictionDate', name: '预测日期', type: DataType.DATE, required: true },
        { id: 'predictedYield', name: '预计产量', type: DataType.NUMBER, required: true },
        { id: 'yieldConfidence', name: '预测置信度', type: DataType.NUMBER, required: true },
        { id: 'historicalData', name: '历史数据', type: DataType.ARRAY, required: true },
        { id: 'influencingFactors', name: '影响因素', type: DataType.ARRAY, required: true }
      ],
      metadata: {
        industry: 'agriculture',
        category: 'production_forecast',
        createdAt: new Date().toISOString()
      }
    };
  }
  
  /**
   * 创建学习进度数据模式
   */
  private createLearningProgressSchema(): DataSchema {
    return {
      id: 'learning_progress_v1',
      name: '学习进度数据模式',
      description: '描述学习进度的数据结构',
      version: '1.0.0',
      fields: [
        { id: 'studentId', name: '学生ID', type: DataType.TEXT, required: true },
        { id: 'studentName', name: '学生姓名', type: DataType.TEXT, required: true },
        { id: 'enrollmentDate', name: '入学日期', type: DataType.DATE, required: true },
        { id: 'learningStage', name: '学习阶段', type: DataType.TEXT, required: true },
        { id: 'knowledgeLevel', name: '知识水平', type: DataType.NUMBER, required: true },
        { id: 'performanceScore', name: '表现评分', type: DataType.NUMBER, required: true },
        { id: 'learningRate', name: '学习速率', type: DataType.NUMBER, required: true },
        { id: 'learningEnvironment', name: '学习环境', type: DataType.OBJECT, required: true },
        { id: 'learningChallenges', name: '学习挑战', type: DataType.ARRAY, required: false },
        { id: 'courses', name: '课程列表', type: DataType.ARRAY, required: true },
        { id: 'overallProgress', name: '总体进度', type: DataType.NUMBER, required: true },
        { id: 'status', name: '学习状态', type: DataType.TEXT, required: true }
      ],
      metadata: {
        industry: 'education',
        category: 'learning_tracking',
        createdAt: new Date().toISOString()
      }
    };
  }
  
  /**
   * 创建学习能力数据模式
   */
  private createLearningAbilitySchema(): DataSchema {
    return {
      id: 'learning_ability_v1',
      name: '学习能力数据模式',
      description: '描述学习能力评估的数据结构',
      version: '1.0.0',
      fields: [
        { id: 'assessmentId', name: '评估ID', type: DataType.TEXT, required: true },
        { id: 'assessmentLocation', name: '评估地点', type: DataType.TEXT, required: true },
        { id: 'assessmentDate', name: '评估日期', type: DataType.DATE, required: true },
        { id: 'abilities', name: '能力指标', type: DataType.OBJECT, required: true },
        { id: 'adaptabilityScore', name: '适应能力评分', type: DataType.NUMBER, required: true },
        { id: 'learningStyle', name: '学习风格', type: DataType.TEXT, required: true },
        { id: 'knowledgeFoundation', name: '知识基础', type: DataType.TEXT, required: true },
        { id: 'aptitudeScore', name: '能力倾向评分', type: DataType.NUMBER, required: true }
      ],
      metadata: {
        industry: 'education',
        category: 'ability_assessment',
        createdAt: new Date().toISOString()
      }
    };
  }
  
  /**
   * 创建成绩预测数据模式
   */
  private createGradePredictionSchema(): DataSchema {
    return {
      id: 'grade_prediction_v1',
      name: '成绩预测数据模式',
      description: '描述学习成绩预测的数据结构',
      version: '1.0.0',
      fields: [
        { id: 'gradePredictionId', name: '成绩预测ID', type: DataType.TEXT, required: true },
        { id: 'subjectType', name: '科目类型', type: DataType.TEXT, required: true },
        { id: 'predictionDate', name: '预测日期', type: DataType.DATE, required: true },
        { id: 'predictedScore', name: '预计分数', type: DataType.NUMBER, required: true },
        { id: 'predictionConfidence', name: '预测置信度', type: DataType.NUMBER, required: true },
        { id: 'historicalGrades', name: '历史成绩', type: DataType.ARRAY, required: true },
        { id: 'gradeInfluencingFactors', name: '影响因素', type: DataType.ARRAY, required: true },
        { id: 'predictedGrade', name: '预测等级', type: DataType.TEXT, required: true }
      ],
      metadata: {
        industry: 'education',
        category: 'grade_prediction',
        createdAt: new Date().toISOString()
      }
    };
  }
}

// 导出默认实例
export const dataExchangeService = DataExchangeService.getInstance();
