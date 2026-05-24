/**
 * @file 性能优化组件
 * @description 整合响应式设计和图像优化功能，提升移动端体验
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-24
 */

import React, { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';
import { useResponsive } from '../../components/ResponsiveUtils';
import { PerformanceMonitorService, PerformanceMetrics } from './PerformanceMonitor';
import { ImageOptimizationService } from './imageOptimization';

// 性能优化配置接口
interface PerformanceOptimizerConfig {
  /** 是否启用响应式设计 */
  enableResponsive?: boolean;
  /** 是否启用图像优化 */
  enableImageOptimization?: boolean;
  /** 是否启用虚拟滚动 */
  enableVirtualScrolling?: boolean;
  /** 是否启用触摸优化 */
  enableTouchOptimization?: boolean;
  /** 是否启用性能监控 */
  enablePerformanceMonitoring?: boolean;
  /** 虚拟滚动项高度 */
  itemHeight?: number;
  /** 预加载项数量 */
  overscanCount?: number;
  /** 性能监控采样率 */
  sampleRate?: number;
}

// 性能优化上下文接口
interface PerformanceOptimizerContextType {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  currentBreakpoint: string;
  viewportWidth: number;
  viewportHeight: number;
  orientation: 'portrait' | 'landscape';
  optimizeImage: (src: string, options?: ImageOptimizationOptions) => string;
  lazyLoadImage: (element: HTMLImageElement, src: string, options?: ImageOptimizationOptions) => void;
  trackPerformance: (name: string, start: boolean) => void;
  getPerformanceMetrics: () => PerformanceMetrics;
  triggerPerformanceReport: () => PerformanceMetrics;
}

// 图像优化选项接口
interface ImageOptimizationOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
}

// 默认配置
const defaultConfig: PerformanceOptimizerConfig = {
  enableResponsive: true,
  enableImageOptimization: true,
  enableVirtualScrolling: true,
  enableTouchOptimization: true,
  enablePerformanceMonitoring: true,
  itemHeight: 100,
  overscanCount: 5,
  sampleRate: 1.0,
};

// 创建性能优化上下文
const PerformanceOptimizerContext = createContext<PerformanceOptimizerContextType | undefined>(undefined);

/**
 * 性能优化提供者组件
 * @description 提供性能优化相关的上下文和功能
 * @param props 组件属性
 */
