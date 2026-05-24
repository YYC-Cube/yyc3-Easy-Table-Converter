/**
 * @file 数据报告生成器
 * @description 根据多格式数据源生成综合性数据报告，支持多种报告模板和输出格式
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-20
 */
import { BaseConverter } from '../common/BaseConverter';
import { ConversionOptions, ConversionResult } from '../common/IConverter';
/**
 * 报告类型枚举
 */
export type ReportType = 'summary' | 'detailed' | 'comparison' | 'dashboard' | 'financial' | 'scientific' | 'executive' | 'technical' | 'custom';
/**
 * 报告模板枚举
 */
export type ReportTemplate = 'default' | 'modern' | 'minimal' | 'corporate' | 'creative' | 'academic' | 'clean' | 'elegant' | 'bold' | 'simple';
/**
 * 报告主题枚举
 */
export type ReportTheme = 'light' | 'dark' | 'colorful' | 'monochrome' | 'pastel' | 'vintage' | 'professional' | 'playful' | 'serious' | 'casual';
/**
 * 数据源配置接口
 */
export interface DataSourceConfig {
    type: 'csv' | 'json' | 'excel' | 'xml' | 'html' | 'markdown' | 'api' | 'database';
    path?: string;
    content?: Buffer | string;
    url?: string;
    connectionString?: string;
    query?: string;
    headers?: Record<string, string>;
    sheetName?: string;
    sheetIndex?: number;
    range?: string;
    encoding?: string;
    delimiter?: string;
    quoteChar?: string;
    hasHeaders?: boolean;
    timeout?: number;
    retryCount?: number;
}
/**
 * 数据处理配置接口
 */
export interface DataProcessingConfig {
    cleanData?: boolean;
    removeDuplicates?: boolean;
    fillMissing?: {
        enabled?: boolean;
        strategy?: 'mean' | 'median' | 'mode' | 'zero' | 'custom';
        value?: any;
    };
    normalizeData?: boolean;
    transformData?: Array<{
        field: string;
        operation: 'uppercase' | 'lowercase' | 'trim' | 'substring' | 'replace' | 'round' | 'floor' | 'ceil' | 'custom';
        params?: any;
        customFunction?: string;
    }>;
    filterData?: Array<{
        field: string;
        operator: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'contains' | 'not_contains' | 'in' | 'not_in' | 'between' | 'starts_with' | 'ends_with';
        value: any;
    }>;
    sortData?: Array<{
        field: string;
        order: 'asc' | 'desc';
    }>;
    groupData?: {
        by: string[];
        aggregations?: Array<{
            field: string;
            operation: 'sum' | 'avg' | 'min' | 'max' | 'count' | 'median' | 'mode' | 'custom';
            alias?: string;
            customFunction?: string;
        }>;
    };
    limitRows?: number;
    skipRows?: number;
    sampleSize?: number;
    pivotTable?: {
        enabled?: boolean;
        rowFields?: string[];
        columnFields?: string[];
        valueFields?: string[];
        aggregation?: 'sum' | 'avg' | 'min' | 'max' | 'count';
    };
}
/**
 * 报告结构配置接口
 */
export interface ReportStructureConfig {
    sections?: Array<{
        id: string;
        title: string;
        subtitle?: string;
        type: 'text' | 'table' | 'chart' | 'summary' | 'comparison' | 'list' | 'image' | 'code' | 'raw';
        dataSource?: string;
        dataField?: string;
        template?: string;
        options?: any;
        position?: 'top' | 'bottom' | 'after:section_id' | 'before:section_id';
        visibility?: 'visible' | 'hidden' | 'conditional';
        condition?: string;
        columns?: Array<{
            field: string;
            header: string;
            type?: 'string' | 'number' | 'date' | 'boolean' | 'currency' | 'percentage';
            format?: string;
            width?: string;
            align?: 'left' | 'center' | 'right';
            visible?: boolean;
            groupable?: boolean;
            sortable?: boolean;
        }>;
    }>;
    toc?: {
        enabled?: boolean;
        title?: string;
        position?: 'top' | 'beginning' | 'end';
        depth?: number;
        hyperlinks?: boolean;
        numbering?: boolean;
    };
    coverPage?: {
        enabled?: boolean;
        title?: string;
        subtitle?: string;
        author?: string;
        date?: string;
        logo?: string;
        background?: string;
        layout?: 'center' | 'top' | 'bottom';
        customHtml?: string;
    };
    footer?: {
        enabled?: boolean;
        text?: string;
        pageNumbers?: boolean;
        date?: boolean;
        companyInfo?: string;
        customHtml?: string;
    };
    header?: {
        enabled?: boolean;
        text?: string;
        logo?: string;
        customHtml?: string;
    };
    pageNumbers?: {
        enabled?: boolean;
        position?: 'header' | 'footer' | 'both';
        format?: string;
        startAt?: number;
    };
}
/**
 * 图表配置接口
 */
