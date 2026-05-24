"use strict";
/**
 * @file TOML格式化工具
 * @description 实现TOML文件的格式化、优化和标准化功能
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-20
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.TomlFormatter = void 0;
const BaseConverter_1 = require("../common/BaseConverter");
const logger_1 = require("../../utils/logger");
/**
 * TOML格式化工具类
 */
class TomlFormatter extends BaseConverter_1.BaseConverter {
    constructor() {
        super('TOML格式化工具', '对TOML文件进行格式化、优化和标准化处理', ['toml'], ['toml']);
    }
    /**
     * 执行TOML格式化
     * @param inputData TOML输入数据
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
                indent: options.indent ?? 2,
                sortKeys: options.sortKeys ?? false,
                sortTables: options.sortTables ?? false,
                alignComments: options.alignComments ?? true,
                normalizeQuotes: options.normalizeQuotes ?? true,
                useDotNotation: options.useDotNotation ?? false,
                compactArrays: options.compactArrays ?? true,
                maxLineWidth: options.maxLineWidth ?? 120,
                removeEmptyLines: options.removeEmptyLines ?? false,
                spaceAfterEqual: options.spaceAfterEqual ?? true,
                spaceAroundBrackets: options.spaceAroundBrackets ?? true,
                alignValues: options.alignValues ?? false,
                trailingNewline: options.trailingNewline ?? true,
                preserveComments: options.preserveComments ?? true,
                validate: options.validate ?? true,
                ...options
            };
            // 将Buffer转换为字符串
            let tomlContent = typeof inputData === 'string' ? inputData : inputData.toString('utf8');
            // 验证TOML格式
            if (formatOptions.validate && !this.isValidToml(tomlContent)) {
                throw new Error('无效的TOML格式');
            }
            // 执行格式化并测量性能
            const { result: formattedToml, duration } = await this.measurePerformance(() => {
                return this.formatToml(tomlContent, formatOptions);
            });
            // 计算统计信息
            const statistics = this.calculateTomlStatistics(formattedToml);
            // 返回成功结果
            return this.createSuccessResult(formattedToml, outputFormat, inputFormat, {
                size: Buffer.byteLength(formattedToml),
                keyCount: statistics.keyCount,
                tableCount: statistics.tableCount,
                arrayCount: statistics.arrayCount,
                commentCount: statistics.commentCount,
                processingTime: duration
            });
        }
        catch (error) {
            logger_1.logger.error('TOML格式化失败:', error);
            return this.createErrorResult(`格式化失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
    }
    /**
     * 验证TOML格式是否有效
     */
    isValidToml(toml) {
        try {
            // 尝试使用简单的解析方法验证TOML
            this.parseTomlForValidation(toml);
            return true;
        }
        catch (error) {
            return false;
        }
    }
    /**
     * 简单的TOML解析验证
     */
    parseTomlForValidation(toml) {
        const lines = toml.split('\n');
        let inTable = false;
        let tableLevel = 0;
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            // 跳过注释和空行
            if (!line || line.startsWith('#')) {
                continue;
            }
            // 检查表格定义
            if (line.startsWith('[') && line.endsWith(']')) {
                const tableMatch = line.match(/\[(\w+)\]/);
                if (!tableMatch) {
                    throw new Error(`无效的表格定义: ${line}`);
                }
                inTable = true;
                if (line.startsWith('[[') && line.endsWith(']]')) {
                    tableLevel++;
                }
            }
            // 检查键值对
            else if (!inTable || (inTable && !line.match(/^\s*\w+\s*=/))) {
                throw new Error(`期望键值对: ${line}`);
            }
        }
    }
    /**
     * 格式化TOML内容
     */
    formatToml(toml, options) {
        try {
            // 尝试标准格式化
            return this.prettyPrintToml(toml, options);
        }
        catch (error) {
            logger_1.logger.warn('标准TOML格式化失败，尝试备用方法:', error);
            return this.alternativeTomlFormat(toml, options);
        }
    }
    /**
     * 美化TOML格式
     */
    prettyPrintToml(toml, options) {
        const lines = toml.split('\n');
        const formattedLines = [];
        const keyValuePairs = new Map();
        const tables = new Map();
        const arrays = [];
        let currentTable = '';
        let inArray = false;
        let arrayLines = [];
        let inInlineArray = false;
        // 第一遍：解析结构
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i].trim();
            // 处理空行
            if (!line) {
                if (!options.removeEmptyLines) {
                    formattedLines.push('');
                }
                continue;
            }
            // 处理注释
            if (line.startsWith('#')) {
                formattedLines.push(line);
                continue;
            }
            // 检查表格定义
            if (line.startsWith('[') && line.endsWith(']')) {
                currentTable = line;
                if (!tables.has(line)) {
                    tables.set(line, []);
                }
                formattedLines.push(line);
                inArray = false;
                inInlineArray = false;
                continue;
            }
            // 检查数组定义
            if (line.match(/^\w+\s*=\s*\[/) && !line.endsWith(']')) {
                inArray = true;
                arrayLines = [line];
                continue;
            }
            // 处理多行数组
            if (inArray) {
                arrayLines.push(line);
                if (line.endsWith(']')) {
                    const arrayContent = arrayLines.join('\n');
                    arrays.push(this.formatArray(arrayContent, options));
                    inArray = false;
                    arrayLines = [];
                }
                continue;
            }
            // 处理键值对
            if (line.includes('=')) {
                inInlineArray = line.includes('[') && line.includes(']');
                const formattedLine = this.formatKeyValue(line, options);
                if (currentTable) {
                    tables.get(currentTable)?.push(formattedLine);
                }
                else {
                    keyValuePairs.set(line.split('=')[0].trim(), [formattedLine]);
                }
            }
        }
        // 第二遍：重新组装
        const result = [];
        // 添加全局键值对
        const globalKeys = Array.from(keyValuePairs.keys());
        if (options.sortKeys) {
            globalKeys.sort();
        }
        globalKeys.forEach(key => {
            result.push(...keyValuePairs.get(key));
        });
        // 添加表格和其键值对
        const tableKeys = Array.from(tables.keys());
        if (options.sortTables) {
            tableKeys.sort();
        }
        tableKeys.forEach(tableKey => {
            if (result.length > 0) {
                result.push('');
            }
            result.push(tableKey);
            const tableValues = tables.get(tableKey);
            if (options.sortKeys) {
                tableValues.sort();
            }
            result.push(...tableValues);
        });
        // 添加数组
        if (arrays.length > 0) {
            if (result.length > 0) {
                result.push('');
            }
            result.push(...arrays);
        }
        let formatted = result.join('\n');
        // 添加尾部换行
        if (options.trailingNewline && !formatted.endsWith('\n')) {
            formatted += '\n';
        }
        return formatted;
    }
    /**
     * 格式化键值对
     */
    formatKeyValue(line, options) {
        // 分离键和值
        const [keyPart, ...valueParts] = line.split('=');
        let key = keyPart.trim();
        let value = valueParts.join('=').trim();
        // 规范化引号
        if (options.normalizeQuotes) {
            value = this.normalizeQuotesInValue(value);
        }
        // 添加等号周围的空格
        const space = options.spaceAfterEqual ? ' ' : '';
        return `${key} =${space}${value}`;
    }
    /**
     * 格式化数组
     */
    formatArray(arrayContent, options) {
        const [keyPart, ...valueParts] = arrayContent.split('=');
        const key = keyPart.trim();
        const value = valueParts.join('=').trim();
        if (options.compactArrays && value.length < options.maxLineWidth) {
            // 尝试压缩为单行
            const compactValue = value.replace(/\s+/g, ' ').replace(/\[\s+/, '[').replace(/\s+\]/, ']');
            return `${key} = ${compactValue}`;
        }
        return `${key} = ${value}`;
    }
    /**
     * 规范化引号
     */
    normalizeQuotesInValue(value) {
        // 简单的引号规范化逻辑
        if (value.startsWith('"') && value.endsWith('"')) {
            return value;
        }
        if (value.startsWith('\'') && value.endsWith('\'')) {
            // 转换为双引号，但需要转义内部的双引号
            const innerValue = value.substring(1, value.length - 1).replace(/"/g, '\\"');
            return `"${innerValue}"`;
        }
        return value;
    }
    /**
     * 备用的TOML格式化方法
     */
    alternativeTomlFormat(toml, options) {
        // 简单的格式化逻辑作为备用
        const lines = toml.split('\n');
        const formattedLines = [];
        let lastWasEmpty = false;
        for (const line of lines) {
            const trimmedLine = line.trim();
            // 跳过连续的空行
            if (!trimmedLine) {
                if (!options.removeEmptyLines && !lastWasEmpty) {
                    formattedLines.push('');
                    lastWasEmpty = true;
                }
                continue;
            }
            lastWasEmpty = false;
            // 格式化键值对
            if (trimmedLine.includes('=') && !trimmedLine.startsWith('[') && !trimmedLine.startsWith('#')) {
                const parts = trimmedLine.split('=');
                if (parts.length >= 2) {
                    const key = parts[0].trim();
                    const value = parts.slice(1).join('=').trim();
                    const space = options.spaceAfterEqual ? ' ' : '';
                    formattedLines.push(`${key} =${space}${value}`);
                    continue;
                }
            }
            formattedLines.push(trimmedLine);
        }
        let formatted = formattedLines.join('\n');
        // 添加尾部换行
        if (options.trailingNewline && !formatted.endsWith('\n')) {
            formatted += '\n';
        }
        return formatted;
    }
    /**
     * 计算TOML统计信息
     */
    calculateTomlStatistics(toml) {
        const keyCount = (toml.match(/^\s*\w+\s*=/gm) || []).length;
        const tableCount = (toml.match(/^\s*\[/gm) || []).length;
        const arrayCount = (toml.match(/=\s*\[/g) || []).length;
        const commentCount = (toml.match(/^\s*#/gm) || []).length;
        return { keyCount, tableCount, arrayCount, commentCount };
    }
}
exports.TomlFormatter = TomlFormatter;
//# sourceMappingURL=TomlFormatter.js.map