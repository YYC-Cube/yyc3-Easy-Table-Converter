/**
 * @file CSV到YAML转换器
 * @description 提供CSV格式到YAML格式的转换功能
 * @module converters/formatters/CsvToYamlConverter
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-16
 * @updated 2024-10-16
 */
import { BaseConverter } from '../common/BaseConverter';
import { ConversionOptions, ConversionResult } from '../common/IConverter';
/**
 * CSV到YAML转换选项接口
 */
export interface CsvToYamlOptions extends ConversionOptions {
    /** CSV分隔符 */
    delimiter?: string;
    /** 是否将CSV转换为对象数组（默认）或嵌套对象 */
    asArray?: boolean;
    /** 当asArray为false时，使用哪个字段作为键 */
    keyField?: string;
    /** 是否将第一行作为表头 */
    hasHeader?: boolean;
    /** 自定义表头字段名 */
    headers?: string[];
    /** 是否自动检测数据类型 */
    autoDetectTypes?: boolean;
    /** 是否包含空值字段 */
    includeEmptyFields?: boolean;
    /** YAML缩进空格数 */
    indent?: number;
}
/**
 * CSV到YAML转换器类
 */
export declare class CsvToYamlConverter extends BaseConverter<CsvToYamlOptions> {
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
     * @param input 输入的CSV字符串
     * @param options 转换选项
     * @returns 转换结果对象
     */
    protected convert(input: string, options: CsvToYamlOptions): Promise<ConversionResult>;
    /**
     * 自动检测值的数据类型
     * @param value 字符串值
     * @returns 转换后的值
     */
    private autoDetectType;
    /**
     * 检查字符串是否为有效日期
     * @param dateString 日期字符串
     * @returns 是否为有效日期
     */
    private isValidDate;
    /**
     * 移除对象中的空值字段
     * @param obj 输入对象
     * @returns 移除空值后的对象
     */
    private removeEmptyFields;
    /**
     * 简单的CSV解析实现
     * @param csv CSV字符串
     * @param options 转换选项
     * @returns 解析结果
     */
    private simpleCsvParse;
    /**
     * 解析单行CSV数据
     * @param line CSV行
     * @param delimiter 分隔符
     * @returns 字段数组
     */
    private parseCsvLine;
}
//# sourceMappingURL=CsvToYamlConverter.d.ts.map