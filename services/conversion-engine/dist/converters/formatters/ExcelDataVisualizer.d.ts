/**
 * @file Excel数据可视化工具
 * @description 将Excel数据转换为多种可视化图表格式，支持多工作表选择和交互式图表生成
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-20
 */
import { BaseConverter } from '../common/BaseConverter';
import { ConversionOptions, ConversionResult } from '../common/IConverter';
/**
 * 图表类型枚举
 */
export type ChartType = 'bar' | 'line' | 'pie' | 'scatter' | 'histogram' | 'box' | 'area' | 'radar' | 'heatmap' | 'treemap' | 'sankey' | 'graph';
/**
 * 图表主题枚举
 */
export type ChartTheme = 'light' | 'dark' | 'default' | 'pastel' | 'vintage' | 'modern' | 'macarons' | 'infographic';
/**
 * 坐标轴配置接口
 */
export interface AxisConfig {
    field?: string;
    title?: string;
    type?: 'category' | 'value' | 'time';
    show?: boolean;
    grid?: boolean;
    min?: number | string;
    max?: number | string;
    scale?: boolean;
    position?: 'top' | 'bottom' | 'left' | 'right';
    axisLabel?: {
        rotate?: number;
        formatter?: string;
    };
}
/**
 * 数据系列配置接口
 */
export interface SeriesConfig {
    field: string;
    name?: string;
    type?: ChartType;
    color?: string;
    stack?: string;
    smooth?: boolean;
    showLabel?: boolean;
    labelPosition?: 'top' | 'bottom' | 'left' | 'right' | 'inside';
    labelFormatter?: string;
    symbolSize?: number;
    radius?: string | string[];
    roseType?: 'radius' | 'area';
    emphasis?: {
        focus?: 'series' | 'item' | 'adjacency';
        itemStyle?: any;
    };
}
/**
 * 图例配置接口
 */
export interface LegendConfig {
    show?: boolean;
    position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
    orient?: 'horizontal' | 'vertical';
    formatter?: string;
    iconType?: 'circle' | 'rect' | 'line' | 'roundRect' | 'triangle';
}
/**
 * 工具提示配置接口
 */
export interface TooltipConfig {
    show?: boolean;
    trigger?: 'item' | 'axis' | 'none';
    formatter?: string;
    backgroundColor?: string;
    borderColor?: string;
    borderWidth?: number;
    textStyle?: any;
    animation?: boolean;
}
/**
 * 交互配置接口
 */
export interface InteractionConfig {
    enabled?: boolean;
    zoom?: boolean;
    pan?: boolean;
    drag?: boolean;
    select?: boolean;
    zoomOnWheel?: boolean;
    panOnDrag?: boolean;
    selectionMode?: 'single' | 'multiple';
}
/**
 * 动画配置接口
 */
export interface AnimationConfig {
    enabled?: boolean;
    duration?: number;
    easing?: string;
    delay?: number;
}
/**
 * 图表导出配置接口
 */
export interface ExportConfig {
    enabled?: boolean;
    formats?: ('png' | 'jpeg' | 'svg' | 'pdf' | 'excel')[];
    filename?: string;
    backgroundColor?: string;
}
/**
 * 数据处理配置接口
 */
export interface DataProcessConfig {
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    filterBy?: string;
    filterValue?: any;
    filterOperator?: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'contains' | 'not_contains';
    groupBy?: string[];
    aggregateBy?: string;
    aggregateFunction?: 'sum' | 'avg' | 'min' | 'max' | 'count' | 'median' | 'mode';
    limit?: number;
    offset?: number;
    sample?: number;
    pivotTable?: {
        enabled?: boolean;
        rowFields?: string[];
        columnFields?: string[];
        valueFields?: string[];
        valueFunction?: 'sum' | 'avg' | 'min' | 'max' | 'count';
    };
}
/**
 * 响应式配置接口
 */
export interface ResponsiveConfig {
    enabled?: boolean;
    width?: number | string;
    height?: number | string;
    maintainAspectRatio?: boolean;
    autoResize?: boolean;
    maxWidth?: number;
    maxHeight?: number;
}
/**
 * Excel工作表选择配置接口
 */
