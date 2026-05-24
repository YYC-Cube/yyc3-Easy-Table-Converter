/**
 * @file XML到JSON转换器
 * @description 实现XML数据到JSON格式的转换功能
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-20
 */
import { BaseConverter } from '../common/BaseConverter';
import { ConversionOptions, ConversionResult } from '../common/IConverter';
/**
 * XML到JSON转换选项接口
 */
export interface XmlToJsonOptions extends ConversionOptions {
    explicitArray?: boolean;
    ignoreAttrs?: boolean;
    explicitRoot?: boolean;
    trim?: boolean;
    normalize?: boolean;
    mergeAttrs?: boolean;
    explicitChildren?: boolean;
}
/**
 * XML到JSON转换器类
 */
export declare class XmlToJsonConverter extends BaseConverter {
    constructor();
    /**
     * 执行XML到JSON的转换
     * @param inputData XML输入数据
     * @param inputFormat 输入格式
     * @param outputFormat 输出格式
     * @param options 转换选项
     */
    convert(inputData: Buffer | string, inputFormat: string, outputFormat: string, options?: XmlToJsonOptions): Promise<ConversionResult>;
    /**
     * 将XML数据转换为JSON对象
     * @param xmlData XML数据
     * @param options 转换选项
     */
    private xmlToJson;
    /**
     * 验证XML格式
     * @param xmlString XML字符串
     */
    private isValidXmlFormat;
    /**
     * 格式化XML数据（预处理）
     * @param xmlString XML字符串
     */
    private preprocessXml;
}
//# sourceMappingURL=XmlToJsonConverter.d.ts.map