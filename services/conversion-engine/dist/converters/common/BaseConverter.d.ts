/**
 * @file 转换器基类
 * @description 提供所有转换器共用的基础功能实现
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-20
 */
import { IConverter, ConversionOptions, ConversionResult } from './IConverter';
/**
 * 转换器基类
 */
export declare abstract class BaseConverter implements IConverter {
    protected readonly name: string;
    protected readonly description: string;
    protected readonly version: string;
    protected readonly supportedInputFormats: string[];
    protected readonly supportedOutputFormats: string[];
    constructor(name: string, description: string, supportedInputFormats: string[], supportedOutputFormats: string[]);
    /**
     * 获取支持的输入格式
     */
    getSupportedInputFormats(): string[];
    /**
     * 获取支持的输出格式
     */
    getSupportedOutputFormats(): string[];
    /**
     * 检查是否支持指定的转换
     * @param inputFormat 输入格式
     * @param outputFormat 输出格式
     */
    canConvert(inputFormat: string, outputFormat: string): boolean;
    /**
     * 执行转换（抽象方法，由子类实现）
     */
    abstract convert(inputData: Buffer | string, inputFormat: string, outputFormat: string, options?: ConversionOptions): Promise<ConversionResult>;
    /**
     * 获取转换器信息
     */
    getConverterInfo(): {
        name: string;
        description: string;
        supportedConversions: string[];
        version: string;
    };
    /**
     * 标准化格式名称
     * @param format 格式名称
     */
    protected normalizeFormat(format: string): string;
    /**
     * 生成支持的转换列表
     */
    protected generateSupportedConversions(): string[];
    /**
     * 创建成功的转换结果
     * @param data 转换后的数据
     * @param format 输出格式
     * @param inputFormat 输入格式
     * @param metadata 元数据
     */
    protected createSuccessResult(data: Buffer | string, format: string, inputFormat: string, metadata?: Record<string, any>): ConversionResult;
    /**
     * 创建失败的转换结果
     * @param error 错误信息
     */
    protected createErrorResult(error: string): ConversionResult;
    /**
     * 验证输入数据
     * @param inputData 输入数据
     */
    protected validateInputData(inputData: Buffer | string): boolean;
    /**
     * 测量转换性能
     * @param func 要测量的函数
     */
    protected measurePerformance<T>(func: () => Promise<T>): Promise<{
        result: T;
        duration: number;
    }>;
}
//# sourceMappingURL=BaseConverter.d.ts.map