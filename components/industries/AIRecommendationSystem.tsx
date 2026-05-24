/**
 * @file AI智能推荐系统组件
 * @description 提供高级AI驱动的智能推荐功能，包括个性化推荐、趋势分析、预测性分析等
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-16
 * @updated 2024-10-16
 */

'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  BarChart2,
  TrendingUp,
  AlertTriangle,
  Lightbulb,
  ArrowUpRight,
  Search,
  Filter,
  RefreshCw,
  Download,
  Maximize,
  X,
  Settings,
  ThumbsUp,
  ThumbsDown,
  Share2,
} from 'lucide-react';

import { cn } from '@/YYC_原油/lib/utils';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Slider } from '../ui/slider';
import { Switch } from '../ui/switch';
import { Progress } from '../ui/progress';
import { Separator } from '../ui/separator';
import { ScrollArea } from '../ui/scroll-area';

// 推荐类型定义
export type RecommendationType = 'trend' | 'opportunity' | 'risk' | 'efficiency' | 'insight';

// 推荐数据接口定义
export interface AIRecommendationData {
  id: string;
  title: string;
  description: string;
  confidence: number;
  type: RecommendationType;
  industries: string[];
  createdAt: string;
  relevantMetrics: string[];
  potentialImpact: 'low' | 'medium' | 'high';
  actionItems: string[];
  dataSources: string[];
  visualizationType?: 'chart' | 'table' | 'graph' | 'map';
  visualizationData?: any;
}

// 用户偏好接口
export interface UserPreferences {
  preferredIndustries: string[];
  preferredRecommendationTypes: RecommendationType[];
  confidenceThreshold: number;
  impactFilter: ('low' | 'medium' | 'high')[];
  refreshFrequency: 'realtime' | 'daily' | 'weekly';
}

// 组件属性接口
interface AIRecommendationSystemProps {
  className?: string;
  initialRecommendations?: AIRecommendationData[];
  onRecommendationClick?: (recommendation: AIRecommendationData) => void;
  onFeedback?: (recommendationId: string, helpful: boolean, comment?: string) => void;
}

/**
 * AI智能推荐系统组件
 * 提供高级AI驱动的行业洞察和智能推荐
 */
