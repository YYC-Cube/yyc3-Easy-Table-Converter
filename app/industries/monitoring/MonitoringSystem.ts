/**
 * @file 监控系统核心模块
 * @description 实现实时监控系统性能和业务指标的核心功能
 * @module monitoring
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-20
 */

import { PerformanceMonitor } from '../performance/PerformanceMonitor';
// 已移除未使用的导入
import { DimensionResult, MetricResult } from '../assessment/ComprehensiveReportGenerator';

/**
 * 监控指标类型
 */
export type MonitorMetricType = 'performance' | 'business' | 'system' | 'user';

/**
 * 告警级别
 */
export enum AlertLevel {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

/**
 * 监控指标配置
 */
export interface MonitorMetricConfig {
  /** 指标ID */
  id: string;
  /** 指标名称 */
  name: string;
  /** 指标类型 */
  type: MonitorMetricType;
  /** 指标描述 */
  description?: string;
  /** 告警阈值 - 最小值 */
  minThreshold?: number;
  /** 告警阈值 - 最大值 */
  maxThreshold?: number;
  /** 告警级别 */
  alertLevel?: AlertLevel;
  /** 采样间隔（毫秒） */
  sampleInterval?: number;
  /** 是否启用 */
  enabled?: boolean;
  /** 权重 */
  weight?: number;
}

/**
 * 监控数据点
 */
export interface MonitoringDataPoint {
  /** 指标ID */
  metricId: string;
  /** 指标值 */
  value: number;
  /** 时间戳 */
  timestamp: Date;
  /** 是否超出阈值 */
  isThresholdExceeded?: boolean;
  /** 告警级别 */
  alertLevel?: AlertLevel | null;
}

/**
 * 监控告警
 */
export interface MonitoringAlert {
  /** 告警ID */
  id: string;
  /** 指标ID */
  metricId: string;
  /** 指标名称 */
  metricName: string;
  /** 告警级别 */
  level: AlertLevel;
  /** 告警消息 */
  message: string;
  /** 当前值 */
  currentValue: number;
  /** 阈值信息 */
  thresholdInfo: string;
  /** 告警时间 */
  timestamp: Date;
  /** 是否已解决 */
  resolved: boolean;
  /** 解决时间 */
  resolvedAt?: Date;
}

/**
 * 监控系统配置
 */
export interface MonitoringSystemConfig {
  /** 系统名称 */
  systemName: string;
  /** 采样间隔（毫秒） */
  defaultSampleInterval: number;
  /** 数据保留时间（毫秒） */
  dataRetentionTime: number;
  /** 是否启用实时告警 */
  enableRealTimeAlerts: boolean;
  /** 告警通知回调 */
  alertCallback?: (alert: MonitoringAlert) => void;
  /** 数据持久化回调 */
  persistenceCallback?: (dataPoint: MonitoringDataPoint) => Promise<void>;
}

/**
 * 监控仪表盘数据
 */
export interface DashboardData {
  /** 总体健康得分 */
  healthScore: number;
  /** 活跃告警数量 */
  activeAlerts: number;
  /** 性能指标概览 */
  performanceOverview: MetricOverview;
  /** 业务指标概览 */
  businessOverview: MetricOverview;
  /** 系统指标概览 */
  systemOverview: MetricOverview;
  /** 最近告警列表 */
  recentAlerts: MonitoringAlert[];
  /** 趋势数据 */
  trendData: MonitoringDataPoint[][];
}

/**
 * 指标概览
 */
export interface MetricOverview {
  /** 指标数量 */
  totalMetrics: number;
  /** 正常指标数量 */
  healthyMetrics: number;
  /** 异常指标数量 */
  unhealthyMetrics: number;
  /** 平均得分 */
  averageScore: number;
}

/**
 * 监控报告
 */
export interface MonitoringReport {
  /** 报告ID */
  id: string;
  /** 报告时间范围 */
  timeRange: { start: Date; end: Date };
  /** 总体健康得分 */
  healthScore: number;
  /** 告警统计 */
  alertStats: Record<AlertLevel, number>;
  /** 指标趋势分析 */
  trendAnalysis: MetricTrend[];
  /** 维度评估结果 */
  dimensionResults: DimensionResult[];
  /** 关键发现 */
  keyFindings: string[];
  /** 改进建议 */
  recommendations: string[];
}

/**
 * 指标趋势
 */
export interface MetricTrend {
  /** 指标ID */
  metricId: string;
  /** 指标名称 */
  metricName: string;
  /** 指标类型 */
  type: MonitorMetricType;
  /** 平均值 */
  averageValue: number;
  /** 最大值 */
  maxValue: number;
  /** 最小值 */
  minValue: number;
  /** 趋势方向 */
  trendDirection: 'up' | 'down' | 'stable';
  /** 趋势描述 */
  trendDescription: string;
}

/**
 * 监控系统类
 */
class MonitoringSystem {
  /** 系统配置 */
  private config: MonitoringSystemConfig;
  
