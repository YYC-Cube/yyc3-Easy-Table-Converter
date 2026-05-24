/**
 * @file 性能分析器
 * @description 提供系统性能分析、瓶颈检测和优化建议功能
 * @module performance
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-20
 */

import { PerformanceMonitor, PerformanceMetrics } from './PerformanceMonitor';

/**
 * 性能分析结果接口
 */
export interface PerformanceAnalysisResult {
  /** 分析名称 */
  name: string;
  /** 分析时间 */
  timestamp: Date;
  /** 性能指标 */
  metrics: PerformanceMetrics;
  /** 性能问题列表 */
  issues: PerformanceIssue[];
  /** 优化建议 */
  recommendations: OptimizationRecommendation[];
  /** 性能评分 (0-100) */
  performanceScore: number;
  /** 分析摘要 */
  summary: string;
}

/**
 * 性能问题接口
 */
export interface PerformanceIssue {
  /** 问题ID */
  id: string;
  /** 问题类型 */
  type: PerformanceIssueType;
  /** 严重程度 */
  severity: 'critical' | 'high' | 'medium' | 'low';
  /** 问题描述 */
  description: string;
  /** 影响范围 */
  affectedComponents: string[];
  /** 建议修复方案 */
  suggestedFix: string;
  /** 问题详情 */
  details?: Record<string, any>;
}

/**
 * 性能问题类型枚举
 */
export type PerformanceIssueType = 
  | 'slowResponse'       // 响应缓慢
  | 'highMemoryUsage'    // 内存使用过高
  | 'highCpuUsage'       // CPU使用率过高
  | 'excessiveDomOps'    // DOM操作过多
  | 'renderingLag'       // 渲染延迟
  | 'memoryLeak'         // 内存泄漏
  | 'networkBottleneck'  // 网络瓶颈
  | 'excessiveRequests'  // 请求过多
  | 'largePayload'       // 有效载荷过大
  | 'uncachedResources'; // 未缓存资源

/**
 * 优化建议接口
 */
export interface OptimizationRecommendation {
  /** 建议ID */
  id: string;
  /** 优化类型 */
  type: OptimizationType;
  /** 优先级 */
  priority: 'high' | 'medium' | 'low';
  /** 建议描述 */
  description: string;
  /** 预期收益 */
  expectedBenefit: string;
  /** 实现难度 */
  implementationComplexity: 'easy' | 'medium' | 'complex';
  /** 具体优化步骤 */
  steps?: string[];
}

/**
 * 优化类型枚举
 */
export type OptimizationType = 
  | 'codeSplitting'      // 代码分割
  | 'lazyLoading'        // 懒加载
  | 'caching'            // 缓存
  | 'memoization'        // 记忆化
  | 'bundling'           // 打包优化
  | 'imageOptimization'  // 图片优化
  | 'reducingRequests'   // 减少请求
  | 'optimizingAssets'   // 资源优化
  | 'componentOptimization' // 组件优化
  | 'stateManagement';   // 状态管理优化

/**
 * 代码执行路径分析接口
 */
export interface CodePathAnalysis {
  /** 函数名 */
  functionName: string;
  /** 文件路径 */
  filePath: string;
  /** 执行时间 (ms) */
  executionTime: number;
  /** 调用次数 */
  callCount: number;
  /** 平均执行时间 (ms) */
  averageTime: number;
  /** 最大执行时间 (ms) */
  maxTime: number;
  /** 调用栈 */
  callStack?: string[];
}

/**
 * 性能分析器类
 * 提供系统性能分析、瓶颈检测和优化建议功能
 */
export class PerformanceAnalyzer {
  private performanceMonitor: PerformanceMonitor;
  private static instance: PerformanceAnalyzer;
  
  /**
   * 私有构造函数
   */
  private constructor() {
    this.performanceMonitor = new PerformanceMonitor();
  }
  
  /**
   * 获取单例实例
   */
  public static getInstance(): PerformanceAnalyzer {
    if (!PerformanceAnalyzer.instance) {
      PerformanceAnalyzer.instance = new PerformanceAnalyzer();
    }
    return PerformanceAnalyzer.instance;
  }
  
