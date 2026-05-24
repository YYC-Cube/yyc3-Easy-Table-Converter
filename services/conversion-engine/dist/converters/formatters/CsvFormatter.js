"use strict";
/**
 * @file CSV格式化工具
 * @description 实现CSV文件的格式化、优化和标准化功能
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-20
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CsvFormatter = void 0;
const BaseConverter_1 = require("../common/BaseConverter");
const logger_1 = require("../../utils/logger");
/**
 * CSV格式化工具类
 */
class CsvFormatter extends BaseConverter_1.BaseConverter {
    constructor() {
        super('CSV格式化工具', '对CSV文件进行格式化、优化和标准化处理', ['csv'], ['csv']);
    }
    /**
     * 执行CSV格式化
     * @param inputData CSV输入数据
     * @param inputFormat 输入格式
     * @param outputFormat 输出格式
     * @param options 格式化选项
     */
    async convert(inputData, inputFormat, outputFormat, options = {}) {
        try {
            // 验证输入数据
            if (!this.validateInputData(inputData)) {
                return this.createErrorResult('输入数据为空或无效');
            }
            // 设置默认选项
            const formatOptions = {
                delimiter: options.delimiter ?? ',',
                quote: options.quote ?? '"',
                escape: options.escape ?? '"',
                hasHeaders: options.hasHeaders ?? true,
                trimFields: options.trimFields ?? true,
                removeEmptyRows: options.removeEmptyRows ?? true,
                standardizeLineBreaks: options.standardizeLineBreaks ?? true,
                alignHeaders: options.alignHeaders ?? false,
                maxLineWidth: options.maxLineWidth ?? 0,
                preserveComments: options.preserveComments ?? false,
                validate: options.validate ?? true,
                ...options
            };
            // 将Buffer转换为字符串
            let csvContent = typeof inputData === 'string' ? inputData : inputData.toString('utf8');
            // 标准化换行符
            if (formatOptions.standardizeLineBreaks) {
                csvContent = this.standardizeLineBreaks(csvContent);
            }
            // 解析CSV数据
            const { rows, comments } = this.parseCsv(csvContent, formatOptions);
            // 验证CSV结构
            if (formatOptions.validate && !this.isValidCsvStructure(rows)) {
                throw new Error('CSV结构验证失败: 无效的行数据');
            }
            // 清理和处理行数据
            const processedRows = this.processCsvRows(rows, formatOptions);
            // 执行格式化并测量性能
            const { result: formattedCsv, duration } = await this.measurePerformance(() => {
                return this.formatCsv(processedRows, comments, formatOptions);
            });
            // 计算统计信息
            const statistics = this.calculateCsvStatistics(processedRows, formatOptions.hasHeaders);
            // 返回成功结果
            return this.createSuccessResult(formattedCsv, outputFormat, inputFormat, {
                size: Buffer.byteLength(formattedCsv),
                rows: statistics.rows,
                columns: statistics.columns,
                nonEmptyRows: statistics.nonEmptyRows,
                processingTime: duration
            });
        }
        catch (error) {
            logger_1.logger.error('CSV格式化失败:', error);
            return this.createErrorResult(`格式化失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
    }
    /**
     * 标准化换行符
     */
    standardizeLineBreaks(content) {
        return content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    }
    /**
     * 解析CSV内容为行数组
     */
    parseCsv(content, options) {
        const lines = content.split('\n');
        const rows = [];
        const comments = [];
        let currentLine = '';
        let inQuotes = false;
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            currentLine += line;
            // 检查注释行
            if (!inQuotes && line.trim().startsWith('#')) {
                if (options.preserveComments) {
                    comments.push(line);
                }
                currentLine = '';
                continue;
            }
            // 处理引号状态
            const quoteCount = (currentLine.match(new RegExp(options.quote, 'g')) || []).length;
            inQuotes = quoteCount % 2 !== 0;
            if (!inQuotes) {
                // 完全解析一行
                const parsedLine = this.parseCsvLine(currentLine, options);
                rows.push(parsedLine);
                currentLine = '';
            }
            else {
                // 行未结束，添加换行符继续
                currentLine += '\n';
            }
        }
        // 处理最后一行（如果在引号中）
        if (currentLine.trim()) {
            const parsedLine = this.parseCsvLine(currentLine, options);
            rows.push(parsedLine);
        }
        return { rows, comments };
    }
    /**
     * 解析单行CSV数据
     */
    parseCsvLine(line, options) {
        const fields = [];
        let currentField = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            const nextChar = i < line.length - 1 ? line[i + 1] : '';
            if (char === options.quote) {
                if (nextChar === options.quote) {
                    // 转义引号
                    currentField += options.quote;
                    i++; // 跳过下一个引号
                }
                else {
                    inQuotes = !inQuotes;
                }
            }
            else if (char === options.delimiter && !inQuotes) {
                // 字段结束
                fields.push(options.trimFields ? currentField.trim() : currentField);
                currentField = '';
            }
            else {
                currentField += char;
            }
        }
        // 添加最后一个字段
        fields.push(options.trimFields ? currentField.trim() : currentField);
        return fields;
    }
    /**
     * 验证CSV结构
     */
    isValidCsvStructure(rows) {
        if (rows.length === 0) {
            return false;
        }
        // 检查至少有一行非空
        const hasNonEmptyRow = rows.some(row => row.length > 0 && row.some(field => field.trim()));
        return hasNonEmptyRow;
    }
    /**
     * 处理CSV行数据
     */
    processCsvRows(rows, options) {
        let processedRows = [...rows];
        // 移除空行
        if (options.removeEmptyRows) {
            processedRows = processedRows.filter(row => row.length > 0 && row.some(field => field.trim()));
        }
        // 确保所有行的列数一致
        if (processedRows.length > 1) {
            const maxColumns = Math.max(...processedRows.map(row => row.length));
            processedRows = processedRows.map(row => {
                if (row.length < maxColumns) {
                    // 补充空字段
                    return [...row, ...Array(maxColumns - row.length).fill('')];
                }
                return row;
            });
        }
        return processedRows;
    }
    /**
     * 格式化CSV数据
     */
    formatCsv(rows, comments, options) {
        const lines = [];
        // 添加注释
        if (options.preserveComments && comments.length > 0) {
            lines.push(...comments);
        }
        // 格式化每一行
        rows.forEach((row, rowIndex) => {
            const formattedRow = row.map(field => this.formatCsvField(field, options)).join(options.delimiter);
            // 检查行宽度限制
            if (options.maxLineWidth > 0 && formattedRow.length > options.maxLineWidth) {
                logger_1.logger.warn(`行 ${rowIndex + 1} 超过最大宽度限制 ${options.maxLineWidth}`);
            }
            lines.push(formattedRow);
        });
        return lines.join('\n');
    }
    /**
     * 格式化CSV字段
     */
    formatCsvField(field, options) {
        if (options.trimFields) {
            field = field.trim();
        }
        // 检查是否需要引号
        const needsQuotes = field.includes(options.delimiter) ||
            field.includes(options.quote) ||
            field.includes('\n') ||
            field.includes('\r') ||
            field.startsWith(' ') ||
            field.endsWith(' ');
        if (needsQuotes) {
            // 转义引号
            const escapedField = field.replace(new RegExp(options.quote, 'g'), options.escape + options.quote);
            return options.quote + escapedField + options.quote;
        }
        return field;
    }
    /**
     * 计算CSV统计信息
     */
    calculateCsvStatistics(rows, hasHeaders) {
        const totalRows = rows.length;
        const columns = totalRows > 0 ? Math.max(...rows.map(row => row.length)) : 0;
        const nonEmptyRows = rows.filter(row => row.some(field => field.trim())).length;
        return {
            rows: totalRows,
            columns,
            nonEmptyRows
        };
    }
}
exports.CsvFormatter = CsvFormatter;
//# sourceMappingURL=CsvFormatter.js.map