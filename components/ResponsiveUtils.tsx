/**
 * @file 响应式设计工具组件
 * @description 提供响应式设计的工具函数、断点定义和响应式容器组件
 * @module components/responsive-utils
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-16
 * @updated 2024-10-16
 */

'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useMediaQuery, useTheme } from '@/components/ui/hooks';
import {
  Smartphone,
  Tablet,
  Laptop,
  Monitor,
  Maximize,
  Minimize,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// 响应式断点定义
export const BREAKPOINTS = {
  xs: 360,    // 超小型手机
  sm: 640,    // 小型手机
  md: 768,    // 平板竖屏
  lg: 1024,   // 平板横屏/小型笔记本
  xl: 1280,   // 标准笔记本/桌面
  '2xl': 1536, // 大型桌面显示器
  '3xl': 1920  // 超大型桌面显示器
};

// 设备类型定义
export type DeviceType = 
  | 'mobile'     // 移动设备 (xs, sm)
  | 'tablet'     // 平板设备 (md, lg)
  | 'desktop';   // 桌面设备 (xl, 2xl, 3xl)

// 响应式工具类定义
export interface ResponsiveUtils {
  // 当前断点
  currentBreakpoint: keyof typeof BREAKPOINTS;
  // 当前设备类型
  deviceType: DeviceType;
  // 是否为移动设备
  isMobile: boolean;
  // 是否为平板设备
  isTablet: boolean;
  // 是否为桌面设备
  isDesktop: boolean;
  // 视口宽度
  viewportWidth: number;
  // 视口高度
  viewportHeight: number;
  // 是否为横屏
  isLandscape: boolean;
  // 是否为竖屏
  isPortrait: boolean;
  // 获取响应式配置值
  getValue: <T>(values: Partial<Record<keyof typeof BREAKPOINTS, T>>) => T | undefined;
  // 监听断点变化
  onBreakpointChange: (callback: (breakpoint: keyof typeof BREAKPOINTS) => void) => () => void;
}

/**
 * 响应式工具类 - 提供响应式设计相关的功能和状态
 */
export class ResponsiveHelper {
  // 获取当前断点
  static getCurrentBreakpoint(width: number): keyof typeof BREAKPOINTS {
    const breakpoints = Object.entries(BREAKPOINTS).sort((a, b) => b[1] - a[1]);
    
    for (const [breakpoint, value] of breakpoints) {
      if (width >= value) {
        return breakpoint as keyof typeof BREAKPOINTS;
      }
    }
    
    return 'xs';
  }
  
  // 根据宽度获取设备类型
  static getDeviceType(width: number): DeviceType {
    if (width < BREAKPOINTS.md) {
      return 'mobile';
    } else if (width < BREAKPOINTS.xl) {
      return 'tablet';
    } else {
      return 'desktop';
    }
  }
  
  // 获取响应式值
  static getResponsiveValue<T>(
    width: number, 
    values: Partial<Record<keyof typeof BREAKPOINTS, T>>
  ): T | undefined {
    const currentBreakpoint = this.getCurrentBreakpoint(width);
    const breakpoints = Object.keys(BREAKPOINTS) as Array<keyof typeof BREAKPOINTS>;
    
    // 从当前断点开始向下查找有效值
    for (let i = breakpoints.indexOf(currentBreakpoint); i >= 0; i--) {
      const breakpoint = breakpoints[i];
      if (values[breakpoint] !== undefined) {
        return values[breakpoint];
      }
    }
    
    return undefined;
  }
}

/**
 * 使用响应式工具的自定义Hook
 */
export const useResponsive = (): ResponsiveUtils => {
  const [viewportWidth, setViewportWidth] = useState<number>(typeof window !== 'undefined' ? window.innerWidth : 0);
  const [viewportHeight, setViewportHeight] = useState<number>(typeof window !== 'undefined' ? window.innerHeight : 0);
  const [callbacks, setCallbacks] = useState<Array<(breakpoint: keyof typeof BREAKPOINTS) => void>>([]);
  
  // 当前断点
  const currentBreakpoint = useMemo(() => {
    return ResponsiveHelper.getCurrentBreakpoint(viewportWidth);
  }, [viewportWidth]);
  
  // 当前设备类型
  const deviceType = useMemo(() => {
    return ResponsiveHelper.getDeviceType(viewportWidth);
  }, [viewportWidth]);
  
  // 设备状态
  const isMobile = deviceType === 'mobile';
  const isTablet = deviceType === 'tablet';
  const isDesktop = deviceType === 'desktop';
  const isLandscape = viewportWidth > viewportHeight;
  const isPortrait = viewportWidth <= viewportHeight;
  
  // 监听窗口大小变化
  useEffect(() => {
    const handleResize = () => {
      setViewportWidth(window.innerWidth);
      setViewportHeight(window.innerHeight);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // 监听断点变化并调用回调
  useEffect(() => {
    callbacks.forEach(callback => callback(currentBreakpoint));
  }, [currentBreakpoint, callbacks]);
  
  // 添加断点变化监听
  const onBreakpointChange = useCallback((callback: (breakpoint: keyof typeof BREAKPOINTS) => void) => {
    setCallbacks(prev => [...prev, callback]);
    
    // 返回清理函数
    return () => {
      setCallbacks(prev => prev.filter(cb => cb !== callback));
    };
  }, []);
  
  // 获取响应式配置值
  const getValue = useCallback(<T>(values: Partial<Record<keyof typeof BREAKPOINTS, T>>): T | undefined => {
    return ResponsiveHelper.getResponsiveValue(viewportWidth, values);
  }, [viewportWidth]);
  
  return {
    currentBreakpoint,
    deviceType,
    isMobile,
    isTablet,
    isDesktop,
    viewportWidth,
    viewportHeight,
    isLandscape,
    isPortrait,
    getValue,
    onBreakpointChange
  };
};

// 响应式容器属性接口
interface ResponsiveContainerProps {
  // 子组件
  children: React.ReactNode;
  // 最大宽度
  maxWidth?: keyof typeof BREAKPOINTS | string | number;
  // 最小宽度
  minWidth?: keyof typeof BREAKPOINTS | string | number;
  // 是否启用padding
  padding?: boolean | 'sm' | 'md' | 'lg';
  // 是否启用margin
  margin?: boolean | 'sm' | 'md' | 'lg';
  // 是否居中
  center?: boolean;
  // CSS类名
  className?: string;
  // 自定义样式
  style?: React.CSSProperties;
}

/**
 * 响应式容器组件 - 提供响应式的布局容器
 */
export const ResponsiveContainer: React.FC<ResponsiveContainerProps> = ({
  children,
  maxWidth,
  minWidth,
  padding = 'md',
  margin = true,
  center = true,
  className = '',
  style = {}
}) => {
  const { getValue } = useResponsive();
  
  // 处理响应式最大宽度
  const getResponsiveMaxWidth = useCallback((): string => {
    if (typeof maxWidth === 'string') return maxWidth;
    if (typeof maxWidth === 'number') return `${maxWidth}px`;
    if (maxWidth && BREAKPOINTS[maxWidth]) return `${BREAKPOINTS[maxWidth]}px`;
    return 'none';
  }, [maxWidth]);
  
  // 处理响应式最小宽度
  const getResponsiveMinWidth = useCallback((): string => {
    if (typeof minWidth === 'string') return minWidth;
    if (typeof minWidth === 'number') return `${minWidth}px`;
    if (minWidth && BREAKPOINTS[minWidth]) return `${BREAKPOINTS[minWidth]}px`;
    return 'none';
  }, [minWidth]);
  
  // 处理响应式padding
  const getPaddingClass = useCallback((): string => {
    if (!padding) return '';
    
    switch (padding) {
      case 'sm':
        return 'px-2 py-1';
      case 'md':
        return 'px-4 py-2';
      case 'lg':
        return 'px-6 py-4';
      default:
        return 'px-4 py-2';
    }
  }, [padding]);
  
  // 处理响应式margin
  const getMarginClass = useCallback((): string => {
    if (!margin) return '';
    
    switch (margin) {
      case 'sm':
        return 'mx-2 my-1';
      case 'md':
        return 'mx-auto my-4';
      case 'lg':
        return 'mx-auto my-8';
      default:
        return 'mx-auto my-4';
    }
  }, [margin]);
  
  // 计算容器样式
  const containerStyle = useMemo((): React.CSSProperties => ({
    maxWidth: getResponsiveMaxWidth(),
    minWidth: getResponsiveMinWidth(),
    marginLeft: center ? 'auto' : undefined,
    marginRight: center ? 'auto' : undefined,
    ...style
  }), [center, getResponsiveMaxWidth, getResponsiveMinWidth, style]);
  
  const containerClasses = [
    getPaddingClass(),
    margin && center ? '' : getMarginClass(),
    className
  ].filter(Boolean).join(' ');
  
  return (
    <div className={containerClasses} style={containerStyle}>
      {children}
    </div>
  );
};

// 响应式网格布局属性接口
interface ResponsiveGridProps {
  // 子组件
  children: React.ReactNode;
  // 列数配置
  columns?: Partial<Record<keyof typeof BREAKPOINTS, number>>;
  // 间距配置
  gap?: Partial<Record<keyof typeof BREAKPOINTS, string>>;
  // 行间距配置
  rowGap?: Partial<Record<keyof typeof BREAKPOINTS, string>>;
  // 列间距配置
  columnGap?: Partial<Record<keyof typeof BREAKPOINTS, string>>;
  // 是否自动换行
  wrap?: boolean;
  // 对齐方式
  alignItems?: 'start' | 'center' | 'end' | 'stretch';
  // 内容对齐方式
  justifyContent?: 'start' | 'center' | 'end' | 'space-between' | 'space-around' | 'space-evenly';
  // CSS类名
  className?: string;
  // 自定义样式
  style?: React.CSSProperties;
}

/**
 * 响应式网格布局组件 - 提供响应式的网格布局
 */
export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  columns = { xs: 1, sm: 2, md: 3, lg: 4, xl: 5, '2xl': 6 },
  gap = { xs: '0.5rem', sm: '1rem', md: '1.5rem', lg: '2rem' },
  rowGap,
  columnGap,
  wrap = true,
  alignItems = 'stretch',
  justifyContent = 'start',
  className = '',
  style = {}
}) => {
  const { getValue } = useResponsive();
  
  // 获取响应式列数
  const gridColumns = getValue(columns) || 1;
  
  // 获取响应式间距
  const gridGap = getValue(gap) || '1rem';
  const gridRowGap = getValue(rowGap) || gridGap;
  const gridColumnGap = getValue(columnGap) || gridGap;
  
  // 计算网格样式
  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: `repeat(${gridColumns}, minmax(0, 1fr))`,
    gap: gridGap,
    rowGap: gridRowGap,
    columnGap: gridColumnGap,
    flexWrap: wrap ? 'wrap' : 'nowrap',
    alignItems,
    justifyContent,
    ...style
  };
  
  return (
    <div className={className} style={gridStyle}>
      {children}
    </div>
  );
};

// 响应式列属性接口
interface ResponsiveColProps {
  // 子组件
  children: React.ReactNode;
  // 列宽配置 (1-12)
  span?: Partial<Record<keyof typeof BREAKPOINTS, number>>;
  // 偏移量配置
  offset?: Partial<Record<keyof typeof BREAKPOINTS, number>>;
  // 对齐方式
  alignSelf?: 'start' | 'center' | 'end' | 'stretch';
  // 是否占满整行
  fullWidth?: boolean;
  // CSS类名
  className?: string;
  // 自定义样式
  style?: React.CSSProperties;
}

/**
 * 响应式列组件 - 提供响应式的网格列
 */
export const ResponsiveCol: React.FC<ResponsiveColProps> = ({
  children,
  span = { xs: 12 },
  offset,
  alignSelf,
  fullWidth = false,
  className = '',
  style = {}
}) => {
  const { getValue, isMobile } = useResponsive();
  
  // 获取响应式列宽
  const columnSpan = getValue(span) || 12;
  const columnOffset = getValue(offset) || 0;
  
  // 计算列样式
  const colStyle: React.CSSProperties = {
    gridColumn: fullWidth 
      ? '1 / -1' 
      : `${columnOffset + 1} / span ${Math.min(columnSpan, 12 - columnOffset)}`,
    alignSelf,
    ...style
  };
  
  return (
    <div className={className} style={colStyle}>
      {children}
    </div>
  );
};

// 响应式组件显示控制属性接口
interface ResponsiveShowProps {
  // 子组件
  children: React.ReactNode;
  // 在哪些断点显示
  show?: Partial<Record<keyof typeof BREAKPOINTS, boolean>>;
  // 在哪些断点隐藏
  hide?: Partial<Record<keyof typeof BREAKPOINTS, boolean>>;
  // 设备类型显示控制
  deviceType?: DeviceType | DeviceType[];
  // 默认显示状态
  defaultShow?: boolean;
}

/**
 * 响应式显示组件 - 根据断点和设备类型控制组件的显示和隐藏
 */
export const ResponsiveShow: React.FC<ResponsiveShowProps> = ({
  children,
  show,
  hide,
  deviceType,
  defaultShow = true
}) => {
  const { currentBreakpoint, deviceType: currentDeviceType } = useResponsive();
  
  // 计算是否应该显示
  const shouldShow = useMemo((): boolean => {
    // 首先检查特定断点的显示控制
    if (show && typeof show[currentBreakpoint] === 'boolean') {
      return show[currentBreakpoint];
    }
    
    // 然后检查特定断点的隐藏控制
    if (hide && typeof hide[currentBreakpoint] === 'boolean') {
      return !hide[currentBreakpoint];
    }
    
    // 最后检查设备类型控制
    if (deviceType) {
      if (Array.isArray(deviceType)) {
        return deviceType.includes(currentDeviceType);
      }
      return currentDeviceType === deviceType;
    }
    
    // 默认显示状态
    return defaultShow;
  }, [currentBreakpoint, currentDeviceType, defaultShow, deviceType, hide, show]);
  
  if (!shouldShow) return null;
  
  return <>{children}</>;
};

/**
 * 响应式断点指示器组件 - 用于开发和调试
 */
export const ResponsiveDebugger: React.FC = () => {
  const [showDebugger, setShowDebugger] = useState(false);
  const { 
    currentBreakpoint, 
    deviceType, 
    viewportWidth, 
    viewportHeight, 
    isLandscape,
    isPortrait 
  } = useResponsive();
  
  // 断点颜色映射
  const breakpointColors: Record<keyof typeof BREAKPOINTS, string> = {
    xs: 'bg-red-500',
    sm: 'bg-orange-500',
    md: 'bg-yellow-500',
    lg: 'bg-green-500',
    xl: 'bg-blue-500',
    '2xl': 'bg-indigo-500',
    '3xl': 'bg-purple-500'
  };
  
  // 设备类型图标
  const deviceIcon = useMemo(() => {
    switch (deviceType) {
      case 'mobile':
        return <Smartphone className="h-4 w-4 mr-1" />;
      case 'tablet':
        return <Tablet className="h-4 w-4 mr-1" />;
      case 'desktop':
        return <Monitor className="h-4 w-4 mr-1" />;
      default:
        return null;
    }
  }, [deviceType]);
  
  return (
    <>
      {/* 调试器开关 */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowDebugger(!showDebugger)}
              className="fixed bottom-4 right-4 z-50 h-10 w-10 rounded-full bg-black/50 text-white hover:bg-black/70"
              style={{ display: process.env.NODE_ENV === 'development' ? 'flex' : 'none' }}
            >
              {showDebugger ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>切换响应式调试器</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      {/* 调试信息面板 */}
      {showDebugger && process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-16 right-4 z-50 bg-white dark:bg-gray-900 shadow-lg rounded-lg p-4 border border-gray-200 dark:border-gray-700 w-64 animate-fadeIn">
          <div className="text-sm font-medium mb-2 text-gray-900 dark:text-white">响应式调试信息</div>
          
          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-gray-500 dark:text-gray-400">视口尺寸:</span>
              <span className="font-mono text-gray-900 dark:text-white">
                {viewportWidth}x{viewportHeight}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-500 dark:text-gray-400">方向:</span>
              <span className="font-mono text-gray-900 dark:text-white">
                {isLandscape ? '横屏' : '竖屏'}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-500 dark:text-gray-400">设备类型:</span>
              <div className="flex items-center font-mono text-gray-900 dark:text-white">
                {deviceIcon}
                {deviceType}
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-500 dark:text-gray-400">当前断点:</span>
              <Badge className={`font-mono ${breakpointColors[currentBreakpoint]}`}>
                {currentBreakpoint}
              </Badge>
            </div>
          </div>
          
          {/* 断点指示器 */}
          <div className="mt-3 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            {Object.entries(BREAKPOINTS).map(([breakpoint, value]) => {
              const bp = breakpoint as keyof typeof BREAKPOINTS;
              const widthPercent = (value / 2000) * 100; // 基于最大宽度2000px计算
              
              return (
                <div
                  key={breakpoint}
                  className={`absolute h-full ${breakpointColors[bp]}`}
                  style={{
                    left: `${widthPercent}%`,
                    width: '2px',
                    opacity: viewportWidth >= value ? 1 : 0.3
                  }}
                  title={breakpoint}
                />
              );
            })}
            
            {/* 当前视口指示器 */}
            <div
              className="absolute h-full w-0.5 bg-black dark:bg-white"
              style={{ left: `${(viewportWidth / 2000) * 100}%` }}
            />
          </div>
        </div>
      )}
    </>
  );
};

// 响应式工具函数集合
export const responsiveUtils = {
  // 生成响应式类名
  className: (...args: (string | undefined | false | null)[]) => {
    return args.filter(Boolean).join(' ');
  },
  
  // 生成响应式样式
  style: <T extends React.CSSProperties>(styles: T): T => {
    return styles;
  },
  
  // 生成响应式的媒体查询
  mediaQuery: (breakpoint: keyof typeof BREAKPOINTS, min = true): string => {
    const operator = min ? 'min' : 'max';
    return `@media (${operator}-width: ${BREAKPOINTS[breakpoint]}px)`;
  },
  
  // 生成响应式Tailwind类名
  tailwind: <T extends Record<string, string>>(classes: T): T => {
    return classes;
  }
};

export default {
  BREAKPOINTS,
  ResponsiveHelper,
  useResponsive,
  ResponsiveContainer,
  ResponsiveGrid,
  ResponsiveCol,
  ResponsiveShow,
  ResponsiveDebugger,
  utils: responsiveUtils
};
