/**
 * @file 行业入口网格组件
 * @description 实现行业入口网格布局，展示24个行业分类
 * @module industries/IndustryGrid
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 */

'use client'

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Search, ArrowUpRight, Filter, ChevronDown, Star, Activity, Award, BarChart4, Briefcase, Building, DollarSign, Zap, FileText, Heart, Layout, Shield, ShoppingCart, Database, PenTool, Globe, Book, LineChart, Lightbulb, MessageCircle, Share2, Code, Brain } from 'lucide-react';
import { cn } from '@/YYC_原油/lib/utils';

// 行业数据类型
interface Industry {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  description: string;
  features: string[];
  category: 'business' | 'technology' | 'finance' | 'lifestyle' | 'education' | 'healthcare';
  isPopular: boolean;
  userCount: number;
  toolCount: number;
}

// 行业卡片属性
interface IndustryCardProps {
  industry: Industry;
  onSelect?: (industry: Industry) => void;
  className?: string;
}

// 行业入口卡片组件
const IndustryCard: React.FC<IndustryCardProps> = ({ industry, onSelect, className }) => {
  const handleCardClick = () => {
    onSelect?.(industry);
  };

  return (
    <Card 
      className={`overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer group ${className}`}
      onClick={handleCardClick}
    >
      {/* 卡片顶部颜色条 */}
      <div 
        className="h-2 w-full"
        style={{ backgroundColor: industry.color }}
      />
      
      <CardHeader className="p-4 pb-2">
        <div className="flex items-start justify-between">
          {/* 图标容器 */}
          <div 
            className="w-10 h-10 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300"
            style={{ backgroundColor: `${industry.color}20` }}
          >
            <span className="text-xl" style={{ color: industry.color }}>
              {industry.icon}
            </span>
          </div>
          
          {/* 流行标签 */}
          {industry.isPopular && (
            <Badge className="bg-amber-50 text-amber-700 border-amber-200">
              <Star className="h-3 w-3 mr-1" />
              热门
            </Badge>
          )}
        </div>
        
        <CardTitle className="text-base font-semibold mt-2 group-hover:text-primary transition-colors">
          {industry.name}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-4 pt-2">
        {/* 行业描述 */}
        <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
          {industry.description}
        </p>
        
        {/* 功能标签 */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {industry.features.slice(0, 3).map((feature, index) => (
            <Badge key={index} variant="outline" className="text-xs font-normal py-1">
              {feature}
            </Badge>
          ))}
        </div>
      </CardContent>
      
      <CardFooter className="p-4 pt-0 border-t border-border flex justify-between items-center">
        {/* 统计信息 */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            <span>{industry.userCount.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-1">
            <Tools className="h-3 w-3" />
            <span>{industry.toolCount}</span>
          </div>
        </div>
        
        {/* 箭头图标 */}
        <div 
          className="w-7 h-7 rounded-full flex items-center justify-center bg-accent group-hover:bg-primary/10 transition-colors"
        >
          <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
      </CardFooter>
    </Card>
  );
};

// 补充缺失的用户和工具图标
const Users: React.FC<{ className?: string }> = ({ className }) => {
  return <Users className={className} />;
};

const Tools: React.FC<{ className?: string }> = ({ className }) => {
  return <Briefcase className={className} />;
};

// 行业网格主组件
interface IndustryGridProps {
  className?: string;
  onIndustrySelect?: (industry: Industry) => void;
  initialCategory?: string;
  searchQuery?: string;
}

const IndustryGrid: React.FC<IndustryGridProps> = ({
  className,
  onIndustrySelect,
  initialCategory = 'all',
  searchQuery = '',
}) => {
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [searchTerm, setSearchTerm] = useState(searchQuery);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // 24个行业数据
  const industries: Industry[] = [
    // 商业类别
    {
      id: 'finance',
      name: '金融科技',
      icon: <DollarSign className="h-5 w-5" />,
      color: '#3B82F6', // 蓝色
      description: '智能金融数据分析、报表转换和自动化财务处理工具',
      features: ['财务报表转换', '数据分析', '风险评估', '自动化报告'],
      category: 'finance',
      isPopular: true,
      userCount: 12500,
      toolCount: 24,
    },
    {
      id: 'retail',
      name: '零售电商',
      icon: <ShoppingCart className="h-5 w-5" />,
      color: '#10B981', // 绿色
      description: '电商数据处理、库存管理和销售报表转换解决方案',
      features: ['库存管理', '销售分析', '客户细分', '价格优化'],
      category: 'business',
      isPopular: true,
      userCount: 9800,
      toolCount: 18,
    },
    {
      id: 'marketing',
      name: '市场营销',
      icon: <Activity className="h-5 w-5" />,
      color: '#EC4899', // 粉色
      description: '营销数据分析、客户调研和广告效果评估工具',
      features: ['营销漏斗分析', '客户画像', 'A/B测试', 'ROI计算'],
      category: 'business',
      isPopular: false,
      userCount: 7600,
      toolCount: 15,
    },
    
    // 技术类别
    {
      id: 'data',
      name: '数据科学',
      icon: <Database className="h-5 w-5" />,
      color: '#8B5CF6', // 紫色
      description: '数据清洗、转换和可视化工具，支持多种数据格式',
      features: ['数据清洗', '转换映射', '可视化图表', '模型预测'],
      category: 'technology',
      isPopular: true,
      userCount: 15200,
      toolCount: 32,
    },
    {
      id: 'software',
      name: '软件开发',
      icon: <Code className="h-5 w-5" />,
      color: '#F59E0B', // 橙色
      description: '代码文档转换、API接口定义和开发规范工具',
      features: ['API文档', '代码转换', '规范检查', '版本控制'],
      category: 'technology',
      isPopular: false,
      userCount: 8700,
      toolCount: 22,
    },
    {
      id: 'ai',
      name: '人工智能',
      icon: <Brain className="h-5 w-5" />,
      color: '#6366F1', // 靛蓝色
      description: 'AI模型训练数据准备、结果分析和可视化工具',
      features: ['模型训练', '数据标注', '结果分析', '模型评估'],
      category: 'technology',
      isPopular: true,
      userCount: 18900,
      toolCount: 28,
    },
    {
      id: 'design',
      name: '设计创意',
      icon: <PenTool className="h-5 w-5" />,
      color: '#14B8A6', // 青色
      description: '设计资源管理、规格转换和创意项目跟踪工具',
      features: ['资源管理', '规格转换', '项目跟踪', '创意协作'],
      category: 'technology',
      isPopular: false,
      userCount: 6300,
      toolCount: 14,
    },
    
    // 金融类别
    {
      id: 'banking',
      name: '银行业务',
      icon: <Building className="h-5 w-5" />,
      color: '#4F46E5', // 深紫色
      description: '银行交易记录处理、合规报告和风险分析工具',
      features: ['交易分析', '合规报告', '风险评估', '客户管理'],
      category: 'finance',
      isPopular: false,
      userCount: 5400,
      toolCount: 16,
    },
    {
      id: 'investment',
      name: '投资分析',
      icon: <LineChart className="h-5 w-5" />,
      color: '#22C55E', // 绿色
      description: '投资组合分析、市场趋势跟踪和风险评估工具',
      features: ['组合分析', '趋势跟踪', '风险评估', '收益预测'],
      category: 'finance',
      isPopular: true,
      userCount: 10200,
      toolCount: 20,
    },
    
    // 生活方式类别
    {
      id: 'travel',
      name: '旅游出行',
      icon: <Globe className="h-5 w-5" />,
      color: '#06B6D4', // 青色
      description: '旅行数据处理、行程规划和旅游资源整合工具',
      features: ['行程规划', '资源整合', '数据分析', '客户反馈'],
      category: 'lifestyle',
      isPopular: false,
      userCount: 4800,
      toolCount: 12,
    },
    {
      id: 'food',
      name: '餐饮美食',
      icon: <Heart className="h-5 w-5" />,
      color: '#EF4444', // 红色
      description: '菜单分析、食材采购和客户评价处理工具',
      features: ['菜单分析', '采购管理', '客户评价', '库存优化'],
      category: 'lifestyle',
      isPopular: false,
      userCount: 3500,
      toolCount: 10,
    },
    {
      id: 'entertainment',
      name: '娱乐媒体',
      icon: <Share2 className="h-5 w-5" />,
      color: '#E879F9', // 紫色
      description: '内容分析、受众数据处理和媒体效果评估工具',
      features: ['内容分析', '受众数据', '效果评估', '内容推荐'],
      category: 'lifestyle',
      isPopular: true,
      userCount: 11500,
      toolCount: 19,
    },
    
    // 教育类别
    {
      id: 'education',
      name: '教育培训',
      icon: <Book className="h-5 w-5" />,
      color: '#059669', // 绿色
      description: '教育数据处理、学习效果分析和课程资源管理工具',
      features: ['学习分析', '资源管理', '评估报告', '课程规划'],
      category: 'education',
      isPopular: false,
      userCount: 7200,
      toolCount: 15,
    },
    {
      id: 'research',
      name: '科研学术',
      icon: <Lightbulb className="h-5 w-5" />,
      color: '#FBBF24', // 黄色
      description: '研究数据处理、文献分析和学术成果管理工具',
      features: ['数据处理', '文献分析', '成果管理', '协作工具'],
      category: 'education',
      isPopular: false,
      userCount: 6100,
      toolCount: 17,
    },
    
    // 医疗健康类别
    {
      id: 'healthcare',
      name: '医疗健康',
      icon: <Activity className="h-5 w-5" />,
      color: '#DC2626', // 红色
      description: '医疗数据处理、患者信息管理和健康分析工具',
      features: ['数据处理', '患者管理', '健康分析', '合规报告'],
      category: 'healthcare',
      isPopular: false,
      userCount: 5300,
      toolCount: 14,
    },
    {
      id: 'wellness',
      name: '健康管理',
      icon: <Heart className="h-5 w-5" />,
      color: '#10B981', // 绿色
      description: '健康数据追踪、生活方式分析和健康目标管理工具',
      features: ['数据追踪', '生活分析', '目标管理', '进度报告'],
      category: 'healthcare',
      isPopular: true,
      userCount: 8900,
      toolCount: 16,
    },
    
    // 更多行业数据
    {
      id: 'manufacturing',
      name: '制造业',
      icon: <Database className="h-5 w-5" />,
      color: '#7C3AED', // 紫色
      description: '生产数据处理、供应链分析和质量管理工具',
      features: ['生产分析', '供应链管理', '质量控制', '设备监控'],
      category: 'business',
      isPopular: false,
      userCount: 4200,
      toolCount: 13,
    },
    {
      id: 'realestate',
      name: '房地产',
      icon: <Building className="h-5 w-5" />,
      color: '#65A30D', // 绿色
      description: '房产数据处理、市场分析和投资回报率计算工具',
      features: ['市场分析', '投资计算', '客户管理', '趋势预测'],
      category: 'business',
      isPopular: false,
      userCount: 3800,
      toolCount: 11,
    },
    {
      id: 'hr',
      name: '人力资源',
      icon: <Users className="h-5 w-5" />,
      color: '#F59E0B', // 橙色
      description: '员工数据管理、绩效分析和招聘流程优化工具',
      features: ['员工管理', '绩效分析', '招聘优化', '培训管理'],
      category: 'business',
      isPopular: false,
      userCount: 6900,
      toolCount: 15,
    },
    {
      id: 'logistics',
      name: '物流运输',
      icon: <Share2 className="h-5 w-5" />,
      color: '#F97316', // 橙色
      description: '物流数据分析、路线优化和供应链管理工具',
      features: ['路线优化', '供应链分析', '运输管理', '成本控制'],
      category: 'business',
      isPopular: false,
      userCount: 4500,
      toolCount: 12,
    },
    {
      id: 'energy',
      name: '能源环保',
      icon: <Zap className="h-5 w-5" />,
      color: '#0EA5E9', // 蓝色
      description: '能源消耗分析、环保数据处理和可持续发展工具',
      features: ['消耗分析', '环保数据', '可持续发展', '成本优化'],
      category: 'technology',
      isPopular: false,
      userCount: 3200,
      toolCount: 10,
    },
    {
      id: 'media',
      name: '媒体出版',
      icon: <FileText className="h-5 w-5" />,
      color: '#EC4899', // 粉色
      description: '媒体内容分析、受众数据处理和出版效果评估工具',
      features: ['内容分析', '受众数据', '效果评估', '出版规划'],
      category: 'lifestyle',
      isPopular: false,
      userCount: 5100,
      toolCount: 14,
    },
    {
      id: 'government',
      name: '政府公共',
      icon: <Shield className="h-5 w-5" />,
      color: '#2563EB', // 蓝色
      description: '公共服务数据处理、政策分析和市民反馈管理工具',
      features: ['服务分析', '政策研究', '反馈管理', '资源分配'],
      category: 'business',
      isPopular: false,
      userCount: 2800,
      toolCount: 9,
    },
    {
      id: 'nonprofit',
      name: '非营利组织',
      icon: <Heart className="h-5 w-5" />,
      color: '#8B5CF6', // 紫色
      description: '捐赠数据分析、项目管理和社会效益评估工具',
      features: ['捐赠分析', '项目管理', '效益评估', '资金分配'],
      category: 'business',
      isPopular: false,
      userCount: 2100,
      toolCount: 8,
    },
  ];

  // 分类选项
  const categories = [
    { id: 'all', name: '全部', count: industries.length },
    { id: 'business', name: '商业服务', count: industries.filter(i => i.category === 'business').length },
    { id: 'technology', name: '科技创新', count: industries.filter(i => i.category === 'technology').length },
    { id: 'finance', name: '金融财经', count: industries.filter(i => i.category === 'finance').length },
    { id: 'lifestyle', name: '生活方式', count: industries.filter(i => i.category === 'lifestyle').length },
    { id: 'education', name: '教育培训', count: industries.filter(i => i.category === 'education').length },
    { id: 'healthcare', name: '医疗健康', count: industries.filter(i => i.category === 'healthcare').length },
  ];

  // 过滤和排序行业
  const filteredIndustries = useMemo(() => {
    let result = industries;

    // 按类别筛选
    if (activeCategory !== 'all') {
      result = result.filter(industry => industry.category === activeCategory);
    }

    // 按搜索词筛选
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      result = result.filter(industry => 
        industry.name.toLowerCase().includes(searchLower) ||
        industry.description.toLowerCase().includes(searchLower) ||
        industry.features.some(feature => feature.toLowerCase().includes(searchLower))
      );
    }

    // 热门优先排序
    return result.sort((a, b) => {
      if (a.isPopular && !b.isPopular) return -1;
      if (!a.isPopular && b.isPopular) return 1;
      return b.userCount - a.userCount;
    });
  }, [activeCategory, searchTerm]);

  return (
    <div className={cn('space-y-6', className)}>
      {/* 页面标题和搜索栏 */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">行业解决方案</h1>
          <p className="text-muted-foreground text-sm mt-1">
            探索24个行业的专属数据处理解决方案
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
          {/* 视图切换 */}
          <div className="flex items-center gap-2 border rounded-md p-0.5">
            <Button 
              variant={viewMode === 'grid' ? 'default' : 'ghost'} 
              size="sm" 
              className={`h-8 px-3 rounded ${viewMode === 'grid' ? '' : 'h-8'}`}
              onClick={() => setViewMode('grid')}
            >
              <Layout className="h-4 w-4" />
            </Button>
            <Button 
              variant={viewMode === 'list' ? 'default' : 'ghost'} 
              size="sm" 
              className={`h-8 px-3 rounded ${viewMode === 'list' ? '' : 'h-8'}`}
              onClick={() => setViewMode('list')}
            >
              <FileText className="h-4 w-4" />
            </Button>
          </div>
          
          {/* 搜索框 */}
          <div className="relative w-full sm:w-[240px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="搜索行业或功能..." 
              className="pl-10 h-9 w-full"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* 分类标签 */}
      <div className="flex flex-wrap gap-2">
        {categories.map((category) => (
          <Badge 
            key={category.id}
            variant={activeCategory === category.id ? 'default' : 'outline'}
            className={`cursor-pointer py-1 px-3 transition-all ${activeCategory === category.id ? 'font-medium' : ''}`}
            onClick={() => setActiveCategory(category.id)}
          >
            <span className="mr-1">{category.name}</span>
            <span className="text-xs opacity-70">({category.count})</span>
          </Badge>
        ))}
      </div>

      {/* 结果统计 */}
      <div className="flex justify-between items-center text-sm">
        <div className="text-muted-foreground">
          共找到 {filteredIndustries.length} 个行业解决方案
        </div>
        <Button variant="ghost" size="sm" className="text-xs h-8">
          <Filter className="h-3.5 w-3.5 mr-1" />
          筛选
        </Button>
      </div>

      {/* 行业卡片网格 */}
      {filteredIndustries.length > 0 ? (
        viewMode === 'grid' ? (
          // 网格视图
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredIndustries.map((industry) => (
              <IndustryCard 
                key={industry.id} 
                industry={industry}
                onSelect={onIndustrySelect}
              />
            ))}
          </div>
        ) : (
          // 列表视图
          <div className="space-y-3">
            {filteredIndustries.map((industry) => (
              <IndustryCard 
                key={industry.id} 
                industry={industry}
                onSelect={onIndustrySelect}
                className="grid grid-cols-12 hover:translate-x-1 transition-transform duration-300"
              />
            ))}
          </div>
        )
      ) : (
        // 无结果状态
        <div className="text-center py-12 bg-muted/50 rounded-lg">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-1">未找到相关行业</h3>
          <p className="text-sm text-muted-foreground">
            请尝试修改搜索条件或选择其他分类
          </p>
          <Button 
            variant="default" 
            size="sm" 
            className="mt-4"
            onClick={() => {
              setActiveCategory('all');
              setSearchTerm('');
            }}
          >
            查看全部行业
          </Button>
        </div>
      )}

      {/* 加载更多按钮 */}
      {filteredIndustries.length > 0 && (
        <div className="flex justify-center pt-4">
          <Button variant="outline" className="group">
            加载更多行业
            <ChevronDown className="h-4 w-4 ml-1 group-hover:-translate-y-0.5 transition-transform" />
          </Button>
        </div>
      )}
    </div>
  );
};

export { IndustryGrid, IndustryCard, type Industry };
