/**
 * @file 工具工作区布局组件
 * @description 实现灵活的工具工作区布局，支持多标签页、工具面板和主工作区域
 * @module industries/ToolWorkspace
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 */

'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger,
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
  Button, ButtonGroup,
  Divider,
  ScrollArea
} from '../ui/';
import {
  LayoutDashboard, FileText, Table, Image, Code, Settings, Users, HelpCircle,
  Moon, Sun, Plus, X, ChevronLeft, ChevronRight, MoreHorizontal, Search,
  Download, Upload, RefreshCcw, Zap, Save, Eye, Filter, Layers,
  PanelLeftOpen, PanelRightClose, Maximize2, Minimize2, Grid
} from 'lucide-react';
import { cn } from '@/YYC_原油/lib/utils';

// 定义工具类型
interface Tool {
  id: string;
  name: string;
  icon: React.ReactNode;
  category: string;
  description: string;
  isFavorite?: boolean;
}

// 定义标签页类型
interface Tab {
  id: string;
  title: string;
  icon?: React.ReactNode;
  content?: React.ReactNode;
  toolId?: string;
  isSaved?: boolean;
  lastAccessed?: Date;
}

// 工具面板属性
interface ToolPanelProps {
  tools: Tool[];
  onSelectTool: (tool: Tool) => void;
  activeToolId?: string;
  className?: string;
}

