/**
 * @file 业务价值评估模块
 * @description 提供ROI计算、决策支持效果评估等业务价值分析功能
 * @module business
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-20
 */



/**
 * ROI计算参数接口
 */
export interface ROIParameters {
  /** 初始投资成本 */
  initialInvestment: number;
  /** 年度收益 */
  annualRevenue: number;
  /** 运营成本 */
  operatingCosts: number;
  /** 项目周期（年） */
  projectLifetime: number;
  /** 贴现率（%） */
  discountRate: number;
  /** 风险系数（0-1） */
  riskFactor?: number;
  /** 税收率（%） */
  taxRate?: number;
  /** 加速折旧率（%） */
  depreciationRate?: number;
}

/**
 * ROI计算结果接口
 */
export interface ROIResult {
  /** 投资回报率 */
  roi: number;
  /** 年化回报率 */
  annualizedROI: number;
  /** 净现值 */
  npv: number;
  /** 内部收益率 */
  irr: number;
  /** 回收期 */
  paybackPeriod: number;
  /** 总投资收益 */
  totalReturn: number;
  /** 风险调整后回报率 */
  riskAdjustedROI: number;
  /** 现金流预测 */
  cashFlowProjection: CashFlowItem[];
}

/**
 * 现金流项目接口
 */
export interface CashFlowItem {
  /** 年份 */
  year: number;
  /** 现金流 */
  cashFlow: number;
  /** 贴现后现金流 */
  discountedCashFlow: number;
  /** 累计贴现现金流 */
  cumulativeDiscountedCashFlow: number;
}

/**
 * 决策支持效果评估参数接口
 */
export interface DecisionSupportParameters {
  /** 决策准确率提升（%） */
  decisionAccuracyImprovement: number;
  /** 决策时间减少（%） */
  decisionTimeReduction: number;
  /** 信息覆盖率提升（%） */
  informationCoverageImprovement: number;
  /** 错误决策减少（%） */
  errorReduction: number;
  /** 关键决策频率（次/月） */
  keyDecisionFrequency: number;
  /** 每次错误决策成本（元） */
  costPerError: number;
  /** 每次决策平均工时（小时） */
  averageDecisionHours: number;
  /** 每小时人工成本（元） */
  hourlyLaborCost: number;
}

/**
 * 决策支持效果评估结果接口
 */
export interface DecisionSupportResult {
  /** 总效率提升分数（0-100） */
  efficiencyScore: number;
  /** 年度决策时间节省（小时） */
  annualTimeSavings: number;
  /** 年度成本节省（元） */
  annualCostSavings: number;
  /** 年度避免错误损失（元） */
  annualErrorReductionValue: number;
  /** 决策质量提升（%） */
  decisionQualityImprovement: number;
  /** 综合价值评分（0-100） */
  overallValueScore: number;
  /** 投资回收期（月） */
  investmentPaybackPeriod: number;
}

/**
 * 业务价值评估配置接口
 */
export interface BusinessValueConfig {
  /** 默认贴现率（%） */
  defaultDiscountRate: number;
  /** 默认风险系数（0-1） */
  defaultRiskFactor: number;
  /** 默认税收率（%） */
  defaultTaxRate: number;
  /** 是否启用高级计算 */
  enableAdvancedCalculations: boolean;
  /** 历史数据参考 */
  historicalData?: HistoricalDataPoint[];
}

/**
 * 历史数据点接口
 */
export interface HistoricalDataPoint {
  /** 时间 */
  timestamp: Date;
  /** 指标值 */
  value: number;
  /** 指标类型 */
  metricType: string;
}

/**
 * 业务价值评估器类
 * 提供ROI计算、决策支持效果评估等业务价值分析功能
 */
export class BusinessValueEvaluator {
  private config: Required<BusinessValueConfig>;

  /**
   * 创建业务价值评估器实例
   * @param config 配置选项
   * @param logger 日志记录器
   */
  constructor(
    config: Partial<BusinessValueConfig> = {}
  ) {
    this.config = {
      defaultDiscountRate: config.defaultDiscountRate || 10,
      defaultRiskFactor: config.defaultRiskFactor || 0.8,
      defaultTaxRate: config.defaultTaxRate || 25,
      enableAdvancedCalculations: config.enableAdvancedCalculations !== false,
      historicalData: config.historicalData || [],
    };
  }

