/**
 * @file 综合评估报告生成器
 * @description 整合各维度评估结果，生成统一的评估报告
 * @module assessment
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-20
 */

import { PerformanceAnalysisResult } from '../performance/PerformanceAnalyzer';
import { BusinessValueReport } from '../business/BusinessValueEvaluator';

/**
 * 评估维度类型
 */
export type AssessmentDimension = 'technical' | 'functional' | 'userExperience' | 'businessValue' | 'collaboration';

/**
 * 单个评估指标结果
 */
export interface MetricResult {
  /** 指标ID */
  id: string;
  /** 指标名称 */
  name: string;
  /** 指标值 */
  value: number;
  /** 目标值 */
  targetValue: number;
  /** 权重（0-1） */
  weight: number;
  /** 得分（0-100） */
  score: number;
  /** 评估维度 */
  dimension: AssessmentDimension;
  /** 是否通过 */
  passed: boolean;
  /** 详细描述 */
  description?: string;
  /** 改进建议 */
  recommendations?: string[];
}

/**
 * 维度评估结果
 */
export interface DimensionResult {
  /** 维度名称 */
  dimension: AssessmentDimension;
  /** 维度得分（0-100） */
  score: number;
  /** 维度权重（0-1） */
  weight: number;
  /** 评估指标结果列表 */
  metrics: MetricResult[];
  /** 维度描述 */
  description: string;
  /** 是否通过 */
  passed: boolean;
}

/**
 * 综合评估报告接口
 */
export interface ComprehensiveReport {
  /** 报告ID */
  id: string;
  /** 报告名称 */
  title: string;
  /** 评估时间 */
  timestamp: Date;
  /** 总体得分（0-100） */
  overallScore: number;
  /** 评估状态 */
  status: 'pass' | 'warn' | 'fail';
  /** 各维度评估结果 */
  dimensions: Record<AssessmentDimension, DimensionResult>;
  /** 性能分析结果引用 */
  performanceAnalysis?: PerformanceAnalysisResult;
  /** 业务价值评估结果引用 */
  businessValueAnalysis?: BusinessValueReport;
  /** 总体评估摘要 */
  summary: string;
  /** 主要发现 */
  keyFindings: string[];
  /** 改进建议 */
  recommendations: string[];
  /** 报告生成者 */
  generatedBy: string;
}

/**
 * 报告生成器选项
 */
export interface ReportGeneratorOptions {
  /** 报告标题 */
  title?: string;
  /** 各维度权重配置 */
  dimensionWeights?: Partial<Record<AssessmentDimension, number>>;
  /** 报告生成者 */
  generatedBy?: string;
  /** 是否包含详细信息 */
  includeDetails?: boolean;
  /** 性能分析结果 */
  performanceAnalysis?: PerformanceAnalysisResult;
  /** 业务价值分析结果 */
  businessValueAnalysis?: BusinessValueReport;
}

/**
 * 综合评估报告生成器
 */
class ComprehensiveReportGenerator {
  /**
   * 默认维度权重配置
   */
  private readonly defaultDimensionWeights: Record<AssessmentDimension, number> = {
    technical: 0.25,
    functional: 0.25,
    userExperience: 0.15,
    businessValue: 0.25,
    collaboration: 0.10
  };

  /**
   * 维度描述配置
   */
  private readonly dimensionDescriptions: Record<AssessmentDimension, string> = {
    technical: '技术性能维度评估系统在响应速度、吞吐量、稳定性等方面的表现',
    functional: '功能质量维度评估系统功能的完整性、正确性和可靠性',
    userExperience: '用户体验维度评估系统的易用性、界面美观度和用户满意度',
    businessValue: '业务价值维度评估系统对业务目标的支持度和产生的价值',
    collaboration: '协同效能维度评估系统与其他系统的集成能力和数据互通效率'
  };

