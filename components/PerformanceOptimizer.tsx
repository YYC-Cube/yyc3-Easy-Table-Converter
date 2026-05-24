/**
 * @file 性能优化组件
 * @description 整合响应式设计和图像优化功能，提升移动端和整体性能
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-24
 */

'use client';

import React, { useEffect, useRef } from 'react';
import { useResponsive, ResponsiveShow } from './ResponsiveUtils';
import {
  ImageOptimizationService,
  registerLazyImages,
  preloadImages
} from '@/app/utils/imageOptimization';
import { PerformanceMonitorService } from '@/app/utils/PerformanceMonitor';

interface PerformanceOptimizerProps {
  children: React.ReactNode;
  /** 需要预加载的图像URL列表 */
  preloadImages?: string[];
  /** 启用虚拟滚动（适用于长列表） */
  virtualScroll?: boolean;
  /** 虚拟滚动配置 */
  virtualScrollOptions?: {
    itemHeight?: number;
    containerHeight?: number;
  };
  /** 启用触摸优化 */
  optimizeTouch?: boolean;
  /** 启用自动图像优化 */
  autoOptimizeImages?: boolean;
  /** 图像选择器（用于自动优化） */
  imageSelector?: string;
  /** 性能监控配置 */
  performanceMonitoring?: {
    enabled?: boolean;
    sampleRate?: number;
  };
}

/**
 * 性能优化组件 - 提供响应式性能优化功能
 * @description 整合响应式设计和图像优化，提升移动端和整体性能体验
 */
export const PerformanceOptimizer: React.FC<PerformanceOptimizerProps> = ({
  children,
  preloadImages: imagesToPreload = [],
  virtualScroll = false,
  virtualScrollOptions = {
    itemHeight: 80,
    containerHeight: 500
  },
  optimizeTouch = true,
  autoOptimizeImages = true,
  imageSelector = 'img[data-optimize="true"]',
  performanceMonitoring = {
    enabled: process.env.NODE_ENV === 'production',
    sampleRate: 0.1
  }
}) => {
  const { isMobile, isTablet, viewportWidth } = useResponsive();
  const containerRef = useRef<HTMLDivElement>(null);
  const isMountedRef = useRef(true);
  const performanceMonitor = useRef<PerformanceMonitorService | null>(null);

  // 初始化性能监控
  useEffect(() => {
    if (performanceMonitoring.enabled) {
      try {
        // 动态导入以减少初始加载大小
        import('@/app/utils/PerformanceMonitor').then(({ PerformanceMonitorService }) => {
          if (!isMountedRef.current) return;
          
          performanceMonitor.current = new PerformanceMonitorService({
            sampleRate: performanceMonitoring.sampleRate,
            trackFCP: true,
            trackLCP: true,
            trackCLS: true,
            trackFID: true,
            trackTTI: true
          });
          
          // 记录页面加载性能
          performanceMonitor.current.startMonitoring();
        });
      } catch (error) {
        console.warn('性能监控初始化失败:', error);
      }
    }

    return () => {
      isMountedRef.current = false;
      if (performanceMonitor.current) {
        performanceMonitor.current.stopMonitoring();
        performanceMonitor.current = null;
      }
    };
  }, [performanceMonitoring.enabled, performanceMonitoring.sampleRate]);

  // 预加载图像
  useEffect(() => {
    if (imagesToPreload.length > 0) {
      // 使用高优先级预加载关键图像
      const priorityImages = imagesToPreload.slice(0, 5); // 前5张作为高优先级
      const normalImages = imagesToPreload.slice(5);
      
      // 高优先级图像立即预加载
      if (priorityImages.length > 0) {
        preloadImages(priorityImages, true).catch(console.warn);
      }
      
      // 低优先级图像延迟预加载
      if (normalImages.length > 0) {
        const timer = setTimeout(() => {
          preloadImages(normalImages, false).catch(console.warn);
        }, 1000);
        
        return () => clearTimeout(timer);
      }
    }
  }, [imagesToPreload]);

  // 自动优化图像
  useEffect(() => {
    if (autoOptimizeImages) {
      const timer = setTimeout(() => {
        if (!containerRef.current) return;
        
        // 注册懒加载图像
        registerLazyImages(containerRef.current.querySelectorAll(imageSelector));
        
        // 优化已加载的图像
        const imageService = ImageOptimizationService.getInstance();
        const images = containerRef.current.querySelectorAll(imageSelector);
        
        images.forEach((img) => {
          // 为移动设备设置更激进的优化
          const isMobileDevice = isMobile || isTablet;
          const maxWidth = isMobileDevice ? viewportWidth : undefined;
          const quality = isMobileDevice ? 0.7 : 0.85;
          
          imageService.optimizeImage(img as HTMLImageElement, {
            maxWidth,
            quality,
            lazy: !img.complete,
            placeholder: img.getAttribute('data-placeholder')
          });
        });
      }, 100); // 小延迟以确保DOM已渲染
      
      return () => clearTimeout(timer);
    }
  }, [autoOptimizeImages, imageSelector, isMobile, isTablet, viewportWidth]);

  // 优化触摸事件
  useEffect(() => {
    if (optimizeTouch && (isMobile || isTablet)) {
      const handleTouchStart = (e: TouchEvent) => {
        // 防止默认的双击缩放行为
        if (e.touches.length === 2) {
          e.preventDefault();
        }
      };
      
      const handleTouchMove = (e: TouchEvent) => {
        // 优化滚动性能
        if (e.cancelable) {
          e.preventDefault();
        }
      };
      
      document.addEventListener('touchstart', handleTouchStart, { passive: false });
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      
      return () => {
        document.removeEventListener('touchstart', handleTouchStart);
        document.removeEventListener('touchmove', handleTouchMove);
      };
    }
  }, [optimizeTouch, isMobile, isTablet]);

  // 调整图像缓存设置
  useEffect(() => {
    const imageService = ImageOptimizationService.getInstance();
    
    // 为移动设备设置较小的缓存大小
    if (isMobile) {
      imageService.setCacheSizeLimit(5); // 5MB for mobile
      imageService.setMaxCacheItems(25);
    } else {
      imageService.setCacheSizeLimit(15); // 15MB for desktop/tablet
      imageService.setMaxCacheItems(50);
    }
  }, [isMobile]);

  // 渲染子内容
  const renderContent = () => {
    if (virtualScroll) {
      // 如果启用了虚拟滚动，需要使用虚拟滚动包装器
      return (
        <VirtualScrollWrapper
          options={virtualScrollOptions}
        >
          {children}
        </VirtualScrollWrapper>
      );
    }
    
    return children;
  };

  return (
    <div
      ref={containerRef}
      className={`
        performance-optimizer-container
        ${isMobile ? 'mobile-optimized' : ''}
        ${isTablet ? 'tablet-optimized' : ''}
      `}
      style={{
        // 基本性能优化样式
        touchAction: optimizeTouch ? 'manipulation' : undefined,
        WebkitTapHighlightColor: 'transparent',
        userSelect: 'none'
      }}
    >
      {renderContent()}
      
      {/* 移动设备性能指示器（开发模式） */}
      <ResponsiveShow deviceType="mobile">
        {process.env.NODE_ENV === 'development' && (
          <div className="fixed bottom-4 left-4 bg-black/70 text-white text-xs px-2 py-1 rounded-md z-50">
            移动优化已启用
          </div>
        )}
      </ResponsiveShow>
    </div>
  );
};

