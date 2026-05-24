/**
 * @file 柱状图组件
 * @description 用于数据对比和分类统计的柱状图可视化
 * @module visualization/charts
 * @author YYC
 * @version 1.0.0
 * @created 2024-07-25
 * @updated 2024-07-25
 */

'use client';

import React, { useEffect, useRef, useMemo } from 'react';
import BaseChart, { defaultThemes } from '../components/BaseChart';
import {
  BarChartOptions,
  DataSeries,
  DataPoint,
  ChartEvent,
  TooltipOptions,
  VisualizationTheme
} from '../types';

/**
 * 柱状图组件属性接口
 */
interface BarChartProps extends Omit<BarChartOptions, 'series'> {
  /** 数据集数组 */
  series: DataSeries[];
  
  /** 事件处理器 */
  onEvent?: (event: ChartEvent) => void;
  
  /** 工具提示配置 */
  tooltip?: TooltipOptions;
  
  /** 自定义主题配置 */
  customTheme?: VisualizationTheme;
  
  /** 加载状态 */
  loading?: boolean;
  
  /** 错误状态 */
  error?: string | null;
}

/**
 * 柱状图组件 - 使用Canvas实现的高性能柱状图
 */
const BarChart = ({
  series,
  xAxis = {},
  yAxis = {},
  bar = {},
  stacked = false,
  animation = {},
  tooltip,
  customTheme,
  loading,
  error,
  onEvent,
  ...baseOptions
}: BarChartProps) => {
  // Canvas引用
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // 工具提示状态
  const [tooltipState, setTooltipState] = React.useState({
    visible: false,
    x: 0,
    y: 0,
    data: null as DataPoint | null,
    seriesIndex: 0,
    categoryIndex: 0
  });
  
  // 当前主题
  const currentTheme = customTheme || defaultThemes[baseOptions.theme || 'light'] || defaultThemes.light;
  
  // 计算图表尺寸
  const chartDimensions = useMemo(() => {
    return {
      width: typeof baseOptions.width === 'number' ? baseOptions.width : 600,
      height: typeof baseOptions.height === 'number' ? baseOptions.height : 400
    };
  }, [baseOptions.width, baseOptions.height]);
  
  // 计算绘图区域尺寸（考虑边距）
  const plottingArea = useMemo(() => {
    const padding = {
      top: baseOptions.title ? 60 : 30,
      right: 40,
      bottom: 60,
      left: 60
    };
    
    return {
      width: chartDimensions.width - padding.left - padding.right,
      height: chartDimensions.height - padding.top - padding.bottom,
      padding
    };
  }, [chartDimensions, baseOptions.title]);
  
  // 计算Y轴域（数据范围）
  const yDomain = useMemo(() => {
    if (yAxis.domain) return yAxis.domain;
    
    const min = 0; // 柱状图通常从0开始
    let max = -Infinity;
    
    series.forEach(s => {
      s.data.forEach(dp => {
        max = Math.max(max, dp.y);
      });
    });
    
    // 如果是堆叠柱状图，计算每个类别的总和
    if (stacked && series.length > 1 && series[0].data.length > 0) {
      for (let i = 0; i < series[0].data.length; i++) {
        let categorySum = 0;
        series.forEach(s => {
          if (s.data[i]) {
            categorySum += s.data[i].y;
          }
        });
        max = Math.max(max, categorySum);
      }
    }
    
    // 确保有合理的范围
    if (max === -Infinity) {
      max = 100;
    }
    
    // 添加一点上边距
    const range = max - min;
    max += range * 0.1;
    
    return [min, max];
  }, [series, yAxis.domain, stacked]);
  
  // 获取所有类别（X轴值）
  const categories = useMemo(() => {
    if (series.length === 0 || series[0].data.length === 0) {
      return [];
    }
    return series[0].data.map(dp => dp.x);
  }, [series]);
  
  // Y值到画布Y坐标的映射
  const yScale = (y: number) => {
    const [min, max] = yDomain;
    const ratio = (y - min) / (max - min);
    return plottingArea.padding.top + (1 - ratio) * plottingArea.height;
  };
  
  // 格式化Y轴刻度标签
  const formatYLabel = (value: number) => {
    if (yAxis.tickFormat) {
      try {
        return new Intl.NumberFormat('zh-CN', {
          style: 'decimal',
          minimumFractionDigits: 0,
          maximumFractionDigits: 2
        }).format(value);
      } catch (e) {
        return String(value);
      }
    }
    return String(value);
  };
  
  // 绘制坐标轴
  const drawAxes = (ctx: CanvasRenderingContext2D) => {
    const { width, height, padding } = plottingArea;
    const xAxisY = padding.top + height;
    const yAxisX = padding.left;
    
    // 绘制X轴
    if (xAxis.visible !== false) {
      ctx.strokeStyle = currentTheme.border;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padding.left, xAxisY);
      ctx.lineTo(padding.left + width, xAxisY);
      ctx.stroke();
      
      // 绘制X轴刻度和标签
      const categoryWidth = categories.length > 0 ? width / categories.length : 0;
      
      categories.forEach((category, index) => {
        const x = padding.left + categoryWidth * (index + 0.5);
        
        // 绘制刻度线
        ctx.beginPath();
        ctx.moveTo(x, xAxisY);
        ctx.lineTo(x, xAxisY + 6);
        ctx.stroke();
        
        // 绘制刻度标签
        ctx.fillStyle = currentTheme.text;
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(String(category), x, xAxisY + 20);
      });
      
      // 绘制X轴标题
      if (xAxis.title) {
        ctx.fillStyle = currentTheme.title;
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(xAxis.title, padding.left + width / 2, padding.top + height + 45);
      }
    }
    
    // 绘制Y轴
    if (yAxis.visible !== false) {
      ctx.strokeStyle = currentTheme.border;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(yAxisX, padding.top);
      ctx.lineTo(yAxisX, padding.top + height);
      ctx.stroke();
      
      // 绘制Y轴刻度
      const tickCount = 5;
      const tickStep = height / (tickCount - 1);
      
      for (let i = 0; i < tickCount; i++) {
        const y = padding.top + i * tickStep;
        const yValue = yDomain[0] + (yDomain[1] - yDomain[0]) * (1 - i / (tickCount - 1));
        
        // 绘制刻度线
        ctx.beginPath();
        ctx.moveTo(yAxisX - 6, y);
        ctx.lineTo(yAxisX, y);
        ctx.stroke();
        
        // 绘制刻度标签
        ctx.fillStyle = currentTheme.text;
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(formatYLabel(yValue), yAxisX - 10, y + 4);
      }
      
      // 绘制Y轴标题
      if (yAxis.title) {
        ctx.save();
        ctx.fillStyle = currentTheme.title;
        ctx.font = '14px sans-serif';
        ctx.translate(padding.left / 2, padding.top + height / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(yAxis.title, 0, 0);
        ctx.restore();
      }
    }
  };
  
  // 绘制网格线
  const drawGrid = (ctx: CanvasRenderingContext2D) => {
    const { width, height, padding } = plottingArea;
    
    ctx.strokeStyle = currentTheme.grid;
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]); // 虚线
    
    // 垂直网格线
    if (xAxis.grid?.visible !== false) {
      const categoryWidth = categories.length > 0 ? width / categories.length : 0;
      
      categories.forEach((_, index) => {
        const x = padding.left + categoryWidth * (index + 0.5);
        ctx.beginPath();
        ctx.moveTo(x, padding.top);
        ctx.lineTo(x, padding.top + height);
        ctx.stroke();
      });
    }
    
    // 水平网格线
    if (yAxis.grid?.visible !== false) {
      const gridCount = 5;
      const gridStep = height / (gridCount - 1);
      
      for (let i = 0; i < gridCount; i++) {
        const y = padding.top + i * gridStep;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(padding.left + width, y);
        ctx.stroke();
      }
    }
    
    ctx.setLineDash([]); // 重置为实线
  };
  
  // 绘制柱状图
  const drawBars = (ctx: CanvasRenderingContext2D) => {
    const { width, padding } = plottingArea;
    const categoryWidth = categories.length > 0 ? width / categories.length : 0;
    
    // 计算柱子宽度（考虑系列数量和间距）
    let barWidth = bar.width || Math.min(categoryWidth * 0.8, 80);
    if (series.length > 1 && !stacked) {
      barWidth = Math.min(barWidth, categoryWidth / series.length * 0.8);
    }
    
    // 计算圆角
    const radius = bar.radius || 0;
    
    if (stacked) {
      // 堆叠柱状图
      categories.forEach((_category, categoryIndex) => {
        let stackY = yScale(0); // 从Y轴底部开始
        
        series.forEach((s, seriesIndex) => {
          if (!s.visible && s.visible !== undefined) return;
          
          const dataPoint = s.data[categoryIndex];
          if (!dataPoint) return;
          
          const barColor = s.color || currentTheme.colors[seriesIndex % currentTheme.colors.length];
          const barHeight = yScale(0) - yScale(dataPoint.y);
          
          if (barHeight > 0) {
            const x = padding.left + categoryWidth * categoryIndex + (categoryWidth - barWidth) / 2;
            
            // 绘制柱子（带圆角）
            ctx.fillStyle = barColor;
            ctx.beginPath();
            ctx.moveTo(x + radius, stackY);
            ctx.lineTo(x + barWidth - radius, stackY);
            ctx.arcTo(x + barWidth, stackY, x + barWidth, stackY + radius, radius);
            ctx.lineTo(x + barWidth, stackY + barHeight);
            ctx.arcTo(x + barWidth, stackY + barHeight + radius, x + barWidth - radius, stackY + barHeight, radius);
            ctx.lineTo(x + radius, stackY + barHeight);
            ctx.arcTo(x, stackY + barHeight, x, stackY + barHeight - radius, radius);
            ctx.lineTo(x, stackY + radius);
            ctx.arcTo(x, stackY, x + radius, stackY, radius);
            ctx.closePath();
            ctx.fill();
            
            // 更新堆叠位置
            stackY += barHeight;
          }
        });
      });
    } else {
      // 分组柱状图
      series.forEach((s, seriesIndex) => {
        if (!s.visible && s.visible !== undefined) return;
        
        const barColor = s.color || currentTheme.colors[seriesIndex % currentTheme.colors.length];
        const seriesOffset = series.length > 1 ? (seriesIndex - (series.length - 1) / 2) * barWidth : 0;
        
        s.data.forEach((dataPoint, categoryIndex) => {
          const barHeight = yScale(0) - yScale(dataPoint.y);
          
          if (barHeight > 0) {
            const x = padding.left + categoryWidth * (categoryIndex + 0.5) + seriesOffset - barWidth / 2;
            const y = yScale(dataPoint.y);
            
            // 绘制柱子（带圆角）
            ctx.fillStyle = barColor;
            ctx.beginPath();
            ctx.moveTo(x + radius, y);
            ctx.lineTo(x + barWidth - radius, y);
            ctx.arcTo(x + barWidth, y, x + barWidth, y + radius, radius);
            ctx.lineTo(x + barWidth, y + barHeight);
            ctx.arcTo(x + barWidth, y + barHeight + radius, x + barWidth - radius, y + barHeight, radius);
            ctx.lineTo(x + radius, y + barHeight);
            ctx.arcTo(x, y + barHeight, x, y + barHeight - radius, radius);
            ctx.lineTo(x, y + radius);
            ctx.arcTo(x, y, x + radius, y, radius);
            ctx.closePath();
            ctx.fill();
          }
        });
      });
    }
  };
  
  // 渲染图表
  const renderChart = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // 设置Canvas尺寸
    canvas.width = chartDimensions.width;
    canvas.height = chartDimensions.height;
    
    // 清空画布
    ctx.clearRect(0, 0, chartDimensions.width, chartDimensions.height);
    
    // 绘制网格
    drawGrid(ctx);
    
    // 绘制柱子
    drawBars(ctx);
    
    // 绘制坐标轴
    drawAxes(ctx);
  };
  
  // 处理鼠标移动
  const handleMouseMove = (event: React.MouseEvent) => {
    if (!baseOptions.interactive) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // 检查是否在绘图区域内
    const { padding } = plottingArea;
    if (
      x < padding.left ||
      x > padding.left + plottingArea.width ||
      y < padding.top ||
      y > padding.top + plottingArea.height
    ) {
      setTooltipState({ ...tooltipState, visible: false });
      return;
    }
    
    // 查找最近的数据点
    const categoryWidth = categories.length > 0 ? plottingArea.width / categories.length : 0;
    const categoryIndex = Math.floor((x - padding.left) / categoryWidth);
    
    if (categoryIndex >= 0 && categoryIndex < categories.length) {
      const categoryX = padding.left + categoryWidth * (categoryIndex + 0.5);
      
      // 确定哪个系列的柱子被悬停
      let seriesIndex = 0;
      if (series.length > 1 && !stacked) {
        const relativeX = x - categoryX;
        const seriesOffset = Math.floor(relativeX / (categoryWidth / series.length)) + Math.floor(series.length / 2);
        seriesIndex = Math.max(0, Math.min(seriesOffset, series.length - 1));
      }
      
      const dataPoint = series[seriesIndex]?.data[categoryIndex];
      if (dataPoint) {
        setTooltipState({
          visible: true,
          x: event.clientX,
          y: event.clientY,
          data: dataPoint,
          seriesIndex,
          categoryIndex
        });
        
        // 触发事件
        if (onEvent) {
          onEvent({
            type: 'barHover',
            data: {
              point: dataPoint,
              seriesIndex,
              categoryIndex,
              series: series[seriesIndex]
            },
            nativeEvent: event.nativeEvent
          });
        }
      }
    } else {
      setTooltipState({ ...tooltipState, visible: false });
    }
  };
  
  // 处理鼠标离开
  const handleMouseLeave = () => {
    setTooltipState({ ...tooltipState, visible: false });
  };
  
  // 处理鼠标点击
  const handleClick = (event: React.MouseEvent) => {
    if (!baseOptions.interactive) return;
    
    if (tooltipState.data) {
      // 触发点击事件
      if (onEvent) {
        onEvent({
          type: 'barClick',
          data: {
            point: tooltipState.data,
            seriesIndex: tooltipState.seriesIndex,
            categoryIndex: tooltipState.categoryIndex,
            series: series[tooltipState.seriesIndex]
          },
          nativeEvent: event.nativeEvent
        });
      }
    }
  };
  
  // 渲染工具提示
  const renderTooltip = () => {
    if (!tooltipState.visible || !tooltipState.data || !tooltip?.visible) return null;
    
    const { x, y, data, seriesIndex } = tooltipState;
    const currentSeries = series[seriesIndex];
    
    // 构建工具提示内容
    let content;
    if (tooltip.template) {
      content = tooltip.template(data);
    } else {
      // 默认工具提示内容
      content = (
        <div className="bg-white dark:bg-gray-800 p-2 border border-gray-300 dark:border-gray-700 rounded shadow-lg text-sm">
          <p className="font-medium text-gray-700 dark:text-gray-200 mb-1">{currentSeries.name}</p>
          <p className="text-gray-600 dark:text-gray-300">{data.label || String(data.x)}: {data.y}</p>
          {data.tooltip && typeof data.tooltip === 'object' && (
            <div className="mt-1 border-t border-gray-200 dark:border-gray-700 pt-1">
              {Object.entries(data.tooltip).map(([key, value], i) => (
                <p key={i} className="text-gray-500 dark:text-gray-400 text-xs">
                  {key}: {value}
                </p>
              ))}
            </div>
          )}
        </div>
      );
    }
    
    // 计算工具提示位置
    const position = tooltip.position || 'mouse';
    let tooltipX, tooltipY;
    
    if (position === 'mouse') {
      tooltipX = x + 10;
      tooltipY = y - 10;
    } else {
      // 其他位置计算逻辑
      tooltipX = x;
      tooltipY = y;
    }
    
    return (
      <div
        className="absolute z-10 pointer-events-none"
        style={{
          left: `${tooltipX}px`,
          top: `${tooltipY}px`,
          transform: 'translateY(-100%)'
        }}
      >
        {content}
      </div>
    );
  };
  
  // 监听数据变化并重绘图表
  useEffect(() => {
    renderChart();
  }, [series, chartDimensions, yDomain, plottingArea, currentTheme, bar, stacked]);
  
  // 图表渲染回调函数
  const handleChartRendered = () => {
    renderChart();
  };
  
  return (
    <BaseChart
      chartType="bar"
      options={{ ...baseOptions }}
      series={series}
      tooltip={tooltip}
      theme={customTheme}
      loading={loading}
      error={error}
      onEvent={onEvent}
      onRendered={handleChartRendered}
    >
      <div style={{ position: 'relative', width: '100%', height: '100%' }} 
           onClick={handleClick} 
           onMouseMove={handleMouseMove} 
           onMouseLeave={handleMouseLeave}>
        <canvas
          ref={canvasRef}
          style={{
            width: '100%',
            height: '100%'
          }}
        />
        {renderTooltip()}
      </div>
    </BaseChart>
  );
};

export default BarChart;