  /**
   * 计算投资回报率（ROI）
   * @param params ROI计算参数
   * @returns ROI计算结果
   */
  calculateROI(params: ROIParameters): ROIResult {
    // 确保参数有效性
    this.validateROIParameters(params);

    const { initialInvestment, annualRevenue, operatingCosts, projectLifetime } = params;
    const riskFactor = params.riskFactor || this.config.defaultRiskFactor;


    // 计算年度净利润
    const annualNetProfit = annualRevenue - operatingCosts;
    
    // 计算总投资收益
    const totalReturn = (annualNetProfit * projectLifetime) - initialInvestment;
    
    // 计算ROI
    const roi = (totalReturn / initialInvestment) * 100;
    
    // 计算年化ROI
    const annualizedROI = ((Math.pow((initialInvestment + totalReturn) / initialInvestment, 1 / projectLifetime) - 1) * 100);
    
    // 计算风险调整后ROI
    const riskAdjustedROI = roi * riskFactor;
    
    // 计算现金流预测
    const cashFlowProjection = this.calculateCashFlowProjection(params);
    
    // 计算NPV
    const npv = this.calculateNPV(cashFlowProjection);
    
    // 计算IRR
    const irr = this.calculateIRR(cashFlowProjection);
    
    // 计算回收期
    const paybackPeriod = this.calculatePaybackPeriod(cashFlowProjection);
    
    return {
      roi,
      annualizedROI,
      npv,
      irr,
      paybackPeriod,
      totalReturn,
      riskAdjustedROI,
      cashFlowProjection,
    };
  }

  /**
   * 验证ROI参数有效性
   * @param params ROI参数
   * @throws 当参数无效时抛出错误
   */
  private validateROIParameters(params: ROIParameters): void {
    const errors: string[] = [];

    if (params.initialInvestment <= 0) {
      errors.push('初始投资必须大于0');
    }

    if (params.projectLifetime <= 0) {
      errors.push('项目周期必须大于0');
    }

    if (params.discountRate < 0) {
      errors.push('贴现率不能为负');
    }

    if (params.riskFactor !== undefined && (params.riskFactor < 0 || params.riskFactor > 1)) {
      errors.push('风险系数必须在0到1之间');
    }

    if (errors.length > 0) {
      throw new Error(`ROI参数验证失败: ${errors.join(', ')}`);
    }
  }

  /**
   * 计算现金流预测
   * @param params ROI计算参数
   * @returns 现金流预测数组
   */
  private calculateCashFlowProjection(params: ROIParameters): CashFlowItem[] {
    const { initialInvestment, annualRevenue, operatingCosts, projectLifetime, discountRate } = params;
    const items: CashFlowItem[] = [];
    let cumulativeDiscountedCashFlow = 0;

    // 第0年（初始投资）
    items.push({
      year: 0,
      cashFlow: -initialInvestment,
      discountedCashFlow: -initialInvestment,
      cumulativeDiscountedCashFlow: -initialInvestment
    });
    cumulativeDiscountedCashFlow = -initialInvestment;

    // 后续年份
    for (let year = 1; year <= projectLifetime; year++) {
      const annualNetProfit = annualRevenue - operatingCosts;
      const cashFlow = annualNetProfit;
      const discountFactor = 1 / Math.pow(1 + discountRate / 100, year);
      const discountedCashFlow = cashFlow * discountFactor;
      cumulativeDiscountedCashFlow += discountedCashFlow;

      items.push({
        year,
        cashFlow,
        discountedCashFlow,
        cumulativeDiscountedCashFlow
      });
    }

    return items;
  }

  /**
   * 计算净现值（NPV）
   * @param cashFlowProjection 现金流预测
   * @returns 净现值
   */
  private calculateNPV(cashFlowProjection: CashFlowItem[]): number {
    // NPV是最后一年的累计贴现现金流
    const lastItem = cashFlowProjection[cashFlowProjection.length - 1];
    return lastItem ? lastItem.cumulativeDiscountedCashFlow : 0;
  }