  /** 性能监控器 */
  private performanceMonitor: PerformanceMonitor;
  
  // 报告生成器已移除，因为未使用
  
  /** 监控指标配置列表 */
  private metricsConfigs: Map<string, MonitorMetricConfig> = new Map();
  
  /** 监控数据存储 */
  private monitoringData: Map<string, MonitoringDataPoint[]> = new Map();
  
  /** 告警存储 */
  private alerts: MonitoringAlert[] = [];
  
  /** 定时任务引用 */
  private samplingIntervals: Map<string, NodeJS.Timeout> = new Map();
  
  /** 系统状态 */
  private isRunning: boolean = false;

  /**
   * 构造函数
   */
  constructor(config: MonitoringSystemConfig) {
    this.config = config;
    this.performanceMonitor = new PerformanceMonitor();
    
    // 初始化默认指标
    this.initializeDefaultMetrics();
  }

  /**
   * 初始化默认监控指标
   */
  private initializeDefaultMetrics(): void {
    // 性能指标
    this.addMetric({
      id: 'response_time',
      name: '平均响应时间',
      type: 'performance',
      description: '系统处理请求的平均响应时间',
      maxThreshold: 500, // 毫秒
      alertLevel: AlertLevel.WARNING,
      sampleInterval: 10000,
      enabled: true,
      weight: 0.25
    });

    this.addMetric({
      id: 'error_rate',
      name: '错误率',
      type: 'performance',
      description: '系统运行过程中的错误率',
      maxThreshold: 0.01, // 1%
      alertLevel: AlertLevel.ERROR,
      sampleInterval: 5000,
      enabled: true,
      weight: 0.20
    });

    this.addMetric({
      id: 'throughput',
      name: '吞吐量',
      type: 'performance',
      description: '系统单位时间内处理的请求数',
      minThreshold: 10, // 每秒10个请求
      alertLevel: AlertLevel.WARNING,
      sampleInterval: 10000,
      enabled: true,
      weight: 0.15
    });

    // 业务指标
    this.addMetric({
      id: 'task_completion_rate',
      name: '任务完成率',
      type: 'business',
      description: '用户任务完成的百分比',
      minThreshold: 90, // 90%
      alertLevel: AlertLevel.WARNING,
      sampleInterval: 30000,
      enabled: true,
      weight: 0.20
    });

    this.addMetric({
      id: 'data_accuracy',
      name: '数据准确性',
      type: 'business',
      description: '数据处理的准确程度',
      minThreshold: 95, // 95%
      alertLevel: AlertLevel.ERROR,
      sampleInterval: 60000,
      enabled: true,
      weight: 0.25
    });

    // 系统指标
    this.addMetric({
      id: 'memory_usage',
      name: '内存使用率',
      type: 'system',
      description: '系统内存使用百分比',
      maxThreshold: 85, // 85%
      alertLevel: AlertLevel.WARNING,
      sampleInterval: 5000,
      enabled: true,
      weight: 0.15
    });

    this.addMetric({
      id: 'cpu_usage',
      name: 'CPU使用率',
      type: 'system',
      description: '系统CPU使用百分比',
      maxThreshold: 90, // 90%
      alertLevel: AlertLevel.WARNING,
      sampleInterval: 5000,
      enabled: true,
      weight: 0.15
    });

    // 用户指标
    this.addMetric({
      id: 'active_users',
      name: '活跃用户数',
      type: 'user',
      description: '当前活跃用户数量',
      minThreshold: 1, // 至少1个用户
      alertLevel: AlertLevel.INFO,
      sampleInterval: 60000,
      enabled: true,
      weight: 0.10
    });

    this.addMetric({
      id: 'user_satisfaction',
      name: '用户满意度',
      type: 'user',
      description: '用户满意度评分',
      minThreshold: 7.5, // 满分10分
      alertLevel: AlertLevel.WARNING,
      sampleInterval: 300000, // 5分钟
      enabled: true,
      weight: 0.20
    });
  }

