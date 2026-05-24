/**
 * @file 商标检索工具
 * @description 提供商标检索、分析、监控和管理等核心功能
 * @module trademark-search
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 * @updated 2024-10-15
 */

// 商标基础信息接口
export interface TrademarkBasicInfo {
  trademarkId: string;
  name: string;
  applicationNumber: string;
  registrationNumber?: string;
  filingDate: string;
  registrationDate?: string;
  status: string;
  classes: number[];
  description: string;
  holderName: string;
  holderType?: string;
  imageUrl?: string;
  internationalClassification?: string;
}

// 相似商标结果接口
export interface SimilarTrademark {
  trademarkId: string;
  name: string;
  similarityScore: number;
  classes: number[];
  status: string;
  filingDate: string;
  holderName: string;
  conflicts?: string[];
  visualSimilarity?: number;
  phoneticSimilarity?: number;
  conceptualSimilarity?: number;
}

// 检索过滤条件接口
export interface SearchFilters {
  classes?: number[];
  status?: string[];
  filingDateRange?: [string, string];
  holderName?: string;
  descriptionKeywords?: string[];
  excludeSimilar?: boolean;
  includePending?: boolean;
  includeRegistered?: boolean;
  includeExpired?: boolean;
}

// 商标监控配置接口
export interface TrademarkMonitoringConfig {
  keywords: string[];
  classes: number[];
  competitorNames?: string[];
  visualSimilarityThreshold?: number;
  notificationFrequency: 'daily' | 'weekly' | 'immediate';
  alertOnNewApplications?: boolean;
  alertOnStatusChanges?: boolean;
  alertOnRenewals?: boolean;
  alertOnCancellations?: boolean;
}

// 商标风险评估接口
export interface TrademarkRiskAssessment {
  trademarkId: string;
  name: string;
  overallRisk: 'low' | 'medium' | 'high';
  similarityConflicts?: {
    count: number;
    highestRiskSimilarity?: number;
    affectedClasses?: number[];
  };
  legalObstacles?: string[];
  descriptiveStrength: 'fanciful' | 'arbitrary' | 'suggestive' | 'descriptive' | 'generic';
  registrabilityScore: number;
  suggestedActions?: string[];
  potentialOppositionReasons?: string[];
}

// 商标全生命周期接口
export interface TrademarkLifecycle {
  filingDetails: {
    filingDate: string;
    filingOffice: string;
    filingCost?: string;
    filingStatus: string;
  };
  examinationDetails?: {
    examinationDate?: string;
    examinationResults?: string;
    objections?: string[];
    responseDeadline?: string;
  };
  publicationDetails?: {
    publicationDate?: string;
    oppositionPeriod?: string;
    oppositionsFiled?: number;
  };
  registrationDetails?: {
    registrationDate?: string;
    registrationExpiry?: string;
    registrationCertificateUrl?: string;
  };
  maintenanceDetails?: {
    renewalDueDates?: string[];
    nextRenewalDate?: string;
    renewalCost?: string;
  };
  enforcementHistory?: {
    oppositions?: string[];
    cancellations?: string[];
    litigations?: string[];
  };
}

// 商标监控结果接口
export interface TrademarkMonitoringResult {
  alertId: string;
  timestamp: string;
  alertType: string;
  monitoredEntity: string;
  relatedTrademark?: TrademarkBasicInfo;
  description: string;
  severity: 'low' | 'medium' | 'high';
  recommendedAction?: string;
  relevantClasses?: number[];
}

// 商标战略分析接口
export interface TrademarkStrategyAnalysis {
  portfolioHealth: {
    totalTrademarks: number;
    registeredCount: number;
    pendingCount: number;
    expiredCount: number;
    renewalDueSoon?: number;
  };
  classCoverage: {
    coveredClasses: number[];
    gaps: number[];
    recommendedClasses?: number[];
  };
  competitiveAnalysis?: {
    keyCompetitors: { name: string; trademarkCount: number }[];
    overlappingClasses: number[];
    potentialConflicts?: string[];
  };
  protectionGaps?: string[];
  strategicRecommendations?: string[];
  marketExpansionOpportunities?: string[];
}

