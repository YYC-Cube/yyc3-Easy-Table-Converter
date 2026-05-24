/**
 * @file IndustryMatrixConfig.ts
 * @description 行业矩阵配置模块 - 处理跨行业数据协同平台的核心配置
 * @module industries
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 * @updated 2024-10-16
 * @summary 定义行业类型、数据格式、转换规则和行业元数据
 * @see https://docs.example.com/industries/matrix-config
 */

// 移除错误的导入语句

/**
 * 行业类型枚举 - 系统支持的所有行业类型
 */
export enum IndustryType {
  FINANCE = 'FINANCE',
  MANUFACTURING = 'MANUFACTURING',
  RETAIL = 'RETAIL',
  HEALTHCARE = 'HEALTHCARE',
  TECHNOLOGY = 'TECHNOLOGY',
  CONSTRUCTION = 'CONSTRUCTION',
  EDUCATION = 'EDUCATION',
  LOGISTICS = 'LOGISTICS',
  ENERGY = 'ENERGY',
  METAVERSE = 'METAVERSE',
  WEB3 = 'WEB3',
  DIGITAL_TWIN = 'DIGITAL_TWIN',
  MEDIA_ENTERTAINMENT = 'MEDIA_ENTERTAINMENT',
}

/**
 * 数据格式类型枚举 - 支持的数据交换格式
 */
export enum FormatType {
  JSON = 'JSON',
  XML = 'XML',
  CSV = 'CSV',
  EXCEL = 'EXCEL',
  API = 'API',
  DATABASE = 'DATABASE',
}

/**
 * 转换规则接口 - 定义行业间数据转换的规则
 */
export interface ConversionRule {
  /** 源字段路径 */
  sourcePath: string;
  /** 目标字段路径 */
  targetPath: string;
  /** 是否必填字段 */
  required?: boolean;
  /** 默认值 */
  defaultValue?: any;
  /** 数据转换器名称 */
  transformer?: string;
  /** 字段描述 */
  description?: string;
  /** 字段优先级 */
  priority?: 'high' | 'medium' | 'low';
}

/**
 * 行业元数据接口 - 定义行业的基本信息
 */
export interface IndustryMetadata {
  /** 行业名称 */
  name: string;
  /** 行业描述 */
  description: string;
  /** 支持的数据格式 */
  supportedFormats: FormatType[];
  /** 主要数据实体 */
  keyEntities: string[];
  /** 行业特定属性 */
  industrySpecificProperties?: Record<string, any>;
  /** 行业标准 */
  standards?: string[];
  /** API端点 */
  apiEndpoints?: string[];
}

/**
 * 转换配置接口 - 定义两个行业之间的数据转换配置
 */
export interface ConversionConfig {
  /** 源行业 */
  sourceIndustry: IndustryType;
  /** 目标行业 */
  targetIndustry: IndustryType;
  /** 转换规则列表 */
  rules: ConversionRule[];
  /** 适配器类名 */
  adapterClass?: string;
  /** 转换描述 */
  description?: string;
  /** 优先级映射 */
  priorityMapping?: Record<string, string>;
  /** 特殊处理标志 */
  specialHandling?: boolean;
  /** 转换效率评级 */
  efficiencyRating?: number;
  /** 最后更新时间 */
  lastUpdated?: string;
}

/**
 * 行业矩阵配置类 - 管理所有行业和转换配置
 */
