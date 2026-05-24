/**
 * @file CSV到HTML转换器
 * @description 实现CSV数据到HTML表格的转换功能
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-20
 */
import { BaseConverter } from '../common/BaseConverter';
import { ConversionOptions, ConversionResult } from '../common/IConverter';
/**
 * CSV到HTML转换选项接口
 */
export interface CsvToHtmlOptions extends ConversionOptions {
    delimiter?: string;
    quoteChar?: string;
    escapeChar?: string;
    hasHeaders?: boolean;
    includeHtmlWrapper?: boolean;
    includeHead?: boolean;
    includeBody?: boolean;
    title?: string;
    css?: string;
    prettyPrint?: boolean;
    tableClassName?: string;
    headerRowClassName?: string;
    headerCellClassName?: string;
    rowClassName?: string;
    cellClassName?: string;
    alternateRowClassName?: string;
    maxRows?: number;
    limitRows?: boolean;
    showRowNumbers?: boolean;
    sortableColumns?: boolean;
    searchable?: boolean;
    pagination?: boolean;
    rowsPerPage?: number;
    responsive?: boolean;
    borderCollapse?: boolean;
    includeTableSummary?: boolean;
    tableSummary?: string;
    includeCsvStatistics?: boolean;
    highlightHeaders?: boolean;
    customTableAttributes?: Record<string, string>;
    customRowAttributes?: (rowData: string[], rowIndex: number) => Record<string, string>;
    customCellAttributes?: (cellValue: string, rowIndex: number, colIndex: number) => Record<string, string>;
}
/**
 * CSV到HTML转换器类
 */
export declare class CsvToHtmlConverter extends BaseConverter {
    constructor();
    /**
     * 执行CSV到HTML的转换
     * @param inputData CSV输入数据
     * @param inputFormat 输入格式
     * @param outputFormat 输出格式
     * @param options 转换选项
     */
    convert(inputData: Buffer | string, inputFormat: string, outputFormat: string, options?: CsvToHtmlOptions): Promise<ConversionResult>;
    /**
     * 获取默认CSS样式
     */
    private getDefaultCss;
    /**
     * 解析CSV内容
     */
    private parseCsv;
    /**
     * CSV转HTML的核心方法
     */
    private csvToHtml;
    /**
     * 构建HTML表格
     */
    private buildTable;
}
//# sourceMappingURL=CsvToHtmlConverter.d.ts.map