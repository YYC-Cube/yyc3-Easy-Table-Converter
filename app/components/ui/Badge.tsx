/**
 * @file 徽章组件
 * @description 提供统一的标签和状态标识展示方式
 * @module ui/Badge
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 * @updated 2024-10-15
 */

import React, { HTMLAttributes, forwardRef } from 'react';
import type { VariantProps } from 'class-variance-authority';
import { cva } from 'class-variance-authority';

// 徽章变体样式定义
const badgeVariants = cva(
  [
    'inline-flex',
    'items-center',
    'justify-center',
    'rounded-full',
    'font-medium',
    'transition-all',
    'duration-200',
  ],
  {
    variants: {
      variant: {
        // 默认徽章 - 使用主色调
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        // 次要徽章 - 使用次要色调
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/90',
        // 强调徽章 - 使用强调色
        accent: 'bg-accent text-accent-foreground hover:bg-accent/90',
        // 破坏性徽章 - 使用危险色
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        // 幽灵徽章 - 透明背景，只有边框和文字
        ghost: 'bg-transparent border border-input text-foreground hover:bg-accent/10',
        // 轮廓徽章 - 细边框
        outline: 'border border-input text-muted-foreground',
        // 数据类别徽章
        data: 'bg-category-data/10 text-category-data hover:bg-category-data/20 border border-category-data/30',
        // 图像类别徽章
        image: 'bg-category-image/10 text-category-image hover:bg-category-image/20 border border-category-image/30',
        // 文本类别徽章
        text: 'bg-category-text/10 text-category-text hover:bg-category-text/20 border border-category-text/30',
        // 颜色类别徽章
        color: 'bg-category-color/10 text-category-color hover:bg-category-color/20 border border-category-color/30',
        // 单位类别徽章
        unit: 'bg-category-unit/10 text-category-unit hover:bg-category-unit/20 border border-category-unit/30',
        // 成功状态徽章
        success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
        // 警告状态徽章
        warning: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
        // 信息状态徽章
        info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      },
      size: {
        // 小型徽章
        sm: 'h-5 px-1.5 text-xs',
        // 中型徽章（默认）
        md: 'h-6 px-2 text-xs',
        // 大型徽章
        lg: 'h-7 px-2.5 text-sm',
        // 微型徽章（仅图标）
        icon: 'h-4 w-4 p-0 flex items-center justify-center',
      },
      pill: {
        // 是否为药丸形状
        true: 'rounded-full',
        false: 'rounded-md',
      },
      subtle: {
        // 是否为柔和样式
        true: 'opacity-75 hover:opacity-100',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
      pill: true,
      subtle: false,
    },
  }
);

// 徽章属性接口
export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  // 徽章内容
  children?: React.ReactNode;
  // 左侧图标
  leftIcon?: React.ReactNode;
  // 右侧图标
  rightIcon?: React.ReactNode;
  // 是否可点击
  clickable?: boolean;
  // 点击事件处理函数
  onClick?: () => void;
  // 是否显示边框
  bordered?: boolean;
}

// 徽章组件实现
export const Badge = forwardRef<HTMLSpanElement, BadgeProps>((props, ref) => {
  // 解构属性
  const {
    variant,
    size,
    pill,
    subtle,
    children,
    leftIcon,
    rightIcon,
    clickable = false,
    onClick,
    bordered = false,
    className,
    ...spanProps
  } = props;

  // 基础样式
  const variantProps = { variant, size, pill, subtle };
  const baseClasses = [badgeVariants(variantProps)];

  // 添加边框样式
  if (bordered && variant !== 'outline') {
    baseClasses.push('border border-current/20');
  }

  // 添加可点击样式
  if (clickable) {
    baseClasses.push('cursor-pointer active:scale-95');
  }

  // 合并自定义类名
  const combinedClassName = [baseClasses.join(' '), className].filter(Boolean).join(' ');

  return (
    <span
      ref={ref}
      className={combinedClassName}
      onClick={clickable && onClick ? onClick : undefined}
      {...spanProps}
    >
      {/* 左侧图标 */}
      {leftIcon && <span className="mr-1.5 h-3 w-3 flex-shrink-0">{leftIcon}</span>}
      
      {/* 徽章内容 */}
      {children}
      
      {/* 右侧图标 */}
      {rightIcon && <span className="ml-1.5 h-3 w-3 flex-shrink-0">{rightIcon}</span>}
    </span>
  );
});

Badge.displayName = 'Badge';

export default Badge;