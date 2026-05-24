/**
 * @file 性能可视化组件
 * @description 提供系统性能数据的图形化展示功能
 * @module performance
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-20
 */

import React, { useState, useEffect, useMemo } from 'react';
import { PerformanceAnalyzer, PerformanceAnalysisResult } from './PerformanceAnalyzer';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

/**
 * 性能可视化组件属性接口
 */
export interface PerformanceVisualizerProps {
  /** 是否自动刷新性能数据 */
  autoRefresh?: boolean;
  /** 自动刷新间隔（毫秒） */
  refreshInterval?: number;
  /** 分析持续时间（毫秒） */
  analysisDuration?: number;
  /** 分析名称前缀 */
  analysisNamePrefix?: string;
  /** 是否显示详细数据 */
  showDetailedData?: boolean;
  /** 自定义性能分析器实例 */
  analyzer?: PerformanceAnalyzer;
}

/**
 * 性能评分等级配置
 */
const SCORE_RANGES = [
  { min: 90, max: 100, label: '优秀', color: '#28a745', icon: '✨' },
  { min: 70, max: 89, label: '良好', color: '#17a2b8', icon: '✅' },
  { min: 50, max: 69, label: '一般', color: '#ffc107', icon: '⚠️' },
  { min: 0, max: 49, label: '较差', color: '#dc3545', icon: '❌' }
];

/**
 * 问题严重程度颜色配置
 */
const SEVERITY_COLORS = {
  critical: '#dc3545',
  high: '#fd7e14',
  medium: '#ffc107',
  low: '#6c757d'
};

/**
 * 问题类型配置
 */
const ISSUE_TYPE_CONFIG = {
  slowResponse: { label: '响应缓慢', color: '#dc3545' },
  highMemoryUsage: { label: '内存使用过高', color: '#fd7e14' },
  highCpuUsage: { label: 'CPU使用率过高', color: '#fd7e14' },
  excessiveDomOps: { label: 'DOM操作过多', color: '#ffc107' },
  renderingLag: { label: '渲染延迟', color: '#ffc107' },
  memoryLeak: { label: '内存泄漏', color: '#dc3545' },
  networkBottleneck: { label: '网络瓶颈', color: '#fd7e14' },
  excessiveRequests: { label: '请求过多', color: '#ffc107' },
  largePayload: { label: '有效载荷过大', color: '#ffc107' },
  uncachedResources: { label: '未缓存资源', color: '#6c757d' }
};

/**
 * 性能可视化组件
 * 提供系统性能数据的图形化展示功能
 */
