/**
 * @file TOML到XML转换器
 * @description 提供TOML格式到XML格式的转换功能
 * @module converters/formatters/TomlToXmlConverter
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-16
 * @updated 2024-10-16
 */
import { BaseConverter } from '../common/BaseConverter';
import { ConversionOptions, ConversionResult } from '../common/IConverter';
/**
 * TOML到XML转换选项接口
 */
export interface TomlToXmlOptions extends ConversionOptions {
    /** XML根元素名称 */
    rootElement?: string;
    /** 是否包含XML声明 */
    includeDeclaration?: boolean;
    /** 记录元素名称（用于数组项） */
    recordElement?: string;
    /** 是否将对象属性转换为XML属性 */
    propertiesToAttributes?: boolean;
    /** 是否将值包装在CDATA中 */
    wrapCdata?: boolean;
    /** XML缩进空格数 */
    indent?: number;
    /** 日期格式字符串 */
    dateFormat?: string;
    /** 是否使用ISO 8601格式的日期 */
    useIsoDate?: boolean;
    /** 是否处理嵌套表 */
    processNestedTables?: boolean;
}
/**
 * TOML到XML转换器类
 */
export declare class TomlToXmlConverter extends BaseConverter<TomlToXmlOptions> {
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
     * @param input 输入的TOML字符串
     * @param options 转换选项
     * @returns 转换结果对象
     */
    protected convert(input: string, options: TomlToXmlOptions): Promise<ConversionResult>;
    /**
     * 规范化数据结构
     * @param data 输入数据
     * @param options 转换选项
     * @returns 规范化后的数据
     */
    private normalizeData;
    /**
     * 创建记录元素
     * @param elementName 元素名称
     * @param value 元素值
     * @param options 转换选项
     * @returns 记录元素对象
     */
    private createRecordElement;
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
     * 规范化XML元素名称
     * @param name 原始名称
     * @returns 规范化后的元素名称
     */
    private normalizeElementName;
    /**
     * 将文本内容包装在CDATA中
     * @param xml XML字符串
     * @returns 处理后的XML字符串
     */
    private wrapTextInCdata;
    /**
     * 统计记录数量
     * @param data 输入数据
     * @returns 记录数量
     */
    private countRecords;
}
//# sourceMappingURL=TomlToXmlConverter.d.ts.map