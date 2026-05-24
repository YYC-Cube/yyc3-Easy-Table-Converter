/**
 * @file 工具提示组件
 * @description 提供统一的悬停提示信息展示方式
 * @module ui/Tooltip
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 * @updated 2024-10-15
 */

import React, { forwardRef, useState, useRef, useEffect } from 'react';

// 位置类型定义
type TooltipPosition = 
  | 'top' 
  | 'bottom' 
  | 'left' 
  | 'right' 
  | 'top-left' 
  | 'top-right' 
  | 'bottom-left' 
  | 'bottom-right';

// 工具提示属性接口
export interface TooltipProps {
  // 提示内容
  content: React.ReactNode;
  // 子元素（触发提示的元素）
  children: React.ReactNode;
  // 提示位置
  position?: TooltipPosition;
  // 显示延迟（毫秒）
  delay?: number;
  // 隐藏延迟（毫秒）
  hideDelay?: number;
  // 是否始终显示
  alwaysVisible?: boolean;
  // 是否禁用
  disabled?: boolean;
  // 最大宽度
  maxWidth?: string;
  // 自定义类名
  className?: string;
  // 提示内容自定义类名
  contentClassName?: string;
  // 动画类型
  animation?: 'fade' | 'scale' | 'slide';
  // 是否显示箭头
  showArrow?: boolean;
}

// 工具提示组件实现
export const Tooltip = forwardRef<HTMLDivElement, TooltipProps>((props, ref) => {
  // 解构属性
  const {
    content,
    children,
    position = 'top',
    delay = 300,
    hideDelay = 200,
    alwaysVisible = false,
    disabled = false,
    maxWidth = '250px',
    className,
    contentClassName,
    animation = 'fade',
    showArrow = true,
  } = props;

  // 状态
  const [isVisible, setIsVisible] = useState(alwaysVisible);
  // 引用
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 清理定时器
  const clearTimers = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  };

  // 显示提示
  const handleShow = () => {
    if (disabled || alwaysVisible) return;
    clearTimers();
    timerRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  // 隐藏提示
  const handleHide = () => {
    if (disabled || alwaysVisible) return;
    clearTimers();
    hideTimerRef.current = setTimeout(() => {
      setIsVisible(false);
    }, hideDelay);
  };

  // 鼠标进入提示内容区域时不要隐藏
  const handleTooltipMouseEnter = () => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  };

  // 鼠标离开提示内容区域时隐藏
  const handleTooltipMouseLeave = () => {
    handleHide();
  };

  // 组件卸载时清理定时器
  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, []);

  // 位置样式映射
  const positionStyles: Record<TooltipPosition, string> = {
    'top': 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    'bottom': 'top-full left-1/2 -translate-x-1/2 mt-2',
    'left': 'right-full top-1/2 -translate-y-1/2 mr-2',
    'right': 'left-full top-1/2 -translate-y-1/2 ml-2',
    'top-left': 'bottom-full left-0 mb-2',
    'top-right': 'bottom-full right-0 mb-2',
    'bottom-left': 'top-full left-0 mt-2',
    'bottom-right': 'top-full right-0 mt-2',
  };

  // 箭头位置样式映射
  const arrowPositionStyles: Record<TooltipPosition, string> = {
    'top': 'bottom-[-6px] left-1/2 -translate-x-1/2 rotate-180',
    'bottom': 'top-[-6px] left-1/2 -translate-x-1/2',
    'left': 'right-[-6px] top-1/2 -translate-y-1/2 -rotate-90',
    'right': 'left-[-6px] top-1/2 -translate-y-1/2 rotate-90',
    'top-left': 'bottom-[-6px] left-[10px] rotate-180',
    'top-right': 'bottom-[-6px] right-[10px] rotate-180',
    'bottom-left': 'top-[-6px] left-[10px]',
    'bottom-right': 'top-[-6px] right-[10px]',
  };

  // 动画样式映射
  const animationStyles: Record<string, string> = {
    'fade': 'opacity-0 transition-opacity duration-200',
    'scale': 'opacity-0 scale-90 transition-all duration-200',
    'slide': 'opacity-0 translate-y-1 transition-all duration-200',
  };

  // 动画显示样式映射
  const animationShowStyles: Record<string, string> = {
    'fade': 'opacity-100',
    'scale': 'opacity-100 scale-100',
    'slide': 'opacity-100 translate-y-0',
  };

  return (
    <div
      ref={(el) => {
        // 处理外部传入的ref
        if (typeof ref === 'function') {
          ref(el);
        } else if (ref) {
          (ref).current = el;
        }
      }}
      className={`relative inline-block ${className}`}
      onMouseEnter={handleShow}
      onMouseLeave={handleHide}
      onFocus={handleShow}
      onBlur={handleHide}
      aria-describedby={tooltipRef.current?.id}
    >
      {/* 触发元素 */}
      <div className="relative">{children}</div>

      {/* 提示内容 */}
      {(!disabled || alwaysVisible) && (
        <div
          ref={tooltipRef}
          id={tooltipRef.current?.id || `tooltip-${Math.random().toString(36).substr(2, 9)}`}
          className={`
            absolute
            z-50
            bg-popover
            text-popover-foreground
            p-2
            rounded-md
            text-xs
            shadow-lg
            pointer-events-none
            ${positionStyles[position]}
            ${animationStyles[animation]}
            ${isVisible ? animationShowStyles[animation] : ''}
            ${contentClassName || ''}
          `}
          style={{ maxWidth }}
          role="tooltip"
          aria-hidden={!isVisible}
          onMouseEnter={handleTooltipMouseEnter}
          onMouseLeave={handleTooltipMouseLeave}
        >
          {/* 提示内容 */}
          <div className="relative z-10">{content}</div>

          {/* 箭头 */}
          {showArrow && (
            <div
              className={`
                absolute
                w-3
                h-3
                bg-popover
                border-0
                ${arrowPositionStyles[position]}
                pointer-events-none
              `}
              style={{
                clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
              }}
            />
          )}
        </div>
      )}
    </div>
  );
});

Tooltip.displayName = 'Tooltip';

export default Tooltip;