export interface WorksheetConfig {
    sheetIndex?: number;
    sheetName?: string;
    range?: string;
    hasHeaders?: boolean;
    headerRowIndex?: number;
    dataStartRowIndex?: number;
}
/**
 * Excel数据可视化选项接口
 */
export interface ExcelDataVisualizerOptions extends ConversionOptions {
    chartType: ChartType;
    chartTheme?: ChartTheme;
    title?: string;
    subtitle?: string;
    description?: string;
    xAxis?: AxisConfig;
    yAxis?: AxisConfig;
    series?: SeriesConfig[];
    legend?: LegendConfig;
    tooltip?: TooltipConfig;
    backgroundColor?: string;
    interaction?: InteractionConfig;
    animation?: AnimationConfig;
    export?: ExportConfig;
    dataProcess?: DataProcessConfig;
    responsive?: ResponsiveConfig;
    renderEngine?: 'canvas' | 'svg';
    canvasId?: string;
    excelOptions?: {
        sheet?: WorksheetConfig | WorksheetConfig[];
        dateFormat?: string;
        numberFormat?: string;
        trimValues?: boolean;
    };
    enableDrillDown?: boolean;
    enableDynamicUpdate?: boolean;
    saveConfig?: boolean;
}
/**
 * 可视化结果接口
 */
export interface VisualizationResult {
    chartType: ChartType;
    chartData: any;
    chartOptions: any;
    html: string;
    metadata?: {
        records?: number;
        fields?: number;
        processingTime?: number;
        chartSize?: {
            width: number;
            height: number;
        };
        worksheetInfo?: {
            name: string;
            index: number;
            rows: number;
            columns: number;
        }[];
    };
    exportUrls?: Record<string, string>;
}
/**
 * Excel数据可视化工具类
 */
export declare class ExcelDataVisualizer extends BaseConverter {
    constructor();
    /**
     * 执行Excel数据可视化
     * @param inputData Excel输入数据
     * @param inputFormat 输入格式
     * @param outputFormat 输出格式
     * @param options 可视化选项
     */
    convert(inputData: Buffer | string, inputFormat: string, outputFormat: string, options: ExcelDataVisualizerOptions): Promise<ConversionResult>;
    /**
     * 创建可视化
     * @param inputData Excel输入数据
     * @param outputFormat 输出格式
     * @param options 可视化选项
     */
    private createVisualization;
    /**
     * 解析Excel数据
     */
    private parseExcelData;
    /**
     * 生成模拟数据
     */
    private generateMockData;
    /**
     * 处理数据
     */
    private processData;
    /**
     * 创建透视表
     */
    private createPivotTable;
    /**
     * 聚合数据
     */
    private aggregateData;
    /**
     * 生成图表数据
     */
    private generateChartData;
    /**
     * 提取坐标轴数据
     */
    private extractAxisData;
    /**
     * 提取系列数据
     */
    private extractSeriesData;
    /**
     * 提取饼图数据
     */
    private extractPieData;
    /**
     * 提取散点图数据
     */
    private extractScatterData;
    /**
     * 提取直方图数据
     */
    private extractHistogramData;
    /**
     * 提取箱线图数据
     */
    private extractBoxData;
    /**
     * 提取雷达图数据
     */
    private extractRadarData;
    /**
     * 提取热力图数据
     */
    private extractHeatmapData;
    /**
     * 提取树图数据
     */
    private extractTreemapData;
    /**
     * 提取桑基图数据
     */
    private extractSankeyData;
    /**
     * 提取关系图数据
     */
    private extractGraphData;
    /**
     * 生成模拟桑基图链接
     */
    private generateMockSankeyLinks;
    /**
     * 生成HTML输出
     */
    private generateHtmlOutput;
    /**
     * 生成SVG输出
     */
    private generateSvgOutput;
    /**
     * 生成坐标轴配置
     */
    private generateAxisConfig;
    /**
     * 获取图表类型名称
     */
    private getChartTypeName;
    /**
     * 获取ECharts主题
     */
    private getEChartsTheme;
}
//# sourceMappingURL=ExcelDataVisualizer.d.ts.map