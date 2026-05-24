/**
 * @file 单位交换按钮组件
 * @description 提供快速交换源单位和目标单位的功能
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-21
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { RotateCcw } from 'lucide-react';

interface SwapUnitsButtonProps {
  onSwap: () => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * 单位交换按钮组件
 * 提供动画效果的单位交换功能
 */
export const SwapUnitsButton: React.FC<SwapUnitsButtonProps> = ({
  onSwap,
  disabled = false,
  size = 'md',
  className = '',
}) => {
  // 根据size计算按钮尺寸
  const getButtonSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'h-8 w-8';
      case 'lg':
        return 'h-12 w-12';
      default: // md
        return 'h-10 w-10';
    }
  };

  // 旋转动画类
  const spinAnimation = disabled ? '' : 'transition-transform hover:rotate-180 duration-500';

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={onSwap}
            disabled={disabled}
            variant="ghost"
            className={`
              flex items-center justify-center 
              ${getButtonSizeClasses()}
              ${spinAnimation}
              ${className}
            `}
            aria-label="交换单位"
          >
            <RotateCcw 
              className={`
                ${size === 'sm' ? 'h-4 w-4' : size === 'lg' ? 'h-6 w-6' : 'h-5 w-5'}
                ${disabled ? 'text-gray-400' : 'text-gray-600 hover:text-blue-500'}
              `} 
            />
          </Button>
        </TooltipTrigger>
        <TooltipContent>交换源单位和目标单位</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

/**
 * 内联式单位交换按钮
 * 适合在两个选择器之间使用的紧凑版本
 */
export const InlineSwapButton: React.FC<Omit<SwapUnitsButtonProps, 'size'>> = ({
  onSwap,
  disabled = false,
  className = '',
}) => {
  return (
    <SwapUnitsButton 
      onSwap={onSwap}
      disabled={disabled}
      size="sm"
      className={`
        mx-auto my-2 
        bg-white dark:bg-gray-800 
        border border-gray-200 dark:border-gray-700 
        rounded-full 
        shadow-sm 
        ${className}
      `} 
    />
  );
};

export default SwapUnitsButton;