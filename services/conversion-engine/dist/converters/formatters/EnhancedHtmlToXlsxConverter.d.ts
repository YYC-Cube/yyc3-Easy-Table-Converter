/**
 * @file 增强版HTML到Excel转换器
 * @description 提供高级HTML表格到Excel转换功能，支持复杂样式和格式保留
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-20
 */
import { BaseConverter } from '../common/BaseConverter';
import { ConversionOptions, ConversionResult } from '../common/IConverter';
/**
 * 增强版HTML到Excel转换选项接口
 */
export interface EnhancedHtmlToXlsxOptions extends ConversionOptions {
    tableSelector?: string;
    includeAllTables?: boolean;
    maxTables?: number;
    includeHeaders?: boolean;
    headerRowIndex?: number;
    excludeEmptyRows?: boolean;
    excludeEmptyColumns?: boolean;
    trimWhitespace?: boolean;
    preserveStyles?: boolean;
    preserveColors?: boolean;
    preserveFontStyles?: boolean;
    preserveBorders?: boolean;
    preserveAlignment?: boolean;
    preserveWidthHeight?: boolean;
    detectDataTypes?: boolean;
    parseNumbers?: boolean;
    parseDates?: boolean;
    dateFormat?: string;
    sheetName?: string;
    sheetNamePrefix?: string;
    defaultSheetName?: string;
    mergeCells?: boolean;
    freezeHeaders?: boolean;
    autoFilter?: boolean;
    autoFitColumns?: boolean;
    cellValueProcessor?: (value: string, row: number, col: number) => any;
    cellStyleProcessor?: (style: any, row: number, col: number) => any;
    outputFormat?: 'xlsx' | 'xls' | 'csv';
    includeMetadata?: boolean;
    generateSummarySheet?: boolean;
}
/**
 * 增强版HTML到Excel转换器类
 */
export declare class EnhancedHtmlToXlsxConverter extends BaseConverter {
    constructor();
    /**
     * 执行增强版HTML到Excel的转换
     * @param inputData HTML输入数据
     * @param inputFormat 输入格式
     * @param outputFormat 输出格式
     * @param options 转换选项
     */
    convert(inputData: Buffer | string, inputFormat: string, outputFormat: string, options?: EnhancedHtmlToXlsxOptions): Promise<ConversionResult>;
    /**
     * 将HTML数据转换为增强版Excel
     * @param inputData HTML输入数据
     * @param options 转换选项
     */
    private htmlToEnhancedExcel;
    /**
     * 解析HTML
     * @param inputData 输入数据
     */
    private parseHtml;
    /**
     * 提取表格数据
     * @param htmlData HTML数据
     * @param options 转换选项
     */
    private extractTables;
    /**
     * 提取表格ID
     * @param tableHtml 表格HTML
     * @param index 表格索引
     */
    private extractTableId;
    /**
     * 提取表格标题
     * @param tableHtml 表格HTML
     * @param index 表格索引
     */
    private extractTableTitle;
    /**
     * 清理文本
     * @param text 文本
     */
    private cleanText;
    /**
     * 处理表格数据
     * @param tables 表格数据
     * @param options 转换选项
     */
    private processTables;
    /**
     * 提取表格内容和样式
     * @param tableHtml 表格HTML
     * @param options 转换选项
     */
    private extractTableContent;
    /**
     * 提取单元格
     * @param rowHtml 行HTML
     * @param options 转换选项
     */
    private extractCells;
    /**
     * 提取单元格样式
     * @param cellHtml 单元格HTML
     * @param options 转换选项
     */
    private extractCellStyle;
    /**
     * 处理样式属性
     * @param key 样式键
     * @param value 样式值
     * @param style 样式对象
     * @param options 转换选项
     */
    private processStyleProperty;
    /**
     * 解析颜色
     * @param colorValue 颜色值
     */
    private parseColor;
    /**
     * 提取行样式
     * @param rowHtml 行HTML
     * @param rowIndex 行索引
     * @param styles 样式对象
     * @param options 转换选项
     */
    private extractRowStyles;
    /**
     * 检测数据类型
     * @param value 值
     * @param options 转换选项
     */
    private detectDataType;
    /**
     * 解析日期
     * @param dateStr 日期字符串
     */
    private parseDate;
    /**
     * 处理表格数据
     * @param data 表格数据
     * @param options 转换选项
     */
    private processTableData;
    /**
     * 生成工作表名称
     * @param title 表格标题
     * @param index 索引
     * @param options 转换选项
     */
    private generateSheetName;
    /**
     * 生成Excel文件
     * @param tables 表格数据
     * @param options 转换选项
     */
    private generateExcelFile;
    /**
     * 生成CSV
     * @param data 表格数据
     * @param options 转换选项
     */
    private generateCsv;
    /**
     * 计算统计信息
     * @param excelContent Excel内容
     */
    private calculateStatistics;
}
//# sourceMappingURL=EnhancedHtmlToXlsxConverter.d.ts.map