export const AIRecommendationSystem: React.FC<AIRecommendationSystemProps> = ({
  className,
  initialRecommendations,
  onRecommendationClick,
  onFeedback,
}) => {
  // 状态管理
  const [recommendations, setRecommendations] = useState<AIRecommendationData[]>(initialRecommendations || []);
  const [filteredRecommendations, setFilteredRecommendations] = useState<AIRecommendationData[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [industryFilter, setIndustryFilter] = useState('all');
  const [impactFilter, setImpactFilter] = useState<string[]>(['low', 'medium', 'high']);
  const [minConfidence, setMinConfidence] = useState(70);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedRecommendation, setSelectedRecommendation] = useState<AIRecommendationData | null>(null);
  const [isMaximized, setIsMaximized] = useState(false);
  const [userPreferences] = useState<UserPreferences>({
    preferredIndustries: ['人工智能', '金融科技', '零售电商', '医疗健康'],
    preferredRecommendationTypes: ['trend', 'opportunity', 'insight'],
    confidenceThreshold: 80,
    impactFilter: ['medium', 'high'],
    refreshFrequency: 'daily',
  });

  // 模拟行业数据
  const industries = [
    '所有行业',
    '人工智能',
    '金融科技',
    '零售电商',
    '医疗健康',
    '教育科技',
    '智能制造',
    '能源环保',
    '物流运输',
    '文化娱乐',
  ];

  // 初始化数据
  useEffect(() => {
    // 如果没有提供初始推荐，使用模拟数据
    if (!initialRecommendations || initialRecommendations.length === 0) {
      loadMockRecommendations();
    }
  }, [initialRecommendations]);

  // 加载模拟推荐数据
  const loadMockRecommendations = () => {
    setLoading(true);
    
    // 模拟API延迟
    setTimeout(() => {
      const mockData: AIRecommendationData[] = [
        {
          id: 'rec-001',
          title: '数据处理效率优化机会',
          description: '分析发现，当前数据转换流程中存在3个关键瓶颈，通过实施并行处理和缓存优化，预计可提升45%的处理效率。',
          confidence: 94,
          type: 'efficiency',
          industries: ['人工智能', '金融科技'],
          createdAt: '2024-10-15T14:30:00Z',
          relevantMetrics: ['处理时间', 'CPU使用率', '内存消耗'],
          potentialImpact: 'high',
          actionItems: [
            '实施数据分片并行处理',
            '优化内存缓存策略',
            '重构高频调用的转换函数',
          ],
          dataSources: ['系统性能日志', '用户行为数据', '历史处理记录'],
          visualizationType: 'chart',
          visualizationData: [
            { name: '当前', 处理时间: 120, CPU: 85, 内存: 75 },
            { name: '优化后', 处理时间: 65, CPU: 60, 内存: 55 },
          ],
        },
        {
          id: 'rec-002',
          title: '金融行业新合规风险预警',
          description: '基于最新监管动向分析，金融行业的数据处理流程需要在30天内更新以符合新的数据安全和隐私保护要求。',
          confidence: 89,
          type: 'risk',
          industries: ['金融科技'],
          createdAt: '2024-10-15T10:15:00Z',
          relevantMetrics: ['合规评分', '数据泄露风险', '审计通过率'],
          potentialImpact: 'high',
          actionItems: [
            '更新数据加密标准',
            '实施访问控制审计',
            '准备合规报告模板',
          ],
          dataSources: ['监管公告', '行业报告', '合规检查结果'],
        },
        {
          id: 'rec-003',
          title: '零售行业季节性需求预测',
          description: '分析显示，零售行业即将进入年底购物季，建议提前准备高流量处理能力和优化用户体验，预计转化率可提升18%。',
          confidence: 92,
          type: 'trend',
          industries: ['零售电商'],
          createdAt: '2024-10-14T16:45:00Z',
          relevantMetrics: ['流量预测', '转化率', '平均订单金额'],
          potentialImpact: 'medium',
          actionItems: [
            '扩展服务器资源',
            '优化移动端体验',
            '准备促销数据分析模板',
          ],
          dataSources: ['历史销售数据', '市场趋势', '用户搜索行为'],
          visualizationType: 'chart',
          visualizationData: [
            { month: '10月', 流量: 120, 转化: 6.5 },
            { month: '11月', 流量: 180, 转化: 7.2 },
            { month: '12月', 流量: 240, 转化: 8.3 },
            { month: '1月', 流量: 150, 转化: 6.8 },
          ],
        },
        {
          id: 'rec-004',
          title: '医疗数据标准化机遇',
          description: '医疗健康行业对标准化数据格式的需求急剧增长，特别是在临床记录和研究数据领域，建议开发专用转换模板。',
          confidence: 87,
          type: 'opportunity',
          industries: ['医疗健康'],
          createdAt: '2024-10-14T09:20:00Z',
          relevantMetrics: ['市场需求', '竞争分析', '客户反馈'],
          potentialImpact: 'medium',
          actionItems: [
            '调研HL7和FHIR标准',
            '开发医疗数据模板',
            '与医疗机构合作测试',
          ],
          dataSources: ['行业报告', '客户调研', '市场分析'],
        },
        {
          id: 'rec-005',
          title: 'AI模型训练数据优化洞察',
          description: '通过分析用户数据处理模式，发现AI行业用户普遍需要高质量训练数据预处理，推荐开发自动化数据清洗和增强工具。',
          confidence: 91,
          type: 'insight',
          industries: ['人工智能'],
          createdAt: '2024-10-13T15:10:00Z',
          relevantMetrics: ['用户行为', '功能使用频率', '支持请求'],
          potentialImpact: 'high',
          actionItems: [
            '分析常见数据预处理需求',
            '开发自动化清洗流程',
            '集成数据增强功能',
          ],
          dataSources: ['用户行为分析', '功能使用数据', '支持工单'],
          visualizationType: 'chart',
          visualizationData: [
            { name: '数据清洗', 需求: 85 },
            { name: '格式转换', 需求: 75 },
            { name: '数据增强', 需求: 65 },
            { name: '质量验证', 需求: 70 },
          ],
        },
        {
          id: 'rec-006',
          title: '教育行业数据分析趋势',
          description: '教育科技领域正在转向基于学习行为的个性化分析，需要更复杂的数据转换和集成能力。',
          confidence: 83,
          type: 'trend',
          industries: ['教育科技'],
          createdAt: '2024-10-13T11:35:00Z',
          relevantMetrics: ['采用率', '功能需求', '用户满意度'],
          potentialImpact: 'low',
          actionItems: [
            '研究学习分析标准',
            '开发教育数据连接器',
            '提供学习分析模板',
          ],
          dataSources: ['教育科技报告', '市场调研', '产品反馈'],
        },
      ];
      
      setRecommendations(mockData);
      setLoading(false);
    }, 1000);
  };

  // 筛选推荐
  useEffect(() => {
    let filtered = [...recommendations];

    // 按标签页筛选
    if (activeTab !== 'all') {
      filtered = filtered.filter(rec => rec.type === activeTab);
    }

    // 按搜索查询筛选
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        rec => 
          rec.title.toLowerCase().includes(query) || 
          rec.description.toLowerCase().includes(query)
      );
    }

    // 按行业筛选
    if (industryFilter !== 'all') {
      filtered = filtered.filter(rec => rec.industries.includes(industryFilter));
    }

    // 按潜在影响筛选
    filtered = filtered.filter(rec => impactFilter.includes(rec.potentialImpact));

    // 按置信度筛选
    filtered = filtered.filter(rec => rec.confidence >= minConfidence);

    // 按用户偏好筛选
    if (userPreferences.preferredRecommendationTypes.length > 0) {
      filtered = filtered.filter(rec => 
        userPreferences.preferredRecommendationTypes.includes(rec.type)
      );
    }

    setFilteredRecommendations(filtered);
  }, [recommendations, activeTab, searchQuery, industryFilter, impactFilter, minConfidence, userPreferences]);

  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  // 获取推荐类型图标
  const getRecommendationTypeIcon = (type: RecommendationType) => {
    switch (type) {
      case 'trend':
        return <TrendingUp className="h-4 w-4" />;
      case 'opportunity':
        return <Lightbulb className="h-4 w-4" />;
      case 'risk':
        return <AlertTriangle className="h-4 w-4" />;
      case 'efficiency':
        return <BarChart2 className="h-4 w-4" />;
      case 'insight':
        return <Sparkles className="h-4 w-4" />;
      default:
        return <Lightbulb className="h-4 w-4" />;
    }
  };

  // 获取推荐类型颜色
  const getRecommendationTypeColor = (type: RecommendationType) => {
    switch (type) {
      case 'trend':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100';
      case 'opportunity':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
      case 'risk':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
      case 'efficiency':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-100';
      case 'insight':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  // 获取影响级别颜色
  const getImpactColor = (impact: 'low' | 'medium' | 'high') => {
    switch (impact) {
      case 'high':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100';
      case 'medium':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  // 处理推荐点击
  const handleRecommendationClick = (recommendation: AIRecommendationData) => {
    setSelectedRecommendation(recommendation);
    onRecommendationClick?.(recommendation);
  };

  // 处理推荐反馈
  const handleFeedback = (recommendationId: string, helpful: boolean) => {
    onFeedback?.(recommendationId, helpful);
    // 这里可以添加反馈后的UI更新逻辑
  };

  // 刷新推荐
  const handleRefresh = () => {
    setLoading(true);
    // 模拟刷新延迟
    setTimeout(() => {
      loadMockRecommendations();
      setLoading(false);
    }, 1000);
  };

  // 重置筛选器
  const handleResetFilters = () => {
    setSearchQuery('');
    setIndustryFilter('all');
    setImpactFilter(['low', 'medium', 'high']);
    setMinConfidence(70);
    setActiveTab('all');
  };

  // 渲染推荐卡片
  const renderRecommendationCard = (recommendation: AIRecommendationData) => {
    return (
      <Card
        key={recommendation.id}
        className={`overflow-hidden transition-all duration-300 hover:shadow-md cursor-pointer group ${
          selectedRecommendation?.id === recommendation.id
            ? 'ring-2 ring-primary dark:ring-primary/80'
            : ''
        }`}
        onClick={() => handleRecommendationClick(recommendation)}
      >
        <CardHeader className="p-4 pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getRecommendationTypeIcon(recommendation.type)}
              <CardTitle className="text-base font-semibold line-clamp-1">
                {recommendation.title}
              </CardTitle>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                className={cn(
                  'text-xs',
                  getRecommendationTypeColor(recommendation.type)
                )}
              >
                {getRecommendationTypeName(recommendation.type)}
              </Badge>
              <Badge
                className={cn('text-xs', getImpactColor(recommendation.potentialImpact))}
              >
                {getImpactText(recommendation.potentialImpact)}
              </Badge>
            </div>
          </div>
          <CardDescription className="text-xs mt-1 line-clamp-2">
            {recommendation.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-2 pb-2">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            {recommendation.industries.map((industry, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {industry}
              </Badge>
            ))}
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                可信度 {recommendation.confidence}%
              </span>
              <Progress
                value={recommendation.confidence}
                className="h-1.5 w-20"
              />
            </div>
            <span className="text-xs text-muted-foreground">
              {formatDate(recommendation.createdAt)}
            </span>
          </div>
        </CardContent>
        <CardFooter className="p-4 pt-0 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                handleFeedback(recommendation.id, true);
              }}
            >
              <ThumbsUp className="h-3.5 w-3.5 mr-1" />
              有用
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                handleFeedback(recommendation.id, false);
              }}
            >
              <ThumbsDown className="h-3.5 w-3.5 mr-1" />
              无用
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            <Share2 className="h-3.5 w-3.5 mr-1" />
            分享
          </Button>
        </CardFooter>
      </Card>
    );
  };

  // 获取推荐类型名称
  const getRecommendationTypeName = (type: RecommendationType): string => {
    switch (type) {
      case 'trend':
        return '趋势';
      case 'opportunity':
        return '机会';
      case 'risk':
        return '风险';
      case 'efficiency':
        return '效率';
      case 'insight':
        return '洞察';
      default:
        return '推荐';
    }
  };

  // 获取影响级别文本
  const getImpactText = (impact: 'low' | 'medium' | 'high'): string => {
    switch (impact) {
      case 'high':
        return '高影响';
      case 'medium':
        return '中等影响';
      case 'low':
        return '低影响';
      default:
        return '未知影响';
    }
  };

  // 渲染可视化数据
  const renderVisualization = (data: any, type?: 'chart' | 'table' | 'graph' | 'map') => {
    if (!data || !type) return null;

    // 这里简化实现，实际项目中可以使用更复杂的图表库
    return (
      <div className="mt-4 p-3 bg-muted rounded-lg">
        <div className="h-48 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">
            数据可视化图表展示区 - {type === 'chart' ? '柱状图' : type === 'table' ? '表格' : type === 'graph' ? '关系图' : '地图'}
          </p>
        </div>
      </div>
    );
  };

  // 渲染详情模态框
  const renderDetailModal = () => {
    if (!selectedRecommendation) return null;

    return (
      <div 
        className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${
          isMaximized ? 'bg-background' : 'bg-black/50 backdrop-blur-sm'
        }`}
        onClick={(e) => {
          if (e.target === e.currentTarget && !isMaximized) {
            setSelectedRecommendation(null);
          }
        }}
      >
        <Card 
          className={`w-full max-w-4xl max-h-[90vh] overflow-hidden transition-all duration-300 ${
            isMaximized ? 'max-w-none max-h-full' : 'shadow-2xl'
          }`}
        >
          <CardHeader className="bg-muted/30 p-4 flex flex-row items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {getRecommendationTypeIcon(selectedRecommendation.type)}
                <CardTitle className="text-xl">
                  {selectedRecommendation.title}
                </CardTitle>
              </div>
              <CardDescription className="text-sm">
                发布于 {formatDate(selectedRecommendation.createdAt)} • 可信度 {selectedRecommendation.confidence}%
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setIsMaximized(!isMaximized)}
              >
                {isMaximized ? <X className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
              </Button>
            </div>
          </CardHeader>
          <ScrollArea className="h-[calc(90vh-160px)] max-h-[600px]">
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge
                  className={cn(
                    getRecommendationTypeColor(selectedRecommendation.type)
                  )}
                >
                  {getRecommendationTypeName(selectedRecommendation.type)}
                </Badge>
                <Badge
                  className={cn(getImpactColor(selectedRecommendation.potentialImpact))}
                >
                  {getImpactText(selectedRecommendation.potentialImpact)}
                </Badge>
                {selectedRecommendation.industries.map((industry, index) => (
                  <Badge key={index} variant="secondary">
                    {industry}
                  </Badge>
                ))}
              </div>

              <h3 className="text-lg font-medium mb-2">详细描述</h3>
              <p className="text-sm text-muted-foreground mb-6">
                {selectedRecommendation.description}
              </p>

              {selectedRecommendation.visualizationData && renderVisualization(
                selectedRecommendation.visualizationData,
                selectedRecommendation.visualizationType
              )}

              <Separator className="my-6" />

              <h3 className="text-lg font-medium mb-3">建议行动</h3>
              <ul className="space-y-2 mb-6">
                {selectedRecommendation.actionItems.map((action, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <ArrowUpRight className="h-4 w-4 mt-0.5 flex-shrink-0 text-primary" />
                    <span className="text-sm">{action}</span>
                  </li>
                ))}
              </ul>

              <Separator className="my-6" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium mb-3">相关指标</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedRecommendation.relevantMetrics.map((metric, index) => (
                      <Badge key={index} variant="outline">
                        {metric}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-medium mb-3">数据来源</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedRecommendation.dataSources.map((source, index) => (
                      <Badge key={index} variant="outline">
                        {source}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </ScrollArea>
          <CardFooter className="p-4 border-t bg-muted/30 flex justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleFeedback(selectedRecommendation.id, true)}
              >
                <ThumbsUp className="h-4 w-4 mr-1" />
                有帮助
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleFeedback(selectedRecommendation.id, false)}
              >
                <ThumbsDown className="h-4 w-4 mr-1" />
                无帮助
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm">
                <Download className="h-4 w-4 mr-1" />
                导出报告
              </Button>
              <Button variant="ghost" size="sm">
                <Share2 className="h-4 w-4 mr-1" />
                分享
              </Button>
            </div>
          </CardFooter>
        </Card>
      </div>
    );
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* 顶部工具栏 */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-amber-500" />
          <h2 className="text-xl font-bold">AI智能推荐</h2>
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-[240px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索推荐..."
              className="pl-10 h-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={handleRefresh}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            >
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* 高级筛选器 */}
      {showAdvancedFilters && (
        <Card className="overflow-hidden">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">行业筛选</label>
                <Select value={industryFilter} onValueChange={setIndustryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择行业" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">所有行业</SelectItem>
                    {industries.slice(1).map((industry, index) => (
                      <SelectItem key={index} value={industry}>
                        {industry}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">潜在影响</label>
                <div className="flex flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="impact-low"
                      checked={impactFilter.includes('low')}
                      onCheckedChange={(checked) => {
                        setImpactFilter((prev) => {
                          if (checked) return [...prev, 'low'];
                          return prev.filter((i) => i !== 'low');
                        });
                      }}
                    />
                    <label htmlFor="impact-low" className="text-sm">低</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="impact-medium"
                      checked={impactFilter.includes('medium')}
                      onCheckedChange={(checked) => {
                        setImpactFilter((prev) => {
                          if (checked) return [...prev, 'medium'];
                          return prev.filter((i) => i !== 'medium');
                        });
                      }}
                    />
                    <label htmlFor="impact-medium" className="text-sm">中</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="impact-high"
                      checked={impactFilter.includes('high')}
                      onCheckedChange={(checked) => {
                        setImpactFilter((prev) => {
                          if (checked) return [...prev, 'high'];
                          return prev.filter((i) => i !== 'high');
                        });
                      }}
                    />
                    <label htmlFor="impact-high" className="text-sm">高</label>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">最低可信度</label>
                  <span className="text-sm font-medium">{minConfidence}%</span>
                </div>
                <Slider
                  value={[minConfidence]}
                  min={50}
                  max={100}
                  step={5}
                  onValueChange={(value) => setMinConfidence(value[0])}
                />
              </div>
            </div>
            
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={handleResetFilters}>
                重置筛选
              </Button>
              <Button size="sm">应用筛选</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 标签页导航 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start overflow-x-auto p-1">
          <TabsTrigger value="all" className="flex-1 sm:flex-none">
            全部
          </TabsTrigger>
          <TabsTrigger value="trend" className="flex-1 sm:flex-none">
            趋势
          </TabsTrigger>
          <TabsTrigger value="opportunity" className="flex-1 sm:flex-none">
            机会
          </TabsTrigger>
          <TabsTrigger value="risk" className="flex-1 sm:flex-none">
            风险
          </TabsTrigger>
          <TabsTrigger value="efficiency" className="flex-1 sm:flex-none">
            效率
          </TabsTrigger>
          <TabsTrigger value="insight" className="flex-1 sm:flex-none">
            洞察
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab} className="mt-4 pt-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-3">
              <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
              <p className="text-sm text-muted-foreground">正在生成智能推荐...</p>
            </div>
          ) : filteredRecommendations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-3 text-center">
              <Search className="h-12 w-12 text-muted-foreground" />
              <h3 className="text-lg font-medium">未找到推荐</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                尝试调整筛选条件或刷新推荐列表
              </p>
              <Button size="sm" className="mt-2" onClick={handleRefresh}>
                刷新推荐
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filteredRecommendations.map(renderRecommendationCard)}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* 用户偏好设置提示 */}
      <div className="flex items-center justify-between p-3 bg-muted rounded-lg text-sm">
        <div className="flex items-center gap-2">
          <Settings className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">
            根据您的偏好显示推荐，可通过设置调整
          </span>
        </div>
        <Button variant="ghost" size="sm" className="h-8 px-3">
          管理偏好
        </Button>
      </div>

      {/* 详情模态框 */}
      {renderDetailModal()}
    </div>
  );
};



// 导出默认组件
export default AIRecommendationSystem;