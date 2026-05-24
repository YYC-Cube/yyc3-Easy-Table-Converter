/**
 * @file 行业数据可视化组件
 * @description 提供多种图表类型，支持各行业数据的直观展示与分析
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 */

import React, { useEffect, useState } from 'react';
import { LineChart, BarChart, PieChart, RadarChart, AreaChart, ResponsiveContainer } from 'recharts';
import { Line, Bar, Pie, Radar, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Download, RefreshCw, Settings, X } from 'lucide-react';

// 定义图表数据类型
interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: any;
}

// 定义图表配置选项
interface ChartOptions {
  title?: string;
  subtitle?: string;
  type: 'line' | 'bar' | 'pie' | 'radar' | 'area';
  height?: number;
  width?: string | number;
  showLegend?: boolean;
  showGrid?: boolean;
  showXAxis?: boolean;
  showYAxis?: boolean;
  animate?: boolean;
  industryType?: string;
  theme?: 'light' | 'dark' | 'system';
  responsive?: boolean;
  downloadEnabled?: boolean;
  refreshEnabled?: boolean;
  settingsEnabled?: boolean;
}

// 定义行业特定颜色映射
const industryColorMap: Record<string, string> = {
  finance: 'var(--finance)',
  healthcare: 'var(--healthcare)',
  retail: 'var(--retail)',
  manufacturing: 'var(--manufacturing)',
  education: 'var(--education)',
  government: 'var(--government)',
  technology: 'var(--technology)',
  media: 'var(--media)',
  energy: 'var(--energy)',
  transportation: 'var(--transportation)',
  construction: 'var(--construction)',
  agriculture: 'var(--agriculture)',
  legal: 'var(--legal)',
  consulting: 'var(--consulting)',
  hospitality: 'var(--hospitality)',
  realestate: 'var(--realestate)',
  nonprofit: 'var(--nonprofit)',
  telecommunications: 'var(--telecommunications)',
  automotive: 'var(--automotive)',
  aerospace: 'var(--aerospace)',
  pharmaceutical: 'var(--pharmaceutical)',
  insurance: 'var(--insurance)',
  logistics: 'var(--logistics)',
};

// 定义主题颜色配置
const themeColors = {
  light: {
    background: 'var(--background)',
    text: 'var(--foreground)',
    grid: 'var(--border)',
    axis: 'var(--muted-foreground)',
    tooltip: 'rgba(255, 255, 255, 0.9)',
    tooltipText: 'var(--foreground)',
    tooltipBorder: 'var(--border)',
  },
  dark: {
    background: 'var(--card)',
    text: 'var(--card-foreground)',
    grid: 'var(--border)',
    axis: 'var(--muted-foreground)',
    tooltip: 'rgba(17, 24, 39, 0.9)',
    tooltipText: 'var(--card-foreground)',
    tooltipBorder: 'var(--border)',
  },
};

// 示例数据集生成函数
const generateSampleData = (type: string, count: number = 12): ChartDataPoint[] => {
  const labels = [
    '1月', '2月', '3月', '4月', '5月', '6月',
    '7月', '8月', '9月', '10月', '11月', '12月'
  ].slice(0, count);
  
  return labels.map((label) => {
    switch (type) {
      case 'finance':
        return { name: label, value: Math.floor(Math.random() * 50000) + 30000, profit: Math.floor(Math.random() * 20000) + 10000 };
      case 'healthcare':
        return { name: label, value: Math.floor(Math.random() * 1000) + 500, patients: Math.floor(Math.random() * 500) + 200 };
      case 'retail':
        return { name: label, value: Math.floor(Math.random() * 3000) + 1500, transactions: Math.floor(Math.random() * 500) + 200 };
      case 'manufacturing':
        return { name: label, value: Math.floor(Math.random() * 5000) + 2000, efficiency: Math.floor(Math.random() * 30) + 70 };
      case 'education':
        return { name: label, value: Math.floor(Math.random() * 2000) + 1000, students: Math.floor(Math.random() * 1000) + 500 };
      default:
        return { name: label, value: Math.floor(Math.random() * 1000) + 500 };
    }
  });
};

