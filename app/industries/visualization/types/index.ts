/**
 * @file 数据可视化类型定义
 * @description 定义行业矩阵功能中所有可视化组件的类型接口
 * @module visualization/types
 * @author YYC
 * @version 1.0.0
 * @created 2024-07-25
 * @updated 2024-07-25
 */

/**
 * 基础图表配置接口
 */
export interface ChartBaseOptions {
  /** 图表唯一标识 */
  id?: string;
  
  /** 图表标题 */
  title?: string;
  
  /** 图表副标题 */
  subtitle?: string;
  
  /** 是否显示图例 */
  showLegend?: boolean;
  
  /** 图例位置 */
  legendPosition?: 'top' | 'bottom' | 'left' | 'right';
  
  /** 图表宽度 */
  width?: number | string;
  
  /** 图表高度 */
  height?: number | string;
  
  /** 响应式设计 */
  responsive?: boolean;
  
  /** 主题配置 */
  theme?: 'light' | 'dark' | 'default';
  
  /** 交互配置 */
  interactive?: boolean;
  
  /** 加载状态指示器 */
  loading?: boolean;
  
  /** 错误信息 */
  error?: string | null;
  
  /** 自定义样式 */
  className?: string;
}

/**
 * 数据点接口
 */
export interface DataPoint {
  /** X轴值 */
  x: string | number | Date;
  
  /** Y轴值 */
  y: number;
  
  /** 标签 */
  label?: string;
  
  /** 颜色 */
  color?: string;
  
  /** 工具提示内容 */
  tooltip?: string | Record<string, any>;
  
  /** 自定义数据 */
  [key: string]: any;
}

/**
 * 数据集接口
 */
export interface DataSeries {
  /** 数据集名称 */
  name: string;
  
  /** 数据点数组 */
  data: DataPoint[];
  
  /** 数据集颜色 */
  color?: string;
  
  /** 数据集类型 */
  type?: string;
  
  /** 是否显示 */
  visible?: boolean;
}

/**
 * 坐标轴配置接口
 */
export interface AxisOptions {
  /** 轴标题 */
  title?: string;
  
  /** 是否显示轴 */
  visible?: boolean;
  
  /** 轴标签格式 */
  tickFormat?: string;
  
  /** 轴范围 */
  domain?: [number, number];
  
  /** 网格线配置 */
  grid?: {
    visible?: boolean;
    stroke?: string;
    strokeWidth?: number;
  };
}

/**
 * 折线图配置接口
 */
export interface LineChartOptions extends ChartBaseOptions {
  /** X轴配置 */
  xAxis?: AxisOptions;
  
  /** Y轴配置 */
  yAxis?: AxisOptions;
  
  /** 数据集数组 */
  series: DataSeries[];
  
  /** 线条配置 */
  line?: {
    strokeWidth?: number;
    stroke?: string;
    smooth?: boolean;
  };
  
  /** 点配置 */
  point?: {
    visible?: boolean;
    radius?: number;
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
  };
  
  /** 是否显示区域 */
  area?: boolean;
  
  /** 动画配置 */
  animation?: {
    duration?: number;
    easing?: string;
  };
}

/**
 * 柱状图配置接口
 */
export interface BarChartOptions extends ChartBaseOptions {
  /** X轴配置 */
  xAxis?: AxisOptions;
  
  /** Y轴配置 */
  yAxis?: AxisOptions;
  
  /** 数据集数组 */
  series: DataSeries[];
  
  /** 柱子配置 */
  bar?: {
    width?: number;
    radius?: number;
  };
  
  /** 是否为堆叠柱状图 */
  stacked?: boolean;
  
  /** 动画配置 */
  animation?: {
    duration?: number;
    easing?: string;
  };
}

/**
 * 饼图配置接口
 */
export interface PieChartOptions extends ChartBaseOptions {
  /** 数据项数组 */
  data: Array<{
    /** 名称 */
    name: string;
    
    /** 值 */
    value: number;
    
    /** 颜色 */
    color?: string;
    
    /** 自定义数据 */
    [key: string]: any;
  }>;
  
  /** 内半径（甜甜圈图） */
  innerRadius?: number | string;
  
  /** 外半径 */
  outerRadius?: number | string;
  
  /** 起始角度 */
  startAngle?: number;
  
  /** 结束角度 */
  endAngle?: number;
  
  /** 标签配置 */
  label?: {
    visible?: boolean;
    formatter?: (name: string, percent: number) => string;
    position?: 'inside' | 'outside';
  };
  
  /** 动画配置 */
  animation?: {
    duration?: number;
    easing?: string;
  };
}

/**
 * 雷达图配置接口
 */
export interface RadarChartOptions extends ChartBaseOptions {
  /** 维度配置 */
  dimensions: Array<{
    /** 维度名称 */
    name: string;
    
    /** 维度最大值 */
    max?: number;
    
    /** 维度最小值 */
    min?: number;
  }>;
  
  /** 数据集数组 */
  series: Array<{
    /** 数据集名称 */
    name: string;
    
    /** 数据值数组 */
    values: number[];
    
    /** 数据集颜色 */
    color?: string;
  }>;
  
  /** 是否显示区域 */
  area?: boolean;
  
  /** 网格配置 */
  grid?: {
    visible?: boolean;
    level?: number;
  };
}

/**
 * 热力图配置接口
 */
export interface HeatmapOptions extends ChartBaseOptions {
  /** 数据点数组 */
  data: Array<{
    /** 行值 */
    row: string | number;
    
    /** 列值 */
    col: string | number;
    
    /** 数据值 */
    value: number;
  }>;
  
  /** 颜色比例尺配置 */
  colorScale?: {
    /** 颜色值数组 */
    colors: string[];
    
    /** 最小值 */
    domain?: [number, number];
  };
  
