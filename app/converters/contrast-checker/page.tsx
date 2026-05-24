"use client"

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Copy, CheckCircle2, AlertTriangle, Info, ArrowRight, RefreshCw, Download } from 'lucide-react';

/**
 * @file 颜色对比度检查器工具页面
 * @description 检查颜色对比度是否符合WCAG标准，提供评分和改进建议
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 */

// WCAG标准等级
type WCAGLevel = 'AA' | 'AAA';

// 文本大小
type TextSize = 'small' | 'large';

// 对比度结果
interface ContrastResult {
  ratio: number;
  passesAA: boolean;
  passesAAA: boolean;
  score: number;
  grade: string;
  text: string;
  backgroundColor: string;
}

// 颜色推荐
interface ColorRecommendation {
  textColor: string;
  backgroundColor: string;
  ratio: number;
  passesAA: boolean;
  passesAAA: boolean;
  type: 'lighter' | 'darker' | 'both';
}

const ContrastChecker: React.FC = () => {
  // 状态管理
  const [textColor, setTextColor] = useState('#000000');
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [contrastRatio, setContrastRatio] = useState(0);
  const [wcagLevel, setWcagLevel] = useState<WCAGLevel>('AA');
  const [textSize, setTextSize] = useState<TextSize>('small');
  const [showContrastExamples, setShowContrastExamples] = useState(true);
  const [showColorPicker, setShowColorPicker] = useState<'text' | 'background' | null>(null);
  const [copyNotification, setCopyNotification] = useState<{ visible: boolean; text: string }>({ visible: false, text: '' });
  const [recommendations, setRecommendations] = useState<ColorRecommendation[]>([]);
  const [previewText, setPreviewText] = useState('Aa');
  const [previewFontSize, setPreviewFontSize] = useState(16);
  const [contrastResult, setContrastResult] = useState<ContrastResult>({
    ratio: 0,
    passesAA: false,
    passesAAA: false,
    score: 0,
    grade: '',
    text: '#000000',
    backgroundColor: '#ffffff'
  });

  // 计算颜色的亮度
  const calculateLuminance = (hex: string): number => {
    // 移除#号
    hex = hex.replace(/^#/, '');
    
    // 解析RGB值
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;
    
    // 计算相对亮度
    const [R, G, B] = [r, g, b].map(component => {
      return component <= 0.03928
        ? component / 12.92
        : Math.pow((component + 0.055) / 1.055, 2.4);
    });
    
    return 0.2126 * R + 0.7152 * G + 0.0722 * B;
  };

  // 计算对比度
  const calculateContrast = (textHex: string, bgHex: string): number => {
    const textLum = calculateLuminance(textHex);
    const bgLum = calculateLuminance(bgHex);
    
    // 确保较大的值在分子上
    const lighter = Math.max(textLum, bgLum);
    const darker = Math.min(textLum, bgLum);
    
    // 对比度公式: (L1 + 0.05) / (L2 + 0.05) 其中L1是较亮颜色的相对亮度
    return (lighter + 0.05) / (darker + 0.05);
  };

  // 检查是否通过WCAG标准
  const checkWCAGCompliance = (ratio: number, level: WCAGLevel, size: TextSize): boolean => {
    if (level === 'AA') {
      return size === 'small' ? ratio >= 4.5 : ratio >= 3;
    } else { // AAA
      return size === 'small' ? ratio >= 7 : ratio >= 4.5;
    }
  };

  // 获取对比度评分
  const getContrastScore = (ratio: number): { score: number; grade: string } => {
    if (ratio >= 7) return { score: 100, grade: '优秀' };
    if (ratio >= 4.5) return { score: 80, grade: '良好' };
    if (ratio >= 3) return { score: 60, grade: '一般' };
    if (ratio >= 2) return { score: 40, grade: '较差' };
    return { score: 20, grade: '极差' };
  };

  // 生成颜色推荐
  const generateRecommendations = (textHex: string, bgHex: string, count: number = 5): ColorRecommendation[] => {
    const recommendations: ColorRecommendation[] = [];
    const textLum = calculateLuminance(textHex);
    const bgLum = calculateLuminance(bgHex);
    
    // 确定哪种颜色需要调整
    const textIsLighter = textLum > bgLum;
    const needsLighterText = !textIsLighter && bgLum > 0.5;
    const needsDarkerText = textIsLighter && bgLum > 0.5;
    const needsLighterBg = textIsLighter && bgLum < 0.5;
    const needsDarkerBg = !textIsLighter && bgLum < 0.5;
    
    // 生成调整后的颜色
    for (let i = 1; i <= count; i++) {
      const factor = 0.1 * i;
      
      if (needsDarkerText) {
        const darkerText = adjustColorLightness(textHex, -factor);
        const ratio = calculateContrast(darkerText, bgHex);
        recommendations.push({
          textColor: darkerText,
          backgroundColor: bgHex,
          ratio,
          passesAA: checkWCAGCompliance(ratio, 'AA', 'small'),
          passesAAA: checkWCAGCompliance(ratio, 'AAA', 'small'),
          type: 'darker'
        });
      }
      
      if (needsLighterText) {
        const lighterText = adjustColorLightness(textHex, factor);
        const ratio = calculateContrast(lighterText, bgHex);
        recommendations.push({
          textColor: lighterText,
          backgroundColor: bgHex,
          ratio,
          passesAA: checkWCAGCompliance(ratio, 'AA', 'small'),
          passesAAA: checkWCAGCompliance(ratio, 'AAA', 'small'),
          type: 'lighter'
        });
      }
      
      if (needsDarkerBg) {
        const darkerBg = adjustColorLightness(bgHex, -factor);
        const ratio = calculateContrast(textHex, darkerBg);
        recommendations.push({
          textColor: textHex,
          backgroundColor: darkerBg,
          ratio,
          passesAA: checkWCAGCompliance(ratio, 'AA', 'small'),
          passesAAA: checkWCAGCompliance(ratio, 'AAA', 'small'),
          type: 'darker'
        });
      }
      
      if (needsLighterBg) {
        const lighterBg = adjustColorLightness(bgHex, factor);
        const ratio = calculateContrast(textHex, lighterBg);
        recommendations.push({
          textColor: textHex,
          backgroundColor: lighterBg,
          ratio,
          passesAA: checkWCAGCompliance(ratio, 'AA', 'small'),
          passesAAA: checkWCAGCompliance(ratio, 'AAA', 'small'),
          type: 'lighter'
        });
      }
    }
    
    // 按对比度排序并去重
    return recommendations
      .filter((rec, index, self) => 
        index === self.findIndex((r) => 
          r.textColor === rec.textColor && r.backgroundColor === rec.backgroundColor
        )
      )
      .sort((a, b) => b.ratio - a.ratio)
      .slice(0, count);
  };

  // 调整颜色亮度
  const adjustColorLightness = (hex: string, factor: number): string => {
    // 移除#号
    hex = hex.replace(/^#/, '');
    
    // 解析RGB值
    let r = parseInt(hex.substring(0, 2), 16);
    let g = parseInt(hex.substring(2, 4), 16);
    let b = parseInt(hex.substring(4, 6), 16);
    
    // 调整亮度
    r = Math.max(0, Math.min(255, Math.round(r + factor * 255)));
    g = Math.max(0, Math.min(255, Math.round(g + factor * 255)));
    b = Math.max(0, Math.min(255, Math.round(b + factor * 255)));
    
    // 转换回HEX
    const toHex = (n: number): string => {
      const hex = n.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    
    return '#' + toHex(r) + toHex(g) + toHex(b);
  };

  // 复制到剪贴板
  const copyToClipboard = (text: string, format: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopyNotification({ visible: true, text: `${format} 已复制` });
      setTimeout(() => {
        setCopyNotification({ visible: false, text: '' });
      }, 2000);
    });
  };

  // 交换文本和背景色
  const swapColors = () => {
    const temp = textColor;
    setTextColor(backgroundColor);
    setBackgroundColor(temp);
  };

  // 重置颜色
  const resetColors = () => {
    setTextColor('#000000');
    setBackgroundColor('#ffffff');
  };

  // 应用推荐的颜色
  const applyRecommendation = (rec: ColorRecommendation) => {
    setTextColor(rec.textColor);
    setBackgroundColor(rec.backgroundColor);
  };

  // 导出对比度结果
  const exportResult = () => {
    const data = {
      textColor,
      backgroundColor,
      contrastRatio: contrastRatio.toFixed(2),
      passesAA: contrastResult.passesAA,
      passesAAA: contrastResult.passesAAA,
      score: contrastResult.score,
      grade: contrastResult.grade,
      wcagLevel,
      textSize,
      timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `contrast-check-result-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 监听颜色变化，重新计算对比度
  useEffect(() => {
    const ratio = calculateContrast(textColor, backgroundColor);
    setContrastRatio(ratio);
    
    const { score, grade } = getContrastScore(ratio);
    const passesAA = checkWCAGCompliance(ratio, 'AA', textSize);
    const passesAAA = checkWCAGCompliance(ratio, 'AAA', textSize);
    
    setContrastResult({
      ratio,
      passesAA,
      passesAAA,
      score,
      grade,
      text: textColor,
      backgroundColor
    });
    
    // 生成推荐
    setRecommendations(generateRecommendations(textColor, backgroundColor));
  }, [textColor, backgroundColor, textSize]);

  // 获取结果描述文本
  const getResultText = (): string => {
    const { ratio, passesAA, passesAAA } = contrastResult;
    const levelText = wcagLevel === 'AA' ? 'AA' : 'AAA';
    const sizeText = textSize === 'small' ? '普通文本' : '大文本';
    
    if (passesAAA) {
      return `对比度 ${ratio.toFixed(2)}:1 符合 WCAG ${levelText} 标准（${sizeText}）`;
    } else if (passesAA) {
      return `对比度 ${ratio.toFixed(2)}:1 符合 WCAG ${levelText} 标准（${sizeText}），但不符合 AAA 标准`;
    } else {
      const required = wcagLevel === 'AA' 
        ? (textSize === 'small' ? 4.5 : 3) 
        : (textSize === 'small' ? 7 : 4.5);
      return `对比度 ${ratio.toFixed(2)}:1 不符合 WCAG ${levelText} 标准（${sizeText}），需要至少 ${required}:1`;
    }
  };

  // 获取结果状态图标
  const getResultIcon = () => {
    const { passesAA, passesAAA } = contrastResult;
    
    if (passesAAA) {
      return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    } else if (passesAA) {
      return <CheckCircle2 className="h-5 w-5 text-yellow-500" />;
    } else {
      return <AlertTriangle className="h-5 w-5 text-red-500" />;
    }
  };

  return (
    <div className="container mx-auto max-w-6xl px-4 py-8">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight">颜色对比度检查器</h1>
        <p className="mt-2 text-gray-600">检查颜色对比度是否符合WCAG标准，确保良好的可访问性</p>
      </header>
      
      <main className="rounded-xl border bg-white p-6 shadow-sm">
        <Tabs defaultValue="check" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="check">对比度检查</TabsTrigger>
            <TabsTrigger value="learn">学习指南</TabsTrigger>
          </TabsList>
          
          <TabsContent value="check" className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* 颜色输入区域 */}
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>颜色设置</CardTitle>
                    <CardDescription>选择文本颜色和背景颜色进行对比检查</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* 文本颜色 */}
                    <div className="space-y-2">
                      <Label htmlFor="text-color">文本颜色</Label>
                      <div className="flex items-center gap-3">
                        <div
                          className="relative h-12 w-12 cursor-pointer rounded-full border-2 border-gray-200 transition-transform hover:scale-105"
                          style={{ backgroundColor: textColor }}
                          onClick={() => setShowColorPicker(showColorPicker === 'text' ? null : 'text')}
                        >
                          <input
                            type="color"
                            value={textColor}
                            onChange={(e) => setTextColor(e.target.value)}
                            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                          />
                        </div>
                        <input
                          id="text-color"
                          type="text"
                          value={textColor}
                          onChange={(e) => {
                            if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                              setTextColor(e.target.value);
                            }
                          }}
                          className="flex-1 h-12 rounded-lg border border-gray-300 bg-transparent px-4 py-2 text-sm font-mono focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                          placeholder="#000000"
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => copyToClipboard(textColor, '文本颜色')}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* 背景颜色 */}
                    <div className="space-y-2">
                      <Label htmlFor="background-color">背景颜色</Label>
                      <div className="flex items-center gap-3">
                        <div
                          className="relative h-12 w-12 cursor-pointer rounded-full border-2 border-gray-200 transition-transform hover:scale-105"
                          style={{ backgroundColor: backgroundColor }}
                          onClick={() => setShowColorPicker(showColorPicker === 'background' ? null : 'background')}
                        >
                          <input
                            type="color"
                            value={backgroundColor}
                            onChange={(e) => setBackgroundColor(e.target.value)}
                            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                          />
                        </div>
                        <input
                          id="background-color"
                          type="text"
                          value={backgroundColor}
                          onChange={(e) => {
                            if (/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                              setBackgroundColor(e.target.value);
                            }
                          }}
                          className="flex-1 h-12 rounded-lg border border-gray-300 bg-transparent px-4 py-2 text-sm font-mono focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                          placeholder="#ffffff"
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => copyToClipboard(backgroundColor, '背景颜色')}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {/* 操作按钮 */}
                    <div className="flex flex-wrap gap-3">
                      <Button variant="default" size="sm" onClick={swapColors}>
                        <ArrowRight className="mr-2 h-4 w-4 rotate-90" />
                        交换颜色
                      </Button>
                      <Button variant="secondary" size="sm" onClick={resetColors}>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        重置
                      </Button>
                      <Button variant="default" size="sm" onClick={exportResult}>
                        <Download className="mr-2 h-4 w-4" />
                        导出结果
                      </Button>
                    </div>
                  </CardContent>
                </Card>
                
                {/* 标准设置 */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle>WCAG 标准设置</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="wcag-level">WCAG 标准等级</Label>
                      <Select value={wcagLevel} onValueChange={(value) => setWcagLevel(value as WCAGLevel)}>
                        <SelectTrigger id="wcag-level">
                          <SelectValue placeholder="选择标准等级">{wcagLevel}</SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="AA">AA 级标准</SelectItem>
                          <SelectItem value="AAA">AAA 级标准</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="text-size">文本大小</Label>
                      <Select value={textSize} onValueChange={(value) => setTextSize(value as TextSize)}>
                        <SelectTrigger id="text-size">
                          <SelectValue placeholder="选择文本大小">
                            {textSize === 'small' ? '普通文本 (小于 18pt)' : '大文本 (大于等于 18pt)'}                        
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="small">普通文本 (小于 18pt)</SelectItem>
                          <SelectItem value="large">大文本 (大于等于 18pt)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Switch 
                        id="show-examples" 
                        checked={showContrastExamples} 
                        onCheckedChange={setShowContrastExamples} 
                      />
                      <Label htmlFor="show-examples">显示对比度示例</Label>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* 结果显示区域 */}
              <div className="space-y-4">
                {/* 对比度预览 */}
                <Card>
                  <CardHeader>
                    <CardTitle>对比度预览</CardTitle>
                    <CardDescription>查看文本在背景上的实际显示效果</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col items-center">
                      <div
                        className="mb-4 flex h-40 w-full items-center justify-center rounded-lg border transition-all"
                        style={{ backgroundColor: backgroundColor }}
                      >
                        <span
                          className="text-center font-sans transition-all"
                          style={{
                            color: textColor,
                            fontSize: `${previewFontSize}px`,
                            fontWeight: 400
                          }}
                        >
                          {previewText}
                        </span>
                      </div>
                      
                      <div className="space-y-2 w-full">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="preview-font-size">预览字体大小</Label>
                          <span className="text-sm text-gray-500">{previewFontSize}px</span>
                        </div>
                        <Slider
                          id="preview-font-size"
                          min={12}
                          max={72}
                          step={1}
                          value={[previewFontSize]}
                          onValueChange={(value) => setPreviewFontSize(value[0])}
                        />
                      </div>
                      
                      <div className="mt-4 w-full">
                        <input
                          type="text"
                          value={previewText}
                          onChange={(e) => setPreviewText(e.target.value)}
                          placeholder="输入预览文本"
                          className="w-full rounded-lg border border-gray-300 px-4 py-2 text-center text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* 对比度结果 */}
                <Card className={contrastResult.passesAAA ? 'border-green-200 bg-green-50' : contrastResult.passesAA ? 'border-yellow-200 bg-yellow-50' : 'border-red-200 bg-red-50'}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {getResultIcon()}
                      对比度结果
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">对比度比值</span>
                        <span className="font-mono font-bold">{contrastRatio.toFixed(2)}:1</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className={`h-2.5 rounded-full transition-all ${contrastResult.passesAAA ? 'bg-green-500' : contrastResult.passesAA ? 'bg-yellow-500' : 'bg-red-500'}`} 
                          style={{ width: `${Math.min(100, (contrastRatio / 21) * 100)}%` }}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span>评分等级</span>
                        <span className={`font-medium ${contrastResult.passesAAA ? 'text-green-600' : contrastResult.passesAA ? 'text-yellow-600' : 'text-red-600'}`}>
                          {contrastResult.grade} ({contrastResult.score}/100)
                        </span>
                      </div>
                    </div>
                    
                    <Alert className="bg-white">
                      <Info className="h-4 w-4" />
                      <AlertDescription className="text-sm">
                        {getResultText()}
                      </AlertDescription>
                    </Alert>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span>WCAG {wcagLevel} 标准要求</span>
                        <span className="font-mono">
                          {textSize === 'small' 
                            ? (wcagLevel === 'AA' ? '4.5:1' : '7:1') 
                            : (wcagLevel === 'AA' ? '3:1' : '4.5:1')
                          }
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
            
            {/* 对比度示例 */}
            {showContrastExamples && (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>对比度参考示例</CardTitle>
                    <CardDescription>常见对比度比值的视觉效果参考</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                      {[
                        { ratio: 1, bg: '#000000', text: '#000000', label: '1:1 (相同颜色)' },
                        { ratio: 2, bg: '#666666', text: '#333333', label: '2:1 (极差)' },
                        { ratio: 3, bg: '#999999', text: '#333333', label: '3:1 (AA 大文本)' },
                        { ratio: 4.5, bg: '#bbbbbb', text: '#333333', label: '4.5:1 (AA 普通文本)' },
                        { ratio: 7, bg: '#dddddd', text: '#333333', label: '7:1 (AAA 普通文本)' },
                        { ratio: 21, bg: '#ffffff', text: '#000000', label: '21:1 (最高)' }
                      ].map((example, index) => (
                        <div key={index} className="rounded-lg border overflow-hidden">
                          <div
                            className="h-20 flex items-center justify-center"
                            style={{ backgroundColor: example.bg }}
                          >
                            <span
                              className="text-center font-sans text-sm"
                              style={{ color: example.text }}
                            >
                              Aa
                            </span>
                          </div>
                          <div className="p-3 bg-white text-sm">
                            <div className="font-mono font-medium">{example.ratio}:1</div>
                            <div className="text-gray-500 truncate">{example.label}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
            
            {/* 颜色推荐 */}
            {!contrastResult.passesAA && (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>改进建议</CardTitle>
                    <CardDescription>以下颜色组合可以提高对比度</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
                      {recommendations.slice(0, 6).map((rec, index) => (
                        <TooltipProvider key={index}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div
                                className={`group rounded-lg border overflow-hidden cursor-pointer transition-transform hover:scale-105 ${rec.passesAAA ? 'border-green-200' : rec.passesAA ? 'border-yellow-200' : ''}`}
                                onClick={() => applyRecommendation(rec)}
                              >
                                <div
                                  className="h-24 flex items-center justify-center"
                                  style={{ backgroundColor: rec.backgroundColor }}
                                >
                                  <span
                                    className="text-center font-sans"
                                    style={{ color: rec.textColor }}
                                  >
                                    Aa
                                  </span>
                                </div>
                                <div className="p-3 bg-white text-sm">
                                  <div className="font-mono font-medium">{rec.ratio.toFixed(2)}:1</div>
                                  <div className="flex items-center gap-2 mt-1">
                                    {rec.passesAAA && (
                                      <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded text-xs">AAA</span>
                                    )}
                                    {rec.passesAA && (
                                      <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded text-xs">AA</span>
                                    )}
                                    <span className="text-gray-500">
                                      {rec.type === 'lighter' ? '更亮' : rec.type === 'darker' ? '更暗' : '调整'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="w-60">
                              <div className="space-y-2">
                                <div>文本: <span className="font-mono">{rec.textColor}</span></div>
                                <div>背景: <span className="font-mono">{rec.backgroundColor}</span></div>
                                <div className="flex gap-2 pt-1">
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 text-xs"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      copyToClipboard(rec.textColor, '文本颜色');
                                    }}
                                  >
                                    复制文本色
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 text-xs"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      copyToClipboard(rec.backgroundColor, '背景颜色');
                                    }}
                                  >
                                    复制背景色
                                  </Button>
                                </div>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      ))}
                    </div>
                    
                    {recommendations.length > 0 && (
                      <div className="mt-4 flex justify-center">
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => applyRecommendation(recommendations[0])}
                        >
                          应用最佳推荐
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="learn" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>WCAG 对比度标准</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <h3 className="font-medium">什么是 WCAG 对比度标准？</h3>
                  <p className="text-gray-600 text-sm">
                    Web 内容无障碍指南 (WCAG) 定义了颜色对比度标准，以确保视觉障碍用户能够轻松阅读网页内容。
                    对比度是指文本颜色与其背景颜色之间的亮度差异。
                  </p>
                </div>
                
                <div className="space-y-3">
                  <h3 className="font-medium">AA 级标准要求</h3>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
                    <li>普通文本（小于 18pt 或 14pt 粗体）：对比度至少 4.5:1</li>
                    <li>大文本（大于等于 18pt 或 14pt 粗体）：对比度至少 3:1</li>
                  </ul>
                </div>
                
                <div className="space-y-3">
                  <h3 className="font-medium">AAA 级标准要求</h3>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
                    <li>普通文本（小于 18pt 或 14pt 粗体）：对比度至少 7:1</li>
                    <li>大文本（大于等于 18pt 或 14pt 粗体）：对比度至少 4.5:1</li>
                  </ul>
                </div>
                
                <div className="space-y-3">
                  <h3 className="font-medium">为什么对比度很重要？</h3>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
                    <li>约有 8% 的男性和 0.5% 的女性患有某种形式的色盲</li>
                    <li>许多老年人的视力会随着年龄增长而下降</li>
                    <li>在低光环境下或使用低质量显示器时，良好的对比度尤为重要</li>
                    <li>符合可访问性标准的网站可以覆盖更广泛的用户群体</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>设计最佳实践</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <h3 className="font-medium">对比度设计技巧</h3>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
                    <li>不要仅依靠颜色来传达重要信息，始终配合使用形状、图标或文本标签</li>
                    <li>避免使用相近色调的颜色组合（如浅蓝底深蓝字）</li>
                    <li>对于关键内容（如按钮、链接），尽量达到 AAA 级标准</li>
                    <li>在不同设备和光线条件下测试你的设计</li>
                    <li>考虑使用高对比度模式为视力障碍用户提供支持</li>
                  </ul>
                </div>
                
                <div className="space-y-3">
                  <h3 className="font-medium">常见的对比度错误</h3>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
                    <li>在浅色背景上使用浅灰色文本</li>
                    <li>在蓝色背景上使用红色或绿色文本（对色盲用户不友好）</li>
                    <li>使用渐变背景时，确保整个渐变范围内的对比度都达标</li>
                    <li>使用太小的文本尺寸与低对比度组合</li>
                    <li>在图片背景上直接放置文本而不添加足够的叠加层</li>
                  </ul>
                </div>
                
                <div className="space-y-3">
                  <h3 className="font-medium">工具使用建议</h3>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
                    <li>在设计初期就检查颜色对比度，而不是等到设计完成后</li>
                    <li>为你的设计系统建立符合 WCAG 标准的颜色组合库</li>
                    <li>定期检查你的网站或应用，确保所有内容都符合可访问性要求</li>
                    <li>结合其他可访问性检查工具，如屏幕阅读器测试</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>色盲类型与设计考虑</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-3">
                    <h3 className="font-medium">常见色盲类型</h3>
                    <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
                      <li><strong>红色盲（甲型色盲）</strong>：无法区分红色和绿色</li>
                      <li><strong>绿色盲（乙型色盲）</strong>：无法区分绿色和红色</li>
                      <li><strong>蓝色盲（丙型色盲）</strong>：无法区分蓝色和黄色</li>
                      <li><strong>全色盲</strong>：只能看到灰度，无法分辨颜色</li>
                    </ul>
                  </div>
                  
                  <div className="space-y-3">
                    <h3 className="font-medium">色盲友好设计建议</h3>
                    <ul className="list-disc pl-5 space-y-1 text-sm text-gray-600">
                      <li>使用多种提示方式，不仅依靠颜色</li>
                      <li>选择在色盲模拟下依然可区分的颜色组合</li>
                      <li>使用高对比度的文本和背景色</li>
                      <li>为图表和数据可视化添加模式或纹理</li>
                      <li>在设计过程中使用色盲模拟器进行测试</li>
                    </ul>
                  </div>
                </div>
                
                <Alert className="bg-blue-50 border-blue-200">
                  <Info className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-sm">
                    记住，良好的对比度不仅对残障用户有益，对所有用户在各种观看条件下都有帮助。
                    符合可访问性标准的设计通常也会提供更好的整体用户体验。
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

export default ContrastChecker;