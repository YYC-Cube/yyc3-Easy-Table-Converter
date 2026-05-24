/**
 * @file 数据转换器通用接口
 * @description 定义所有数据格式转换器必须实现的接口
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-20
 */
/**
 * 转换选项接口
 */
export interface ConversionOptions {
    [key: string]: any;
}
/**
 * 转换结果接口
 */
export interface ConversionResult {
    success: boolean;
    data: Buffer | string;
    format: string;
    metadata?: {
        originalFormat: string;
        convertedFormat: string;
        size?: number;
        rows?: number;
        columns?: number;
        processingTime?: number;
    };
    error?: string;
}
/**
 * 数据格式转换器接口
 */
export interface IConverter {
    /**
     * 支持的输入格式
     */
    getSupportedInputFormats(): string[];
    /**
     * 支持的输出格式
     */
    getSupportedOutputFormats(): string[];
    /**
     * 检查是否支持指定的转换
     * @param inputFormat 输入格式
     * @param outputFormat 输出格式
     */
    canConvert(inputFormat: string, outputFormat: string): boolean;
    /**
     * 执行转换
     * @param inputData 输入数据
     * @param inputFormat 输入格式
     * @param outputFormat 输出格式
     * @param options 转换选项
     */
    convert(inputData: Buffer | string, inputFormat: string, outputFormat: string, options?: ConversionOptions): Promise<ConversionResult>;
    /**
     * 获取转换器信息
     */
    getConverterInfo(): {
        name: string;
        description: string;
        supportedConversions: string[];
        version: string;
    };
}
//# sourceMappingURL=IConverter.d.ts.map