/**
 * @file 制造业到金融数据适配器
 * @description 实现制造业与金融行业之间的数据转换映射
 * @module industries/synergy/adapters
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-16
 * @updated 2024-10-16
 */

import { DataAdapter, DataAdapterOptions } from './DataAdapter';

/**
 * 制造业到金融数据适配器
 * 处理制造业数据到金融行业数据的转换
 */
export class ManufacturingToFinanceAdapter extends DataAdapter {
  /**
   * 构造函数
   * @param options 适配选项
   */
  constructor(options: DataAdapterOptions) {
    super(options);
  }
  
  /**
   * 初始化映射配置
   * 定义制造业数据到金融数据的字段映射关系
   */
  protected initializeMappingConfig(): void {
    this.mappingConfig = [
      // 生产订单到金融订单的映射
      {
        sourcePath: 'productionOrder.orderId',
        targetPath: 'financialOrder.id',
        required: true,
        transformer: 'string',
      },
      {
        sourcePath: 'productionOrder.orderDate',
        targetPath: 'financialOrder.date',
        required: true,
        transformer: 'date',
      },
      {
        sourcePath: 'productionOrder.totalValue',
        targetPath: 'financialOrder.amount',
        required: true,
        transformer: 'number',
      },
      {
        sourcePath: 'productionOrder.currency',
        targetPath: 'financialOrder.currency',
        defaultValue: 'CNY',
      },
      
      // 客户信息映射
      {
        sourcePath: 'customer.customerName',
        targetPath: 'client.name',
        required: true,
        transformer: 'trim',
      },
      {
        sourcePath: 'customer.customerId',
        targetPath: 'client.id',
        required: true,
      },
      {
        sourcePath: 'customer.contactPerson',
        targetPath: 'client.contact',
      },
      {
        sourcePath: 'customer.phoneNumber',
        targetPath: 'client.phone',
      },
      {
        sourcePath: 'customer.email',
        targetPath: 'client.email',
      },
      {
        sourcePath: 'customer.address',
        targetPath: 'client.address',
      },
      {
        sourcePath: 'customer.industry',
        targetPath: 'client.industry',
      },
      
      // 订单项目映射
      {
        sourcePath: 'productionOrder.items',
        targetPath: 'financialOrder.items',
        required: true,
        transformer: 'transformProductionItems',
      },
      
      // 支付信息映射
      {
        sourcePath: 'productionOrder.paymentStatus',
        targetPath: 'payment.status',
        transformer: 'mapToFinancialPaymentStatus',
      },
      {
        sourcePath: 'productionOrder.paymentMethod',
        targetPath: 'payment.method',
        transformer: 'mapToFinancialPaymentMethod',
      },
      {
        sourcePath: 'productionOrder.paymentDueDate',
        targetPath: 'payment.dueDate',
        transformer: 'date',
      },
      
      // 交付信息映射
      {
        sourcePath: 'productionOrder.deliveryDate',
        targetPath: 'delivery.expectedDate',
        required: true,
        transformer: 'date',
      },
      {
        sourcePath: 'productionOrder.deliveryTerms',
        targetPath: 'delivery.terms',
        transformer: 'mapToFinancialDeliveryTerms',
      },
      
      // 税率和折扣信息
      {
        sourcePath: 'productionOrder.taxRate',
        targetPath: 'financialOrder.taxRate',
        transformer: 'number',
        defaultValue: 0.13,
      },
      {
        sourcePath: 'productionOrder.discount',
        targetPath: 'financialOrder.discount',
        transformer: 'number',
        defaultValue: 0,
      },
      
      // 部门和责任人映射
      {
        sourcePath: 'productionOrder.department',
        targetPath: 'financialOrder.department',
        transformer: 'mapToFinancialDepartment',
      },
      {
        sourcePath: 'productionOrder.productionManager',
        targetPath: 'financialOrder.responsiblePerson',
      },
      
      // 财务编码映射
      {
        sourcePath: 'productionOrder.orderId',
        targetPath: 'financialOrder.financialCode',
        transformer: 'generateFinancialCode',
      },
    ];
  }
  