  /**
   * 计算内部收益率（IRR）
   * 使用试错法计算IRR
   * @param cashFlowProjection 现金流预测
   * @returns 内部收益率
   */
  private calculateIRR(cashFlowProjection: CashFlowItem[]): number {
    // 提取现金流
    const cashFlows = cashFlowProjection.map(item => item.cashFlow);
    
    // 使用二分法近似计算IRR
    let low = -1.0;
    let high = 1.0;
    let mid = 0;
    let npv = 0;
    const tolerance = 0.00001;
    let iterations = 0;
    const maxIterations = 100;

    // 检查是否有正负现金流，以确保IRR存在
    const hasNegative = cashFlows.some(cf => cf < 0);
    const hasPositive = cashFlows.some(cf => cf > 0);

    if (!hasNegative || !hasPositive) {
      return 0; // 如果没有正负现金流交替，IRR无法确定
    }

    // 调整high值直到NPV为正
    while (this.calculateNPVForRate(cashFlows, high) < 0) {
      high *= 2;
      if (iterations++ > maxIterations) return 0; // 避免无限循环
    }

    // 使用二分法求解IRR
    iterations = 0;
    while (Math.abs(high - low) > tolerance && iterations < maxIterations) {
      mid = (low + high) / 2;
      npv = this.calculateNPVForRate(cashFlows, mid);
      
      if (npv > 0) {
        high = mid;
      } else {
        low = mid;
      }
      
      iterations++;
    }

    return mid * 100; // 转换为百分比
  }

  /**
   * 计算特定贴现率下的NPV
   * @param cashFlows 现金流数组
   * @param rate 贴现率
   * @returns NPV值
   */
  private calculateNPVForRate(cashFlows: number[], rate: number): number {
    return cashFlows.reduce((npv, cf, year) => {
      return npv + cf / Math.pow(1 + rate, year);
    }, 0);
  }

  /**
   * 计算回收期
   * @param cashFlowProjection 现金流预测
   * @returns 回收期（年）
   */
  private calculatePaybackPeriod(cashFlowProjection: CashFlowItem[]): number {
    let previousCashFlow = 0;
    
    for (let i = 1; i < cashFlowProjection.length; i++) {
      const currentItem = cashFlowProjection[i];
      const previousItem = cashFlowProjection[i - 1];
      
      previousCashFlow = previousItem.cumulativeDiscountedCashFlow;
      const currentCashFlow = currentItem.cumulativeDiscountedCashFlow;
      
      // 检查是否在当前年份达到盈亏平衡
      if (previousCashFlow < 0 && currentCashFlow >= 0) {
        // 线性插值计算精确回收期
        const fraction = Math.abs(previousCashFlow) / (currentCashFlow - previousCashFlow);
        return i - 1 + fraction;
      }
    }
    
    return Infinity; // 如果在项目期内没有达到回收期
  }

