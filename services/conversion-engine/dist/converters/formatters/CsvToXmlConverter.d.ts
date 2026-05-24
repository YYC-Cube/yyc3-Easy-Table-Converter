/**
 * @file CSV到XML转换器
 * @description 实现CSV数据到XML格式的转换功能
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-20
 */
import { BaseConverter } from '../common/BaseConverter';
import { ConversionOptions, ConversionResult } from '../common/IConverter';
/**
 * CSV到XML转换选项接口
 */
export interface CsvToXmlOptions extends ConversionOptions {
    delimiter?: string;
    rootElement?: string;
    rowElement?: string;
    headers?: string[];
    skipEmptyLines?: boolean;
    maxRows?: number;
    xmldec?: {
        version?: string;
        encoding?: string;
        standalone?: boolean;
    };
}
/**
 * CSV到XML转换器类
 */
export declare class CsvToXmlConverter extends BaseConverter {
    constructor();
    /**
     * 执行CSV到XML的转换
     * @param inputData CSV输入数据
     * @param inputFormat 输入格式
     * @param outputFormat 输出格式
     * @param options 转换选项
     */
    convert(inputData: Buffer | string, inputFormat: string, outputFormat: string, options?: CsvToXmlOptions): Promise<ConversionResult>;
    /**
     * 将CSV数据转换为JSON数组
     * @param csvData CSV数据
     * @param options 转换选项
     */
    private csvToJson;
    /**
     * 将JSON数组转换为XML字符串
     * @param jsonData JSON数组数据
     * @param options 转换选项
     */
    private jsonToXml;
    /**
     * 验证CSV格式
     * @param csvString CSV字符串
     */
    private isValidCsvFormat;
}
//# sourceMappingURL=CsvToXmlConverter.d.ts.map