export class IndustryMatrixConfig {
  /**
   * 支持的行业列表
   */
  public static readonly SUPPORTED_INDUSTRIES: Record<IndustryType, IndustryMetadata> = {
    [IndustryType.MEDIA_ENTERTAINMENT]: {
      name: '媒体娱乐行业',
      description: '内容创作、动态内容制作、互动媒体开发等领域',
      supportedFormats: [FormatType.JSON, FormatType.API, FormatType.DATABASE],
      keyEntities: ['Content', 'MediaAsset', 'CreativeProject', 'Audience', 'Engagement'],
      standards: ['FFmpeg', 'WebP', 'MP4', 'AI Content Guidelines'],
      apiEndpoints: ['/api/media/content', '/api/media/assets', '/api/media/analytics'],
      industrySpecificProperties: {
        contentCreationTools: ['AI风格转换', 'GIF制作器', '音视频合成'],
        engagementMetrics: 'high',
        creativeWorkflows: 'integrated',
      },
    },
    [IndustryType.FINANCE]: {
      name: '金融行业',
      description: '银行、保险、投资和金融服务等领域',
      supportedFormats: [FormatType.JSON, FormatType.XML, FormatType.CSV, FormatType.API],
      keyEntities: ['FinancialOrder', 'Client', 'Payment', 'Invoice', 'Transaction'],
      standards: ['ISO 20022', 'SWIFT', 'PCI DSS'],
      apiEndpoints: ['/api/finance/orders', '/api/finance/payments', '/api/finance/reports'],
      industrySpecificProperties: {
        complianceLevel: 'high',
        dataPrivacy: 'strict',
        reportingFrequency: 'daily',
      },
    },
    [IndustryType.METAVERSE]: {
      name: '元宇宙',
      description: '虚拟世界、数字资产和沉浸式体验领域',
      supportedFormats: [FormatType.JSON, FormatType.API, FormatType.DATABASE],
      keyEntities: ['Avatar', 'VirtualAsset', 'Land', 'Experience', 'Transaction'],
      standards: ['Open Metaverse Interoperability Group', 'Decentraland SDK', 'Unity'],
      apiEndpoints: ['/api/metaverse/assets', '/api/metaverse/transactions', '/api/metaverse/experiences'],
      industrySpecificProperties: {
        assetOwnership: 'blockchain_verified',
        interoperabilityLevel: 'medium',
        immersiveTechnology: 'VR/AR',
      },
    },
    [IndustryType.WEB3]: {
      name: 'Web3',
      description: '去中心化网络、区块链技术和智能合约领域',
      supportedFormats: [FormatType.JSON, FormatType.API],
      keyEntities: ['Wallet', 'SmartContract', 'Token', 'Transaction', 'DecentralizedApp'],
      standards: ['EIP Standards', 'Web3.js', 'ethers.js'],
      apiEndpoints: ['/api/web3/contracts', '/api/web3/transactions', '/api/web3/wallets'],
      industrySpecificProperties: {
        decentralizationLevel: 'high',
        securityModel: 'cryptographic',
        governanceType: 'dao',
      },
    },
    [IndustryType.DIGITAL_TWIN]: {
      name: '数字孪生',
      description: '物理资产和系统的数字复制品和模拟领域',
      supportedFormats: [FormatType.JSON, FormatType.XML, FormatType.DATABASE],
      keyEntities: ['DigitalModel', 'SensorData', 'Simulation', 'PhysicalAsset', 'RealTimeUpdate'],
      standards: ['ISO 23247', 'IEC 61131', 'OPC UA'],
      apiEndpoints: ['/api/digitaltwin/models', '/api/digitaltwin/sensors', '/api/digitaltwin/simulations'],
      industrySpecificProperties: {
        fidelityLevel: 'high',
        updateFrequency: 'real-time',
        integrationComplexity: 'high',
      },
    },
    [IndustryType.MANUFACTURING]: {
      name: '制造业',
      description: '生产和制造物理产品的行业',
      supportedFormats: [FormatType.JSON, FormatType.XML, FormatType.EXCEL, FormatType.DATABASE],
      keyEntities: ['ProductionOrder', 'Customer', 'Product', 'Inventory', 'Resource'],
      standards: ['ISO 9001', 'ISO 14001', 'IATF 16949'],
      apiEndpoints: ['/api/manufacturing/production', '/api/manufacturing/inventory', '/api/manufacturing/resources'],
      industrySpecificProperties: {
        productionCapacity: 'high',
        supplyChainComplexity: 'medium',
        automationLevel: 'medium',
      },
    },
    [IndustryType.RETAIL]: {
      name: '零售业',
      description: '直接面向消费者销售商品和服务的行业',
      supportedFormats: [FormatType.JSON, FormatType.CSV, FormatType.EXCEL, FormatType.API],
      keyEntities: ['Sale', 'Customer', 'Product', 'Store', 'Inventory'],
      standards: ['PCI DSS', 'GS1 Standards'],
      apiEndpoints: ['/api/retail/sales', '/api/retail/inventory', '/api/retail/customers'],
      industrySpecificProperties: {
        customerVolume: 'high',
        inventoryTurnover: 'high',
        seasonalVariation: 'high',
      },
    },
    [IndustryType.HEALTHCARE]: {
      name: '医疗健康行业',
      description: '提供医疗服务和健康产品的行业',
      supportedFormats: [FormatType.JSON, FormatType.XML, FormatType.DATABASE],
      keyEntities: ['Patient', 'MedicalRecord', 'Appointment', 'Treatment', 'Prescription'],
      standards: ['HIPAA', 'HL7', 'FHIR'],
      apiEndpoints: ['/api/healthcare/patients', '/api/healthcare/appointments', '/api/healthcare/records'],
      industrySpecificProperties: {
        dataPrivacy: 'critical',
        complianceLevel: 'very_high',
        serviceQuality: 'critical',
      },
    },
    [IndustryType.TECHNOLOGY]: {
      name: '科技行业',
      description: '开发和销售技术产品和服务的行业',
      supportedFormats: [FormatType.JSON, FormatType.API, FormatType.DATABASE],
      keyEntities: ['Product', 'License', 'Customer', 'Subscription', 'SupportTicket'],
      standards: ['ISO 27001', 'SOC 2', 'GDPR'],
      apiEndpoints: ['/api/technology/products', '/api/technology/licenses', '/api/technology/support'],
      industrySpecificProperties: {
        innovationRate: 'high',
        marketChangeRate: 'high',
        integrationComplexity: 'medium',
      },
    },
    [IndustryType.CONSTRUCTION]: {
      name: '建筑业',
      description: '建筑和基础设施开发行业',
      supportedFormats: [FormatType.JSON, FormatType.XML, FormatType.EXCEL],
      keyEntities: ['Project', 'Contract', 'Resource', 'Material', 'Timeline'],
      standards: ['ISO 9001', 'OSHA', 'BIM'],
      apiEndpoints: ['/api/construction/projects', '/api/construction/resources', '/api/construction/materials'],
      industrySpecificProperties: {
        projectComplexity: 'high',
        regulatoryCompliance: 'high',
        resourceIntensity: 'high',
      },
    },
    [IndustryType.EDUCATION]: {
      name: '教育行业',
      description: '提供教育和培训服务的行业',
      supportedFormats: [FormatType.JSON, FormatType.CSV, FormatType.EXCEL, FormatType.DATABASE],
      keyEntities: ['Student', 'Course', 'Instructor', 'Enrollment', 'Assessment'],
      standards: ['FERPA', 'ISO 27001'],
      apiEndpoints: ['/api/education/students', '/api/education/courses', '/api/education/enrollments'],
      industrySpecificProperties: {
        dataPrivacy: 'high',
        accreditationRequirements: 'high',
        seasonalEnrollment: 'high',
      },
    },
    [IndustryType.LOGISTICS]: {
      name: '物流行业',
      description: '货物运输、仓储和供应链管理行业',
      supportedFormats: [FormatType.JSON, FormatType.XML, FormatType.API],
      keyEntities: ['Shipment', 'Route', 'Vehicle', 'Driver', 'Warehouse'],
      standards: ['ISO 9001', 'ISO 14001', 'TSA'],
      apiEndpoints: ['/api/logistics/shipments', '/api/logistics/tracking', '/api/logistics/warehouses'],
      industrySpecificProperties: {
        realTimeTracking: 'critical',
        routeOptimization: 'high',
        deliveryAccuracy: 'high',
      },
    },
    [IndustryType.ENERGY]: {
      name: '能源行业',
      description: '电力、石油、天然气和可再生能源行业',
      supportedFormats: [FormatType.JSON, FormatType.XML, FormatType.API, FormatType.DATABASE],
      keyEntities: ['Plant', 'Resource', 'Grid', 'Customer', 'Transaction'],
      standards: ['ISO 50001', 'NERC', 'ISO 14001'],
      apiEndpoints: ['/api/energy/plants', '/api/energy/resources', '/api/energy/transactions'],
      industrySpecificProperties: {
        regulatoryComplexity: 'high',
        infrastructureAge: 'medium',
        sustainabilityFocus: 'increasing',
      },
    },
  };