  /**
   * 注册自定义转换器
   * 定义制造业特有的数据转换函数
   */
  protected registerTransformers(): void {
    this.transformers = {
      ...this.transformers,
      
      // 将生产项目转换为金融订单项目
      transformProductionItems: (items: any[]) => {
        if (!Array.isArray(items)) {
          return [];
        }
        
        return items.map(item => ({
          productId: item.itemId,
          productCode: item.productCode,
          name: item.productName,
          description: item.description,
          quantity: Number(item.quantity) || 1,
          unitPrice: Number(item.unitPrice) || 0,
          unit: item.unit,
          total: Number(item.totalPrice) || 0,
          category: item.category,
          specifications: item.specifications,
        }));
      },
      
      // 将生产支付状态映射到金融支付状态
      mapToFinancialPaymentStatus: (status: string) => {
        const statusMap: Record<string, string> = {
          'COMPLETED': 'PAID',
          'PARTIAL': 'PARTIALLY_PAID',
          'PENDING': 'PENDING',
          'LATE': 'OVERDUE',
          'REFUNDED': 'REFUNDED',
          'READY_TO_PRODUCE': 'PARTIALLY_PAID',
          'PENDING_PAYMENT': 'PENDING',
          'ON_HOLD': 'OVERDUE',
          'PENDING_REVIEW': 'PENDING',
        };
        return statusMap[status] || 'UNKNOWN';
      },
      
      // 将生产支付方式映射到金融支付方式
      mapToFinancialPaymentMethod: (method: string) => {
        const methodMap: Record<string, string> = {
          'TRANSFER': 'BANK_TRANSFER',
          'CARD': 'CREDIT_CARD',
          'CASH': 'CASH',
          'CHECK': 'CHEQUE',
          'ONLINE': 'ONLINE_PAYMENT',
          'OTHER': 'OTHER',
        };
        return methodMap[method] || 'OTHER';
      },
      
      // 将生产交付条件映射到金融交付条件
      mapToFinancialDeliveryTerms: (terms: string) => {
        const termsMap: Record<string, string> = {
          'EXW': 'EX_WORKS',
          'FCA': 'FREE_CARRIER',
          'DAP': 'DELIVERED_AT_PLACE',
          'DDP': 'DELIVERED_DUTY_PAID',
          'FOB': 'FREE_ON_BOARD',
          'CFR': 'COST_AND_FREIGHT',
        };
        return termsMap[terms] || 'OTHER';
      },
      
      // 将生产部门映射到金融部门
      mapToFinancialDepartment: (department: string) => {
        const deptMap: Record<string, string> = {
          'SALES_DEPT': 'SALES',
          'MARKETING_DEPT': 'MARKETING',
          'FINANCE_DEPT': 'FINANCE',
          'PRODUCTION_DEPT': 'PRODUCTION',
          'R&D_DEPT': 'RESEARCH',
          'LOGISTICS_DEPT': 'LOGISTICS',
          'OTHER_DEPT': 'OTHER',
        };
        return deptMap[department] || 'OTHER';
      },
      
      // 生成金融编码
      generateFinancialCode: (orderId: string) => {
        if (!orderId) {
          return `FIN_${Date.now()}`;
        }
        // 将生产订单ID转换为金融编码
        return `FIN_${orderId.replace(/[^A-Z0-9]/gi, '')}`.toUpperCase();
      },
      
      // 计算财务指标
      calculateFinancialMetrics: (data: any) => {
        const amount = Number(data.amount) || 0;
        const taxRate = Number(data.taxRate) || 0.13;
        
        return {
          subtotal: amount,
          taxAmount: amount * taxRate,
          total: amount * (1 + taxRate),
          margin: this.calculateMargin(data),
        };
      },
    };
  }
  
