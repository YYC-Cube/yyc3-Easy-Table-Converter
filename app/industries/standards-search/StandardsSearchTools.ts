/**
 * @file 标准规范检索工具
 * @description 提供标准规范检索、合规分析、智能解读等核心功能
 * @module standards-search
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 * @updated 2024-10-15
 */

// 标准体系接口
export interface StandardSystems {
  international: string[];
  regional: string[];
  industry: string[];
}

// 检索维度接口
export interface SearchDimensions {
  byField: string[];
  byApplication: string[];
  byIndustry: string[];
}

// 合规性分析检查项接口
export interface ComplianceChecks {
  checks: string[];
  tools?: string[];
  optimization?: string[];
  support?: string[];
  automation?: string[];
}

// 合规性分析引擎接口
export interface ComplianceAnalysisEngine {
  productDesign: ComplianceChecks;
  productionProcess: ComplianceChecks;
  certification: ComplianceChecks;
}

// 标准生命周期管理接口
export interface StandardsLifecycleManagement {
  monitoring: string[];
  impactAssessment: string[];
  actionPlanning: string[];
}

// 跨标准协调分析接口
export interface CrossStandardAnalysis {
  conflictDetection: string[];
  harmonization: string[];
  gapAnalysis: string[];
}

// 智能解读项接口
export interface InterpretationItems {
  keyRequirements: string[];
  applicability: string[];
  bestPractices: string[];
}

// 自动化合规检查接口
export interface AutomatedComplianceChecks {
  documentAnalysis: string[];
  processMonitoring: string[];
  realTimeAlerts: string[];
}

// 标准规范工具配置接口
export interface StandardsSearchToolsConfig {
  standardSystems: StandardSystems;
  searchDimensions: SearchDimensions;
  complianceAnalysis: ComplianceAnalysisEngine;
  standardsLifecycle: StandardsLifecycleManagement;
  crossStandardAnalysis: CrossStandardAnalysis;
  intelligentInterpretation: InterpretationItems;
  automatedCompliance: AutomatedComplianceChecks;
  systemOptimization: string[];
  maxResultsPerQuery?: number;
  cacheExpiryMinutes?: number;
}

// 标准搜索结果接口
export interface StandardSearchResult {
  standardId: string;
  title: string;
  issuingBody: string;
  issueDate: string;
  version: string;
  status: 'current' | 'draft' | 'replaced' | 'withdrawn';
  category: string;
  industry: string[];
  relevanceScore: number;
  abstract?: string;
  keyRequirements?: string[];
  applicability?: {
    products?: string[];
    processes?: string[];
    regions?: string[];
  };
}

// 合规性分析结果接口
export interface ComplianceAnalysisResult {
  standardId: string;
  standardTitle: string;
  analysisDate: string;
  complianceStatus: 'compliant' | 'non-compliant' | 'partial';
  detailedResults: {
    section: string;
    requirement: string;
    complianceStatus: 'compliant' | 'non-compliant' | 'not-applicable';
    evidence?: string;
    recommendation?: string;
  }[];
  gapAnalysis?: {
    missingRequirements: string[];
    suggestedActions: string[];
  };
  certificationPath?: string[];
}

// 标准规范检索工具类
class StandardsSearchTools {
  private config: StandardsSearchToolsConfig;
  private cache: Map<string, { data: any; expiry: number }>;

