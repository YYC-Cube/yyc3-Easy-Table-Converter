"use client"

import React, { useState, useEffect } from 'react';
import { VirtualScrollWrapper } from '../utils/PerformanceOptimizer';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Search, LayoutGrid, Star, Clock, ArrowRight, Settings, Sparkles, TrendingUp, Zap, RefreshCw, Lock, FileText, Eye, CheckCircle, Download, Code, BookOpen, Hexagon, GitCompare, Share2, X }
  from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { Header } from '@/components/Header';

/**
 * @file 主仪表盘页面
 * @description 所有工具的统一入口和管理界面
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-21
 */

// 工具类别数据
const TOOL_CATEGORIES = [
  {
    id: 'color',
    name: '颜色工具',
    icon: <Hexagon className="h-5 w-5" />,
    description: '专业的颜色处理和分析工具',
    tools: [
      {
        id: 'palette-generator',
        name: '智能调色板生成器',
        description: '从图像或颜色生成和谐的调色板',
        icon: <Sparkles className="h-5 w-5" />,
        features: ['主色调提取', '协调色板生成', '颜色代码复制'],
        path: '/converters/palette-generator',
      },
      {
        id: 'contrast-checker',
        name: '颜色对比度检查器',
        description: '检查颜色组合的对比度和可访问性',
        icon: <Eye className="h-5 w-5" />,
        features: ['WCAG标准检查', '对比度评分', '颜色推荐'],
        path: '/converters/contrast-checker',
      },
      {
        id: 'gradient-generator',
        name: '渐变颜色生成器',
        description: '创建平滑的颜色渐变效果',
        icon: <TrendingUp className="h-5 w-5" />,
        features: ['线性/径向渐变', '多色渐变', 'CSS代码导出'],
        path: '/converters/gradient-generator',
      },
      {
        id: 'color-blind-simulator',
        name: '颜色盲模拟器',
        description: '模拟不同类型的色盲视觉效果',
        icon: <Eye className="h-5 w-5" />,
        features: ['8种色盲类型', '实时预览', '可访问性建议'],
        path: '/converters/color-blind-simulator',
      },
    ],
  },
  {
    id: 'conversion',
    name: '单位换算',
    icon: <RefreshCw className="h-5 w-5" />,
    description: '各种度量单位的精确转换工具',
    tools: [
      {
        id: 'currency-converter',
        name: '实时货币换算器',
        description: '全球主要货币的实时汇率转换',
        icon: <TrendingUp className="h-5 w-5" />,
        features: ['150+货币支持', '实时汇率更新', '历史汇率查询'],
        path: '/converters/currency-converter',
      },
      {
        id: 'data-unit-converter',
        name: '数据存储单位换算',
        description: '各种数据存储单位之间的转换',
        icon: <Download className="h-5 w-5" />,
        features: ['常用数据单位', '精度控制', '批量换算'],
        path: '/converters/data-unit-converter',
      },
      {
        id: 'energy-converter',
        name: '能源单位换算器',
        description: '不同能源和功率单位的转换',
        icon: <Zap className="h-5 w-5" />,
        features: ['20+能源单位', '科学记数法', '换算公式显示'],
        path: '/converters/energy-converter',
      },
      {
        id: 'angle-converter',
        name: '角度单位换算器',
        description: '角度测量单位的精确转换',
        icon: <RefreshCw className="h-5 w-5" />,
        features: ['度、弧度、梯度', '三角函数计算', '可视化角度显示'],
        path: '/converters/angle-converter',
      },
    ],
  },
  {
    id: 'security',
    name: '安全工具',
    icon: <Lock className="h-5 w-5" />,
    description: '保障数据安全和隐私的工具',
    tools: [
      {
        id: 'password-generator',
        name: '密码生成器',
        description: '创建高强度安全密码',
        icon: <Lock className="h-5 w-5" />,
        features: ['自定义复杂度', '密码强度评估', '一键复制'],
        path: '/converters/password-generator',
      },
      {
        id: 'hash-calculator',
        name: '哈希计算器',
        description: '计算文件或文本的哈希值',
        icon: <Code className="h-5 w-5" />,
        features: ['MD5、SHA系列', '文件哈希', '结果比对'],
        path: '/converters/hash-calculator',
      },
      {
        id: 'encrypt-decrypt',
        name: '加密/解密工具',
        description: '安全地加密和解密敏感信息',
        icon: <Lock className="h-5 w-5" />,
        features: ['AES加密', '密钥管理', '安全警告提示'],
        path: '/converters/encrypt-decrypt',
      },
    ],
  },
  {
    id: 'text',
    name: '文本处理',
    icon: <FileText className="h-5 w-5" />,
    description: '文本分析、转换和优化工具',
    tools: [
      {
        id: 'text-summary',
        name: 'AI文本摘要生成器',
        description: '自动生成文本的简洁摘要',
        icon: <BookOpen className="h-5 w-5" />,
        features: ['多长度摘要', '核心信息提取', '大文本处理'],
        path: '/converters/text-summary',
      },
      {
        id: 'regex-tester',
        name: '正则表达式测试器',
        description: '测试和验证正则表达式模式',
        icon: <Code className="h-5 w-5" />,
        features: ['实时匹配结果', '常用模式库', '语法错误提示'],
        path: '/converters/regex-tester',
      },
      {
        id: 'text-deduplication',
        name: '文本去重工具',
        description: '识别和移除重复内容',
        icon: <GitCompare className="h-5 w-5" />,
        features: ['相似度阈值可调', '重复片段高亮', '批量处理'],
        path: '/converters/text-deduplication',
      },
      {
        id: 'text-translation',
        name: '智能文本翻译',
        description: '多语言间的文本翻译',
        icon: <Share2 className="h-5 w-5" />,
        features: ['50+语言支持', '翻译质量评估', '专业术语支持'],
        path: '/converters/text-translation',
      },
      {
        id: 'text-diff',
        name: '文本差异比较器',
        description: '比较两个文本的差异',
        icon: <GitCompare className="h-5 w-5" />,
        features: ['行级差异对比', '变更高亮', '合并建议'],
        path: '/converters/text-diff',
      },
    ],
  },
];