const PerformanceVisualizer: React.FC<PerformanceVisualizerProps> = ({
  autoRefresh: initialAutoRefresh = true,
  refreshInterval = 30000, // 默认30秒刷新一次
  analysisDuration = 10000, // 默认分析10秒
  analysisNamePrefix = '实时性能分析',
  showDetailedData = true,
  analyzer = PerformanceAnalyzer.getInstance()
}) => {
  const [analysisResult, setAnalysisResult] = useState<PerformanceAnalysisResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedTab, setSelectedTab] = useState<'summary' | 'issues' | 'metrics' | 'recommendations'>('summary');
  const [autoRefresh, setAutoRefresh] = useState(initialAutoRefresh);

  /**
   * 运行性能分析
   */
  const runAnalysis = async () => {
    try {
      setLoading(true);
      const result = await analyzer.runPerformanceAnalysis(`${analysisNamePrefix}-${Date.now()}`, analysisDuration);
      setAnalysisResult(result);
    } catch (err) {
      console.error('性能分析失败:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 自动刷新性能数据
   */
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    // 立即运行一次分析
    runAnalysis();

    // 如果启用了自动刷新，设置定时器
    if (autoRefresh) {
      intervalId = setInterval(runAnalysis, refreshInterval);
    }

    // 清理函数
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [autoRefresh, refreshInterval, analysisDuration, analysisNamePrefix]);

  /**
   * 获取性能评分等级信息
   */
  const scoreInfo = useMemo(() => {
    if (!analysisResult) return null;
    const { performanceScore } = analysisResult;
    return SCORE_RANGES.find(range => performanceScore >= range.min && performanceScore <= range.max);
  }, [analysisResult]);

  /**
   * 准备指标图表数据
   */
  const metricsChartData = useMemo(() => {
    if (!analysisResult?.metrics) return [];
    const { metrics } = analysisResult;
    return [
      {
        name: '平均响应时间',
        value: metrics.averageResponseTime,
        unit: 'ms',
        color: '#17a2b8',
        warningThreshold: 500,
        criticalThreshold: 1000
      },
      {
        name: '平均响应时间',
        value: metrics.averageResponseTime,
        unit: 'ms',
        color: '#28a745',
        warningThreshold: 100,
        criticalThreshold: 200
      },
      {
        name: '错误率',
        value: metrics.errorRate * 100,
        unit: '%',
        color: '#dc3545',
        warningThreshold: 2,
        criticalThreshold: 5
      },
      // 总操作次数指标暂时不可用
      // {
      //   name: '总操作次数',
      //   value: 0,
      //   unit: '次',
      //   color: '#ffc107',
      //   warningThreshold: 0,
      //   criticalThreshold: 0
      // },
      // DOM操作次数指标暂时不可用
      // {
      //   name: 'DOM操作次数',
      //   value: 0,
      //   unit: '次',
      //   color: '#fd7e14',
      //   warningThreshold: 500,
      //   criticalThreshold: 1000
      // }
    ];
  }, [analysisResult]);

  /**
   * 准备问题分布饼图数据
   */
  // 暂时注释掉未使用的issueDistributionData
  /*
  const issueDistributionData = useMemo(() => {
    if (!analysisResult?.issues || analysisResult.issues.length === 0) return [];
    
    // 按严重程度分组
    const severityCounts = analysisResult.issues.reduce((acc, issue) => {
      const count = acc[issue.severity] || 0;
      acc[issue.severity] = count + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // 转换为饼图需要的数据格式
    return Object.entries(severityCounts).map(([severity, count]) => ({
      name: severity,
      value: count,
      color: SEVERITY_COLORS[severity as keyof typeof SEVERITY_COLORS] || '#6c757d'
    }));
  }, [analysisResult]);
  */

  /**
   * 准备问题类型分布数据
   */
  const issueTypeDistributionData = useMemo(() => {
    if (!analysisResult?.issues || analysisResult.issues.length === 0) return [];
    
    // 按问题类型分组
    const typeCount = analysisResult.issues.reduce((acc, issue) => {
      acc[issue.type] = (acc[issue.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(typeCount)
      .map(([type, count]) => ({
        name: ISSUE_TYPE_CONFIG[type as keyof typeof ISSUE_TYPE_CONFIG]?.label || type,
        value: count,
        color: ISSUE_TYPE_CONFIG[type as keyof typeof ISSUE_TYPE_CONFIG]?.color || '#6c757d'
      }))
      .sort((a, b) => b.value - a.value);
  }, [analysisResult]);

  /**
   * 准备响应时间趋势数据（模拟数据）
   */
  const responseTimeTrendData = useMemo(() => {
    if (!analysisResult) return [];
    
    // 生成模拟的响应时间趋势数据
    return Array.from({ length: 24 }, (_, i) => ({
      hour: `${i}:00`,
      '平均响应时间': Math.floor(Math.random() * 500) + 100,
      '最大响应时间': Math.floor(Math.random() * 1000) + 300
    }));
  }, [analysisResult]);

  /**
   * 获取严重程度标签
   */
  const getSeverityLabel = (severity: string): string => {
    const labels: Record<string, string> = {
      critical: '严重',
      high: '高',
      medium: '中',
      low: '低'
    };
    return labels[severity] || severity;
  };

  /**
   * 获取指标值状态颜色
   */
  const getMetricValueColor = (value: number, warningThreshold: number, criticalThreshold: number): string => {
    if (criticalThreshold > 0 && value > criticalThreshold) return '#dc3545';
    if (warningThreshold > 0 && value > warningThreshold) return '#ffc107';
    return '#28a745';
  };

  /**
   * 手动刷新性能数据
   */
  const handleRefresh = () => {
    runAnalysis();
  };

  /**
   * 渲染性能评分卡片
   */
  const renderScoreCard = () => {
    if (!analysisResult || !scoreInfo) {
      return (
        <div className="bg-white p-6 rounded-lg shadow-lg border-2 border-gray-200 animate-pulse">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-500">性能评分</h3>
          </div>
          <div className="mt-4 flex items-center justify-center">
            <div className="h-24 w-24 bg-gray-200 rounded-full animate-pulse"></div>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white p-6 rounded-lg shadow-lg border-2" style={{ borderColor: scoreInfo.color }}>
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-700">性能评分</h3>
          <span className="text-xl" title={scoreInfo.label}>{scoreInfo.icon}</span>
        </div>
        <div className="mt-4 flex flex-col items-center">
          <div className="text-6xl font-bold mb-2" style={{ color: scoreInfo.color }}>
            {analysisResult.performanceScore}
          </div>
          <div className="text-lg font-medium text-gray-600">{scoreInfo.label}</div>
          <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
            <div 
              className="h-2 rounded-full transition-all duration-1000 ease-out" 
              style={{ 
                width: `${analysisResult.performanceScore}%`,
                backgroundColor: scoreInfo.color
              }}
            ></div>
          </div>
        </div>
        <div className="mt-4 text-sm text-gray-500 text-center">
          评分时间: {analysisResult.timestamp.toLocaleString('zh-CN')}
        </div>
      </div>
    );
  };

  /**
   * 渲染性能问题摘要卡片
   */
  const renderIssuesSummaryCard = () => {
    if (!analysisResult || loading) {
      return (
        <div className="bg-white p-6 rounded-lg shadow-lg border-l-4 border-gray-300 animate-pulse">
          <h3 className="text-lg font-semibold text-gray-500">性能问题</h3>
          <div className="mt-4 space-y-2">
            {['严重', '高', '中', '低'].map(severity => (
              <div key={severity} className="flex justify-between">
                <span className="text-gray-400">{severity}优先级:</span>
                <div className="h-4 w-12 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    const issues = analysisResult.issues;
    const issueCounts = issues.reduce((acc, issue) => {
      acc[issue.severity] = (acc[issue.severity] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return (
      <div className="bg-white p-6 rounded-lg shadow-lg border-l-4 border-orange-500">
        <h3 className="text-lg font-semibold text-gray-700 flex items-center">
          <span className="mr-2">⚠️</span>性能问题
          <span className="ml-2 text-sm bg-red-100 text-red-800 px-2 py-1 rounded-full">
            {issues.length} 个问题
          </span>
        </h3>
        <div className="mt-4 space-y-2">
          {Object.entries(SEVERITY_COLORS).map(([severity, color]) => (
            <div key={severity} className="flex justify-between items-center">
              <span className="text-gray-600">{getSeverityLabel(severity)}优先级:</span>
              <span className="font-semibold" style={{ color }}>
                {issueCounts[severity] || 0}
              </span>
            </div>
          ))}
        </div>
        {issues.length > 0 && (
          <button 
            className="mt-4 text-sm text-blue-600 hover:text-blue-800 flex items-center"
            onClick={() => setSelectedTab('issues')}
          >
            查看所有问题 <span className="ml-1">→</span>
          </button>
        )}
      </div>
    );
  };

  /**
   * 渲染性能指标摘要卡片
   */
  const renderMetricsSummaryCard = () => {
    if (!analysisResult?.metrics || loading) {
      return (
        <div className="bg-white p-6 rounded-lg shadow-lg border-l-4 border-blue-300 animate-pulse">
          <h3 className="text-lg font-semibold text-gray-500">关键指标</h3>
          <div className="mt-4 space-y-2">
            {['响应时间', '渲染时间', '错误率'].map(metric => (
              <div key={metric} className="flex justify-between">
                <span className="text-gray-400">{metric}:</span>
                <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    const { metrics } = analysisResult;
    
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg border-l-4 border-blue-500">
        <h3 className="text-lg font-semibold text-gray-700">关键指标</h3>
        <div className="mt-4 space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-600">平均响应时间:</span>
            <span className={`font-semibold ${metrics.averageResponseTime > 500 ? 'text-orange-500' : 'text-green-600'}`}>
              {metrics.averageResponseTime.toFixed(2)} ms
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">平均响应时间:</span>
            <span className={`font-semibold ${metrics.averageResponseTime > 100 ? 'text-orange-500' : 'text-green-600'}`}>
              {metrics.averageResponseTime.toFixed(2)} ms
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">错误率:</span>
            <span className={`font-semibold ${metrics.errorRate > 0.01 ? 'text-red-500' : 'text-green-600'}`}>
              {(metrics.errorRate * 100).toFixed(2)}%
            </span>
          </div>
          {/* 总操作次数指标暂时不可用 */}
          {/* <div className="flex justify-between">
            <span className="text-gray-600">总操作次数:</span>
            <span className="font-semibold text-gray-700">-</span>
          </div> */}
        </div>
        {showDetailedData && (
          <button 
            className="mt-4 text-sm text-blue-600 hover:text-blue-800 flex items-center"
            onClick={() => setSelectedTab('metrics')}
          >
            查看详细指标 <span className="ml-1">→</span>
          </button>
        )}
      </div>
    );
  };

  /**
   * 渲染性能摘要面板
   */
  const renderSummaryPanel = () => {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {renderScoreCard()}
        {renderIssuesSummaryCard()}
        {renderMetricsSummaryCard()}
      </div>
    );
  };

  /**
   * 渲染性能问题列表
   */
  const renderIssuesList = () => {
    if (!analysisResult || loading) {
      return (
        <div className="animate-pulse">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="bg-white p-5 rounded-lg shadow mb-4">
              <div className="flex justify-between items-center mb-3">
                <div className="h-6 bg-gray-200 rounded w-48"></div>
                <div className="h-5 bg-gray-200 rounded w-12"></div>
              </div>
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-8 bg-gray-100 rounded w-full"></div>
            </div>
          ))}
        </div>
      );
    }

    if (!analysisResult.issues || analysisResult.issues.length === 0) {
      return (
        <div className="bg-green-50 border-l-4 border-green-500 text-green-700 p-4 rounded-lg">
          <div className="flex items-center">
            <span className="text-2xl mr-3">✅</span>
            <div>
              <p className="font-bold">性能良好</p>
              <p className="text-sm">未检测到性能问题，系统运行正常。</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {analysisResult.issues.map((issue, index) => (
          <div 
            key={issue.id || index} 
            className="bg-white p-5 rounded-lg shadow hover:shadow-md transition-shadow border-l-4"
            style={{ borderLeftColor: SEVERITY_COLORS[issue.severity] }}
          >
            <div className="flex justify-between items-start">
              <h4 className="font-semibold text-lg text-gray-800">{issue.description}</h4>
              <span 
                className="px-2 py-1 text-xs font-medium rounded-full"
                style={{ 
                  backgroundColor: `${SEVERITY_COLORS[issue.severity]}20`,
                  color: SEVERITY_COLORS[issue.severity]
                }}
              >
                {getSeverityLabel(issue.severity)}
              </span>
            </div>
            <div className="mt-3 text-sm text-gray-600">
              <div className="flex flex-wrap gap-2 mb-2">
                <span className="bg-gray-100 px-2 py-1 rounded">类型: {ISSUE_TYPE_CONFIG[issue.type]?.label || issue.type}</span>
                {issue.affectedComponents.map((component, idx) => (
                  <span key={idx} className="bg-blue-50 text-blue-700 px-2 py-1 rounded">{component}</span>
                ))}
              </div>
              <div className="mt-3">
                <p className="font-medium text-gray-700 mb-1">建议修复方案:</p>
                <p className="bg-gray-50 p-3 rounded border border-gray-200">{issue.suggestedFix}</p>
              </div>
              {issue.details && (
                <div className="mt-3 text-xs text-gray-500 overflow-x-auto">
                  <p className="font-medium mb-1">详细信息:</p>
                  <pre className="bg-gray-50 p-2 rounded overflow-x-auto">{JSON.stringify(issue.details, null, 2)}</pre>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  /**
   * 渲染性能指标图表
   */
  const renderMetricsCharts = () => {
    if (!analysisResult || loading) {
      return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {Array.from({ length: 2 }).map((_, index) => (
            <div key={index} className="bg-white p-4 rounded-lg shadow animate-pulse">
              <div className="h-6 bg-gray-200 rounded w-40 mb-4"></div>
              <div className="h-64 bg-gray-100 rounded"></div>
            </div>
          ))}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 指标对比柱状图 */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">关键性能指标</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={metricsChartData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip 
                  formatter={(value: any, name: string, props: any) => {
                    const item = metricsChartData.find(d => d.name === props.payload.name);
                    return [`${value} ${item?.unit || ''}`, name];
                  }}
                />
                <Bar dataKey="value" fill="#8884d8" radius={[0, 4, 4, 0]}>
                  {metricsChartData.map((entry, index) => {
                    const color = getMetricValueColor(entry.value, entry.warningThreshold, entry.criticalThreshold);
                    return <Cell key={`cell-${index}`} fill={color} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 问题分布饼图 */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">问题类型分布</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={issueTypeDistributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {issueTypeDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} 个`, '数量']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 响应时间趋势图 */}
        <div className="bg-white p-6 rounded-lg shadow lg:col-span-2">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">响应时间趋势（模拟数据）</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={responseTimeTrendData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="hour" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="平均响应时间" 
                  stroke="#17a2b8" 
                  activeDot={{ r: 8 }} 
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="最大响应时间" 
                  stroke="#dc3545" 
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    );
  };

  /**
   * 渲染优化建议列表
   */
  const renderRecommendationsList = () => {
    if (!analysisResult || loading) {
      return (
        <div className="animate-pulse">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="bg-white p-5 rounded-lg shadow mb-4">
              <div className="flex justify-between items-center mb-3">
                <div className="h-6 bg-gray-200 rounded w-48"></div>
                <div className="h-5 bg-gray-200 rounded w-16"></div>
              </div>
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6 mb-3"></div>
              <div className="h-6 bg-gray-100 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      );
    }

    if (!analysisResult.recommendations || analysisResult.recommendations.length === 0) {
      return (
        <div className="bg-blue-50 border-l-4 border-blue-500 text-blue-700 p-4 rounded-lg">
          <div className="flex items-center">
            <span className="text-2xl mr-3">✨</span>
            <div>
              <p className="font-bold">系统已优化</p>
              <p className="text-sm">当前系统性能良好，无需进一步优化建议。</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {analysisResult.recommendations.map((recommendation, index) => (
          <div 
            key={recommendation.id || index} 
            className="bg-white p-5 rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200"
          >
            <div className="flex justify-between items-start">
              <h4 className="font-semibold text-lg text-gray-800">{recommendation.description}</h4>
              <span 
                className="px-2 py-1 text-xs font-medium rounded-full"
                style={{ 
                  backgroundColor: 
                    recommendation.priority === 'high' ? '#17a2b820' :
                    recommendation.priority === 'medium' ? '#ffc10720' : '#6c757d20',
                  color: 
                    recommendation.priority === 'high' ? '#17a2b8' :
                    recommendation.priority === 'medium' ? '#ffc107' : '#6c757d'
                }}
              >
                {recommendation.priority === 'high' ? '高优先级' :
                 recommendation.priority === 'medium' ? '中优先级' : '低优先级'}
              </span>
            </div>
            
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center">
                <span className="w-24 text-sm font-medium text-gray-500">预期收益:</span>
                <span className="text-sm text-gray-700">{recommendation.expectedBenefit}</span>
              </div>
              <div className="flex items-center">
                <span className="w-24 text-sm font-medium text-gray-500">实现难度:</span>
                <span className="text-sm font-medium">
                  {recommendation.implementationComplexity === 'easy' ? '简单' :
                   recommendation.implementationComplexity === 'medium' ? '中等' : '复杂'}
                </span>
              </div>
            </div>

            {recommendation.steps && recommendation.steps.length > 0 && (
              <div className="mt-4">
                <h5 className="font-medium text-gray-700 mb-2">优化步骤:</h5>
                <ol className="list-decimal list-inside space-y-1 pl-2 text-sm text-gray-600">
                  {recommendation.steps.map((step, stepIndex) => (
                    <li key={stepIndex}>{step}</li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  /**
   * 渲染主内容区域
   */
  const renderMainContent = () => {
    switch (selectedTab) {
      case 'summary':
        return (
          <>
            {renderSummaryPanel()}
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h2 className="text-xl font-bold text-gray-800 mb-4">性能分析摘要</h2>
              {analysisResult && (
                <div className="prose max-w-none">
                  <p className="text-gray-600">{analysisResult.summary}</p>
                  
                  {analysisResult.issues && analysisResult.issues.length > 0 && (
                    <div className="mt-4">
                      <h3 className="text-lg font-semibold text-gray-700">主要发现</h3>
                      <ul className="list-disc list-inside space-y-1 text-gray-600">
                        {analysisResult.issues.slice(0, 3).map((issue, index) => (
                          <li key={index}>{issue.description}</li>
                        ))}
                        {analysisResult.issues.length > 3 && (
                          <li>...</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        );
      case 'issues':
        return (
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-bold text-gray-800 mb-4">性能问题分析</h2>
            <p className="text-gray-600 mb-6">
              共检测到 <span className="font-semibold text-red-500">{analysisResult?.issues?.length || 0}</span> 个性能问题，
              以下是详细信息和建议的解决方案。
            </p>
            {renderIssuesList()}
          </div>
        );
      case 'metrics':
        return (
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-bold text-gray-800 mb-4">详细性能指标</h2>
            <p className="text-gray-600 mb-6">
              以下图表展示了系统性能的关键指标数据和分布情况。
            </p>
            {renderMetricsCharts()}
          </div>
        );
      case 'recommendations':
        return (
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-bold text-gray-800 mb-4">优化建议</h2>
            <p className="text-gray-600 mb-6">
              基于性能分析结果，以下是提高系统性能的优化建议。
            </p>
            {renderRecommendationsList()}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">系统性能监控与分析</h1>
              <p className="text-gray-500 mt-1">实时监控系统性能，识别瓶颈，提供优化建议</p>
            </div>
            
            <div className="mt-4 md:mt-0 flex items-center space-x-3">
              <button
                onClick={handleRefresh}
                className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    分析中...
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                    </svg>
                    重新分析
                  </>
                )}
              </button>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">自动刷新</span>
              </label>
            </div>
          </div>
        </div>

        {/* 选项卡导航 */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex space-x-8">
            <button
              onClick={() => setSelectedTab('summary')}
              className={`px-1 py-4 text-sm font-medium border-b-2 ${selectedTab === 'summary' ? 'text-blue-600 border-blue-500' : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'}`}
            >
              总览
            </button>
            <button
              onClick={() => setSelectedTab('issues')}
              className={`px-1 py-4 text-sm font-medium border-b-2 ${selectedTab === 'issues' ? 'text-blue-600 border-blue-500' : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'} ${analysisResult?.issues?.length ? 'relative' : ''}`}
            >
              性能问题
              {analysisResult?.issues?.length ? (
                <span className="absolute -top-1 -right-3 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {analysisResult.issues.length}
                </span>
              ) : null}
            </button>
            <button
              onClick={() => setSelectedTab('metrics')}
              className={`px-1 py-4 text-sm font-medium border-b-2 ${selectedTab === 'metrics' ? 'text-blue-600 border-blue-500' : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'}`}
            >
              性能指标
            </button>
            <button
              onClick={() => setSelectedTab('recommendations')}
              className={`px-1 py-4 text-sm font-medium border-b-2 ${selectedTab === 'recommendations' ? 'text-blue-600 border-blue-500' : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'}`}
            >
              优化建议
            </button>
          </nav>
        </div>

        {/* 主内容区域 */}
        {renderMainContent()}

        {/* 页脚信息 */}
        <footer className="mt-10 text-center text-sm text-gray-500">
          <p>
            性能监控系统 v1.0.0 | 数据基于 {analysisDuration / 1000} 秒的实时分析
          </p>
          <p className="mt-1">
            最后更新时间: {analysisResult?.timestamp?.toLocaleString('zh-CN') || 'N/A'}
          </p>
        </footer>
      </div>
    </div>
  );
};

export default PerformanceVisualizer;