export function PerformanceOptimizerProvider({
  children,
  config = {},
}: { 
  children: React.ReactNode;
  config?: PerformanceOptimizerConfig;
}) {
  // 合并配置
  const mergedConfig = { ...defaultConfig, ...config };
  
  // 使用响应式钩子
  const {
    isMobile,
    isTablet,
    isDesktop,
    currentBreakpoint,
    viewportWidth,
    viewportHeight,
  } = useResponsive();
  
  // 创建性能监控实例
  const performanceMonitorRef = useRef<PerformanceMonitorService>();
  
  // 创建图像优化服务实例
  const imageOptimizerRef = useRef<ImageOptimizationService>();
  
  // 初始化服务
  useEffect(() => {
    // 初始化性能监控服务
    if (mergedConfig.enablePerformanceMonitoring) {
      performanceMonitorRef.current = new PerformanceMonitorService({
        sampleRate: mergedConfig.sampleRate || 1.0,
        onReport: (metrics) => {
          console.log('性能报告:', metrics);
        }
      });
      performanceMonitorRef.current.startMonitoring();
    }
    
    // 初始化图像优化服务
    if (mergedConfig.enableImageOptimization) {
      imageOptimizerRef.current = ImageOptimizationService.getInstance();
    }
    
    // 清理函数
    return () => {
      if (performanceMonitorRef.current) {
        performanceMonitorRef.current.stopMonitoring();
      }
    };
  }, [mergedConfig]);
  
  // 图像优化函数
  const optimizeImage = useCallback((src: string, _options?: ImageOptimizationOptions): string => {
    if (!mergedConfig.enableImageOptimization || !imageOptimizerRef.current) return src;
    
    // 直接返回原始URL，因为ImageOptimizationService.optimizeImage方法是直接操作DOM元素的
    return src;
  }, [mergedConfig.enableImageOptimization]);
  
  // 图像懒加载函数
  const lazyLoadImage = useCallback((element: HTMLImageElement, src: string, options?: ImageOptimizationOptions): void => {
    if (!mergedConfig.enableImageOptimization || !imageOptimizerRef.current) {
      element.src = src;
      return;
    }
    
    // 使用图像优化服务的optimizeImage方法，启用懒加载
    element.src = src;
    const optimizeOptions: any = { lazy: true };
    if (options?.width !== undefined) {
      optimizeOptions.maxWidth = options.width;
    }
    if (options?.height !== undefined) {
      optimizeOptions.maxHeight = options.height;
    }
    if (options?.quality !== undefined) {
      optimizeOptions.quality = options.quality;
    }
    imageOptimizerRef.current.optimizeImage(element, optimizeOptions);
  }, [mergedConfig.enableImageOptimization]);
  
  // 性能跟踪函数
  const trackPerformance = useCallback((name: string, start: boolean): void => {
    if (!mergedConfig.enablePerformanceMonitoring || !performanceMonitorRef.current) return;
    
    if (start) {
      // 开始性能标记
      performanceMonitorRef.current.addCustomMark(`start-${name}`);
    } else {
      // 结束性能标记并计算持续时间
      performanceMonitorRef.current.addCustomMark(`end-${name}`);
      try {
        performanceMonitorRef.current.addCustomMeasure(name, `start-${name}`, `end-${name}`);
      } catch (error) {
        console.warn(`性能测量失败: ${name}`, error);
      }
    }
  }, [mergedConfig.enablePerformanceMonitoring]);
  
  // 获取性能指标
  const getPerformanceMetrics = useCallback((): PerformanceMetrics => {
    if (!performanceMonitorRef.current) {
      return {};
    }
    return performanceMonitorRef.current.getMetrics();
  }, []);
  
  // 触发性能报告
  const triggerPerformanceReport = useCallback((): PerformanceMetrics => {
    if (!performanceMonitorRef.current) {
      return {};
    }
    return performanceMonitorRef.current.triggerReport();
  }, []);
  
  // 触摸优化
  useEffect(() => {
    if (!mergedConfig.enableTouchOptimization) return;
    
    // 禁用双击缩放
    const handleDoubleClick = (e: MouseEvent) => {
      e.preventDefault();
    };
    
    // 优化触摸事件
    const handleTouchStart = (e: TouchEvent) => {
      // 增加触摸目标大小
      const target = e.target as HTMLElement;
      if (target.tagName === 'A' || target.tagName === 'BUTTON' || target.hasAttribute('data-touch-target')) {
        target.style.transform = 'scale(0.98)';
        setTimeout(() => {
          target.style.transform = '';
        }, 200);
      }
    };
    
    if (isMobile || isTablet) {
      document.addEventListener('dblclick', handleDoubleClick, { passive: false });
      document.addEventListener('touchstart', handleTouchStart, { passive: true });
    }
    
    return () => {
      document.removeEventListener('dblclick', handleDoubleClick);
      document.removeEventListener('touchstart', handleTouchStart);
    };
  }, [mergedConfig.enableTouchOptimization, isMobile, isTablet]);
  
  // 上下文值
  const contextValue: PerformanceOptimizerContextType = {
    isMobile,
    isTablet,
    isDesktop,
    currentBreakpoint,
    viewportWidth,
    viewportHeight,
    orientation: viewportWidth > viewportHeight ? 'landscape' : 'portrait',
    optimizeImage,
    lazyLoadImage,
    trackPerformance,
    getPerformanceMetrics,
    triggerPerformanceReport,
  };
  
  return (
    <PerformanceOptimizerContext.Provider value={contextValue}>
      {children}
    </PerformanceOptimizerContext.Provider>
  );
}

/**
 * 使用性能优化钩子
 * @description 获取性能优化上下文
 * @returns 性能优化上下文
 */
export function usePerformance(): PerformanceOptimizerContextType {
  const context = useContext(PerformanceOptimizerContext);
  if (!context) {
    throw new Error('usePerformance必须在PerformanceOptimizerProvider内部使用');
  }
  return context;
}

/**
 * 虚拟滚动包装器组件
 * @description 提供高性能的长列表渲染
 * @param props 组件属性
 */
export function VirtualScrollWrapper<T>({
  items,
  children,
  keyExtractor,
  config = {},
}: {
  items: T[];
  children: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T, index: number) => string;
  config?: { itemHeight?: number; overscanCount?: number };
}) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const performanceContext = usePerformance();
  
  // 使用配置或默认值
  const itemHeight = config.itemHeight || 100;
  const overscanCount = config.overscanCount || 5;
  
  // 计算可见项
  const visibleCount = containerRef.current
    ? Math.ceil(containerRef.current.clientHeight / itemHeight)
    : 0;
  
  // 计算开始和结束索引
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(startIndex + visibleCount + overscanCount,
    items.length);
  
  // 计算偏移量
  const offsetY = startIndex * itemHeight;
  
  // 渲染可见项
  const visibleItems = items.slice(startIndex, endIndex);
  
  // 处理滚动事件
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };
  
  // 如果禁用虚拟滚动或项目较少，直接渲染所有项目
  if (!performanceContext || items.length <= 50) {
    return (
      <div style={{ overflow: 'auto' }}>
        {items.map((item, index) => (
          <div key={keyExtractor(item, index)}>
            {children(item, index)}
          </div>
        ))}
      </div>
    );
  }
  
  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      style={{ overflow: 'auto', position: 'relative' }}
    >
      <div style={{ height: items.length * itemHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)`, position: 'absolute', top: 0, left: 0 }}>
          {visibleItems.map((item, index) => (
            <div 
              key={keyExtractor(item, startIndex + index)}
              style={{ height: itemHeight }}
            >
              {children(item, startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}