// 工具面板组件
const ToolPanel: React.FC<ToolPanelProps> = ({ tools, onSelectTool, activeToolId, className }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  // 分类工具
  const categories = ['all', ...Array.from(new Set(tools.map(tool => tool.category)))];

  // 过滤工具
  const filteredTools = tools.filter(tool => {
    const matchesSearch = tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        tool.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'all' || tool.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* 工具面板标题 */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium">工具箱</h3>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>管理收藏</DropdownMenuItem>
              <DropdownMenuItem>添加工具</DropdownMenuItem>
              <DropdownMenuItem>重置布局</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* 搜索框 */}
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索工具..."
            className="pl-8 h-9 text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* 分类标签 */}
      <ScrollArea className="px-3 py-2">
        <div className="flex flex-wrap gap-1.5 mb-2">
          {categories.map(category => (
            <Badge
              key={category}
              variant={activeCategory === category ? 'default' : 'outline'}
              className={`cursor-pointer text-xs ${activeCategory === category ? 'font-medium' : ''}`}
              onClick={() => setActiveCategory(category)}
            >
              {category === 'all' ? '全部' : category}
            </Badge>
          ))}
        </div>
      </ScrollArea>

      {/* 工具列表 */}
      <ScrollArea className="flex-1">
        <div className="px-3 py-2 space-y-1">
          {filteredTools.length > 0 ? (
            filteredTools.map(tool => (
              <TooltipProvider key={tool.id}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant={activeToolId === tool.id ? 'secondary' : 'ghost'}
                      className={`w-full justify-start text-left mb-1 h-10 ${activeToolId === tool.id ? 'bg-primary/10' : ''}`}
                      onClick={() => onSelectTool(tool)}
                    >
                      <span className="mr-2 h-4 w-4">{tool.icon}</span>
                      <span className="font-normal">{tool.name}</span>
                      {tool.isFavorite && <Star className="ml-auto h-3.5 w-3.5 text-amber-500" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>{tool.description}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))
          ) : (
            <div className="text-center py-8 text-sm text-muted-foreground">
              未找到匹配的工具
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

// 工具工作区属性
interface ToolWorkspaceProps {
  className?: string;
  initialTools?: Tool[];
  initialTabs?: Tab[];
  onToolSelect?: (tool: Tool) => void;
  onTabChange?: (tab: Tab) => void;
  children?: React.ReactNode;
}

// 补充缺失的组件
const Input: React.FC<{placeholder?: string, className?: string, value?: string, onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void}> = ({
  placeholder,
  className,
  value,
  onChange
}) => {
  return <input
    type="text"
    placeholder={placeholder}
    className={className}
    value={value}
    onChange={onChange}
  />
}

const Badge: React.FC<{variant?: string, className?: string, onClick?: () => void, children?: React.ReactNode}> = ({
  variant = "default",
  className,
  onClick,
  children
}) => {
  return <button
    variant={variant}
    className={className}
    onClick={onClick}
  >
    {children}
  </button>
}

const Star: React.FC<{className?: string}> = ({ className }) => {
  return <Star className={className} />
}

// 工具工作区主组件
const ToolWorkspace: React.FC<ToolWorkspaceProps> = ({
  className,
  initialTools,
  initialTabs,
  onToolSelect,
  onTabChange,
  children
}) => {
  // 状态管理
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [maximized, setMaximized] = useState(false);
  const [activeTabId, setActiveTabId] = useState<string>('');
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeToolId, setActiveToolId] = useState<string | undefined>(undefined);
  const [tools] = useState<Tool[]>(initialTools || [
    // 默认工具列表
    {
      id: 'data-table',
      name: '数据表格转换',
      icon: <Table className="h-4 w-4" />,
      category: '数据处理',
      description: '转换和处理各种格式的数据表格',
      isFavorite: true
    },
    {
      id: 'text-editor',
      name: '文本编辑器',
      icon: <FileText className="h-4 w-4" />,
      category: '文档处理',
      description: '高级文本编辑和格式化工具',
    },
    {
      id: 'image-processor',
      name: '图像处理',
      icon: <Image className="h-4 w-4" />,
      category: '媒体处理',
      description: '图像编辑、转换和优化工具',
      isFavorite: true
    },
    {
      id: 'code-editor',
      name: '代码编辑器',
      icon: <Code className="h-4 w-4" />,
      category: '开发工具',
      description: '代码编辑和调试工具',
    },
    {
      id: 'dashboard',
      name: '仪表盘',
      icon: <LayoutDashboard className="h-4 w-4" />,
      category: '数据分析',
      description: '数据可视化和分析仪表盘',
      isFavorite: true
    },
    {
      id: 'user-management',
      name: '用户管理',
      icon: <Users className="h-4 w-4" />,
      category: '系统管理',
      description: '用户账户和权限管理',
    },
    {
      id: 'system-settings',
      name: '系统设置',
      icon: <Settings className="h-4 w-4" />,
      category: '系统管理',
      description: '系统配置和偏好设置',
    },
  ]);

  // 引用和效果
  const workspaceRef = useRef<HTMLDivElement>(null);
  const activeTabRef = useRef<string>('');

  // 初始化标签页
  useEffect(() => {
    if (initialTabs && initialTabs.length > 0) {
      setTabs(initialTabs);
      setActiveTabId(initialTabs[0].id);
    } else {
      // 创建默认标签页
      const defaultTab: Tab = {
        id: 'default-1',
        title: '新工作区',
        icon: <FileText className="h-4 w-4" />
      };
      setTabs([defaultTab]);
      setActiveTabId(defaultTab.id);
    }
  }, [initialTabs]);

  // 处理工具选择
  const handleToolSelect = useCallback((tool: Tool) => {
    // 检查是否已有使用该工具的标签页
    const existingTab = tabs.find(tab => tab.toolId === tool.id);
    
    if (existingTab) {
      // 切换到现有标签页
      setActiveTabId(existingTab.id);
    } else {
      // 创建新标签页
      const newTab: Tab = {
        id: `tab-${Date.now()}`,
        title: tool.name,
        icon: tool.icon,
        toolId: tool.id,
        lastAccessed: new Date()
      };
      
      setTabs([...tabs, newTab]);
      setActiveTabId(newTab.id);
    }
    
    setActiveToolId(tool.id);
    onToolSelect?.(tool);
  }, [tabs, onToolSelect]);

  // 处理标签页关闭
  const handleTabClose = useCallback((tabId: string) => {
    const newTabs = tabs.filter(tab => tab.id !== tabId);
    setTabs(newTabs);
    
    // 如果关闭的是活动标签页，切换到另一个标签页
    if (tabId === activeTabId && newTabs.length > 0) {
      setActiveTabId(newTabs[0].id);
    }
  }, [tabs, activeTabId]);

  // 处理新标签页创建
  const handleNewTab = useCallback(() => {
    const newTab: Tab = {
      id: `tab-${Date.now()}`,
      title: '新工作区',
      lastAccessed: new Date()
    };
    
    setTabs([...tabs, newTab]);
    setActiveTabId(newTab.id);
  }, [tabs]);

  // 切换侧边栏
  const toggleSidebar = useCallback(() => {
    setSidebarOpen(!sidebarOpen);
  }, [sidebarOpen]);

  // 切换右侧面板
  const toggleRightPanel = useCallback(() => {
    setRightPanelOpen(!rightPanelOpen);
  }, [rightPanelOpen]);

  // 切换主题
  const toggleTheme = useCallback(() => {
    setDarkMode(!darkMode);
    // 在实际应用中，这里会更新 document.documentElement.classList
  }, [darkMode]);

  // 获取活动标签页
  const activeTab = tabs.find(tab => tab.id === activeTabId);

  return (
    <div 
      ref={workspaceRef}
      className={cn(
        `flex flex-col h-full bg-background text-foreground`,
        maximized && 'fixed inset-0 z-50',
        className
      )}
    >
      {/* 顶部工具栏 */}
      <header className="flex items-center justify-between border-b bg-background/95 backdrop-blur-sm h-12 px-3">
        <div className="flex items-center gap-2">
          {/* 侧边栏切换按钮 */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  onClick={toggleSidebar}
                >
                  {sidebarOpen ? <PanelRightClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{sidebarOpen ? '隐藏工具栏' : '显示工具栏'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* 标签页区域 */}
          <div className="flex items-center overflow-hidden flex-1 max-w-md">
            <ScrollArea className="flex-1 whitespace-nowrap">
              <div className="flex gap-1 px-1">
                {tabs.map(tab => (
                  <div key={tab.id} className="flex items-center">
                    <Button
                      variant={activeTabId === tab.id ? 'secondary' : 'ghost'}
                      size="sm"
                      className={`h-8 px-2 ${activeTabId === tab.id ? 'bg-primary/10' : ''}`}
                      onClick={() => setActiveTabId(tab.id)}
                    >
                      {tab.icon && <span className="mr-1.5">{tab.icon}</span>}
                      <span className="truncate max-w-[120px]">{tab.title}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="ml-1 h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTabClose(tab.id);
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </Button>
                  </div>
                ))}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8 ml-1"
                  onClick={handleNewTab}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* 右侧工具栏 */}
        <div className="flex items-center gap-1">
          {/* 主要操作按钮组 */}
          <ButtonGroup size="sm" variant="ghost">
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Upload className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Download className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <RefreshCcw className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <Save className="h-4 w-4" />
            </Button>
          </ButtonGroup>

          <Divider orientation="vertical" className="h-6" />

          {/* 视图操作按钮组 */}
          <ButtonGroup size="sm" variant="ghost">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={toggleRightPanel}
            >
              {rightPanelOpen ? <Layers className="h-4 w-4" /> : <Grid className="h-4 w-4" />}
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={() => setMaximized(!maximized)}
            >
              {maximized ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={toggleTheme}
            >
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </ButtonGroup>

          {/* 用户菜单 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>保存工作区</DropdownMenuItem>
              <DropdownMenuItem>导出为...</DropdownMenuItem>
              <DropdownMenuItem>共享工作区</DropdownMenuItem>
              <DropdownMenuItem>工作区设置</DropdownMenuItem>
              <DropdownMenuItem>帮助中心</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* 主内容区域 */}
      <div className="flex flex-1 overflow-hidden">
        {/* 左侧工具面板 */}
        {sidebarOpen && (
          <aside className="w-64 border-r bg-background flex flex-col h-full">
            <ToolPanel 
              tools={tools}
              onSelectTool={handleToolSelect}
              activeToolId={activeToolId}
            />
          </aside>
        )}

        {/* 中心工作区域 */}
        <main className={`flex-1 overflow-hidden transition-all ${maximized ? '' : 'p-4'}`}>
          {activeTab ? (
            <div className="h-full bg-card rounded-lg border p-4 flex flex-col">
              {/* 工作区头部 */}
              <div className="flex items-center justify-between mb-4 pb-2 border-b">
                <div className="flex items-center">
                  {activeTab.icon && <span className="mr-2">{activeTab.icon}</span>}
                  <h2 className="text-xl font-semibold">{activeTab.title}</h2>
                  {!activeTab.isSaved && (
                    <Badge variant="outline" className="ml-2 text-xs">未保存</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" className="h-8">
                    <Eye className="h-4 w-4 mr-1" />
                    预览
                  </Button>
                  <Button variant="ghost" size="sm" className="h-8">
                    <Filter className="h-4 w-4 mr-1" />
                    筛选
                  </Button>
                  <Button variant="default" size="sm" className="h-8">
                    <Zap className="h-4 w-4 mr-1" />
                    运行
                  </Button>
                </div>
              </div>

              {/* 工作区内容 */}
              <div className="flex-1 overflow-auto">
                {activeTab.content || (
                  <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                    <FileText className="h-12 w-12 mb-4 opacity-30" />
                    <h3 className="text-lg font-medium mb-2">开始您的工作</h3>
                    <p className="max-w-md mb-4">
                      选择左侧工具栏中的工具开始工作，或从模板创建新项目
                    </p>
                    <ButtonGroup>
                      <Button variant="default" onClick={handleNewTab}>
                        <Plus className="h-4 w-4 mr-2" />
                        新建文件
                      </Button>
                      <Button variant="outline">
                        从模板开始
                      </Button>
                    </ButtonGroup>
                  </div>
                )}
                {children}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              无活动工作区
            </div>
          )}
        </main>

        {/* 右侧属性面板 */}
        {rightPanelOpen && (
          <aside className="w-72 border-l bg-background flex flex-col h-full">
            <div className="p-4 border-b">
              <h3 className="font-medium mb-2">属性面板</h3>
              <p className="text-xs text-muted-foreground">
                自定义当前工作区的设置和属性
              </p>
            </div>
            <ScrollArea className="flex-1 p-4 space-y-4">
              <div className="space-y-2">
                <h4 className="text-sm font-medium">基本设置</h4>
                <div className="space-y-2">
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">标题</label>
                    <Input 
                      className="h-9"
                      value={activeTab?.title || ''}
                      onChange={(e) => {
                        if (activeTab) {
                          const updatedTabs = tabs.map(t => 
                            t.id === activeTab.id ? { ...t, title: e.target.value } : t
                          );
                          setTabs(updatedTabs);
                        }
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">描述</label>
                    <textarea 
                      className="w-full h-20 p-2 border rounded-md text-sm resize-none"
                      placeholder="添加工作区描述..."
                    />
                  </div>
                </div>
              </div>
              
              <Divider />
              
              <div className="space-y-2">
                <h4 className="text-sm font-medium">外观设置</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs">暗色主题</label>
                    <Button variant="outline" size="sm" onClick={toggleTheme}>
                      {darkMode ? '启用' : '禁用'}
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-xs">网格布局</label>
                    <Button variant="outline" size="sm">
                      启用
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="text-xs">自动保存</label>
                    <Button variant="default" size="sm">
                      已启用
                    </Button>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </aside>
        )}
      </div>
    </div>
  );
};

export { ToolWorkspace, ToolPanel, type Tool, type Tab };