  /**
   * 评估决策支持效果
   * @param params 决策支持参数
   * @returns 决策支持评估结果
   */
  evaluateDecisionSupport(params: DecisionSupportParameters): DecisionSupportResult {
    // 验证参数
    this.validateDecisionSupportParameters(params);

    const { 
      decisionAccuracyImprovement,
      decisionTimeReduction,
      informationCoverageImprovement,
      errorReduction,
      keyDecisionFrequency,
      costPerError,
      averageDecisionHours,
      hourlyLaborCost
    } = params;

    // 计算年度决策次数
    const annualDecisionCount = keyDecisionFrequency * 12;
    
    // 计算年度时间节省
    const annualTimeSavings = annualDecisionCount * averageDecisionHours * (decisionTimeReduction / 100);
    
    // 计算年度成本节省（工时减少）
    const timeBasedSavings = annualTimeSavings * hourlyLaborCost;
    
    // 计算年度避免错误损失
    const annualErrorReductionValue = annualDecisionCount * (errorReduction / 100) * costPerError;
    
    // 计算总年度节省
    const annualCostSavings = timeBasedSavings + annualErrorReductionValue;
    
    // 计算决策质量提升
    const decisionQualityImprovement = (decisionAccuracyImprovement + informationCoverageImprovement) / 2;
    
    // 计算效率评分（综合考虑所有因素）
    const efficiencyScore = (
      decisionAccuracyImprovement * 0.3 +
      decisionTimeReduction * 0.3 +
      informationCoverageImprovement * 0.2 +
      errorReduction * 0.2
    );
    
    // 计算综合价值评分（考虑效率和成本节省）
    // 这里假设有一个基准投资成本（100万元），用于计算投资回报率并转换为0-100的分数
    const baselineInvestment = 1000000;
    const roi = (annualCostSavings / baselineInvestment) * 100;
    const overallValueScore = Math.min(100, (efficiencyScore * 0.6) + (Math.min(50, roi) * 0.4));
    
    // 计算投资回收期
    const investmentPaybackPeriod = (baselineInvestment / annualCostSavings) * 12; // 转换为月

    return {
      efficiencyScore,
      annualTimeSavings,
      annualCostSavings,
      annualErrorReductionValue,
      decisionQualityImprovement,
      overallValueScore,
      investmentPaybackPeriod
    };
  }

  /**
   * 验证决策支持参数有效性
   * @param params 决策支持参数
   * @throws 当参数无效时抛出错误
   */
  private validateDecisionSupportParameters(params: DecisionSupportParameters): void {
    const errors: string[] = [];

    // 检查百分比参数是否在有效范围内
    const percentageParams = [
      'decisionAccuracyImprovement',
      'decisionTimeReduction',
      'informationCoverageImprovement',
      'errorReduction'
    ];

    for (const param of percentageParams) {
      const value = (params as any)[param];
      if (value < 0 || value > 100) {
        errors.push(`${param} 必须在0到100之间`);
      }
    }

    // 检查成本和频率参数是否为正数
    const positiveParams = [
      'keyDecisionFrequency',
      'costPerError',
      'averageDecisionHours',
      'hourlyLaborCost'
    ];

    for (const param of positiveParams) {
      const value = (params as any)[param];
      if (value <= 0) {
        errors.push(`${param} 必须大于0`);
      }
    }

    if (errors.length > 0) {
      throw new Error(`决策支持参数验证失败: ${errors.join(', ')}`);
    }
  }

  /**
   * 生成综合业务价值报告
   * @param roiResult ROI计算结果
   * @param decisionSupportResult 决策支持效果评估结果
   * @returns 综合业务价值报告
   */
  generateBusinessValueReport(
    roiResult: ROIResult,
    decisionSupportResult: DecisionSupportResult
  ): BusinessValueReport {
    // 计算综合价值分数
    const financialScore = Math.min(100, Math.max(0, roiResult.roi / 2)); // 假设ROI 200%对应满分
    const efficiencyScore = decisionSupportResult.efficiencyScore;
    const overallScore = (financialScore * 0.6) + (efficiencyScore * 0.4);
    
    // 计算投资评级
    const investmentRating = this.calculateInvestmentRating(roiResult, decisionSupportResult);
    
    return {
      overallValueScore: overallScore,
      financialScore,
      efficiencyScore,
      roiResult,
      decisionSupportResult,
      investmentRating,
      recommendations: this.generateRecommendations(roiResult, decisionSupportResult),
      executiveSummary: this.generateExecutiveSummary(roiResult, decisionSupportResult)
    };
  }