  /**
   * 添加监控指标
   */
  public addMetric(config: MonitorMetricConfig): void {
    const metricConfig: MonitorMetricConfig = {
      sampleInterval: this.config.defaultSampleInterval,
      enabled: true,
      weight: 0.1,
      alertLevel: AlertLevel.WARNING,
      ...config
    };
    
    this.metricsConfigs.set(metricConfig.id, metricConfig);
    this.monitoringData.set(metricConfig.id, []);
    
    // 如果监控系统正在运行，启动该指标的监控
    if (this.isRunning && metricConfig.enabled) {
      this.startMetricMonitoring(metricConfig);
    }
  }

  /**
   * 更新监控指标配置
   */
  public updateMetric(config: Partial<MonitorMetricConfig> & { id: string }): void {
    const existingConfig = this.metricsConfigs.get(config.id);
    if (!existingConfig) {
      throw new Error(`Metric with id '${config.id}' not found`);
    }
    
    const newConfig = { ...existingConfig, ...config };
    this.metricsConfigs.set(config.id, newConfig);
    
    // 重新配置监控
    this.restartMetricMonitoring(config.id);
  }

  /**
   * 删除监控指标
   */
  public removeMetric(metricId: string): void {
    this.stopMetricMonitoring(metricId);
    this.metricsConfigs.delete(metricId);
    this.monitoringData.delete(metricId);
  }

  /**
   * 启动监控系统
   */
  public start(): void {
    if (this.isRunning) {
      console.warn('Monitoring system is already running');
      return;
    }
    
    console.log('Starting monitoring system...');
    
    // 启动所有启用的指标监控
    this.metricsConfigs.forEach((config) => {
      if (config.enabled) {
        this.startMetricMonitoring(config);
      }
    });
    
    // 性能监控器已在构造函数中自动启动
    
    this.isRunning = true;
    console.log('Monitoring system started successfully');
  }

  /**
   * 停止监控系统
   */
  public stop(): void {
    if (!this.isRunning) {
      console.warn('Monitoring system is not running');
      return;
    }
    
    console.log('Stopping monitoring system...');
    
    // 停止所有指标监控
    this.stopAllMetricMonitoring();
    
    // 停止性能监控器
    this.performanceMonitor.stop();
    
    this.isRunning = false;
    console.log('Monitoring system stopped successfully');
  }

  /**
   * 重启监控系统
   */
  public restart(): void {
    this.stop();
    this.start();
  }

