import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import ColorPicker from './ColorPicker';
import { Info } from 'lucide-react';

interface ContrastCheckerProps {
  backgroundColor?: string;
  textColor?: string;
  onContrastCalculated?: (ratio: number, passes: ContrastPasses) => void;
}

interface ContrastPasses {
  aaNormal: boolean;
  aaLarge: boolean;
  aaaNormal: boolean;
  aaaLarge: boolean;
}

/**
 * @file 颜色对比度检查器组件
 * @description 检查背景色和文字色之间的对比度，提供WCAG合规性评估
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-21
 */
export const ContrastChecker: React.FC<ContrastCheckerProps> = ({
  backgroundColor = '#ffffff',
  textColor = '#000000',
  onContrastCalculated,
}) => {
  const [bgColor, setBgColor] = useState(backgroundColor);
  const [txtColor, setTxtColor] = useState(textColor);
  const [contrastRatio, setContrastRatio] = useState(0);
  const [passes, setPasses] = useState<ContrastPasses>({
    aaNormal: false,
    aaLarge: false,
    aaaNormal: false,
    aaaLarge: false,
  });

  useEffect(() => {
    const ratio = calculateContrastRatio(bgColor, txtColor);
    setContrastRatio(ratio);
    
    const newPasses = {
      aaNormal: ratio >= 4.5, // AA标准 - 普通文本
      aaLarge: ratio >= 3,    // AA标准 - 大文本
      aaaNormal: ratio >= 7,  // AAA标准 - 普通文本
      aaaLarge: ratio >= 4.5, // AAA标准 - 大文本
    };
    setPasses(newPasses);
    
    if (onContrastCalculated) {
      onContrastCalculated(ratio, newPasses);
    }
  }, [bgColor, txtColor, onContrastCalculated]);

  // 计算颜色对比度比率
  const calculateContrastRatio = (bgColor: string, txtColor: string): number => {
    const bgLum = getLuminance(bgColor);
    const txtLum = getLuminance(txtColor);
    
    const lighterLum = Math.max(bgLum, txtLum);
    const darkerLum = Math.min(bgLum, txtLum);
    
    return (lighterLum + 0.05) / (darkerLum + 0.05);
  };

  // 获取颜色的亮度值
  const getLuminance = (hex: string): number => {
    const rgb = hexToRgb(hex);
    if (!rgb) return 0;
    
    // 转换为线性RGB值
    const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(component => {
      const value = component / 255;
      return value <= 0.03928
        ? value / 12.92
        : Math.pow((value + 0.055) / 1.055, 2.4);
    });
    
    // 计算亮度
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  // HEX转RGB
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };

  // 获取对比度评级
  const getContrastRating = (): string => {
    if (contrastRatio < 3) return '很差';
    if (contrastRatio < 4.5) return '一般';
    if (contrastRatio < 7) return '良好';
    return '优秀';
  };

  return (
    <Card className="w-full transition-all duration-300">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          对比度检查器
          <Info className="h-4 w-4 text-blue-500 flex-shrink-0" />
        </CardTitle>
        <CardDescription className="text-sm text-gray-500 dark:text-gray-400">
          检查背景色和文字色之间的对比度，确保符合WCAG可访问性标准
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* 颜色选择区域 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <ColorPicker
              label="背景颜色"
              value={bgColor}
              onChange={setBgColor}
            />
          </div>
          <div>
            <ColorPicker
              label="文字颜色"
              value={txtColor}
              onChange={setTxtColor}
            />
          </div>
        </div>
        
        <Separator />
        
        {/* 对比度预览区域 */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">预览效果</Label>
            <div 
              className="p-6 rounded-md min-h-[120px] flex flex-col justify-center items-center text-center"
              style={{ backgroundColor: bgColor }}
            >
              <p style={{ color: txtColor, fontSize: '16px', margin: '0 0 8px 0' }}>普通文本 (16px)</p>
              <p style={{ color: txtColor, fontSize: '14px', margin: '0 0 16px 0' }}>小型文本 (14px)</p>
              <p style={{ color: txtColor, fontSize: '24px', fontWeight: 'bold', margin: '0' }}>大文本 (24px 粗体)</p>
            </div>
          </div>
        </div>
          
        {/* 对比度结果 */}
        <div className="space-y-4">
          <div className="text-center">
            <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {contrastRatio.toFixed(2)}
            </span>
            <span className="ml-2 text-gray-600 dark:text-gray-300">:</span>
            <span className="ml-2 text-gray-600 dark:text-gray-300">1 对比度比率</span>
            <div className="mt-1 text-sm font-medium text-gray-700 dark:text-gray-300">
              评级: {getContrastRating()}
            </div>
          </div>
            
          {/* WCAG 合规性检查 */}
          <div className="space-y-3">
            <Label className="text-sm font-medium block">WCAG 合规性检查:</Label>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Alert variant={passes.aaNormal ? 'default' : 'destructive'} className="p-3">
                <div className="flex gap-2 items-start">
                  <div className="text-sm font-medium">AA 标准 - 普通文本</div>
                  <div className={`text-xs px-1.5 py-0.5 rounded-full ${passes.aaNormal ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
                    {passes.aaNormal ? '通过' : '未通过'}
                  </div>
                </div>
                <AlertDescription className="text-xs mt-1">
                  需要对比度 ≥ 4.5:1 (适用于14pt及以下普通文本)
                </AlertDescription>
              </Alert>
              
              <Alert variant={passes.aaLarge ? 'default' : 'destructive'} className="p-3">
                <div className="flex gap-2 items-start">
                  <div className="text-sm font-medium">AA 标准 - 大文本</div>
                  <div className={`text-xs px-1.5 py-0.5 rounded-full ${passes.aaLarge ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
                    {passes.aaLarge ? '通过' : '未通过'}
                  </div>
                </div>
                <AlertDescription className="text-xs mt-1">
                  需要对比度 ≥ 3:1 (适用于18pt及以上文本或14pt粗体文本)
                </AlertDescription>
              </Alert>
              
              <Alert variant={passes.aaaNormal ? 'default' : 'destructive'} className="p-3">
                <div className="flex gap-2 items-start">
                  <div className="text-sm font-medium">AAA 标准 - 普通文本</div>
                  <div className={`text-xs px-1.5 py-0.5 rounded-full ${passes.aaaNormal ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
                    {passes.aaaNormal ? '通过' : '未通过'}
                  </div>
                </div>
                <AlertDescription className="text-xs mt-1">
                  需要对比度 ≥ 7:1 (适用于14pt及以下普通文本)
                </AlertDescription>
              </Alert>
              
              <Alert variant={passes.aaaLarge ? 'default' : 'destructive'} className="p-3">
                <div className="flex gap-2 items-start">
                  <div className="text-sm font-medium">AAA 标准 - 大文本</div>
                  <div className={`text-xs px-1.5 py-0.5 rounded-full ${passes.aaaLarge ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
                    {passes.aaaLarge ? '通过' : '未通过'}
                  </div>
                </div>
                <AlertDescription className="text-xs mt-1">
                  需要对比度 ≥ 4.5:1 (适用于18pt及以上文本或14pt粗体文本)
                </AlertDescription>
              </Alert>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ContrastChecker;