  /**
   * 计算投资评级
   * @param roiResult ROI结果
   * @param decisionSupportResult 决策支持结果
   * @returns 投资评级
   */
  private calculateInvestmentRating(
    roiResult: ROIResult,
    decisionSupportResult: DecisionSupportResult
  ): 'A' | 'B' | 'C' | 'D' | 'F' {
    const roi = roiResult.roi;
    const paybackPeriod = roiResult.paybackPeriod;
    const decisionScore = decisionSupportResult.efficiencyScore;
    
    // 综合评分
    const score = (
      (roi >= 100 ? 3 : roi >= 50 ? 2 : roi >= 20 ? 1 : 0) +
      (paybackPeriod <= 1 ? 3 : paybackPeriod <= 2 ? 2 : paybackPeriod <= 3 ? 1 : 0) +
      (decisionScore >= 80 ? 3 : decisionScore >= 60 ? 2 : decisionScore >= 40 ? 1 : 0)
    );
    
    // 评级
    if (score >= 8) return 'A';
    if (score >= 6) return 'B';
    if (score >= 4) return 'C';
    if (score >= 2) return 'D';
    return 'F';
  }

  /**
   * 生成建议
   * @param roiResult ROI结果
   * @param decisionSupportResult 决策支持结果
   * @returns 建议数组
   */
  private generateRecommendations(
    roiResult: ROIResult,
    decisionSupportResult: DecisionSupportResult
  ): string[] {
    const recommendations: string[] = [];
    
    // 基于ROI的建议
    if (roiResult.roi < 20) {
      recommendations.push('投资回报率较低，建议重新评估项目成本结构和收益预测');
    }
    
    // 基于回收期的建议
    if (roiResult.paybackPeriod > 3) {
      recommendations.push('回收期较长，考虑分阶段实施以分散风险');
    }
    
    // 基于决策支持效果的建议
    if (decisionSupportResult.efficiencyScore < 50) {
      recommendations.push('决策支持效果有待提升，建议增强数据分析能力和用户体验');
    }
    
    // 基于现金流的建议
    const negativeYears = roiResult.cashFlowProjection.filter(item => item.cashFlow < 0).length;
    if (negativeYears > 1) {
      recommendations.push('现金流预测显示多年度亏损，需要制定更严格的成本控制措施');
    }
    
    // 积极建议
    if (roiResult.roi > 100) {
      recommendations.push('投资回报率优秀，考虑扩大项目规模或加速实施');
    }
    
    if (decisionSupportResult.efficiencyScore > 80) {
      recommendations.push('决策支持效果卓越，可作为公司最佳实践推广');
    }
    
    return recommendations;
  }

  /**
   * 生成执行摘要
   * @param roiResult ROI结果
   * @param decisionSupportResult 决策支持结果
   * @returns 执行摘要
   */
  private generateExecutiveSummary(
    roiResult: ROIResult,
    decisionSupportResult: DecisionSupportResult
  ): string {
    return `
      项目投资评估执行摘要：
      1. 投资回报率(ROI)：${roiResult.roi.toFixed(2)}%，年化回报率：${roiResult.annualizedROI.toFixed(2)}%
      2. 净现值(NPV)：${roiResult.npv.toLocaleString('zh-CN')}元，内部收益率(IRR)：${roiResult.irr.toFixed(2)}%
      3. 项目回收期：${roiResult.paybackPeriod.toFixed(1)}年
      4. 决策支持效率提升：${decisionSupportResult.efficiencyScore.toFixed(1)}分(满分100)
      5. 年度成本节省：${decisionSupportResult.annualCostSavings.toLocaleString('zh-CN')}元
      6. 风险调整后回报率：${roiResult.riskAdjustedROI.toFixed(2)}%
      7. 建议行动：${this.generateRecommendations(roiResult, decisionSupportResult).length > 0 ? 
         this.generateRecommendations(roiResult, decisionSupportResult)[0] : '维持当前方案'}
    `.trim();
  }