  /**
   * 生成报告ID
   */
  private generateReportId(): string {
    return `report-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * 计算总体得分
   */
  private calculateOverallScore(dimensions: Record<AssessmentDimension, DimensionResult>): number {
    let totalScore = 0;
    
    for (const dimensionKey in dimensions) {
      const dimension = dimensions[dimensionKey as AssessmentDimension];
      totalScore += dimension.score * dimension.weight;
    }
    
    return Math.round(totalScore);
  }

  /**
   * 确定评估状态
   */
  private determineStatus(overallScore: number): 'pass' | 'warn' | 'fail' {
    if (overallScore >= 80) return 'pass';
    if (overallScore >= 60) return 'warn';
    return 'fail';
  }

  /**
   * 生成技术性能维度评估结果
   */
  private generateTechnicalDimensionResult(
    weight: number,
    performanceAnalysis?: PerformanceAnalysisResult
  ): DimensionResult {
    // 定义技术性能评估指标
    const metrics: MetricResult[] = [
      {
        id: 'response_time',
        name: '平均响应时间',
        dimension: 'technical',
        weight: 0.25,
        value: performanceAnalysis?.metrics?.averageResponseTime || 0,
        targetValue: 300, // 毫秒
        score: 0,
        passed: false,
        description: '系统处理请求的平均响应时间'
      },
      {
        id: 'render_time',
        name: '平均渲染时间',
        dimension: 'technical',
        weight: 0.20,
        value: performanceAnalysis?.metrics?.averageResponseTime || 0,
        targetValue: 100, // 毫秒
        score: 0,
        passed: false,
        description: '页面元素的平均渲染时间'
      },
      {
        id: 'error_rate',
        name: '错误率',
        dimension: 'technical',
        weight: 0.20,
        value: (performanceAnalysis?.metrics?.errorRate || 0) * 100,
        targetValue: 1, // 百分比
        score: 0,
        passed: false,
        description: '系统运行过程中的错误率'
      },
      {
        id: 'throughput',
        name: '吞吐量',
        dimension: 'technical',
        weight: 0.15,
        value: performanceAnalysis?.metrics?.sampleCount || 0,
        targetValue: 1000,
        score: 0,
        passed: false,
        description: '系统单位时间内处理的操作数'
      },
      {
        id: 'stability',
        name: '系统稳定性',
        dimension: 'technical',
        weight: 0.20,
        value: 100 - ((performanceAnalysis?.issues?.length || 0) * 10),
        targetValue: 90,
        score: 0,
        passed: false,
        description: '系统运行稳定性评估'
      }
    ];

    // 计算每个指标的得分
    const scoredMetrics = metrics.map(metric => {
      // 特殊处理错误率（越低越好）
      let score: number;
      if (metric.id === 'error_rate') {
        score = Math.max(0, 100 - ((metric.value - metric.targetValue) / metric.targetValue) * 100);
      } else {
        // 其他指标（越高/越快越好）
        score = Math.min(100, (metric.value / metric.targetValue) * 100);
      }

      // 确保分数在0-100之间
      score = Math.max(0, Math.min(100, score));

      return {
        ...metric,
        score: Math.round(score),
        passed: score >= 80
      };
    });

    // 计算维度总分
    let dimensionScore = 0;
    scoredMetrics.forEach(metric => {
      dimensionScore += metric.score * metric.weight;
    });
    dimensionScore = Math.round(dimensionScore);

    return {
      dimension: 'technical',
      score: dimensionScore,
      weight,
      metrics: scoredMetrics,
      description: this.dimensionDescriptions.technical,
      passed: dimensionScore >= 70
    };
  }

  /**
   * 生成功能质量维度评估结果
   */
  private generateFunctionalDimensionResult(weight: number): DimensionResult {
    // 定义功能质量评估指标
    const metrics: MetricResult[] = [
      {
        id: 'feature_coverage',
        name: '功能覆盖率',
        dimension: 'functional',
        weight: 0.25,
        value: 95,
        targetValue: 90,
        score: 0,
        passed: false,
        description: '已实现功能占计划功能的百分比'
      },
      {
        id: 'feature_correctness',
        name: '功能正确性',
        dimension: 'functional',
        weight: 0.30,
        value: 90,
        targetValue: 90,
        score: 0,
        passed: false,
        description: '功能实现的正确性百分比'
      },
      {
        id: 'data_accuracy',
        name: '数据准确性',
        dimension: 'functional',
        weight: 0.20,
        value: 98,
        targetValue: 95,
        score: 0,
        passed: false,
        description: '数据处理和存储的准确性'
      },
      {
        id: 'code_quality',
        name: '代码质量',
        dimension: 'functional',
        weight: 0.15,
        value: 85,
        targetValue: 80,
        score: 0,
        passed: false,
        description: '代码质量评估分数'
      },
      {
        id: 'test_coverage',
        name: '测试覆盖率',
        dimension: 'functional',
        weight: 0.10,
        value: 80,
        targetValue: 75,
        score: 0,
        passed: false,
        description: '代码测试覆盖率'
      }
    ];

    // 计算每个指标的得分
    const scoredMetrics = metrics.map(metric => {
      const score = Math.min(100, (metric.value / metric.targetValue) * 100);
      return {
        ...metric,
        score: Math.round(score),
        passed: score >= 80
      };
    });

    // 计算维度总分
    let dimensionScore = 0;
    scoredMetrics.forEach(metric => {
      dimensionScore += metric.score * metric.weight;
    });
    dimensionScore = Math.round(dimensionScore);

    return {
      dimension: 'functional',
      score: dimensionScore,
      weight,
      metrics: scoredMetrics,
      description: this.dimensionDescriptions.functional,
      passed: dimensionScore >= 70
    };
  }

  /**
   * 生成用户体验维度评估结果
   */
  private generateUserExperienceDimensionResult(weight: number): DimensionResult {
    // 定义用户体验评估指标
    const metrics: MetricResult[] = [
      {
        id: 'nps_score',
        name: 'NPS评分',
        dimension: 'userExperience',
        weight: 0.25,
        value: 45,
        targetValue: 40,
        score: 0,
        passed: false,
        description: '用户净推荐值'
      },
      {
        id: 'satisfaction_score',
        name: '用户满意度',
        dimension: 'userExperience',
        weight: 0.20,
        value: 8.5,
        targetValue: 8.0,
        score: 0,
        passed: false,
        description: '用户满意度评分（满分10分）'
      },
      {
        id: 'usability_score',
        name: '系统易用性',
        dimension: 'userExperience',
        weight: 0.25,
        value: 90,
        targetValue: 85,
        score: 0,
        passed: false,
        description: '系统易用性评分'
      },
      {
        id: 'task_completion_rate',
        name: '任务完成率',
        dimension: 'userExperience',
        weight: 0.20,
        value: 95,
        targetValue: 90,
        score: 0,
        passed: false,
        description: '用户任务完成率'
      },
      {
        id: 'interface_design',
        name: '界面美观度',
        dimension: 'userExperience',
        weight: 0.10,
        value: 85,
        targetValue: 80,
        score: 0,
        passed: false,
        description: '系统界面设计评分'
      }
    ];

    // 计算每个指标的得分
    const scoredMetrics = metrics.map(metric => {
      const score = Math.min(100, (metric.value / metric.targetValue) * 100);
      return {
        ...metric,
        score: Math.round(score),
        passed: score >= 80
      };
    });

    // 计算维度总分
    let dimensionScore = 0;
    scoredMetrics.forEach(metric => {
      dimensionScore += metric.score * metric.weight;
    });
    dimensionScore = Math.round(dimensionScore);

    return {
      dimension: 'userExperience',
      score: dimensionScore,
      weight,
      metrics: scoredMetrics,
      description: this.dimensionDescriptions.userExperience,
      passed: dimensionScore >= 70
    };
  }

  /**
   * 生成业务价值维度评估结果
   */
  private generateBusinessValueDimensionResult(
    weight: number,
    businessValueAnalysis?: BusinessValueReport
  ): DimensionResult {
    // 定义业务价值评估指标
    const metrics: MetricResult[] = [
      {
        id: 'efficiency_improvement',
        name: '业务效率提升',
        dimension: 'businessValue',
        weight: 0.25,
        value: businessValueAnalysis?.efficiencyScore || 40,
        targetValue: 30,
        score: 0,
        passed: false,
        description: '系统带来的业务效率提升百分比'
      },
      {
        id: 'cost_saving',
        name: '成本节约',
        dimension: 'businessValue',
        weight: 0.20,
        value: businessValueAnalysis?.decisionSupportResult?.annualCostSavings ? businessValueAnalysis.decisionSupportResult.annualCostSavings / 10000 : 25,
        targetValue: 20,
        score: 0,
        passed: false,
        description: '系统带来的成本节约百分比'
      },
      {
        id: 'decision_support',
        name: '决策支持效果',
        dimension: 'businessValue',
        weight: 0.25,
        value: businessValueAnalysis?.decisionSupportResult?.efficiencyScore || 85,
        targetValue: 80,
        score: 0,
        passed: false,
        description: '系统对业务决策的支持效果评分'
      },
      {
        id: 'roi',
        name: '投资回报率',
        dimension: 'businessValue',
        weight: 0.20,
        value: businessValueAnalysis?.roiResult?.roi || 180,
        targetValue: 150,
        score: 0,
        passed: false,
        description: '系统投资回报率（ROI）百分比'
      },
      {
        id: 'industry_adaptation',
        name: '行业适应性',
        dimension: 'businessValue',
        weight: 0.10,
        value: 90,
        targetValue: 85,
        score: 0,
        passed: false,
        description: '系统对行业需求的适应程度'
      }
    ];

    // 计算每个指标的得分
    const scoredMetrics = metrics.map(metric => {
      const score = Math.min(100, (metric.value / metric.targetValue) * 100);
      return {
        ...metric,
        score: Math.round(score),
        passed: score >= 80
      };
    });

    // 计算维度总分
    let dimensionScore = 0;
    scoredMetrics.forEach(metric => {
      dimensionScore += metric.score * metric.weight;
    });
    dimensionScore = Math.round(dimensionScore);

    return {
      dimension: 'businessValue',
      score: dimensionScore,
      weight,
      metrics: scoredMetrics,
      description: this.dimensionDescriptions.businessValue,
      passed: dimensionScore >= 70
    };
  }

  /**
   * 生成协同效能维度评估结果
   */
  private generateCollaborationDimensionResult(weight: number): DimensionResult {
    // 定义协同效能评估指标
    const metrics: MetricResult[] = [
      {
        id: 'data_sharing_efficiency',
        name: '数据互通效率',
        dimension: 'collaboration',
        weight: 0.25,
        value: 85,
        targetValue: 80,
        score: 0,
        passed: false,
        description: '系统与其他系统数据交换的效率'
      },
      {
        id: 'cross_industry_collaboration',
        name: '跨行业协同完成率',
        dimension: 'collaboration',
        weight: 0.25,
        value: 75,
        targetValue: 70,
        score: 0,
        passed: false,
        description: '跨行业协同任务的完成率'
      },
      {
        id: 'system_interoperability',
        name: '系统互操作性',
        dimension: 'collaboration',
        weight: 0.30,
        value: 90,
        targetValue: 85,
        score: 0,
        passed: false,
        description: '系统与其他系统的互操作性评分'
      },
      {
        id: 'workflow_efficiency',
        name: '协同工作流效率',
        dimension: 'collaboration',
        weight: 0.20,
        value: 85,
        targetValue: 80,
        score: 0,
        passed: false,
        description: '协同工作流程的效率评分'
      }
    ];

    // 计算每个指标的得分
    const scoredMetrics = metrics.map(metric => {
      const score = Math.min(100, (metric.value / metric.targetValue) * 100);
      return {
        ...metric,
        score: Math.round(score),
        passed: score >= 80
      };
    });

    // 计算维度总分
    let dimensionScore = 0;
    scoredMetrics.forEach(metric => {
      dimensionScore += metric.score * metric.weight;
    });
    dimensionScore = Math.round(dimensionScore);

    return {
      dimension: 'collaboration',
      score: dimensionScore,
      weight,
      metrics: scoredMetrics,
      description: this.dimensionDescriptions.collaboration,
      passed: dimensionScore >= 70
    };
  }

  /**
   * 生成综合评估报告
   */
  public generateReport(options: ReportGeneratorOptions = {}): ComprehensiveReport {
    // 合并维度权重配置
    const dimensionWeights: Record<AssessmentDimension, number> = {
      ...this.defaultDimensionWeights,
      ...options.dimensionWeights
    };

    // 生成各维度评估结果
    const dimensions: Record<AssessmentDimension, DimensionResult> = {
      technical: this.generateTechnicalDimensionResult(dimensionWeights.technical, options.performanceAnalysis),
      functional: this.generateFunctionalDimensionResult(dimensionWeights.functional),
      userExperience: this.generateUserExperienceDimensionResult(dimensionWeights.userExperience),
      businessValue: this.generateBusinessValueDimensionResult(dimensionWeights.businessValue, options.businessValueAnalysis),
      collaboration: this.generateCollaborationDimensionResult(dimensionWeights.collaboration)
    };

    // 计算总体得分
    const overallScore = this.calculateOverallScore(dimensions);
    
    // 确定评估状态
    const status = this.determineStatus(overallScore);

    // 生成关键发现
    const keyFindings: string[] = [];
    
    // 收集未通过的指标
    Object.values(dimensions).forEach(dimension => {
      dimension.metrics.forEach(metric => {
        if (!metric.passed) {
          keyFindings.push(`${metric.name}得分较低（${metric.score}分），低于目标值`);
        }
      });
      
      if (!dimension.passed) {
        keyFindings.push(`${dimension.dimension}维度得分较低（${dimension.score}分），需要改进`);
      }
    });

    // 生成改进建议
    const recommendations: string[] = [];
    
    // 从各维度收集改进建议
    Object.values(dimensions).forEach(dimension => {
      if (!dimension.passed) {
        recommendations.push(`重点改进${dimension.dimension}维度，当前得分${dimension.score}分，建议提升至70分以上`);
      }
    });

    // 根据总体得分生成具体建议
    if (overallScore < 60) {
      recommendations.push('系统整体表现较差，建议进行全面评估和重大改进');
    } else if (overallScore < 80) {
      recommendations.push('系统表现一般，建议针对薄弱环节进行优化');
    }

    // 生成评估摘要
    let summary = `系统综合评估得分：${overallScore}分，评估状态：${status === 'pass' ? '通过' : status === 'warn' ? '警告' : '未通过'}。`;
    
    if (overallScore >= 80) {
      summary += ' 系统整体表现良好，各维度均达到或超过目标要求。';
    } else if (overallScore >= 60) {
      summary += ' 系统基本满足要求，但仍有改进空间。';
    } else {
      summary += ' 系统需要进行重大改进以满足评估要求。';
    }

    // 添加各维度得分摘要
    summary += ' 各维度得分：';
    const dimensionScores = Object.values(dimensions).map(dim => `${dim.dimension}: ${dim.score}分`).join('，');
    summary += dimensionScores + '。';

    // 构建报告 - 使用条件属性确保exactOptionalPropertyTypes兼容性
    const report: ComprehensiveReport = {
      id: this.generateReportId(),
      title: options.title || '系统综合评估报告',
      timestamp: new Date(),
      overallScore,
      status,
      dimensions,
      summary,
      keyFindings,
      recommendations,
      generatedBy: options.generatedBy || '系统自动生成'
    };

    // 只在有值时添加可选属性
    if (options.performanceAnalysis) {
      report.performanceAnalysis = options.performanceAnalysis;
    }
    if (options.businessValueAnalysis) {
      report.businessValueAnalysis = options.businessValueAnalysis;
    }

    return report;
  }

  /**
   * 导出报告为HTML格式
   */
  public exportToHTML(report: ComprehensiveReport): string {
    const dimensionLabels: Record<AssessmentDimension, string> = {
      technical: '技术性能',
      functional: '功能质量',
      userExperience: '用户体验',
      businessValue: '业务价值',
      collaboration: '协同效能'
    };

    const statusStyles: Record<ComprehensiveReport['status'], string> = {
      pass: 'text-green-600',
      warn: 'text-amber-600',
      fail: 'text-red-600'
    };

    const statusTexts: Record<ComprehensiveReport['status'], string> = {
      pass: '通过',
      warn: '警告',
      fail: '未通过'
    };

    const scoreColor = (score: number): string => {
      if (score >= 80) return 'text-green-600';
      if (score >= 60) return 'text-amber-600';
      return 'text-red-600';
    };

    return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${report.title}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f8f9fa;
    }
    .header {
      background-color: #fff;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      margin-bottom: 20px;
    }
    .title {
      font-size: 24px;
      font-weight: 700;
      color: #2c3e50;
      margin-bottom: 10px;
    }
    .subtitle {
      font-size: 16px;
      color: #7f8c8d;
      margin-bottom: 15px;
    }
    .score-card {
      background-color: #fff;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      margin-bottom: 20px;
      text-align: center;
    }
    .score {
      font-size: 48px;
      font-weight: 700;
      margin-bottom: 10px;
    }
    .status {
      font-size: 20px;
      font-weight: 600;
      margin-bottom: 10px;
    }
    .summary {
      background-color: #fff;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      margin-bottom: 20px;
    }
    .section-title {
      font-size: 20px;
      font-weight: 600;
      color: #34495e;
      margin-bottom: 15px;
      border-bottom: 2px solid #e7e7e7;
      padding-bottom: 5px;
    }
    .findings, .recommendations {
      background-color: #fff;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      margin-bottom: 20px;
    }
    .dimension-section {
      background-color: #fff;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      margin-bottom: 20px;
    }
    .dimension-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
    }
    .dimension-name {
      font-size: 18px;
      font-weight: 600;
      color: #2c3e50;
    }
    .dimension-score {
      font-size: 24px;
      font-weight: 700;
    }
    .metrics-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 15px;
    }
    .metrics-table th, .metrics-table td {
      padding: 10px;
      text-align: left;
      border-bottom: 1px solid #e7e7e7;
    }
    .metrics-table th {
      background-color: #f8f9fa;
      font-weight: 600;
    }
    .metrics-table tr:hover {
      background-color: #f8f9fa;
    }
    .metric-status {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
    }
    .metric-pass {
      background-color: #d4edda;
      color: #155724;
    }
    .metric-fail {
      background-color: #f8d7da;
      color: #721c24;
    }
    .progress-bar {
      width: 100%;
      height: 20px;
      background-color: #e9ecef;
      border-radius: 4px;
      overflow: hidden;
      margin-top: 10px;
    }
    .progress-fill {
      height: 100%;
      border-radius: 4px;
      transition: width 0.3s ease;
    }
    .list-item {
      margin-bottom: 8px;
      position: relative;
      padding-left: 20px;
    }
    .list-item::before {
      content: '•';
      position: absolute;
      left: 0;
      color: #3498db;
      font-weight: bold;
    }
    .footer {
      text-align: center;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e7e7e7;
      color: #7f8c8d;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="title">${report.title}</div>
    <div class="subtitle">生成时间: ${report.timestamp.toLocaleString('zh-CN')} | 生成者: ${report.generatedBy}</div>
  </div>

  <div class="score-card">
    <div class="score ${scoreColor(report.overallScore)}">${report.overallScore}</div>
    <div class="status ${statusStyles[report.status]}">${statusTexts[report.status]}</div>
    <div>系统综合评估得分</div>
  </div>

  <div class="summary">
    <div class="section-title">评估摘要</div>
    <p>${report.summary}</p>
    
    <div style="margin-top: 15px;">
      <div style="margin-bottom: 10px; font-weight: 600;">各维度得分：</div>
      ${Object.entries(report.dimensions).map(([key, dimension]) => `
        <div style="margin-bottom: 8px;">
          <div style="display: flex; justify-content: space-between;">
            <span>${dimensionLabels[key as AssessmentDimension]}</span>
            <span class="${scoreColor(dimension.score)}" style="font-weight: 600;">${dimension.score}分</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${dimension.score}%; background-color: ${dimension.score >= 80 ? '#28a745' : dimension.score >= 60 ? '#ffc107' : '#dc3545'};"></div>
          </div>
        </div>
      `).join('')}
    </div>
  </div>

  <div class="findings">
    <div class="section-title">关键发现</div>
    ${report.keyFindings.length > 0 ? report.keyFindings.map(finding => `<div class="list-item">${finding}</div>`).join('') : '<p>未发现明显问题</p>'}
  </div>

  <div class="recommendations">
    <div class="section-title">改进建议</div>
    ${report.recommendations.length > 0 ? report.recommendations.map(recommendation => `<div class="list-item">${recommendation}</div>`).join('') : '<p>系统表现良好，无需特别改进</p>'}
  </div>

  ${Object.entries(report.dimensions).map(([key, dimension]) => `
    <div class="dimension-section">
      <div class="dimension-header">
        <div class="dimension-name">${dimensionLabels[key as AssessmentDimension]}</div>
        <div class="dimension-score ${scoreColor(dimension.score)}">${dimension.score}分</div>
      </div>
      <div>${dimension.description}</div>
      
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${dimension.score}%; background-color: ${dimension.score >= 80 ? '#28a745' : dimension.score >= 60 ? '#ffc107' : '#dc3545'};"></div>
      </div>

      <table class="metrics-table">
        <thead>
          <tr>
            <th>指标名称</th>
            <th>当前值</th>
            <th>目标值</th>
            <th>得分</th>
            <th>状态</th>
          </tr>
        </thead>
        <tbody>
          ${dimension.metrics.map(metric => `
            <tr>
              <td>${metric.name}</td>
              <td>${metric.value}</td>
              <td>${metric.targetValue}</td>
              <td class="${scoreColor(metric.score)}" style="font-weight: 600;">${metric.score}</td>
              <td>
                <span class="metric-status ${metric.passed ? 'metric-pass' : 'metric-fail'}">
                  ${metric.passed ? '通过' : '未通过'}
                </span>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `).join('')}

  <div class="footer">
    <div>报告ID: ${report.id}</div>
    <div>© ${new Date().getFullYear()} 行业矩阵功能评估系统</div>
  </div>
</body>
</html>
    `;
  }

  /**
   * 导出报告为JSON格式
   */
  public exportToJSON(report: ComprehensiveReport): string {
    return JSON.stringify(report, (_key, value) => {
      if (value instanceof Date) {
        return value.toISOString();
      }
      return value;
    }, 2);
  }
}

/**
 * 导出ComprehensiveReportGenerator类
 */
export default ComprehensiveReportGenerator;
