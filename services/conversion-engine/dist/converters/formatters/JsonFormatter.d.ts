/**
 * @file JSON格式化工具
 * @description 实现JSON文件的格式化、优化和标准化功能
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-20
 */
import { BaseConverter } from '../common/BaseConverter';
import { ConversionOptions, ConversionResult } from '../common/IConverter';
/**
 * JSON格式化选项接口
 */
export interface JsonFormatterOptions extends ConversionOptions {
    indent?: number | string;
    sortKeys?: boolean;
    spaceAfterColon?: boolean;
    spaceAfterComma?: boolean;
    trailingComma?: boolean;
    removeComments?: boolean;
    stripWhitespace?: boolean;
    maxLineWidth?: number;
    compact?: boolean;
    validate?: boolean;
    escapeUnicode?: boolean;
    prettyPrint?: boolean;
    preserveNullValues?: boolean;
    removeEmptyObjects?: boolean;
    removeEmptyArrays?: boolean;
    trailingNewline?: boolean;
}
/**
 * JSON格式化工具类
 */
export declare class JsonFormatter extends BaseConverter {
    constructor();
    /**
     * 执行JSON格式化
     * @param inputData JSON输入数据
     * @param inputFormat 输入格式
     * @param outputFormat 输出格式
     * @param options 格式化选项
     */
    convert(inputData: Buffer | string, inputFormat: string, outputFormat: string, options?: JsonFormatterOptions): Promise<ConversionResult>;
    /**
     * 移除JSON中的注释
     */
    private removeComments;
    /**
     * 尝试修复无效的JSON
     */
    private tryFixJson;
    /**
     * 优化JSON数据结构
     */
    private optimizeJsonData;
    /**
     * 格式化JSON
     */
    private formatJson;
    /**
     * 自定义空格格式化
     */
    private customFormatSpaces;
    /**
     * 备用的JSON格式化方法
     */
    private alternativeJsonFormat;
    /**
     * 计算JSON统计信息
     */
    private calculateJsonStatistics;
}
//# sourceMappingURL=JsonFormatter.d.ts.map