  /**
   * 启动单个指标的监控
   */
  private startMetricMonitoring(config: MonitorMetricConfig): void {
    // 停止已有的监控（如果存在）
    this.stopMetricMonitoring(config.id);
    
    // 创建新的监控任务
    const intervalId = setInterval(async () => {
      try {
        await this.collectMetricData(config);
      } catch (error) {
        console.error(`Error collecting metric data for ${config.id}:`, error);
      }
    }, config.sampleInterval || this.config.defaultSampleInterval);
    
    this.samplingIntervals.set(config.id, intervalId);
    console.log(`Started monitoring for metric: ${config.name} (${config.id})`);
  }

  /**
   * 停止单个指标的监控
   */
  private stopMetricMonitoring(metricId: string): void {
    const intervalId = this.samplingIntervals.get(metricId);
    if (intervalId) {
      clearInterval(intervalId);
      this.samplingIntervals.delete(metricId);
      console.log(`Stopped monitoring for metric: ${metricId}`);
    }
  }

  /**
   * 停止所有指标的监控
   */
  private stopAllMetricMonitoring(): void {
    this.samplingIntervals.forEach((intervalId, _) => {
      clearInterval(intervalId);
    });
    this.samplingIntervals.clear();
  }

  /**
   * 重启单个指标的监控
   */
  private restartMetricMonitoring(metricId: string): void {
    const config = this.metricsConfigs.get(metricId);
    if (config) {
      this.stopMetricMonitoring(metricId);
      if (config.enabled && this.isRunning) {
        this.startMetricMonitoring(config);
      }
    }
  }

  /**
   * 收集指标数据
   */
  private async collectMetricData(config: MonitorMetricConfig): Promise<void> {
    let value: number = 0;
    const metrics = this.performanceMonitor.getCurrentMetrics();
    
    // 根据指标类型收集数据
    switch (config.id) {
      case 'response_time':
        value = metrics.averageResponseTime;
        break;
      case 'error_rate':
        value = metrics.errorRate;
        break;
      case 'request_count':
        value = metrics.sampleCount;
        break;
      case 'throughput':
        // 模拟吞吐量数据
        value = Math.floor(Math.random() * 50) + 10;
        break;
      case 'cpu_usage':
        // 模拟CPU使用率
        value = Math.random() * 100;
        break;
      case 'memory_usage':
        // 从性能监控器获取内存使用率或使用模拟数据
        value = metrics.memoryUsage || Math.random() * 100;
        break;
      case 'active_users':
        // 模拟活跃用户数
        value = Math.floor(Math.random() * 10) + 1;
        break;
      case 'user_satisfaction':
        // 模拟用户满意度
        value = Math.random() * 2 + 6; // 6-8分
        break;
      case 'task_completion_rate':
        // 模拟任务完成率
        value = Math.random() * 20 + 80; // 80-100%
        break;
      case 'data_accuracy':
        // 模拟数据准确性
        value = Math.random() * 5 + 95; // 95-100%
        break;
      default:
        // 默认生成随机数据
        value = Math.random() * 100;
    }
    
    // 检查是否超出阈值
    const isExceeded = this.checkThresholdExceeded(value, config);
    const alertLevel = isExceeded ? config.alertLevel || AlertLevel.WARNING : null;
    
    // 创建数据点
    const dataPoint: MonitoringDataPoint = {
      metricId: config.id,
      value,
      timestamp: new Date(),
      isThresholdExceeded: isExceeded,
      alertLevel
    };
    
    // 存储数据
    this.storeDataPoint(dataPoint);
    
    // 如果超出阈值且启用告警，创建告警
    if (isExceeded && this.config.enableRealTimeAlerts) {
      this.createAlert(config, value);
    }
    
    // 数据持久化（如果配置了回调）
    if (this.config.persistenceCallback) {
      try {
        await this.config.persistenceCallback(dataPoint);
      } catch (error) {
        console.error('Error in persistence callback:', error);
      }
    }
  }

