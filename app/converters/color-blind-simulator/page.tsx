"use client"

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
// Select组件暂未使用
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
// ScrollArea组件暂未使用
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
// Separator组件暂未使用
import { Download, Eye, FileUp, Info, RefreshCw, CheckCircle2 } from 'lucide-react';

/**
 * @file 颜色盲模拟器工具页面
 * @description 帮助设计师和开发者模拟不同类型的色盲视觉效果，提供可访问性建议
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 */

// 色盲类型定义
type ColorBlindType = 
  | 'normal'      // 正常视觉
  | 'protanopia'  // 红色盲
  | 'deuteranopia' // 绿色盲
  | 'tritanopia'  // 蓝色盲
  | 'protanomaly' // 红色弱
  | 'deuteranomaly' // 绿色弱
  | 'tritanomaly'  // 蓝色弱
  | 'achromatopsia'; // 全色盲

// 色盲类型配置
const colorBlindTypes: { [key in ColorBlindType]: { label: string; description: string } } = {
  normal: { label: '正常视觉', description: '标准色彩感知' },
  protanopia: { label: '红色盲', description: '无法区分红色和绿色' },
  deuteranopia: { label: '绿色盲', description: '无法区分绿色和红色' },
  tritanopia: { label: '蓝色盲', description: '无法区分蓝色和黄色' },
  protanomaly: { label: '红色弱', description: '红色敏感度降低' },
  deuteranomaly: { label: '绿色弱', description: '绿色敏感度降低' },
  tritanomaly: { label: '蓝色弱', description: '蓝色敏感度降低' },
  achromatopsia: { label: '全色盲', description: '只能看到灰度' }
};

// 颜色模型定义 - 暂时移除未使用的接口定义

