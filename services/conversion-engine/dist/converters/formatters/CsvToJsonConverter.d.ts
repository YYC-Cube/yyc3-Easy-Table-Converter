/**
 * @file CSV到JSON转换器
 * @description 实现CSV数据到JSON格式的转换功能
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-20
 */
import { BaseConverter } from '../common/BaseConverter';
import { ConversionOptions, ConversionResult } from '../common/IConverter';
/**
 * CSV到JSON转换选项接口
 */
export interface CsvToJsonOptions extends ConversionOptions {
    delimiter?: string;
    headers?: string[];
    skipEmptyLines?: boolean;
    maxRows?: number;
    parseNumbers?: boolean;
}
/**
 * CSV到JSON转换器类
 */
export declare class CsvToJsonConverter extends BaseConverter {
    constructor();
    /**
     * 执行CSV到JSON的转换
     * @param inputData CSV输入数据
     * @param inputFormat 输入格式
     * @param outputFormat 输出格式
     * @param options 转换选项
     */
    convert(inputData: Buffer | string, inputFormat: string, outputFormat: string, options?: CsvToJsonOptions): Promise<ConversionResult>;
    /**
     * 将CSV数据转换为JSON数组
     * @param csvData CSV数据
     * @param options 转换选项
     */
    private csvToJson;
    /**
     * 验证CSV数据格式
     * @param data CSV数据
     */
    private isValidCsvFormat;
}
//# sourceMappingURL=CsvToJsonConverter.d.ts.map