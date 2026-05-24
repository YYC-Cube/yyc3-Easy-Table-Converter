/**
 * @file XML到CSV转换器
 * @description 提供XML格式到CSV格式的转换功能
 * @module converters/formatters/XmlToCsvConverter
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-16
 * @updated 2024-10-16
 */
import { BaseConverter } from '../common/BaseConverter';
import { ConversionOptions, ConversionResult } from '../common/IConverter';
/**
 * XML到CSV转换选项接口
 */
export interface XmlToCsvOptions extends ConversionOptions {
    /** CSV分隔符 */
    delimiter?: string;
    /** XML中要转换的主节点路径 */
    rootNodePath?: string;
    /** XML中表示记录的节点名称 */
    recordNodeName?: string;
    /** 是否包含头部行 */
    includeHeader?: boolean;
    /** 是否跳过空值字段 */
    skipEmptyFields?: boolean;
    /** 是否扁平化嵌套的XML结构 */
    flattenNested?: boolean;
}
/**
 * XML到CSV转换器类
 */
export declare class XmlToCsvConverter extends BaseConverter<XmlToCsvOptions> {
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
    protected convert(input: string, options: XmlToCsvOptions): Promise<ConversionResult>;
    /**
     * 从解析后的XML数据中提取记录
     * @param data 解析后的XML数据
     * @param options 转换选项
     * @returns 记录数组
     */
    private extractRecords;
    /**
     * 规范化记录格式
     * @param record 原始记录
     * @returns 规范化后的记录
     */
    private normalizeRecord;
    /**
     * 规范化单个值
     * @param value 原始值
     * @returns 规范化后的值
     */
    private normalizeValue;
    /**
     * 扁平化嵌套对象
     * @param obj 嵌套对象
     * @param parentKey 父键名
     * @param result 结果对象
     * @returns 扁平化后的对象
     */
    private flattenObject;
    /**
     * 从记录数组中提取所有字段名
     * @param records 记录数组
     * @returns 字段名数组
     */
    private extractFields;
    /**
     * 简单的JSON到CSV转换实现
     * @param data JSON数据数组
     * @param options 转换选项
     * @returns CSV字符串
     */
    private simpleJsonToCsv;
    /**
     * 为CSV字段添加引号
     * @param field 字段值
     * @param delimiter 分隔符
     * @returns 加引号后的字段值
     */
    private quoteField;
}
//# sourceMappingURL=XmlToCsvConverter.d.ts.map