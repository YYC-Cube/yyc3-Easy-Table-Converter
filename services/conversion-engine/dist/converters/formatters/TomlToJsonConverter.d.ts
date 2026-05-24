/**
 * @file TOML到JSON转换器
 * @description 提供TOML格式到JSON/JS格式的转换功能
 * @module converters/formatters/TomlToJsonConverter
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-16
 * @updated 2024-10-16
 */
import { BaseConverter } from '../common/BaseConverter';
import { ConversionOptions, ConversionResult } from '../common/IConverter';
/**
 * TOML到JSON转换选项接口
 */
export interface TomlToJsonOptions extends ConversionOptions {
    /** 是否严格模式解析 */
    strict?: boolean;
    /** 是否保留时间戳的原始格式 */
    preserveTimestampFormat?: boolean;
    /** 是否将TOML表格（tables）转换为嵌套对象 */
    parseTablesAsObjects?: boolean;
}
/**
 * TOML到JSON转换器类
 */
export declare class TomlToJsonConverter extends BaseConverter<TomlToJsonOptions> {
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
    protected convert(input: string, options: TomlToJsonOptions): Promise<ConversionResult>;
    /**
     * 将日期对象转换为字符串格式
     * @param data 数据对象
     * @returns 转换后的数据对象
     */
    private convertDatesToStrings;
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
//# sourceMappingURL=TomlToJsonConverter.d.ts.map