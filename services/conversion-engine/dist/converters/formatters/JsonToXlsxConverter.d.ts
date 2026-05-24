/**
 * @file JSON到Excel(XLSX)转换器
 * @description 实现JSON数据到Excel格式的转换功能
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-20
 */
import { BaseConverter } from '../common/BaseConverter';
import { ConversionOptions, ConversionResult } from '../common/IConverter';
import * as XLSX from 'xlsx';
/**
 * JSON到Excel转换选项接口
 */
export interface JsonToXlsxOptions extends ConversionOptions {
    sheetName?: string;
    headers?: string[];
    columns?: string[];
    freezeFirstRow?: boolean;
    cellDates?: boolean;
    dateFormat?: string;
    writeOpts?: XLSX.WritingOptions;
}
/**
 * JSON到Excel(XLSX)转换器类
 */
export declare class JsonToXlsxConverter extends BaseConverter {
    constructor();
    /**
     * 执行JSON到Excel的转换
     * @param inputData JSON输入数据
     * @param inputFormat 输入格式
     * @param outputFormat 输出格式
     * @param options 转换选项
     */
    convert(inputData: Buffer | string, inputFormat: string, outputFormat: string, options?: JsonToXlsxOptions): Promise<ConversionResult>;
    /**
     * 解析JSON数据
     * @param data JSON数据
     */
    private parseJsonData;
    /**
     * 将JSON数据转换为Excel格式
     * @param jsonData JSON数据
     * @param options 转换选项
     * @param outputFormat 输出格式
     */
    private jsonToExcel;
    /**
     * 准备数据数组，确保格式正确
     * @param jsonData JSON数据
     * @param columns 列定义
     */
    private prepareDataArray;
    /**
     * 规范化日期格式
     * @param data 数据对象
     */
    private normalizeDates;
}
//# sourceMappingURL=JsonToXlsxConverter.d.ts.map