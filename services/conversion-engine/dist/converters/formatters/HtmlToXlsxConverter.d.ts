/**
 * @file HTML到Excel转换器
 * @description 实现HTML表格到Excel文件的转换功能
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-20
 */
import { BaseConverter } from '../common/BaseConverter';
import { ConversionOptions, ConversionResult } from '../common/IConverter';
/**
 * HTML到Excel转换选项接口
 */
export interface HtmlToXlsxOptions extends ConversionOptions {
    sheetName?: string;
    useMultipleSheets?: boolean;
    includeStyles?: boolean;
    includeHeaders?: boolean;
    headerRowIndex?: number;
    dataRowStartIndex?: number;
    includeHiddenRows?: boolean;
    includeHiddenColumns?: boolean;
    tableSelector?: string;
    tablesToConvert?: number[];
    maxTables?: number;
    preserveFormatting?: boolean;
    autoFitColumns?: boolean;
    defaultColumnWidth?: number;
    defaultRowHeight?: number;
    dateFormat?: string;
    numberFormat?: string;
    stringFormat?: string;
    headerBackgroundColor?: string;
    headerFontColor?: string;
    headerFontBold?: boolean;
    dataBackgroundColor?: string;
    dataFontColor?: string;
    alternatingRowColors?: boolean;
    alternatingRowBackgroundColor?: string;
    freezeHeaders?: boolean;
    freezeRows?: number;
    freezeColumns?: number;
    mergeCells?: boolean;
    includeTableCaptions?: boolean;
    captionPosition?: 'top' | 'bottom' | 'none';
    convertUrlsToHyperlinks?: boolean;
    convertImages?: boolean;
    imageMaxWidth?: number;
    imageMaxHeight?: number;
    skipEmptyRows?: boolean;
    skipEmptyColumns?: boolean;
    detectDataTypes?: boolean;
    trimWhitespace?: boolean;
    removeEmptyTags?: boolean;
    cellValueProcessor?: (value: string, rowIndex: number, colIndex: number) => string | number | Date;
    rowProcessor?: (rowData: any[], rowIndex: number) => any[];
    columnProcessor?: (columnData: any[], colIndex: number) => any[];
    includeMetadata?: boolean;
    metadataSheetName?: string;
    includeTableSummary?: boolean;
    forceTextFormat?: boolean;
    customCellStyles?: boolean;
}
/**
 * HTML到Excel转换器类
 */
export declare class HtmlToXlsxConverter extends BaseConverter {
    constructor();
    /**
     * 执行HTML到Excel的转换
     * @param inputData HTML输入数据
     * @param inputFormat 输入格式
     * @param outputFormat 输出格式
     * @param options 转换选项
     */
    convert(inputData: Buffer | string, inputFormat: string, outputFormat: string, options?: HtmlToXlsxOptions): Promise<ConversionResult>;
    /**
     * 处理HTML表格
     */
    private processTables;
    /**
     * 获取要处理的表格索引列表
     */
    private getTablesToProcess;
    /**
     * 生成工作表名称
     */
    private generateSheetName;
    /**
     * 清理工作表名称（Excel对工作表名称有限制）
     */
    private sanitizeSheetName;
    /**
     * 提取表格数据
     */
    private extractTableData;
    /**
     * 提取单元格值
     */
    private extractCellValue;
    /**
     * 检测数据类型
     */
    private detectDataType;
    /**
     * 转换URL为超链接
     */
    private convertUrlToHyperlink;
    /**
     * 检查行是否隐藏
     */
    private isRowHidden;
    /**
     * 检查列是否隐藏
     */
    private isColumnHidden;
    /**
     * 检查是否所有行都为空
     */
    private isAllRowsEmpty;
    /**
     * 移除空列
     */
    private removeEmptyColumns;
    /**
     * 应用工作表选项
     */
    private applyWorksheetOptions;
    /**
     * 添加元数据工作表
     */
    private addMetadataSheet;
}
//# sourceMappingURL=HtmlToXlsxConverter.d.ts.map