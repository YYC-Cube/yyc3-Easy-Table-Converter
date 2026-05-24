/**
 * @file 监控仪表盘组件
 * @description 可视化展示监控数据和告警信息的仪表盘界面
 * @component monitoring
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-20
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { 
  AlertTriangle, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  BarChart as BarChartIcon,
  RefreshCw,
  Download,
  Search,
  Filter,
  Info,
  Activity,
  Users,
  Cpu
} from 'lucide-react';

import { 
  monitoringSystem, 
  MonitoringAlert, 
  AlertLevel,
  DashboardData,
  MonitoringReport
} from './MonitoringSystem';

// 定义颜色常量
const COLORS = {
  primary: '#3b82f6',
  secondary: '#64748b',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#06b6d4',
  light: '#f8fafc',
  dark: '#1e293b',
  chart: [
    '#3b82f6',
    '#10b981',
    '#f59e0b',
    '#ef4444',
    '#8b5cf6',
    '#ec4899',
    '#06b6d4',
    '#64748b'
  ]
};

// 告警级别颜色映射 - 已移除未使用的常量

// 告警级别图标映射
const ALERT_LEVEL_ICONS: Record<AlertLevel, React.ReactNode> = {
  [AlertLevel.INFO]: <Info size={18} className="text-blue-500" />,
  [AlertLevel.WARNING]: <AlertTriangle size={18} className="text-amber-500" />,
  [AlertLevel.ERROR]: <AlertCircle size={18} className="text-red-500" />,
  [AlertLevel.CRITICAL]: <AlertCircle size={18} className="text-red-700" />
};

// 维度图标映射 - 已移除未使用的常量

// 指标卡片组件
interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeType?: 'up' | 'down' | 'neutral';
  icon: React.ReactNode;
  color?: string;
  description?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  change,
  changeType = 'neutral',
  icon,
  color = COLORS.primary,
  description
}) => {
  const getChangeColor = () => {
    switch (changeType) {
      case 'up': return COLORS.success;
      case 'down': return COLORS.danger;
      default: return COLORS.secondary;
    }
  };

  const getChangeIcon = () => {
    switch (changeType) {
      case 'up': return '↑';
      case 'down': return '↓';
      default: return '→';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-100 transition-all hover:shadow-lg">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">{title}</h3>
          <div className="mt-1 flex items-baseline">
            <span className="text-2xl font-bold text-gray-900" style={{ color }}>
              {typeof value === 'number' ? value.toLocaleString() : value}
            </span>
            {change !== undefined && (
              <span className="ml-2 flex items-center text-sm" style={{ color: getChangeColor() }}>
                {getChangeIcon()} {Math.abs(change)}%
              </span>
            )}
          </div>
        </div>
        <div className="p-2 rounded-full" style={{ backgroundColor: `${color}20` }}>
          {icon}
        </div>
      </div>
      {description && (
        <p className="text-xs text-gray-500 mt-2">{description}</p>
      )}
    </div>
  );
};

// 告警项组件
interface AlertItemProps {
  alert: MonitoringAlert;
  onResolve: () => void;
}

const AlertItem: React.FC<AlertItemProps> = ({ alert, onResolve }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 mb-2 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div className="flex items-start">
          <div className="mr-3">
            {ALERT_LEVEL_ICONS[alert.level]}
          </div>
          <div>
            <h4 className="font-medium text-gray-900">{alert.metricName}</h4>
            <p className="text-sm text-gray-500 mt-1">{alert.message}</p>
            <div className="flex mt-2 text-xs text-gray-600">
              <span className="flex items-center mr-4">
                <Clock size={12} className="mr-1" />
                {new Date(alert.timestamp).toLocaleTimeString()}
              </span>
              <span>
                当前值: <span className="font-semibold">{alert.currentValue}</span>
              </span>
              <span className="ml-4">
                {alert.thresholdInfo}
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={onResolve}
          className="text-xs bg-green-100 hover:bg-green-200 text-green-700 px-3 py-1 rounded-full transition-colors"
        >
          解决
        </button>
      </div>
    </div>
  );
};

// 健康卡片组件
interface HealthCardProps {
  title: string;
  score: number;
  icon: React.ReactNode;
  passed: boolean;
}

const HealthCard: React.FC<HealthCardProps> = ({ title, score, icon, passed }) => {
  const getScoreColor = () => {
    if (score >= 90) return COLORS.success;
    if (score >= 70) return COLORS.warning;
    return COLORS.danger;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-5 border border-gray-100">
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <div className="p-1.5 rounded-full bg-gray-100">
          {icon}
        </div>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <span className="text-3xl font-bold" style={{ color: getScoreColor() }}>
            {score}%
          </span>
          <div className="mt-1 flex items-center">
            {passed ? (
              <CheckCircle2 size={14} className="text-green-500 mr-1" />
            ) : (
              <AlertTriangle size={14} className="text-amber-500 mr-1" />
            )}
            <span className="text-xs text-gray-600">
              {passed ? '通过' : '需改进'}
            </span>
          </div>
        </div>
        <div className="w-16 h-16">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={[
                  { value: score, name: '得分' },
                  { value: 100 - score, name: '剩余' }
                ]}
                cx="50%"
                cy="50%"
                innerRadius={16}
                outerRadius={24}
                startAngle={90}
                endAngle={-270}
                paddingAngle={0}
                dataKey="value"
              >
                <Cell key="score" fill={getScoreColor()} />
                <Cell key="remaining" fill="#f1f5f9" />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="mt-3 bg-gray-50 rounded-md overflow-hidden h-1">
        <div 
          className="h-full rounded-md" 
          style={{ 
            width: `${score}%`,
            backgroundColor: getScoreColor()
          }}
        />
      </div>
    </div>
  );
};

// 主监控仪表盘组件
const MonitoringDashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [alerts, setAlerts] = useState<MonitoringAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState('response_time');
  const [timeRange, setTimeRange] = useState<'hour' | 'day' | 'week'>('day');
  const [reports, setReports] = useState<MonitoringReport[]>([]);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState<MonitoringReport | null>(null);
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const refreshTimer = useRef<NodeJS.Timeout>();

  // 加载数据
  const loadData = async () => {
    setLoading(true);
    try {
      // 获取仪表盘数据
      const data = monitoringSystem.getDashboardData();
      setDashboardData(data);

      // 获取告警列表
      let filteredAlerts = monitoringSystem.getAlerts();
      if (filterLevel !== 'all') {
        filteredAlerts = filteredAlerts.filter(alert => alert.level === filterLevel);
      }
      setAlerts(filteredAlerts);

      // 生成报告
      const endTime = new Date();
      const startTime = new Date();
      startTime.setHours(startTime.getHours() - 24); // 最近24小时

      const report = monitoringSystem.generateReport({ start: startTime, end: endTime });
      setReports([report]);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // 解决告警
  const handleResolveAlert = (alertId: string) => {
    monitoringSystem.resolveAlert(alertId);
    loadData(); // 重新加载数据
  };

  // 获取图表数据
  const getChartData = (metricId: string) => {
    try {
      const dataPoints = monitoringSystem.getMonitoringData(metricId, 24);
      return dataPoints.map(point => ({
        name: new Date(point.timestamp).toLocaleTimeString(),
        value: point.value,
        timestamp: point.timestamp
      }));
    } catch (error) {
      console.error('Failed to get chart data:', error);
      return [];
    }
  };

  // 获取趋势数据
  const getTrendData = () => {
    if (!dashboardData) return [];
    
    return dashboardData.trendData.map(dataPoints => ({
      metricId: dataPoints[0]?.metricId || 'unknown',
      name: getMetricName(dataPoints[0]?.metricId || 'unknown'),
      data: dataPoints.map(point => ({
        time: new Date(point.timestamp).toLocaleTimeString(),
        value: point.value
      }))
    }));
  };

  // 获取指标名称
  const getMetricName = (metricId: string): string => {
    const metricMap: Record<string, string> = {
      'response_time': '响应时间',
      'error_rate': '错误率',
      'throughput': '吞吐量',
      'cpu_usage': 'CPU使用率',
      'memory_usage': '内存使用率',
      'active_users': '活跃用户',
      'task_completion_rate': '任务完成率',
      'data_accuracy': '数据准确性',
      'user_satisfaction': '用户满意度'
    };
    return metricMap[metricId] || metricId;
  };

  // 获取告警级别名称 - 已移除未使用的函数

  // 导出数据
  const exportData = () => {
    const data = monitoringSystem.exportMonitoringData(selectedMetric, 'csv');
    const blob = new Blob([data], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${selectedMetric}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 查看报告
  const viewReport = (report: MonitoringReport) => {
    setSelectedReport(report);
    setShowReportModal(true);
  };

  // 自动刷新设置
  useEffect(() => {
    // 启动监控系统
    monitoringSystem.start();

    // 初始加载
    loadData();

    // 设置自动刷新
    refreshTimer.current = setInterval(() => {
      loadData();
    }, 30000); // 每30秒刷新一次

    // 清理函数
    return () => {
      if (refreshTimer.current) {
        clearInterval(refreshTimer.current);
      }
    };
  }, [filterLevel]);

  // 如果正在加载，显示加载状态
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-300 border-t-blue-600 mb-3" />
          <p className="text-gray-600">加载监控数据中...</p>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <p className="text-gray-600">无法加载监控数据</p>
      </div>
    );
  }

  const trendData = getTrendData();
  const chartData = getChartData(selectedMetric);

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* 顶部导航栏 */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-semibold text-gray-900">监控仪表盘</span>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={loadData}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                title="刷新数据"
              >
                <RefreshCw className="h-5 w-5 text-gray-600" />
              </button>
              <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                <Search className="h-5 w-5 text-gray-600" />
              </button>
              <div className="relative">
                <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                  <Bell size={20} className="text-gray-600" />
                </button>
                {alerts.length > 0 && (
                  <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-500" />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        {/* 状态概览 */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <MetricCard
            title="健康得分"
            value={dashboardData.healthScore}
            icon={<Activity size={20} className="text-blue-600" />}
            color={COLORS.primary}
            description="系统整体健康状况评估"
          />
          <MetricCard
            title="活跃告警"
            value={alerts.length}
            icon={<AlertTriangle size={20} className="text-amber-500" />}
            color={alerts.length > 0 ? COLORS.warning : COLORS.success}
            description={`${dashboardData.activeAlerts} 个未解决的告警`}
          />
          <MetricCard
            title="活跃用户"
            value={chartData.length > 0 ? Math.round(chartData[chartData.length - 1].value) : 0}
            icon={<Users size={20} className="text-green-600" />}
            color={COLORS.success}
            description="当前在线用户数量"
          />
          <MetricCard
            title="系统状态"
            value={dashboardData.healthScore > 70 ? '正常' : '警告'}
            icon={<CheckCircle2 size={20} className={dashboardData.healthScore > 70 ? 'text-green-600' : 'text-amber-500'} />}
            color={dashboardData.healthScore > 70 ? COLORS.success : COLORS.warning}
            description={dashboardData.healthScore > 70 ? '系统运行正常' : '部分指标异常'}
          />
        </div>

        {/* 健康状态卡片 */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <HealthCard
            title="性能指标"
            score={dashboardData.performanceOverview.averageScore}
            icon={<Activity size={20} className="text-blue-600" />}
            passed={dashboardData.performanceOverview.averageScore >= 70}
          />
          <HealthCard
            title="业务指标"
            score={dashboardData.businessOverview.averageScore}
            icon={<BarChartIcon size={20} className="text-green-600" />}
            passed={dashboardData.businessOverview.averageScore >= 70}
          />
          <HealthCard
            title="系统指标"
            score={dashboardData.systemOverview.averageScore}
            icon={<Cpu size={20} className="text-purple-600" />}
            passed={dashboardData.systemOverview.averageScore >= 70}
          />
          <HealthCard
            title="用户指标"
            score={(dashboardData.performanceOverview.averageScore + dashboardData.businessOverview.averageScore) / 2}
            icon={<Users size={20} className="text-amber-600" />}
            passed={true}
          />
        </div>

        {/* 图表区域 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* 指标趋势图 */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-4 py-5 border-b border-gray-200 sm:px-6 flex justify-between items-center">
              <h3 className="text-lg font-medium leading-6 text-gray-900">指标趋势</h3>
              <div className="flex space-x-2">
                <select
                  className="text-sm rounded border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={selectedMetric}
                  onChange={(e) => setSelectedMetric(e.target.value)}
                >
                  <option value="response_time">响应时间</option>
                  <option value="error_rate">错误率</option>
                  <option value="cpu_usage">CPU使用率</option>
                  <option value="memory_usage">内存使用率</option>
                  <option value="active_users">活跃用户</option>
                </select>
                <div className="flex rounded-md shadow-sm">
                  <button
                    className={`px-3 py-1 text-xs font-medium rounded-l-md ${timeRange === 'hour' ? 'bg-blue-50 text-blue-600' : 'bg-white text-gray-500'}`}
                    onClick={() => setTimeRange('hour')}
                  >
                    1小时
                  </button>
                  <button
                    className={`px-3 py-1 text-xs font-medium ${timeRange === 'day' ? 'bg-blue-50 text-blue-600' : 'bg-white text-gray-500'}`}
                    onClick={() => setTimeRange('day')}
                  >
                    1天
                  </button>
                  <button
                    className={`px-3 py-1 text-xs font-medium rounded-r-md ${timeRange === 'week' ? 'bg-blue-50 text-blue-600' : 'bg-white text-gray-500'}`}
                    onClick={() => setTimeRange('week')}
                  >
                    1周
                  </button>
                </div>
                <button 
                  className="p-1 rounded text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                  onClick={exportData}
                  title="导出数据"
                >
                  <Download size={16} />
                </button>
              </div>
            </div>
            <div className="px-4 py-5 sm:p-6">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke={COLORS.primary} 
                    strokeWidth={2}
                    dot={{ stroke: COLORS.primary, strokeWidth: 2, r: 4, fill: 'white' }}
                    activeDot={{ r: 6 }}
                    name={getMetricName(selectedMetric)}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 对比图表 */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-4 py-5 border-b border-gray-200 sm:px-6 flex justify-between items-center">
              <h3 className="text-lg font-medium leading-6 text-gray-900">指标对比</h3>
              <div className="flex space-x-2">
                <button className="p-1 rounded text-gray-500 hover:text-gray-700 hover:bg-gray-100">
                  <Filter size={16} />
                </button>
                <button className="p-1 rounded text-gray-500 hover:text-gray-700 hover:bg-gray-100">
                  <Download size={16} />
                </button>
              </div>
            </div>
            <div className="px-4 py-5 sm:p-6">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={trendData.slice(0, 4).map(data => ({
                  name: data.name,
                  最大值: Math.max(...data.data.map(d => d.value)),
                  最小值: Math.min(...data.data.map(d => d.value)),
                  平均值: data.data.reduce((sum, d) => sum + d.value, 0) / data.data.length
                }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="平均值" fill={COLORS.primary} />
                  <Bar dataKey="最大值" fill={COLORS.warning} />
                  <Bar dataKey="最小值" fill={COLORS.success} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* 告警和报告部分 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 告警列表 */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow overflow-hidden">
            <div className="px-4 py-5 border-b border-gray-200 sm:px-6 flex justify-between items-center">
              <div className="flex items-center">
                <h3 className="text-lg font-medium leading-6 text-gray-900">告警管理</h3>
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  {alerts.length} 条告警
                </span>
              </div>
              <div className="flex space-x-2">
                <select
                  className="text-sm rounded border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  value={filterLevel}
                  onChange={(e) => setFilterLevel(e.target.value)}
                >
                  <option value="all">全部级别</option>
                  <option value={AlertLevel.INFO}>信息</option>
                  <option value={AlertLevel.WARNING}>警告</option>
                  <option value={AlertLevel.ERROR}>错误</option>
                  <option value={AlertLevel.CRITICAL}>严重</option>
                </select>
                <button 
                  onClick={loadData}
                  className="p-1 rounded text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                >
                  <RefreshCw size={16} />
                </button>
              </div>
            </div>
            <div className="px-4 py-4 sm:p-6">
              {alerts.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">暂无告警</h3>
                  <p className="mt-1 text-sm text-gray-500">系统运行正常，没有发现异常情况</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {alerts.map(alert => (
                    <AlertItem 
                      key={alert.id} 
                      alert={alert} 
                      onResolve={() => handleResolveAlert(alert.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 报告列表 */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-4 py-5 border-b border-gray-200 sm:px-6 flex justify-between items-center">
              <h3 className="text-lg font-medium leading-6 text-gray-900">系统报告</h3>
              <button className="p-1 rounded text-gray-500 hover:text-gray-700 hover:bg-gray-100">
                <Download size={16} />
              </button>
            </div>
            <div className="px-4 py-4 sm:p-6">
              {reports.map(report => (
                <div 
                  key={report.id} 
                  className="border rounded-lg p-4 cursor-pointer hover:border-blue-500 hover:shadow-md transition-all mb-3"
                  onClick={() => viewReport(report)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium text-gray-900">系统监控报告</h4>
                      <p className="text-sm text-gray-500 mt-1">
                        {report.timeRange.start.toLocaleDateString()} - {report.timeRange.end.toLocaleDateString()}
                      </p>
                    </div>
                    <span className="px-2 py-1 text-xs font-medium rounded-full" style={{ 
                      backgroundColor: report.healthScore >= 70 ? '#d1fae5' : '#fee2e2',
                      color: report.healthScore >= 70 ? '#065f46' : '#991b1b'
                    }}>
                      {report.healthScore} 分
                    </span>
                  </div>
                  <div className="mt-3 bg-gray-50 rounded-md overflow-hidden h-1">
                    <div 
                      className="h-full rounded-md" 
                      style={{ 
                        width: `${report.healthScore}%`,
                        backgroundColor: report.healthScore >= 70 ? '#10b981' : '#ef4444'
                      }}
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                    <span>{report.keyFindings.length} 项发现</span>
                    <span>{report.recommendations.length} 项建议</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 报告详情模态框 */}
      {showReportModal && selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">系统监控报告详情</h3>
              <button 
                onClick={() => setShowReportModal(false)}
                className="text-gray-400 hover:text-gray-500 focus:outline-none"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-6 py-5">
              {/* 报告头部 */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h4 className="text-lg font-semibold">健康评分</h4>
                    <p className="text-sm text-gray-500">系统整体运行状况评估</p>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-blue-600">{selectedReport.healthScore}</div>
                    <div className="text-sm text-gray-500">满分100分</div>
                  </div>
                </div>
                <div className="bg-gray-100 rounded-md overflow-hidden h-3">
                  <div 
                    className="h-full rounded-md" 
                    style={{ 
                      width: `${selectedReport.healthScore}%`,
                      backgroundColor: selectedReport.healthScore >= 70 ? '#10b981' : '#ef4444'
                    }}
                  />
                </div>
              </div>

              {/* 关键发现 */}
              <div className="mb-6">
                <h4 className="text-md font-semibold mb-3">关键发现</h4>
                <ul className="space-y-2">
                  {selectedReport.keyFindings.map((finding, index) => (
                    <li key={index} className="flex items-start">
                      <AlertCircle size={16} className="text-amber-500 mt-0.5 mr-2 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{finding}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* 改进建议 */}
              <div className="mb-6">
                <h4 className="text-md font-semibold mb-3">改进建议</h4>
                <ul className="space-y-2">
                  {selectedReport.recommendations.map((recommendation, index) => (
                    <li key={index} className="flex items-start">
                      <CheckCircle2 size={16} className="text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{recommendation}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* 维度评估结果 */}
              <div className="mb-6">
                <h4 className="text-md font-semibold mb-3">维度评估结果</h4>
                <div className="space-y-3">
                  {selectedReport.dimensionResults.map((dimension, index) => (
                    <div key={index} className="border rounded-md p-3">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-sm">{dimension.dimension}</span>
                        <span className="px-2 py-0.5 text-xs font-medium rounded-full" style={{ 
                          backgroundColor: dimension.passed ? '#d1fae5' : '#fee2e2',
                          color: dimension.passed ? '#065f46' : '#991b1b'
                        }}>
                          {dimension.score} 分
                        </span>
                      </div>
                      <div className="bg-gray-100 rounded-md overflow-hidden h-1.5">
                        <div 
                          className="h-full rounded-md" 
                          style={{ 
                            width: `${dimension.score}%`,
                            backgroundColor: dimension.passed ? '#10b981' : '#ef4444'
                          }}
                        />
                      </div>
                      <div className="mt-2 text-xs text-gray-500">
                        {dimension.metrics.length} 个指标
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
              <button 
                onClick={() => setShowReportModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mr-2"
              >
                关闭
              </button>
              <button 
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                导出报告
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MonitoringDashboard;

// 缺少的 Bell 组件
const Bell: React.FC<{ size: number; className?: string }> = ({ size, className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
  </svg>
);
