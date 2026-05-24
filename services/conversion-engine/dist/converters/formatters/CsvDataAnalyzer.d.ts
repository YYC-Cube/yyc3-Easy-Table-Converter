/**
 * @file CSV数据分析器
 * @description 对CSV文件数据进行高级分析、统计和可视化准备
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-20
 */
import { BaseConverter } from '../common/BaseConverter';
import { ConversionOptions, ConversionResult } from '../common/IConverter';
/**
 * 数据列配置接口
 */
export interface ColumnConfig {
    name: string;
    type?: 'auto' | 'string' | 'number' | 'date' | 'boolean';
    description?: string;
    format?: string;
    includeInAnalysis?: boolean;
}
/**
 * 分析配置接口
 */
export interface AnalysisConfig {
    columns?: ColumnConfig[];
    sampleSize?: number;
    maxRecords?: number;
    performBasicStats?: boolean;
    performCorrelation?: boolean;
    performDistribution?: boolean;
    performOutlierDetection?: boolean;
    performPatternAnalysis?: boolean;
    prepareVisualization?: boolean;
    visualizationTypes?: ('bar' | 'pie' | 'line' | 'scatter' | 'histogram')[];
    detectDataQualityIssues?: boolean;
    suggestDataImprovements?: boolean;
    generateInsights?: boolean;
    delimiter?: string;
    quoteChar?: string;
    hasHeaders?: boolean;
    encoding?: string;
}
/**
 * 统计分析结果接口
 */
export interface StatisticResult {
    count: number;
    uniqueCount?: number;
    nullCount?: number;
    min?: number;
    max?: number;
    sum?: number;
    mean?: number;
    median?: number;
    mode?: any;
    variance?: number;
    standardDeviation?: number;
    percentiles?: Record<number, number>;
    distribution?: Record<any, number>;
    outliers?: any[];
    correlation?: Record<string, number>;
}
/**
 * 数据质量问题接口
 */
export interface DataQualityIssue {
    column: string;
    type: 'missing_values' | 'duplicate_values' | 'invalid_format' | 'outliers' | 'inconsistency';
    severity: 'low' | 'medium' | 'high';
    count: number;
    examples?: any[];
    description?: string;
    recommendation?: string;
}
/**
 * 数据洞察接口
 */
export interface DataInsight {
    type: 'trend' | 'correlation' | 'anomaly' | 'pattern' | 'recommendation';
    description: string;
    confidence: number;
    relatedColumns?: string[];
    evidence?: any;
}
/**
 * 可视化数据接口
 */
export interface VisualizationData {
    type: string;
    title: string;
    xAxis?: {
        name: string;
        data: any[];
    };
    yAxis?: {
        name: string;
        data: any[];
    };
    series?: any[];
    metadata?: any;
}
/**
 * CSV数据分析器选项接口
 */
export interface CsvDataAnalyzerOptions extends ConversionOptions {
    analysisConfig?: AnalysisConfig;
    outputFormat?: 'json' | 'markdown' | 'html';
    includeRawData?: boolean;
    includeSummary?: boolean;
    memoryLimit?: number;
    parallelProcessing?: boolean;
    useCache?: boolean;
    cacheDuration?: number;
}
/**
 * CSV数据分析器类
 */
export declare class CsvDataAnalyzer extends BaseConverter {
    constructor();
    /**
     * 执行CSV数据分析
     * @param inputData CSV输入数据
     * @param inputFormat 输入格式
     * @param outputFormat 输出格式
     * @param options 分析选项
     */
    convert(inputData: Buffer | string, inputFormat: string, outputFormat: string, options?: CsvDataAnalyzerOptions): Promise<ConversionResult>;
    /**
     * 分析CSV数据
     * @param inputData CSV输入数据
     * @param options 分析选项
     */
    private analyzeCsvData;
    /**
     * 解析CSV数据
     */
    private parseCsvData;
    /**
     * 解析单行CSV数据
     */
    private parseCsvLine;
    /**
     * 执行数据分析
     */
    private performAnalysis;
    /**
     * 检测数据类型
     */
    private detectDataType;
    /**
     * 计算统计数据
     */
    private calculateStatistics;
    /**
     * 检测数据质量问题
     */
    private detectDataQuality;
    /**
     * 执行相关性分析
     */
    private performCorrelationAnalysis;
    /**
     * 计算皮尔逊相关系数
     */
    private calculatePearsonCorrelation;
    /**
     * 生成数据洞察
     */
    private generateInsights;
    /**
     * 准备可视化数据
     */
    private prepareVisualizationData;
    /**
     * 构建输出数据
     */
    private buildOutputData;
    /**
     * 生成Markdown报告
     */
    private generateMarkdownReport;
    /**
     * 生成HTML报告
     */
    private generateHtmlReport;
    /**
     * 格式化问题类型
     */
    private formatIssueType;
    /**
     * 格式化严重程度
     */
    private formatSeverity;
    /**
     * 格式化洞察类型
     */
    private formatInsightType;
}
//# sourceMappingURL=CsvDataAnalyzer.d.ts.map