/**
 * @file YAML到JSON转换器
 * @description 提供YAML格式到JSON/JS格式的转换功能
 * @module converters/formatters/YamlToJsonConverter
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-16
 * @updated 2024-10-16
 */
import { BaseConverter } from '../common/BaseConverter';
import { ConversionOptions, ConversionResult } from '../common/IConverter';
/**
 * YAML到JSON转换选项接口
 */
export interface YamlToJsonOptions extends ConversionOptions {
    /** 是否严格模式解析，启用后对于不规范的YAML会抛出错误 */
    strictMode?: boolean;
    /** 是否保留空值字段 */
    preserveNulls?: boolean;
    /** 是否尝试将字符串转换为数字、布尔值等基本类型 */
    convertScalars?: boolean;
}
/**
 * YAML到JSON转换器类
 */
export declare class YamlToJsonConverter extends BaseConverter {
    constructor();
    /**
     * 执行实际的转换操作
     * @param inputData 输入的YAML字符串或Buffer
     * @param inputFormat 输入格式
     * @param outputFormat 输出格式
     * @param options 转换选项
     * @returns 转换结果对象
     */
    convert(inputData: Buffer | string, inputFormat: string, outputFormat: string, options?: ConversionOptions): Promise<ConversionResult>;
    /**
     * 计算记录数量
     * @param data 解析后的数据
     * @returns 记录数量
     */
    private countRecords;
}
//# sourceMappingURL=YamlToJsonConverter.d.ts.map