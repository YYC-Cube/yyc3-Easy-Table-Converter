/**
 * @file JSON到XML转换器
 * @description 实现JSON数据到XML格式的转换功能
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-20
 */
import { BaseConverter } from '../common/BaseConverter';
import { ConversionOptions, ConversionResult } from '../common/IConverter';
/**
 * JSON到XML转换选项接口
 */
export interface JsonToXmlOptions extends ConversionOptions {
    rootElement?: string;
    xmldec?: {
        version?: string;
        encoding?: string;
        standalone?: boolean;
    };
    cdata?: boolean;
    headless?: boolean;
    renderOpts?: {
        pretty?: boolean;
        indent?: string;
        newline?: string;
    };
}
/**
 * JSON到XML转换器类
 */
export declare class JsonToXmlConverter extends BaseConverter {
    constructor();
    /**
     * 执行JSON到XML的转换
     * @param inputData JSON输入数据
     * @param inputFormat 输入格式
     * @param outputFormat 输出格式
     * @param options 转换选项
     */
    convert(inputData: Buffer | string, inputFormat: string, outputFormat: string, options?: JsonToXmlOptions): Promise<ConversionResult>;
    /**
     * 解析JSON数据
     * @param data JSON数据
     */
    private parseJsonData;
    /**
     * 准备XML就绪的数据结构
     * @param jsonData JSON数据
     * @param rootElement 根元素名称
     */
    private prepareXmlReadyData;
    /**
     * 将JSON数据转换为XML字符串
     * @param jsonData JSON数据
     * @param options 转换选项
     */
    private jsonToXml;
    /**
     * 后处理XML字符串
     * @param xmlString XML字符串
     * @param options 转换选项
     */
    private postProcessXml;
    /**
     * 规范化数据键名，确保它们是有效的XML元素名
     * @param obj 对象
     */
    private normalizeKeys;
}
//# sourceMappingURL=JsonToXmlConverter.d.ts.map