// 定义饼图和雷达图数据转换函数
const transformDataForChart = (data: ChartDataPoint[], type: string) => {
  if (type === 'pie') {
    return data.map(item => ({ name: item.name, value: item.value }));
  }
  return data;
};

// 定义图表组件的类型
interface IndustryChartProps {
  data?: ChartDataPoint[];
  options?: ChartOptions;
  onChartClick?: (data: any) => void;
  onDownload?: (chartType: string) => void;
  onRefresh?: () => void;
  onSettingsChange?: (options: Partial<ChartOptions>) => void;
}

/**
 * @description 行业数据可视化组件 - 支持多种图表类型，适配不同行业数据展示需求
 * @param {ChartDataPoint[]} props.data - 图表数据
 * @param {ChartOptions} props.options - 图表配置选项
 * @param {Function} props.onChartClick - 图表点击事件回调
 * @param {Function} props.onDownload - 下载事件回调
 * @param {Function} props.onRefresh - 刷新事件回调
 * @param {Function} props.onSettingsChange - 设置变更事件回调
 */
export const IndustryChart: React.FC<IndustryChartProps> = ({
  data,
  options = {},
  onChartClick,
  onDownload,
  onRefresh,
  onSettingsChange
}) => {
  const {
    title,
    subtitle,
    type = 'line',
    height = 400,
    showLegend = true,
    showGrid = true,
    showXAxis = true,
  showYAxis = true,
  industryType = 'technology',
    theme = 'system',
    downloadEnabled = true,
    refreshEnabled = true,
    settingsEnabled = true
  } = options;
  
  // 确定当前主题
  const [currentTheme, setCurrentTheme] = useState<'light' | 'dark'>('light');
  const [showSettingsPanel, setShowSettingsPanel] = useState(false);
  const [tempSettings, setTempSettings] = useState<Partial<ChartOptions>>({});
  
  // 使用提供的数据或生成示例数据
  const chartData = data || generateSampleData(industryType);
  
  // 处理主题检测和应用
  useEffect(() => {
    // 检测系统主题
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const updateTheme = () => {
      if (theme === 'system') {
        setCurrentTheme(mediaQuery.matches ? 'dark' : 'light');
      } else {
        setCurrentTheme(theme);
      }
    };
    
    updateTheme();
    mediaQuery.addEventListener('change', updateTheme);
    
    return () => {
      mediaQuery.removeEventListener('change', updateTheme);
    };
  }, [theme]);
  
  // 获取当前主题的颜色配置
  const themeConfig = themeColors[currentTheme];
  
  // 获取行业颜色
  const industryColor = industryColorMap[industryType] || 'var(--primary)';
  
  // 定义图表配置
  const chartConfig = {
    width: '100%',
    height,
    margin: { top: 20, right: 30, left: 20, bottom: 20 },
  };
  
  // 处理图表下载
  const handleDownload = () => {
    if (onDownload) {
      onDownload(type);
    } else {
      // 默认下载实现
      console.log(`下载${type}图表`);
      // 实际项目中可以使用html2canvas等库实现截图下载
    }
  };
  
  // 处理图表刷新
  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    }
  };
  
  // 保存图表设置
  const handleSaveSettings = () => {
    if (onSettingsChange) {
      onSettingsChange(tempSettings);
    }
    setShowSettingsPanel(false);
  };
  
  // 处理设置变更
  const handleSettingChange = (key: keyof ChartOptions, value: any) => {
    setTempSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };
  
  // 渲染设置面板
  const renderSettingsPanel = () => {
    if (!showSettingsPanel) return null;
    
    return (
      <div className="absolute right-0 top-16 z-50 w-72 bg-card border border-border rounded-lg shadow-lg p-4">
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-medium text-foreground">图表设置</h4>
          <button 
            onClick={() => setShowSettingsPanel(false)}
            className="p-1 rounded-full hover:bg-accent transition-colors"
            aria-label="关闭设置面板"
          >
            <X size={18} className="text-foreground" />
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">图表类型</label>
            <select 
              value={tempSettings.type || type}
              onChange={(e) => handleSettingChange('type', e.target.value)}
              className="w-full p-2 border border-border rounded-md bg-background text-foreground"
            >
              <option value="line">折线图</option>
              <option value="bar">柱状图</option>
              <option value="pie">饼图</option>
              <option value="radar">雷达图</option>
              <option value="area">面积图</option>
            </select>
          </div>
          
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">主题</label>
            <select 
              value={tempSettings.theme || theme}
              onChange={(e) => handleSettingChange('theme', e.target.value)}
              className="w-full p-2 border border-border rounded-md bg-background text-foreground"
            >
              <option value="light">浅色</option>
              <option value="dark">深色</option>
              <option value="system">跟随系统</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <input 
              type="checkbox"
              id="showLegend" 
              checked={tempSettings.showLegend !== undefined ? tempSettings.showLegend : showLegend}
              onChange={(e) => handleSettingChange('showLegend', e.target.checked)}
              className="rounded border-border text-primary focus:ring-primary"
            />
            <label htmlFor="showLegend" className="text-sm text-foreground">显示图例</label>
          </div>
          
          <div className="flex items-center space-x-2">
            <input 
              type="checkbox"
              id="showGrid" 
              checked={tempSettings.showGrid !== undefined ? tempSettings.showGrid : showGrid}
              onChange={(e) => handleSettingChange('showGrid', e.target.checked)}
              className="rounded border-border text-primary focus:ring-primary"
            />
            <label htmlFor="showGrid" className="text-sm text-foreground">显示网格</label>
          </div>
          
          <button 
            onClick={handleSaveSettings}
            className="w-full bg-primary text-primary-foreground py-2 px-4 rounded-md hover:bg-primary-dark transition-colors"
          >
            保存设置
          </button>
        </div>
      </div>
    );
  };
  
  // 渲染图表标题
  const renderTitle = () => {
    if (!title) return null;
    
    return (
      <div className="mb-4">
        <h3 className="text-xl font-semibold text-foreground">{title}</h3>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
    );
  };
  
  // 渲染图表工具栏
  const renderToolbar = () => {
    return (
      <div className="flex justify-between items-center mb-4 relative">
        <div className="flex items-center space-x-2">
          {industryType && (
            <span 
              className="text-xs font-medium px-2 py-1 rounded-full"
              style={{ backgroundColor: `${industryColor}30`, color: industryColor }}
            >
              {industryType.charAt(0).toUpperCase() + industryType.slice(1)}
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-1">
          {refreshEnabled && (
            <button 
              onClick={handleRefresh}
              className="p-2 rounded-full hover:bg-accent transition-colors"
              aria-label="刷新图表"
            >
              <RefreshCw size={16} className="text-foreground" />
            </button>
          )}
          
          {downloadEnabled && (
            <button 
              onClick={handleDownload}
              className="p-2 rounded-full hover:bg-accent transition-colors"
              aria-label="下载图表"
            >
              <Download size={16} className="text-foreground" />
            </button>
          )}
          
          {settingsEnabled && (
            <button 
              onClick={() => setShowSettingsPanel(true)}
              className="p-2 rounded-full hover:bg-accent transition-colors"
              aria-label="图表设置"
            >
              <Settings size={16} className="text-foreground" />
            </button>
          )}
        </div>
        
        {renderSettingsPanel()}
      </div>
    );
  };
  
  // 渲染图表内容
  const renderChartContent = () => {
    const processedDataForChart = transformDataForChart(chartData, type);
    
    const commonProps = {
      data: processedDataForChart,
      margin: chartConfig.margin,
    };
    
    const gridProps = showGrid ? (
      <CartesianGrid strokeDasharray="3 3" stroke={themeConfig.grid} vertical={false} />
    ) : null;
    
    const axisProps = (
      <>
        {showXAxis && (
          <XAxis 
            dataKey="name" 
            tick={{ fill: themeConfig.axis }} 
            axisLine={{ stroke: themeConfig.axis }}
          />
        )}
        {showYAxis && (
          <YAxis 
            tick={{ fill: themeConfig.axis }} 
            axisLine={{ stroke: themeConfig.axis }}
          />
        )}
      </>
    );
    
    const legendProps = showLegend ? (
      <Legend wrapperStyle={{ color: themeConfig.text }} />
    ) : null;
    
    const tooltipProps = (
      <Tooltip 
        contentStyle={{
          backgroundColor: themeConfig.tooltip,
          color: themeConfig.tooltipText,
          borderColor: themeConfig.tooltipBorder,
          borderRadius: 'var(--radius-md)',
        }}
      />
    );
    
    const chartProps = {
      ...(onChartClick && { onClick: onChartClick }),
      activeDot: { r: 8, fill: industryColor },
      stroke: industryColor,
      fill: type === 'area' ? `${industryColor}80` : 'none',
      fillOpacity: 0.8,
    };
    
    switch (type) {
      case 'line':
        return (
          <LineChart {...commonProps}>
            {gridProps}
            {axisProps}
            {tooltipProps}
            {legendProps}
            <Line 
              type="monotone" 
              dataKey="value" 
              strokeWidth={2} 
              {...chartProps} 
            />
            {chartData[0]?.profit !== undefined && (
              <Line 
                type="monotone" 
                dataKey="profit" 
                stroke="var(--secondary)" 
                strokeWidth={2} 
                activeDot={{ r: 8, fill: 'var(--secondary)' }} 
              />
            )}
          </LineChart>
        );
      case 'bar':
        return (
          <BarChart {...commonProps}>
            {gridProps}
            {axisProps}
            {tooltipProps}
            {legendProps}
            <Bar 
              dataKey="value" 
              radius={[4, 4, 0, 0]} 
              {...chartProps} 
            />
            {chartData[0]?.profit !== undefined && (
              <Bar 
                dataKey="profit" 
                fill="var(--secondary)" 
                radius={[4, 4, 0, 0]} 
              />
            )}
          </BarChart>
        );
      case 'pie':
        return (
          <PieChart {...commonProps}>
            {tooltipProps}
            {legendProps}
            <Pie 
              data={processedDataForChart}
              cx="50%" 
              cy="50%" 
              labelLine={false}
              outerRadius={100}
              dataKey="value"
              {...chartProps}
            />
          </PieChart>
        );
      case 'radar':
        return (
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={processedDataForChart}>
            {gridProps}
            {axisProps}
            {tooltipProps}
            {legendProps}
            <Radar 
              name="数据" 
              dataKey="value" 
              {...chartProps} 
            />
          </RadarChart>
        );
      case 'area':
        return (
          <AreaChart {...commonProps}>
            {gridProps}
            {axisProps}
            {tooltipProps}
            {legendProps}
            <Area 
              type="monotone" 
              name="数据" 
              dataKey="value" 
              {...chartProps} 
            />
            {chartData[0]?.profit !== undefined && (
              <Area 
                type="monotone" 
                name="利润" 
                dataKey="profit" 
                fillOpacity={0.6} 
                stroke="var(--secondary)" 
                fill="var(--secondary)" 
              />
            )}
          </AreaChart>
        );
      default:
        // 默认返回LineChart，确保总是返回一个有效的ReactElement
        return (
          <LineChart {...commonProps}>
            {gridProps}
            {axisProps}
            {tooltipProps}
            {legendProps}
            <Line 
              type="monotone" 
              dataKey="value" 
              strokeWidth={2} 
              {...chartProps} 
            />
          </LineChart>
        );
    }
  };
  
  return (
    <div 
      className={`bg-card border border-border rounded-lg overflow-hidden transition-colors`}
      style={{ backgroundColor: themeConfig.background }}
    >
      <div className="p-4">
        {renderTitle()}
        {renderToolbar()}
        
        <div className="w-full" style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            {renderChartContent()}
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

// 默认导出组件
export default IndustryChart;

// 导出图表类型和相关工具函数，供其他组件使用
export { 
  type ChartDataPoint, 
  type ChartOptions, 
  generateSampleData,
  industryColorMap,
  themeColors
};