  /**
   * 检查是否超出阈值
   */
  private checkThresholdExceeded(value: number, config: MonitorMetricConfig): boolean {
    if (config.minThreshold !== undefined && value < config.minThreshold) {
      return true;
    }
    if (config.maxThreshold !== undefined && value > config.maxThreshold) {
      return true;
    }
    return false;
  }

  /**
   * 存储数据点
   */
  private storeDataPoint(dataPoint: MonitoringDataPoint): void {
    const dataPoints = this.monitoringData.get(dataPoint.metricId) || [];
    dataPoints.push(dataPoint);
    
    // 清理过期数据
    this.cleanupOldData(dataPoint.metricId);
    
    // 更新存储
    this.monitoringData.set(dataPoint.metricId, dataPoints);
  }

  /**
   * 清理过期数据
   */
  private cleanupOldData(metricId: string): void {
    const dataPoints = this.monitoringData.get(metricId) || [];
    const cutoffTime = new Date();
    cutoffTime.setTime(cutoffTime.getTime() - this.config.dataRetentionTime);
    
    // 过滤掉过期的数据点
    const filteredData = dataPoints.filter(point => point.timestamp >= cutoffTime);
    
    // 更新存储
    this.monitoringData.set(metricId, filteredData);
  }

  /**
   * 创建告警
   */
  private createAlert(config: MonitorMetricConfig, currentValue: number): void {
    // 构建阈值信息
    let thresholdInfo = '';
    if (config.minThreshold !== undefined && currentValue < config.minThreshold) {
      thresholdInfo = `最小值应为 ${config.minThreshold}`;
    } else if (config.maxThreshold !== undefined && currentValue > config.maxThreshold) {
      thresholdInfo = `最大值应为 ${config.maxThreshold}`;
    }
    
    // 创建告警
    const alert: MonitoringAlert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      metricId: config.id,
      metricName: config.name,
      level: config.alertLevel || AlertLevel.WARNING,
      message: `${config.name} 超出告警阈值`,
      currentValue,
      thresholdInfo,
      timestamp: new Date(),
      resolved: false
    };
    
    // 存储告警
    this.alerts.push(alert);
    
    // 触发告警回调
    if (this.config.alertCallback) {
      try {
        this.config.alertCallback(alert);
      } catch (error) {
        console.error('Error in alert callback:', error);
      }
    }
    
    console.log(`ALERT [${alert.level}]: ${alert.message} (Current: ${alert.currentValue}, Threshold: ${alert.thresholdInfo})`);
  }

  /**
   * 获取监控数据
   */
  public getMonitoringData(metricId: string, limit?: number): MonitoringDataPoint[] {
    const dataPoints = this.monitoringData.get(metricId) || [];
    
    if (limit && dataPoints.length > limit) {
      return dataPoints.slice(-limit);
    }
    
    return dataPoints;
  }

  /**
   * 获取所有告警
   */
  public getAlerts(onlyActive: boolean = true): MonitoringAlert[] {
    if (onlyActive) {
      return this.alerts.filter(alert => !alert.resolved);
    }
    
    return [...this.alerts];
  }

