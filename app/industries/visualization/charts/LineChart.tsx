/**
 * @file 折线图组件
 * @description 用于展示数据随时间或其他变量变化的趋势
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
  LineChartOptions,
  DataSeries,
  DataPoint,
  ChartEvent,
  TooltipOptions,
  VisualizationTheme
} from '../types';

/**
 * 折线图组件属性接口
 */
interface LineChartProps extends Omit<LineChartOptions, 'series'> {
  /** 数据集数组 */
  series: DataSeries[];
  
  /** 事件处理器 */
  onEvent?: (event: ChartEvent) => void;
  
  /** 工具提示配置 */
  tooltip?: TooltipOptions;
  
  /** 自定义主题 */
  customTheme?: VisualizationTheme;
  
  /** 加载状态 */
  loading?: boolean;
  
  /** 错误状态 */
  error?: string | null;
}

/**
 * 折线图组件 - 使用Canvas实现的高性能折线图
 */
const LineChart = ({
  series,
  xAxis = {},
  yAxis = {},
  line = {},
  point = {},
  area = false,
  animation = {},
  tooltip,
  customTheme,
  loading,
  error,
  onEvent,
  ...baseOptions
}: LineChartProps) => {
  // Canvas引用
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // 工具提示状态
  const [tooltipState, setTooltipState] = React.useState({
    visible: false,
    x: 0,
    y: 0,
    data: null as DataPoint | null,
    seriesIndex: 0
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
  
  // 计算X轴域（数据范围）
  const xDomain = useMemo(() => {
    if (xAxis.domain) return xAxis.domain;
    
    let min = Infinity;
    let max = -Infinity;
    
    series.forEach(s => {
      s.data.forEach(dp => {
        const xValue = typeof dp.x === 'number' ? dp.x : Number(dp.x);
        min = Math.min(min, xValue);
        max = Math.max(max, xValue);
      });
    });
    
    // 确保有合理的范围
    if (min === Infinity || max === -Infinity) {
      min = 0;
      max = 100;
    }
    
    // 添加一点边距
    const range = max - min;
    min -= range * 0.05;
    max += range * 0.05;
    
    return [min, max];
  }, [series, xAxis.domain]);
  
  // 计算Y轴域（数据范围）
  const yDomain = useMemo(() => {
    if (yAxis.domain) return yAxis.domain;
    
    let min = Infinity;
    let max = -Infinity;
    
    series.forEach(s => {
      s.data.forEach(dp => {
        min = Math.min(min, dp.y);
        max = Math.max(max, dp.y);
      });
    });
    
    // 确保有合理的范围
    if (min === Infinity || max === -Infinity) {
      min = 0;
      max = 100;
    }
    
    // 如果最小值不为0，则从0开始（对大部分数据可视化更直观）
    if (min > 0) min = 0;
    
    // 添加一点上边距
    const range = max - min;
    max += range * 0.1;
    
    return [min, max];
  }, [series, yAxis.domain]);
  
  // X值到画布X坐标的映射
  const xScale = (x: number | string | Date) => {
    const xNum = typeof x === 'number' ? x : Number(x);
    const [min, max] = xDomain;
    const ratio = (xNum - min) / (max - min);
    return plottingArea.padding.left + ratio * plottingArea.width;
  };
  
  // Y值到画布Y坐标的映射
  const yScale = (y: number) => {
    const [min, max] = yDomain;
    const ratio = (y - min) / (max - min);
    return plottingArea.padding.top + (1 - ratio) * plottingArea.height;
  };
  
  // 格式化X轴刻度标签
  const formatXLabel = (value: number | string) => {
    if (xAxis.tickFormat) {
      try {
        return new Intl.NumberFormat('zh-CN', {
          style: 'decimal',
          minimumFractionDigits: 0,
          maximumFractionDigits: 2
        }).format(Number(value));
      } catch (e) {
        return String(value);
      }
    }
    return String(value);
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
      
      // 绘制X轴刻度
      const tickCount = Math.min(10, width / 80); // 根据宽度自动调整刻度数量
      const tickStep = width / (tickCount - 1);
      
      for (let i = 0; i < tickCount; i++) {
        const x = padding.left + i * tickStep;
        const xValue = xDomain[0] + (xDomain[1] - xDomain[0]) * i / (tickCount - 1);
        
        // 绘制刻度线
        ctx.beginPath();
        ctx.moveTo(x, xAxisY);
        ctx.lineTo(x, xAxisY + 6);
        ctx.stroke();
        
        // 绘制刻度标签
        ctx.fillStyle = currentTheme.text;
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(formatXLabel(xValue), x, xAxisY + 20);
      }
      
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
      const gridCount = 5;
      const gridStep = width / (gridCount - 1);
      
      for (let i = 0; i < gridCount; i++) {
        const x = padding.left + i * gridStep;
        ctx.beginPath();
        ctx.moveTo(x, padding.top);
        ctx.lineTo(x, padding.top + height);
        ctx.stroke();
      }
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
  
  // 绘制数据点
  const drawPoints = (ctx: CanvasRenderingContext2D, seriesData: DataSeries, seriesIndex: number) => {
    if (!seriesData.visible && seriesData.visible !== undefined) return;
    
    const pointVisible = point.visible !== false;
    const pointRadius = point.radius || 3;
    const pointColor = seriesData.color || currentTheme.colors[seriesIndex % currentTheme.colors.length];
    const pointStroke = point.stroke || pointColor;
    const pointStrokeWidth = point.strokeWidth || 1;
    
    if (pointVisible) {
      seriesData.data.forEach(dataPoint => {
        const x = xScale(dataPoint.x);
        const y = yScale(dataPoint.y);
        
        ctx.beginPath();
        ctx.arc(x, y, pointRadius, 0, Math.PI * 2);
        ctx.fillStyle = point.fill || '#ffffff';
        ctx.fill();
        ctx.strokeStyle = pointStroke;
        ctx.lineWidth = pointStrokeWidth;
        ctx.stroke();
      });
    }
  };
  
  // 绘制区域
  const drawArea = (ctx: CanvasRenderingContext2D, seriesData: DataSeries, seriesIndex: number) => {
    if (!seriesData.visible && seriesData.visible !== undefined || !area) return;
    
    const areaColor = seriesData.color || currentTheme.colors[seriesIndex % currentTheme.colors.length];
    
    // 开始绘制区域路径
    ctx.beginPath();
    
    // 移动到第一个点
    const firstPoint = seriesData.data[0];
    if (firstPoint) {
      ctx.moveTo(xScale(firstPoint.x), yScale(firstPoint.y));
      
      // 连接到所有点
      for (let i = 1; i < seriesData.data.length; i++) {
        const point = seriesData.data[i];
        ctx.lineTo(xScale(point.x), yScale(point.y));
      }
      
      // 连接到底部边界
      const lastPoint = seriesData.data[seriesData.data.length - 1];
      const bottomY = yScale(yDomain[0]); // Y轴最小值的位置
      
      ctx.lineTo(xScale(lastPoint.x), bottomY);
      ctx.lineTo(xScale(firstPoint.x), bottomY);
      ctx.closePath();
      
      // 绘制半透明区域
      ctx.fillStyle = areaColor + '33'; // 33 是 20% 的透明度
      ctx.fill();
    }
  };
  
  // 绘制线条
  const drawLine = (ctx: CanvasRenderingContext2D, seriesData: DataSeries, seriesIndex: number) => {
    if (!seriesData.visible && seriesData.visible !== undefined) return;
    
    const lineColor = seriesData.color || currentTheme.colors[seriesIndex % currentTheme.colors.length];
    const lineWidth = line.strokeWidth || 2;
    const smooth = line.smooth || false;
    
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    
    if (smooth) {
      // 平滑曲线实现（简单的贝塞尔曲线插值）
      if (seriesData.data.length > 1) {
        // 移动到第一个点
        ctx.moveTo(xScale(seriesData.data[0].x), yScale(seriesData.data[0].y));
        
        // 为每个点创建平滑曲线
        for (let i = 1; i < seriesData.data.length - 1; i++) {
          const prev = seriesData.data[i - 1];
          const curr = seriesData.data[i];
          const next = seriesData.data[i + 1];
          
          const cp1x = xScale(curr.x);
          const cp1y = yScale(prev.y);
          const cp2x = xScale(curr.x);
          const cp2y = yScale(next.y);
          
          ctx.bezierCurveTo(
            cp1x, cp1y,
            cp2x, cp2y,
            xScale(curr.x), yScale(curr.y)
          );
        }
        
        // 添加最后一个点
        const lastPoint = seriesData.data[seriesData.data.length - 1];
        ctx.lineTo(xScale(lastPoint.x), yScale(lastPoint.y));
      }
    } else {
      // 直线连接
      if (seriesData.data.length > 0) {
        ctx.moveTo(xScale(seriesData.data[0].x), yScale(seriesData.data[0].y));
        for (let i = 1; i < seriesData.data.length; i++) {
          ctx.lineTo(xScale(seriesData.data[i].x), yScale(seriesData.data[i].y));
        }
      }
    }
    
    ctx.stroke();
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
    
    // 绘制区域（如果启用）
    if (area) {
      series.forEach((s, index) => {
        drawArea(ctx, s, index);
      });
    }
    
    // 绘制线条
    series.forEach((s, index) => {
      drawLine(ctx, s, index);
    });
    
    // 绘制数据点
    series.forEach((s, index) => {
      drawPoints(ctx, s, index);
    });
    
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
    let nearestPoint: DataPoint | null = null;
    let nearestDistance = Infinity;
    let nearestSeriesIndex = 0;
    const pointRadius = point.radius || 3;
    const hitRadius = pointRadius * 3; // 增大点击检测范围
    
    series.forEach((s, seriesIndex) => {
      if (!s.visible && s.visible !== undefined) return;
      
      s.data.forEach((dataPoint) => {
        const pointX = xScale(dataPoint.x);
        const pointY = yScale(dataPoint.y);
        const distance = Math.sqrt(
          Math.pow(x - pointX, 2) + Math.pow(y - pointY, 2)
        );
        
        if (distance < nearestDistance && distance < hitRadius) {
          nearestDistance = distance;
          nearestPoint = dataPoint;
          nearestSeriesIndex = seriesIndex;
        }
      });
    });
    
    // 如果找到最近点，显示工具提示
    if (nearestPoint) {
      setTooltipState({
        visible: true,
        x: event.clientX,
        y: event.clientY,
        data: nearestPoint,
        seriesIndex: nearestSeriesIndex
      });
      
      // 触发事件
      if (onEvent) {
        onEvent({
          type: 'pointHover',
          data: {
            point: nearestPoint,
            seriesIndex: nearestSeriesIndex,
            series: series[nearestSeriesIndex]
          },
          nativeEvent: event.nativeEvent
        });
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
          type: 'pointClick',
          data: {
            point: tooltipState.data,
            seriesIndex: tooltipState.seriesIndex,
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
    // 添加动画延迟（如果配置了动画）
    const timeoutId = setTimeout(renderChart, animation.duration ? 0 : 0);
    
    return () => clearTimeout(timeoutId);
  }, [series, chartDimensions, xDomain, yDomain, plottingArea, currentTheme, line, point, area]);
  
  // 图表渲染回调函数
  const handleChartRendered = () => {
    renderChart();
  };
  
  return (
    <BaseChart
      chartType="line"
      options={{ ...baseOptions }}
      series={series}
      tooltip={tooltip}
      theme={customTheme}
      loading={loading}
      error={error}
      onEvent={onEvent}
      onRendered={handleChartRendered}
    >
      <div style={{ position: 'relative', width: '100%', height: '100%' }} onClick={handleClick} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave}>
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

export default LineChart;