  /** 单元格配置 */
  cell?: {
    radius?: number;
  };
}

/**
 * 散点图配置接口
 */
export interface ScatterChartOptions extends ChartBaseOptions {
  /** X轴配置 */
  xAxis?: AxisOptions;
  
  /** Y轴配置 */
  yAxis?: AxisOptions;
  
  /** 数据集数组 */
  series: DataSeries[];
  
  /** 点配置 */
  point?: {
    radius?: number;
    opacity?: number;
  };
  
  /** 分组配置 */
  grouping?: {
    enabled?: boolean;
    field?: string;
  };
}

/**
 * 地图配置接口
 */
export interface MapOptions extends ChartBaseOptions {
  /** 地图类型 */
  mapType: string;
  
  /** 数据点数组 */
  data: Array<{
    /** 区域标识 */
    region: string;
    
    /** 数据值 */
    value: number;
    
    /** 自定义数据 */
    [key: string]: any;
  }>;
  
  /** 颜色配置 */
  colorScale?: {
    colors: string[];
    domain?: [number, number];
  };
  
  /** 区域配置 */
  region?: {
    stroke?: string;
    strokeWidth?: number;
    opacity?: number;
  };
  
  /** 缩放配置 */
  zoom?: {
    enabled?: boolean;
    min?: number;
    max?: number;
  };
}

/**
 * 仪表盘配置接口
 */
export interface GaugeOptions extends ChartBaseOptions {
  /** 指标值 */
  value: number;
  
  /** 最小值 */
  min?: number;
  
  /** 最大值 */
  max?: number;
  
  /** 颜色区间 */
  thresholds?: Array<{
    value: number;
    color: string;
  }>;
  
  /** 指针配置 */
  pointer?: {
    visible?: boolean;
    color?: string;
  };
  
  /** 标签配置 */
  label?: {
    visible?: boolean;
    format?: string;
  };
}

/**
 * 数据卡片配置接口
 */
export interface CardOptions extends ChartBaseOptions {
  /** 卡片值 */
  value: number | string;
  
  /** 卡片标签 */
  label?: string;
  
  /** 变化趋势 */
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
    period?: string;
  };
  
  /** 图标 */
  icon?: string;
  
  /** 颜色 */
  color?: string;
}

/**
 * 图表类型枚举
 */
export enum ChartType {
  LINE = 'line',
  BAR = 'bar',
  PIE = 'pie',
  RADAR = 'radar',
  HEATMAP = 'heatmap',
  SCATTER = 'scatter',
  MAP = 'map',
  GAUGE = 'gauge',
  CARD = 'card'
}

/**
 * 行业特定可视化配置接口
 */
export interface IndustryVisualizationConfig {
  /** 行业ID */
  industryId: string;
  
  /** 图表类型 */
  chartType: ChartType;
  
  /** 数据源配置 */
  dataSource: {
    type: string;
    config: Record<string, any>;
  };
  
  /** 图表配置 */
  chartConfig: any;
  
  /** 刷新间隔（毫秒） */
  refreshInterval?: number;
  
  /** 权限配置 */
  permissions?: {
    view?: string[];
    edit?: string[];
  };
}

/**
 * 工具提示配置接口
 */
export interface TooltipOptions {
  /** 是否显示工具提示 */
  visible?: boolean;
  
  /** 工具提示模板 */
  template?: (data: any) => string | React.ReactNode;
  
  /** 工具提示定位 */
  position?: 'top' | 'bottom' | 'left' | 'right' | 'mouse';
}

/**
 * 交互事件接口
 */
export interface ChartEvent {
  /** 事件类型 */
  type: string;
  
  /** 事件数据 */
  data: any;
  
  /** 原始事件 */
  nativeEvent?: Event;
}

/**
 * 可视化数据转换接口
 */
export interface VisualizationDataTransformer {
  /**
   * 转换数据为可视化格式
   * @param sourceData 源数据
   * @param options 转换选项
   */
  transform(sourceData: any, options?: any): any;
  
  /**
   * 验证数据格式
   * @param data 待验证数据
   */
  validate(data: any): boolean;
}

/**
 * 仪表盘布局接口
 */
export interface DashboardLayout {
  /** 仪表盘行配置 */
  rows: Array<{
    /** 行高度 */
    height?: number | string;
    /** 行内列配置 */
    columns: Array<{
      /** 列宽度 */
      width?: number | string;
      /** 列中图表配置 */
      chart?: {
        /** 图表ID */
        id: string;
        /** 图表类型 */
        type: string;
        /** 图表配置 */
        config: any;
      };
    }>;
  }>;
}

/**
 * 图表配置接口
 */
export interface ChartConfig {
  /** 图表类型 */
  type: string;
  /** 图表ID */
  id: string;
  /** 图表配置 */
  config: any;
}

/**
 * 仪表盘事件接口
 */
export interface DashboardEvent {
  /** 事件类型 */
  type: string;
  /** 事件数据 */
  data: any;
  /** 仪表盘信息 */
  dashboard?: {
    /** 仪表盘ID */
    id?: string;
    /** 图表ID */
    chartId?: string;
  };
}

/**
 * 可视化主题接口
 */
export interface VisualizationTheme {
  /** 主题名称 */
  name: string;
  
  /** 背景色 */
  background: string;
  
  /** 文本色 */
  text: string;
  
  /** 标题色 */
  title: string;
  
  /** 边框色 */
  border: string;
  
  /** 网格色 */
  grid: string;
  
  /** 颜色方案 */
  colors: string[];
  
  /** 阴影样式 */
  shadow?: string;
  
  /** 图表特定样式 */
  chartStyles?: Record<string, any>;
}