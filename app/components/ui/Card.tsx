/**
 * @file 卡片组件
 * @description 提供统一的卡片样式和容器结构
 * @module ui/Card
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 * @updated 2024-10-15
 */

import React, { HTMLAttributes, forwardRef } from 'react';

// 卡片容器组件属性
export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  className?: string;
  children?: React.ReactNode;
  // 是否显示卡片阴影
  shadow?: boolean;
  // 是否有边框
  bordered?: boolean;
  // 是否可点击
  clickable?: boolean;
  // 卡片类别（对应不同的边框颜色）
  category?: 'data' | 'image' | 'text' | 'color' | 'unit';
  // 点击事件处理函数
  onClick?: () => void;
}

// 卡片容器组件
export const Card = forwardRef<HTMLDivElement, CardProps>((props, ref) => {
  const {
    className,
    children,
    shadow = true,
    bordered = true,
    clickable = false,
    category,
    onClick,
    ...divProps
  } = props;

  // 基础样式类名
  const baseClasses = [
    'bg-card',
    'rounded-lg',
    'transition-all',
    'duration-300',
    'overflow-hidden',
  ];

  // 添加阴影样式
  if (shadow) {
    baseClasses.push('shadow-md hover:shadow-lg');
  }

  // 添加边框样式
  if (bordered) {
    baseClasses.push('border');
  }

  // 添加类别样式（如果指定）
  if (category) {
    baseClasses.push(`card-${category}`);
  }

  // 添加点击样式
  if (clickable) {
    baseClasses.push('cursor-pointer hover:translate-y-[-2px]');
  }

  // 合并自定义类名
  const combinedClassName = [baseClasses.join(' '), className].filter(Boolean).join(' ');

  return (
    <div
      ref={ref}
      className={combinedClassName}
      onClick={clickable && onClick ? onClick : undefined}
      {...divProps}
    >
      {children}
    </div>
  );
});

Card.displayName = 'Card';

// 卡片标题组件属性
export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  className?: string;
  children?: React.ReactNode;
  // 是否使用精简模式
  compact?: boolean;
}

// 卡片标题组件
export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>((props, ref) => {
  const { className, children, compact = false, ...divProps } = props;

  const baseClasses = [
    'flex',
    'flex-col',
    'space-y-1',
    compact ? 'p-4' : 'p-6',
  ];

  const combinedClassName = [baseClasses.join(' '), className].filter(Boolean).join(' ');

  return (
    <div ref={ref} className={combinedClassName} {...divProps}>
      {children}
    </div>
  );
});

CardHeader.displayName = 'CardHeader';

// 卡片标题文本组件属性
export interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  className?: string;
  children?: React.ReactNode;
  level?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  // 是否使用大标题
  large?: boolean;
}

// 卡片标题文本组件
export const CardTitle = forwardRef<HTMLHeadingElement, CardTitleProps>((props, ref) => {
  const { className, children, level = 'h3', large = false, ...headingProps } = props;

  const baseClasses = [
    'font-semibold',
    'leading-none',
    'tracking-tight',
    large
      ? 'text-2xl md:text-3xl' // 大标题样式
      : level === 'h1'
      ? 'text-2xl'
      : level === 'h2'
      ? 'text-xl'
      : level === 'h3'
      ? 'text-lg'
      : level === 'h4'
      ? 'text-base'
      : 'text-sm', // 默认标题大小
  ];

  const combinedClassName = [baseClasses.join(' '), className].filter(Boolean).join(' ');

  const Tag = level;

  return (
    <Tag ref={ref} className={combinedClassName} {...headingProps}>
      {children}
    </Tag>
  );
});

CardTitle.displayName = 'CardTitle';

// 卡片描述组件属性
export interface CardDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {
  className?: string;
  children?: React.ReactNode;
}

// 卡片描述组件
export const CardDescription = forwardRef<HTMLParagraphElement, CardDescriptionProps>(
  (props, ref) => {
    const { className, children, ...pProps } = props;

    const baseClasses = [
      'text-muted-foreground',
      'text-sm',
      'leading-relaxed',
    ];

    const combinedClassName = [baseClasses.join(' '), className].filter(Boolean).join(' ');

    return (
      <p ref={ref} className={combinedClassName} {...pProps}>
        {children}
      </p>
    );
  }
);

CardDescription.displayName = 'CardDescription';

// 卡片内容组件属性
export interface CardContentProps extends HTMLAttributes<HTMLDivElement> {
  className?: string;
  children?: React.ReactNode;
  // 是否使用精简模式
  compact?: boolean;
}

// 卡片内容组件
export const CardContent = forwardRef<HTMLDivElement, CardContentProps>((props, ref) => {
  const { className, children, compact = false, ...divProps } = props;

  const baseClasses = [compact ? 'p-4' : 'p-6'];

  const combinedClassName = [baseClasses.join(' '), className].filter(Boolean).join(' ');

  return (
    <div ref={ref} className={combinedClassName} {...divProps}>
      {children}
    </div>
  );
});

CardContent.displayName = 'CardContent';

// 卡片底部组件属性
export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  className?: string;
  children?: React.ReactNode;
  // 是否使用精简模式
  compact?: boolean;
  // 是否右对齐
  rightAligned?: boolean;
}

// 卡片底部组件
export const CardFooter = forwardRef<HTMLDivElement, CardFooterProps>((props, ref) => {
  const {
    className,
    children,
    compact = false,
    rightAligned = false,
    ...divProps
  } = props;

  const baseClasses = [
    'flex',
    'items-center',
    compact ? 'p-4' : 'p-6',
    rightAligned ? 'justify-end' : 'justify-between',
    'gap-4',
  ];

  const combinedClassName = [baseClasses.join(' '), className].filter(Boolean).join(' ');

  return (
    <div ref={ref} className={combinedClassName} {...divProps}>
      {children}
    </div>
  );
});

CardFooter.displayName = 'CardFooter';

export default Card;