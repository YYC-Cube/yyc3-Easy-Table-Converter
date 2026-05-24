/**
 * @file JSON到TOML转换器
 * @description 提供JSON格式到TOML格式的转换功能
 * @module converters/formatters/JsonToTomlConverter
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-16
 * @updated 2024-10-16
 */
import { BaseConverter } from '../common/BaseConverter';
import { ConversionOptions, ConversionResult } from '../common/IConverter';
/**
 * JSON到TOML转换选项接口
 */
export interface JsonToTomlOptions extends ConversionOptions {
    /** TOML格式化缩进空格数 */
    indent?: number;
    /** 是否保留原始的数字类型 */
    preserveNumberTypes?: boolean;
    /** 是否自动处理数组格式 */
    formatArrays?: boolean;
    /** 是否尝试将ISO日期字符串转换为TOML时间戳 */
    parseDates?: boolean;
}
/**
 * JSON到TOML转换器类
 */
export declare class JsonToTomlConverter extends BaseConverter<JsonToTomlOptions> {
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
     * @param input 输入的JSON字符串
     * @param options 转换选项
     * @returns 转换结果对象
     */
    protected convert(input: string, options: JsonToTomlOptions): Promise<ConversionResult>;
    /**
     * 将ISO日期字符串转换为Date对象
     * @param data 数据对象
     * @returns 转换后的数据对象
     */
    private convertIsoStringsToDates;
    /**
     * 计算记录数量
     * @param data 解析后的数据
     * @returns 记录数量
     */
    private countRecords;
    /**
     * 计算TOML表格数量
     * @param data 解析后的数据
     * @returns 表格数量
     */
    private countTables;
}
//# sourceMappingURL=JsonToTomlConverter.d.ts.map