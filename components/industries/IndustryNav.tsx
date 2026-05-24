/**
 * @file 行业导航组件
 * @description 实现左侧智能导航栏，支持23个行业分类的导航功能
 * @module industries/IndustryNav
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 */

'use client'

import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, Search, Home, Settings, HelpCircle } from 'lucide-react';
import { cn } from '@/YYC_原油/lib/utils';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Separator } from '../ui/separator';
import { Sheet, SheetContent, SheetTrigger } from '../ui/sheet';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';

// 行业数据类型定义
interface Industry {
  id: string;
  name: string;
  color: string;
  icon: React.ReactNode;
  description: string;
  features: string[];
  active: boolean;
}

// 行业导航项组件
interface IndustryNavItemProps {
  industry: Industry;
  isExpanded: boolean;
  onToggle: (id: string) => void;
  onClick: (industry: Industry) => void;
  level?: number;
}

const IndustryNavItem: React.FC<IndustryNavItemProps> = ({
  industry,
  isExpanded,
  onToggle,
  onClick,
  level = 0,
}) => {
  const [hovered, setHovered] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => onClick(industry)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={cn(
          'w-full flex items-center justify-between px-4 py-2 rounded-md transition-colors group relative overflow-hidden',
          industry.active
            ? 'bg-primary/10 text-primary font-medium'
            : 'hover:bg-accent text-muted-foreground hover:text-foreground'
        )}
        style={{
          paddingLeft: `${16 + level * 12}px`,
          borderLeft: industry.active ? `3px solid ${industry.color}` : '3px solid transparent',
        }}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-md" style={{ backgroundColor: `${industry.color}20` }}>
            {industry.icon}
          </div>
          <span className="text-sm font-medium truncate">{industry.name}</span>
          {industry.features.length > 0 && (
            <Badge variant="secondary" className="ml-auto text-xs">
              {industry.features.length}
            </Badge>
          )}
        </div>
        
        {industry.features.length > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggle(industry.id);
            }}
            className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-accent/50 transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        )}
      </button>

      {/* 悬停预览面板 */}
      {hovered && (
        <div
          className="absolute left-full ml-2 top-0 w-64 bg-background border border-border rounded-lg shadow-lg p-4 z-50"
          style={{ display: level > 0 ? 'none' : 'block' }}
        >
          <div 
            className="h-2 w-16 rounded-full mb-2" 
            style={{ backgroundColor: industry.color }} 
          />
          <h3 className="font-semibold text-sm mb-1">{industry.name}</h3>
          <p className="text-xs text-muted-foreground mb-3">{industry.description}</p>
          {industry.features.slice(0, 3).map((feature, index) => (
            <div key={index} className="text-xs text-muted-foreground mb-1 flex items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-primary mr-2"></span>
              {feature}
            </div>
          ))}
        </div>
      )}

      {/* 子菜单 */}
      {isExpanded && industry.features.length > 0 && (
        <div className="mt-1 ml-4 border-l border-border border-dashed pl-2">
          {industry.features.map((feature, index) => (
            <button
              key={index}
              className="w-full text-left px-3 py-1.5 text-xs rounded-md transition-colors hover:bg-accent text-muted-foreground hover:text-foreground"
              onClick={(e) => {
                e.stopPropagation();
                // 这里可以处理子项点击事件
                console.log(`Clicked feature: ${feature} in ${industry.name}`);
              }}
            >
              {feature}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// 行业导航主组件
interface IndustryNavProps {
  className?: string;
  onIndustrySelect: (industry: Industry) => void;
  mobile?: boolean;
}

const IndustryNav: React.FC<IndustryNavProps> = ({
  className,
  onIndustrySelect,
  mobile = false,
}) => {
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // 示例行业数据 - 23个行业分类
  const industries: Industry[] = [
    {
      id: 'ai',
      name: '人工智能',
      color: '#4F46E5',
      icon: <span className="text-indigo-600">🤖</span>,
      description: 'AI驱动的数据处理、模型训练与推理平台',
      features: ['智能数据标注', '模型训练', '推理部署'],
      active: false,
    },
    {
      id: 'finance',
      name: '金融科技',
      color: '#10B981',
      icon: <span className="text-emerald-600">💰</span>,
      description: '金融数据分析、风险管理与投资决策工具',
      features: ['财务分析', '风险评估', '投资组合优化'],
      active: false,
    },
    {
      id: 'retail',
      name: '零售电商',
      color: '#F59E0B',
      icon: <span className="text-amber-600">🛍️</span>,
      description: '电商运营、库存管理与客户分析系统',
      features: ['销售分析', '库存管理', '客户画像'],
      active: false,
    },
    {
      id: 'healthcare',
      name: '医疗健康',
      color: '#EF4444',
      icon: <span className="text-red-600">🏥</span>,
      description: '医疗数据管理、患者分析与健康追踪',
      features: ['病历管理', '健康数据分析', '预约系统'],
      active: false,
    },
    {
      id: 'education',
      name: '教育培训',
      color: '#8B5CF6',
      icon: <span className="text-purple-600">🎓</span>,
      description: '在线教育平台、学习数据分析与个性化推荐',
      features: ['课程管理', '学习分析', '智能推荐'],
      active: false,
    },
    {
      id: 'manufacturing',
      name: '制造业',
      color: '#6B7280',
      icon: <span className="text-slate-600">🏭</span>,
      description: '生产管理、供应链优化与质量控制',
      features: ['生产监控', '供应链管理', '质量控制'],
      active: false,
    },
    // 可以继续添加更多行业...
  ];

  // 过滤行业
  const filteredIndustries = industries.filter(industry =>
    industry.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    industry.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 处理展开/折叠
  const handleToggle = (id: string) => {
    setExpandedItems(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // 处理行业选择
  const handleIndustryClick = (industry: Industry) => {
    // 更新选中状态
    const updatedIndustries = industries.map(ind => ({
      ...ind,
      active: ind.id === industry.id,
    }));
    
    // 调用回调函数
    onIndustrySelect(industry);
    
    // 在移动设备上关闭侧边栏
    if (mobile) {
      setSidebarOpen(false);
    }
  };

  // 处理侧边栏切换
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // 移动设备侧边栏渲染
  if (mobile) {
    return (
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 12H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M3 6H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M3 18H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[280px] sm:w-[350px] p-0">
          <IndustryNavContent 
            industries={filteredIndustries}
            expandedItems={expandedItems}
            onToggle={handleToggle}
            onIndustryClick={handleIndustryClick}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
        </SheetContent>
      </Sheet>
    );
  }

  // 桌面设备侧边栏渲染
  return (
    <div className={cn('border-r border-border h-full flex flex-col', className)}>
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h2 className="font-bold text-lg">行业导航</h2>
        <Button variant="ghost" size="icon" onClick={toggleSidebar}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 12H21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Button>
      </div>
      
      <div className="p-4 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索行业..."
            className="pl-10 h-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      <ScrollArea className="flex-1 p-4 space-y-1">
        {/* 快捷导航 */}
        <div className="space-y-1 mb-4">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 mb-2">快捷导航</h3>
          <Button variant="ghost" className="w-full justify-start gap-3 px-4 py-2 h-10 text-sm">
            <Home className="h-4 w-4" />
            <span>首页</span>
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-3 px-4 py-2 h-10 text-sm">
            <Settings className="h-4 w-4" />
            <span>设置</span>
          </Button>
          <Button variant="ghost" className="w-full justify-start gap-3 px-4 py-2 h-10 text-sm">
            <HelpCircle className="h-4 w-4" />
            <span>帮助</span>
          </Button>
        </div>
        
        <Separator className="my-4" />
        
        {/* 行业列表 */}
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 mb-2">所有行业</h3>
          {filteredIndustries.length > 0 ? (
            filteredIndustries.map((industry) => (
              <IndustryNavItem
                key={industry.id}
                industry={industry}
                isExpanded={!!expandedItems[industry.id]}
                onToggle={handleToggle}
                onClick={handleIndustryClick}
              />
            ))
          ) : (
            <div className="text-center py-8 text-sm text-muted-foreground">
              未找到匹配的行业
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

// 导航内容组件 - 用于移动和桌面共享
interface IndustryNavContentProps {
  industries: Industry[];
  expandedItems: Record<string, boolean>;
  onToggle: (id: string) => void;
  onIndustryClick: (industry: Industry) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const IndustryNavContent: React.FC<IndustryNavContentProps> = ({
  industries,
  expandedItems,
  onToggle,
  onIndustryClick,
  searchQuery,
  setSearchQuery,
}) => {
  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <h2 className="font-bold text-lg mb-3">行业导航</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索行业..."
            className="pl-10 h-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      <ScrollArea className="flex-1 p-4 space-y-1">
        <div className="space-y-1 mb-4">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 mb-2">快捷导航</h3>
          <Button variant="ghost" className="w-full justify-start gap-3 px-4 py-2 h-10 text-sm">
            <Home className="h-4 w-4" />
            <span>首页</span>
          </Button>
        </div>
        
        <Separator className="my-4" />
        
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-4 mb-2">所有行业</h3>
          {industries.length > 0 ? (
            industries.map((industry) => (
              <IndustryNavItem
                key={industry.id}
                industry={industry}
                isExpanded={!!expandedItems[industry.id]}
                onToggle={onToggle}
                onClick={onIndustryClick}
              />
            ))
          ) : (
            <div className="text-center py-8 text-sm text-muted-foreground">
              未找到匹配的行业
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export { IndustryNav, IndustryNavItem };
export type { Industry };
