/**
 * @file 基础图表组件
 * @description 提供统一的图表渲染和交互能力的基础组件
 * @module visualization/components
 * @author YYC
 * @version 1.0.0
 * @created 2024-07-25
 * @updated 2024-07-25
 */

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ChartBaseOptions,
  DataSeries,
  TooltipOptions,
  ChartEvent,
  VisualizationTheme
} from '../types';

// 默认主题配置
const defaultThemes: Record<string, VisualizationTheme> = {
  light: {
    name: 'light',
    background: '#ffffff',
    text: '#333333',
    title: '#111111',
    border: '#e0e0e0',
    grid: '#f0f0f0',
    colors: ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#13c2c2', '#eb2f96']
  },
  dark: {
    name: 'dark',
    background: '#1a1a1a',
    text: '#e0e0e0',
    title: '#ffffff',
    border: '#333333',
    grid: '#2a2a2a',
    colors: ['#1890ff', '#52c41a', '#faad14', '#f5222d', '#722ed1', '#13c2c2', '#eb2f96']
  }
};

/**
 * 基础图表组件属性接口
 */
interface BaseChartProps<T extends ChartBaseOptions> {
  /** 图表配置 */
  options: T;
  
  /** 数据源 */
  series?: DataSeries[];
  
  /** 图表类型 */
  chartType: string;
  
  /** 事件处理器 */
  onEvent?: ((event: ChartEvent) => void) | undefined;
  
  /** 工具提示配置 */
  tooltip?: TooltipOptions | undefined;
  
  /** 自定义主题 */
  theme?: VisualizationTheme | undefined;
  
  /** 加载状态 */
  loading?: boolean | undefined;
  
  /** 错误状态 */
  error?: string | null | undefined;
  
  /** 图表渲染回调 */
  onRendered?: () => void;
  
  /** 响应式配置 */
  responsive?: boolean;
  
  /** 子组件 */
  children?: React.ReactNode;
}

/**
 * 基础图表组件 - 所有图表组件的基类
 */