export interface ChartConfig {
    type: 'bar' | 'line' | 'pie' | 'scatter' | 'histogram' | 'box' | 'area' | 'radar' | 'heatmap' | 'treemap' | 'sankey' | 'graph';
    title?: string;
    subtitle?: string;
    xAxis?: {
        field?: string;
        title?: string;
        type?: 'category' | 'value' | 'time';
    };
    yAxis?: {
        field?: string;
        title?: string;
        type?: 'category' | 'value' | 'time';
    };
    series?: Array<{
        field: string;
        name?: string;
        color?: string;
        type?: string;
    }>;
    width?: string;
    height?: string;
    responsive?: boolean;
    animation?: boolean;
    interactive?: boolean;
}
/**
 * 表格配置接口
 */
export interface TableConfig {
    title?: string;
    subtitle?: string;
    columns?: Array<{
        field: string;
        header: string;
        type?: 'string' | 'number' | 'date' | 'boolean' | 'currency' | 'percentage';
        format?: string;
        width?: string;
        align?: 'left' | 'center' | 'right';
        visible?: boolean;
        sortable?: boolean;
        groupable?: boolean;
        searchable?: boolean;
        filterable?: boolean;
    }>;
    pagination?: {
        enabled?: boolean;
        pageSize?: number;
        pageNumbers?: boolean;
        controls?: boolean;
    };
    sorting?: {
        enabled?: boolean;
        defaultField?: string;
        defaultOrder?: 'asc' | 'desc';
    };
    filtering?: {
        enabled?: boolean;
        type?: 'row' | 'column' | 'both';
        defaultFilters?: Array<{
            field: string;
            operator: string;
            value: any;
        }>;
    };
    grouping?: {
        enabled?: boolean;
        defaultGroups?: string[];
        expandable?: boolean;
    };
    summaryRows?: boolean;
    exportable?: boolean;
    searchable?: boolean;
    selectable?: boolean;
    responsive?: boolean;
    bordered?: boolean;
    striped?: boolean;
    hoverable?: boolean;
}
/**
 * 摘要配置接口
 */
export interface SummaryConfig {
    metrics?: Array<{
        field: string;
        label: string;
        type: 'count' | 'sum' | 'avg' | 'min' | 'max' | 'median' | 'mode' | 'range' | 'custom';
        format?: string;
        customFunction?: string;
        color?: string;
        icon?: string;
    }>;
    text?: string;
    statistics?: boolean;
    insights?: boolean;
    trends?: boolean;
}
/**
 * 样式配置接口
 */
export interface StyleConfig {
    theme?: ReportTheme;
    template?: ReportTemplate;
    colors?: {
        primary?: string;
        secondary?: string;
        background?: string;
        text?: string;
        accent?: string;
        chart?: string[];
        table?: {
            header?: string;
            rowOdd?: string;
            rowEven?: string;
            border?: string;
        };
    };
    fonts?: {
        family?: string;
        size?: {
            title?: string;
            subtitle?: string;
            text?: string;
            small?: string;
            large?: string;
        };
        weight?: {
            title?: string;
            subtitle?: string;
            text?: string;
        };
        color?: {
            title?: string;
            subtitle?: string;
            text?: string;
            link?: string;
        };
    };
    margins?: {
        top?: string;
        right?: string;
        bottom?: string;
        left?: string;
    };
    padding?: {
        section?: string;
        element?: string;
    };
    borders?: {
        enabled?: boolean;
        style?: string;
        width?: string;
        color?: string;
        radius?: string;
    };
    shadows?: {
        enabled?: boolean;
        sections?: boolean;
        elements?: boolean;
        intensity?: string;
    };
    responsive?: {
        enabled?: boolean;
        breakpoints?: {
            small?: number;
            medium?: number;
            large?: number;
        };
    };
}
/**
 * 导出配置接口
 */
