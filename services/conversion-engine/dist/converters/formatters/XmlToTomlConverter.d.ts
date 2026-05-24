/**
 * @file XML到TOML转换器
 * @description 提供XML格式到TOML格式的转换功能
 * @module converters/formatters/XmlToTomlConverter
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-16
 * @updated 2024-10-16
 */
import { BaseConverter } from '../common/BaseConverter';
import { ConversionOptions, ConversionResult } from '../common/IConverter';
/**
 * XML到TOML转换选项接口
 */
export interface XmlToTomlOptions extends ConversionOptions {
    /** 是否将XML属性转换为对象属性 */
    attributesToProperties?: boolean;
    /** XML中要转换的主节点路径 */
    rootNodePath?: string;
    /** 是否合并文本节点 */
    mergeTextNodes?: boolean;
    /** 是否保留CDATA标记 */
    preserveCdata?: boolean;
    /** TOML缩进空格数 */
    indent?: number;
    /** 是否扁平化嵌套结构 */
    flattenNested?: boolean;
    /** 数组格式化方式 */
    arrayFormat?: 'inline' | 'multiline';
    /** 日期格式字符串 */
    dateFormat?: string;
    /** 是否保留数字类型 */
    preserveNumberTypes?: boolean;
}
/**
 * XML到TOML转换器类
 */
export declare class XmlToTomlConverter extends BaseConverter<XmlToTomlOptions> {
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
     * @param input 输入的XML字符串
     * @param options 转换选项
     * @returns 转换结果对象
     */
    protected convert(input: string, options: XmlToTomlOptions): Promise<ConversionResult>;
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
     * 检查字符串是否为有效日期
     * @param dateString 日期字符串
     * @returns 是否为有效日期
     */
    private isValidDate;
    /**
     * 扁平化嵌套对象
     * @param obj 嵌套对象
     * @param parentKey 父键名
     * @param result 结果对象
     * @returns 扁平化后的对象
     */
    private flattenObject;
    /**
     * 规范化TOML键名
     * @param key 原始键名
     * @returns 规范化后的键名
     */
    private normalizeKey;
    /**
     * 统计记录数量
     * @param data 输入数据
     * @returns 记录数量
     */
    private countRecords;
}
//# sourceMappingURL=XmlToTomlConverter.d.ts.map