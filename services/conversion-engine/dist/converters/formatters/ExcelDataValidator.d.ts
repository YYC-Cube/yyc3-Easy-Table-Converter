/**
 * @file Excel数据验证工具
 * @description 对Excel文件数据进行验证、清理和修复
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-20
 */
import { BaseConverter } from '../common/BaseConverter';
import { ConversionOptions, ConversionResult } from '../common/IConverter';
/**
 * 数据验证规则接口
 */
export interface ValidationRule {
    type: 'required' | 'number' | 'string' | 'date' | 'boolean' | 'regex' | 'custom';
    column: string | number;
    errorMessage?: string;
    skipEmptyCells?: boolean;
    minValue?: number;
    maxValue?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    dateFormat?: string;
    beforeDate?: Date | string;
    afterDate?: Date | string;
    allowedValues?: any[];
    customValidator?: (value: any, row: any) => boolean;
}
/**
 * 数据清理规则接口
 */
export interface CleaningRule {
    column: string | number;
    operation: 'trim' | 'toUpperCase' | 'toLowerCase' | 'replace' | 'pad' | 'dateFormat' | 'custom';
    searchValue?: string | RegExp;
    replaceValue?: string;
    padType?: 'start' | 'end';
    padChar?: string;
    targetLength?: number;
    format?: string;
    customCleaner?: (value: any) => any;
}
/**
 * 数据修复规则接口
 */
export interface RepairRule {
    column: string | number;
    condition: 'isNull' | 'isEmpty' | 'isError' | 'custom';
    action: 'setDefault' | 'fillFromColumn' | 'fillWithPrevious' | 'fillWithNext' | 'custom';
    defaultValue?: any;
    sourceColumn?: string | number;
    customCondition?: (value: any, row: any) => boolean;
    customAction?: (value: any, row: any) => any;
}
/**
 * 验证错误接口
 */
export interface ValidationError {
    row: number;
    column: string | number;
    value: any;
    rule: ValidationRule;
    message: string;
}
/**
 * Excel数据验证选项接口
 */
export interface ExcelDataValidatorOptions extends ConversionOptions {
    validationRules?: ValidationRule[];
    stopOnFirstError?: boolean;
    errorThreshold?: number;
    cleaningRules?: CleaningRule[];
    applyCleaning?: boolean;
    repairRules?: RepairRule[];
    applyRepair?: boolean;
    createRepairReport?: boolean;
    sheetIndex?: number;
    sheetName?: string;
    headerRow?: number;
    dataStartRow?: number;
    outputFormat?: 'original' | 'cleaned' | 'report';
    generateStatistics?: boolean;
    failOnValidationErrors?: boolean;
    strictMode?: boolean;
}
/**
 * Excel数据验证工具类
 */
export declare class ExcelDataValidator extends BaseConverter {
    constructor();
    /**
     * 执行Excel数据验证
     * @param inputData Excel输入数据
     * @param inputFormat 输入格式
     * @param outputFormat 输出格式
     * @param options 验证选项
     */
    convert(inputData: Buffer | string, inputFormat: string, outputFormat: string, options?: ExcelDataValidatorOptions): Promise<ConversionResult>;
    /**
     * 验证Excel数据
     * @param inputData Excel输入数据
     * @param options 验证选项
     * @param outputFormat 输出格式
     */
    private validateExcelData;
    /**
     * 解析Excel数据（简化版）
     */
    private parseExcelData;
    /**
     * 执行数据验证
     */
    private performValidation;
    /**
     * 验证单个值
     */
    private validateValue;
    /**
     * 获取默认错误消息
     */
    private getDefaultErrorMessage;
    /**
     * 应用数据清理
     */
    private applyCleaning;
    /**
     * 应用数据修复
     */
    private applyRepair;
    /**
     * 生成CSV输出
     */
    private generateCsvOutput;
    /**
     * 生成验证报告
     */
    private generateValidationReport;
    /**
     * 计算统计信息
     */
    private calculateStatistics;
}
//# sourceMappingURL=ExcelDataValidator.d.ts.map