// 使用统计数据
const USAGE_STATS = [
  { name: '颜色工具', value: 35 },
  { name: '单位换算', value: 25 },
  { name: '安全工具', value: 20 },
  { name: '文本处理', value: 20 },
];

// 颜色配置
const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b'];

const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredTools, setFilteredTools] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recentTools, setRecentTools] = useState<any[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  
  // 确保只在客户端执行
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);
  
  // 服务器端渲染时返回null
  // 确保hooks不会在服务器端执行
  if (!isMounted) {
    return null;
  }
  
  // 所有hooks调用都在isMounted检查之后
  const { toast } = useToast();

  // 初始化数据
  useEffect(() => {
    // 加载收藏工具
    const savedFavorites = localStorage.getItem('favorites');
    if (savedFavorites) {
      setFavorites(JSON.parse(savedFavorites));
    }

    // 加载最近使用的工具
    // 由于移除了useHistory hook，暂时设置为空数组
    setRecentTools([]);

    // 初始过滤
    filterTools();
  }, []);

  // 查找工具函数已移除，因为不再需要

  // 过滤工具
  const filterTools = () => {
    let tools: any[] = [];
    
    // 收集所有工具
    TOOL_CATEGORIES.forEach(category => {
      category.tools.forEach(tool => {
        tools.push({ ...tool, category: category.name });
      });
    });

    // 根据搜索词过滤
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      tools = tools.filter(tool => 
        tool.name.toLowerCase().includes(term) ||
        tool.description.toLowerCase().includes(term) ||
        tool.category.toLowerCase().includes(term) ||
        tool.features.some((feature: string) => feature.toLowerCase().includes(term))
      );
    }

    // 根据标签过滤
    if (activeTab !== 'all') {
      if (activeTab === 'favorites') {
        tools = tools.filter(tool => favorites.includes(tool.id));
      } else if (activeTab === 'recent') {
        tools = recentTools;
      } else {
        tools = tools.filter(tool => tool.category === activeTab);
      }
    }

    setFilteredTools(tools);
  };

  // 处理搜索
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    filterTools();
  };

  // 切换收藏状态
  const toggleFavorite = (toolId: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    let newFavorites;
    if (favorites.includes(toolId)) {
      newFavorites = favorites.filter(id => id !== toolId);
      toast({ variant: 'destructive', title: '已移除收藏', description: '该工具已从收藏中移除' });
    } else {
      newFavorites = [...favorites, toolId];
      toast({ variant: 'default', title: '已添加收藏', description: '该工具已添加到收藏' });
    }
    setFavorites(newFavorites);
    localStorage.setItem('favorites', JSON.stringify(newFavorites));
  };

  // 清除搜索
  const clearSearch = () => {
    setSearchTerm('');
    filterTools();
  };

  // 渲染工具卡片
  const renderToolCard = (tool: any) => (
    <Link
      key={tool.id}
      href={tool.path}
      className="group block"
      prefetch={false}
    >
      <Card className="h-full transition-all duration-300 hover:shadow-lg hover:scale-[1.02] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div className="p-2 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
              {tool.icon}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-gray-400 hover:text-amber-500 transition-colors"
              onClick={(e) => toggleFavorite(tool.id, e)}
            >
              <Star className={`h-4 w-4 ${favorites.includes(tool.id) ? 'fill-amber-500 text-amber-500' : ''}`} />
            </Button>
          </div>
          <CardTitle className="mt-2 text-base font-semibold group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            {tool.name}
          </CardTitle>
          <CardDescription className="text-xs text-gray-500 dark:text-gray-400">
            {tool.category}
          </CardDescription>
        </CardHeader>
        <CardContent className="pb-2">
          <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
            {tool.description}
          </p>
          <div className="mt-3 flex flex-wrap gap-1">
            {tool.features.slice(0, 3).map((feature: string, index: number) => (
              <Badge key={index} variant="secondary" className="text-xs h-5">
                {feature}
              </Badge>
            ))}
          </div>
        </CardContent>
        <CardFooter className="pt-2 flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1 text-xs font-normal text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400"
          >
            开始使用
            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
          </Button>
        </CardFooter>
      </Card>
    </Link>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* 页面标题和统计信息 */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                工具仪表盘
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                探索和使用我们提供的各种实用工具
              </p>
            </div>
            <div className="flex gap-3">
              <Button className="hidden md:flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700">
                <Settings className="h-4 w-4" />
                设置
              </Button>
            </div>
          </div>

          {/* 统计卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-950 dark:to-indigo-900 border-none">
              <CardContent className="pt-6 flex flex-col items-center justify-center text-center">
                <div className="w-10 h-10 rounded-full bg-white dark:bg-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-300 mb-2">
                  <LayoutGrid className="h-5 w-5" />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">可用工具总数</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">16</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-none">
              <CardContent className="pt-6 flex flex-col items-center justify-center text-center">
                <div className="w-10 h-10 rounded-full bg-white dark:bg-purple-800 flex items-center justify-center text-purple-600 dark:text-purple-300 mb-2">
                  <Star className="h-5 w-5" />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">收藏的工具</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{favorites.length}</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-950 dark:to-pink-900 border-none">
              <CardContent className="pt-6 flex flex-col items-center justify-center text-center">
                <div className="w-10 h-10 rounded-full bg-white dark:bg-pink-800 flex items-center justify-center text-pink-600 dark:text-pink-300 mb-2">
                  <Clock className="h-5 w-5" />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">最近使用</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{recentTools.length}</p>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900 border-none">
              <CardContent className="pt-6 flex flex-col items-center justify-center text-center">
                <div className="w-10 h-10 rounded-full bg-white dark:bg-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-300 mb-2">
                  <CheckCircle className="h-5 w-5" />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">工具分类</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{TOOL_CATEGORIES.length}</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* 搜索和标签过滤 */}
        <div className="mb-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="搜索工具、功能或描述..."
              value={searchTerm}
              onChange={handleSearch}
              className="pl-10 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
            />
            {searchTerm && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* 标签页 */}
          <ScrollArea className="w-full whitespace-nowrap pb-2">
            <div className="inline-flex gap-2 px-1">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="bg-gray-100 dark:bg-gray-800 p-1 rounded-xl flex flex-wrap gap-1">
                  <TabsTrigger value="all" className="rounded-lg">全部工具</TabsTrigger>
                  <TabsTrigger value="favorites" className="rounded-lg">收藏</TabsTrigger>
                  <TabsTrigger value="recent" className="rounded-lg">最近使用</TabsTrigger>
                  {TOOL_CATEGORIES.map(category => (
                    <TabsTrigger key={category.id} value={category.name} className="rounded-lg flex items-center gap-1">
                      {category.icon}
                      <span>{category.name}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>
          </ScrollArea>
        </div>

        {/* 主内容区域 */}
        {filteredTools.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
              <Search className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              未找到匹配的工具
            </h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md">
              尝试使用不同的搜索词或浏览其他分类
            </p>
            <Button onClick={clearSearch} className="mt-4">
              清除搜索条件
            </Button>
          </div>
        ) : filteredTools.length > 20 ? (
          <VirtualScrollWrapper
            items={filteredTools}
            keyExtractor={(item) => item.id}
            config={{
              itemHeight: 320,
              overscanCount: 5
            }}
          >
            {(visibleItems) => (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {visibleItems.map((tool: any) => renderToolCard(tool))}
              </div>
            )}
          </VirtualScrollWrapper>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredTools.map(tool => renderToolCard(tool))}
          </div>
        )}

        {/* 统计图表 */}
        {(activeTab === 'all' && searchTerm === '') && (
          <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">工具使用分布</CardTitle>
                <CardDescription>按类别统计工具使用情况</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={USAGE_STATS}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {USAGE_STATS.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value}%`, '使用率']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">工具类别统计</CardTitle>
                <CardDescription>各类别包含的工具数量</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={TOOL_CATEGORIES.map(cat => ({
                        name: cat.name,
                        工具数量: cat.tools.length,
                      }))}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="工具数量" fill="#6366f1">
                        {TOOL_CATEGORIES.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* 提示区域 */}
        <div className="mt-8 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-6 border border-indigo-100 dark:border-indigo-800">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <div className="p-3 rounded-full bg-indigo-100 dark:bg-indigo-800/50 text-indigo-600 dark:text-indigo-400">
              <Zap className="h-5 w-5" />
            </div>
            <div className="space-y-2">
              <h3 className="font-medium text-gray-900 dark:text-white">提示</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 max-w-3xl">
                点击工具卡片上的星标可以将工具添加到收藏，方便快速访问常用工具。
                最近使用的工具会显示在最近使用标签下，让您能够快速回到之前使用的功能。
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;