  /**
   * 验证输入数据
   * 对制造业数据进行特定的验证
   * @param data 输入数据
   * @returns 验证结果
   */
  protected validateInput(data: any): { valid: boolean; error: string } {
    // 调用父类的基础验证
    const basicValidation = super.validateInput(data);
    if (!basicValidation.valid) {
      return basicValidation;
    }
    
    // 制造业数据特定验证
    if (!data.productionOrder) {
      return { valid: false, error: '缺少生产订单信息' };
    }
    
    if (!data.productionOrder.orderId) {
      return { valid: false, error: '缺少生产订单ID' };
    }
    
    if (!data.productionOrder.totalValue || data.productionOrder.totalValue <= 0) {
      return { valid: false, error: '订单金额必须大于0' };
    }
    
    if (!data.customer || !data.customer.customerName) {
      return { valid: false, error: '缺少客户信息' };
    }
    
    // 验证生产项目
    if (!Array.isArray(data.productionOrder.items) || data.productionOrder.items.length === 0) {
      return { valid: false, error: '生产订单必须包含至少一个项目' };
    }
    
    return { valid: true, error: '' };
  }
  
  /**
   * 应用行业特定逻辑
   * 实现制造业数据到金融数据的业务规则转换
   * @param transformedData 转换后的数据
   * @param originalData 原始数据
   * @returns 处理后的数据
   */
  protected applyIndustrySpecificLogic(transformedData: any, originalData: any): any {
    // 确保必要的对象结构存在
    if (!transformedData.financialOrder) {
      transformedData.financialOrder = {};
    }
    if (!transformedData.payment) {
      transformedData.payment = {};
    }
    if (!transformedData.delivery) {
      transformedData.delivery = {};
    }
    
    // 设置金融订单状态
    transformedData.financialOrder.status = this.determineFinancialStatus(originalData);
    
    // 计算发票信息
    transformedData.invoiceInfo = this.generateInvoiceInfo(originalData);
    
    // 计算财务指标
    transformedData.financialMetrics = this.calculateFinancialMetrics(originalData);
    
    // 处理特殊财务规则
    transformedData.financialOrder.specialConditions = this.extractFinancialConditions(originalData);
    
    // 添加金融行业特有的元数据
    transformedData.metadata = {
      ...transformedData.metadata,
      dataSource: 'ManufacturingSystem',
      transformationDate: new Date().toISOString(),
      financialPeriod: this.determineFinancialPeriod(originalData),
      accountCode: this.generateAccountCode(originalData),
    };
    
    // 应用行业特定的附加数据
    this.applyFinancialAdditions(transformedData, originalData);
    
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
    this.ensureFinancialDataCompleteness(data);
    
    return data;
  }
  
  // 辅助方法
  
  /**
   * 计算利润率
   * @param data 数据
   * @returns 利润率
   */
  private calculateMargin(data: any): number {
    if (!data || typeof data.cost !== 'number' || typeof data.price !== 'number') {
      return 0;
    }
    return data.cost <= 0 ? 0 : ((data.price - data.cost) / data.price) * 100;
  }
  
  /**
   * 确定金融状态
   * @param data 原始数据
   * @returns 金融状态
   */
  private determineFinancialStatus(data: any): string {
    const productionStatus = data.productionOrder?.status;
    const paymentStatus = data.productionOrder?.paymentStatus;
    
    // 根据生产状态和支付状态确定金融订单状态
    if (paymentStatus === 'COMPLETED') {
      return 'COMPLETED';
    } else if (paymentStatus === 'PARTIAL' || productionStatus === 'READY_TO_PRODUCE') {
      return 'IN_PROGRESS';
    } else if (paymentStatus === 'PENDING' || paymentStatus === 'LATE') {
      return 'PENDING_PAYMENT';
    } else {
      return 'DRAFT';
    }
  }
  
  /**
   * 生成发票信息
   * @param data 原始数据
   * @returns 发票信息
   */
  private generateInvoiceInfo(data: any): any {
    const orderId = data.productionOrder?.orderId;
    const orderDate = data.productionOrder?.orderDate;
    const amount = Number(data.productionOrder?.totalValue) || 0;
    const taxRate = Number(data.productionOrder?.taxRate) || 0.13;
    
    return {
      invoiceNumber: `INV_${orderId || Date.now()}`,
      invoiceDate: orderDate || new Date().toISOString(),
      taxAmount: amount * taxRate,
      totalAmount: amount * (1 + taxRate),
      paymentTerms: this.determinePaymentTerms(data),
      dueDate: this.calculateDueDate(data),
      status: 'PENDING',
    };
  }
  
