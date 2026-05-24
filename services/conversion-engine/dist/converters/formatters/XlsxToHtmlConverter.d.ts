/**
 * @file Excel到HTML转换器
 * @description 实现Excel文件到HTML表格的转换功能
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-20
 */
import { BaseConverter } from '../common/BaseConverter';
import { ConversionOptions, ConversionResult } from '../common/IConverter';
/**
 * Excel到HTML转换选项接口
 */
export interface XlsxToHtmlOptions extends ConversionOptions {
    includeHtmlWrapper?: boolean;
    includeHead?: boolean;
    includeBody?: boolean;
    title?: string;
    css?: string;
    prettyPrint?: boolean;
    includeAllSheets?: boolean;
    sheetNames?: string[];
    sheetIndices?: number[];
    tableClassName?: string;
    headerRowClassName?: string;
    headerCellClassName?: string;
    rowClassName?: string;
    cellClassName?: string;
    alternateRowClassName?: string;
    maxRows?: number;
    limitRows?: boolean;
    showSheetNames?: boolean;
    showRowNumbers?: boolean;
    showColumnHeaders?: boolean;
    mergeCells?: boolean;
    preserveFormatting?: boolean;
    formatDates?: boolean;
    dateFormat?: string;
    formatNumbers?: boolean;
    numberFormat?: string;
    emptyCellPlaceholder?: string;
    responsive?: boolean;
    borderCollapse?: boolean;
    includeTableSummary?: boolean;
    tableSummary?: string;
    includeExcelStatistics?: boolean;
    highlightHeaders?: boolean;
    customTableAttributes?: Record<string, string>;
    customRowAttributes?: (rowData: any[], rowIndex: number, sheetName: string) => Record<string, string>;
    customCellAttributes?: (cellValue: any, rowIndex: number, colIndex: number, sheetName: string) => Record<string, string>;
    sheetTitlePrefix?: string;
    sheetTitleSuffix?: string;
}
/**
 * Excel到HTML转换器类
 */
export declare class XlsxToHtmlConverter extends BaseConverter {
    constructor();
    /**
     * 执行Excel到HTML的转换
     * @param inputData Excel输入数据
     * @param inputFormat 输入格式
     * @param outputFormat 输出格式
     * @param options 转换选项
     */
    convert(inputData: Buffer | string, inputFormat: string, outputFormat: string, options?: XlsxToHtmlOptions): Promise<ConversionResult>;
    /**
     * 获取默认CSS样式
     */
    private getDefaultCss;
    /**
     * Excel转HTML的核心方法
     */
    private excelToHtml;
    /**
     * 获取要处理的工作表列表
     */
    private getSheetsToProcess;
    /**
     * 处理单个工作表
     */
    private processSheet;
    /**
     * 处理单个单元格
     */
    private processCell;
    /**
     * 格式化单元格值
     */
    private formatCellValue;
    /**
     * 获取合并单元格信息
     */
    private getMergeInfo;
    /**
     * 获取自定义属性字符串
     */
    private getCustomAttributes;
    /**
     * 获取Excel统计信息
     */
    private getExcelStatistics;
    /**
     * 转义HTML特殊字符
     */
    private escapeHtml;
}
//# sourceMappingURL=XlsxToHtmlConverter.d.ts.map