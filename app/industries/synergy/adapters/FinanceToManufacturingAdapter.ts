/**
 * @file 金融到制造业数据适配器
 * @description 实现金融行业与制造业之间的数据转换映射
 * @module industries/synergy/adapters
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-16
 * @updated 2024-10-16
 */

import { DataAdapter, DataAdapterOptions } from './DataAdapter';

/**
 * 金融到制造业数据适配器
 * 处理金融行业数据到制造业数据的转换
 */
export class FinanceToManufacturingAdapter extends DataAdapter {
  /**
   * 构造函数
   * @param options 适配选项
   */
  constructor(options: DataAdapterOptions) {
    super(options);
  }
  
  /**
   * 初始化映射配置
   * 定义金融数据到制造业数据的字段映射关系
   */
  protected initializeMappingConfig(): void {
    // 基本财务数据映射
    this.mappingConfig = [
      // 订单信息映射
      {
        sourcePath: 'financialOrder.id',
        targetPath: 'productionOrder.orderId',
        required: true,
        transformer: 'string',
      },
      {
        sourcePath: 'financialOrder.date',
        targetPath: 'productionOrder.orderDate',
        required: true,
        transformer: 'date',
      },
      {
        sourcePath: 'financialOrder.amount',
        targetPath: 'productionOrder.totalValue',
        required: true,
        transformer: 'number',
      },
      {
        sourcePath: 'financialOrder.currency',
        targetPath: 'productionOrder.currency',
        defaultValue: 'CNY',
      },
      
      // 客户信息映射
      {
        sourcePath: 'client.name',
        targetPath: 'customer.customerName',
        required: true,
        transformer: 'trim',
      },
      {
        sourcePath: 'client.id',
        targetPath: 'customer.customerId',
        required: true,
      },
      {
        sourcePath: 'client.contact',
        targetPath: 'customer.contactPerson',
      },
      {
        sourcePath: 'client.phone',
        targetPath: 'customer.phoneNumber',
      },
      {
        sourcePath: 'client.email',
        targetPath: 'customer.email',
      },
      {
        sourcePath: 'client.address',
        targetPath: 'customer.address',
      },
      
      // 产品信息映射
      {
        sourcePath: 'financialOrder.items',
        targetPath: 'productionOrder.items',
        required: true,
        transformer: 'transformOrderItems',
      },
      
      // 支付信息映射
      {
        sourcePath: 'payment.status',
        targetPath: 'productionOrder.paymentStatus',
        transformer: 'mapPaymentStatus',
      },
      {
        sourcePath: 'payment.method',
        targetPath: 'productionOrder.paymentMethod',
        transformer: 'mapPaymentMethod',
      },
      {
        sourcePath: 'payment.dueDate',
        targetPath: 'productionOrder.paymentDueDate',
        transformer: 'date',
      },
      
      // 交付信息映射
      {
        sourcePath: 'delivery.terms',
        targetPath: 'productionOrder.deliveryTerms',
        transformer: 'mapDeliveryTerms',
      },
      {
        sourcePath: 'delivery.expectedDate',
        targetPath: 'productionOrder.deliveryDate',
        required: true,
        transformer: 'date',
      },
      
      // 税率和折扣信息
      {
        sourcePath: 'financialOrder.taxRate',
        targetPath: 'productionOrder.taxRate',
        transformer: 'number',
        defaultValue: 0.13,
      },
      {
        sourcePath: 'financialOrder.discount',
        targetPath: 'productionOrder.discount',
        transformer: 'number',
        defaultValue: 0,
      },
      
      // 部门和责任人映射
      {
        sourcePath: 'financialOrder.department',
        targetPath: 'productionOrder.department',
        transformer: 'mapDepartment',
      },
      {
        sourcePath: 'financialOrder.responsiblePerson',
        targetPath: 'productionOrder.productionManager',
      },
    ];
  }
  