  /**
   * 解决告警
   */
  public resolveAlert(alertId: string): void {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert && !alert.resolved) {
      alert.resolved = true;
      alert.resolvedAt = new Date();
    }
  }

  /**
   * 获取仪表盘数据
   */
  public getDashboardData(): DashboardData {
    const performanceMetrics = Array.from(this.metricsConfigs.values())
      .filter(m => m.type === 'performance' && m.enabled);
    
    const businessMetrics = Array.from(this.metricsConfigs.values())
      .filter(m => m.type === 'business' && m.enabled);
    
    const systemMetrics = Array.from(this.metricsConfigs.values())
      .filter(m => m.type === 'system' && m.enabled);
    
    // 计算总体健康得分
    const healthScore = this.calculateHealthScore();
    
    // 获取活跃告警数量
    const activeAlerts = this.getAlerts(true).length;
    
    // 获取最近告警
    const recentAlerts = this.alerts
      .filter(alert => !alert.resolved)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 5);
    
    // 获取趋势数据
    const trendData = this.getTrendData();
    
    return {
      healthScore,
      activeAlerts,
      performanceOverview: this.calculateMetricOverview(performanceMetrics),
      businessOverview: this.calculateMetricOverview(businessMetrics),
      systemOverview: this.calculateMetricOverview(systemMetrics),
      recentAlerts,
      trendData
    };
  }

  /**
   * 计算指标概览
   */
  private calculateMetricOverview(metrics: MonitorMetricConfig[]): MetricOverview {
    const totalMetrics = metrics.length;
    let healthyMetrics = 0;
    let totalScore = 0;
    
    metrics.forEach(metric => {
      const dataPoints = this.monitoringData.get(metric.id) || [];
      if (dataPoints.length > 0) {
        const latestValue = dataPoints[dataPoints.length - 1].value;
        const isHealthy = !this.checkThresholdExceeded(latestValue, metric);
        
        if (isHealthy) {
          healthyMetrics++;
        }
        
        // 计算指标得分
      const score = this.calculateMetricScore(latestValue, metric);
      totalScore += score * (metric.weight || 1);
      }
    });
    
    return {
      totalMetrics,
      healthyMetrics,
      unhealthyMetrics: totalMetrics - healthyMetrics,
      averageScore: totalMetrics > 0 ? Math.round(totalScore * 100) / 100 : 0
    };
  }

  /**
   * 计算指标得分
   */
  private calculateMetricScore(value: number, config: MonitorMetricConfig): number {
    // 如果有阈值配置，基于阈值计算得分
    if (config.minThreshold !== undefined && config.maxThreshold !== undefined) {
      const range = config.maxThreshold - config.minThreshold;
      if (range > 0) {
        let normalizedValue = (value - config.minThreshold) / range;
        normalizedValue = Math.max(0, Math.min(1, normalizedValue));
        return normalizedValue * 100;
      }
    }
    
    // 默认返回基于阈值检查的得分
    const isHealthy = !this.checkThresholdExceeded(value, config);
    return isHealthy ? 90 : 40;
  }

  /**
   * 计算总体健康得分
   */
  private calculateHealthScore(): number {
    let totalWeight = 0;
    let weightedScore = 0;
    
    this.metricsConfigs.forEach((metric) => {
      if (metric.enabled) {
        const dataPoints = this.monitoringData.get(metric.id) || [];
        if (dataPoints.length > 0) {
          const latestValue = dataPoints[dataPoints.length - 1].value;
          const score = this.calculateMetricScore(latestValue, metric);
          const weight = metric.weight || 1;
          weightedScore += score * weight;
          totalWeight += weight;
        }
      }
    });
    
    return totalWeight > 0 ? Math.round(weightedScore / totalWeight) : 0;
  }

  /**
   * 获取趋势数据
   */
  private getTrendData(): MonitoringDataPoint[][] {
    const result: MonitoringDataPoint[][] = [];
    
    // 获取最常用的几个指标的趋势数据
    const keyMetrics = ['response_time', 'cpu_usage', 'memory_usage', 'active_users'];
    
    keyMetrics.forEach(metricId => {
      const dataPoints = this.getMonitoringData(metricId, 24); // 最近24个数据点
      if (dataPoints.length > 0) {
        result.push(dataPoints);
      }
    });
    
    return result;
  }

  /**
   * 生成监控报告
   */
  public generateReport(timeRange: { start: Date; end: Date }): MonitoringReport {
    // 计算总体健康得分
    const healthScore = this.calculateHealthScore();
    
    // 计算告警统计
    const alertStats = {
      [AlertLevel.INFO]: 0,
      [AlertLevel.WARNING]: 0,
      [AlertLevel.ERROR]: 0,
      [AlertLevel.CRITICAL]: 0
    };
    
    this.alerts.forEach(alert => {
      if (alert.timestamp >= timeRange.start && alert.timestamp <= timeRange.end) {
        alertStats[alert.level]++;
      }
    });
    
    // 计算趋势分析
    const trendAnalysis = this.calculateTrendAnalysis(timeRange);
    
    // 计算维度结果
    const dimensionResults = this.calculateDimensionResults();
    
    // 生成关键发现
    const keyFindings = this.generateKeyFindings(dimensionResults);
    
    // 生成改进建议
    const recommendations = this.generateRecommendations(dimensionResults);
    
    return {
      id: `report-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      timeRange,
      healthScore,
      alertStats,
      trendAnalysis,
      dimensionResults,
      keyFindings,
      recommendations
    };
  }

  /**
   * 计算趋势分析
   */
  private calculateTrendAnalysis(timeRange: { start: Date; end: Date }): MetricTrend[] {
    const trends: MetricTrend[] = [];
    
    this.metricsConfigs.forEach((config) => {
      const dataPoints = this.monitoringData.get(config.id) || [];
      const filteredPoints = dataPoints.filter(
        point => point.timestamp >= timeRange.start && point.timestamp <= timeRange.end
      );
      
      if (filteredPoints.length > 0) {
        // 计算统计数据
        const values = filteredPoints.map(p => p.value);
        const averageValue = values.reduce((sum, val) => sum + val, 0) / values.length;
        const maxValue = Math.max(...values);
        const minValue = Math.min(...values);
        
        // 计算趋势方向
        let trendDirection: 'up' | 'down' | 'stable';
        if (filteredPoints.length > 1) {
          const firstValue = filteredPoints[0].value;
          const lastValue = filteredPoints[filteredPoints.length - 1].value;
          const changePercent = ((lastValue - firstValue) / firstValue) * 100;
          
          if (Math.abs(changePercent) < 5) {
            trendDirection = 'stable';
          } else if (changePercent > 0) {
            trendDirection = 'up';
          } else {
            trendDirection = 'down';
          }
        } else {
          trendDirection = 'stable';
        }
        
        // 生成趋势描述
        const trendDescription = `平均值: ${averageValue.toFixed(2)}, 范围: ${minValue.toFixed(2)} - ${maxValue.toFixed(2)}, 趋势: ${trendDirection}`;
        
        trends.push({
          metricId: config.id,
          metricName: config.name,
          type: config.type,
          averageValue,
          maxValue,
          minValue,
          trendDirection,
          trendDescription
        });
      }
    });
    
    return trends;
  }

  /**
   * 计算维度结果
   */
  private calculateDimensionResults(): DimensionResult[] {
    const dimensions: Map<string, { metrics: MetricResult[], totalWeight: number }> = new Map();
    
    // 按类型分组指标
    this.metricsConfigs.forEach((config) => {
      if (!dimensions.has(config.type)) {
        dimensions.set(config.type, { metrics: [], totalWeight: 0 });
      }
      
      const dimension = dimensions.get(config.type)!;
      const dataPoints = this.monitoringData.get(config.id) || [];
      
      let value = 0;
      let score = 0;
      if (dataPoints.length > 0) {
        value = dataPoints[dataPoints.length - 1].value;
        score = this.calculateMetricScore(value, config);
      }
      
      const metricResult: MetricResult = {
        id: config.id,
        name: config.name,
        value,
        targetValue: config.maxThreshold || config.minThreshold || 0,
        weight: config.weight || 0.1,
        score: Math.round(score),
        dimension: config.type as any,
        passed: score >= 80,
        description: config.description || ''
      };
      
      dimension.metrics.push(metricResult);
      dimension.totalWeight += config.weight || 0.1;
    });
    
    // 计算维度结果
    const results: DimensionResult[] = [];
    
    dimensions.forEach((dimensionData, dimensionKey) => {
      let dimensionScore = 0;
      
      dimensionData.metrics.forEach(metric => {
        dimensionScore += metric.score * metric.weight;
      });
      
      dimensionScore = dimensionData.totalWeight > 0 
        ? Math.round(dimensionScore / dimensionData.totalWeight)
        : 0;
      
      results.push({
        dimension: dimensionKey as any,
        score: dimensionScore,
        weight: 1.0 / dimensions.size,
        metrics: dimensionData.metrics,
        description: `维度 ${dimensionKey} 的评估结果`,
        passed: dimensionScore >= 70
      });
    });
    
    return results;
  }

  /**
   * 生成关键发现
   */
  private generateKeyFindings(dimensions: DimensionResult[]): string[] {
    const findings: string[] = [];
    
    dimensions.forEach(dimension => {
      // 检查维度得分
      if (dimension.score < 70) {
        findings.push(`${dimension.dimension}维度得分较低（${dimension.score}分），低于目标值`);
      }
      
      // 检查指标得分
      dimension.metrics.forEach(metric => {
        if (metric.score < 60) {
          findings.push(`${metric.name}得分较低（${metric.score}分），需要重点关注`);
        }
      });
    });
    
    // 添加告警相关发现
    const activeAlerts = this.getAlerts(true);
    if (activeAlerts.length > 5) {
      findings.push(`当前有${activeAlerts.length}个活跃告警，数量较多，建议及时处理`);
    }
    
    return findings;
  }

  /**
   * 生成改进建议
   */
  private generateRecommendations(dimensions: DimensionResult[]): string[] {
    const recommendations: string[] = [];
    
    // 按得分排序维度
    const sortedDimensions = [...dimensions].sort((a, b) => a.score - b.score);
    
    // 对得分最低的维度提供改进建议
    if (sortedDimensions.length > 0 && sortedDimensions[0].score < 70) {
      const lowestDimension = sortedDimensions[0];
      recommendations.push(`优先改进${lowestDimension.dimension}维度，当前得分${lowestDimension.score}分，建议提升至70分以上`);
    }
    
    // 检查是否有严重的指标问题
    sortedDimensions.forEach(dimension => {
      dimension.metrics.forEach(metric => {
        if (metric.score < 50) {
          recommendations.push(`重点改进${metric.name}指标，当前得分${metric.score}分，需要大幅提升`);
        }
      });
    });
    
    // 添加通用建议
    const healthScore = this.calculateHealthScore();
    if (healthScore < 70) {
      recommendations.push(`系统整体健康得分较低（${healthScore}分），建议进行全面的系统优化和维护`);
    }
    
    return recommendations;
  }

  /**
   * 导出监控数据
   */
  public exportMonitoringData(metricId: string, format: 'json' | 'csv' = 'json'): string {
    const dataPoints = this.monitoringData.get(metricId) || [];
    
    if (format === 'json') {
      return JSON.stringify(dataPoints, null, 2);
    } else {
      // CSV格式
      const headers = ['timestamp', 'value', 'isThresholdExceeded', 'alertLevel'];
      const csvRows = [headers.join(',')];
      
      dataPoints.forEach(point => {
        const row = [
          point.timestamp.toISOString(),
          point.value.toString(),
          (point.isThresholdExceeded || false).toString(),
          (point.alertLevel || '').toString()
        ];
        csvRows.push(row.join(','));
      });
      
      return csvRows.join('\n');
    }
  }

  /**
   * 重置监控数据
   */
  public reset(): void {
    this.monitoringData.clear();
    this.alerts = [];
    console.log('Monitoring data reset successfully');
  }
}

// 导出单例实例
export const monitoringSystem = new MonitoringSystem({
  systemName: '行业矩阵功能评估系统',
  defaultSampleInterval: 5000,
  dataRetentionTime: 3600000, // 1小时
  enableRealTimeAlerts: true
});

export default MonitoringSystem;