  /**
   * 预定义的转换配置
   */
  public static readonly CONVERSION_CONFIGS: ConversionConfig[] = [
    {
      sourceIndustry: IndustryType.FINANCE,
      targetIndustry: IndustryType.MANUFACTURING,
      adapterClass: 'FinanceToManufacturingAdapter',
      description: '金融行业到制造业的数据转换',
      rules: [
        {
          sourcePath: 'financialOrder.id',
          targetPath: 'productionOrder.orderId',
          required: true,
          description: '订单ID映射',
          priority: 'high',
        },
        {
          sourcePath: 'financialOrder.date',
          targetPath: 'productionOrder.orderDate',
          required: true,
          description: '订单日期映射',
          priority: 'high',
          transformer: 'date',
        },
        {
          sourcePath: 'financialOrder.amount',
          targetPath: 'productionOrder.totalValue',
          required: true,
          description: '订单金额映射',
          priority: 'high',
          transformer: 'number',
        },
      ],
      efficiencyRating: 95,
      lastUpdated: '2024-10-16',
    },
    {
      sourceIndustry: IndustryType.MANUFACTURING,
      targetIndustry: IndustryType.FINANCE,
      adapterClass: 'ManufacturingToFinanceAdapter',
      description: '制造业到金融行业的数据转换',
      rules: [
        {
          sourcePath: 'productionOrder.orderId',
          targetPath: 'financialOrder.id',
          required: true,
          description: '生产订单ID映射到金融订单',
          priority: 'high',
        },
        {
          sourcePath: 'productionOrder.orderDate',
          targetPath: 'financialOrder.date',
          required: true,
          description: '生产订单日期映射到金融订单',
          priority: 'high',
          transformer: 'date',
        },
        {
          sourcePath: 'productionOrder.totalValue',
          targetPath: 'financialOrder.amount',
          required: true,
          description: '生产订单总价值映射到金融订单金额',
          priority: 'high',
          transformer: 'number',
        },
      ],
      efficiencyRating: 92,
      lastUpdated: '2024-10-16',
    },
    // 可以添加更多行业间的转换配置
  ];

