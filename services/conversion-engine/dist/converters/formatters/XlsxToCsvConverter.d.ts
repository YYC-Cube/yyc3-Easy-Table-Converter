/**
 * @file Excel到CSV转换器
 * @description 提供Excel(XLSX/XLS)格式到CSV格式的转换功能
 * @module converters/formatters/XlsxToCsvConverter
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-16
 * @updated 2024-10-16
 */
import { BaseConverter } from '../common/BaseConverter';
import { ConversionOptions, ConversionResult } from '../common/IConverter';
/**
 * Excel到CSV转换选项接口
 */
export interface XlsxToCsvOptions extends ConversionOptions {
    /** CSV分隔符 */
    delimiter?: string;
    /** 是否包含头部行 */
    includeHeader?: boolean;
    /** 工作表索引或名称（默认为第一个工作表） */
    sheetIndex?: number | string;
    /** 是否引用包含特殊字符的字段 */
    quoteFields?: boolean;
    /** 是否跳过空行 */
    skipEmptyRows?: boolean;
    /** 最大行数限制 */
    maxRows?: number;
}
/**
 * Excel到CSV转换器类
 */
export declare class XlsxToCsvConverter extends BaseConverter<XlsxToCsvOptions> {
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
     * @param input 输入的Excel文件数据（base64编码或Buffer）
     * @param options 转换选项
     * @returns 转换结果对象
     */
    protected convert(input: string, options: XlsxToCsvOptions): Promise<ConversionResult>;
    /**
     * 引用所有CSV字段
     * @param csv CSV字符串
     * @param delimiter 分隔符
     * @returns 所有字段都被引号包围的CSV字符串
     */
    private quoteAllFields;
}
//# sourceMappingURL=XlsxToCsvConverter.d.ts.map