  /**
   * 运行性能分析
   * @param analysisName 分析名称
   * @param duration 分析持续时间（毫秒）
   * @returns 性能分析结果
   */
  public async runPerformanceAnalysis(analysisName: string, duration: number = 10000): Promise<PerformanceAnalysisResult> {
    console.log(`开始性能分析: ${analysisName} (持续${duration}ms)`);
    
    // 性能监控已在构造函数中自动启动
    
    // 等待指定的分析持续时间
    await new Promise(resolve => setTimeout(resolve, duration));
    
    // 获取当前性能指标
    const metrics = this.performanceMonitor.getCurrentMetrics();
    
    // 停止性能监控
    this.performanceMonitor.stop();
    
    // 分析性能指标，检测问题
    const issues = this.detectPerformanceIssues(metrics);
    
    // 生成优化建议
    const recommendations = this.generateOptimizationRecommendations(issues);
    
    // 计算性能评分
    const performanceScore = this.calculatePerformanceScore(metrics, issues);
    
    // 生成分析摘要
    const summary = this.generateSummary(metrics, issues, performanceScore);
    
    // 生成分析结果
    const result: PerformanceAnalysisResult = {
      name: analysisName,
      timestamp: new Date(),
      metrics,
      issues,
      recommendations,
      performanceScore,
      summary
    };
    
    console.log(`性能分析完成: ${analysisName}, 评分: ${performanceScore}`);
    console.log(`发现 ${issues.length} 个性能问题，提供 ${recommendations.length} 条优化建议`);
    
    return result;
  }
  
  /**
   * 检测性能问题
   * @param metrics 性能指标
   * @returns 性能问题列表
   */
  private detectPerformanceIssues(metrics: PerformanceMetrics): PerformanceIssue[] {
    const issues: PerformanceIssue[] = [];
    
    // 检查响应时间
    if (metrics.averageResponseTime > 1000) {
      issues.push({
        id: `issue-${Date.now()}-1`,
        type: 'slowResponse',
        severity: metrics.averageResponseTime > 3000 ? 'critical' : 'high',
        description: `平均响应时间过高 (${metrics.averageResponseTime.toFixed(2)}ms)`,
        affectedComponents: ['API', 'Data Processing'],
        suggestedFix: '优化数据处理逻辑，考虑异步处理或缓存常用结果',
        details: {
          actualResponseTime: metrics.averageResponseTime,
          threshold: 1000,
          maximumResponseTime: metrics.p95ResponseTime
        }
      });
    } else if (metrics.averageResponseTime > 500) {
      issues.push({
        id: `issue-${Date.now()}-2`,
        type: 'slowResponse',
        severity: 'medium',
        description: `响应时间偏高 (${metrics.averageResponseTime.toFixed(2)}ms)`,
        affectedComponents: ['API', 'Data Processing'],
        suggestedFix: '优化数据查询和处理逻辑',
        details: {
          actualResponseTime: metrics.averageResponseTime,
          threshold: 500
        }
      });
    }
    
    // 检查错误率
    if (metrics.errorRate > 0.05) {
      issues.push({
        id: `issue-${Date.now()}-3`,
        type: 'slowResponse', // 使用slowResponse作为通用错误类型
        severity: metrics.errorRate > 0.1 ? 'high' : 'medium',
        description: `错误率过高 (${(metrics.errorRate * 100).toFixed(2)}%)`,
        affectedComponents: ['API', 'Data Processing'],
        suggestedFix: '加强错误处理和边界条件检查',
        details: {
          actualErrorRate: metrics.errorRate,
          threshold: 0.05,
          errorCount: Math.round(metrics.errorRate * metrics.sampleCount)
        }
      });
    }
    
    // 检查内存使用
    if (typeof window !== 'undefined' && 'performance' in window && 'memory' in performance) {
      const memoryInfo = (performance as any).memory;
      const memoryUsageMB = memoryInfo.usedJSHeapSize / (1024 * 1024);
      
      if (memoryUsageMB > 1000) {
        issues.push({
          id: `issue-${Date.now()}-4`,
          type: 'highMemoryUsage',
          severity: 'high',
          description: `内存使用过高 (${memoryUsageMB.toFixed(2)}MB)`,
          affectedComponents: ['Frontend'],
          suggestedFix: '检查是否存在内存泄漏，优化大型数据结构的使用',
          details: {
            memoryUsageMB,
            threshold: 1000,
            totalJSHeapSize: memoryInfo.totalJSHeapSize / (1024 * 1024)
          }
        });
      }
    }
    
    // DOM操作次数检查已移除，因为该指标在当前版本中不可用
    
    // 渲染时间检查已移除，因为该指标在当前版本中不可用
    
    return issues;
  }
  
