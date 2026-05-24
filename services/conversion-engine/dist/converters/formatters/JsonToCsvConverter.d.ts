/**
 * @file JSON到CSV转换器
 * @description 实现JSON数据到CSV格式的转换功能
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-20
 */
import { BaseConverter } from '../common/BaseConverter';
import { ConversionOptions, ConversionResult } from '../common/IConverter';
/**
 * JSON到CSV转换选项接口
 */
export interface JsonToCsvOptions extends ConversionOptions {
    delimiter?: string;
    headers?: string[];
    columns?: string[];
    quote?: string;
    escape?: string;
    ltrim?: boolean;
    rtrim?: boolean;
    rowDelimiter?: string;
}
/**
 * JSON到CSV转换器类
 */
export declare class JsonToCsvConverter extends BaseConverter {
    constructor();
    /**
     * 执行JSON到CSV的转换
     * @param inputData JSON输入数据
     * @param inputFormat 输入格式
     * @param outputFormat 输出格式
     * @param options 转换选项
     */
    convert(inputData: Buffer | string, inputFormat: string, outputFormat: string, options?: JsonToCsvOptions): Promise<ConversionResult>;
    /**
     * 解析JSON数据
     * @param data JSON数据
     */
    private parseJsonData;
    /**
     * 确保数据是数组格式
     * @param data 任意JSON数据
     */
    private ensureArrayFormat;
    /**
     * 将JSON数据转换为CSV字符串
     * @param jsonData JSON数组数据
     * @param options 转换选项
     */
    private jsonToCsv;
    /**
     * 扁平化嵌套JSON对象
     * @param obj 嵌套对象
     * @param prefix 前缀
     */
    private flattenObject;
}
//# sourceMappingURL=JsonToCsvConverter.d.ts.map