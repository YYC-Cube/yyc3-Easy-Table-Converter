/**
 * @file JSON到Excel模板转换器
 * @description 将JSON数据根据模板转换为格式化的Excel文件
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-20
 */
import { BaseConverter } from '../common/BaseConverter';
import { ConversionOptions, ConversionResult } from '../common/IConverter';
/**
 * 单元格格式配置
 */
export interface CellFormat {
    numberFormat?: string;
    dateFormat?: string;
    alignment?: 'left' | 'center' | 'right' | 'justify';
    fontBold?: boolean;
    fontItalic?: boolean;
    fontUnderline?: boolean;
    fontSize?: number;
    fontColor?: string;
    border?: boolean;
    borderColor?: string;
    backgroundColor?: string;
}
/**
 * 列配置
 */
export interface ColumnConfig {
    key: string;
    header: string;
    width?: number;
    format?: CellFormat;
    formula?: string;
    hidden?: boolean;
    dataValidation?: {
        type: 'list' | 'number' | 'date' | 'time' | 'textLength';
        operator?: 'between' | 'notBetween' | 'equal' | 'notEqual' | 'greaterThan' | 'lessThan' | 'greaterThanOrEqual' | 'lessThanOrEqual';
        value1?: any;
        value2?: any;
        showDropDown?: boolean;
    };
}
/**
 * Excel模板配置
 */
export interface ExcelTemplateConfig {
    sheetName?: string;
    sheets?: Array<{
        name: string;
        columns: ColumnConfig[];
        startRow?: number;
        startColumn?: number;
    }>;
    columns: ColumnConfig[];
    title?: {
        text: string;
        row?: number;
        column?: number;
        spanColumns?: number;
        format?: CellFormat;
    };
    headerFooter?: {
        oddHeader?: string;
        oddFooter?: string;
        evenHeader?: string;
        evenFooter?: string;
    };
    defaultFormat?: CellFormat;
    headerFormat?: CellFormat;
    dataFormat?: CellFormat;
    freezePane?: {
        rowSplit?: number;
        colSplit?: number;
        topRow?: number;
        leftCol?: number;
    };
    printOptions?: {
        horizontalCentered?: boolean;
        verticalCentered?: boolean;
        scale?: number;
        fitToPage?: boolean;
    };
    groupBy?: string;
    sortBy?: Array<{
        key: string;
        order: 'asc' | 'desc';
    }>;
}
/**
 * JSON到Excel模板转换选项接口
 */
export interface JsonToExcelTemplateConverterOptions extends ConversionOptions {
    template?: ExcelTemplateConfig;
    flattenData?: boolean;
    expandNestedObjects?: boolean;
    expandArrays?: boolean;
    autoFitColumns?: boolean;
    wrapText?: boolean;
    useSharedStrings?: boolean;
    optimizeForExcel?: boolean;
    strictMode?: boolean;
    suppressErrors?: boolean;
    includeMetadata?: boolean;
    metadataSheetName?: string;
}
/**
 * JSON到Excel模板转换器类
 */
export declare class JsonToExcelTemplateConverter extends BaseConverter {
    constructor();
    /**
     * 执行JSON到Excel模板的转换
     * @param inputData JSON输入数据
     * @param inputFormat 输入格式
     * @param outputFormat 输出格式
     * @param options 转换选项
     */
    convert(inputData: Buffer | string, inputFormat: string, outputFormat: string, options?: JsonToExcelTemplateConverterOptions): Promise<ConversionResult>;
    /**
     * 将JSON数据转换为Excel模板
     * @param inputData JSON输入数据
     * @param options 转换选项
     * @param outputFormat 输出格式
     */
    private jsonToExcelTemplate;
    /**
     * 解析JSON数据
     */
    private parseJsonData;
    /**
     * 修复简单的JSON错误
     */
    private fixJsonString;
    /**
     * 处理JSON数据
     */
    private processJsonData;
    /**
     * 扁平化对象
     */
    private flattenObject;
    /**
     * 展开对象
     */
    private expandObject;
    /**
     * 应用排序
     */
    private applySorting;
    /**
     * 生成Excel文件（简化实现）
     */
    private generateExcelFile;
    /**
     * 创建默认模板
     */
    private createDefaultTemplate;
    /**
     * 计算统计信息
     */
    private calculateStatistics;
}
//# sourceMappingURL=JsonToExcelTemplateConverter.d.ts.map