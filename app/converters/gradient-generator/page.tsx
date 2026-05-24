"use client"

/**
 * @file 渐变生成器页面
 * @description 创建和自定义颜色渐变的工具
 * @module gradient-generator
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// Switch component removed as it's not being used
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Copy, CheckCircle2, Plus, Trash2, RotateCcw, Download, Info, RefreshCw, Code, Eye, Settings } from 'lucide-react';

// 渐变类型
type GradientType = 'linear' | 'radial';

// 线性渐变方向
type LinearDirection = 
  | 'to right'
  | 'to left'
  | 'to bottom'
  | 'to top'
  | 'to top right'
  | 'to top left'
  | 'to bottom right'
  | 'to bottom left'
  | 'angle';

// 径向渐变形状
type RadialShape = 'circle' | 'ellipse';

// 径向渐变大小
type RadialSize = 'closest-side' | 'closest-corner' | 'farthest-side' | 'farthest-corner' | 'contain' | 'cover';

// 渐变颜色停靠点
interface ColorStop {
  id: string;
  color: string;
  position: number; // 0-100
  selected: boolean;
}

// 预设渐变
interface GradientPreset {
  id: string;
  name: string;
  type: GradientType;
  direction?: LinearDirection;
  angle?: number;
  shape?: RadialShape;
  size?: RadialSize;
  colorStops: Omit<ColorStop, 'id' | 'selected'>[];
}

const GradientGenerator: React.FC = () => {
  // 状态管理
  const [gradientType, setGradientType] = useState<GradientType>('linear');
  const [linearDirection, setLinearDirection] = useState<LinearDirection>('to right');
  const [angle, setAngle] = useState(0);
  const [radialShape, setRadialShape] = useState<RadialShape>('circle');
  const [radialSize, setRadialSize] = useState<RadialSize>('closest-side');
  const [colorStops, setColorStops] = useState<ColorStop[]>([
    { id: '1', color: '#ff6b6b', position: 0, selected: false },
    { id: '2', color: '#4ecdc4', position: 100, selected: false }
  ]);
  const [showCSS] = useState(true);
  const [copyNotification, setCopyNotification] = useState<{ visible: boolean; text: string }>({ visible: false, text: '' });
  const [showGrid, setShowGrid] = useState(false);
  const [showPreviewText, setShowPreviewText] = useState(false);
  const [previewText, setPreviewText] = useState('Gradient Text');
  // Removed unused currentTab state as it's not being used
  const [gradientCSS, setGradientCSS] = useState('');

  // 渐变预设
  const gradientPresets: GradientPreset[] = [
    {
      id: 'sunset',
      name: '日落',
      type: 'linear',
      direction: 'to right',
      colorStops: [
        { color: '#ff6b6b', position: 0 },
        { color: '#ffa502', position: 100 }
      ]
    },
    {
      id: 'ocean',
      name: '海洋',
      type: 'linear',
      direction: 'to bottom',
      colorStops: [
        { color: '#00b4d8', position: 0 },
        { color: '#0077b6', position: 100 }
      ]
    },
    {
      id: 'forest',
      name: '森林',
      type: 'linear',
      direction: 'to top',
      colorStops: [
        { color: '#2d6a4f', position: 0 },
        { color: '#95d5b2', position: 100 }
      ]
    },
    {
      id: 'rainbow',
      name: '彩虹',
      type: 'linear',
      direction: 'to right',
      colorStops: [
        { color: '#ff0000', position: 0 },
        { color: '#ff7f00', position: 16.67 },
        { color: '#ffff00', position: 33.33 },
        { color: '#00ff00', position: 50 },
        { color: '#0000ff', position: 66.67 },
        { color: '#4b0082', position: 83.33 },
        { color: '#9400d3', position: 100 }
      ]
    },
    {
      id: 'fire',
      name: '火焰',
      type: 'radial',
      shape: 'circle',
      size: 'farthest-corner',
      colorStops: [
        { color: '#ff3131', position: 0 },
        { color: '#ff8c00', position: 50 },
        { color: '#f7ff00', position: 100 }
      ]
    },
    {
      id: 'purple-haze',
      name: '紫霞',
      type: 'linear',
      direction: 'to bottom right',
      colorStops: [
        { color: '#8a2be2', position: 0 },
        { color: '#ff69b4', position: 100 }
      ]
    },
    {
      id: 'neon',
      name: '霓虹',
      type: 'linear',
      direction: 'to right',
      colorStops: [
        { color: '#00ffff', position: 0 },
        { color: '#ff00ff', position: 100 }
      ]
    },
    {
      id: 'candy',
      name: '糖果',
      type: 'linear',
      direction: 'to bottom',
      colorStops: [
        { color: '#ff6b6b', position: 0 },
        { color: '#feca57', position: 50 },
        { color: '#ff9ff3', position: 100 }
      ]
    },
    {
      id: 'monochrome',
      name: '黑白',
      type: 'linear',
      direction: 'to right',
      colorStops: [
        { color: '#000000', position: 0 },
        { color: '#ffffff', position: 100 }
      ]
    },
    {
      id: 'mint',
      name: '薄荷',
      type: 'linear',
      direction: 'to bottom',
      colorStops: [
        { color: '#a8edea', position: 0 },
        { color: '#fed6e3', position: 100 }
      ]
    },
  ];

  // 复制到剪贴板
  const copyToClipboard = (text: string, format: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopyNotification({ visible: true, text: `${format} 已复制` });
      setTimeout(() => {
        setCopyNotification({ visible: false, text: '' });
      }, 2000);
    });
  };

  // 生成渐变CSS
  const generateGradientCSS = (): string => {
    if (colorStops.length < 2) return '';

    // 排序颜色停靠点
    const sortedStops = [...colorStops].sort((a, b) => a.position - b.position);
    
    // 生成颜色停靠点字符串
    const stopsStr = sortedStops.map(stop => `${stop.color} ${stop.position}%`).join(', ');
    
    if (gradientType === 'linear') {
      if (linearDirection === 'angle') {
        return `linear-gradient(${angle}deg, ${stopsStr})`;
      } else {
        return `linear-gradient(${linearDirection}, ${stopsStr})`;
      }
    } else { // radial
      return `radial-gradient(${radialShape} ${radialSize}, ${stopsStr})`;
    }
  };

  // 获取完整CSS代码
  const getFullCSSCode = (): string => {
    const gradient = generateGradientCSS();
    if (!gradient) return '';
    
    return `.gradient-element {
  background: ${gradient};
  /* 确保渐变跨浏览器兼容 */
  background: -webkit-${gradient};
  background: -moz-${gradient};
  background: -o-${gradient};
  /* 可选：添加背景大小以确保渐变覆盖整个元素 */
  background-size: 100% 100%;
}`;
  };

  // 获取渐变背景样式
  const getGradientStyle = () => {
    return {
      background: generateGradientCSS(),
      backgroundSize: '100% 100%'
    };
  };

  // 添加新的颜色停靠点
  const addColorStop = () => {
    // 找到两个相邻停靠点之间的中间位置
    if (colorStops.length >= 1) {
      // 排序停靠点
      const sortedStops = [...colorStops].sort((a, b) => a.position - b.position);
      
      // 找出最大的间隔
      let maxGap = 0;
      let insertPosition = 50;
      let insertColor = '#ffffff';
      
      for (let i = 0; i < sortedStops.length - 1; i++) {
        const gap = sortedStops[i + 1].position - sortedStops[i].position;
        if (gap > maxGap) {
          maxGap = gap;
          insertPosition = Math.floor((sortedStops[i].position + sortedStops[i + 1].position) / 2);
          // 在两个颜色之间插值
          insertColor = interpolateColor(sortedStops[i].color, sortedStops[i + 1].color, 0.5);
        }
      }
      
      // 如果只有一个停靠点，添加到末尾
      if (sortedStops.length === 1) {
        insertPosition = sortedStops[0].position === 0 ? 100 : 0;
        insertColor = sortedStops[0].position === 0 ? '#ffffff' : '#000000';
      }
      
      const newStop: ColorStop = {
        id: Date.now().toString(),
        color: insertColor,
        position: insertPosition,
        selected: false
      };
      
      setColorStops([...colorStops, newStop]);
    }
  };

  // 删除颜色停靠点
  const deleteColorStop = (id: string) => {
    if (colorStops.length <= 2) {
      return; // 至少保留两个颜色停靠点
    }
    setColorStops(colorStops.filter(stop => stop.id !== id));
  };

  // 更新颜色停靠点颜色
  const updateColorStopColor = (id: string, color: string) => {
    setColorStops(colorStops.map(stop => 
      stop.id === id ? { ...stop, color } : stop
    ));
  };

  // 更新颜色停靠点位置
  const updateColorStopPosition = (id: string, position: number) => {
    // 确保位置在0-100之间
    position = Math.max(0, Math.min(100, position));
    
    // 排序后的停靠点
    const sortedStops = [...colorStops].sort((a, b) => a.position - b.position);
    
    // 找到当前停靠点的索引
    const currentIndex = sortedStops.findIndex(stop => stop.id === id);
    
    // 确保不会与相邻停靠点重叠（保留至少1%的间隔）
    if (currentIndex > 0) {
      position = Math.max(position, sortedStops[currentIndex - 1].position + 1);
    }
    if (currentIndex < sortedStops.length - 1) {
      position = Math.min(position, sortedStops[currentIndex + 1].position - 1);
    }
    
    setColorStops(colorStops.map(stop => 
      stop.id === id ? { ...stop, position } : stop
    ));
  };

  // 选择颜色停靠点
  const selectColorStop = (id: string) => {
    setColorStops(colorStops.map(stop => 
      ({ ...stop, selected: stop.id === id })
    ));
  };

  // 重置渐变
  const resetGradient = () => {
    setGradientType('linear');
    setLinearDirection('to right');
    setAngle(0);
    setRadialShape('circle');
    setRadialSize('closest-side');
    setColorStops([
      { id: '1', color: '#ff6b6b', position: 0, selected: false },
      { id: '2', color: '#4ecdc4', position: 100, selected: false }
    ]);
  };

  // 应用预设渐变
  const applyPreset = (preset: GradientPreset) => {
    setGradientType(preset.type);
    
    if (preset.type === 'linear') {
      if (preset.direction) {
        setLinearDirection(preset.direction);
      }
      if (preset.angle !== undefined) {
        setAngle(preset.angle);
      }
    } else {
      if (preset.shape) {
        setRadialShape(preset.shape);
      }
      if (preset.size) {
        setRadialSize(preset.size);
      }
    }
    
    setColorStops(preset.colorStops.map((stop, index) => ({
      id: (Date.now() + index).toString(),
      color: stop.color,
      position: stop.position,
      selected: false
    })));
  };

  // 随机生成渐变
  const generateRandomGradient = () => {
    // 随机选择渐变类型
    const randomType: GradientType = Math.random() > 0.5 ? 'linear' : 'radial';
    setGradientType(randomType);
    
    if (randomType === 'linear') {
      // 随机选择方向或角度
      const directions: LinearDirection[] = ['to right', 'to left', 'to bottom', 'to top', 'to top right', 'to top left', 'to bottom right', 'to bottom left', 'angle'];
      const randomDirection = directions[Math.floor(Math.random() * directions.length)];
      setLinearDirection(randomDirection);
      
      if (randomDirection === 'angle') {
        setAngle(Math.floor(Math.random() * 360));
      }
    } else {
      // 随机选择径向渐变参数
      const shapes: RadialShape[] = ['circle', 'ellipse'];
      const sizes: RadialSize[] = ['closest-side', 'closest-corner', 'farthest-side', 'farthest-corner', 'contain', 'cover'];
      setRadialShape(shapes[Math.floor(Math.random() * shapes.length)]);
      setRadialSize(sizes[Math.floor(Math.random() * sizes.length)]);
    }
    
    // 生成2-5个随机颜色停靠点
    const stopCount = Math.floor(Math.random() * 4) + 2;
    const newStops: ColorStop[] = [];
    
    for (let i = 0; i < stopCount; i++) {
      const position = i === 0 ? 0 : i === stopCount - 1 ? 100 : Math.floor(Math.random() * 98) + 1;
      newStops.push({
        id: (Date.now() + i).toString(),
        color: generateRandomColor(),
        position,
        selected: false
      });
    }
    
    // 按位置排序
    newStops.sort((a, b) => a.position - b.position);
    
    // 确保起始和结束位置正确
    newStops[0].position = 0;
    newStops[newStops.length - 1].position = 100;
    
    setColorStops(newStops);
  };

  // 生成随机颜色
  const generateRandomColor = (): string => {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  };

  // 在两种颜色之间插值
  const interpolateColor = (color1: string, color2: string, factor: number): string => {
    // 移除#号并解析RGB值
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : null;
    };
    
    const rgbToHex = (r: number, g: number, b: number) => {
      return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase()}`;
    };
    
    const rgb1 = hexToRgb(color1);
    const rgb2 = hexToRgb(color2);
    
    if (!rgb1 || !rgb2) return color1;
    
    const r = Math.round(rgb1.r + (rgb2.r - rgb1.r) * factor);
    const g = Math.round(rgb1.g + (rgb2.g - rgb1.g) * factor);
    const b = Math.round(rgb1.b + (rgb2.b - rgb1.b) * factor);
    
    return rgbToHex(r, g, b);
  };

  // 导出渐变图片
  const exportGradientImage = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 600;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;
    
    // 创建渐变
    let gradient: CanvasGradient;
    
    if (gradientType === 'linear') {
      if (linearDirection === 'angle') {
        const radians = (angle * Math.PI) / 180;
        const x1 = Math.cos(radians + Math.PI) * 800;
        const y1 = Math.sin(radians + Math.PI) * 600;
        const x2 = Math.cos(radians) * 800;
        const y2 = Math.sin(radians) * 600;
        gradient = ctx.createLinearGradient(400 + x1, 300 + y1, 400 + x2, 300 + y2);
      } else {
        // 解析方向
        let x1 = 0, y1 = 0, x2 = 800, y2 = 600;
        
        switch (linearDirection) {
          case 'to right':
            x1 = 0; y1 = 300; x2 = 800; y2 = 300;
            break;
          case 'to left':
            x1 = 800; y1 = 300; x2 = 0; y2 = 300;
            break;
          case 'to bottom':
            x1 = 400; y1 = 0; x2 = 400; y2 = 600;
            break;
          case 'to top':
            x1 = 400; y1 = 600; x2 = 400; y2 = 0;
            break;
          case 'to top right':
            x1 = 0; y1 = 600; x2 = 800; y2 = 0;
            break;
          case 'to top left':
            x1 = 800; y1 = 600; x2 = 0; y2 = 0;
            break;
          case 'to bottom right':
            x1 = 0; y1 = 0; x2 = 800; y2 = 600;
            break;
          case 'to bottom left':
            x1 = 800; y1 = 0; x2 = 0; y2 = 600;
            break;
        }
        
        gradient = ctx.createLinearGradient(x1, y1, x2, y2);
      }
    } else {
      // 径向渐变
      const centerX = 400;
      const centerY = 300;
      let radius = Math.min(800, 600) / 2;
      
      // 调整大小
      switch (radialSize) {
        case 'closest-side':
          radius = Math.min(centerX, 800 - centerX, centerY, 600 - centerY);
          break;
        case 'farthest-side':
          radius = Math.max(centerX, 800 - centerX, centerY, 600 - centerY);
          break;
        case 'contain':
          radius = Math.min(800, 600) / 2;
          break;
        case 'cover':
          radius = Math.sqrt(800 * 800 + 600 * 600) / 2;
          break;
      }
      
      if (radialShape === 'ellipse') {
        // 对于椭圆，我们使用矩形的宽高比
        gradient = ctx.createRadialGradient(
          centerX, 
          centerY, 
          0, 
          centerX, 
          centerY, 
          radius
        );
      } else {
        gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
      }
    }
    
    // 添加颜色停靠点
    const sortedStops = [...colorStops].sort((a, b) => a.position - b.position);
    sortedStops.forEach(stop => {
      gradient.addColorStop(stop.position / 100, stop.color);
    });
    
    // 填充画布
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 800, 600);
    
    // 转换为图片并下载
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `gradient-${new Date().toISOString().slice(0, 10)}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    });
  };

  // 获取渐变文本样式
  const getGradientTextStyle = () => {
    return {
      background: generateGradientCSS(),
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      backgroundClip: 'text',
      color: 'transparent'
    };
  };

  // 监听渐变变化，更新CSS
  useEffect(() => {
    setGradientCSS(getFullCSSCode());
  }, [gradientType, linearDirection, angle, radialShape, radialSize, colorStops]);

  // 获取选中的颜色停靠点
  const selectedStop = colorStops.find(stop => stop.selected);

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight">渐变颜色生成器</h1>
        <p className="mt-2 text-gray-600">创建自定义渐变效果，支持线性和径向渐变，导出CSS代码</p>
      </header>

      <main className="rounded-xl border bg-white p-6 shadow-sm">
        <Tabs defaultValue="create" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="create">创建渐变</TabsTrigger>
            <TabsTrigger value="presets">预设渐变</TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="space-y-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* 渐变预览区域 */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>渐变预览</span>
                    <div className="flex items-center gap-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setShowGrid(!showGrid)}
                            >
                              <Settings className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>显示网格背景</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setShowPreviewText(!showPreviewText)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>显示文本预览</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </CardTitle>
                  <CardDescription>
                    实时预览渐变效果，可调整预览设置
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div 
                    className={`relative h-64 rounded-lg border overflow-hidden ${showGrid ? 'bg-grid' : ''}`}
                    style={{
                      backgroundImage: showGrid ? `linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)` : 'none',
                      backgroundSize: showGrid ? '20px 20px' : 'auto',
                      backgroundPosition: showGrid ? '0 0, 0 10px, 10px -10px, -10px 0px' : '0 0'
                    }}
                  >
                    <div 
                      className="absolute inset-0 flex items-center justify-center"
                      style={getGradientStyle()}
                    >
                      {showPreviewText && (
                        <h2 
                          className="text-4xl font-bold text-center px-4"
                          style={getGradientTextStyle()}
                        >
                          {previewText}
                        </h2>
                      )}
                    </div>
                  </div>
                  
                  {showPreviewText && (
                    <div className="mt-4 space-y-2">
                      <Label htmlFor="preview-text">预览文本</Label>
                      <input
                        id="preview-text"
                        type="text"
                        value={previewText}
                        onChange={(e) => setPreviewText(e.target.value)}
                        placeholder="输入预览文本"
                        className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex flex-wrap justify-between gap-2">
                  <Button variant="default" onClick={exportGradientImage}>
                    <Download className="mr-2 h-4 w-4" />
                    导出图片
                  </Button>
                  <div className="flex gap-2">
                    <Button variant="secondary" onClick={generateRandomGradient}>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      随机生成
                    </Button>
                    <Button variant="outline" onClick={resetGradient}>
                      <RotateCcw className="mr-2 h-4 w-4" />
                      重置
                    </Button>
                  </div>
                </CardFooter>
              </Card>

              {/* 渐变设置区域 */}
              <div className="space-y-4">
                {/* 渐变类型和方向设置 */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle>渐变设置</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="gradient-type">渐变类型</Label>
                      <Select value={gradientType} onValueChange={(value) => setGradientType(value as GradientType)}>
                        <SelectTrigger id="gradient-type">
                          <SelectValue placeholder="选择渐变类型" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="linear">线性渐变</SelectItem>
                          <SelectItem value="radial">径向渐变</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {gradientType === 'linear' ? (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="linear-direction">渐变方向</Label>
                          <Select value={linearDirection} onValueChange={(value) => setLinearDirection(value as LinearDirection)}>
                            <SelectTrigger id="linear-direction">
                              <SelectValue placeholder="选择渐变方向" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="to right">向右</SelectItem>
                              <SelectItem value="to left">向左</SelectItem>
                              <SelectItem value="to bottom">向下</SelectItem>
                              <SelectItem value="to top">向上</SelectItem>
                              <SelectItem value="to top right">向右上</SelectItem>
                              <SelectItem value="to top left">向左上</SelectItem>
                              <SelectItem value="to bottom right">向右下</SelectItem>
                              <SelectItem value="to bottom left">向左下</SelectItem>
                              <SelectItem value="angle">自定义角度</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {linearDirection === 'angle' && (
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label htmlFor="angle-slider">角度 ({angle}°)</Label>
                              <input
                                type="number"
                                min="0"
                                max="360"
                                value={angle}
                                onChange={(e) => setAngle(parseInt(e.target.value) || 0)}
                                className="w-20 rounded-lg border border-gray-300 px-3 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                              />
                            </div>
                            <Slider
                              id="angle-slider"
                              min={0}
                              max={360}
                              step={1}
                              value={[angle]}
                              onValueChange={(value) => setAngle(value[0])}
                            />
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="radial-shape">形状</Label>
                          <Select value={radialShape} onValueChange={(value) => setRadialShape(value as RadialShape)}>
                            <SelectTrigger id="radial-shape">
                              <SelectValue placeholder="选择形状" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="circle">圆形</SelectItem>
                              <SelectItem value="ellipse">椭圆</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="radial-size">大小</Label>
                          <Select value={radialSize} onValueChange={(value) => setRadialSize(value as RadialSize)}>
                            <SelectTrigger id="radial-size">
                              <SelectValue placeholder="选择大小" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="closest-side">最近边</SelectItem>
                              <SelectItem value="closest-corner">最近角</SelectItem>
                              <SelectItem value="farthest-side">最远边</SelectItem>
                              <SelectItem value="farthest-corner">最远角</SelectItem>
                              <SelectItem value="contain">包含</SelectItem>
                              <SelectItem value="cover">覆盖</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* 颜色停靠点设置 */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center justify-between">
                      <span>颜色停靠点</span>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={addColorStop}
                        disabled={colorStops.length >= 8}
                      >
                        <Plus className="mr-2 h-3 w-3" />
                        添加颜色
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* 颜色渐变条 */}
                    <div className="relative h-12 mb-6">
                      <div 
                        className="absolute inset-0 rounded-full border"
                        style={getGradientStyle()}
                      />
                      {/* 颜色停靠点标记 */}
                      {[...colorStops]
                        .sort((a, b) => a.position - b.position)
                        .map((stop) => (
                          <div
                            key={stop.id}
                            className={`absolute -translate-x-1/2 h-6 w-3 cursor-pointer rounded-full transition-transform hover:scale-125 ${stop.selected ? 'border-2 border-white shadow-lg' : 'border border-white/50'}`}
                            style={{
                              left: `${stop.position}%`,
                              top: '50%',
                              backgroundColor: stop.color,
                              transform: stop.selected ? 'translate(-50%, -50%) scale(1.25)' : 'translate(-50%, -50%)'
                            }}
                            onClick={() => selectColorStop(stop.id)}
                          />
                        ))}
                    </div>

                    {/* 选中的颜色停靠点设置 */}
                    {selectedStop ? (
                      <div className="space-y-4 p-4 rounded-lg bg-gray-50">
                        <div className="space-y-2">
                          <Label>颜色 #{colorStops.findIndex(stop => stop.id === selectedStop.id) + 1}</Label>
                          <div className="flex items-center gap-3">
                            <div
                              className="relative h-10 w-10 rounded-full border-2 border-gray-200 cursor-pointer"
                              style={{ backgroundColor: selectedStop.color }}
                            >
                              <input
                                type="color"
                                value={selectedStop.color}
                                onChange={(e) => updateColorStopColor(selectedStop.id, e.target.value)}
                                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                              />
                            </div>
                            <input
                              type="text"
                              value={selectedStop.color}
                              onChange={(e) => {
                                if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                                  updateColorStopColor(selectedStop.id, e.target.value);
                                }
                              }}
                              className="flex-1 h-10 rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                              placeholder="#000000"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label>位置 ({selectedStop.position}%)</Label>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={selectedStop.position}
                              onChange={(e) => updateColorStopPosition(selectedStop.id, parseInt(e.target.value) || 0)}
                              className="w-20 rounded-lg border border-gray-300 px-3 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                          </div>
                          <Slider
                            min={0}
                            max={100}
                            step={1}
                            value={[selectedStop.position]}
                            onValueChange={(value) => updateColorStopPosition(selectedStop.id, value[0])}
                          />
                        </div>

                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteColorStop(selectedStop.id)}
                          disabled={colorStops.length <= 2}
                        >
                          <Trash2 className="mr-2 h-3 w-3" />
                          删除此颜色
                        </Button>
                      </div>
                    ) : colorStops.length > 0 ? (
                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription className="text-sm">
                          点击上方渐变条中的颜色标记进行编辑
                        </AlertDescription>
                      </Alert>
                    ) : null}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* CSS代码展示区域 */}
            {showCSS && gradientCSS && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="h-5 w-5" />
                    CSS 代码
                  </CardTitle>
                  <CardDescription>
                    复制以下CSS代码到你的项目中
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <pre className="rounded-lg bg-gray-900 p-4 text-sm text-gray-100 overflow-x-auto">
                      <code>{gradientCSS}</code>
                    </pre>
                    <Button
                      className="absolute right-2 top-2"
                      variant="default"
                      size="sm"
                      onClick={() => copyToClipboard(gradientCSS, 'CSS代码')}
                    >
                      <Copy className="mr-2 h-3 w-3" />
                      复制代码
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="presets" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>渐变预设库</CardTitle>
                <CardDescription>
                  选择一个预设渐变开始，然后根据需要进行自定义
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {gradientPresets.map((preset) => (
                    <TooltipProvider key={preset.id}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div 
                            className="group relative h-24 cursor-pointer overflow-hidden rounded-lg border transition-transform hover:scale-105 hover:shadow-md"
                            onClick={() => applyPreset(preset)}
                          >
                            <div 
                              className="absolute inset-0"
                              style={{
                                background: preset.type === 'linear' 
                                  ? `linear-gradient(${preset.direction || 'to right'}, ${preset.colorStops.map(stop => `${stop.color} ${stop.position}%`).join(', ')})`
                                  : `radial-gradient(${preset.shape || 'circle'} ${preset.size || 'closest-side'}, ${preset.colorStops.map(stop => `${stop.color} ${stop.position}%`).join(', ')})`
                              }}
                            />
                            <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent text-white">
                              <div className="text-sm font-medium truncate">{preset.name}</div>
                              <div className="text-xs text-white/80">{preset.type === 'linear' ? '线性' : '径向'}</div>
                            </div>
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100 bg-black/40">
                              <Button size="sm">应用预设</Button>
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="w-60">
                          <div className="space-y-2">
                            <div className="font-medium">{preset.name}</div>
                            <div className="text-sm text-gray-600">
                              {preset.type === 'linear' ? '线性渐变' : '径向渐变'}
                            </div>
                            <div className="grid grid-cols-2 gap-1">
                              {preset.colorStops.map((stop, index) => (
                                <div key={index} className="flex items-center gap-1 text-xs">
                                  <div 
                                    className="h-3 w-3 rounded-full border border-gray-300" 
                                    style={{ backgroundColor: stop.color }}
                                  />
                                  <span className="font-mono truncate">{stop.color}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="justify-center">
                <Button variant="default">
                  创建自定义渐变
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>渐变使用提示</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <h3 className="font-medium">渐变设计技巧</h3>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
                    <li>使用2-3种颜色创建和谐的渐变，过多颜色可能导致视觉混乱</li>
                    <li>选择在色轮上相邻的颜色（类似色）可以创建自然过渡</li>
                    <li>使用高对比度的颜色组合可以创建醒目的效果</li>
                    <li>考虑渐变的方向，不同方向可以传达不同的情绪和动态感</li>
                  </ul>
                </div>

                <div className="space-y-1">
                  <h3 className="font-medium">性能优化建议</h3>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
                    <li>避免在大型区域使用复杂的多色渐变</li>
                    <li>对于重复使用的渐变，可以定义为CSS变量</li>
                    <li>考虑为不支持渐变的旧浏览器提供回退颜色</li>
                  </ul>
                </div>

                <Alert className="bg-blue-50 border-blue-200">
                  <Info className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-sm">
                    提示：使用渐变时，确保文本与背景的对比度符合WCAG可访问性标准，特别是当渐变用作文本背景时。
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {copyNotification.visible && (
        <div className="fixed bottom-4 right-4 flex items-center gap-2 rounded-lg bg-green-500 px-4 py-2 text-sm font-medium text-white shadow-lg">
          <CheckCircle2 className="h-4 w-4" />
          {copyNotification.text}
        </div>
      )}
    </div>
  );
};

export default GradientGenerator;