  /**
   * 获取行业元数据
   * @param industry 行业类型
   * @returns 行业元数据
   */
  public static getIndustryMetadata(industry: IndustryType): IndustryMetadata | undefined {
    return this.SUPPORTED_INDUSTRIES[industry];
  }

  /**
   * 获取两个行业之间的转换配置
   * @param sourceIndustry 源行业
   * @param targetIndustry 目标行业
   * @returns 转换配置
   */
  public static getConversionConfig(
    sourceIndustry: IndustryType,
    targetIndustry: IndustryType
  ): ConversionConfig | undefined {
    return this.CONVERSION_CONFIGS.find(
      config => 
        config.sourceIndustry === sourceIndustry && 
        config.targetIndustry === targetIndustry
    );
  }

  /**
   * 获取行业支持的数据格式
   * @param industry 行业类型
   * @returns 支持的数据格式列表
   */
  public static getSupportedFormats(industry: IndustryType): FormatType[] {
    const metadata = this.getIndustryMetadata(industry);
    return metadata ? metadata.supportedFormats : [];
  }

  /**
   * 检查行业是否支持特定数据格式
   * @param industry 行业类型
   * @param format 数据格式
   * @returns 是否支持
   */
  public static isFormatSupported(industry: IndustryType, format: FormatType): boolean {
    const formats = this.getSupportedFormats(industry);
    return formats.includes(format);
  }

  /**
   * 获取行业间转换的适配器类名
   * @param sourceIndustry 源行业
   * @param targetIndustry 目标行业
   * @returns 适配器类名
   */
  public static getAdapterClass(sourceIndustry: IndustryType, targetIndustry: IndustryType): string | undefined {
    const config = this.getConversionConfig(sourceIndustry, targetIndustry);
    return config ? config.adapterClass : undefined;
  }

  /**
   * 获取所有支持的行业类型
   * @returns 行业类型列表
   */
  public static getAllIndustryTypes(): IndustryType[] {
    return Object.values(IndustryType);
  }

  /**
   * 获取所有支持的数据格式类型
   * @returns 数据格式类型列表
   */
  public static getAllFormatTypes(): FormatType[] {
    return Object.values(FormatType);
  }

  /**
   * 检查两个行业之间是否支持直接转换
   * @param sourceIndustry 源行业
   * @param targetIndustry 目标行业
   * @returns 是否支持直接转换
   */
  public static isDirectConversionSupported(sourceIndustry: IndustryType, targetIndustry: IndustryType): boolean {
    return !!this.getConversionConfig(sourceIndustry, targetIndustry);
  }

  /**
   * 获取行业间转换的规则列表
   * @param sourceIndustry 源行业
   * @param targetIndustry 目标行业
   * @returns 转换规则列表
   */
  public static getConversionRules(sourceIndustry: IndustryType, targetIndustry: IndustryType): ConversionRule[] {
    const config = this.getConversionConfig(sourceIndustry, targetIndustry);
    return config ? config.rules : [];
  }

  /**
   * 获取行业名称
   * @param industry 行业类型
   * @returns 行业名称
   */
  public static getIndustryName(industry: IndustryType): string {
    const metadata = this.getIndustryMetadata(industry);
    return metadata ? metadata.name : industry;
  }

  /**
   * 获取行业描述
   * @param industry 行业类型
   * @returns 行业描述
   */
  public static getIndustryDescription(industry: IndustryType): string {
    const metadata = this.getIndustryMetadata(industry);
    return metadata ? metadata.description : '';
  }

  /**
   * 获取行业的关键实体
   * @param industry 行业类型
   * @returns 关键实体列表
   */
  public static getIndustryKeyEntities(industry: IndustryType): string[] {
    const metadata = this.getIndustryMetadata(industry);
    return metadata ? metadata.keyEntities : [];
  }

  /**
   * 获取行业特定属性
   * @param industry 行业类型
   * @returns 行业特定属性
   */
  public static getIndustrySpecificProperties(industry: IndustryType): Record<string, any> {
    const metadata = this.getIndustryMetadata(industry);
    return metadata && metadata.industrySpecificProperties ? metadata.industrySpecificProperties : {};
  }

  /**
   * 获取行业API端点
   * @param industry 行业类型
   * @returns API端点列表
   */
  public static getIndustryApiEndpoints(industry: IndustryType): string[] {
    const metadata = this.getIndustryMetadata(industry);
    return metadata && metadata.apiEndpoints ? metadata.apiEndpoints : [];
  }
}

  // 导出核心配置供其他模块使用
export { IndustryMatrixConfig as Config };