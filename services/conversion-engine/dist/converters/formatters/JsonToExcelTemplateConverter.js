"use strict";
/**
 * @file JSON到Excel模板转换器
 * @description 将JSON数据根据模板转换为格式化的Excel文件
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-20
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsonToExcelTemplateConverter = void 0;
const BaseConverter_1 = require("../common/BaseConverter");
const logger_1 = require("../../utils/logger");
/**
 * JSON到Excel模板转换器类
 */
class JsonToExcelTemplateConverter extends BaseConverter_1.BaseConverter {
    constructor() {
        super('JSON到Excel模板转换器', '将JSON数据根据模板转换为格式化的Excel文件', ['json'], ['xlsx', 'xls']);
    }
    /**
     * 执行JSON到Excel模板的转换
     * @param inputData JSON输入数据
     * @param inputFormat 输入格式
     * @param outputFormat 输出格式
     * @param options 转换选项
     */
    async convert(inputData, inputFormat, outputFormat, options = {}) {
        try {
            // 验证输入数据
            if (!this.validateInputData(inputData)) {
                return this.createErrorResult('输入数据为空或无效');
            }
            // 设置默认选项
            const conversionOptions = {
                // 模板配置 - 提供一个基本的默认模板
                template: options.template ?? this.createDefaultTemplate(),
                // 数据处理选项
                flattenData: options.flattenData ?? false,
                expandNestedObjects: options.expandNestedObjects ?? false,
                expandArrays: options.expandArrays ?? false,
                // 单元格处理
                autoFitColumns: options.autoFitColumns ?? true,
                wrapText: options.wrapText ?? false,
                // 输出选项
                useSharedStrings: options.useSharedStrings ?? true,
                optimizeForExcel: options.optimizeForExcel ?? true,
                // 错误处理
                strictMode: options.strictMode ?? false,
                suppressErrors: options.suppressErrors ?? false,
                // 元数据
                includeMetadata: options.includeMetadata ?? false,
                metadataSheetName: options.metadataSheetName ?? 'Metadata',
                ...options
            };
            // 执行转换并测量性能
            const { result: excelData, duration } = await this.measurePerformance(() => {
                return this.jsonToExcelTemplate(inputData, conversionOptions, outputFormat);
            });
            // 计算统计信息
            const statistics = this.calculateStatistics(excelData);
            // 返回成功结果
            return this.createSuccessResult(excelData, outputFormat, inputFormat, {
                size: Buffer.byteLength(excelData),
                sheetsCount: statistics.sheetsCount,
                rowsCount: statistics.rowsCount,
                columnsCount: statistics.columnsCount,
                processingTime: duration
            });
        }
        catch (error) {
            logger_1.logger.error('JSON到Excel模板转换失败:', error);
            return this.createErrorResult(`转换失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
    }
    /**
     * 将JSON数据转换为Excel模板
     * @param inputData JSON输入数据
     * @param options 转换选项
     * @param outputFormat 输出格式
     */
    jsonToExcelTemplate(inputData, options, outputFormat) {
        try {
            // 将输入数据转换为字符串并解析JSON
            const jsonString = Buffer.isBuffer(inputData) ? inputData.toString('utf-8') : inputData;
            const jsonData = this.parseJsonData(jsonString, options);
            // 验证数据格式
            if (!Array.isArray(jsonData)) {
                throw new Error('输入数据必须是数组格式');
            }
            // 处理数据
            const processedData = this.processJsonData(jsonData, options);
            // 应用排序
            const sortedData = this.applySorting(processedData, options.template?.sortBy || []);
            // 生成Excel数据（简化版，实际项目中使用专门的Excel生成库）
            return this.generateExcelFile(sortedData, options, outputFormat);
        }
        catch (error) {
            if (options.suppressErrors) {
                return Buffer.alloc(0);
            }
            throw error;
        }
    }
    /**
     * 解析JSON数据
     */
    parseJsonData(jsonString, options) {
        try {
            const parsed = JSON.parse(jsonString);
            // 确保返回数组
            if (!Array.isArray(parsed)) {
                return [parsed];
            }
            return parsed;
        }
        catch (error) {
            if (options.strictMode) {
                throw new Error('无效的JSON格式');
            }
            // 尝试修复简单的JSON错误
            try {
                // 简单修复：尝试处理末尾逗号、单引号等
                const fixedJson = this.fixJsonString(jsonString);
                return JSON.parse(fixedJson);
            }
            catch {
                throw new Error('无法解析JSON数据');
            }
        }
    }
    /**
     * 修复简单的JSON错误
     */
    fixJsonString(jsonString) {
        // 移除末尾逗号
        let fixed = jsonString
            .replace(/,\s*([}\]])/g, '$1')
            // 将单引号替换为双引号
            .replace(/'([^']+)'/g, '"$1"');
        return fixed;
    }
    /**
     * 处理JSON数据
     */
    processJsonData(data, options) {
        if (options.flattenData) {
            return data.map(item => this.flattenObject(item));
        }
        if (options.expandNestedObjects) {
            return data.map(item => this.expandObject(item));
        }
        return data;
    }
    /**
     * 扁平化对象
     */
    flattenObject(obj, prefix = '') {
        const result = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                const newKey = prefix ? `${prefix}.${key}` : key;
                if (obj[key] && typeof obj[key] === 'object' && !Array.isArray(obj[key])) {
                    Object.assign(result, this.flattenObject(obj[key], newKey));
                }
                else {
                    result[newKey] = obj[key];
                }
            }
        }
        return result;
    }
    /**
     * 展开对象
     */
    expandObject(obj) {
        const result = {};
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                // 处理基本类型
                if (typeof obj[key] !== 'object' || obj[key] === null) {
                    result[key] = obj[key];
                }
                // 处理数组
                else if (Array.isArray(obj[key])) {
                    if (obj[key].length === 0) {
                        result[key] = '';
                    }
                    else if (obj[key].every(item => typeof item !== 'object')) {
                        result[key] = obj[key].join(', ');
                    }
                    else {
                        // 对于复杂数组，只取第一个元素
                        result[key] = JSON.stringify(obj[key][0]);
                    }
                }
                // 处理嵌套对象
                else {
                    for (const nestedKey in obj[key]) {
                        if (obj[key].hasOwnProperty(nestedKey)) {
                            result[`${key}_${nestedKey}`] = obj[key][nestedKey];
                        }
                    }
                }
            }
        }
        return result;
    }
    /**
     * 应用排序
     */
    applySorting(data, sortConfig) {
        if (!sortConfig || sortConfig.length === 0) {
            return data;
        }
        return [...data].sort((a, b) => {
            for (const sort of sortConfig) {
                const aVal = a[sort.key];
                const bVal = b[sort.key];
                if (aVal !== bVal) {
                    // 处理null/undefined
                    if (aVal == null)
                        return sort.order === 'asc' ? -1 : 1;
                    if (bVal == null)
                        return sort.order === 'asc' ? 1 : -1;
                    // 比较值
                    let result = 0;
                    if (typeof aVal === 'number' && typeof bVal === 'number') {
                        result = aVal - bVal;
                    }
                    else {
                        result = String(aVal).localeCompare(String(bVal));
                    }
                    return sort.order === 'asc' ? result : -result;
                }
            }
            return 0;
        });
    }
    /**
     * 生成Excel文件（简化实现）
     */
    generateExcelFile(data, options, outputFormat) {
        // 这是一个简化的实现，实际项目中应使用专门的Excel库（如xlsx、exceljs等）
        // 生成一个基本的Excel结构字符串表示
        let excelContent = `Excel File (${outputFormat})\n`;
        excelContent += `Created with template: ${options.template?.sheetName || 'Default'}\n`;
        // 添加列头
        const columns = options.template?.columns || [];
        if (columns.length > 0) {
            excelContent += 'Headers: ' + columns.map(col => col.header).join(', ') + '\n';
        }
        // 添加数据行信息
        excelContent += `Data rows: ${data.length}\n`;
        return Buffer.from(excelContent);
    }
    /**
     * 创建默认模板
     */
    createDefaultTemplate() {
        return {
            sheetName: 'Data',
            columns: [],
            defaultFormat: {
                alignment: 'left',
                fontSize: 11
            },
            headerFormat: {
                fontBold: true,
                backgroundColor: '#E0E0E0',
                alignment: 'center'
            }
        };
    }
    /**
     * 计算统计信息
     */
    calculateStatistics(excelData) {
        // 解析Excel数据（简化版）
        const content = excelData.toString('utf-8');
        // 尝试从内容中提取统计信息
        const sheetsMatch = content.match(/Created with template: ([^\n]+)/);
        const rowsMatch = content.match(/Data rows: (\d+)/);
        const headersMatch = content.match(/Headers: ([^\n]+)/);
        return {
            sheetsCount: sheetsMatch ? 1 : 1,
            rowsCount: rowsMatch ? parseInt(rowsMatch[1]) : 0,
            columnsCount: headersMatch ? headersMatch[1].split(',').length : 0
        };
    }
}
exports.JsonToExcelTemplateConverter = JsonToExcelTemplateConverter;
//# sourceMappingURL=JsonToExcelTemplateConverter.js.map