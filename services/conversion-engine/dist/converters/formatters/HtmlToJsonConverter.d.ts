/**
 * @file HTML到JSON转换器
 * @description 实现HTML文档到JSON数据结构的转换功能
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-20
 */
import { BaseConverter } from '../common/BaseConverter';
import { ConversionOptions, ConversionResult } from '../common/IConverter';
/**
 * HTML到JSON转换选项接口
 */
export interface HtmlToJsonOptions extends ConversionOptions {
    includeAttributes?: boolean;
    includeTextNodes?: boolean;
    includeComments?: boolean;
    includeDoctype?: boolean;
    includeHead?: boolean;
    includeHtml?: boolean;
    normalizeWhitespace?: boolean;
    textNodeKey?: string;
    attributePrefix?: string;
    rootNodeName?: string;
    ignoreEmptyElements?: boolean;
    ignoreAttributes?: string[];
    ignoreTags?: string[];
    onlyTags?: string[];
    prettyPrint?: boolean;
    maxDepth?: number;
    extractTables?: boolean;
    extractForms?: boolean;
    extractLinks?: boolean;
    extractImages?: boolean;
}
/**
 * HTML到JSON转换器类
 */
export declare class HtmlToJsonConverter extends BaseConverter {
    constructor();
    /**
     * 执行HTML到JSON的转换
     * @param inputData HTML输入数据
     * @param inputFormat 输入格式
     * @param outputFormat 输出格式
     * @param options 转换选项
     */
    convert(inputData: Buffer | string, inputFormat: string, outputFormat: string, options?: HtmlToJsonOptions): Promise<ConversionResult>;
    /**
     * 预处理HTML内容
     */
    private preprocessHtml;
    /**
     * HTML转JSON的核心方法
     */
    private htmlToJson;
    /**
     * 使用正则表达式解析HTML
     */
    private parseHtmlWithRegex;
    /**
     * 解析HTML属性
     */
    private parseAttributes;
    /**
     * 检查是否应该忽略属性
     */
    private shouldIgnoreAttribute;
    /**
     * 备用的HTML解析方法
     */
    private alternativeHtmlParse;
    /**
     * 计算HTML到JSON转换的统计信息
     */
    private calculateHtmlToJsonStatistics;
    /**
     * 递归计算JSON对象和数组数量
     */
    private countJsonObjects;
}
//# sourceMappingURL=HtmlToJsonConverter.d.ts.map