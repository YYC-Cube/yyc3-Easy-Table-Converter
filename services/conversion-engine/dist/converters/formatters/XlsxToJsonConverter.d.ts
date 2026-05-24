/**
 * @file Excel(XLSX)到JSON转换器
 * @description 实现Excel数据到JSON格式的转换功能
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-20
 */
import { BaseConverter } from '../common/BaseConverter';
import { ConversionOptions, ConversionResult } from '../common/IConverter';
/**
 * Excel到JSON转换选项接口
 */
export interface XlsxToJsonOptions extends ConversionOptions {
    sheetName?: string;
    sheetIndex?: number;
    headerRow?: number;
    range?: string;
    raw?: boolean;
    cellDates?: boolean;
    allSheets?: boolean;
    limitRows?: number;
}
/**
 * Excel(XLSX)到JSON转换器类
 */
export declare class XlsxToJsonConverter extends BaseConverter {
    constructor();
    /**
     * 执行Excel到JSON的转换
     * @param inputData Excel输入数据
     * @param inputFormat 输入格式
     * @param outputFormat 输出格式
     * @param options 转换选项
     */
    convert(inputData: Buffer | string, inputFormat: string, outputFormat: string, options?: XlsxToJsonOptions): Promise<ConversionResult>;
    /**
     * 读取Excel工作簿
     * @param data Excel数据
     */
    private readWorkbook;
    /**
     * 将Excel数据转换为JSON
     * @param workbook Excel工作簿
     * @param options 转换选项
     */
    private excelToJson;
    /**
     * 获取Excel工作簿信息
     * @param workbook Excel工作簿
     */
    private getWorkbookInfo;
    /**
     * 清理Excel数据中的特殊字符
     * @param data 数据对象
     */
    private cleanData;
}
//# sourceMappingURL=XlsxToJsonConverter.d.ts.map