  /**
   * 确定付款条件
   * @param data 原始数据
   * @returns 付款条件
   */
  private determinePaymentTerms(data: any): string {
    // 根据客户类型和订单金额确定付款条件
    const customerType = data.customer?.type || '';
    const amount = Number(data.productionOrder?.totalValue) || 0;
    
    if (customerType === 'VIP' && amount < 100000) {
      return 'NET30'; // VIP客户小额订单30天付款
    } else if (amount > 500000) {
      return 'NET15'; // 大额订单15天付款
    } else {
      return 'NET30'; // 标准30天付款
    }
  }
  
  /**
   * 计算到期日期
   * @param data 原始数据
   * @returns 到期日期
   */
  private calculateDueDate(data: any): string {
    const orderDate = data.productionOrder?.orderDate;
    const paymentTerms = this.determinePaymentTerms(data);
    
    if (!orderDate) {
      return '';
    }
    
    const date = new Date(orderDate);
    
    // 根据付款条件计算到期日
    switch (paymentTerms) {
      case 'NET15':
        date.setDate(date.getDate() + 15);
        break;
      case 'NET30':
        date.setDate(date.getDate() + 30);
        break;
      case 'NET45':
        date.setDate(date.getDate() + 45);
        break;
      default:
        date.setDate(date.getDate() + 30);
    }
    
    return date.toISOString();
  }
  
  /**
   * 计算财务指标
   * @param data 原始数据
   * @returns 财务指标
   */
  private calculateFinancialMetrics(data: any): any {
    const items = data.productionOrder?.items || [];
    const totalValue = Number(data.productionOrder?.totalValue) || 0;
    const taxRate = Number(data.productionOrder?.taxRate) || 0.13;
    const discount = Number(data.productionOrder?.discount) || 0;
    
    // 计算总税额
    const taxAmount = totalValue * taxRate;
    
    // 计算折扣金额
    const discountAmount = totalValue * (discount / 100);
    
    // 计算净金额
    const netAmount = totalValue - discountAmount;
    
    // 计算按类别汇总
    const categorySummary = this.calculateCategorySummary(items);
    
    return {
      subtotal: totalValue,
      discountAmount,
      taxableAmount: netAmount,
      taxAmount,
      total: netAmount + taxAmount,
      categoryBreakdown: categorySummary,
      averageItemValue: items.length > 0 ? totalValue / items.length : 0,
    };
  }
  
  /**
   * 按类别汇总
   * @param items 项目列表
   * @returns 类别汇总
   */
  private calculateCategorySummary(items: any[]): any {
    const summary: Record<string, { quantity: number; amount: number }> = {};
    
    items.forEach(item => {
      const category = item.category || 'Uncategorized';
      const quantity = Number(item.quantity) || 0;
      const amount = Number(item.totalPrice) || 0;
      
      if (!summary[category]) {
        summary[category] = { quantity: 0, amount: 0 };
      }
      
      summary[category].quantity += quantity;
      summary[category].amount += amount;
    });
    
    return summary;
  }
  
  /**
   * 提取财务条件
   * @param data 原始数据
   * @returns 财务条件列表
   */
  private extractFinancialConditions(data: any): string[] {
    const conditions: string[] = [];
    
    // 检查特殊要求
    if (Array.isArray(data.productionOrder?.specialRequirements)) {
      data.productionOrder.specialRequirements.forEach((req: string) => {
        if (req.includes('付款') || req.includes('payment') || req.includes('payment')) {
          conditions.push(req);
        }
      });
    }
    
    // 检查客户特殊要求
    if (data.customer?.paymentTerms) {
      conditions.push(`客户付款条件: ${data.customer.paymentTerms}`);
    }
    
    // 检查大额订单
    const amount = Number(data.productionOrder?.totalValue) || 0;
    if (amount > 500000) {
      conditions.push('大额订单特殊处理');
    }
    
    return conditions;
  }
  