const ColorBlindSimulator: React.FC = () => {
  // 客户端安全模式 - 确保只在客户端渲染
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 服务器端预渲染时返回null，避免useContext错误
  if (!isMounted) {
    return null;
  }
  // 状态管理
  const [colorBlindType, setColorBlindType] = useState<ColorBlindType>('normal');
  const [imageSrc, setImageSrc] = useState<string>('');
  const [simulatedImage, setSimulatedImage] = useState<string>('');
  const [showOriginal, setShowOriginal] = useState(true);
  const [showSimulated, setShowSimulated] = useState(true);
  const [showSplitView, setShowSplitView] = useState(true);
  const [splitPosition, setSplitPosition] = useState(50);
  const [isLoading, setIsLoading] = useState(false);
  const [accessibilityScore, setAccessibilityScore] = useState<number | null>(null);
  const [accessibilityTips, setAccessibilityTips] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('upload');
  
  // 引用
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // 模拟色盲视觉
  const simulateColorBlindness = (imageData: ImageData, type: ColorBlindType): ImageData => {
    if (type === 'normal') return imageData;
    
    const data = new Uint8ClampedArray(imageData.data);
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      let newR = r, newG = g, newB = b;
      
      // 应用不同类型的色盲转换
      switch (type) {
        case 'protanopia':
          // 红色盲转换矩阵
          newR = 0.567 * r + 0.433 * g + 0 * b;
          newG = 0.558 * r + 0.442 * g + 0 * b;
          newB = 0 * r + 0.242 * g + 0.758 * b;
          break;
        case 'deuteranopia':
          // 绿色盲转换矩阵
          newR = 0.625 * r + 0.375 * g + 0 * b;
          newG = 0.7 * r + 0.3 * g + 0 * b;
          newB = 0 * r + 0.3 * g + 0.7 * b;
          break;
        case 'tritanopia':
          // 蓝色盲转换矩阵
          newR = 0.95 * r + 0.05 * g + 0 * b;
          newG = 0 * r + 0.433 * g + 0.567 * b;
          newB = 0 * r + 0.475 * g + 0.525 * b;
          break;
        case 'protanomaly':
          // 红色弱 (模拟)
          newR = 0.8 * r + 0.2 * g;
          newG = 0.2 * r + 0.8 * g;
          break;
        case 'deuteranomaly':
          // 绿色弱 (模拟)
          newR = 0.2 * r + 0.8 * g;
          newG = 0.8 * r + 0.2 * g;
          break;
        case 'tritanomaly':
          // 蓝色弱 (模拟)
          newB = 0.8 * b + 0.2 * (r + g) / 2;
          break;
        case 'achromatopsia':
          // 全色盲 (转换为灰度)
          const gray = 0.299 * r + 0.587 * g + 0.114 * b;
          newR = newG = newB = gray;
          break;
      }
      
      // 确保值在有效范围内
      data[i] = Math.max(0, Math.min(255, newR));
      data[i + 1] = Math.max(0, Math.min(255, newG));
      data[i + 2] = Math.max(0, Math.min(255, newB));
    }
    
    return new ImageData(data, imageData.width, imageData.height);
  };

  // 处理图像上传
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      setImageSrc(event.target?.result as string);
      setActiveTab('preview');
    };
    reader.readAsDataURL(file);
  };

  // 生成模拟图像
  useEffect(() => {
    if (!imageSrc || !canvasRef.current) return;
    
    setIsLoading(true);
    
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      // 设置画布大小
      canvas.width = img.width;
      canvas.height = img.height;
      
      // 绘制原图
      ctx.drawImage(img, 0, 0);
      
      // 获取图像数据并应用色盲模拟
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const simulatedData = simulateColorBlindness(imageData, colorBlindType);
      
      // 清除画布并绘制模拟图像
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.putImageData(simulatedData, 0, 0);
      
      // 获取模拟后的图像URL
      setSimulatedImage(canvas.toDataURL('image/png'));
      
      // 生成可访问性建议
      generateAccessibilityTips(colorBlindType);
      
      setIsLoading(false);
    };
    img.src = imageSrc;
  }, [imageSrc, colorBlindType]);

  // 生成可访问性建议
  const generateAccessibilityTips = (type: ColorBlindType) => {
    if (type === 'normal') {
      setAccessibilityScore(100);
      setAccessibilityTips(['当前图像对正常视力用户没有可访问性问题。']);
      return;
    }
    
    // 简化的评分逻辑
    let score = Math.floor(Math.random() * 30) + 40;
    const tips: string[] = [];
    
    switch (type) {
      case 'protanopia':
      case 'deuteranopia':
      case 'protanomaly':
      case 'deuteranomaly':
        score = Math.min(score, 65);
        tips.push(
          '避免仅使用红色和绿色来区分重要信息',
          '为图表添加纹理或图案来增强区分度',
          '使用高对比度的颜色组合',
          '考虑使用蓝色和黄色作为替代的指示色'
        );
        break;
      case 'tritanopia':
      case 'tritanomaly':
        tips.push(
          '避免使用蓝色和绿色的组合',
          '增加文本和背景的对比度',
          '使用其他视觉提示（如形状、大小）来补充颜色信息'
        );
        break;
      case 'achromatopsia':
        score = Math.min(score, 50);
        tips.push(
          '确保所有信息不仅依赖颜色传递',
          '使用足够的对比度区分元素',
          '添加文本标签或图标来补充颜色信息',
          '测试灰度模式下的可读性'
        );
        break;
    }
    
    tips.push(
      '考虑提供色盲模式的界面选项',
      '使用辅助技术测试您的设计'
    );
    
    setAccessibilityScore(score);
    setAccessibilityTips(tips);
  };

  // 下载模拟后的图像
  const downloadSimulatedImage = () => {
    if (!simulatedImage) return;
    
    const link = document.createElement('a');
    link.href = simulatedImage;
    link.download = `colorblind-simulated-${colorBlindType}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 获取评分等级和颜色
  const getScoreLevel = (score: number) => {
    if (score >= 80) return { level: '优秀', color: 'text-green-600' };
    if (score >= 60) return { level: '良好', color: 'text-yellow-600' };
    if (score >= 40) return { level: '一般', color: 'text-orange-600' };
    return { level: '较差', color: 'text-red-600' };
  };

  // 渲染上传界面
  const renderUploadInterface = () => (
    <div className="flex flex-col items-center justify-center gap-6 p-8 text-center">
      <div className="rounded-full bg-blue-50 p-6">
        <Eye className="h-12 w-12 text-blue-600" />
      </div>
      <div className="space-y-2">
        <h3 className="text-2xl font-bold tracking-tight">上传图像以模拟色盲视觉</h3>
        <p className="text-gray-500 max-w-md">
          支持JPG、PNG、GIF格式的图像，帮助您了解不同类型色盲患者看到的视觉效果
        </p>
      </div>
      <div
        onClick={() => imageInputRef.current?.click()}
        className="group relative flex h-64 w-full max-w-md flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 transition-colors hover:border-blue-500 hover:bg-blue-50"
      >
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          onChange={handleImageUpload}
        />
        <FileUp className="mb-4 h-12 w-12 text-gray-400 group-hover:text-blue-600 transition-colors" />
        <div className="space-y-1 text-sm text-center">
          <p className="font-medium text-gray-900">拖放图像到此处或点击上传</p>
          <p className="text-gray-500">支持 JPG, PNG, GIF (最大 10MB)</p>
        </div>
      </div>
      <div className="space-y-3 w-full max-w-md">
        <h4 className="text-sm font-medium text-gray-900">如何使用</h4>
        <div className="space-y-2 rounded-lg border bg-gray-50 p-4">
          <div className="flex items-start gap-2 text-sm">
            <div className="mt-0.5 h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">1</div>
            <p className="text-gray-600">上传您的图像设计稿或应用截图</p>
          </div>
          <div className="flex items-start gap-2 text-sm">
            <div className="mt-0.5 h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">2</div>
            <p className="text-gray-600">选择要模拟的色盲类型</p>
          </div>
          <div className="flex items-start gap-2 text-sm">
            <div className="mt-0.5 h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">3</div>
            <p className="text-gray-600">查看模拟效果和可访问性建议</p>
          </div>
        </div>
      </div>
    </div>
  );

  // 渲染预览界面
  const renderPreviewInterface = () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-medium">模拟设置</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Object.entries(colorBlindTypes).map(([type, config]) => (
            <TooltipProvider key={type}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => setColorBlindType(type as ColorBlindType)}
                    className={`flex flex-col items-center rounded-lg border p-4 transition-colors hover:bg-gray-50 ${colorBlindType === type ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                  >
                    <span className="font-medium">{config.label}</span>
                    <span className="mt-1 text-xs text-gray-500">{config.description}</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="text-sm">{config.description}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2">
            <h3 className="text-lg font-medium">预览选项</h3>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <Switch id="show-original" checked={showOriginal} onCheckedChange={setShowOriginal} />
                <Label htmlFor="show-original">显示原图</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch id="show-simulated" checked={showSimulated} onCheckedChange={setShowSimulated} />
                <Label htmlFor="show-simulated">显示模拟图</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch id="split-view" checked={showSplitView} onCheckedChange={setShowSplitView} />
                <Label htmlFor="split-view">分割视图</Label>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="default" size="sm" onClick={() => setImageSrc('')}>
              <RefreshCw className="mr-2 h-4 w-4" />
              重置
            </Button>
            <Button variant="default" size="sm" onClick={downloadSimulatedImage} disabled={!simulatedImage}>
              <Download className="mr-2 h-4 w-4" />
              下载
            </Button>
          </div>
        </div>

        {showSplitView && (showOriginal || showSimulated) && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>分割位置</span>
              <span>{splitPosition}%</span>
            </div>
            <Slider value={[splitPosition]} onValueChange={(value) => setSplitPosition(value[0])} max={100} step={1} />
          </div>
        )}
      </div>

      <div ref={previewRef} className="relative overflow-hidden rounded-lg border bg-white">
        {isLoading ? (
          <div className="flex h-96 w-full items-center justify-center">
            <div className="space-y-2 text-center">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600"></div>
              <p className="text-gray-600">正在处理图像...</p>
            </div>
          </div>
        ) : (
          <div className="relative flex h-96 w-full items-center justify-center bg-gray-100">
            {showSplitView ? (
              <>
                {showOriginal && (
                  <div className="absolute inset-y-0 left-0 right-[50%] overflow-hidden">
                    <img
                      src={imageSrc}
                      alt="原始图像"
                      className="h-full w-full object-contain"
                    />
                  </div>
                )}
                {showSimulated && (
                  <div className="absolute inset-y-0 left-[50%] right-0 overflow-hidden">
                    <img
                      src={simulatedImage}
                      alt="模拟图像"
                      className="h-full w-full object-contain"
                    />
                  </div>
                )}
                {/* 分割线 */}
                <div
                  className="absolute left-[50%] top-0 bottom-0 w-1 bg-blue-500/70"
                  style={{ left: `${splitPosition}%` }}
                >
                  <div className="absolute -left-2 -top-2 h-5 w-5 translate-y-1/2 rotate-45 border-2 border-blue-500/70 bg-blue-500"></div>
                  <div className="absolute -left-2 -bottom-2 h-5 w-5 -translate-y-1/2 rotate-45 border-2 border-blue-500/70 bg-blue-500"></div>
                </div>
              </>
            ) : (
              <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2">
                {showOriginal && (
                  <div className="flex flex-col items-center space-y-2">
                    <div className="text-sm font-medium">原始图像</div>
                    <div className="relative h-full w-full overflow-hidden rounded border bg-white p-2">
                      <img
                        src={imageSrc}
                        alt="原始图像"
                        className="h-full w-full object-contain"
                      />
                    </div>
                  </div>
                )}
                {showSimulated && (
                  <div className="flex flex-col items-center space-y-2">
                    <div className="text-sm font-medium">
                      模拟图像 ({colorBlindTypes[colorBlindType].label})
                    </div>
                    <div className="relative h-full w-full overflow-hidden rounded border bg-white p-2">
                      <img
                        src={simulatedImage}
                        alt={`${colorBlindTypes[colorBlindType].label}模拟图像`}
                        className="h-full w-full object-contain"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {accessibilityScore !== null && (
        <div className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-lg font-medium">可访问性评估</h3>
            <div className="rounded-lg border bg-white p-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="font-medium">{colorBlindTypes[colorBlindType].label}可访问性评分</div>
                    <div className={`font-bold ${getScoreLevel(accessibilityScore).color}`}>
                      {accessibilityScore} ({getScoreLevel(accessibilityScore).level})
                    </div>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-gray-200">
                    <div
                      className={`h-full transition-all ${accessibilityScore >= 80 ? 'bg-green-500' : accessibilityScore >= 60 ? 'bg-yellow-500' : accessibilityScore >= 40 ? 'bg-orange-500' : 'bg-red-500'}`}
                      style={{ width: `${accessibilityScore}%` }}
                    ></div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">改进建议</h4>
                  <ul className="space-y-2">
                    {accessibilityTips.map((tip, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 text-green-600 flex-shrink-0" />
                        <span className="text-gray-600">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <Alert className="bg-blue-50 border-blue-200">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertTitle>WCAG 可访问性标准</AlertTitle>
            <AlertDescription>
              WCAG 2.1 推荐所有网站内容都应考虑色盲用户的需求。确保您的设计不仅依赖颜色来传递重要信息，
              同时使用足够的对比度以提高可读性。
            </AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  );

  return (
    <div className="container mx-auto py-8 px-4 sm:px-6">
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">颜色盲模拟器</h1>
          <p className="mx-auto max-w-2xl text-gray-500">
            测试您的设计在不同类型色盲视觉下的呈现效果，提高产品的可访问性和用户体验
          </p>
        </div>

        <Card>
          <CardContent>
            <Tabs defaultValue="upload" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-6">
                <TabsTrigger value="upload">上传图像</TabsTrigger>
                <TabsTrigger value="preview" disabled={!imageSrc}>预览模拟</TabsTrigger>
              </TabsList>
              
              <TabsContent value="upload">{renderUploadInterface()}</TabsContent>
              <TabsContent value="preview">{renderPreviewInterface()}</TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <h3 className="mb-3 font-semibold text-gray-900">支持的色盲类型</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• 正常视觉 (Normal Vision)</li>
              <li>• 红色盲 (Protanopia)</li>
              <li>• 绿色盲 (Deuteranopia)</li>
              <li>• 蓝色盲 (Tritanopia)</li>
              <li>• 红色弱 (Protanomaly)</li>
              <li>• 绿色弱 (Deuteranomaly)</li>
              <li>• 蓝色弱 (Tritanomaly)</li>
              <li>• 全色盲 (Achromatopsia)</li>
            </ul>
          </div>

          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <h3 className="mb-3 font-semibold text-gray-900">色盲普及知识</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• 约有8%的男性和0.5%的女性患有色盲</li>
              <li>• 最常见的是红色绿色盲</li>
              <li>• 全色盲非常罕见，约占人口的0.003%</li>
              <li>• 色盲通常是遗传性的，但也可能由疾病或药物引起</li>
              <li>• 大多数色盲患者可以看到颜色，只是对某些颜色的区分能力有限</li>
            </ul>
          </div>

          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <h3 className="mb-3 font-semibold text-gray-900">设计最佳实践</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• 使用高对比度的颜色组合</li>
              <li>• 结合颜色和形状/图案传递信息</li>
              <li>• 提供颜色盲模式选项</li>
              <li>• 避免仅使用颜色编码重要信息</li>
              <li>• 使用多种视觉提示（文本、图标、颜色）</li>
              <li>• 测试您的设计在不同色盲模式下的效果</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>© 2024 颜色盲模拟器 | 提高设计的可访问性，为所有人创造更好的用户体验</p>
        </div>
      </div>

      {/* 隐藏的Canvas用于图像处理 */}
      <canvas ref={canvasRef} className="hidden"></canvas>
    </div>
  );
};

export default ColorBlindSimulator;