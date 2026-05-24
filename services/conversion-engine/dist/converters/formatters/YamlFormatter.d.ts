/**
 * @file YAML格式化工具
 * @description 实现YAML文件的格式化、优化和标准化功能
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-20
 */
import { BaseConverter } from '../common/BaseConverter';
import { ConversionOptions, ConversionResult } from '../common/IConverter';
/**
 * YAML格式化选项接口
 */
export interface YamlFormatterOptions extends ConversionOptions {
    indent?: number;
    lineWidth?: number;
    canonical?: boolean;
    schema?: 'core' | 'default' | 'json' | 'extended' | 'fail' | 'safe';
    strict?: boolean;
    noRefs?: boolean;
    sortKeys?: boolean;
    keepComments?: boolean;
    trimTrailingSpaces?: boolean;
    normalizeNewlines?: boolean;
    validate?: boolean;
}
/**
 * YAML格式化工具类
 */
export declare class YamlFormatter extends BaseConverter {
    constructor();
    /**
     * 执行YAML格式化
     * @param inputData YAML输入数据
     * @param inputFormat 输入格式
     * @param outputFormat 输出格式
     * @param options 格式化选项
     */
    convert(inputData: Buffer | string, inputFormat: string, outputFormat: string, options?: YamlFormatterOptions): Promise<ConversionResult>;
    /**
     * 根据名称获取YAML schema
     */
    private getSchema;
    /**
     * 验证YAML结构
     */
    private isValidYamlStructure;
    /**
     * 格式化YAML数据
     */
    private formatYaml;
    /**
     * 备用的YAML格式化方法
     */
    private alternativeYamlFormat;
    /**
     * 递归格式化YAML值
     */
    private formatValue;
    /**
     * 格式化标量值
     */
    private formatScalarValue;
    /**
     * 去除行尾空格
     */
    private trimTrailingSpaces;
    /**
     * 标准化换行符
     */
    private normalizeNewlines;
    /**
     * 分析YAML结构统计信息
     */
    private analyzeYamlStructure;
}
//# sourceMappingURL=YamlFormatter.d.ts.map