  /**
   * 模拟业务场景的ROI计算
   * @param scenario 场景类型
   * @returns 模拟ROI计算结果
   */
  simulateScenarioROI(scenario: 'optimistic' | 'pessimistic' | 'base'): ROIResult {
    // 基础参数
    const baseParams: ROIParameters = {
      initialInvestment: 1000000, // 100万元初始投资
      annualRevenue: 500000,      // 年营收50万元
      operatingCosts: 200000,     // 年运营成本20万元
      projectLifetime: 5,         // 项目周期5年
      discountRate: 10            // 贴现率10%
    };

    const scenarioParams = { ...baseParams };

    switch (scenario) {
      case 'optimistic':
        scenarioParams.annualRevenue *= 1.5; // 乐观情况下收入提高50%
        scenarioParams.operatingCosts *= 0.9; // 成本降低10%
        scenarioParams.projectLifetime = 7;  // 项目周期延长至7年
        break;
      case 'pessimistic':
        scenarioParams.annualRevenue *= 0.7; // 悲观情况下收入降低30%
        scenarioParams.operatingCosts *= 1.2; // 成本增加20%
        scenarioParams.projectLifetime = 3;  // 项目周期缩短至3年
        break;
      default: // base
        // 使用基础参数
        break;
    }

    return this.calculateROI(scenarioParams);
  }

  /**
   * 提供决策支持效果的基准比较
   * @param actualResult 实际结果
   * @returns 基准比较结果
   */
  benchmarkDecisionSupport(actualResult: DecisionSupportResult): BenchmarkResult {
    // 行业基准数据（示例）
    const industryBenchmarks = {
      averageEfficiencyScore: 65,
      averageAnnualTimeSavings: 1000,
      averageAnnualCostSavings: 200000
    };

    return {
      comparedToIndustry: {
        efficiencyScore: actualResult.efficiencyScore - industryBenchmarks.averageEfficiencyScore,
        annualTimeSavings: actualResult.annualTimeSavings - industryBenchmarks.averageAnnualTimeSavings,
        annualCostSavings: actualResult.annualCostSavings - industryBenchmarks.averageAnnualCostSavings
      },
      percentileRanking: this.calculatePercentileRanking(actualResult),
      competitiveAdvantage: this.calculateCompetitiveAdvantage(actualResult)
    };
  }

  /**
   * 计算百分位排名
   * @param result 决策支持结果
   * @returns 百分位排名
   */
  private calculatePercentileRanking(result: DecisionSupportResult): number {
    // 基于效率分数计算百分位排名
    // 假设效率分数与百分位排名有以下对应关系
    if (result.efficiencyScore >= 90) return 95;
    if (result.efficiencyScore >= 80) return 80;
    if (result.efficiencyScore >= 70) return 65;
    if (result.efficiencyScore >= 60) return 45;
    if (result.efficiencyScore >= 50) return 30;
    return 15;
  }

  /**
   * 计算竞争优势
   * @param result 决策支持结果
   * @returns 竞争优势描述
   */
  private calculateCompetitiveAdvantage(result: DecisionSupportResult): string {
    if (result.efficiencyScore >= 90) return '显著竞争优势';
    if (result.efficiencyScore >= 80) return '强竞争优势';
    if (result.efficiencyScore >= 70) return '中等竞争优势';
    if (result.efficiencyScore >= 60) return '微弱竞争优势';
    return '无明显竞争优势';
  }
}

/**
 * 基准比较结果接口
 */
export interface BenchmarkResult {
  /** 与行业平均水平的对比 */
  comparedToIndustry: {
    /** 效率分数差异 */
    efficiencyScore: number;
    /** 年度时间节省差异 */
    annualTimeSavings: number;
    /** 年度成本节省差异 */
    annualCostSavings: number;
  };
  /** 百分位排名 */
  percentileRanking: number;
  /** 竞争优势描述 */
  competitiveAdvantage: string;
}

/**
 * 业务价值报告接口
 */
export interface BusinessValueReport {
  /** 整体价值评分（0-100） */
  overallValueScore: number;
  /** 财务评分（0-100） */
  financialScore: number;
  /** 效率评分（0-100） */
  efficiencyScore: number;
  /** ROI计算结果 */
  roiResult: ROIResult;
  /** 决策支持评估结果 */
  decisionSupportResult: DecisionSupportResult;
  /** 投资评级 */
  investmentRating: 'A' | 'B' | 'C' | 'D' | 'F';
  /** 建议 */
  recommendations: string[];
  /** 执行摘要 */
  executiveSummary: string;
}

/**
 * 全局业务价值评估器实例
 */
export const defaultBusinessValueEvaluator = new BusinessValueEvaluator();