// 商标工作流配置接口
export interface TrademarkWorkflowConfig {
  steps: string[];
  approvers?: string[];
  deadlines?: string[];
  notifications?: {
    enabled: boolean;
    recipients: string[];
    events: string[];
  };
  documentationRequirements?: string[];
  reviewProcess?: 'single' | 'multi-stage';
}

// 商标检索工具配置接口
export interface TrademarkSearchToolsConfig {
  searchCapabilities: {
    visualSearch: boolean;
    phoneticSearch: boolean;
    conceptualSearch: boolean;
    wildCardSearch: boolean;
    transliterationSearch: boolean;
    multiJurisdictionSearch: boolean;
  };
  supportedJurisdictions: string[];
  databaseCoverage?: {
    registeredCount?: number;
    pendingCount?: number;
    historicalData?: string;
  };
  searchPerformance?: {
    maxResultsPerQuery?: number;
    timeoutSeconds?: number;
    cacheExpiryMinutes?: number;
  };
  analysisFeatures: {
    riskAssessment: boolean;
    similarityScoring: boolean;
    classificationSuggestion: boolean;
    holderAnalysis: boolean;
    marketplaceAnalysis: boolean;
  };
  workflowIntegration?: boolean;
  apiAccess?: boolean;
  dataExportFormats?: string[];
}

// 跨知识产权类型集成接口
export interface CrossIntellectualProperty {
  relatedPatents?: string[];
  relatedCopyrights?: string[];
  relatedDomainNames?: string[];
  brandProtectionCoverage?: 'partial' | 'comprehensive' | 'minimal';
  integrationRecommendations?: string[];
}

// 商标检索工具类
class TrademarkSearchTools {
  private config: TrademarkSearchToolsConfig;
  private cache: Map<string, { data: any; expiry: number }>;

  /**
   * 构造函数
   * @param config 配置参数
   */
  constructor(config: Partial<TrademarkSearchToolsConfig> = {}) {
    this.config = {
      searchCapabilities: config.searchCapabilities || {
        visualSearch: true,
        phoneticSearch: true,
        conceptualSearch: true,
        wildCardSearch: true,
        transliterationSearch: true,
        multiJurisdictionSearch: true
      },
      supportedJurisdictions: config.supportedJurisdictions || [
        '中国', '美国', '欧盟', '日本', '韩国', 
        '英国', '澳大利亚', '加拿大', '印度', '巴西'
      ],
      databaseCoverage: config.databaseCoverage || {
        registeredCount: 50000000,
        pendingCount: 10000000,
        historicalData: '1980年至今'
      },
      searchPerformance: config.searchPerformance || {
        maxResultsPerQuery: 500,
        timeoutSeconds: 30,
        cacheExpiryMinutes: 180
      },
      analysisFeatures: config.analysisFeatures || {
        riskAssessment: true,
        similarityScoring: true,
        classificationSuggestion: true,
        holderAnalysis: true,
        marketplaceAnalysis: true
      },
      workflowIntegration: config.workflowIntegration || true,
      apiAccess: config.apiAccess || true,
      dataExportFormats: config.dataExportFormats || ['CSV', 'Excel', 'PDF', 'JSON']
    };
    
    this.cache = new Map();
  }