  /**
   * 构造函数
   * @param config 配置参数
   */
  constructor(config: Partial<StandardsSearchToolsConfig> = {}) {
    this.config = {
      standardSystems: config.standardSystems || {
        international: ['ISO', 'IEC', 'ITU', 'IEEE', 'ASTM'],
        regional: ['EN(欧盟)', 'ANSI(美国)', 'JIS(日本)', 'GB(中国)'],
        industry: [
          'API(石油)', 'UL(安全)', 'SAE(汽车)', 
          'IPC(电子)', 'NFPA(消防)', 'ASME(机械)'
        ]
      },
      searchDimensions: config.searchDimensions || {
        byField: ['关键词', '标准号', '发布机构', '替代关系'],
        byApplication: ['产品设计', '生产工艺', '测试方法', '管理体系'],
        byIndustry: ['制造业', '建筑业', '信息技术', '医疗设备']
      },
      complianceAnalysis: config.complianceAnalysis || {
        productDesign: {
          checks: [
            '安全规范符合性',
            '环保要求满足度',
            '能效标准达标',
            '材料限制合规'
          ],
          tools: [
            '自动标准引用检查',
            '冲突规范识别',
            '缺失要求提示',
            '最佳实践推荐'
          ]
        },
        productionProcess: {
          checks: [
            '工艺流程标准化',
            '质量控制点设置',
            '设备安全防护',
            '环境排放合规'
          ],
          optimization: [
            '工艺参数优化建议',
            '效率提升方案',
            '成本节约机会',
            '质量改进措施'
          ]
        },
        certification: {
          checks: [
            '认证要求符合性',
            '审核准备充分性',
            '证书有效性维护',
            '持续改进机制'
          ],
          support: [
            '认证路径规划',
            '测试要求明确',
            '文档准备清单',
            '审核应对策略'
          ],
          automation: [
            '申请材料生成',
            '检查表自动填写',
            '进度跟踪提醒',
            '证书更新管理'
          ]
        }
      },
      standardsLifecycle: config.standardsLifecycle || {
        monitoring: [
          '标准制修订计划跟踪',
          '草案征求意见提醒',
          '版本更新自动检测',
          '废止替代关系映射'
        ],
        impactAssessment: [
          '受影响产品分析',
          '技术变更成本估算',
          '合规差距识别',
          '过渡期策略制定'
        ],
        actionPlanning: [
          '标准升级路线图',
          '培训需求分析',
          '文件修订计划',
          '内部审核安排'
        ]
      },
      crossStandardAnalysis: config.crossStandardAnalysis || {
        conflictDetection: [
          '技术要求不一致',
          '测试方法冲突',
          '合格判定差异',
          '定义术语混淆'
        ],
        harmonization: [
          '国际标准协调度',
          '区域差异分析',
          '行业特殊要求',
          '企业标准衔接'
        ],
        gapAnalysis: [
          '覆盖范围缺失',
          '技术内容过时',
          '新兴领域空白',
          '监管要求更新'
        ]
      },
      intelligentInterpretation: config.intelligentInterpretation || {
        keyRequirements: [
          '强制性条款提取',
          '技术参数摘要',
          '测试方法说明',
          '符合性证据要求'
        ],
        applicability: [
          '产品范围匹配',
          '地域适用性',
          '行业相关性',
          '企业规模适配'
        ],
        bestPractices: [
          '行业领先做法',
          '常见问题规避',
          '效率提升技巧',
          '成本优化方案'
        ]
      },
      automatedCompliance: config.automatedCompliance || {
        documentAnalysis: [
          '技术文档标准引用检查',
          '测试报告规范性验证',
          '认证材料完整性评估',
          '质量手册符合性审核'
        ],
        processMonitoring: [
          '生产记录标准符合性',
          '检验数据规范性',
          '设备校准标准遵循',
          '人员资质标准要求'
        ],
        realTimeAlerts: [
          '偏离标准操作预警',
          '参数超限提醒',
          '文档过期通知',
          '法规更新影响提示'
        ]
      },
      systemOptimization: config.systemOptimization || [
        '企业标准体系诊断',
        '标准冗余识别',
        '体系结构优化建议',
        '数字化转型路线'
      ],
      maxResultsPerQuery: config.maxResultsPerQuery || 50,
      cacheExpiryMinutes: config.cacheExpiryMinutes || 120
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
    const expiry = Date.now() + (this.config.cacheExpiryMinutes || 120) * 60 * 1000;
    this.cache.set(key, { data, expiry });
  }

  /**
   * 构建查询缓存键
   * @param query 查询参数
   * @returns 缓存键
   */
  private buildCacheKey(query: Record<string, any>): string {
    return `standards_search_${JSON.stringify(query)}`;
  }

  /**
   * 标准规范搜索
   * @param query 查询参数
   * @returns 搜索结果列表
   */
  async searchStandards(query: {
    keyword?: string;
    standardId?: string;
    issuingBody?: string;
    industry?: string;
    application?: string;
    limit?: number;
  }): Promise<StandardSearchResult[]> {
    const cacheKey = this.buildCacheKey({ type: 'search', ...query });
    const cached = this.checkCache(cacheKey);
    
    if (cached) {
      return cached;
    }

    console.log(`搜索标准规范:`, query);
    
    // 模拟搜索结果
    const results: StandardSearchResult[] = [
      {
        standardId: 'GB/T 19001-2016',
        title: '质量管理体系 要求',
        issuingBody: '国家市场监督管理总局',
        issueDate: '2016-12-30',
        version: '2016',
        status: 'current' as const,
        category: '管理体系',
        industry: ['制造业', '服务业', '信息技术'],
        relevanceScore: 0.95,
        abstract: '本标准规定了质量管理体系要求，旨在增强顾客满意。'
      },
      {
        standardId: 'ISO 9001:2015',
        title: 'Quality management systems — Requirements',
        issuingBody: 'ISO',
        issueDate: '2015-09-15',
        version: '2015',
        status: 'current' as const,
        category: '管理体系',
        industry: ['通用'],
        relevanceScore: 0.92,
        abstract: 'This International Standard specifies requirements for a quality management system.'
      },
      {
        standardId: 'GB/T 24001-2016',
        title: '环境管理体系 要求及使用指南',
        issuingBody: '国家市场监督管理总局',
        issueDate: '2016-10-13',
        version: '2016',
        status: 'current' as const,
        category: '管理体系',
        industry: ['制造业', '建筑业', '服务业'],
        relevanceScore: 0.85,
        abstract: '本标准规定了环境管理体系要求，使组织能够系统地提升其环境绩效。'
      }
    ];

    this.setCache(cacheKey, results);
    return results;
  }

  /**
   * 获取标准详情
   * @param standardId 标准ID
   * @returns 标准详细信息
   */
  async getStandardDetails(standardId: string): Promise<{
    basicInfo: StandardSearchResult;
    keyRequirements: string[];
    applicability: {
      products: string[];
      processes: string[];
      regions: string[];
    };
    implementationGuidelines: string[];
    relatedStandards: string[];
    lifecycleStatus: {
      currentVersion: string;
      nextReviewDate?: string;
      isUnderRevision: boolean;
      replacementStandard?: string;
    };
  }> {
    const cacheKey = this.buildCacheKey({ type: 'details', standardId });
    const cached = this.checkCache(cacheKey);
    
    if (cached) {
      return cached;
    }

    console.log(`获取标准详情: ${standardId}`);
    
    // 模拟标准详情
    const result = {
      basicInfo: {
        standardId,
        title: standardId.includes('ISO') ? 
          'Quality management systems — Requirements' : 
          '质量管理体系 要求',
        issuingBody: standardId.includes('ISO') ? 'ISO' : '国家市场监督管理总局',
        issueDate: standardId.includes('ISO') ? '2015-09-15' : '2016-12-30',
        version: standardId.match(/\d{4}/)?.[0] || '2016',
        status: 'current' as const,
        category: '管理体系',
        industry: ['通用'],
        relevanceScore: 1.0
      },
      keyRequirements: [
        '组织环境分析与相关方需求识别',
        '领导作用与质量方针制定',
        '策划（风险与机遇应对）',
        '支持（资源、能力、意识）',
        '运行策划与控制',
        '绩效评价与改进'
      ],
      applicability: {
        products: ['各类产品和服务'],
        processes: ['设计开发、生产、服务等'],
        regions: ['全球适用']
      },
      implementationGuidelines: [
        '理解组织环境和相关方需求',
        '建立符合组织实际的质量管理体系文件',
        '实施内部审核和管理评审',
        '持续改进质量管理体系有效性'
      ],
      relatedStandards: ['ISO 9000:2015', 'ISO 9004:2018', 'GB/T 19000-2016'],
      lifecycleStatus: {
        currentVersion: standardId.match(/\d{4}/)?.[0] || '2016',
        nextReviewDate: '2023-09-15',
        isUnderRevision: false
      }
    };

    this.setCache(cacheKey, result);
    return result;
  }

  /**
   * 合规性分析
   * @param params 分析参数
   * @returns 合规性分析结果
   */
  async analyzeCompliance(params: {
    standardId: string;
    productDescription?: string;
    processDescription?: string;
    existingComplianceData?: any;
  }): Promise<ComplianceAnalysisResult> {
    const cacheKey = this.buildCacheKey({ type: 'compliance', ...params });
    const cached = this.checkCache(cacheKey);
    
    if (cached) {
      return cached;
    }

    console.log(`执行合规性分析:`, params);
    
    // 模拟合规性分析结果
    const result: ComplianceAnalysisResult = {
      standardId: params.standardId,
      standardTitle: params.standardId.includes('ISO') ? 
        'Quality management systems — Requirements' : 
        '质量管理体系 要求',
      analysisDate: new Date().toISOString(),
      complianceStatus: 'partial',
      detailedResults: [
        {
          section: '4.1 组织环境',
          requirement: '组织应确定与其宗旨和战略方向相关并影响其实现质量管理体系预期结果的能力的各种外部和内部因素。',
          complianceStatus: 'compliant',
          evidence: '已完成SWOT分析和相关方需求调查'
        },
        {
          section: '6.1 应对风险和机遇的措施',
          requirement: '组织应策划：a)应对这些风险和机遇的措施；b)如何：1)在质量管理体系过程中整合并实施这些措施；2)评价这些措施的有效性。',
          complianceStatus: 'non-compliant',
          evidence: '已识别主要风险，但应对措施不够全面',
          recommendation: '建议完善风险应对措施并定期评审'
        },
        {
          section: '8.5.1 生产和服务提供的控制',
          requirement: '组织应在受控条件下进行生产和服务提供。',
          complianceStatus: 'non-compliant',
          recommendation: '建议建立完整的生产过程控制程序和记录'
        }
      ],
      gapAnalysis: {
        missingRequirements: [
          '生产过程控制程序不完整',
          '内部审核计划未覆盖所有部门',
          '数据分析方法不够系统'
        ],
        suggestedActions: [
          '制定生产过程控制标准操作程序',
          '完善内部审核计划',
          '建立数据分析流程'
        ]
      },
      certificationPath: [
        '差距分析与整改',
        '文件体系完善',
        '内部审核',
        '管理评审',
        '认证机构现场审核'
      ]
    };

    this.setCache(cacheKey, result);
    return result;
  }

  /**
   * 标准更新监控
   * @param standards 标准列表
   * @returns 更新监控结果
   */
  async monitorStandardsUpdates(standards: string[]): Promise<{
    updates: {
      standardId: string;
      currentVersion: string;
      newVersion?: string;
      updateType: 'draft' | 'released' | 'withdrawn';
      releaseDate?: string;
      impactLevel: 'low' | 'medium' | 'high';
      summary?: string;
    }[];
    totalMonitored: number;
    updatesFound: number;
  }> {
    console.log(`监控标准更新:`, standards);
    
    // 模拟更新监控结果
    const result = {
      updates: [
        {
          standardId: standards[0],
          currentVersion: '2015',
          newVersion: '2023',
          updateType: 'draft' as const,
          releaseDate: '2023-12-31',
          impactLevel: 'medium' as const,
          summary: '主要更新了风险管理要求和绩效评价方法'
        }
      ],
      totalMonitored: standards.length,
      updatesFound: 1
    };

    return result;
  }

  /**
   * 智能解读标准
   * @param params 解读参数
   * @returns 智能解读结果
   */
  async interpretStandard(params: {
    standardId: string;
    focusArea?: 'requirements' | 'applicability' | 'practices';
    industryContext?: string;
  }): Promise<{
    standardId: string;
    interpretationType: string;
    keyFindings: string[];
    recommendations: string[];
    bestPractices?: string[];
    applicabilityAnalysis?: {
      isApplicable: boolean;
      rationale: string;
      adaptationSuggestions: string[];
    };
  }> {
    console.log(`智能解读标准:`, params);
    
    // 模拟智能解读结果
    const result: any = {
      standardId: params.standardId,
      interpretationType: params.focusArea || 'requirements',
      keyFindings: [
        '该标准采用过程方法，结合PDCA循环和风险管理思维',
        '领导作用是标准实施的关键成功因素',
        '强调基于风险的思维进行质量管理',
        '要求组织关注相关方需求和期望'
      ],
      recommendations: [
        '高层管理者应亲自参与质量管理体系的建立和运行',
        '将风险管理融入日常业务流程',
        '建立有效的内部沟通机制',
        '定期收集和分析相关方反馈'
      ],
      bestPractices: [
        '成立跨部门的质量管理团队',
        '采用可视化管理工具展示质量目标和绩效',
        '实施员工质量意识培训计划',
        '建立持续改进激励机制'
      ]
    };

    if (params.focusArea === 'applicability') {
      result.applicabilityAnalysis = {
        isApplicable: true,
        rationale: '该标准适用于所有类型和规模的组织',
        adaptationSuggestions: [
          '根据组织规模调整文件化程度',
          '重点关注与组织核心业务相关的要求',
          '利用现有管理工具整合质量管理体系'
        ]
      };
    }

    return result;
  }

  /**
   * 冲突标准检测
   * @param standardIds 标准ID列表
   * @returns 冲突检测结果
   */
  async detectStandardConflicts(standardIds: string[]): Promise<{
    conflicts: {
      standardId1: string;
      standardId2: string;
      conflictType: string;
      description: string;
      resolutionSuggestion: string;
    }[];
    compatibilityAssessment: 'high' | 'medium' | 'low';
    harmonizationRecommendations: string[];
  }> {
    console.log(`检测标准冲突:`, standardIds);
    
    // 模拟冲突检测结果
    const result = {
      conflicts: [
        {
          standardId1: 'ISO 9001:2015',
          standardId2: 'GB/T 19001-2016',
          conflictType: '版本差异',
          description: 'GB/T 19001-2016等同采用ISO 9001:2015，技术内容无实质差异',
          resolutionSuggestion: '按较新版本执行，保持一致性'
        }
      ],
      compatibilityAssessment: 'high' as const,
      harmonizationRecommendations: [
        '建立标准协调矩阵，明确各标准适用范围',
        '制定统一的实施指南',
        '定期评审标准组合的有效性'
      ]
    };

    return result;
  }

  /**
   * 生成合规改进计划
   * @param analysisResult 合规性分析结果
   * @returns 改进计划
   */
  async generateImprovementPlan(analysisResult: ComplianceAnalysisResult): Promise<{
    planId: string;
    standardId: string;
    createdDate: string;
    priorityItems: {
      issue: string;
      priority: 'high' | 'medium' | 'low';
      actionSteps: string[];
      responsibleRole?: string;
      targetCompletionDate?: string;
    }[];
    implementationTimeline: {
      phase: string;
      startDate: string;
      endDate: string;
      keyMilestones: string[];
    }[];
    resourceEstimates?: {
      humanResources?: string[];
      trainingNeeds?: string[];
      budgetEstimate?: string;
    };
  }> {
    console.log(`生成改进计划基于分析结果:`, analysisResult);
    
    // 模拟改进计划
    const result = {
      planId: `PLAN-${Date.now()}`,
      standardId: analysisResult.standardId,
      createdDate: new Date().toISOString(),
      priorityItems: [
        {
          issue: '生产过程控制不完整',
          priority: 'high' as const,
          actionSteps: [
            '制定生产过程控制程序',
            '建立关键工序控制点',
            '培训操作人员',
            '实施过程记录系统'
          ],
          responsibleRole: '生产经理',
          targetCompletionDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          issue: '风险管理措施不够全面',
          priority: 'medium' as const,
          actionSteps: [
            '完善风险识别方法',
            '制定详细的风险应对计划',
            '建立风险监控机制'
          ],
          responsibleRole: '质量经理',
          targetCompletionDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString()
        }
      ],
      implementationTimeline: [
        {
          phase: '准备阶段',
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          keyMilestones: ['成立改进小组', '明确职责分工', '制定详细计划']
        },
        {
          phase: '实施阶段',
          startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
          keyMilestones: ['完成文件编写', '人员培训', '试运行']
        },
        {
          phase: '评估阶段',
          startDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
          keyMilestones: ['内部审核', '管理评审', '持续改进']
        }
      ],
      resourceEstimates: {
        humanResources: ['质量经理1名', '生产工程师2名', '培训专员1名'],
        trainingNeeds: ['ISO 9001标准培训', '过程控制培训', '风险评估培训'],
        budgetEstimate: '约10万元'
      }
    };

    return result;
  }
}

// 默认配置
const defaultConfig: StandardsSearchToolsConfig = {
  standardSystems: {
    international: ['ISO', 'IEC', 'ITU', 'IEEE', 'ASTM'],
    regional: ['EN(欧盟)', 'ANSI(美国)', 'JIS(日本)', 'GB(中国)'],
    industry: [
      'API(石油)', 'UL(安全)', 'SAE(汽车)', 
      'IPC(电子)', 'NFPA(消防)', 'ASME(机械)'
    ]
  },
  searchDimensions: {
    byField: ['关键词', '标准号', '发布机构', '替代关系'],
    byApplication: ['产品设计', '生产工艺', '测试方法', '管理体系'],
    byIndustry: ['制造业', '建筑业', '信息技术', '医疗设备']
  },
  complianceAnalysis: {
    productDesign: {
      checks: [
        '安全规范符合性',
        '环保要求满足度',
        '能效标准达标',
        '材料限制合规'
      ],
      tools: [
        '自动标准引用检查',
        '冲突规范识别',
        '缺失要求提示',
        '最佳实践推荐'
      ]
    },
    productionProcess: {
      checks: [
        '工艺流程标准化',
        '质量控制点设置',
        '设备安全防护',
        '环境排放合规'
      ],
      optimization: [
        '工艺参数优化建议',
        '效率提升方案',
        '成本节约机会',
        '质量改进措施'
      ]
    },
    certification: {
      checks: [
        '认证要求符合性',
        '审核准备充分性',
        '证书有效性维护',
        '持续改进机制'
      ],
      support: [
        '认证路径规划',
        '测试要求明确',
        '文档准备清单',
        '审核应对策略'
      ],
      automation: [
        '申请材料生成',
        '检查表自动填写',
        '进度跟踪提醒',
        '证书更新管理'
      ]
    }
  },
  standardsLifecycle: {
    monitoring: [
      '标准制修订计划跟踪',
      '草案征求意见提醒',
      '版本更新自动检测',
      '废止替代关系映射'
    ],
    impactAssessment: [
      '受影响产品分析',
      '技术变更成本估算',
      '合规差距识别',
      '过渡期策略制定'
    ],
    actionPlanning: [
      '标准升级路线图',
      '培训需求分析',
      '文件修订计划',
      '内部审核安排'
    ]
  },
  crossStandardAnalysis: {
    conflictDetection: [
      '技术要求不一致',
      '测试方法冲突',
      '合格判定差异',
      '定义术语混淆'
    ],
    harmonization: [
      '国际标准协调度',
      '区域差异分析',
      '行业特殊要求',
      '企业标准衔接'
    ],
    gapAnalysis: [
      '覆盖范围缺失',
      '技术内容过时',
      '新兴领域空白',
      '监管要求更新'
    ]
  },
  intelligentInterpretation: {
    keyRequirements: [
      '强制性条款提取',
      '技术参数摘要',
      '测试方法说明',
      '符合性证据要求'
    ],
    applicability: [
      '产品范围匹配',
      '地域适用性',
      '行业相关性',
      '企业规模适配'
    ],
    bestPractices: [
      '行业领先做法',
      '常见问题规避',
      '效率提升技巧',
      '成本优化方案'
    ]
  },
  automatedCompliance: {
    documentAnalysis: [
      '技术文档标准引用检查',
      '测试报告规范性验证',
      '认证材料完整性评估',
      '质量手册符合性审核'
    ],
    processMonitoring: [
      '生产记录标准符合性',
      '检验数据规范性',
      '设备校准标准遵循',
      '人员资质标准要求'
    ],
    realTimeAlerts: [
      '偏离标准操作预警',
      '参数超限提醒',
      '文档过期通知',
      '法规更新影响提示'
    ]
  },
  systemOptimization: [
    '企业标准体系诊断',
    '标准冗余识别',
    '体系结构优化建议',
    '数字化转型路线'
  ],
  maxResultsPerQuery: 50,
  cacheExpiryMinutes: 120
};

// 创建默认实例
const defaultStandardsSearchTools = new StandardsSearchTools(defaultConfig);

// 导出类和默认实例
export { StandardsSearchTools };
export default defaultStandardsSearchTools;
export { defaultStandardsSearchTools as DefaultStandardsSearchTools };