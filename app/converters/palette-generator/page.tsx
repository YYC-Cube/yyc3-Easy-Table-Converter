"use client"

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';



import { Copy, Download, FileUp, CheckCircle2, Palette, RefreshCw } from 'lucide-react';

/**
 * @file 智能调色板生成器工具页面
 * @description 根据上传的图像或选定的颜色生成协调的调色板，提供颜色代码复制功能
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 */

// 颜色模型定义
interface ColorRGB {
  r: number;
  g: number;
  b: number;
}



interface ColorHSV {
  h: number;
  s: number;
  v: number;
}

interface ColorData extends ColorRGB {
  hex: string;
  name: string;
  ratio: number;
}

// 调色板类型
type PaletteType = 'monochromatic' | 'analogous' | 'complementary' | 'triadic' | 'tetradic' | 'split-complementary';

const PaletteGenerator = () => {
  // 状态管理
  const [activeTab, setActiveTab] = useState('upload');
  const [imageSrc, setImageSrc] = useState<string>('');
  const [paletteType, setPaletteType] = useState<PaletteType>('analogous');
  const [baseColor, setBaseColor] = useState('#3b82f6');
  const [colorCount, setColorCount] = useState(5);
  const [generatedPalette, setGeneratedPalette] = useState<ColorData[]>([]);
  const [showColorNames, setShowColorNames] = useState(true);
  const [showColorRatios, setShowColorRatios] = useState(false);
  const [copyNotification, setCopyNotification] = useState<{ visible: boolean; text: string }>({ visible: false, text: '' });
  const [showOriginalColors] = useState(true);
  const [showHarmonyColors] = useState(true);
  const [originalColors, setOriginalColors] = useState<ColorData[]>([]);
  
  // 引用
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  
  // RGB到HEX转换
  const rgbToHex = (r: number, g: number, b: number): string => {
    const toHex = (n: number): string => {
      const hex = Math.round(n).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    return '#' + toHex(r) + toHex(g) + toHex(b);
  };
  
  // HEX到RGB转换
  const hexToRgb = (hex: string): ColorRGB | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };
  
  // RGB到HSV转换
  const rgbToHsv = (r: number, g: number, b: number): ColorHSV => {
    r = r / 255;
    g = g / 255;
    b = b / 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const v = max;
    
    const d = max - min;
    s = max === 0 ? 0 : d / max;
    
    if (max === min) {
      h = 0; // 灰度
    } else {
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
    
    return { h: h * 360, s: s * 100, v: v * 100 };
  };
  
  // HSV到RGB转换
  const hsvToRgb = (h: number, s: number, v: number): ColorRGB => {
    h = h / 360;
    s = s / 100;
    v = v / 100;
    
    let r = 0;
    let g = 0;
    let b = 0;
    
    const i = Math.floor(h * 6);
    const f = h * 6 - i;
    const p = v * (1 - s);
    const q = v * (1 - f * s);
    const t = v * (1 - (1 - f) * s);
    
    switch (i % 6) {
      case 0: [r, g, b] = [v, t, p]; break;
      case 1: [r, g, b] = [q, v, p]; break;
      case 2: [r, g, b] = [p, v, t]; break;
      case 3: [r, g, b] = [p, q, v]; break;
      case 4: [r, g, b] = [t, p, v]; break;
      case 5: [r, g, b] = [v, p, q]; break;
    }
    
    return { r: r * 255, g: g * 255, b: b * 255 };
  };
  
  // 获取颜色名称（简化版本）
  const getColorName = (hex: string): string => {
    const colorNames: { [key: string]: string } = {
      '#000000': '黑色', '#ffffff': '白色',
      '#ff0000': '红色', '#00ff00': '绿色', '#0000ff': '蓝色',
      '#ffff00': '黄色', '#ff00ff': '洋红色', '#00ffff': '青色',
      '#ff9900': '橙色', '#663399': '紫色', '#3366cc': '蓝色',
      '#33cc99': '青色', '#ff6666': '粉色', '#996633': '棕色',
      '#cccccc': '灰色', '#333333': '深灰色', '#666666': '中灰色'
    };
    
    // 查找精确匹配
    if (colorNames[hex]) return colorNames[hex];
    
    // 简化的颜色分类
    const rgb = hexToRgb(hex);
    if (!rgb) return '未知';
    
    const { r, g, b } = rgb;
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    
    if (brightness < 20) return '黑色';
    if (brightness > 230) return '白色';
    
    if (r > g && r > b) return '红色系';
    if (g > r && g > b) return '绿色系';
    if (b > r && b > g) return '蓝色系';
    if (r === g && g === b) return '灰色';
    
    return '混合色';
  };
  
  // 从图像中提取颜色
  const extractColorsFromImage = (imageData: ImageData, count: number): ColorData[] => {
    const pixels = imageData.data;
    const colorMap: { [key: string]: number } = {};
    
    // 遍历像素，统计颜色出现次数
    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      const a = pixels[i + 3];
      
      // 跳过透明度较高的像素
      if (a < 128) continue;
      
      // 简化颜色以减少数量
      const simplifiedR = Math.floor(r / 32) * 32;
      const simplifiedG = Math.floor(g / 32) * 32;
      const simplifiedB = Math.floor(b / 32) * 32;
      
      const hex = rgbToHex(simplifiedR, simplifiedG, simplifiedB);
      colorMap[hex] = (colorMap[hex] || 0) + 1;
    }
    
    // 转换为数组并按频率排序
    const colorArray = Object.entries(colorMap)
      .map(([hex, count]) => {
        const rgb = hexToRgb(hex);
        return rgb ? {
          hex,
          r: rgb.r,
          g: rgb.g,
          b: rgb.b,
          name: getColorName(hex),
          count
        } : null;
      })
      .filter((color): color is { hex: string; r: number; g: number; b: number; name: string; count: number } => color !== null)
      .sort((a, b) => b.count - a.count);
    
    // 计算总数
    const totalCount = colorArray.reduce((sum, color) => sum + color.count, 0);
    
    // 返回前N个颜色，并计算比例
    return colorArray.slice(0, count).map(color => ({
      ...color,
      ratio: color.count / totalCount
    }));
  };
  
  // 生成协调调色板
  const generateHarmonyPalette = (baseColorHex: string, type: PaletteType, count: number): ColorData[] => {
    const baseRgb = hexToRgb(baseColorHex);
    if (!baseRgb) return [];
    
    const baseHsv = rgbToHsv(baseRgb.r, baseRgb.g, baseRgb.b);
    const colors: ColorData[] = [];
    
    switch (type) {
      case 'monochromatic':
        // 单色：同一色相，不同亮度
        for (let i = 0; i < count; i++) {
          const brightness = 100 - (i * 15); // 从亮到暗
          const rgb = hsvToRgb(baseHsv.h, baseHsv.s, brightness);
          const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
          colors.push({
            r: rgb.r,
            g: rgb.g,
            b: rgb.b,
            hex,
            name: getColorName(hex),
            ratio: 1 / count
          });
        }
        break;
        
      case 'analogous':
        // 相似色：色轮上相邻的颜色
        const step = 30 / (count - 1);
        for (let i = 0; i < count; i++) {
          const hue = (baseHsv.h - 15 + i * step + 360) % 360;
          const rgb = hsvToRgb(hue, baseHsv.s, baseHsv.v);
          const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
          colors.push({
            r: rgb.r,
            g: rgb.g,
            b: rgb.b,
            hex,
            name: getColorName(hex),
            ratio: 1 / count
          });
        }
        break;
        
      case 'complementary':
        // 互补色：色轮上相对的颜色
        const complementHue = (baseHsv.h + 180) % 360;
        colors.push({
          ...baseRgb,
          hex: baseColorHex,
          name: getColorName(baseColorHex),
          ratio: 0.5
        });
        const complementRgb = hsvToRgb(complementHue, baseHsv.s, baseHsv.v);
        const complementHex = rgbToHex(complementRgb.r, complementRgb.g, complementRgb.b);
        colors.push({
          r: complementRgb.r,
          g: complementRgb.g,
          b: complementRgb.b,
          hex: complementHex,
          name: getColorName(complementHex),
          ratio: 0.5
        });
        
        // 如果需要更多颜色，添加一些变体
        if (count > 2) {
          for (let i = 2; i < count; i++) {
            const brightness = 100 - ((i - 2) * 20);
            const rgb = hsvToRgb(baseHsv.h, baseHsv.s, brightness);
            const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
            colors.push({
              r: rgb.r,
              g: rgb.g,
              b: rgb.b,
              hex,
              name: getColorName(hex),
              ratio: 0
            });
          }
        }
        break;
        
      case 'triadic':
        // 三角色：色轮上均匀分布的三种颜色
        for (let i = 0; i < Math.min(count, 3); i++) {
          const hue = (baseHsv.h + i * 120) % 360;
          const rgb = hsvToRgb(hue, baseHsv.s, baseHsv.v);
          const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
          colors.push({
            r: rgb.r,
            g: rgb.g,
            b: rgb.b,
            hex,
            name: getColorName(hex),
            ratio: 1 / 3
          });
        }
        
        // 如果需要更多颜色，添加一些变体
        if (count > 3) {
          for (let i = 3; i < count; i++) {
            const brightness = 100 - ((i - 3) * 20);
            const rgb = hsvToRgb(baseHsv.h, baseHsv.s, brightness);
            const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
            colors.push({
              r: rgb.r,
              g: rgb.g,
              b: rgb.b,
              hex,
              name: getColorName(hex),
              ratio: 0
            });
          }
        }
        break;
        
      case 'tetradic':
        // 四角色：色轮上两对互补色
        for (let i = 0; i < Math.min(count, 4); i++) {
          const hue = (baseHsv.h + i * 90) % 360;
          const rgb = hsvToRgb(hue, baseHsv.s, baseHsv.v);
          const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
          colors.push({
            r: rgb.r,
            g: rgb.g,
            b: rgb.b,
            hex,
            name: getColorName(hex),
            ratio: 0.25
          });
        }
        break;
        
      case 'split-complementary':
        // 分离互补色：基础色与互补色两侧的颜色
        const split1Hue = (baseHsv.h + 150) % 360;
        const split2Hue = (baseHsv.h + 210) % 360;
        
        colors.push({
          ...baseRgb,
          hex: baseColorHex,
          name: getColorName(baseColorHex),
          ratio: 0.4
        });
        
        const split1Rgb = hsvToRgb(split1Hue, baseHsv.s, baseHsv.v);
        const split1Hex = rgbToHex(split1Rgb.r, split1Rgb.g, split1Rgb.b);
        colors.push({
          r: split1Rgb.r,
          g: split1Rgb.g,
          b: split1Rgb.b,
          hex: split1Hex,
          name: getColorName(split1Hex),
          ratio: 0.3
        });
        
        const split2Rgb = hsvToRgb(split2Hue, baseHsv.s, baseHsv.v);
        const split2Hex = rgbToHex(split2Rgb.r, split2Rgb.g, split2Rgb.b);
        colors.push({
          r: split2Rgb.r,
          g: split2Rgb.g,
          b: split2Rgb.b,
          hex: split2Hex,
          name: getColorName(split2Hex),
          ratio: 0.3
        });
        
        // 如果需要更多颜色，添加一些变体
        if (count > 3) {
          for (let i = 3; i < count; i++) {
            const brightness = 100 - ((i - 3) * 20);
            const rgb = hsvToRgb(baseHsv.h, baseHsv.s, brightness);
            const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
            colors.push({
              r: rgb.r,
              g: rgb.g,
              b: rgb.b,
              hex,
              name: getColorName(hex),
              ratio: 0
            });
          }
        }
        break;
    }
    
    return colors;
  };
  
  // 处理图像上传
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const imageUrl = event.target?.result as string;
      setImageSrc(imageUrl);
      setActiveTab('palette');
    };
    reader.readAsDataURL(file);
  };
  
  // 处理颜色输入
  const handleColorInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBaseColor(e.target.value);
  };
  
  // 当图像加载完成后提取颜色
  useEffect(() => {
    if (!imageSrc) return;
    
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.src = imageSrc;
    
    image.onload = () => {
      // 创建画布并绘制图像
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      // 调整画布大小以优化性能
      const maxDimension = 200;
      let width = image.width;
      let height = image.height;
      
      if (width > height && width > maxDimension) {
        height *= maxDimension / width;
        width = maxDimension;
      } else if (height > maxDimension) {
        width *= maxDimension / height;
        height = maxDimension;
      }
      
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(image, 0, 0, width, height);
      
      // 提取图像数据
      const imageData = ctx.getImageData(0, 0, width, height);
      const extractedColors = extractColorsFromImage(imageData, colorCount);
      setOriginalColors(extractedColors);
      
      // 如果有提取的颜色，使用第一个作为基础色
      if (extractedColors.length > 0) {
        setBaseColor(extractedColors[0].hex);
      }
    };
  }, [imageSrc, colorCount]);
  
  // 当基础颜色或调色板类型改变时生成协调色板
  useEffect(() => {
    if (activeTab !== 'palette') return;
    
    const harmonyColors = generateHarmonyPalette(baseColor, paletteType, colorCount);
    setGeneratedPalette(harmonyColors);
  }, [baseColor, paletteType, colorCount, activeTab]);
  
  // 复制颜色代码到剪贴板
  const copyToClipboard = (text: string, format: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopyNotification({ visible: true, text: `${format} 已复制` });
      setTimeout(() => {
        setCopyNotification({ visible: false, text: '' });
      }, 2000);
    });
  };

  const downloadPalette = () => {
    if (generatedPalette.length === 0) return;
    
    // 创建调色板数据
    const paletteData = {
      name: `${paletteType}调色板`,
      colors: generatedPalette.map(color => ({
        hex: color.hex,
        rgb: { r: Math.round(color.r), g: Math.round(color.g), b: Math.round(color.b) },
        name: color.name,
        ratio: color.ratio
      }))
    };
    
    // 下载JSON文件
    const blob = new Blob([JSON.stringify(paletteData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${paletteType}-palette.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  
  // 获取调色板类型名称
  const getPaletteTypeName = (type: PaletteType): string => {
    const names: { [key in PaletteType]: string } = {
      monochromatic: '单色',
      analogous: '相似色',
      complementary: '互补色',
      triadic: '三角色',
      tetradic: '四角色',
      'split-complementary': '分离互补色'
    };
    return names[type] || type;
  };
  
  // 渲染上传界面
  const renderUploadInterface = () => {
    return (
      <div className="flex flex-col items-center justify-center gap-6 p-8 text-center">
        <div className="rounded-full bg-blue-50 p-6">
          <Palette className="h-12 w-12 text-blue-600" />
        </div>
        <div className="space-y-2">
          <h3 className="text-2xl font-bold tracking-tight">智能调色板生成器</h3>
          <p className="text-gray-500 max-w-md">
            上传图像或选择颜色，生成协调的调色板，轻松复制颜色代码
          </p>
        </div>
        <div className="space-y-6 w-full max-w-md">
          <div
            onClick={() => imageInputRef.current?.click()}
            className="group relative flex h-64 flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 transition-colors hover:border-blue-500 hover:bg-blue-50"
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
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="base-color">或者选择基础颜色</Label>
            </div>
            <div className="flex items-center gap-4">
              <input
                id="base-color"
                type="color"
                value={baseColor}
                onChange={handleColorInput}
                className="h-12 w-12 cursor-pointer rounded-full border-2 border-gray-200 transition-transform hover:scale-105"
              />
              <div className="flex-1">
                <input
                  type="text"
                  value={baseColor}
                  onChange={(e) => {
                    if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                      setBaseColor(e.target.value);
                    }
                  }}
                  className="flex h-12 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2 text-sm font-mono focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="#000000"
                />
              </div>
              <Button variant="default" onClick={() => setActiveTab('palette')}>
                生成调色板
              </Button>
            </div>
          </div>
          <div className="space-y-3 w-full max-w-md">
            <h4 className="text-sm font-medium text-gray-900">使用步骤</h4>
            <div className="space-y-2 rounded-lg border bg-gray-50 p-4">
              <div className="flex items-start gap-2 text-sm">
                <div className="mt-0.5 h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">1</div>
                <p className="text-gray-600">上传图像或选择基础颜色</p>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <div className="mt-0.5 h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">2</div>
                <p className="text-gray-600">选择调色板类型和颜色数量</p>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <div className="mt-0.5 h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">3</div>
                <p className="text-gray-600">点击颜色块复制颜色代码或下载调色板</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  // 渲染调色板界面
  const renderPaletteInterface = () => {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="default" size="sm" onClick={() => setActiveTab('upload')}>
              <RefreshCw className="mr-2 h-4 w-4" />
              重新上传
            </Button>
            <Button variant="default" size="sm" onClick={downloadPalette} disabled={generatedPalette.length === 0}>
              <Download className="mr-2 h-4 w-4" />
              下载调色板
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch id="show-color-names" checked={showColorNames} onCheckedChange={setShowColorNames} />
              <Label htmlFor="show-color-names">显示颜色名称</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch id="show-color-ratios" checked={showColorRatios} onCheckedChange={setShowColorRatios} />
              <Label htmlFor="show-color-ratios">显示占比</Label>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="palette-type">调色板类型</Label>
            <Select value={paletteType} onValueChange={(value) => setPaletteType(value as PaletteType)}>
              <SelectTrigger id="palette-type">
                <SelectValue placeholder="选择调色板类型">{getPaletteTypeName(paletteType)}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monochromatic">单色</SelectItem>
                <SelectItem value="analogous">相似色</SelectItem>
                <SelectItem value="complementary">互补色</SelectItem>
                <SelectItem value="triadic">三角色</SelectItem>
                <SelectItem value="tetradic">四角色</SelectItem>
                <SelectItem value="split-complementary">分离互补色</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="color-count">颜色数量 ({colorCount})</Label>
            <Slider
              id="color-count"
              min={2}
              max={10}
              step={1}
              value={[colorCount]}
              onValueChange={(value) => setColorCount(value[0])}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="base-color-palette">基础颜色</Label>
            <div className="flex items-center gap-4">
              <input
                id="base-color-palette"
                type="color"
                value={baseColor}
                onChange={handleColorInput}
                className="h-10 w-10 cursor-pointer rounded-full border-2 border-gray-200 transition-transform hover:scale-105"
              />
              <div className="flex-1">
                <input
                  type="text"
                  value={baseColor}
                  onChange={(e) => {
                    if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                      setBaseColor(e.target.value);
                    }
                  }}
                  className="flex-1 h-10 rounded-lg border border-gray-300 bg-transparent px-3 py-2 text-sm font-mono focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  placeholder="#000000"
                />
              </div>
              <Button variant="default" onClick={() => setActiveTab('palette')}>
                生成调色板
              </Button>
            </div>
          </div>
        </div>
        
        {/* 原图像提取的颜色 */}
        {showOriginalColors && originalColors.length > 0 && (
          <div>
            <div className="text-lg font-medium">原图像提取颜色</div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-10">
              {originalColors.map((color, index) => (
                <TooltipProvider key={index}>
                  <Tooltip delayDuration={300}>
                    <TooltipTrigger asChild>
                      <div
                        className="group relative cursor-pointer rounded-lg border border-gray-200 overflow-hidden transition-transform hover:scale-105"
                        style={{ backgroundColor: color.hex, height: '120px' }}
                        onClick={() => copyToClipboard(color.hex, 'HEX')}
                      >
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/30 backdrop-blur-sm">
                            <Copy className="h-5 w-5 text-white" />
                          </div>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 rounded-b-lg bg-black/70 p-2 text-xs text-white">
                          <div className="truncate font-mono">{color.hex}</div>
                          {showColorNames && (
                            <div className="truncate">{color.name}</div>
                          )}
                          {showColorRatios && (
                            <div className="text-[10px] opacity-80">{Math.round(color.ratio * 100)}%</div>
                          )}
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-xs">
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 rounded-full" style={{ backgroundColor: color.hex }} />
                          <span className="font-mono">{color.hex}</span>
                        </div>
                        <div>RGB: {Math.round(color.r)}, {Math.round(color.g)}, {Math.round(color.b)}</div>
                        {showColorNames && <div>名称: {color.name}</div>}
                        {showColorRatios && <div>占比: {Math.round(color.ratio * 100)}%</div>}
                        <div className="flex gap-2 pt-1">
                          <button
                            className="rounded px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(color.hex, 'HEX');
                            }}
                          >复制 HEX</button>
                          <button
                            className="rounded px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(`rgb(${Math.round(color.r)}, ${Math.round(color.g)}, ${Math.round(color.b)})`, 'RGB');
                            }}
                          >复制 RGB</button>
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          </div>
        )}
        
        {/* 协调色板 */}
        {showHarmonyColors && generatedPalette.length > 0 && (
          <div>
            <div className="text-lg font-medium">{getPaletteTypeName(paletteType)}协调色板</div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-10">
              {generatedPalette.map((color, index) => (
                <TooltipProvider key={index}>
                  <Tooltip delayDuration={300}>
                    <TooltipTrigger asChild>
                      <div
                        className="group relative cursor-pointer rounded-lg border border-gray-200 overflow-hidden transition-transform hover:scale-105"
                        style={{ backgroundColor: color.hex, height: '120px' }}
                        onClick={() => copyToClipboard(color.hex, 'HEX')}
                      >
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/30 backdrop-blur-sm">
                            <Copy className="h-5 w-5 text-white" />
                          </div>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 rounded-b-lg bg-black/70 p-2 text-xs text-white">
                          <div className="truncate font-mono">{color.hex}</div>
                          {showColorNames && (
                            <div className="truncate">{color.name}</div>
                          )}
                          {showColorRatios && color.ratio > 0 && (
                            <div className="text-[10px] opacity-80">{Math.round(color.ratio * 100)}%</div>
                          )}
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="max-w-xs">
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="h-4 w-4 rounded-full" style={{ backgroundColor: color.hex }} />
                          <span className="font-mono">{color.hex}</span>
                        </div>
                        <div>RGB: {Math.round(color.r)}, {Math.round(color.g)}, {Math.round(color.b)}</div>
                        {showColorNames && <div>名称: {color.name}</div>}
                        {showColorRatios && color.ratio > 0 && <div>占比: {Math.round(color.ratio * 100)}%</div>}
                        <div className="flex gap-2 pt-1">
                          <button
                            className="rounded px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(color.hex, 'HEX');
                            }}
                          >复制 HEX</button>
                          <button
                            className="rounded px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(`rgb(${Math.round(color.r)}, ${Math.round(color.g)}, ${Math.round(color.b)})`, 'RGB');
                            }}
                          >复制 RGB</button>
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
            </div>
          </div>
        )}
        
        {/* 信息卡片 */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <h3 className="mb-3 font-semibold text-gray-900">调色板类型说明</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• 单色：同一色相的不同亮度和饱和度变体</li>
              <li>• 相似色：色轮上相邻的颜色组合</li>
              <li>• 互补色：色轮上相对的颜色组合</li>
              <li>• 三角色：色轮上均匀分布的三种颜色</li>
              <li>• 四角色：色轮上两对互补色的组合</li>
              <li>• 分离互补色：基础色与互补色两侧的颜色组合</li>
            </ul>
          </div>

          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <h3 className="mb-3 font-semibold text-gray-900">设计最佳实践</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• 选择一种主色作为品牌标识色</li>
              <li>• 使用辅助色来强调重要元素</li>
              <li>• 确保文本与背景的对比度满足可访问性标准</li>
              <li>• 考虑不同设备上的显示效果</li>
              <li>• 保持一致性，在整个项目中使用相同的调色板系统</li>
              <li>• 为不同状态（悬停、点击等）使用调色板的变体</li>
            </ul>
          </div>

          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <h3 className="mb-3 font-semibold text-gray-900">实用技巧</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>• 点击颜色块可快速复制HEX代码</li>
              <li>• 在提示框中可以复制不同格式的颜色代码</li>
              <li>• 调整颜色数量以获取更多变化的选项</li>
              <li>• 下载的JSON格式可用于设计系统集成</li>
              <li>• 原图提取的颜色反映了图像中的主要色调分布</li>
              <li>• 协调色板提供了视觉上和谐的配色方案</li>
            </ul>
          </div>
        </div>
      </div>
    );
  };
  
  // 组件渲染
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>颜色提取与调色板生成工具</CardTitle>
            <CardDescription>从图片中提取颜色或生成协调色板</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList>
                <TabsTrigger value="upload">上传图片</TabsTrigger>
                <TabsTrigger value="palette">查看色板</TabsTrigger>
              </TabsList>
              <TabsContent value="upload">
                {renderUploadInterface()}
              </TabsContent>
              <TabsContent value="palette">
                {renderPaletteInterface()}
              </TabsContent>
            </Tabs>
            
            {/* 复制通知 */}
            {copyNotification.visible && (
              <div className="fixed bottom-4 right-4 rounded-lg bg-green-600 px-4 py-2 text-white shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{copyNotification.text}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PaletteGenerator;
