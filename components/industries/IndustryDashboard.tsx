/**
 * @file 行业看板组件
 * @description 实现行业数据看板，包含指标卡片和AI推荐功能
 * @module industries/IndustryDashboard
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 * @updated 2024-10-16
 */

'use client'

import React, { useState, useEffect } from 'react';
import { Sparkles, TrendingUp, Calendar, ArrowUpRight, Search, Filter, RefreshCw, Home, Settings, Menu, Table, Upload, Download, Sun, Moon } from 'lucide-react';
import { IndustryChart } from './IndustryChart';
import { AreaChart, LineChart, BarChart as RechartsBarChart, PieChart as RechartsPieChart, RadarChart, ResponsiveContainer } from 'recharts';
import { Line, Bar, Pie, Radar, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { cn } from '@/YYC_原油/lib/utils';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { AIRecommendationSystem } from './AIRecommendationSystem';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Progress } from '../ui/progress';
import { Separator } from '../ui/separator';

// 指标数据类型
interface MetricData {
  id: string;
  title: string;
  value: string;
  change: number;
  isPositive: boolean;
  icon: React.ReactNode;
  color: string;
  description: string;
}

// AI推荐数据类型
interface AIRecommendation {
  id: string;
  title: string;
  description: string;
  confidence: number;
  industry: string;
  type: 'trend' | 'opportunity' | 'risk';
  icon: React.ReactNode;
  actionText: string;
}

// 活动数据类型
interface ActivityData {
  id: string;
  title: string;
  time: string;
  user: {
    name: string;
    avatar: string;
  };
  status: 'completed' | 'in-progress' | 'pending';
  description: string;
}

// 指标卡片组件
interface MetricCardProps {
  metric: MetricData;
  onClick?: () => void;
}

