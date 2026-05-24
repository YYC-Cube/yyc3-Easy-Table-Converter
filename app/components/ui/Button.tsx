/**
 * @file 按钮组件
 * @description 提供统一的按钮样式和交互行为
 * @module ui/Button
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 * @updated 2024-10-15
 */

import React, { ButtonHTMLAttributes, forwardRef } from 'react';
import type { VariantProps } from 'class-variance-authority';
import { cva } from 'class-variance-authority';

// 按钮变体样式定义
const buttonVariants = cva(
  [
    'inline-flex',
    'items-center',
    'justify-center',
    'rounded-md',
    'text-sm',
    'font-medium',
    'ring-offset-background',
    'transition-all',
    'focus-visible:outline-none',
    'focus-visible:ring-2',
    'focus-visible:ring-ring',
    'focus-visible:ring-offset-2',
    'disabled:pointer-events-none',
    'disabled:opacity-50',
    'disabled:cursor-not-allowed',
    'border', // 始终包含border属性，默认透明
  ],
  {
    variants: {
      // 按钮边线宽度变体
      borderWidth: {
        thin: 'border-2',
        medium: 'border-3',
        thick: 'border-4',
        none: '',
      },
      variant: {
        // 主要按钮 - 使用主色调
        default: 'bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/95 border-transparent',
        // 次要按钮 - 使用次要色调
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/90 active:bg-secondary/95 border-transparent',
        // 强调按钮 - 使用强调色
        accent: 'bg-accent text-accent-foreground hover:bg-accent/90 active:bg-accent/95 border-transparent',
        // 破坏性按钮 - 使用危险色
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 active:bg-destructive/95 border-transparent',
        // 幽灵按钮 - 透明背景，只有边框和文字
        ghost: 'hover:bg-accent hover:text-accent-foreground border-transparent',
        // 链接按钮 - 类似链接样式
        link: 'text-primary underline-offset-4 hover:underline border-transparent',
        // 图标按钮 - 专为图标设计
        icon: 'p-2 hover:bg-accent hover:text-accent-foreground rounded-full border-transparent',
        
        // 边线按钮变体 - 彩色边线，填充背景
        bordered: 'bg-background border-current text-primary hover:bg-primary/5 active:bg-primary/10',
        
        // 彩色边线按钮 - 蓝色
        borderedBlue: 'bg-background border-blue-500 text-blue-700 hover:bg-blue-50 active:bg-blue-100',
        // 彩色边线按钮 - 绿色
        borderedGreen: 'bg-background border-green-500 text-green-700 hover:bg-green-50 active:bg-green-100',
        // 彩色边线按钮 - 紫色
        borderedPurple: 'bg-background border-purple-500 text-purple-700 hover:bg-purple-50 active:bg-purple-100',
        // 彩色边线按钮 - 橙色
        borderedOrange: 'bg-background border-orange-500 text-orange-700 hover:bg-orange-50 active:bg-orange-100',
        // 彩色边线按钮 - 青色
        borderedCyan: 'bg-background border-cyan-500 text-cyan-700 hover:bg-cyan-50 active:bg-cyan-100',
        
        // 卡片类别按钮 - 数据类别
        data: 'bg-background border border-category-data/30 text-category-data hover:bg-category-data/10 active:bg-category-data/20',
        // 卡片类别按钮 - 图像类别
        image: 'bg-background border border-category-image/30 text-category-image hover:bg-category-image/10 active:bg-category-image/20',
        // 卡片类别按钮 - 文本类别
        text: 'bg-background border border-category-text/30 text-category-text hover:bg-category-text/10 active:bg-category-text/20',
        // 卡片类别按钮 - 颜色类别
        color: 'bg-background border border-category-color/30 text-category-color hover:bg-category-color/10 active:bg-category-color/20',
        // 卡片类别按钮 - 单位类别
        unit: 'bg-background border border-category-unit/30 text-category-unit hover:bg-category-unit/10 active:bg-category-unit/20',
      },
      size: {
        // 小尺寸按钮
        sm: 'h-9 px-3 rounded-md text-xs',
        // 中尺寸按钮 (默认)
        md: 'h-10 px-4 py-2 rounded-md',
        // 大尺寸按钮
        lg: 'h-11 px-8 rounded-md',
        // 图标按钮尺寸
        icon: 'h-9 w-9',
      },
      isFullWidth: {
        true: 'w-full justify-center',
      },
      isLoading: {
        true: 'opacity-80 pointer-events-none',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
      isFullWidth: false,
      isLoading: false,
      borderWidth: 'none',
    },
  }
);

// 按钮属性接口
export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  // 是否显示加载状态
  loading?: boolean;
  // 加载图标或文本
  loadingIcon?: React.ReactNode;
  // 左侧图标
  leftIcon?: React.ReactNode;
  // 右侧图标
  rightIcon?: React.ReactNode;
  // 是否禁用交互
  disabled?: boolean;
  // 是否展开到全屏宽度
  fullWidth?: boolean;
}

// 按钮组件实现
export const Button = forwardRef<HTMLButtonElement, ButtonProps>((props, ref) => {
  // 解构属性
  const {
    variant,
    size,
    loading = false,
    disabled = false,
    fullWidth = false,
    className,
    children,
    leftIcon,
    rightIcon,
    loadingIcon,
    ...buttonProps
  } = props;

  // 合并变体属性
  const variantProps = {
    variant,
    size,
    isFullWidth: fullWidth,
    isLoading: loading,
  };

  // 默认加载图标
  const defaultLoadingIcon = (
    <svg
      className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      ></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
  );

  return (
    <button
      ref={ref}
      className={`${buttonVariants(variantProps)} ${className || ''}`}
      disabled={disabled || loading}
      {...buttonProps}
    >
      {/* 显示加载状态 */}
      {loading && (loadingIcon || defaultLoadingIcon)}
      
      {/* 显示左侧图标 */}
      {leftIcon && !loading && <span className="mr-2">{leftIcon}</span>}
      
      {/* 按钮内容 */}
      {children}
      
      {/* 显示右侧图标 */}
      {rightIcon && !loading && <span className="ml-2">{rightIcon}</span>}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;