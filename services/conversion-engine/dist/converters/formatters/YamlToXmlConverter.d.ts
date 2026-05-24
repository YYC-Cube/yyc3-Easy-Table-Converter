/**
 * @file YAML到XML转换器
 * @description 提供YAML格式到XML格式的转换功能
 * @module converters/formatters/YamlToXmlConverter
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-16
 * @updated 2024-10-16
 */
import { BaseConverter } from '../common/BaseConverter';
import { ConversionOptions, ConversionResult } from '../common/IConverter';
/**
 * YAML到XML转换选项接口
 */
export interface YamlToXmlOptions extends ConversionOptions {
    /** XML根元素名称 */
    rootElement?: string;
    /** 是否包含XML声明 */
    includeXmlDeclaration?: boolean;
    /** XML中表示数组的元素名称 */
    arrayElementName?: string;
    /** XML中表示记录的元素名称 */
    recordElementName?: string;
    /** 是否将对象属性转换为XML属性 */
    attributesAsProperties?: boolean;
    /** 是否使用CDATA包装文本内容 */
    useCdata?: boolean;
    /** 缩进空格数 */
    indent?: number;
    /** 日期格式字符串 */
    dateFormat?: string;
    /** 是否扁平化嵌套结构 */
    flattenNested?: boolean;
}
/**
 * YAML到XML转换器类
 */
export declare class YamlToXmlConverter extends BaseConverter<YamlToXmlOptions> {
    /**
     * 获取支持的输入格式
     * @returns 支持的输入格式数组
     */
    getSupportedInputFormats(): string[];
    /**
     * 获取支持的输出格式
     * @returns 支持的输出格式数组
     */
    getSupportedOutputFormats(): string[];
    /**
     * 执行实际的转换操作
     * @param input 输入的YAML字符串
     * @param options 转换选项
     * @returns 转换结果对象
     */
    protected convert(input: string, options: YamlToXmlOptions): Promise<ConversionResult>;
    /**
     * 扁平化嵌套对象
     * @param obj 嵌套对象
     * @param parentKey 父键名
     * @param result 结果对象
     * @returns 扁平化后的对象
     */
    private flattenObject;
    /**
     * 准备XML数据结构
     * @param data 解析后的数据
     * @param options 转换选项
     * @returns 准备好的数据结构
     */
    private prepareXmlData;
    /**
     * 规范化数据结构
     * @param data 输入数据
     * @param options 转换选项
     * @returns 规范化后的数据
     */
    private normalizeData;
    /**
     * 格式化单个值
     * @param value 原始值
     * @param options 转换选项
     * @returns 格式化后的值
     */
    private formatValue;
    /**
     * 格式化日期
     * @param date 日期对象
     * @param format 格式字符串
     * @returns 格式化后的日期字符串
     */
    private formatDate;
    /**
     * 简单的JSON到XML转换实现
     * @param data 输入数据
     * @param options 转换选项
     * @returns XML字符串
     */
    private simpleJsonToXml;
    /**
     * 递归构建XML字符串
     * @param data 输入数据
     * @param elementName 元素名称
     * @param lines 行数组
     * @param level 缩进级别
     * @param indent 缩进字符串
     * @param options 转换选项
     */
    private buildXmlString;
    /**
     * 转义XML特殊字符
     * @param text 输入文本
     * @returns 转义后的文本
     */
    private escapeXml;
    /**
     * 统计记录数量
     * @param data 输入数据
     * @returns 记录数量
     */
    private countRecords;
}
//# sourceMappingURL=YamlToXmlConverter.d.ts.map