  /**
   * 注册自定义转换器
   * 定义金融行业特有的数据转换函数
   */
  protected registerTransformers(): void {
    // 注册金融行业特有的转换器
    this.transformers = {
      ...this.transformers,
      
      // 转换订单项目
      transformOrderItems: (items: any[]) => {
        if (!Array.isArray(items)) {
          return [];
        }
        
        return items.map(item => ({
          itemId: item.productId || `PROD_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          productCode: item.productCode,
          productName: item.name,
          description: item.description,
          quantity: Number(item.quantity) || 1,
          unitPrice: Number(item.unitPrice) || 0,
          unit: this.mapUnit(item.unit),
          totalPrice: Number(item.total) || 0,
          specifications: this.extractSpecifications(item),
          priority: this.calculatePriority(item),
          notes: item.notes || '',
        }));
      },
      
      // 映射支付状态
      mapPaymentStatus: (status: string) => {
        const statusMap: Record<string, string> = {
          'PAID': 'COMPLETED',
          'PARTIALLY_PAID': 'PARTIAL',
          'PENDING': 'PENDING',
          'OVERDUE': 'LATE',
          'REFUNDED': 'REFUNDED',
        };
        return statusMap[status] || 'UNKNOWN';
      },
      
      // 映射支付方式
      mapPaymentMethod: (method: string) => {
        const methodMap: Record<string, string> = {
          'BANK_TRANSFER': 'TRANSFER',
          'CREDIT_CARD': 'CARD',
          'CASH': 'CASH',
          'CHEQUE': 'CHECK',
          'ONLINE_PAYMENT': 'ONLINE',
        };
        return methodMap[method] || 'OTHER';
      },
      
      // 映射交付条件
      mapDeliveryTerms: (terms: string) => {
        const termsMap: Record<string, string> = {
          'EX_WORKS': 'EXW',
          'FREE_CARRIER': 'FCA',
          'DELIVERED_AT_PLACE': 'DAP',
          'DELIVERED_DUTY_PAID': 'DDP',
          'FREE_ON_BOARD': 'FOB',
          'COST_AND_FREIGHT': 'CFR',
        };
        return termsMap[terms] || 'OTHER';
      },
      
      // 映射部门
      mapDepartment: (department: string) => {
        const deptMap: Record<string, string> = {
          'SALES': 'SALES_DEPT',
          'MARKETING': 'MARKETING_DEPT',
          'FINANCE': 'FINANCE_DEPT',
          'PRODUCTION': 'PRODUCTION_DEPT',
          'RESEARCH': 'R\u0026D_DEPT',
          'LOGISTICS': 'LOGISTICS_DEPT',
        };
        return deptMap[department] || 'OTHER_DEPT';
      },
      
      // 格式化财务编码
      formatFinancialCode: (code: string) => {
        return code ? code.toUpperCase().replace(/\s+/g, '_') : '';
      },
      
      // 计算毛利率
      calculateMargin: (data: any) => {
        if (!data || typeof data.cost !== 'number' || typeof data.price !== 'number') {
          return 0;
        }
        return data.cost <= 0 ? 0 : ((data.price - data.cost) / data.price) * 100;
      },
      
      // 验证金融数据完整性
      validateFinancialData: (data: any) => {
        return !!(data && data.id && data.amount && data.date);
      },
    };
  }
  
  /**
   * 验证输入数据
   * 对金融数据进行特定的验证
   * @param data 输入数据
   * @returns 验证结果
   */
  protected validateInput(data: any): { valid: boolean; error: string } {
    // 调用父类的基础验证
    const basicValidation = super.validateInput(data);
    if (!basicValidation.valid) {
      return basicValidation;
    }
    
    // 金融数据特定验证
    if (!data.financialOrder) {
      return { valid: false, error: '缺少金融订单信息' };
    }
    
    if (!data.financialOrder.id) {
      return { valid: false, error: '缺少订单ID' };
    }
    
    if (!data.financialOrder.amount || data.financialOrder.amount <= 0) {
      return { valid: false, error: '订单金额必须大于0' };
    }
    
    if (!data.client || !data.client.name) {
      return { valid: false, error: '缺少客户信息' };
    }
    
    // 验证订单项目
    if (!Array.isArray(data.financialOrder.items) || data.financialOrder.items.length === 0) {
      return { valid: false, error: '订单必须包含至少一个项目' };
    }
    
    return { valid: true, error: '' };
  }
  
  /**
   * 应用行业特定逻辑
   * 实现金融数据到制造业数据的业务规则转换
   * @param transformedData 转换后的数据
   * @param originalData 原始数据
   * @returns 处理后的数据
   */
  protected applyIndustrySpecificLogic(transformedData: any, originalData: any): any {
    // 确保必要的对象结构存在
    if (!transformedData.productionOrder) {
      transformedData.productionOrder = {};
    }
    if (!transformedData.customer) {
      transformedData.customer = {};
    }
    
    // 设置生产订单状态
    transformedData.productionOrder.status = this.determineProductionStatus(originalData);
    
    // 计算优先级
    transformedData.productionOrder.priority = this.calculateOrderPriority(originalData);
    
    // 设置交付周期
    transformedData.productionOrder.leadTime = this.calculateLeadTime(originalData);
    
    // 计算预计完成日期
    transformedData.productionOrder.expectedCompletionDate = this.calculateExpectedCompletionDate(originalData);
    
    // 处理特殊业务规则
    transformedData.productionOrder.specialRequirements = this.extractSpecialRequirements(originalData);
    
    // 添加制造业特有的元数据
    transformedData.metadata = {
      ...transformedData.metadata,
      dataSource: 'FinanceSystem',
      transformationDate: new Date().toISOString(),
      orderType: this.determineOrderType(originalData),
      riskLevel: this.assessRiskLevel(originalData),
    };
    
    // 应用行业特定的附加数据
    this.applyIndustrySpecificAdditions(transformedData, originalData);
    
    return transformedData;
  }
  
  /**
   * 后处理
   * 对转换后的数据进行最终处理
   * @param data 转换后的数据
   * @returns 处理后的数据
   */
  protected async postProcess(data: any): Promise<any> {
    // 添加版本信息
    data.version = '1.0.0';
    
    // 添加时间戳
    data.timestamp = Date.now();
    
    // 确保数据完整性
    this.ensureDataCompleteness(data);
    
    // 在实际实现中，这里可能需要进行额外的验证或处理
    return data;
  }
  
  // 辅助方法
  
  /**
   * 映射单位
   * 将金融系统中的单位映射到制造业系统中的单位
   * @param unit 单位
   * @returns 映射后的单位
   */
  private mapUnit(unit: string): string {
    const unitMap: Record<string, string> = {
      'PCS': '件',
      'SET': '套',
      'KG': '千克',
      'TON': '吨',
      'M': '米',
      'M2': '平方米',
      'M3': '立方米',
      'L': '升',
      'ML': '毫升',
    };
    return unitMap[unit] || unit || '件';
  }
  
  /**
   * 提取规格信息
   * 从产品信息中提取规格数据
   * @param item 产品项目
   * @returns 规格信息
   */
  private extractSpecifications(item: any): any {
    if (!item) {
      return {};
    }
    
    return {
      dimensions: item.dimensions || {},
      material: item.material || '',
      color: item.color || '',
      weight: item.weight || 0,
      packaging: item.packaging || '',
      standards: item.standards || [],
      certifications: item.certifications || [],
    };
  }
  
  /**
   * 计算项目优先级
   * @param item 产品项目
   * @returns 优先级
   */
  private calculatePriority(item: any): number {
    // 基于多种因素计算优先级
    let priority = 3; // 默认中等优先级
    
    // 根据金额调整优先级
    const total = Number(item.total) || 0;
    if (total > 100000) {
      priority = 1; // 高优先级
    } else if (total < 10000) {
      priority = 5; // 低优先级
    }
    
    // 根据交付时间调整
    if (item.urgent || item.priority === 'HIGH') {
      priority = Math.min(priority, 2);
    }
    
    return priority;
  }
  
  /**
   * 确定生产状态
   * @param data 原始数据
   * @returns 生产状态
   */
  private determineProductionStatus(data: any): string {
    // 根据支付状态和订单信息确定生产状态
    const paymentStatus = data.payment?.status;
    
    switch (paymentStatus) {
      case 'PAID':
        return 'READY_TO_PRODUCE';
      case 'PARTIALLY_PAID':
        return 'PENDING_PAYMENT';
      case 'PENDING':
      case 'OVERDUE':
        return 'ON_HOLD';
      default:
        return 'PENDING_REVIEW';
    }
  }
  
  /**
   * 计算订单优先级
   * @param data 原始数据
   * @returns 优先级
   */
  private calculateOrderPriority(data: any): string {
    // 基于金额、客户重要性、交付时间等计算订单优先级
    const amount = Number(data.financialOrder?.amount) || 0;
    const isVIP = data.client?.vip || false;
    const urgent = data.financialOrder?.urgent || false;
    
    if (urgent || isVIP && amount > 500000) {
      return 'URGENT';
    } else if (amount > 100000 || isVIP) {
      return 'HIGH';
    } else if (amount > 50000) {
      return 'MEDIUM';
    } else {
      return 'STANDARD';
    }
  }
  
  /**
   * 计算交付周期
   * @param data 原始数据
   * @returns 交付周期（天）
   */
  private calculateLeadTime(data: any): number {
    // 基于产品类型、数量和其他因素计算交付周期
    const items = data.financialOrder?.items || [];
    const totalQuantity = items.reduce((sum: number, item: any) => sum + (Number(item.quantity) || 0), 0);
    
    // 基础交付周期
    let leadTime = 14; // 默认14天
    
    // 根据总数量调整
    if (totalQuantity > 1000) {
      leadTime += 7;
    } else if (totalQuantity > 500) {
      leadTime += 3;
    }
    
    // 根据紧急程度调整
    if (data.financialOrder?.urgent) {
      leadTime = Math.max(7, leadTime - 5); // 最快7天
    }
    
    return leadTime;
  }
  
  /**
   * 计算预计完成日期
   * @param data 原始数据
   * @returns 预计完成日期
   */
  private calculateExpectedCompletionDate(data: any): string {
    const orderDate = data.financialOrder?.date;
    const leadTime = this.calculateLeadTime(data);
    
    if (!orderDate) {
      return '';
    }
    
    const date = new Date(orderDate);
    date.setDate(date.getDate() + leadTime);
    
    return date.toISOString();
  }
  
  /**
   * 提取特殊要求
   * @param data 原始数据
   * @returns 特殊要求列表
   */
  private extractSpecialRequirements(data: any): string[] {
    const requirements: string[] = [];
    
    // 检查特殊包装要求
    if (data.financialOrder?.specialPackaging) {
      requirements.push('特殊包装要求');
    }
    
    // 检查特殊运输要求
    if (data.delivery?.specialInstructions) {
      requirements.push(data.delivery.specialInstructions);
    }
    
    // 检查客户特殊要求
    if (data.client?.specialRequirements) {
      requirements.push(data.client.specialRequirements);
    }
    
    // 检查产品特殊要求
    const items = data.financialOrder?.items || [];
    items.forEach((item: any) => {
      if (item.specialRequirements) {
        requirements.push(`产品 ${item.name}: ${item.specialRequirements}`);
      }
    });
    
    return requirements;
  }
  
  /**
   * 确定订单类型
   * @param data 原始数据
   * @returns 订单类型
   */
  private determineOrderType(data: any): string {
    const items = data.financialOrder?.items || [];
    const productTypes = new Set<string>(items.map((item: any) => item.category).filter((category: any): category is string => typeof category === 'string'));
    
    if (productTypes.size === 1) {
      const firstType = Array.from(productTypes)[0];
      return firstType || 'MIXED';
    }
    
    // 检查是否为重复订单
    if (data.financialOrder?.repeatOrder) {
      return 'REPEAT';
    }
    
    // 检查是否为定制订单
    const hasCustomItems = items.some((item: any) => item.custom || item.customized);
    if (hasCustomItems) {
      return 'CUSTOM';
    }
    
    return 'MIXED';
  }
  
  /**
   * 评估风险级别
   * @param data 原始数据
   * @returns 风险级别
   */
  private assessRiskLevel(data: any): string {
    // 基于多种因素评估订单风险
    let riskFactors = 0;
    
    // 支付状态风险
    if (['PENDING', 'OVERDUE'].includes(data.payment?.status)) {
      riskFactors++;
    }
    
    // 客户信用风险
    if (data.client?.creditRating <= 3) {
      riskFactors++;
    }
    
    // 金额风险
    const amount = Number(data.financialOrder?.amount) || 0;
    if (amount > 1000000) {
      riskFactors++;
    }
    
    // 紧急程度风险
    if (data.financialOrder?.urgent) {
      riskFactors++;
    }
    
    // 确定风险级别
    if (riskFactors > 2) {
      return 'HIGH';
    } else if (riskFactors > 0) {
      return 'MEDIUM';
    } else {
      return 'LOW';
    }
  }
  
  /**
   * 应用行业特定的附加数据
   * @param transformedData 转换后的数据
   * @param originalData 原始数据
   */
  private applyIndustrySpecificAdditions(transformedData: any, originalData: any): void {
    // 添加制造业特有的数据
    transformedData.productionDetails = {
      estimatedCost: this.estimateProductionCost(originalData),
      requiredResources: this.calculateRequiredResources(originalData),
      productionLine: this.recommendProductionLine(originalData),
      qualityStandards: this.determineQualityStandards(originalData),
    };
  }
  
  /**
   * 估算生产成本
   * @param data 原始数据
   * @returns 估算成本
   */
  private estimateProductionCost(data: any): number {
    // 简单的成本估算逻辑
    const amount = Number(data.financialOrder?.amount) || 0;
    const taxRate = Number(data.financialOrder?.taxRate) || 0.13;
    const profitMargin = 0.3; // 假设30%利润率
    
    // 估算成本 = (订单金额 / (1 + 税率)) * (1 - 利润率)
    return (amount / (1 + taxRate)) * (1 - profitMargin);
  }
  
  /**
   * 计算所需资源
   * @param data 原始数据
   * @returns 所需资源
   */
  private calculateRequiredResources(data: any): any {
    const items = data.financialOrder?.items || [];
    const totalQuantity = items.reduce((sum: number, item: any) => sum + (Number(item.quantity) || 0), 0);
    
    return {
      estimatedManHours: totalQuantity * 2, // 假设每件产品需要2小时
      machineHours: Math.ceil(totalQuantity / 100), // 假设每100件需要1小时机器时间
      estimatedWorkers: Math.ceil(totalQuantity / 500), // 估计需要的工人数
      materialCost: this.estimateMaterialCost(data),
    };
  }
  
  /**
   * 估算材料成本
   * @param data 原始数据
   * @returns 材料成本
   */
  private estimateMaterialCost(data: any): number {
    const productionCost = this.estimateProductionCost(data);
    // 假设材料成本占生产成本的60%
    return productionCost * 0.6;
  }
  
  /**
   * 推荐生产线
   * @param data 原始数据
   * @returns 推荐的生产线
   */
  private recommendProductionLine(data: any): string {
    const items = data.financialOrder?.items || [];
    const firstItem = items[0];
    
    if (!firstItem) {
      return 'DEFAULT_LINE';
    }
    
    // 根据产品类别推荐生产线
    const category = firstItem.category;
    
    switch (category) {
      case 'ELECTRONICS':
        return 'LINE_A';
      case 'MECHANICAL':
        return 'LINE_B';
      case 'PLASTIC':
        return 'LINE_C';
      case 'METAL':
        return 'LINE_D';
      default:
        return 'DEFAULT_LINE';
    }
  }
  
  /**
   * 确定质量标准
   * @param data 原始数据
   * @returns 质量标准列表
   */
  private determineQualityStandards(data: any): string[] {
    const standards: string[] = ['ISO9001'];
    
    // 根据产品类别添加特定标准
    const items = data.financialOrder?.items || [];
    const categories = new Set(items.map((item: any) => item.category).filter(Boolean));
    
    if (categories.has('ELECTRONICS')) {
      standards.push('ISO14001', 'RoHS');
    }
    
    if (categories.has('MEDICAL')) {
      standards.push('ISO13485', 'CE');
    }
    
    // 根据客户添加特定标准
    if (data.client?.industry === 'AEROSPACE') {
      standards.push('AS9100');
    }
    
    return standards;
  }
  
  /**
   * 确保数据完整性
   * @param data 数据
   */
  private ensureDataCompleteness(data: any): void {
    // 确保所有必要的字段都存在
    if (!data.productionOrder) {
      data.productionOrder = {};
    }
    
    if (!data.customer) {
      data.customer = {};
    }
    
    if (!data.metadata) {
      data.metadata = {};
    }
    
    // 确保生产订单有ID
    if (!data.productionOrder.orderId) {
      data.productionOrder.orderId = `PROD_${Date.now()}`;
    }
    
    // 确保有创建时间
    if (!data.productionOrder.createdAt) {
      data.productionOrder.createdAt = new Date().toISOString();
    }
  }
}

// 适配器类已通过export class声明导出
