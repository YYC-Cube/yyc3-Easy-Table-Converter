/**
 * @file 精度选择器组件
 * @description 用于控制单位换算结果的小数位数精度
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-21
 */

import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';

interface PrecisionSelectorProps {
  precision: string;
  onPrecisionChange: (precision: string) => void;
  label?: string;
  minPrecision?: number;
  maxPrecision?: number;
  className?: string;
}

/**
 * 精度选择器组件
 * 允许用户选择转换结果的小数位数
 */
export const PrecisionSelector: React.FC<PrecisionSelectorProps> = ({
  precision,
  onPrecisionChange,
  label = '精度设置',
  minPrecision = 0,
  maxPrecision = 15,
  className = '',
}) => {
  // 生成精度选项
  const precisionOptions = Array.from(
    { length: maxPrecision - minPrecision + 1 },
    (_, i) => i + minPrecision
  );

  // 获取精度描述
  const getPrecisionDescription = (value: number): string => {
    if (value === 0) return '整数（无小数位）';
    if (value <= 3) return '低精度（适合日常使用）';
    if (value <= 6) return '中等精度（适合大多数场景）';
    if (value <= 10) return '高精度（适合科学计算）';
    return '超高精度（适合专业计算）';
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="flex items-center justify-between">
        <Label htmlFor="precision" className="text-base font-medium text-gray-700">{label}</Label>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="text-blue-500 hover:text-blue-700 transition-colors">
                <Info className="w-4 h-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="text-sm">选择结果显示的小数位数。更高的精度会显示更多小数位，但可能会引入浮点计算误差。</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      <Select value={precision} onValueChange={onPrecisionChange}>
        <SelectTrigger id="precision" className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500">
          <SelectValue placeholder="选择精度" />
        </SelectTrigger>
        <SelectContent className="w-full">
          {precisionOptions.map((option) => (
            <SelectItem key={option} value={option.toString()}>
              <div className="flex flex-col">
                <span className="font-medium">{option} 位小数</span>
                <span className="text-xs text-gray-500">{getPrecisionDescription(option)}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

/**
 * 预设的低精度选择器（0-3位小数）
 */
export const LowPrecisionSelector: React.FC<Omit<PrecisionSelectorProps, 'minPrecision' | 'maxPrecision'>> = (props) => (
  <PrecisionSelector {...props} minPrecision={0} maxPrecision={3} />
);

/**
 * 预设的中等精度选择器（0-6位小数）
 */
export const MediumPrecisionSelector: React.FC<Omit<PrecisionSelectorProps, 'minPrecision' | 'maxPrecision'>> = (props) => (
  <PrecisionSelector {...props} minPrecision={0} maxPrecision={6} />
);

/**
 * 预设的高精度选择器（0-10位小数）
 */
export const HighPrecisionSelector: React.FC<Omit<PrecisionSelectorProps, 'minPrecision' | 'maxPrecision'>> = (props) => (
  <PrecisionSelector {...props} minPrecision={0} maxPrecision={10} />
);

export default PrecisionSelector;