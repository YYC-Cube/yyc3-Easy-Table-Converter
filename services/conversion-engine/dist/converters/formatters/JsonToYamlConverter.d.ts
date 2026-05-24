/**
 * @file JSON到YAML转换器
 * @description 提供JSON格式到YAML格式的转换功能
 * @module converters/formatters/JsonToYamlConverter
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-16
 * @updated 2024-10-16
 */
import { BaseConverter } from '../common/BaseConverter';
import { ConversionOptions, ConversionResult } from '../common/IConverter';
/**
 * JSON到YAML转换选项接口
 */
export interface JsonToYamlOptions extends ConversionOptions {
    /** YAML缩进空格数 */
    indent?: number;
    /** 是否使用单引号 */
    singleQuote?: boolean;
    /** 是否保留JSON字符串中的注释 */
    preserveComments?: boolean;
    /** 是否启用流式输出（适用于大型文件） */
    streaming?: boolean;
}
/**
 * JSON到YAML转换器类
 */
export declare class JsonToYamlConverter extends BaseConverter<JsonToYamlOptions> {
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
    protected convert(input: string, options: JsonToYamlOptions): Promise<ConversionResult>;
    /**
     * 计算记录数量
     * @param data 解析后的数据
     * @returns 记录数量
     */
    private countRecords;
}
//# sourceMappingURL=JsonToYamlConverter.d.ts.map