// 虚拟滚动包装器组件
interface VirtualScrollWrapperProps {
  children: React.ReactNode;
  options: {
    itemHeight?: number;
    containerHeight?: number;
  };
}

const VirtualScrollWrapper: React.FC<VirtualScrollWrapperProps> = ({ 
  children, 
  options 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { itemHeight = 80, containerHeight = 500 } = options;
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    // 动态导入虚拟滚动库以减少初始加载大小
    import('@tanstack/react-virtual').then(({ useVirtualizer }) => {
      // 注意：这里仅提供框架，实际实现需要在具体使用时集成
      console.log('虚拟滚动已初始化');
    }).catch(error => {
      console.warn('虚拟滚动初始化失败:', error);
    });
  }, []);
  
  return (
    <div
      ref={containerRef}
      className="virtual-scroll-container overflow-auto"
      style={{ height: `${containerHeight}px` }}
    >
      {children}
    </div>
  );
};

// 导出便捷hooks
export const usePerformance = () => {
  const performanceMonitor = useRef<PerformanceMonitorService | null>(null);
  
  const startMonitoring = () => {
    if (!performanceMonitor.current) {
      try {
        import('@/app/utils/PerformanceMonitor').then(({ PerformanceMonitorService }) => {
          performanceMonitor.current = new PerformanceMonitorService();
          performanceMonitor.current.startMonitoring();
        });
      } catch (error) {
        console.warn('性能监控初始化失败:', error);
      }
    }
  };
  
  const stopMonitoring = () => {
    if (performanceMonitor.current) {
      performanceMonitor.current.stopMonitoring();
    }
  };
  
  const measure = (name: string, fn: Function) => {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    
    console.log(`性能测量: ${name} - ${end - start}ms`);
    return result;
  };
  
  return {
    startMonitoring,
    stopMonitoring,
    measure
  };
};

export default PerformanceOptimizer;
