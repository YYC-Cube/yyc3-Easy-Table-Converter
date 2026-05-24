/**
 * @file YAML到CSV转换器
 * @description 提供YAML格式到CSV格式的转换功能
 * @module converters/formatters/YamlToCsvConverter
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-16
 * @updated 2024-10-16
 */
import { BaseConverter } from '../common/BaseConverter';
import { ConversionOptions, ConversionResult } from '../common/IConverter';
/**
 * YAML到CSV转换选项接口
 */
export interface YamlToCsvOptions extends ConversionOptions {
    /** CSV分隔符 */
    delimiter?: string;
    /** YAML中表示数组的键路径 */
    arrayPath?: string;
    /** 是否将嵌套对象扁平化 */
    flattenNested?: boolean;
    /** 是否包含头部行 */
    includeHeader?: boolean;
    /** 是否跳过空值字段 */
    skipEmptyFields?: boolean;
    /** 自定义表头字段名 */
    headers?: string[];
    /** 是否自动检测数据类型 */
    autoDetectTypes?: boolean;
    /** 日期格式字符串 */
    dateFormat?: string;
}
/**
 * YAML到CSV转换器类
 */
export declare class YamlToCsvConverter extends BaseConverter<YamlToCsvOptions> {
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
    protected convert(input: string, options: YamlToCsvOptions): Promise<ConversionResult>;
    /**
     * 导航到对象中的指定路径
     * @param obj 目标对象
     * @param path 路径字符串，使用点分隔
     * @returns 路径对应的对象值
     */
    private navigateToPath;
    /**
     * 查找对象中的第一个数组
     * @param obj 目标对象
     * @returns 找到的数组或空数组
     */
    private findFirstArray;
    /**
     * 扁平化嵌套对象
     * @param obj 嵌套对象
     * @param parentKey 父键名
     * @param result 结果对象
     * @returns 扁平化后的对象
     */
    private flattenObject;
    /**
     * 规范化记录，处理特殊类型
     * @param record 原始记录
     * @param options 转换选项
     * @returns 规范化后的记录
     */
    private normalizeRecord;
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
     * 从记录数组中提取所有字段名
     * @param records 记录数组
     * @returns 字段名数组
     */
    private extractFields;
    /**
     * 简单的JSON到CSV转换实现
     * @param data JSON数据数组
     * @param fields 字段名数组
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
//# sourceMappingURL=YamlToCsvConverter.d.ts.map