export interface ExportConfig {
    format?: 'html' | 'pdf' | 'docx' | 'xlsx' | 'pptx' | 'json' | 'markdown';
    filename?: string;
    options?: {
        pdf?: {
            orientation?: 'portrait' | 'landscape';
            paperSize?: string;
            margin?: {
                top?: number;
                right?: number;
                bottom?: number;
                left?: number;
            };
            header?: string;
            footer?: string;
            toc?: boolean;
            bookmarks?: boolean;
            zoom?: number;
        };
        docx?: {
            margins?: {
                top?: number;
                right?: number;
                bottom?: number;
                left?: number;
            };
            header?: string;
            footer?: string;
            toc?: boolean;
        };
        xlsx?: {
            sheetName?: string;
            autoFitColumns?: boolean;
            mergeCells?: boolean;
            freezePanels?: boolean;
        };
        pptx?: {
            slideSize?: {
                width?: number;
                height?: number;
            };
            template?: string;
        };
    };
}
/**
 * 报告生成器选项接口
 */
export interface DataReportGeneratorOptions extends ConversionOptions {
    reportType?: ReportType;
    reportTitle?: string;
    reportSubtitle?: string;
    author?: string;
    company?: string;
    department?: string;
    version?: string;
    date?: string;
    description?: string;
    keywords?: string[];
    dataSources?: DataSourceConfig[];
    dataProcessing?: DataProcessingConfig;
    reportStructure?: ReportStructureConfig;
    charts?: ChartConfig[];
    tables?: TableConfig[];
    summary?: SummaryConfig;
    style?: StyleConfig;
    export?: ExportConfig;
    enableCaching?: boolean;
    enableDataValidation?: boolean;
    enableErrorHandling?: boolean;
    enablePerformanceTracking?: boolean;
    enableAuditLogging?: boolean;
    customScripts?: {
        preProcessing?: string;
        postProcessing?: string;
    };
    customComponents?: Array<{
        id: string;
        type: 'html' | 'jsx' | 'template';
        content: string;
        position: 'before' | 'after' | 'replace';
        targetSection?: string;
    }>;
    i18n?: {
        locale?: string;
        translations?: Record<string, string>;
    };
    security?: {
        password?: string;
        encryption?: boolean;
        watermark?: string;
        restrictEditing?: boolean;
    };
}
/**
 * 报告生成结果接口
 */
export interface ReportResult {
    reportId: string;
    title: string;
    type: ReportType;
    sections: number;
    charts: number;
    tables: number;
    records: number;
    generationTime: number;
    dataSources: number;
    metadata: Record<string, any>;
    exportUrls?: Record<string, string>;
}
/**
 * 数据报告生成器类
 */
export declare class DataReportGenerator extends BaseConverter {
    constructor();
    /**
     * 执行报告生成
     * @param inputData 输入数据
     * @param inputFormat 输入格式
     * @param outputFormat 输出格式
     * @param options 报告生成选项
     */
    convert(inputData: Buffer | string, inputFormat: string, outputFormat: string, options: DataReportGeneratorOptions): Promise<ConversionResult>;
    /**
     * 设置默认选项
     */
    private setDefaultOptions;
    /**
     * 验证选项
     */
    private validateOptions;
    /**
     * 加载和处理数据
     */
    private loadAndProcessData;
    /**
     * 从数据源加载数据
     */
    private loadDataFromSource;
    /**
     * 生成模拟数据
     */
    private generateMockData;
    /**
     * 生成模拟API数据
     */
    private generateMockApiData;
    /**
     * 生成模拟数据库数据
     */
    private generateMockDatabaseData;
    /**
     * 处理数据源
     */
    private processDataSource;
    /**
     * 清理数据
     */
    private cleanData;
    /**
     * 移除重复项
     */
    private removeDuplicates;
    /**
     * 填充缺失值
     */
    private fillMissingValues;
    /**
     * 标准化数据
     */
    private normalizeData;
    /**
     * 过滤数据
     */
    private filterData;
    /**
     * 排序数据
     */
    private sortData;
    /**
     * 分组数据
     */
    private groupData;
    /**
     * 创建透视表
     */
    private createPivotTable;
    /**
     * 生成报告结构
     */
    private generateReportStructure;
    /**
     * 生成表格列配置
     */
    private generateTableColumns;
    /**
     * 推断列类型
     */
    private inferColumnType;
    /**
     * 推断列对齐方式
     */
    private inferColumnAlign;
    /**
     * 生成图表配置
     */
    private generateChartConfig;
}
//# sourceMappingURL=DataReportGenerator.d.ts.map