const BaseChart = 
<T extends ChartBaseOptions>(
  {
    options,
    series,
    chartType: _chartType, // 使用唯一名称表示未使用的参数
    onEvent,
    tooltip: _tooltip, // 使用唯一名称表示未使用的参数
    theme: customTheme,
    loading = false,
    error = null,
    onRendered: _onRendered, // 使用唯一名称表示未使用的参数
    responsive = true,
    children
  }: BaseChartProps<T>
) => {
  // 图表容器引用
  const chartRef = useRef<HTMLDivElement>(null);
  
  // 图表实例引用
  const chartInstanceRef = useRef<any>(null);
  
  // 当前主题状态
  const [currentTheme, setCurrentTheme] = useState<VisualizationTheme>(
    customTheme || defaultThemes[options.theme || 'light'] || defaultThemes.light
  );
  
  // 图表尺寸状态
  const [dimensions, setDimensions] = useState({
    width: options.width || 600,
    height: options.height || 400
  });
  
  // 处理事件分发
  const handleEvent = useCallback((eventType: string, data: any, nativeEvent?: Event) => {
    if (onEvent) {
      // 在初始定义中包含 nativeEvent 可选属性
      const eventData: Partial<ChartEvent> = {
        type: eventType,
        data
      };
      if (nativeEvent) {
        eventData.nativeEvent = nativeEvent;
      }
      onEvent(eventData as ChartEvent);
    }
  }, [onEvent]);
  
  // 计算图表尺寸
  const calculateDimensions = useCallback(() => {
    if (chartRef.current && responsive) {
      const container = chartRef.current.parentElement;
      if (container) {
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;
        
        // 设置默认宽高比
        const aspectRatio = 1.5;
        
        let width = options.width;
        let height = options.height;
        
        if (!width || typeof width === 'string') {
          width = containerWidth - 40; // 减去边距
        }
        
        if (!height || typeof height === 'string') {
          height = width / aspectRatio;
          // 如果容器有明确高度限制，则使用较小的值
          if (containerHeight) {
            height = Math.min(height, containerHeight - 40); // 减去边距
          }
        }
        
        setDimensions({ width, height });
      }
    }
  }, [options.width, options.height, responsive]);
  
  // 初始化和更新图表
  useEffect(() => {
    // 图表初始化逻辑由具体子类实现
    // 这里提供基础的生命周期管理
    
    return () => {
      // 清理图表实例
      if (chartInstanceRef.current) {
        // 这里应该添加图表实例的清理逻辑
        chartInstanceRef.current = null;
      }
    };
  }, []);
  
  // 响应式调整
  useEffect(() => {
    if (responsive) {
      calculateDimensions();
      
      const handleResize = () => {
        calculateDimensions();
      };
      
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
    return undefined; // 确保在非响应式情况下也返回一致的类型
  }, [calculateDimensions, responsive]);
  
  // 主题更新
  useEffect(() => {
    if (customTheme) {
      setCurrentTheme(customTheme);
    } else {
      const themeName = options.theme || 'light';
      setCurrentTheme(defaultThemes[themeName] || defaultThemes.light);
    }
  }, [customTheme, options.theme]);
  
  // 加载状态处理
  if (loading || options.loading) {
    return (
      <div 
        className={`relative flex items-center justify-center ${options.className || ''}`}
        style={{
          width: typeof dimensions.width === 'number' ? `${dimensions.width}px` : dimensions.width,
          height: typeof dimensions.height === 'number' ? `${dimensions.height}px` : dimensions.height,
          backgroundColor: currentTheme.background,
          border: `1px solid ${currentTheme.border}`,
          borderRadius: '4px'
        }}
      >
        <div className="text-center">
          <div className="animate-spin mb-2 w-8 h-8 border-4 border-gray-300 border-t-blue-500 rounded-full"></div>
          <p style={{ color: currentTheme.text }}>正在加载图表...</p>
        </div>
      </div>
    );
  }
  
  // 错误状态处理
  if (error || options.error) {
    const errorMessage = error || options.error || '加载图表失败';
    return (
      <div 
        className={`relative ${options.className || ''}`}
        style={{
          width: typeof dimensions.width === 'number' ? `${dimensions.width}px` : dimensions.width,
          height: typeof dimensions.height === 'number' ? `${dimensions.height}px` : dimensions.height,
          backgroundColor: currentTheme.background,
          border: `1px solid ${currentTheme.border}`,
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}
      >
        <div className="text-center">
          <p style={{ color: '#f5222d', marginBottom: '8px' }}>❌ 图表加载错误</p>
          <p style={{ color: currentTheme.text, fontSize: '14px' }}>{errorMessage}</p>
        </div>
      </div>
    );
  }
  
  // 渲染图表容器
  return (
    <div 
      className={`relative ${options.className || ''}`}
      style={{
        width: typeof dimensions.width === 'number' ? `${dimensions.width}px` : dimensions.width,
        height: typeof dimensions.height === 'number' ? `${dimensions.height}px` : dimensions.height,
        backgroundColor: currentTheme.background,
        border: `1px solid ${currentTheme.border}`,
        borderRadius: '4px'
      }}
    >
      {/* 图表标题 */}
      {options.title && (
        <div className="absolute top-4 left-4 right-4">
          <h3 
            style={{ 
              color: currentTheme.title, 
              fontSize: '18px', 
              fontWeight: '600', 
              margin: 0,
              textAlign: 'center'
            }}
          >
            {options.title}
          </h3>
          {options.subtitle && (
            <p 
              style={{ 
                color: currentTheme.text, 
                fontSize: '14px', 
                margin: '4px 0 0 0',
                textAlign: 'center'
              }}
            >
              {options.subtitle}
            </p>
          )}
        </div>
      )}
      
      {/* 图表主体区域 */}
      <div
        ref={chartRef}
        className="chart-content"
        style={{
          width: '100%',
          height: '100%',
          padding: options.title ? '60px 20px 20px' : '20px',
          boxSizing: 'border-box',
          position: 'relative'
        }}
      >
        {/* 渲染子组件 */}
        {children || (
          <div className="text-center" style={{ 
            height: '100%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: currentTheme.text
          }}>
            图表内容将由具体图表组件渲染
          </div>
        )}
      </div>
      
      {/* 图例区域 - 简单实现，实际使用时可以根据需要扩展 */}
      {options.showLegend !== false && series && series.length > 1 && (
        <div 
          className="chart-legend"
          style={{
            position: 'absolute',
            bottom: '10px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '15px'
          }}
        >
          {series.map((s, index) => {
            if (!s.visible && s.visible !== undefined) return null;
            return (
              <div 
                key={index} 
                className="legend-item flex items-center cursor-pointer"
                onClick={() => {
                  handleEvent('legendClick', { index, series: s });
                }}
              >
                <div 
                  className="legend-color" 
                  style={{
                    width: '12px',
                    height: '12px',
                    backgroundColor: s.color || currentTheme.colors[index % currentTheme.colors.length],
                    marginRight: '6px',
                    borderRadius: '2px'
                  }}
                />
                <span 
                  className="legend-text"
                  style={{ color: currentTheme.text, fontSize: '12px' }}
                >
                  {s.name}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

BaseChart.defaultProps = {
  options: {
    responsive: true,
    showLegend: true,
    theme: 'light',
    loading: false
  } as ChartBaseOptions
};

export default BaseChart;
export { defaultThemes };
