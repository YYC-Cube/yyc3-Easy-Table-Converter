/**
 * @file CSV格式化工具
 * @description 实现CSV文件的格式化、优化和标准化功能
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-20
 */
import { BaseConverter } from '../common/BaseConverter';
import { ConversionOptions, ConversionResult } from '../common/IConverter';
/**
 * CSV格式化选项接口
 */
export interface CsvFormatterOptions extends ConversionOptions {
    delimiter?: string;
    quote?: string;
    escape?: string;
    hasHeaders?: boolean;
    trimFields?: boolean;
    removeEmptyRows?: boolean;
    standardizeLineBreaks?: boolean;
    alignHeaders?: boolean;
    maxLineWidth?: number;
    preserveComments?: boolean;
    validate?: boolean;
}
/**
 * CSV格式化工具类
 */
export declare class CsvFormatter extends BaseConverter {
    constructor();
    /**
     * 执行CSV格式化
     * @param inputData CSV输入数据
     * @param inputFormat 输入格式
     * @param outputFormat 输出格式
     * @param options 格式化选项
     */
    convert(inputData: Buffer | string, inputFormat: string, outputFormat: string, options?: CsvFormatterOptions): Promise<ConversionResult>;
    /**
     * 标准化换行符
     */
    private standardizeLineBreaks;
    /**
     * 解析CSV内容为行数组
     */
    private parseCsv;
    /**
     * 解析单行CSV数据
     */
    private parseCsvLine;
    /**
     * 验证CSV结构
     */
    private isValidCsvStructure;
    /**
     * 处理CSV行数据
     */
    private processCsvRows;
    /**
     * 格式化CSV数据
     */
    private formatCsv;
    /**
     * 格式化CSV字段
     */
    private formatCsvField;
    /**
     * 计算CSV统计信息
     */
    private calculateCsvStatistics;
}
//# sourceMappingURL=CsvFormatter.d.ts.map