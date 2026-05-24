/**
 * @file Excel数据分析器
 * @description 对Excel文件数据进行高级分析、统计和可视化准备
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-20
 */
import { BaseConverter } from '../common/BaseConverter';
import { ConversionOptions, ConversionResult } from '../common/IConverter';
/**
 * 工作表配置接口
 */
export interface SheetConfig {
    name: string;
    include?: boolean;
    alias?: string;
    description?: string;
}
/**
 * 数据列配置接口
 */
export interface ColumnConfig {
    name: string;
    type?: 'auto' | 'string' | 'number' | 'date' | 'boolean';
    description?: string;
    format?: string;
    includeInAnalysis?: boolean;
    sheetName?: string;
}
/**
 * 分析配置接口
 */
export interface AnalysisConfig {
    sheets?: SheetConfig[];
    columns?: ColumnConfig[];
    sampleSize?: number;
    maxRows?: number;
    startRow?: number;
    headerRow?: number;
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
    analyzeFormulas?: boolean;
    analyzeConditionalFormats?: boolean;
    analyzeDataValidation?: boolean;
    trimValues?: boolean;
    convertEmptyToNull?: boolean;
    detectDataTypes?: boolean;
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
    sheet?: string;
    column: string;
    type: 'missing_values' | 'duplicate_values' | 'invalid_format' | 'outliers' | 'inconsistency' | 'formula_error';
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
    relatedSheets?: string[];
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
 * 工作表分析结果接口
 */
export interface SheetAnalysisResult {
    name: string;
    rowCount: number;
    columnCount: number;
    dataRange?: string;
    headers?: string[];
    columnStatistics: Record<string, StatisticResult>;
    qualityIssues: DataQualityIssue[];
    insights: DataInsight[];
    visualizations: VisualizationData[];
    formulaStats?: {
        totalFormulas: number;
        uniqueFormulas: number;
        formulaErrors: number;
        formulaTypes?: Record<string, number>;
    };
}
/**
 * Excel数据分析器选项接口
 */
export interface ExcelDataAnalyzerOptions extends ConversionOptions {
    analysisConfig?: AnalysisConfig;
    outputFormat?: 'json' | 'markdown' | 'html';
    includeRawData?: boolean;
    includeSummary?: boolean;
    includeSheetDetails?: boolean;
    memoryLimit?: number;
    parallelProcessing?: boolean;
    useCache?: boolean;
    cacheDuration?: number;
}
/**
 * Excel数据分析器类
 */
export declare class ExcelDataAnalyzer extends BaseConverter {
    constructor();
    /**
     * 执行Excel数据分析
     * @param inputData Excel输入数据
     * @param inputFormat 输入格式
     * @param outputFormat 输出格式
     * @param options 分析选项
     */
    convert(inputData: Buffer | string, inputFormat: string, outputFormat: string, options?: ExcelDataAnalyzerOptions): Promise<ConversionResult>;
    /**
     * 分析Excel数据
     * @param inputData Excel输入数据
     * @param options 分析选项
     */
    private analyzeExcelData;
    /**
     * 分析单个工作表
     */
    private analyzeSheet;
    /**
     * 生成模拟统计数据
     */
    private generateMockStatistics;
    /**
     * 构建输出数据
     */
    private buildOutputData;
    /**
     * 计算总体公式统计
     */
    private calculateOverallFormulaStats;
    /**
     * 计算数据类型分布
     */
    private calculateDataTypeDistribution;
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
    /**
     * 格式化数据类型
     */
    private formatDataType;
}
//# sourceMappingURL=ExcelDataAnalyzer.d.ts.map