  /**
   * 确定财务期间
   * @param data 原始数据
   * @returns 财务期间
   */
  private determineFinancialPeriod(data: any): string {
    const date = data.productionOrder?.orderDate || new Date().toISOString();
    const orderDate = new Date(date);
    const year = orderDate.getFullYear();
    const month = orderDate.getMonth() + 1;
    
    return `${year}-Q${Math.ceil(month / 3)}`;
  }
  
  /**
   * 生成会计科目代码
   * @param data 原始数据
   * @returns 会计科目代码
   */
  private generateAccountCode(data: any): string {
    const department = data.productionOrder?.department || '';
    const customerIndustry = data.customer?.industry || '';
    
    // 基于部门和客户行业生成会计科目代码
    let deptCode = 'OTH'; // 默认其他
    let industryCode = 'GEN'; // 默认通用
    
    // 部门代码映射
    const deptMap: Record<string, string> = {
      'SALES_DEPT': 'SAL',
      'MARKETING_DEPT': 'MKT',
      'FINANCE_DEPT': 'FIN',
      'PRODUCTION_DEPT': 'PROD',
      'R&D_DEPT': 'RND',
      'LOGISTICS_DEPT': 'LOG',
    };
    
    // 行业代码映射
    const industryMap: Record<string, string> = {
      'MANUFACTURING': 'MFG',
      'RETAIL': 'RTL',
      'FINANCE': 'FIN',
      'HEALTHCARE': 'HLT',
      'TECHNOLOGY': 'TEC',
      'CONSTRUCTION': 'CNST',
    };
    
    if (deptMap[department]) {
      deptCode = deptMap[department];
    }
    
    if (industryMap[customerIndustry]) {
      industryCode = industryMap[customerIndustry];
    }
    
    return `4000_${deptCode}_${industryCode}`;
  }
  
  /**
   * 应用金融附加数据
   * @param transformedData 转换后的数据
   * @param originalData 原始数据
   */
  private applyFinancialAdditions(transformedData: any, originalData: any): void {
    // 添加财务特定数据
    transformedData.financialDetails = {
      accountReceivable: this.calculateAccountReceivable(originalData),
      revenueRecognition: this.determineRevenueRecognition(originalData),
      taxClassification: this.determineTaxClassification(originalData),
      paymentSchedule: this.generatePaymentSchedule(originalData),
    };
  }
  
  /**
   * 计算应收账款
   * @param data 原始数据
   * @returns 应收账款信息
   */
  private calculateAccountReceivable(data: any): any {
    const totalValue = Number(data.productionOrder?.totalValue) || 0;
    const taxRate = Number(data.productionOrder?.taxRate) || 0.13;
    const discount = Number(data.productionOrder?.discount) || 0;
    const paymentStatus = data.productionOrder?.paymentStatus || 'PENDING';
    
    // 计算应付款总额
    const discountAmount = totalValue * (discount / 100);
    const taxableAmount = totalValue - discountAmount;
    const taxAmount = taxableAmount * taxRate;
    const totalDue = taxableAmount + taxAmount;
    
    // 计算已付款和未付款
    let amountPaid = 0;
    if (paymentStatus === 'COMPLETED') {
      amountPaid = totalDue;
    } else if (paymentStatus === 'PARTIAL') {
      // 假设部分付款为总额的50%
      amountPaid = totalDue * 0.5;
    }
    
    return {
      totalDue,
      amountPaid,
      amountRemaining: totalDue - amountPaid,
      agingDays: this.calculateAgingDays(data),
      status: this.determineReceivableStatus(data),
    };
  }
  
