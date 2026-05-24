/**
 * @file TOML到Excel转换器
 * @description 实现TOML数据到Excel格式的转换功能
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-20
 */
import { BaseConverter } from '../common/BaseConverter';
import { ConversionOptions, ConversionResult } from '../common/IConverter';
/**
 * TOML到Excel转换选项接口
 */
export interface TomlToXlsxOptions extends ConversionOptions {
    sheetName?: string;
    headerStyle?: {
        [key: string]: any;
    };
    cellStyle?: {
        [key: string]: any;
    };
    autoFitColumns?: boolean;
    flattenTables?: boolean;
    formatCells?: boolean;
    includeBOM?: boolean;
    outputType?: 'xlsx' | 'xls' | 'xlsm' | 'xlsb';
    tableNameKey?: string;
    arrayHandling?: 'separateSheet' | 'inline' | 'singleColumn';
}
/**
 * TOML到Excel转换器类
 */
export declare class TomlToXlsxConverter extends BaseConverter {
    constructor();
    /**
     * 执行TOML到Excel的转换
     * @param inputData TOML输入数据
     * @param inputFormat 输入格式
     * @param outputFormat 输出格式
     * @param options 转换选项
     */
    convert(inputData: Buffer | string, inputFormat: string, outputFormat: string, options?: TomlToXlsxOptions): Promise<ConversionResult>;
    /**
     * 将TOML数据转换为Excel工作簿
     * @param tomlData TOML数据
     * @param XLSX xlsx库实例
     * @param options 转换选项
     */
    private tomlToExcel;
    /**
     * 递归处理TOML表结构
     */
    private processTomlTables;
    /**
     * 处理TOML数组
     */
    private processTomlArray;
    /**
     * 扁平化TOML数据
     */
    private flattenTomlData;
    /**
     * 递归扁平化数据
     */
    private recursiveFlatten;
    /**
     * 自动调整Excel列宽
     */
    private autoFitColumns;
    /**
     * 格式化对象以便在Excel中正确显示
     */
    private formatObjectForExcel;
    /**
     * 格式化值以便在Excel中正确显示
     */
    private formatValueForExcel;
    /**
     * 检查数组是否包含对象
     */
    private isObjectArray;
    /**
     * 检查是否是表格数组格式
     */
    private isTableArray;
    /**
     * 转换表格数组格式
     */
    private convertTableArray;
    /**
     * 提取简单值
     */
    private extractSimpleValues;
    /**
     * 截断工作表名称（Excel限制为31个字符）
     */
    private truncateSheetName;
    /**
     * 解码Excel单元格范围
     */
    private decodeRange;
    /**
     * 解码Excel单元格地址
     */
    private decodeCellAddress;
    /**
     * 编码Excel单元格坐标
     */
    private encodeCell;
}
//# sourceMappingURL=TomlToXlsxConverter.d.ts.map