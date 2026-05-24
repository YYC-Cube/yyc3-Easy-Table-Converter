/**
 * @file 饼图组件
 * @description 用于展示占比分析和分类统计的饼图可视化
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
  PieChartOptions,
  DataSeries,
  DataPoint,
  ChartEvent,
  TooltipOptions,
  VisualizationTheme
} from '../types';

/**
 * 饼图组件属性接口
 */
interface PieChartProps extends Omit<PieChartOptions, 'data'> {
  /** 数据集（饼图通常只有一个系列） */
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
  
  /** 饼图配置 */
  pie?: {
    radius?: number;
    startAngle?: number;
    borderWidth?: number;
    borderColor?: string;
    label?: {
      visible?: boolean;
      position?: 'inner' | 'outer';
      showLabel?: boolean;
      showPercentage?: boolean;
      showValue?: boolean;
      fontSize?: number;
      fontFamily?: string;
      color?: string;
    };
  };
  
  /** 图例配置 */
  legend?: {
    visible?: boolean;
    position?: 'top' | 'right' | 'bottom' | 'left';
  };
}

/**
 * 饼图组件 - 使用Canvas实现的高性能饼图
 */
const PieChart = ({
  series,
  tooltip,
  customTheme,
  loading,
  error,
  onEvent,
  ...baseOptions
}: PieChartProps) => {
  // 饼图配置默认值
  const pie = baseOptions.pie || {};
  const legend = baseOptions.legend || {};
  // Canvas引用
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // 图例容器引用
  const legendRef = useRef<HTMLDivElement>(null);
  
  // 工具提示状态
  const [tooltipState, setTooltipState] = React.useState({
    visible: false,
    x: 0,
    y: 0,
    data: null as DataPoint | null,
    index: 0
  });
  
  // 当前主题
  const currentTheme = customTheme || defaultThemes[baseOptions.theme || 'light'] || defaultThemes.light;
  
  // 计算图表尺寸
  const chartDimensions = useMemo(() => {
    return {
      width: typeof baseOptions.width === 'number' ? baseOptions.width : 400,
      height: typeof baseOptions.height === 'number' ? baseOptions.height : 400
    };
  }, [baseOptions.width, baseOptions.height]);
  
  // 计算绘图区域尺寸
  const plottingArea = useMemo(() => {
    // 计算图例占用空间
    const legendWidth = legend.visible !== false ? 120 : 0;
    const legendHeight = legend.visible !== false && legend.position === 'bottom' ? 80 : 0;
    
    return {
      width: chartDimensions.width - (legend.visible !== false && legend.position === 'right' ? legendWidth + 20 : 20) - 20,
      height: chartDimensions.height - (baseOptions.title ? 60 : 20) - (legend.visible !== false && legend.position === 'bottom' ? legendHeight + 20 : 20) - 20,
      padding: {
        top: baseOptions.title ? 60 : 20,
        right: legend.visible !== false && legend.position === 'right' ? legendWidth + 20 : 20,
        bottom: legend.visible !== false && legend.position === 'bottom' ? legendHeight + 20 : 20,
        left: 20
      }
    };
  }, [chartDimensions, baseOptions.title, legend]);
  
  // 计算饼图参数
  const pieParams = useMemo(() => {
    // 使用第一个系列的数据
    const dataSeries = series[0];
    if (!dataSeries || !dataSeries.data || dataSeries.data.length === 0) {
      return {
        center: { x: 0, y: 0 },
        radius: 0,
        data: [],
        total: 0
      };
    }
    
    // 计算饼图中心点
    const centerX = plottingArea.padding.left + plottingArea.width / 2;
    const centerY = plottingArea.padding.top + plottingArea.height / 2;
    
    // 计算半径（取最小边的一半）
    const radius = Math.min(plottingArea.width, plottingArea.height) / 2 * (pie.radius || 0.8);
    
    // 计算总计
    const total = dataSeries.data.reduce((sum, point) => sum + (point.y || 0), 0);
    
    return {
      center: { x: centerX, y: centerY },
      radius,
      data: dataSeries.data,
      total
    };
  }, [series, plottingArea, pie]);
  
  // 格式化百分比标签
  const formatPercentage = (value: number, total: number) => {
    if (total === 0) return '0%';
    const percentage = (value / total) * 100;
    return `${percentage.toFixed(2)}%`;
  };
  
  // 绘制饼图扇区
  const drawPieSectors = (ctx: CanvasRenderingContext2D) => {
    const { center, radius, data, total } = pieParams;
    if (data.length === 0 || total === 0) return;
    
    // 第一个系列的颜色
    const dataSeries = series[0];
    const defaultColors = currentTheme.colors || ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'];
    
    const startAngle = pie.startAngle !== undefined ? pie.startAngle : -Math.PI / 2;
    let currentAngle = startAngle;
    
    data.forEach((point, index) => {
      // 计算扇区角度
      const angleSize = (point.y / total) * 2 * Math.PI;
      
      // 跳过零值数据
      if (point.y === 0 || angleSize <= 0) return;
      
      // 获取颜色
      const sectorColor = point.color || dataSeries?.color || defaultColors[index % defaultColors.length];
      
      // 绘制扇区
      ctx.fillStyle = sectorColor;
      ctx.beginPath();
      ctx.moveTo(center.x, center.y);
      
      // 如果只有一个扇区，绘制一个完整的圆
      if (data.length === 1) {
        ctx.arc(center.x, center.y, radius, 0, 2 * Math.PI);
      } else {
        ctx.arc(center.x, center.y, radius, currentAngle, currentAngle + angleSize);
      }
      
      ctx.closePath();
      ctx.fill();
      
      // 添加边框（如果需要）
      if (pie.borderWidth && pie.borderWidth > 0) {
        ctx.strokeStyle = pie.borderColor || '#fff';
        ctx.lineWidth = pie.borderWidth;
        ctx.stroke();
      }
      
      // 绘制标签（如果需要）
      if (pie.label?.visible !== false) {
        const labelAngle = currentAngle + angleSize / 2;
        
        // 计算标签位置
        const labelRadius = radius * (pie.label?.position === 'outer' ? 1.2 : 0.7);
        const labelX = center.x + Math.cos(labelAngle) * labelRadius;
        const labelY = center.y + Math.sin(labelAngle) * labelRadius;
        
        // 绘制标签
        ctx.fillStyle = pie.label?.color || currentTheme.text;
        ctx.font = `${pie.label?.fontSize || 12}px ${pie.label?.fontFamily || 'sans-serif'}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // 根据配置显示不同的标签内容
        let labelText = '';
        if (pie.label?.showLabel) {
          labelText = point.label || String(point.x) || `数据${index + 1}`;
        }
        if (pie.label?.showPercentage) {
          if (labelText) labelText += ' ';
          labelText += formatPercentage(point.y, total);
        }
        if (pie.label?.showValue) {
          if (labelText) labelText += ' ';
          labelText += String(point.y);
        }
        
        if (labelText) {
          ctx.fillText(labelText, labelX, labelY);
        }
      }
      
      // 更新当前角度
      currentAngle += angleSize;
    });
  };
  
  // 绘制图例
  const drawLegend = () => {
    if (legend.visible === false) return null;
    
    const dataSeries = series[0];
    if (!dataSeries || !dataSeries.data || dataSeries.data.length === 0) return null;
    
    const defaultColors = currentTheme.colors || ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22', '#17becf'];
    
    return (
      <div
        ref={legendRef}
        className={`absolute ${legend.position === 'bottom' ? 'bottom-0 left-0 right-0' : legend.position === 'right' ? 'right-0 top-0 bottom-0' : 'top-0 right-0'}
                   ${legend.position === 'right' ? 'w-28' : 'h-20'}
                   flex flex-wrap items-center justify-center p-2`}
      >
        {dataSeries.data.map((point, index) => {
          if (point.y === 0) return null;
          
          const color = point.color || dataSeries?.color || defaultColors[index % defaultColors.length];
          
          return (
            <div
              key={index}
              className={`flex items-center m-1 ${legend.position === 'right' ? 'w-full' : 'mr-3'}`}
              onClick={() => handleLegendClick(index)}
              style={{ cursor: baseOptions.interactive ? 'pointer' : 'default' }}
              onMouseEnter={() => handleLegendHover(index)}
              onMouseLeave={() => handleLegendLeave()}
            >
              <div
                className="w-3 h-3 mr-1 rounded"
                style={{ backgroundColor: color }}
              />
              <span
                className={`text-xs ${tooltipState.visible && tooltipState.index === index ? 'font-bold' : ''}`}
                style={{ color: currentTheme.text }}
              >
                {point.label || String(point.x) || `数据${index + 1}`}
              </span>
            </div>
          );
        })}
      </div>
    );
  };
  
  // 处理图例点击
  const handleLegendClick = (index: number) => {
    if (!baseOptions.interactive) return;
    
    // 触发图例点击事件
    if (onEvent) {
      const dataPoint = series[0]?.data[index];
      if (dataPoint) {
        onEvent({
          type: 'legendClick',
          data: {
            index,
            point: dataPoint,
            seriesIndex: 0
          }
        });
      }
    }
  };
  
  // 处理图例悬停
  const handleLegendHover = (index: number) => {
    const dataPoint = series[0]?.data[index];
    if (dataPoint) {
      setTooltipState({
        visible: true,
        x: legendRef.current?.getBoundingClientRect().x || 0,
        y: legendRef.current?.getBoundingClientRect().y || 0,
        data: dataPoint,
        index
      });
      
      // 触发图例悬停事件
      if (onEvent) {
        onEvent({
          type: 'legendHover',
          data: {
            index,
            point: dataPoint,
            seriesIndex: 0
          }
        });
      }
    }
  };
  
  // 处理图例离开
  const handleLegendLeave = () => {
    setTooltipState({ ...tooltipState, visible: false });
  };
  
  // 处理鼠标移动
  const handleMouseMove = (event: React.MouseEvent) => {
    if (!baseOptions.interactive) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // 检查是否在饼图区域内
    const dx = x - pieParams.center.x;
    const dy = y - pieParams.center.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > pieParams.radius) {
      setTooltipState({ ...tooltipState, visible: false });
      return;
    }
    
    // 计算鼠标指向的扇区
    const angle = Math.atan2(dy, dx);
    const startAngle = pie.startAngle !== undefined ? pie.startAngle : -Math.PI / 2;
    
    // 计算每个扇区的角度范围并查找鼠标所在的扇区
    const data = series[0]?.data || [];
    let currentAngle = startAngle;
    let foundIndex = -1;
    let foundPoint = null;
    
    for (let i = 0; i < data.length; i++) {
      const point = data[i];
      if (!point || point.y === 0) continue;
      
      const sectorAngle = (point.y / pieParams.total) * 2 * Math.PI;
      const sectorEndAngle = currentAngle + sectorAngle;
      
      // 检查角度是否在扇区范围内（需要考虑循环）
      if (currentAngle <= angle && angle <= sectorEndAngle) {
        foundIndex = i;
        foundPoint = point;
        break;
      }
      
      currentAngle = sectorEndAngle;
    }
    
    if (foundIndex !== -1 && foundPoint) {
      setTooltipState({
        visible: true,
        x: event.clientX,
        y: event.clientY,
        data: foundPoint,
        index: foundIndex
      });
    } else {
      setTooltipState({ ...tooltipState, visible: false });
    }
  };
  
  // 处理鼠标离开
  const handleMouseLeave = () => {
    setTooltipState({ ...tooltipState, visible: false });
  };
  
  // 处理点击事件
  const handleClick = (event: React.MouseEvent) => {
    if (!baseOptions.interactive || !tooltipState.visible || !tooltipState.data) return;
    
    // 触发点击事件
    if (onEvent) {
      onEvent({
        type: 'pieSliceClick',
        data: {
          point: tooltipState.data,
          index: tooltipState.index,
          seriesIndex: 0
        },
        nativeEvent: event.nativeEvent
      });
    }
  };
  
  // 渲染工具提示
  const renderTooltip = () => {
    if (!tooltipState.visible || !tooltipState.data || !tooltip?.visible) return null;
    
    const { x, y, data, index } = tooltipState;
    const percentage = pieParams.total > 0 ? (data.y / pieParams.total) * 100 : 0;
    
    // 构建工具提示内容
    let content;
    if (tooltip.template) {
      content = tooltip.template({
        ...data,
        percentage
      });
    } else {
      // 默认工具提示内容
      content = (
        <div className="bg-white dark:bg-gray-800 p-2 border border-gray-300 dark:border-gray-700 rounded shadow-lg text-sm">
          <p className="font-medium text-gray-700 dark:text-gray-200 mb-1">
            {data.label || String(data.x) || `数据${index + 1}`}
          </p>
          <p className="text-gray-600 dark:text-gray-300">
            数值: {data.y}
          </p>
          <p className="text-gray-500 dark:text-gray-400 text-xs">
            占比: {percentage.toFixed(2)}%
          </p>
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
    
    // 绘制饼图
    drawPieSectors(ctx);
  };
  
  // 监听数据变化并重绘图表
  useEffect(() => {
    renderChart();
  }, [series, chartDimensions, pieParams, currentTheme, pie, legend]);
  
  // 图表渲染回调函数
  const handleChartRendered = () => {
    renderChart();
  };
  
  return (
    <BaseChart
      chartType="pie"
      options={{ ...baseOptions }}
      series={series}
      tooltip={tooltip}
      theme={customTheme}
      loading={loading}
      error={error}
      onEvent={onEvent}
      onRendered={handleChartRendered}
    >
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        <canvas
          ref={canvasRef}
          style={{
            width: '100%',
            height: '100%'
          }}
          onClick={handleClick}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        />
        {renderTooltip()}
        {drawLegend()}
      </div>
    </BaseChart>
  );
};

export default PieChart;