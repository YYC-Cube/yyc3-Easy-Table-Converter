/**
 * @file TOML格式化工具
 * @description 实现TOML文件的格式化、优化和标准化功能
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-20
 */
import { BaseConverter } from '../common/BaseConverter';
import { ConversionOptions, ConversionResult } from '../common/IConverter';
/**
 * TOML格式化选项接口
 */
export interface TomlFormatterOptions extends ConversionOptions {
    indent?: number;
    sortKeys?: boolean;
    sortTables?: boolean;
    alignComments?: boolean;
    normalizeQuotes?: boolean;
    useDotNotation?: boolean;
    compactArrays?: boolean;
    maxLineWidth?: number;
    removeEmptyLines?: boolean;
    spaceAfterEqual?: boolean;
    spaceAroundBrackets?: boolean;
    alignValues?: boolean;
    trailingNewline?: boolean;
    preserveComments?: boolean;
    validate?: boolean;
}
/**
 * TOML格式化工具类
 */
export declare class TomlFormatter extends BaseConverter {
    constructor();
    /**
     * 执行TOML格式化
     * @param inputData TOML输入数据
     * @param inputFormat 输入格式
     * @param outputFormat 输出格式
     * @param options 格式化选项
     */
    convert(inputData: Buffer | string, inputFormat: string, outputFormat: string, options?: TomlFormatterOptions): Promise<ConversionResult>;
    /**
     * 验证TOML格式是否有效
     */
    private isValidToml;
    /**
     * 简单的TOML解析验证
     */
    private parseTomlForValidation;
    /**
     * 格式化TOML内容
     */
    private formatToml;
    /**
     * 美化TOML格式
     */
    private prettyPrintToml;
    /**
     * 格式化键值对
     */
    private formatKeyValue;
    /**
     * 格式化数组
     */
    private formatArray;
    /**
     * 规范化引号
     */
    private normalizeQuotesInValue;
    /**
     * 备用的TOML格式化方法
     */
    private alternativeTomlFormat;
    /**
     * 计算TOML统计信息
     */
    private calculateTomlStatistics;
}
//# sourceMappingURL=TomlFormatter.d.ts.map