const MetricCard: React.FC<MetricCardProps> = ({ metric, onClick }) => {
  return (
    <Card 
      className="overflow-hidden border-0 shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer"
      onClick={onClick}
    >
      <CardHeader className="p-4 pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-muted-foreground">{metric.title}</CardTitle>
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${metric.color}20` }}
          >
            <span className="text-lg" style={{ color: metric.color }}>
              {metric.icon}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        <div className="flex items-baseline justify-between">
          <span className="text-2xl font-bold">{metric.value}</span>
          <Badge 
            className={cn(
              'flex items-center gap-1.5',
              metric.isPositive ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-red-100 text-red-800 hover:bg-red-200'
            )}
          >
            <TrendingUp 
              className={cn('h-3 w-3', metric.isPositive ? 'rotate-0' : '-rotate-180')} 
            />
            {Math.abs(metric.change)}%
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-2">{metric.description}</p>
      </CardContent>
    </Card>
  );
};

// AI推荐卡片组件
interface AIRecommendationCardProps {
  recommendation: AIRecommendation;
  onAction?: () => void;
}

const AIRecommendationCard: React.FC<AIRecommendationCardProps> = ({ recommendation, onAction }) => {
  const getTypeStyles = () => {
    switch (recommendation.type) {
      case 'trend':
        return {
          bg: 'bg-blue-50 border-blue-200',
          text: 'text-blue-800',
          hover: 'hover:bg-blue-100',
        };
      case 'opportunity':
        return {
          bg: 'bg-green-50 border-green-200',
          text: 'text-green-800',
          hover: 'hover:bg-green-100',
        };
      case 'risk':
        return {
          bg: 'bg-orange-50 border-orange-200',
          text: 'text-orange-800',
          hover: 'hover:bg-orange-100',
        };
      default:
        return {
          bg: 'bg-slate-50 border-slate-200',
          text: 'text-slate-800',
          hover: 'hover:bg-slate-100',
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <Card className={`${styles.bg} border ${styles.hover} transition-all duration-300 overflow-hidden`}>
      <CardHeader className="p-4 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{recommendation.icon}</span>
            <Badge className={styles.text}>{recommendation.industry}</Badge>
          </div>
          <div className="text-xs text-muted-foreground">
            置信度: {recommendation.confidence}%
          </div>
        </div>
        <CardTitle className="text-base font-semibold mt-1">{recommendation.title}</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-2">
        <p className="text-sm text-muted-foreground mb-3">{recommendation.description}</p>
        <Progress 
          value={recommendation.confidence} 
          className="h-1.5 mb-3"
          style={{ 
            backgroundColor: `${styles.text.includes('blue') ? '#EFF6FF' : 
                              styles.text.includes('green') ? '#ECFDF5' : '#FFF7ED'}`
          }}
        />
      </CardContent>
      <CardFooter className="p-4 pt-0 border-t border-border bg-background/50">
        <Button 
          variant="ghost" 
          className={`w-full justify-between ${styles.text} hover:text-primary`}
          onClick={onAction}
        >
          <span>{recommendation.actionText}</span>
          <ArrowUpRight className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
};

// 活动项组件
interface ActivityItemProps {
  activity: ActivityData;
}

const ActivityItem: React.FC<ActivityItemProps> = ({ activity }) => {
  const getStatusStyles = () => {
    switch (activity.status) {
      case 'completed':
        return { bg: 'bg-green-100', text: 'text-green-800' };
      case 'in-progress':
        return { bg: 'bg-blue-100', text: 'text-blue-800' };
      case 'pending':
        return { bg: 'bg-yellow-100', text: 'text-yellow-800' };
      default:
        return { bg: 'bg-slate-100', text: 'text-slate-800' };
    }
  };

  const statusStyles = getStatusStyles();

  return (
    <div className="flex gap-3 p-3 rounded-lg hover:bg-accent transition-colors">
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarImage src={activity.user.avatar} alt={activity.user.name} />
        <AvatarFallback>{activity.user.name.charAt(0)}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium truncate">{activity.title}</h4>
          <Badge variant="outline" className={cn(statusStyles.bg, statusStyles.text, 'text-xs')}>
            {activity.status.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
          {activity.description}
        </p>
        <div className="flex items-center mt-1 text-xs text-muted-foreground">
          <span>{activity.user.name}</span>
          <span className="mx-1">•</span>
          <span>{activity.time}</span>
        </div>
      </div>
    </div>
  );
};

// 行业看板主组件
interface IndustryDashboardProps {
  selectedIndustry?: string;
  className?: string;
  onMetricClick?: (metricId: string) => void;
  onRecommendationClick?: (recommendationId: string) => void;
}

const IndustryDashboard: React.FC<IndustryDashboardProps> = ({
  selectedIndustry = '所有行业',
  className,
  onMetricClick,
  onRecommendationClick,
}) => {
  const [timeRange, setTimeRange] = useState('weekly');
  const [refreshing, setRefreshing] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // 模拟指标数据
  const metrics: MetricData[] = [
    {
      id: 'active-users',
      title: '活跃用户',
      value: '24.5K',
      change: 12.5,
      isPositive: true,
      icon: '👥',
      color: '#3B82F6',
      description: '较上周期增长12.5%',
    },
    {
      id: 'conversion-rate',
      title: '转化率',
      value: '6.8%',
      change: 2.3,
      isPositive: true,
      icon: '📈',
      color: '#10B981',
      description: '较上周期增长2.3%',
    },
    {
      id: 'avg-session',
      title: '平均会话时长',
      value: '4m 32s',
      change: 5.8,
      isPositive: true,
      icon: '⏱️',
      color: '#8B5CF6',
      description: '较上周期增长5.8%',
    },
    {
      id: 'error-rate',
      title: '错误率',
      value: '0.32%',
      change: 0.7,
      isPositive: false,
      icon: '🚨',
      color: '#EF4444',
      description: '较上周期下降0.7%',
    },
  ];

  // 模拟AI推荐数据
  const recommendations: AIRecommendation[] = [
    {
      id: 'rec-1',
      title: '智能数据处理需求增长',
      description: '过去30天内，AI行业对数据转换工具的需求增长了28%，特别是结构化数据处理领域。',
      confidence: 92,
      industry: '人工智能',
      type: 'trend',
      icon: '📊',
      actionText: '查看详情',
    },
    {
      id: 'rec-2',
      title: '金融科技领域的合规风险',
      description: '金融行业面临新的数据安全合规要求，建议更新数据处理流程以符合最新标准。',
      confidence: 87,
      industry: '金融科技',
      type: 'risk',
      icon: '🔒',
      actionText: '评估风险',
    },
    {
      id: 'rec-3',
      title: '零售分析新机遇',
      description: '零售行业对实时销售数据分析的需求激增，建议推出针对性的报表转换功能。',
      confidence: 89,
      industry: '零售电商',
      type: 'opportunity',
      icon: '🛍️',
      actionText: '把握机会',
    },
  ];

  // 模拟活动数据
  const activities: ActivityData[] = [
    {
      id: 'act-1',
      title: '数据转换任务完成',
      time: '10分钟前',
      user: {
        name: '张三',
        avatar: '/placeholder.jpg',
      },
      status: 'completed',
      description: '成功转换了1000条零售销售数据记录',
    },
    {
      id: 'act-2',
      title: 'AI模型训练进行中',
      time: '30分钟前',
      user: {
        name: '李四',
        avatar: '/placeholder.jpg',
      },
      status: 'in-progress',
      description: '正在训练智能数据分类模型，预计30分钟后完成',
    },
    {
      id: 'act-3',
      title: '行业报告生成',
      time: '2小时前',
      user: {
        name: '王五',
        avatar: '/placeholder.jpg',
      },
      status: 'pending',
      description: '请求生成金融科技行业数据分析报告',
    },
  ];

  // 处理刷新
  const handleRefresh = () => {
    setRefreshing(true);
    // 模拟刷新延迟
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* 页面标题和筛选栏 */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{selectedIndustry} 数据看板</h1>
          <p className="text-muted-foreground text-sm mt-1">
            实时监控行业关键指标和趋势洞察
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="选择时间范围" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">今日</SelectItem>
                <SelectItem value="weekly">本周</SelectItem>
                <SelectItem value="monthly">本月</SelectItem>
                <SelectItem value="quarterly">本季度</SelectItem>
              </SelectContent>
            </Select>
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-9 w-9" 
              onClick={handleRefresh}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-[240px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="搜索指标或洞察..." 
                className="pl-10 h-9 w-full"
              />
            </div>
            
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* 关键指标卡片 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <MetricCard 
            key={metric.id} 
            metric={metric}
            onClick={() => onMetricClick?.(metric.id)}
          />
        ))}
      </div>

      {/* 主要内容区域 - 响应式网格布局 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧 - AI推荐 */}
        <div className="lg:col-span-2 space-y-4">
          <AIRecommendationSystem
            themeMode={isDarkMode ? 'dark' : 'light'}
            onRecommendationClick={(recommendationId) => onRecommendationClick?.(recommendationId)}
            onFeedback={(recommendationId, helpful, comment) => {
              console.log(`推荐 ${recommendationId} 的反馈: ${helpful ? '有帮助' : '无帮助'}`, comment);
            }}
          />
        </div>

        {/* 右侧 - 活动和洞察 */}
        <div className="space-y-6">
          <Card className="overflow-hidden">
            <CardHeader className="p-4 pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  最近活动
                </CardTitle>
                <Button variant="ghost" size="sm" className="h-8 px-2">
                  全部
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[320px] overflow-auto">
                {activities.map((activity) => (
                  <React.Fragment key={activity.id}>
                    <ActivityItem activity={activity} />
                    <Separator />
                  </React.Fragment>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100">
            <CardHeader className="p-4">
              <CardTitle className="text-base font-semibold">行业洞察提示</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <div className="flex items-start gap-3 p-3 bg-white/80 rounded-lg border border-blue-100">
                <div className="mt-0.5">
                  <span className="text-lg">💡</span>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-blue-900">数据分析最佳实践</h4>
                  <p className="text-xs text-blue-700 mt-1">
                    为获得更准确的行业洞察，建议结合多个数据源进行交叉验证分析。
                  </p>
                  <Button variant="link" className="text-xs text-blue-600 p-0 h-auto mt-2">
                    了解更多最佳实践
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 行业分析标签页 */}
      <Card>
        <CardHeader className="p-4 pb-0">
          <CardTitle className="text-base font-semibold">行业深度分析</CardTitle>
          <CardDescription>基于历史数据的多维度行业表现分析</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Tabs defaultValue="performance" className="w-full">
            <TabsList className="w-full justify-start p-1 border-b rounded-none">
              <TabsTrigger value="performance" className="flex-1 rounded-md">
                性能指标
              </TabsTrigger>
              <TabsTrigger value="trends" className="flex-1 rounded-md">
                趋势分析
              </TabsTrigger>
              <TabsTrigger value="comparison" className="flex-1 rounded-md">
                行业对比
              </TabsTrigger>
              <TabsTrigger value="forecast" className="flex-1 rounded-md">
                预测分析
              </TabsTrigger>
            </TabsList>
            <TabsContent value="performance" className="p-4">
              <IndustryChart 
                type="bar"
                title="性能指标趋势"
                description="过去6个月关键性能指标表现"
                data={[
                  { month: '1月', 活跃用户: 18000, 转化率: 5.2, 平均会话: 3.8, 错误率: 0.45 },
                  { month: '2月', 活跃用户: 20000, 转化率: 5.5, 平均会话: 4.0, 错误率: 0.42 },
                  { month: '3月', 活跃用户: 19500, 转化率: 5.8, 平均会话: 4.1, 错误率: 0.40 },
                  { month: '4月', 活跃用户: 21000, 转化率: 6.0, 平均会话: 4.2, 错误率: 0.38 },
                  { month: '5月', 活跃用户: 23000, 转化率: 6.5, 平均会话: 4.3, 错误率: 0.35 },
                  { month: '6月', 活跃用户: 24500, 转化率: 6.8, 平均会话: 4.5, 错误率: 0.32 },
                ]}
                height={350}
                themeMode={isDarkMode ? 'dark' : 'light'}
              />
            </TabsContent>
            <TabsContent value="trends" className="p-4">
              <IndustryChart 
                type="line"
                title="行业发展趋势"
                description="各行业增长趋势分析"
                data={[
                  { month: '1月', 人工智能: 120, 金融科技: 90, 零售电商: 80, 医疗健康: 70 },
                  { month: '2月', 人工智能: 135, 金融科技: 95, 零售电商: 85, 医疗健康: 75 },
                  { month: '3月', 人工智能: 150, 金融科技: 105, 零售电商: 90, 医疗健康: 80 },
                  { month: '4月', 人工智能: 180, 金融科技: 115, 零售电商: 95, 医疗健康: 85 },
                  { month: '5月', 人工智能: 220, 金融科技: 130, 零售电商: 105, 医疗健康: 95 },
                  { month: '6月', 人工智能: 280, 金融科技: 150, 零售电商: 120, 医疗健康: 110 },
                ]}
                height={350}
                themeMode={isDarkMode ? 'dark' : 'light'}
              />
            </TabsContent>
            <TabsContent value="comparison" className="p-4">
              <IndustryChart 
                type="pie"
                title="行业占比分析"
                description="各行业市场份额分布"
                data={[
                  { name: '人工智能', value: 35 },
                  { name: '金融科技', value: 25 },
                  { name: '零售电商', value: 20 },
                  { name: '医疗健康', value: 15 },
                  { name: '其他行业', value: 5 },
                ]}
                height={350}
                themeMode={isDarkMode ? 'dark' : 'light'}
              />
            </TabsContent>
            <TabsContent value="forecast" className="p-4">
              <IndustryChart 
                type="area"
                title="未来趋势预测"
                description="基于历史数据的未来3个月预测"
                data={[
                  { month: '7月', 预测值: 27000, 置信下限: 25000, 置信上限: 29000 },
                  { month: '8月', 预测值: 29500, 置信下限: 27000, 置信上限: 32000 },
                  { month: '9月', 预测值: 32000, 置信下限: 29000, 置信上限: 35000 },
                ]}
                height={350}
                themeMode={isDarkMode ? 'dark' : 'light'}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

// 更新后的Header组件 - 增强版
interface EnhancedHeaderProps {
  onIndustryChange?: (industry: string) => void;
  onMobileMenuToggle?: () => void;
  mobileMenuOpen?: boolean;
}

export const EnhancedHeader: React.FC<EnhancedHeaderProps> = ({
  onIndustryChange,
  onMobileMenuToggle,
  mobileMenuOpen = false,
}) => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // 导航项数据
  const navItems = [
    { label: '首页', icon: <Home className="w-4 h-4" />, href: '/' },
    { label: '工具', icon: <Table className="w-4 h-4" />, href: '/tools' },
    { label: '行业方案', icon: <Settings className="w-4 h-4" />, href: '/industries' },
    { label: '文档', icon: <Settings className="w-4 h-4" />, href: '/docs' },
  ];

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${ 
        scrolled 
          ? 'bg-background/95 backdrop-blur-md shadow-sm py-2' 
          : 'bg-transparent py-3' 
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          {/* 移动端菜单按钮 */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden"
            onClick={onMobileMenuToggle}
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* 品牌标志 */}
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
              <Table className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
              YYC³ Easy Table Converter
            </span>
          </div>

          {/* 桌面导航 */}
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item, index) => (
              <a 
                key={index} 
                href={item.href}
                className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                {item.icon}
                <span>{item.label}</span>
              </a>
            ))}
          </nav>

          {/* 右侧工具栏 */}
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="rounded-full">
              <Upload className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Download className="h-4 w-4" />
            </Button>
            <ThemeToggle />
            <SettingsButton />
            <Button className="hidden sm:flex bg-primary hover:bg-primary/90">
              <Sparkles className="h-4 w-4 mr-2" />
              升级专业版
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

// 主题切换按钮组件
const ThemeToggle: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  return (
    <Button 
      variant="ghost" 
      size="icon" 
      className="rounded-full"
      onClick={() => setIsDarkMode(!isDarkMode)}
    >
      {isDarkMode ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </Button>
  );
};

// 设置按钮组件
const SettingsButton: React.FC = () => {
  return (
    <Button variant="ghost" size="icon" className="rounded-full">
      <Settings className="h-4 w-4" />
    </Button>
  );
};

export { IndustryDashboard, MetricCard, AIRecommendationCard, ActivityItem, EnhancedHeader };
