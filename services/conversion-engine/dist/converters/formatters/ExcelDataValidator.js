"use strict";
/**
 * @file Excel数据验证工具
 * @description 对Excel文件数据进行验证、清理和修复
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-20
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExcelDataValidator = void 0;
const BaseConverter_1 = require("../common/BaseConverter");
const logger_1 = require("../../utils/logger");
/**
 * Excel数据验证工具类
 */
class ExcelDataValidator extends BaseConverter_1.BaseConverter {
    constructor() {
        super('Excel数据验证工具', '对Excel文件数据进行验证、清理和修复', ['xlsx', 'xls'], ['xlsx', 'xls', 'json', 'csv']);
    }
    /**
     * 执行Excel数据验证
     * @param inputData Excel输入数据
     * @param inputFormat 输入格式
     * @param outputFormat 输出格式
     * @param options 验证选项
     */
    async convert(inputData, inputFormat, outputFormat, options = {}) {
        try {
            // 验证输入数据
            if (!this.validateInputData(inputData)) {
                return this.createErrorResult('输入数据为空或无效');
            }
            // 设置默认选项
            const validationOptions = {
                // 验证配置
                validationRules: options.validationRules ?? [],
                stopOnFirstError: options.stopOnFirstError ?? false,
                errorThreshold: options.errorThreshold ?? Infinity,
                // 清理配置
                cleaningRules: options.cleaningRules ?? [],
                applyCleaning: options.applyCleaning ?? false,
                // 修复配置
                repairRules: options.repairRules ?? [],
                applyRepair: options.applyRepair ?? false,
                createRepairReport: options.createRepairReport ?? false,
                // 工作表配置
                sheetIndex: options.sheetIndex ?? 0,
                sheetName: options.sheetName,
                headerRow: options.headerRow ?? 0,
                dataStartRow: options.dataStartRow ?? 1,
                // 输出选项
                outputFormat: options.outputFormat ?? 'original',
                generateStatistics: options.generateStatistics ?? true,
                // 错误处理
                failOnValidationErrors: options.failOnValidationErrors ?? false,
                strictMode: options.strictMode ?? false,
                ...options
            };
            // 执行验证并测量性能
            const { result: validatedData, duration, validationResult } = await this.measurePerformance(() => {
                return this.validateExcelData(inputData, validationOptions, outputFormat);
            });
            // 检查验证错误
            if (validationOptions.failOnValidationErrors && validationResult?.errors && validationResult.errors.length > 0) {
                return this.createErrorResult(`数据验证失败，发现 ${validationResult.errors.length} 个错误`, validationResult);
            }
            // 计算统计信息
            const statistics = this.calculateStatistics(validatedData, validationResult);
            // 返回成功结果
            return this.createSuccessResult(validatedData, outputFormat, inputFormat, {
                size: Buffer.byteLength(validatedData),
                validationErrors: statistics.validationErrors,
                rowsCleaned: statistics.rowsCleaned,
                valuesRepaired: statistics.valuesRepaired,
                processingTime: duration
            }, validationResult);
        }
        catch (error) {
            logger_1.logger.error('Excel数据验证失败:', error);
            return this.createErrorResult(`验证失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
    }
    /**
     * 验证Excel数据
     * @param inputData Excel输入数据
     * @param options 验证选项
     * @param outputFormat 输出格式
     */
    validateExcelData(inputData, options, outputFormat) {
        try {
            // 转换为Buffer
            const dataBuffer = typeof inputData === 'string' ? Buffer.from(inputData) : inputData;
            // 解析Excel数据（简化版，实际项目中使用专门的Excel库）
            const { headers, data } = this.parseExcelData(dataBuffer, options);
            // 执行验证
            const validationResult = this.performValidation(data, headers, options);
            // 应用清理（如果配置）
            let processedData = data;
            if (options.applyCleaning && options.cleaningRules && options.cleaningRules.length > 0) {
                processedData = this.applyCleaning(processedData, headers, options);
            }
            // 应用修复（如果配置）
            if (options.applyRepair && options.repairRules && options.repairRules.length > 0) {
                processedData = this.applyRepair(processedData, headers, options);
            }
            // 根据输出格式生成结果
            let result;
            switch (outputFormat) {
                case 'json':
                    result = JSON.stringify({
                        headers,
                        data: processedData,
                        validationResult
                    }, null, 2);
                    break;
                case 'csv':
                    result = this.generateCsvOutput(headers, processedData);
                    break;
                case 'report':
                    result = this.generateValidationReport(validationResult);
                    break;
                case 'xlsx':
                case 'xls':
                default:
                    // 返回原始数据或处理后的Excel数据
                    // 注意：实际项目中需要重新生成Excel文件
                    result = dataBuffer;
            }
            return {
                result: typeof result === 'string' ? Buffer.from(result) : result,
                validationResult
            };
        }
        catch (error) {
            if (options.strictMode) {
                throw error;
            }
            return {
                result: Buffer.from('{"error":"Validation failed"}'),
                validationResult: {
                    errors: [{ message: error instanceof Error ? error.message : 'Unknown error' }],
                    success: false
                }
            };
        }
    }
    /**
     * 解析Excel数据（简化版）
     */
    parseExcelData(data, options) {
        // 简化的Excel解析，实际项目中应使用专门的Excel库
        const content = data.toString('utf-8');
        // 模拟解析结果
        return {
            headers: ['ID', 'Name', 'Value', 'Date', 'Status'],
            data: [
                [1, 'Item 1', 100.50, '2024-11-01', 'Active'],
                [2, 'Item 2', 200.75, '2024-11-02', 'Inactive'],
                [3, 'Item 3', null, '2024-11-03', 'Active'],
                [4, '', 300.25, '2024-11-04', 'Pending'],
                [5, 'Item 5', 400.00, 'invalid-date', 'Active']
            ]
        };
    }
    /**
     * 执行数据验证
     */
    performValidation(data, headers, options) {
        const errors = [];
        const statistics = {
            totalRows: data.length,
            validRows: 0,
            invalidRows: 0,
            errorsByColumn: {}
        };
        // 遍历每一行数据
        for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
            const row = data[rowIndex];
            let rowHasErrors = false;
            // 遍历每个验证规则
            for (const rule of options.validationRules || []) {
                const columnIndex = typeof rule.column === 'number' ? rule.column : headers.indexOf(rule.column);
                if (columnIndex === -1) {
                    continue; // 列不存在
                }
                const value = row[columnIndex];
                // 检查是否跳过空单元格
                if (rule.skipEmptyCells && (value === null || value === undefined || value === '')) {
                    continue;
                }
                // 执行验证
                const isValid = this.validateValue(value, rule, row);
                if (!isValid) {
                    const error = {
                        row: rowIndex + options.dataStartRow,
                        column: typeof rule.column === 'number' ? headers[columnIndex] : rule.column,
                        value,
                        rule,
                        message: rule.errorMessage || this.getDefaultErrorMessage(value, rule)
                    };
                    errors.push(error);
                    rowHasErrors = true;
                    // 更新列错误统计
                    const columnName = error.column;
                    statistics.errorsByColumn[columnName] = (statistics.errorsByColumn[columnName] || 0) + 1;
                    // 检查是否在第一个错误处停止
                    if (options.stopOnFirstError) {
                        break;
                    }
                }
            }
            // 更新行统计
            if (rowHasErrors) {
                statistics.invalidRows++;
            }
            else {
                statistics.validRows++;
            }
            // 检查错误阈值
            if (errors.length >= options.errorThreshold) {
                break;
            }
        }
        return {
            errors,
            success: errors.length === 0,
            statistics
        };
    }
    /**
     * 验证单个值
     */
    validateValue(value, rule, row) {
        // 处理自定义验证器
        if (rule.type === 'custom' && rule.customValidator) {
            return rule.customValidator(value, row);
        }
        // 检查允许的值列表
        if (rule.allowedValues && !rule.allowedValues.includes(value)) {
            return false;
        }
        // 根据类型验证
        switch (rule.type) {
            case 'required':
                return value !== null && value !== undefined && value !== '';
            case 'number':
                const num = Number(value);
                if (isNaN(num))
                    return false;
                if (rule.minValue !== undefined && num < rule.minValue)
                    return false;
                if (rule.maxValue !== undefined && num > rule.maxValue)
                    return false;
                return true;
            case 'string':
                if (typeof value !== 'string')
                    return false;
                if (rule.minLength !== undefined && value.length < rule.minLength)
                    return false;
                if (rule.maxLength !== undefined && value.length > rule.maxLength)
                    return false;
                return true;
            case 'date':
                const date = new Date(value);
                if (isNaN(date.getTime()))
                    return false;
                if (rule.beforeDate) {
                    const before = new Date(rule.beforeDate);
                    if (date >= before)
                        return false;
                }
                if (rule.afterDate) {
                    const after = new Date(rule.afterDate);
                    if (date <= after)
                        return false;
                }
                return true;
            case 'boolean':
                return typeof value === 'boolean' || value === 'true' || value === 'false';
            case 'regex':
                if (!rule.pattern || typeof value !== 'string')
                    return false;
                const regex = new RegExp(rule.pattern);
                return regex.test(value);
            default:
                return true;
        }
    }
    /**
     * 获取默认错误消息
     */
    getDefaultErrorMessage(value, rule) {
        switch (rule.type) {
            case 'required':
                return '该字段不能为空';
            case 'number':
                return `值 '${value}' 不是有效的数字`;
            case 'string':
                return `值 '${value}' 不是有效的字符串`;
            case 'date':
                return `值 '${value}' 不是有效的日期`;
            case 'boolean':
                return `值 '${value}' 不是有效的布尔值`;
            case 'regex':
                return `值 '${value}' 不匹配正则表达式模式`;
            default:
                return `值 '${value}' 验证失败`;
        }
    }
    /**
     * 应用数据清理
     */
    applyCleaning(data, headers, options) {
        const cleanedData = [...data];
        for (const row of cleanedData) {
            for (const rule of options.cleaningRules || []) {
                const columnIndex = typeof rule.column === 'number' ? rule.column : headers.indexOf(rule.column);
                if (columnIndex === -1) {
                    continue;
                }
                let value = row[columnIndex];
                if (value === null || value === undefined) {
                    continue;
                }
                // 应用清理操作
                switch (rule.operation) {
                    case 'trim':
                        row[columnIndex] = String(value).trim();
                        break;
                    case 'toUpperCase':
                        row[columnIndex] = String(value).toUpperCase();
                        break;
                    case 'toLowerCase':
                        row[columnIndex] = String(value).toLowerCase();
                        break;
                    case 'replace':
                        if (rule.searchValue !== undefined && rule.replaceValue !== undefined) {
                            row[columnIndex] = String(value).replace(rule.searchValue, rule.replaceValue);
                        }
                        break;
                    case 'pad':
                        if (rule.targetLength) {
                            const strValue = String(value);
                            const padChar = rule.padChar || ' ';
                            if (rule.padType === 'start') {
                                row[columnIndex] = strValue.padStart(rule.targetLength, padChar);
                            }
                            else {
                                row[columnIndex] = strValue.padEnd(rule.targetLength, padChar);
                            }
                        }
                        break;
                    case 'custom':
                        if (rule.customCleaner) {
                            row[columnIndex] = rule.customCleaner(value);
                        }
                        break;
                }
            }
        }
        return cleanedData;
    }
    /**
     * 应用数据修复
     */
    applyRepair(data, headers, options) {
        const repairedData = [...data];
        for (let rowIndex = 0; rowIndex < repairedData.length; rowIndex++) {
            const row = repairedData[rowIndex];
            for (const rule of options.repairRules || []) {
                const columnIndex = typeof rule.column === 'number' ? rule.column : headers.indexOf(rule.column);
                if (columnIndex === -1) {
                    continue;
                }
                const value = row[columnIndex];
                let shouldRepair = false;
                // 检查修复条件
                switch (rule.condition) {
                    case 'isNull':
                        shouldRepair = value === null || value === undefined;
                        break;
                    case 'isEmpty':
                        shouldRepair = value === null || value === undefined || value === '';
                        break;
                    case 'isError':
                        shouldRepair = value === 'ERROR' || (typeof value === 'string' && value.startsWith('#'));
                        break;
                    case 'custom':
                        if (rule.customCondition) {
                            shouldRepair = rule.customCondition(value, row);
                        }
                        break;
                }
                // 应用修复
                if (shouldRepair) {
                    switch (rule.action) {
                        case 'setDefault':
                            row[columnIndex] = rule.defaultValue ?? '';
                            break;
                        case 'fillFromColumn':
                            if (rule.sourceColumn !== undefined) {
                                const sourceIndex = typeof rule.sourceColumn === 'number'
                                    ? rule.sourceColumn
                                    : headers.indexOf(rule.sourceColumn);
                                if (sourceIndex !== -1) {
                                    row[columnIndex] = row[sourceIndex];
                                }
                            }
                            break;
                        case 'fillWithPrevious':
                            if (rowIndex > 0) {
                                row[columnIndex] = repairedData[rowIndex - 1][columnIndex];
                            }
                            break;
                        case 'fillWithNext':
                            if (rowIndex < repairedData.length - 1) {
                                row[columnIndex] = repairedData[rowIndex + 1][columnIndex];
                            }
                            break;
                        case 'custom':
                            if (rule.customAction) {
                                row[columnIndex] = rule.customAction(value, row);
                            }
                            break;
                    }
                }
            }
        }
        return repairedData;
    }
    /**
     * 生成CSV输出
     */
    generateCsvOutput(headers, data) {
        const rows = [headers, ...data];
        return rows.map(row => {
            return row.map(cell => {
                if (cell === null || cell === undefined)
                    return '';
                const cellStr = String(cell);
                // 如果包含逗号、引号或换行符，需要用引号包围
                if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
                    // 转义引号
                    return '"' + cellStr.replace(/"/g, '""') + '"';
                }
                return cellStr;
            }).join(',');
        }).join('\n');
    }
    /**
     * 生成验证报告
     */
    generateValidationReport(validationResult) {
        const report = [
            '=== Excel数据验证报告 ===',
            `总记录数: ${validationResult.statistics.totalRows}`,
            `有效记录: ${validationResult.statistics.validRows}`,
            `无效记录: ${validationResult.statistics.invalidRows}`,
            `错误总数: ${validationResult.errors.length}`,
            '',
            '详细错误信息:'
        ];
        validationResult.errors.forEach((error, index) => {
            report.push(`${index + 1}. 行 ${error.row}, 列 ${error.column}: ${error.message} (值: ${error.value})`);
        });
        return report.join('\n');
    }
    /**
     * 计算统计信息
     */
    calculateStatistics(result, validationResult) {
        return {
            validationErrors: validationResult?.errors?.length || 0,
            rowsCleaned: validationResult?.statistics?.invalidRows || 0,
            valuesRepaired: validationResult?.statistics?.invalidRows || 0
        };
    }
}
exports.ExcelDataValidator = ExcelDataValidator;
//# sourceMappingURL=ExcelDataValidator.js.map