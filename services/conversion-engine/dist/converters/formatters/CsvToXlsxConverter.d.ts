/**
 * @file CSV到Excel转换器
 * @description 提供CSV格式到Excel(XLSX)格式的转换功能
 * @module converters/formatters/CsvToXlsxConverter
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-16
 * @updated 2024-10-16
 */
import { BaseConverter } from '../common/BaseConverter';
import { ConversionOptions, ConversionResult } from '../common/IConverter';
/**
 * CSV到Excel转换选项接口
 */
export interface CsvToXlsxOptions extends ConversionOptions {
    /** CSV分隔符 */
    delimiter?: string;
    /** 是否包含头部行 */
    hasHeader?: boolean;
    /** 工作表名称 */
    sheetName?: string;
    /** 是否尝试自动检测数据类型 */
    autoDetectTypes?: boolean;
    /** 是否冻结首行 */
    freezeFirstRow?: boolean;
    /** 最大行数限制 */
    maxRows?: number;
}
/**
 * CSV到Excel转换器类
 */
export declare class CsvToXlsxConverter extends BaseConverter<CsvToXlsxOptions> {
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
    protected convert(input: string, options: CsvToXlsxOptions): Promise<ConversionResult>;
    /**
     * 简单的CSV解析实现（当papaparse不可用时的备选方案）
     * @param csv CSV字符串
     * @param options 解析选项
     * @returns 解析后的二维数组
     */
    private simpleCsvParse;
}
//# sourceMappingURL=CsvToXlsxConverter.d.ts.map