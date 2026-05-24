import React, { useState, useRef, useEffect } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { Copy, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ColorPickerProps {
  value: string; // HEX color
  onChange: (color: string) => void;
  label?: string;
  disabled?: boolean;
  swatches?: string[];
}

/**
 * @file 颜色选择器组件
 * @description 提供颜色选择功能，包括颜色预览、输入框和拾色器
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-21
 */
export const ColorPicker: React.FC<ColorPickerProps> = ({
  value,
  onChange,
  label = '选择颜色',
  disabled = false,
  swatches = [
    '#000000', '#333333', '#666666', '#999999', '#CCCCCC', '#FFFFFF',
    '#FF0000', '#FF6600', '#FFCC00', '#00CC00', '#0066CC', '#6633CC',
    '#FF0066', '#FF00CC', '#CC00FF', '#6600FF', '#0000FF', '#00CCFF',
    '#00FFCC', '#00FF66', '#66FF00', '#CCFF00', '#FFFF00', '#FFCC66',
  ],
}) => {
  const [copied, setCopied] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  const { toast } = useToast();
  const hiddenInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleCopy = () => {
    navigator.clipboard.writeText(localValue).then(() => {
      setCopied(true);
      toast({
        variant: 'default',
        title: '复制成功',
        description: `颜色代码 ${localValue} 已复制到剪贴板`,
      });
      
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    });
  };

  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    // 验证是否为有效的HEX颜色格式
    if (/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(newValue) || newValue === '') {
      setLocalValue(newValue);
      if (newValue && /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(newValue)) {
        onChange(newValue);
      }
    }
  };

  const handleSwatchClick = (color: string) => {
    setLocalValue(color);
    onChange(color);
  };

  const handleNativeColorPicker = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value;
    setLocalValue(color);
    onChange(color);
  };

  // 检查文字颜色是否应该为白色（深色背景）
  const shouldUseWhiteText = () => {
    const rgb = hexToRgb(localValue);
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
    <div className={`w-full ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      {label && (
        <Label className="block text-sm font-medium mb-2">{label}</Label>
      )}
      
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="secondary"
            className="w-full justify-between border border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
            onClick={() => {
              // 点击时触发原生颜色选择器
              if (hiddenInputRef.current) {
                hiddenInputRef.current.click();
              }
            }}
          >
            <div className="flex items-center gap-3 w-full">
              <div
                className={`h-6 w-6 rounded-sm border border-gray-300 dark:border-gray-600 ${textColorClass}`}
                style={{ backgroundColor: localValue }}
              ></div>
              <span className="font-mono text-sm flex-1 truncate">{localValue}</span>
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 border-0 shadow-lg rounded-lg">
          <Card className="w-[280px] border-0">
            <CardContent className="p-4 space-y-4">
              {/* 颜色预览和输入 */}
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={localValue}
                    onChange={handleHexChange}
                    placeholder="#000000"
                    className="font-mono text-sm"
                    maxLength={7}
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={handleCopy}
                    className="h-9 w-9"
                  >
                    {copied ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              
              {/* 颜色样本 */}
              <div className="space-y-2">
                <Label className="text-xs font-medium">常用颜色</Label>
                <div className="grid grid-cols-8 gap-1">
                  {swatches.map((color, index) => (
                    <button
                      key={index}
                      className={`h-6 w-6 rounded-sm border border-gray-200 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${localValue === color ? 'ring-2 ring-blue-500' : ''}`}
                      style={{ backgroundColor: color }}
                      onClick={() => handleSwatchClick(color)}
                      title={color}
                    />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </PopoverContent>
      </Popover>
      
      {/* 隐藏的原生颜色输入 */}
      <input
        ref={hiddenInputRef}
        type="color"
        value={localValue}
        onChange={handleNativeColorPicker}
        className="sr-only"
      />
    </div>
  );
};

export default ColorPicker;