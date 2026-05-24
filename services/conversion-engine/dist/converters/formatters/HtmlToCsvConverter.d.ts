/**
 * @file HTML到CSV转换器
 * @description 实现HTML表格到CSV数据的转换功能
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-20
 */
import { BaseConverter } from '../common/BaseConverter';
import { ConversionOptions, ConversionResult } from '../common/IConverter';
/**
 * HTML到CSV转换选项接口
 */
export interface HtmlToCsvOptions extends ConversionOptions {
    delimiter?: string;
    quoteChar?: string;
    escapeChar?: string;
    includeHeaders?: boolean;
    tableSelector?: string;
    ignoreEmptyRows?: boolean;
    ignoreEmptyColumns?: boolean;
    trimWhitespace?: boolean;
    normalizeNewlines?: boolean;
    includeAllTables?: boolean;
    preferFirstTable?: boolean;
    skipHiddenElements?: boolean;
    cellProcessor?: (cellContent: string, rowIndex: number, colIndex: number) => string;
    maxTables?: number;
    maxRows?: number;
    maxColumns?: number;
    removeHtmlTags?: boolean;
    preserveComments?: boolean;
    collapseSpaces?: boolean;
    includeTableCaptions?: boolean;
    captionPosition?: 'before' | 'after' | 'none';
    mergeMultiTables?: boolean;
    tableSeparator?: string;
}
/**
 * HTML到CSV转换器类
 */
export declare class HtmlToCsvConverter extends BaseConverter {
    constructor();
    /**
     * 执行HTML到CSV的转换
     * @param inputData HTML输入数据
     * @param inputFormat 输入格式
     * @param outputFormat 输出格式
     * @param options 转换选项
     */
    convert(inputData: Buffer | string, inputFormat: string, outputFormat: string, options?: HtmlToCsvOptions): Promise<ConversionResult>;
    /**
     * HTML转CSV的核心方法
     */
    private htmlToCsv;
    /**
     * 从HTML中提取表格
     */
    private extractTables;
    /**
     * 提取表头
     */
    private extractHeaders;
    /**
     * 提取表格数据行
     */
    private extractRows;
    /**
     * 提取表格标题
     */
    private extractTableCaption;
    /**
     * 清理单元格内容
     */
    private cleanCellContent;
    /**
     * 解码HTML实体
     */
    private decodeHtmlEntities;
    /**
     * 转义CSV字段
     */
    private escapeCsvField;
    /**
     * 计算HTML到CSV转换的统计信息
     */
    private calculateHtmlToCsvStatistics;
}
//# sourceMappingURL=HtmlToCsvConverter.d.ts.map