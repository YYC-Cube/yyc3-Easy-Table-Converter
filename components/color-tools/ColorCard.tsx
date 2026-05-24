import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Button } from '@/components/ui/button';
import { Copy, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export interface ColorData {
  hex: string;
  name?: string;
  ratio?: number;
  r?: number;
  g?: number;
  b?: number;
}

interface ColorCardProps {
  color: ColorData;
  showName?: boolean;
  showRatio?: boolean;
  onColorClick?: (color: ColorData) => void;
  size?: 'small' | 'medium' | 'large';
}

/**
 * @file 颜色卡片组件
 * @description 用于展示颜色信息并提供复制等交互功能的通用组件
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-21
 */
export const ColorCard: React.FC<ColorCardProps> = ({
  color,
  showName = true,
  showRatio = false,
  onColorClick,
  size = 'medium',
}) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const sizeClasses = {
    small: 'h-20 w-20',
    medium: 'h-32 w-32',
    large: 'h-40 w-40',
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      toast({
        variant: 'default',
        title: '复制成功',
        description: `${label} 已复制到剪贴板`,
      });
      
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    });
  };

  const handleColorClick = () => {
    if (onColorClick) {
      onColorClick(color);
    } else {
      handleCopy(color.hex, '颜色代码');
    }
  };

  // 检查文字颜色是否应该为白色（深色背景）
  const shouldUseWhiteText = () => {
    const rgb = color.r && color.g && color.b 
      ? { r: color.r, g: color.g, b: color.b }
      : hexToRgb(color.hex);
      
    if (!rgb) return false;
    
    const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
    return brightness < 128;
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

  const textColorClass = shouldUseWhiteText() ? 'text-white' : 'text-gray-900';

  return (
    <TooltipProvider>
      <Card className={`overflow-hidden border-0 shadow-md transition-all duration-300 hover:shadow-lg ${sizeClasses[size]}`}>
        <div
          className="h-2/3 flex items-center justify-center cursor-pointer relative"
          style={{ backgroundColor: color.hex }}
          onClick={handleColorClick}
          title={color.hex}
        >
          <div className="absolute inset-0 border border-gray-200/20 pointer-events-none"></div>
          <span className={`text-sm font-mono ${textColorClass} transition-opacity duration-200`}>
            {color.hex.toUpperCase()}
          </span>
        </div>
        <CardContent className="p-2 h-1/3 flex flex-col justify-center">
          <div className="flex justify-between items-center">
            <div className="flex flex-col space-y-0.5 overflow-hidden">
              {showName && color.name && (
                <span className="text-xs font-medium truncate">{color.name}</span>
              )}
              {showRatio && color.ratio && (
                <span className="text-[10px] text-gray-500 dark:text-gray-400">
                  占比: {color.ratio.toFixed(1)}%
                </span>
              )}
            </div>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 -mr-1 p-0 opacity-70 hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopy(color.hex, '颜色代码');
                }}
                title="复制颜色代码"
              >
                {copied ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>复制颜色代码</p>
            </TooltipContent>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};

export default ColorCard;