  /**
   * 计算账龄天数
   * @param data 原始数据
   * @returns 账龄天数
   */
  private calculateAgingDays(data: any): number {
    const orderDate = data.productionOrder?.orderDate;
    if (!orderDate) {
      return 0;
    }
    
    const date = new Date(orderDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  }
  
  /**
   * 确定应收账款状态
   * @param data 原始数据
   * @returns 应收账款状态
   */
  private determineReceivableStatus(data: any): string {
    const paymentStatus = data.productionOrder?.paymentStatus;
    const agingDays = this.calculateAgingDays(data);
    
    if (paymentStatus === 'COMPLETED') {
      return 'PAID';
    } else if (agingDays <= 30) {
      return 'CURRENT';
    } else if (agingDays <= 60) {
      return 'OVERDUE_30';
    } else if (agingDays <= 90) {
      return 'OVERDUE_60';
    } else {
      return 'OVERDUE_90_PLUS';
    }
  }
  
  /**
   * 确定收入确认方式
   * @param data 原始数据
   * @returns 收入确认方式
   */
  private determineRevenueRecognition(data: any): string {
    const productionStatus = data.productionOrder?.status;
    const paymentStatus = data.productionOrder?.paymentStatus;
    
    // 根据生产状态和付款状态确定收入确认方式
    if (productionStatus === 'COMPLETED' && paymentStatus === 'COMPLETED') {
      return 'FULL';
    } else if (paymentStatus === 'PARTIAL') {
      return 'PARTIAL';
    } else {
      return 'DEFERRED';
    }
  }
  
  /**
   * 确定税务分类
   * @param data 原始数据
   * @returns 税务分类
   */
  private determineTaxClassification(data: any): string {
    const customerType = data.customer?.type || '';
    const items = data.productionOrder?.items || [];
    
    // 检查是否包含免税项目
    const hasTaxExempt = items.some((item: any) => item.taxExempt);
    
    if (hasTaxExempt) {
      return 'MIXED';
    } else if (customerType === 'NON_PROFIT') {
      return 'TAX_EXEMPT';
    } else {
      return 'STANDARD';
    }
  }
  
  /**
   * 生成付款计划
   * @param data 原始数据
   * @returns 付款计划
   */
  private generatePaymentSchedule(data: any): any[] {
    const paymentTerms = this.determinePaymentTerms(data);
    const totalDue = this.calculateAccountReceivable(data).totalDue;
    const orderDate = data.productionOrder?.orderDate;
    
    if (!orderDate) {
      return [];
    }
    
    const schedule: any[] = [];
    const baseDate = new Date(orderDate);
    
    // 根据付款条件生成付款计划
    switch (paymentTerms) {
      case 'NET15':
        schedule.push({
          dueDate: new Date(baseDate.setDate(baseDate.getDate() + 15)).toISOString(),
          amount: totalDue,
          description: '全额付款',
          status: 'PENDING',
        });
        break;
      case 'NET30':
        schedule.push({
          dueDate: new Date(baseDate.setDate(baseDate.getDate() + 30)).toISOString(),
          amount: totalDue,
          description: '全额付款',
          status: 'PENDING',
        });
        break;
      default:
        // 标准30天付款
        schedule.push({
          dueDate: new Date(baseDate.setDate(baseDate.getDate() + 30)).toISOString(),
          amount: totalDue,
          description: '全额付款',
          status: 'PENDING',
        });
    }
    
    return schedule;
  }
  
  /**
   * 确保金融数据完整性
   * @param data 数据
   */
  private ensureFinancialDataCompleteness(data: any): void {
    // 确保所有必要的字段都存在
    if (!data.financialOrder) {
      data.financialOrder = {};
    }
    
    if (!data.payment) {
      data.payment = {};
    }
    
    if (!data.delivery) {
      data.delivery = {};
    }
    
    if (!data.client) {
      data.client = {};
    }
    
    // 确保金融订单有ID
    if (!data.financialOrder.id) {
      data.financialOrder.id = `FIN_${Date.now()}`;
    }
    
    // 确保有创建时间
    if (!data.financialOrder.createdAt) {
      data.financialOrder.createdAt = new Date().toISOString();
    }
    
    // 确保有交易类型
    if (!data.financialOrder.transactionType) {
      data.financialOrder.transactionType = 'SALES_ORDER';
    }
  }
}

// 适配器类已通过export class声明导出
