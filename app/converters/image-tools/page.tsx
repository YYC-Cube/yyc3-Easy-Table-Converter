/**
 * @file 图片工具中心页面
 * @description 统一的图片处理工具中心，整合所有图片处理功能
 * @module app/converters/image-tools/page
 * @author YYC
 * @version 1.0.0
 * @created 2026-02-22
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ImageIcon, 
  Crop, 
  RotateCw, 
  Maximize, 
  Palette, 
  Sparkles,
  Download,
  Upload,
  FileImage,
  Workflow,
  ArrowRight,
  Database,
  FileSpreadsheet,
  Layers
} from 'lucide-react';

interface ToolCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  href: string;
  badge?: string;
}

const ToolCard: React.FC<ToolCardProps> = ({ title, description, icon, href, badge }) => (
  <Link href={href}>
    <Card className="h-full hover:shadow-lg transition-all hover:border-primary/50 cursor-pointer group">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
            {icon}
          </div>
          {badge && (
            <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
              {badge}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <CardTitle className="text-lg mb-1 group-hover:text-primary transition-colors">{title}</CardTitle>
        <CardDescription className="text-sm">{description}</CardDescription>
      </CardContent>
    </Card>
  </Link>
);

const imageTools = [
  {
    category: '基础处理',
    tools: [
      {
        title: '图片转换',
        description: '支持 JPG、PNG、WebP 等多种格式互转',
        icon: <ImageIcon className="w-5 h-5" />,
        href: '/converters/image',
        badge: '常用'
      },
      {
        title: '图片裁剪',
        description: '自定义裁剪区域和比例',
        icon: <Crop className="w-5 h-5" />,
        href: '/converters/image-crop'
      },
      {
        title: '图片旋转',
        description: '任意角度旋转和翻转',
        icon: <RotateCw className="w-5 h-5" />,
        href: '/converters/image-rotate'
      },
      {
        title: '图片缩放',
        description: '调整图片尺寸和分辨率',
        icon: <Maximize className="w-5 h-5" />,
        href: '/converters/image-resize'
      },
    ]
  },
  {
    category: '高级处理',
    tools: [
      {
        title: '图片压缩',
        description: '智能压缩，保持质量减小体积',
        icon: <Download className="w-5 h-5" />,
        href: '/converters/image-compress'
      },
      {
        title: '图片滤镜',
        description: '添加各种滤镜效果',
        icon: <Palette className="w-5 h-5" />,
        href: '/converters/image-filter'
      },
      {
        title: '图片增强',
        description: '亮度、对比度、锐化等调整',
        icon: <Sparkles className="w-5 h-5" />,
        href: '/converters/image-enhance'
      },
      {
        title: '图片编辑器',
        description: '完整的图片编辑功能',
        icon: <FileImage className="w-5 h-5" />,
        href: '/converters/image-editor'
      },
    ]
  },
  {
    category: 'AI 功能',
    tools: [
      {
        title: 'AI 抠图',
        description: '智能识别并移除背景',
        icon: <Sparkles className="w-5 h-5" />,
        href: '/converters/ai-background-remover',
        badge: 'AI'
      },
      {
        title: 'AI 风格迁移',
        description: '将图片转换为不同艺术风格',
        icon: <Workflow className="w-5 h-5" />,
        href: '/converters/ai-style-transfer',
        badge: 'AI'
      },
      {
        title: '头像生成器',
        description: '生成精美的 initials 头像',
        icon: <Upload className="w-5 h-5" />,
        href: '/user/avatar',
        badge: '新功能'
      },
    ]
  },
  {
    category: '数据工具',
    tools: [
      {
        title: 'SQL 生成器',
        description: 'JSON/CSV 转 SQL 语句',
        icon: <Database className="w-5 h-5" />,
        href: '/converters/sql-generator',
        badge: '新功能'
      },
      {
        title: 'Excel 高级转换',
        description: 'Excel 与多格式互转，保留公式',
        icon: <FileSpreadsheet className="w-5 h-5" />,
        href: '/converters/excel-advanced',
        badge: '新功能'
      },
      {
        title: '批量转换',
        description: '批量处理多个文件',
        icon: <Layers className="w-5 h-5" />,
        href: '/converters/batch',
      },
    ]
  }
];

export default function ImageToolsPage() {
  const [activeTab, setActiveTab] = useState('all');

  const filteredTools = activeTab === 'all' 
    ? imageTools 
    : imageTools.filter(cat => cat.category.toLowerCase().includes(activeTab));

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">图片工具中心</h1>
        <p className="text-muted-foreground">
          一站式图片处理解决方案，支持格式转换、编辑优化、AI 增强等功能
        </p>
      </div>

      <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="all">全部工具</TabsTrigger>
          <TabsTrigger value="basic">基础处理</TabsTrigger>
          <TabsTrigger value="advanced">高级处理</TabsTrigger>
          <TabsTrigger value="ai">AI 功能</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-8">
          {filteredTools.map((category) => (
            <div key={category.category}>
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-xl font-semibold">{category.category}</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {category.tools.map((tool) => (
                  <ToolCard
                    key={tool.href}
                    title={tool.title}
                    description={tool.description}
                    icon={tool.icon}
                    href={tool.href}
                    badge={tool.badge}
                  />
                ))}
              </div>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="basic" className="space-y-8">
          {filteredTools.filter(c => c.category.toLowerCase().includes('基础')).map((category) => (
            <div key={category.category}>
              <h2 className="text-xl font-semibold mb-4">{category.category}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {category.tools.map((tool) => (
                  <ToolCard key={tool.href} title={tool.title} description={tool.description} icon={tool.icon} href={tool.href} badge={tool.badge} />
                ))}
              </div>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="advanced" className="space-y-8">
          {filteredTools.filter(c => c.category.toLowerCase().includes('高级')).map((category) => (
            <div key={category.category}>
              <h2 className="text-xl font-semibold mb-4">{category.category}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {category.tools.map((tool) => (
                  <ToolCard key={tool.href} title={tool.title} description={tool.description} icon={tool.icon} href={tool.href} badge={tool.badge} />
                ))}
              </div>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="ai" className="space-y-8">
          {filteredTools.filter(c => c.category.toLowerCase().includes('ai')).map((category) => (
            <div key={category.category}>
              <h2 className="text-xl font-semibold mb-4">{category.category}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {category.tools.map((tool) => (
                  <ToolCard key={tool.href} title={tool.title} description={tool.description} icon={tool.icon} href={tool.href} badge={tool.badge} />
                ))}
              </div>
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