  /**
   * 检查缓存数据
   * @param key 缓存键
   * @returns 缓存数据或null
   */
  private checkCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && cached.expiry > Date.now()) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  /**
   * 设置缓存数据
   * @param key 缓存键
   * @param data 缓存数据
   */
  private setCache(key: string, data: any): void {
    const expiry = Date.now() + (this.config.searchPerformance?.cacheExpiryMinutes || 180) * 60 * 1000;
    this.cache.set(key, { data, expiry });
  }

  /**
   * 构建查询缓存键
   * @param query 查询参数
   * @returns 缓存键
   */
  private buildCacheKey(query: Record<string, any>): string {
    return `trademark_${JSON.stringify(query)}`;
  }

  /**
   * 基础商标检索
   * @param params 检索参数
   * @returns 检索结果
   */
  async searchTrademarks(params: {
    keyword: string;
    filters?: SearchFilters;
    page?: number;
    limit?: number;
    sortBy?: 'relevance' | 'filingDate' | 'similarity';
    sortOrder?: 'asc' | 'desc';
    jurisdiction?: string;
  }): Promise<{
    results: TrademarkBasicInfo[];
    totalCount: number;
    page: number;
    limit: number;
    totalPages: number;
    queryTime?: number;
  }> {
    const cacheKey = this.buildCacheKey({ type: 'search', ...params });
    const cached = this.checkCache(cacheKey);
    
    if (cached) {
      return cached;
    }

    console.log(`执行商标检索:`, params);
    
    // 模拟检索结果
    const results: TrademarkBasicInfo[] = [
      {
        trademarkId: 'TM001',
        name: params.keyword,
        applicationNumber: '123456789',
        registrationNumber: '987654321',
        filingDate: '2020-01-15',
        registrationDate: '2020-07-20',
        status: 'registered',
        classes: [9, 35],
        description: '计算机软件、电子产品',
        holderName: '示例公司A',
        holderType: '企业',
        internationalClassification: 'Nice Classification'
      },
      {
        trademarkId: 'TM002',
        name: `${params.keyword}科技`,
        applicationNumber: '123456790',
        filingDate: '2021-03-22',
        status: 'pending',
        classes: [9, 42],
        description: '计算机编程服务',
        holderName: '示例公司B',
        holderType: '企业'
      },
      {
        trademarkId: 'TM003',
        name: `${params.keyword}创新`,
        applicationNumber: '123456791',
        filingDate: '2019-11-08',
        registrationDate: '2020-05-15',
        status: 'registered',
        classes: [35, 38],
        description: '市场营销、广告服务',
        holderName: '示例公司C',
        holderType: '企业'
      }
    ];

    const result = {
      results,
      totalCount: results.length,
      page: params.page || 1,
      limit: params.limit || 10,
      totalPages: 1,
      queryTime: 1.23
    };

    this.setCache(cacheKey, result);
    return result;
  }

  /**
   * 查找相似商标
   * @param params 查找参数
   * @returns 相似商标列表
   */
  async findSimilarTrademarks(params: {
    trademarkId?: string;
    name?: string;
    classes?: number[];
    similarityThreshold?: number;
    limit?: number;
    includeVisual?: boolean;
    includePhonetic?: boolean;
    includeConceptual?: boolean;
  }): Promise<SimilarTrademark[]> {
    const cacheKey = this.buildCacheKey({ type: 'similar', ...params });
    const cached = this.checkCache(cacheKey);
    
    if (cached) {
      return cached;
    }

    console.log(`查找相似商标:`, params);
    
    // 模拟相似商标结果
    const similarTrademarks: SimilarTrademark[] = [
      {
        trademarkId: 'STM001',
        name: params.name ? `${params.name}新` : '示例新',
        similarityScore: 0.85,
        classes: params.classes || [9, 35],
        status: 'registered',
        filingDate: '2019-05-10',
        holderName: '相似公司A',
        conflicts: ['文字相似度过高'],
        visualSimilarity: 0.82,
        phoneticSimilarity: 0.78,
        conceptualSimilarity: 0.90
      },
      {
        trademarkId: 'STM002',
        name: params.name ? `${params.name}科技` : '示例科技',
        similarityScore: 0.72,
        classes: [9, 42],
        status: 'pending',
        filingDate: '2021-02-15',
        holderName: '相似公司B',
        conflicts: ['包含相同核心词汇'],
        visualSimilarity: 0.68,
        phoneticSimilarity: 0.75,
        conceptualSimilarity: 0.82
      },
      {
        trademarkId: 'STM003',
        name: params.name ? `新${params.name}` : '新示例',
        similarityScore: 0.65,
        classes: [35, 38],
        status: 'registered',
        filingDate: '2020-08-22',
        holderName: '相似公司C',
        visualSimilarity: 0.60,
        phoneticSimilarity: 0.70,
        conceptualSimilarity: 0.68
      }
    ];

    this.setCache(cacheKey, similarTrademarks);
    return similarTrademarks;
  }

  /**
   * 获取商标详细信息
   * @param trademarkId 商标ID
   * @returns 商标详细信息
   */
  async getTrademarkDetails(trademarkId: string): Promise<{
    basicInfo: TrademarkBasicInfo;
    lifecycle: TrademarkLifecycle;
    similarTrademarks?: SimilarTrademark[];
    riskAssessment?: TrademarkRiskAssessment;
    holderInformation?: {
      name: string;
      address?: string;
      otherTrademarksCount?: number;
      filingHistory?: string;
    };
    legalHistory?: {
      oppositions?: string[];
      cancellations?: string[];
      litigations?: string[];
      transfers?: string[];
    };
  }> {
    const cacheKey = this.buildCacheKey({ type: 'details', trademarkId });
    const cached = this.checkCache(cacheKey);
    
    if (cached) {
      return cached;
    }

    console.log(`获取商标详情: ${trademarkId}`);
    
    // 模拟商标详情
    const result = {
      basicInfo: {
        trademarkId,
        name: '示例商标',
        applicationNumber: '123456789',
        registrationNumber: '987654321',
        filingDate: '2020-01-15',
        registrationDate: '2020-07-20',
        status: 'registered',
        classes: [9, 35],
        description: '计算机软件、电子产品、广告服务',
        holderName: '示例公司A',
        holderType: '企业',
        internationalClassification: 'Nice Classification'
      },
      lifecycle: {
        filingDetails: {
          filingDate: '2020-01-15',
          filingOffice: '中国国家知识产权局',
          filingCost: '1000元',
          filingStatus: '已完成'
        },
        examinationDetails: {
          examinationDate: '2020-03-10',
          examinationResults: '通过',
          filingStatus: '无异议',
          responseDeadline: '2020-04-10'
        },
        publicationDetails: {
          publicationDate: '2020-04-15',
          oppositionPeriod: '3个月',
          oppositionsFiled: 0
        },
        registrationDetails: {
          registrationDate: '2020-07-20',
          registrationExpiry: '2030-01-15',
          registrationCertificateUrl: 'https://example.com/certificate'
        },
        maintenanceDetails: {
          renewalDueDates: ['2030-01-15', '2040-01-15'],
          nextRenewalDate: '2030-01-15',
          renewalCost: '2000元'
        }
      },
      similarTrademarks: [
        {
          trademarkId: 'STM001',
          name: '示例新',
          similarityScore: 0.85,
          classes: [9, 35],
          status: 'registered',
          filingDate: '2019-05-10',
          holderName: '相似公司A',
          conflicts: ['文字相似度过高']
        }
      ],
      riskAssessment: {
        trademarkId,
        name: '示例商标',
        overallRisk: 'medium' as 'high' | 'low' | 'medium',
        similarityConflicts: {
          count: 1,
          highestRiskSimilarity: 0.85,
          affectedClasses: [9]
        },
        legalObstacles: ['存在相似已注册商标'],
        descriptiveStrength: 'suggestive' as const,
        registrabilityScore: 75,
        suggestedActions: ['考虑调整商标设计', '增加使用证据'],
        potentialOppositionReasons: ['混淆可能性']
      },
      holderInformation: {
        name: '示例公司A',
        address: '北京市海淀区科技园区',
        otherTrademarksCount: 45,
        filingHistory: '自2010年起持续申请商标'
      }
    };

    this.setCache(cacheKey, result);
    return result;
  }

  /**
   * 评估商标注册风险
   * @param params 评估参数
   * @returns 风险评估结果
   */
  async assessTrademarkRisk(params: {
    name: string;
    classes: number[];
    description?: string;
    existingTrademarkId?: string;
    useEvidence?: string;
  }): Promise<TrademarkRiskAssessment> {
    const cacheKey = this.buildCacheKey({ type: 'risk', ...params });
    const cached = this.checkCache(cacheKey);
    
    if (cached) {
      return cached;
    }

    console.log(`评估商标风险:`, params);
    
    // 模拟风险评估结果
    const result: TrademarkRiskAssessment = {
      trademarkId: params.existingTrademarkId || `RISK-${Date.now()}`,
      name: params.name,
      overallRisk: 'medium',
      similarityConflicts: {
        count: 3,
        highestRiskSimilarity: 0.78,
        affectedClasses: [9]
      },
      legalObstacles: [
        '在第9类存在高相似度已注册商标',
        '部分描述性词汇可能面临审查障碍'
      ],
      descriptiveStrength: 'suggestive',
      registrabilityScore: 72,
      suggestedActions: [
        '进行更详细的相似商标分析',
        '考虑增加图形元素以提高显著性',
        '准备充分的使用证据',
        '咨询专业商标律师'
      ],
      potentialOppositionReasons: ['混淆可能性', '描述性太强']
    };

    this.setCache(cacheKey, result);
    return result;
  }

  /**
   * 设置商标监控
   * @param params 监控参数
   * @returns 监控设置结果
   */
  async setupTrademarkMonitoring(params: {
    config: TrademarkMonitoringConfig;
    name?: string;
    description?: string;
    userId?: string;
  }): Promise<{
    monitoringId: string;
    name: string;
    config: TrademarkMonitoringConfig;
    status: 'active' | 'paused' | 'pending';
    createdAt: string;
    nextRunDate?: string;
    estimatedAlertFrequency?: string;
  }> {
    console.log(`设置商标监控:`, params);
    
    // 模拟监控设置结果
    const result = {
      monitoringId: `MON-${Date.now()}`,
      name: params.name || '商标监控',
      config: params.config,
      status: 'active' as 'active' | 'paused' | 'pending',
      createdAt: new Date().toISOString(),
      nextRunDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      estimatedAlertFrequency: '每周2-3条'
    };

    return result;
  }

  /**
   * 获取商标监控结果
   * @param monitoringId 监控ID
   * @returns 监控结果
   */
  async getMonitoringResults(monitoringId: string): Promise<{
    monitoringId: string;
    totalAlerts: number;
    recentAlerts: TrademarkMonitoringResult[];
    alertSummary: {
      highRisk: number;
      mediumRisk: number;
      lowRisk: number;
      byType: Record<string, number>;
    };
    lastChecked?: string;
    nextCheck?: string;
  }> {
    console.log(`获取监控结果: ${monitoringId}`);
    
    // 模拟监控结果
    const result = {
      monitoringId,
      totalAlerts: 15,
      recentAlerts: [
        {
          alertId: 'ALT-001',
          timestamp: new Date().toISOString(),
          alertType: 'newApplication' as const,
          monitoredEntity: '关键词监控',
          relatedTrademark: {
            trademarkId: 'NEW-001',
            name: '相似商标申请',
            applicationNumber: '987654321',
            filingDate: new Date().toISOString().split('T')[0],
            status: 'pending',
            classes: [9, 35],
            description: '计算机软件',
            holderName: '新申请公司'
          },
          description: '检测到与您监控的关键词高度相似的新商标申请',
          severity: 'high' as 'high' | 'medium' | 'low',
          recommendedAction: '评估潜在冲突并考虑提出异议',
          relevantClasses: [9]
        },
        {
          alertId: 'ALT-002',
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          alertType: 'statusChange' as const,
          monitoredEntity: 'TM001',
          description: '您监控的商标状态已更新',
          severity: 'medium' as 'high' | 'medium' | 'low',
          recommendedAction: '查看详细状态变更信息'
        }
      ],
      alertSummary: {
        highRisk: 3,
        mediumRisk: 8,
        lowRisk: 4,
        byType: {
          'newApplication': 7,
          'statusChange': 5,
          'renewal': 2,
          'cancellation': 1
        }
      },
      lastChecked: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      nextCheck: new Date(Date.now() + 18 * 60 * 60 * 1000).toISOString()
    };

    return result;
  }

  /**
   * 商标组合战略分析
   * @param params 分析参数
   * @returns 战略分析结果
   */
  async analyzeTrademarkPortfolio(params: {
    holderName?: string;
    trademarkIds?: string[];
    industry?: string;
    includeCompetitiveAnalysis?: boolean;
    includeRiskAssessment?: boolean;
  }): Promise<TrademarkStrategyAnalysis> {
    console.log(`分析商标组合战略:`, params);
    
    // 模拟战略分析结果
    const result: TrademarkStrategyAnalysis = {
      portfolioHealth: {
        totalTrademarks: 45,
        registeredCount: 38,
        pendingCount: 5,
        expiredCount: 2,
        renewalDueSoon: 3
      },
      classCoverage: {
        coveredClasses: [9, 35, 38, 41, 42],
        gaps: [16, 25, 28],
        recommendedClasses: [16, 25]
      },
      ...(params.includeCompetitiveAnalysis && {
        competitiveAnalysis: {
          keyCompetitors: [
            { name: '竞争对手A', trademarkCount: 67 },
            { name: '竞争对手B', trademarkCount: 52 },
            { name: '竞争对手C', trademarkCount: 38 }
          ],
          overlappingClasses: [9, 35, 42],
          potentialConflicts: ['在第9类存在相似商标']
        }
      }),
      protectionGaps: [
        '在新兴产品线领域缺乏商标保护',
        '部分核心商标仅在国内注册',
        '防御性商标布局不足'
      ],
      strategicRecommendations: [
        '扩展至建议的商品/服务类别',
        '制定国际商标注册计划',
        '加强对即将到期商标的续展管理',
        '建立更完善的商标监控体系'
      ],
      marketExpansionOpportunities: [
        '考虑在东南亚市场注册核心商标',
        '为新产品线提前布局商标',
        '建立商标许可体系'
      ]
    };

    return result;
  }

  /**
   * 创建自定义商标工作流
   * @param params 工作流参数
   * @returns 工作流创建结果
   */
  async createCustomWorkflow(params: {
    name: string;
    config: TrademarkWorkflowConfig;
    description?: string;
    ownerId?: string;
  }): Promise<{
    workflowId: string;
    name: string;
    config: TrademarkWorkflowConfig;
    status: 'active' | 'draft' | 'archived';
    createdAt: string;
    updatedAt?: string;
    usageCount?: number;
  }> {
    console.log(`创建自定义工作流:`, params);
    
    // 模拟工作流创建结果
    const result = {
      workflowId: `WF-${Date.now()}`,
      name: params.name,
      config: params.config,
      status: 'active' as 'active' | 'draft' | 'archived',
      createdAt: new Date().toISOString(),
      usageCount: 0
    };

    return result;
  }

  /**
   * 跨知识产权类型集成分析
   * @param params 分析参数
   * @returns 集成分析结果
   */
  async analyzeCrossIntellectualProperty(params: {
    trademarkId: string;
    includePatents?: boolean;
    includeCopyrights?: boolean;
    includeDomainNames?: boolean;
  }): Promise<CrossIntellectualProperty> {
    console.log(`跨知识产权类型分析:`, params);
    
    // 模拟跨IP类型分析结果
    const result: CrossIntellectualProperty = {
      brandProtectionCoverage: 'partial' as const,
      integrationRecommendations: [
        '整合商标与专利保护策略',
        '加强域名保护，防止域名抢注',
        '建立统一的知识产权管理体系',
        '定期进行跨类型知识产权审计'
      ],
      ...(params.includePatents && { relatedPatents: ['PAT001', 'PAT002'] }),
      ...(params.includeCopyrights && { relatedCopyrights: ['CPRT001'] }),
      ...(params.includeDomainNames && { relatedDomainNames: ['example.com', 'example.cn'] })
    };

    return result;
  }
}

