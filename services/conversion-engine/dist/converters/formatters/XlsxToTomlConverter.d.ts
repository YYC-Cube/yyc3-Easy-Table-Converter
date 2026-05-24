/**
 * @file Excel到TOML转换器
 * @description 实现Excel数据到TOML格式的转换功能
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-20
 */
import { BaseConverter } from '../common/BaseConverter';
import { ConversionOptions, ConversionResult } from '../common/IConverter';
/**
 * Excel到TOML转换选项接口
 */
export interface XlsxToTomlOptions extends ConversionOptions {
    sheetName?: string;
    sheetIndex?: number;
    headerRow?: number;
    raw?: boolean;
    cellDates?: boolean;
    allSheets?: boolean;
    limitRows?: number;
    indent?: number;
    tablesAsArrays?: boolean;
}
/**
 * Excel到TOML转换器类
 */
export declare class XlsxToTomlConverter extends BaseConverter {
    constructor();
    /**
     * 执行Excel到TOML的转换
     * @param inputData Excel输入数据
     * @param inputFormat 输入格式
     * @param outputFormat 输出格式
     * @param options 转换选项
     */
    convert(inputData: Buffer | string, inputFormat: string, outputFormat: string, options?: XlsxToTomlOptions): Promise<ConversionResult>;
    /**
     * 将Excel数据转换为TOML兼容的数据结构
     * @param workbook Excel工作簿
     * @param XLSX xlsx库实例
     * @param options 转换选项
     */
    private excelToToml;
    /**
     * 将数据转换为TOML兼容的格式
     * @param data 原始数据
     */
    private convertDataForToml;
    /**
     * 格式化值以便在TOML中正确显示
     * @param value 要格式化的值
     */
    private formatValueForToml;
    /**
     * 清理TOML键名，确保符合规范
     * @param key 原始键名
     */
    private sanitizeTomlKey;
    /**
     * 手动格式化TOML内容（当库序列化失败时使用）
     * @param data TOML数据
     * @param indent 缩进空格数
     */
    private formatTomlContent;
    /**
     * 递归格式化TOML值
     */
    private formatTomlValue;
    /**
     * 格式化TOML数组
     */
    private formatArray;
    /**
     * 格式化TOML表
     */
    private formatTable;
}
//# sourceMappingURL=XlsxToTomlConverter.d.ts.map