  /**
   * 生成优化建议
   * @param issues 性能问题列表
   * @param metrics 性能指标
   * @returns 优化建议列表
   */
  private generateOptimizationRecommendations(issues: PerformanceIssue[]): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];
    const existingRecommendations = new Set<string>();
    
    // 根据性能问题生成建议
    issues.forEach(issue => {
      switch (issue.type) {
        case 'slowResponse':
          if (!existingRecommendations.has('caching')) {
            recommendations.push({
              id: 'rec-cache',
              type: 'caching',
              priority: 'high',
              description: '实现数据缓存机制',
              expectedBenefit: '减少重复计算，提高响应速度30-50%',
              implementationComplexity: 'medium',
              steps: [
                '识别频繁访问的数据',
                '使用本地缓存存储计算结果',
                '实现缓存失效策略',
                '添加缓存命中率监控'
              ]
            });
            existingRecommendations.add('caching');
          }
          
          if (!existingRecommendations.has('reducingRequests')) {
            recommendations.push({
              id: 'rec-batch-requests',
              type: 'reducingRequests',
              priority: 'medium',
              description: '批量处理API请求',
              expectedBenefit: '减少网络往返次数，提高吞吐量',
              implementationComplexity: 'medium'
            });
            existingRecommendations.add('reducingRequests');
          }
          break;
          
        case 'excessiveDomOps':
          if (!existingRecommendations.has('componentOptimization')) {
            recommendations.push({
              id: 'rec-component-opt',
              type: 'componentOptimization',
              priority: 'high',
              description: '优化组件渲染逻辑',
              expectedBenefit: '减少DOM操作，提高页面流畅度',
              implementationComplexity: 'medium',
              steps: [
                '使用React.memo避免不必要的重渲染',
                '使用useMemo缓存计算结果',
                '使用useCallback避免重新创建函数',
                '减少直接DOM操作'
              ]
            });
            existingRecommendations.add('componentOptimization');
          }
          break;
          
        case 'renderingLag':
          if (!existingRecommendations.has('lazyLoading')) {
            recommendations.push({
              id: 'rec-lazy-loading',
              type: 'lazyLoading',
              priority: 'high',
              description: '实现组件懒加载',
              expectedBenefit: '减少初始加载时间，提高页面响应速度',
              implementationComplexity: 'easy',
              steps: [
                '使用React.lazy加载非关键组件',
                '实现代码分割',
                '添加加载状态提示'
              ]
            });
            existingRecommendations.add('lazyLoading');
          }
          
          if (!existingRecommendations.has('memoization')) {
            recommendations.push({
              id: 'rec-memoization',
              type: 'memoization',
              priority: 'medium',
              description: '缓存图表计算结果',
              expectedBenefit: '减少重复计算，提高图表渲染性能',
              implementationComplexity: 'medium'
            });
            existingRecommendations.add('memoization');
          }
          break;
      }
    });
    
    // 添加通用优化建议
    if (!existingRecommendations.has('codeSplitting')) {
      recommendations.push({
        id: 'rec-code-splitting',
        type: 'codeSplitting',
        priority: 'medium',
        description: '实现代码分割',
        expectedBenefit: '减小初始加载体积，提高首屏加载速度',
        implementationComplexity: 'medium'
      });
      existingRecommendations.add('codeSplitting');
    }
    
    // 根据性能指标添加特定建议
    
    return recommendations;
  }
  
  /**
   * 计算性能评分
   * @param metrics 性能指标
   * @param issues 性能问题列表
   * @returns 性能评分 (0-100)
   */
  private calculatePerformanceScore(metrics: PerformanceMetrics, issues: PerformanceIssue[]): number {
    let score = 100;
    
    // 基于响应时间评分 (满分30)
    let responseTimeScore = 30;
    if (metrics.averageResponseTime > 3000) {
      responseTimeScore = 0;
    } else if (metrics.averageResponseTime > 1000) {
      responseTimeScore = Math.max(0, 30 - ((metrics.averageResponseTime - 1000) / 2000) * 30);
    } else if (metrics.averageResponseTime > 500) {
      responseTimeScore = Math.max(20, 30 - ((metrics.averageResponseTime - 500) / 500) * 10);
    }
    score -= (30 - responseTimeScore);
    
    // 渲染时间评分已移除，因为该指标在当前版本中不可用
    const renderTimeScore = 25; // 默认满分
    score -= (25 - renderTimeScore);
    
    // 基于错误率评分 (满分20)
    let errorRateScore = 20;
    if (metrics.errorRate > 0.1) {
      errorRateScore = 0;
    } else if (metrics.errorRate > 0) {
      errorRateScore = Math.max(0, 20 - (metrics.errorRate / 0.1) * 20);
    }
    score -= (20 - errorRateScore);
    
    // 吞吐量评分已移除，因为该指标在当前版本中不可用
    const throughputScore = 15; // 默认满分
    score -= (15 - throughputScore);
    
    // 基于资源使用评分 (满分10)
    const resourceScore = 10;
    // 这里简化处理，实际应该检查内存和CPU使用
    score -= (10 - resourceScore);
    
    // 基于问题严重程度扣分
    issues.forEach(issue => {
      switch (issue.severity) {
        case 'critical':
          score -= 15;
          break;
        case 'high':
          score -= 10;
          break;
        case 'medium':
          score -= 5;
          break;
        case 'low':
          score -= 2;
          break;
      }
    });
    
    // 确保分数在0-100范围内
    return Math.max(0, Math.min(100, Math.round(score)));
  }
  
  /**
   * 生成分析摘要
   * @param metrics 性能指标
   * @param issues 性能问题列表
   * @param score 性能评分
   * @returns 分析摘要
   */
  private generateSummary(metrics: PerformanceMetrics, issues: PerformanceIssue[], score: number): string {
    const criticalIssues = issues.filter(i => i.severity === 'critical');
    const highIssues = issues.filter(i => i.severity === 'high');
    
    let summary = `性能分析完成，总体评分: ${score}/100。`;
    
    if (score >= 90) {
      summary += ' 系统性能优异，只有少量优化空间。';
    } else if (score >= 70) {
      summary += ' 系统性能良好，但仍有优化空间。';
    } else if (score >= 50) {
      summary += ' 系统性能一般，建议进行优化。';
    } else {
      summary += ' 系统性能较差，需要紧急优化。';
    }
    
    if (criticalIssues.length > 0) {
      summary += ` 发现 ${criticalIssues.length} 个严重问题，需要立即解决。`;
    }
    
    if (highIssues.length > 0) {
      summary += ` 发现 ${highIssues.length} 个高优先级问题，建议优先修复。`;
    }
    
    summary += ` 平均响应时间: ${metrics.averageResponseTime.toFixed(2)}ms，`;
    summary += `错误率: ${(metrics.errorRate * 100).toFixed(2)}%。`;
    
    return summary;
  }
  
  /**
   * 分析代码执行路径
   * @param executionTrace 执行跟踪数据
   * @returns 代码路径分析结果
   */
  public analyzeCodePath(executionTrace: Array<{functionName: string, filePath: string, executionTime: number}>): CodePathAnalysis[] {
    // 按函数名分组并计算统计信息
    const groupedTraces = new Map<string, typeof executionTrace>();
    
    executionTrace.forEach(trace => {
      const key = `${trace.filePath}:${trace.functionName}`;
      if (!groupedTraces.has(key)) {
        groupedTraces.set(key, []);
      }
      groupedTraces.get(key)!.push(trace);
    });
    
    // 生成分析结果
    const results: CodePathAnalysis[] = [];
    
    groupedTraces.forEach((traces, key) => {
      const [filePath, functionName] = key.split(':');
      const executionTimes = traces.map(t => t.executionTime);
      const totalTime = executionTimes.reduce((sum, time) => sum + time, 0);
      const maxTime = Math.max(...executionTimes);
      
      results.push({
        functionName,
        filePath,
        executionTime: totalTime,
        callCount: traces.length,
        averageTime: totalTime / traces.length,
        maxTime
      });
    });
    
    // 按执行时间排序
    results.sort((a, b) => b.executionTime - a.executionTime);
    
    return results;
  }
  
  /**
   * 生成性能报告HTML
   * @param analysisResult 性能分析结果
   * @returns HTML报告字符串
   */
  public generateHtmlReport(analysisResult: PerformanceAnalysisResult): string {
    const scoreClass = 
      analysisResult.performanceScore >= 90 ? 'excellent' :
      analysisResult.performanceScore >= 70 ? 'good' :
      analysisResult.performanceScore >= 50 ? 'fair' : 'poor';
    
    return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>性能分析报告 - ${analysisResult.name}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background-color: #f8f9fa; color: #333; }
    .container { max-width: 1200px; margin: 0 auto; }
    .header { background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); margin-bottom: 30px; }
    .title { font-size: 28px; font-weight: 700; margin-bottom: 10px; }
    .subtitle { font-size: 16px; color: #666; margin-bottom: 20px; }
    .score-card { display: inline-block; background-color: #f8f9fa; padding: 20px; border-radius: 10px; text-align: center; min-width: 150px; margin-right: 30px; }
    .score { font-size: 48px; font-weight: 700; margin: 0; }
    .score-label { font-size: 16px; color: #666; margin: 0; }
    .score.excellent { color: #28a745; }
    .score.good { color: #17a2b8; }
    .score.fair { color: #ffc107; }
    .score.poor { color: #dc3545; }
    .summary { margin-top: 20px; font-size: 18px; line-height: 1.6; color: #444; }
    .section { background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.05); margin-bottom: 30px; }
    .section-title { font-size: 24px; font-weight: 600; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 2px solid #e9ecef; }
    .metrics-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px; }
    .metric-card { background-color: #f8f9fa; padding: 20px; border-radius: 8px; }
    .metric-value { font-size: 24px; font-weight: 700; margin-bottom: 5px; }
    .metric-label { font-size: 14px; color: #666; }
    .issue-card { border: 1px solid #e9ecef; border-radius: 8px; padding: 20px; margin-bottom: 15px; transition: transform 0.2s; }
    .issue-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
    .issue-critical { border-left: 4px solid #dc3545; }
    .issue-high { border-left: 4px solid #fd7e14; }
    .issue-medium { border-left: 4px solid #ffc107; }
    .issue-low { border-left: 4px solid #6c757d; }
    .issue-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
    .issue-title { font-size: 18px; font-weight: 600; margin: 0; }
    .issue-severity { font-size: 12px; padding: 3px 8px; border-radius: 12px; font-weight: 500; }
    .severity-critical { background-color: #dc3545; color: white; }
    .severity-high { background-color: #fd7e14; color: white; }
    .severity-medium { background-color: #ffc107; color: #212529; }
    .severity-low { background-color: #6c757d; color: white; }
    .issue-description { color: #495057; margin-bottom: 10px; }
    .issue-components { color: #6c757d; font-size: 14px; margin-bottom: 10px; }
    .issue-fix { background-color: #f8f9fa; padding: 10px; border-radius: 4px; font-size: 14px; }
    .recommendation-card { border: 1px solid #e9ecef; border-radius: 8px; padding: 20px; margin-bottom: 15px; }
    .recommendation-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
    .recommendation-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
    .recommendation-title { font-size: 18px; font-weight: 600; margin: 0; }
    .recommendation-priority { font-size: 12px; padding: 3px 8px; border-radius: 12px; font-weight: 500; }
    .priority-high { background-color: #17a2b8; color: white; }
    .priority-medium { background-color: #ffc107; color: #212529; }
    .priority-low { background-color: #6c757d; color: white; }
    .recommendation-description { color: #495057; margin-bottom: 10px; }
    .recommendation-benefit { background-color: #d4edda; color: #155724; padding: 8px; border-radius: 4px; font-size: 14px; margin-bottom: 10px; }
    .recommendation-steps { background-color: #f8f9fa; padding: 15px; border-radius: 4px; }
    .recommendation-steps h4 { margin-top: 0; margin-bottom: 10px; font-size: 16px; }
    .recommendation-steps ul { margin: 0; padding-left: 20px; }
    .footer { text-align: center; padding: 20px; color: #6c757d; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="title">性能分析报告</h1>
      <p class="subtitle">分析名称: ${analysisResult.name} | 生成时间: ${analysisResult.timestamp.toLocaleString('zh-CN')}</p>
      
      <div class="score-card">
        <p class="score ${scoreClass}">${analysisResult.performanceScore}</p>
        <p class="score-label">性能评分</p>
      </div>
      
      <p class="summary">${analysisResult.summary}</p>
    </div>
    
    <div class="section">
      <h2 class="section-title">性能指标</h2>
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-value">${analysisResult.metrics.averageResponseTime.toFixed(2)}ms</div>
          <div class="metric-label">平均响应时间</div>
        </div>
        <div class="metric-card">
          <div class="metric-value">${analysisResult.metrics.p95ResponseTime.toFixed(2)}ms</div>
          <div class="metric-label">最大响应时间</div>
        </div>
        <div class="metric-card">
          <div class="metric-value">${(analysisResult.metrics.errorRate * 100).toFixed(2)}%</div>
          <div class="metric-label">错误率</div>
        </div>
        <!-- 总操作次数指标已移除，因为该指标在当前版本中不可用 -->
        <!-- 平均渲染时间指标已移除，因为该指标在当前版本中不可用 -->
        <!-- DOM操作次数指标已移除，因为该指标在当前版本中不可用 -->
      </div>
    </div>
    
    <div class="section">
      <h2 class="section-title">性能问题 (${analysisResult.issues.length})</h2>
      ${analysisResult.issues.map(issue => `
      <div class="issue-card issue-${issue.severity}">
        <div class="issue-header">
          <h3 class="issue-title">${issue.description}</h3>
          <span class="issue-severity severity-${issue.severity}">${
            issue.severity === 'critical' ? '严重' :
            issue.severity === 'high' ? '高' :
            issue.severity === 'medium' ? '中' : '低'
          }</span>
        </div>
        <p class="issue-components">影响组件: ${issue.affectedComponents.join(', ')}</p>
        <p class="issue-description">${issue.suggestedFix}</p>
        ${issue.details ? `<div class="issue-fix">详细信息: ${JSON.stringify(issue.details)}</div>` : ''}
      </div>
      `).join('')}
    </div>
    
    <div class="section">
      <h2 class="section-title">优化建议 (${analysisResult.recommendations.length})</h2>
      ${analysisResult.recommendations.map(recommendation => `
      <div class="recommendation-card">
        <div class="recommendation-header">
          <h3 class="recommendation-title">${recommendation.description}</h3>
          <span class="recommendation-priority priority-${recommendation.priority}">${
            recommendation.priority === 'high' ? '高优先级' :
            recommendation.priority === 'medium' ? '中优先级' : '低优先级'
          }</span>
        </div>
        <div class="recommendation-benefit">预期收益: ${recommendation.expectedBenefit}</div>
        <p class="issue-description">实现难度: ${
          recommendation.implementationComplexity === 'easy' ? '简单' :
          recommendation.implementationComplexity === 'medium' ? '中等' : '复杂'
        }</p>
        ${recommendation.steps ? `
        <div class="recommendation-steps">
          <h4>优化步骤:</h4>
          <ul>
            ${recommendation.steps.map(step => `<li>${step}</li>`).join('')}
          </ul>
        </div>
        ` : ''}
      </div>
      `).join('')}
    </div>
    
    <div class="footer">
      <p>本报告由 YYC³ Easy Table Converter 性能分析器生成</p>
    </div>
  </div>
</body>
</html>`;
  }
}

// 导出默认实例
export const performanceAnalyzer = PerformanceAnalyzer.getInstance();
export default performanceAnalyzer;