// 默认配置
const defaultConfig: TrademarkSearchToolsConfig = {
  searchCapabilities: {
    visualSearch: true,
    phoneticSearch: true,
    conceptualSearch: true,
    wildCardSearch: true,
    transliterationSearch: true,
    multiJurisdictionSearch: true
  },
  supportedJurisdictions: [
    '中国', '美国', '欧盟', '日本', '韩国', 
    '英国', '澳大利亚', '加拿大', '印度', '巴西'
  ],
  databaseCoverage: {
    registeredCount: 50000000,
    pendingCount: 10000000,
    historicalData: '1980年至今'
  },
  searchPerformance: {
    maxResultsPerQuery: 500,
    timeoutSeconds: 30,
    cacheExpiryMinutes: 180
  },
  analysisFeatures: {
    riskAssessment: true,
    similarityScoring: true,
    classificationSuggestion: true,
    holderAnalysis: true,
    marketplaceAnalysis: true
  },
  workflowIntegration: true,
  apiAccess: true,
  dataExportFormats: ['CSV', 'Excel', 'PDF', 'JSON']
};

// 创建默认实例
const defaultTrademarkSearchTools = new TrademarkSearchTools(defaultConfig);

// 导出类和默认实例
export { TrademarkSearchTools };
export default defaultTrademarkSearchTools;
export { defaultTrademarkSearchTools as DefaultTrademarkSearchTools };