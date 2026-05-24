/**
 * @file 行业拓展页面
 * @description 通用行业数据处理与拓展平台
 * @module app/industries/page
 * @author YYC
 * @version 1.0.0
 * @created 2026-02-22
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Header } from '@/components/Header';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  BarChart3, 
  PieChart, 
  LineChart,
  Settings,
  Plug,
  Database,
  Activity,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import { industryService, IndustryConfig, IndustryDashboard } from './services/industryService';
import { IndustryType } from './types';

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string | undefined;
  trend?: 'up' | 'down' | 'stable' | undefined;
  change?: number | undefined;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, unit, trend, change }) => {
  const getTrendIcon = () => {
    if (trend === 'up') return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (trend === 'down') return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-gray-500" />;
  };

  const getTrendColor = () => {
    if (trend === 'up') return 'text-green-500';
    if (trend === 'down') return 'text-red-500';
    return 'text-gray-500';
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="pt-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">
              {value}
              {unit && <span className="text-sm font-normal text-muted-foreground ml-1">{unit}</span>}
            </p>
          </div>
          {trend && (
            <div className={`flex items-center gap-1 ${getTrendColor()}`}>
              {getTrendIcon()}
              {change !== undefined && <span className="text-sm">{change}%</span>}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const IndustryCard: React.FC<{ config: IndustryConfig }> = ({ config }) => {
  return (
    <Link href={`/industries/${config.type}`}>
      <Card className="hover:shadow-lg transition-all hover:scale-[1.02] cursor-pointer h-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <span className="text-4xl">{config.icon}</span>
            <Badge variant="outline" style={{ borderColor: config.color, color: config.color }}>
              {config.type}
            </Badge>
          </div>
          <CardTitle className="mt-4">{config.name}</CardTitle>
          <CardDescription>{config.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {config.features.slice(0, 3).map((feature, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {feature}
                </Badge>
              ))}
              {config.features.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{config.features.length - 3}
                </Badge>
              )}
            </div>
            <div className="flex items-center text-sm text-muted-foreground">
              <span>{config.tools.length} 个工具</span>
              <span className="mx-2">•</span>
              <span>{config.plugins.length} 个插件</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
};

export default function IndustriesPage() {
  const [industries, setIndustries] = useState<IndustryConfig[]>([]);
  const [selectedIndustry, setSelectedIndustry] = useState<IndustryType>(IndustryType.RETAIL);
  const [dashboard, setDashboard] = useState<IndustryDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  const loadDashboard = async (type: IndustryType) => {
    setLoading(true);
    try {
      const result = await industryService.getIndustryDashboard(type);
      if (result.success && result.data) {
        setDashboard(result.data);
      }
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const allIndustries = industryService.getAllIndustries();
    setIndustries(allIndustries);
    void loadDashboard(IndustryType.RETAIL);
  }, []);

  const handleIndustrySelect = (type: IndustryType) => {
    setSelectedIndustry(type);
    void loadDashboard(type);
  };

  const getChartIcon = (type: string) => {
    switch (type) {
      case 'line':
        return <LineChart className="w-5 h-5" />;
      case 'pie':
        return <PieChart className="w-5 h-5" />;
      case 'bar':
        return <BarChart3 className="w-5 h-5" />;
      default:
        return <Activity className="w-5 h-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto pt-20 pb-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">行业数据处理平台</h1>
          <p className="text-muted-foreground mt-2">
            统一的行业数据处理与拓展接口，支持多行业插件化扩展
          </p>
        </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">行业概览</TabsTrigger>
          <TabsTrigger value="dashboard">数据仪表盘</TabsTrigger>
          <TabsTrigger value="plugins">插件管理</TabsTrigger>
          <TabsTrigger value="api">API 接口</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {industries.map((industry) => (
              <IndustryCard key={industry.type} config={industry} />
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                行业模块接口说明
              </CardTitle>
              <CardDescription>
                统一的行业数据处理服务接口，支持动态扩展
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-4 rounded-lg font-mono text-sm">
                <p className="text-muted-foreground mb-2">{'// 获取所有行业配置'}</p>
                <p>const industries = industryService.getAllIndustries();</p>
                <p className="mt-4 text-muted-foreground mb-2">{'// 获取行业仪表盘数据'}</p>
                <p>const dashboard = await industryService.getIndustryDashboard(type);</p>
                <p className="mt-4 text-muted-foreground mb-2">{'// 获取行业工具列表'}</p>
                <p>const tools = industryService.getIndustryTools(type);</p>
                <p className="mt-4 text-muted-foreground mb-2">{'// 插件注册'}</p>
                <p>industryService.registerPlugin(plugin);</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dashboard" className="space-y-6">
          <div className="flex gap-2 flex-wrap">
            {industries.map((industry) => (
              <Button
                key={industry.type}
                variant={selectedIndustry === industry.type ? 'default' : 'outline'}
                onClick={() => handleIndustrySelect(industry.type)}
                className="gap-2"
              >
                <span>{industry.icon}</span>
                {industry.name}
              </Button>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-muted-foreground">加载中...</p>
              </div>
            </div>
          ) : dashboard ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {dashboard.metrics.map((metric) => (
                  <MetricCard
                    key={metric.id}
                    title={metric.name}
                    value={metric.value}
                    unit={metric.unit}
                    trend={metric.trend}
                    change={metric.change}
                  />
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {dashboard.charts.map((chart) => (
                  <Card key={chart.id}>
                    <CardHeader className="flex flex-row items-center gap-2">
                      {getChartIcon(chart.type)}
                      <CardTitle className="text-lg">{chart.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-48 flex items-center justify-center bg-muted rounded-lg">
                        <p className="text-muted-foreground">[图表: {chart.type}]</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>可用工具</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {dashboard.tools.map((tool) => (
                      <Button key={tool.id} variant="outline" className="justify-between">
                        <span className="flex items-center gap-2">
                          <span>{tool.icon}</span>
                          {tool.name}
                        </span>
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : null}
        </TabsContent>

        <TabsContent value="plugins" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plug className="w-5 h-5" />
                插件管理系统
              </CardTitle>
              <CardDescription>
                管理行业拓展插件，支持动态启用/禁用
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {industries.map((industry) => (
                  <div key={industry.type} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{industry.icon}</span>
                        <span className="font-semibold">{industry.name}</span>
                      </div>
                      <Badge>{industry.plugins.length} 插件</Badge>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {industry.plugins.map((plugin) => (
                        <Badge key={plugin} variant="outline">
                          {plugin}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                API 接口文档
              </CardTitle>
              <CardDescription>
                行业模块提供的统一接口
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-semibold mb-2">获取行业列表</h4>
                <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
{`GET /api/industries
Response: IndustryConfig[]`}
                </pre>
              </div>
              <div>
                <h4 className="font-semibold mb-2">获取行业仪表盘</h4>
                <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
{`GET /api/industries/:type/dashboard
Response: IndustryDashboard`}
                </pre>
              </div>
              <div>
                <h4 className="font-semibold mb-2">获取行业数据</h4>
                <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
{`POST /api/industries/data
Body: { industryType, page, pageSize, filters }
Response: IndustryResponse<IndustryData[]>`}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
}
