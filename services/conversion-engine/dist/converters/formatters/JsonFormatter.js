"use strict";
/**
 * @file JSON格式化工具
 * @description 实现JSON文件的格式化、优化和标准化功能
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-20
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsonFormatter = void 0;
const BaseConverter_1 = require("../common/BaseConverter");
const logger_1 = require("../../utils/logger");
/**
 * JSON格式化工具类
 */
class JsonFormatter extends BaseConverter_1.BaseConverter {
    constructor() {
        super('JSON格式化工具', '对JSON文件进行格式化、优化和标准化处理', ['json'], ['json']);
    }
    /**
     * 执行JSON格式化
     * @param inputData JSON输入数据
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
                spaceAfterColon: options.spaceAfterColon ?? true,
                spaceAfterComma: options.spaceAfterComma ?? true,
                trailingComma: options.trailingComma ?? false,
                removeComments: options.removeComments ?? true,
                stripWhitespace: options.stripWhitespace ?? true,
                maxLineWidth: options.maxLineWidth ?? 80,
                compact: options.compact ?? false,
                validate: options.validate ?? true,
                escapeUnicode: options.escapeUnicode ?? false,
                prettyPrint: options.prettyPrint ?? true,
                preserveNullValues: options.preserveNullValues ?? true,
                removeEmptyObjects: options.removeEmptyObjects ?? false,
                removeEmptyArrays: options.removeEmptyArrays ?? false,
                trailingNewline: options.trailingNewline ?? true,
                ...options
            };
            // 将Buffer转换为字符串
            let jsonContent = typeof inputData === 'string' ? inputData : inputData.toString('utf8');
            // 预处理：移除注释
            if (formatOptions.removeComments) {
                jsonContent = this.removeComments(jsonContent);
            }
            // 验证JSON格式
            let parsedData;
            if (formatOptions.validate) {
                try {
                    parsedData = JSON.parse(jsonContent);
                }
                catch (error) {
                    throw new Error('无效的JSON格式');
                }
            }
            else {
                try {
                    parsedData = JSON.parse(jsonContent);
                }
                catch (error) {
                    logger_1.logger.warn('JSON验证失败，尝试修正:', error);
                    parsedData = this.tryFixJson(jsonContent);
                }
            }
            // 优化数据结构
            if (!formatOptions.preserveNullValues || formatOptions.removeEmptyObjects || formatOptions.removeEmptyArrays) {
                parsedData = this.optimizeJsonData(parsedData, formatOptions);
            }
            // 执行格式化并测量性能
            const { result: formattedJson, duration } = await this.measurePerformance(() => {
                return this.formatJson(parsedData, formatOptions);
            });
            // 计算统计信息
            const statistics = this.calculateJsonStatistics(formattedJson);
            // 返回成功结果
            return this.createSuccessResult(formattedJson, outputFormat, inputFormat, {
                size: Buffer.byteLength(formattedJson),
                objectCount: statistics.objectCount,
                arrayCount: statistics.arrayCount,
                keyCount: statistics.keyCount,
                stringCount: statistics.stringCount,
                numberCount: statistics.numberCount,
                booleanCount: statistics.booleanCount,
                nullCount: statistics.nullCount,
                processingTime: duration
            });
        }
        catch (error) {
            logger_1.logger.error('JSON格式化失败:', error);
            return this.createErrorResult(`格式化失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
    }
    /**
     * 移除JSON中的注释
     */
    removeComments(json) {
        // 移除单行注释
        json = json.replace(/\/\/.*$/gm, '');
        // 移除多行注释
        json = json.replace(/\/\*[\s\S]*?\*\//g, '');
        return json;
    }
    /**
     * 尝试修复无效的JSON
     */
    tryFixJson(json) {
        // 简单的修复尝试
        let fixed = json;
        // 修复尾部逗号
        fixed = fixed.replace(/,\s*([}\]])/g, '$1');
        // 尝试修复未加引号的键
        fixed = fixed.replace(/([{\[,])\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1 "$2":');
        try {
            return JSON.parse(fixed);
        }
        catch (error) {
            throw new Error('无法修复的JSON格式');
        }
    }
    /**
     * 优化JSON数据结构
     */
    optimizeJsonData(data, options) {
        if (data === null || data === undefined) {
            return options.preserveNullValues ? null : undefined;
        }
        if (Array.isArray(data)) {
            const optimizedArray = data
                .map(item => this.optimizeJsonData(item, options))
                .filter(item => item !== undefined);
            return options.removeEmptyArrays && optimizedArray.length === 0 ? undefined : optimizedArray;
        }
        if (typeof data === 'object') {
            const optimizedObject = {};
            let hasProperties = false;
            for (const [key, value] of Object.entries(data)) {
                const optimizedValue = this.optimizeJsonData(value, options);
                if (optimizedValue !== undefined) {
                    optimizedObject[key] = optimizedValue;
                    hasProperties = true;
                }
            }
            return options.removeEmptyObjects && !hasProperties ? undefined : optimizedObject;
        }
        return data;
    }
    /**
     * 格式化JSON
     */
    formatJson(data, options) {
        try {
            // 如果是压缩模式
            if (options.compact) {
                return JSON.stringify(data);
            }
            // 准备序列化选项
            const replacer = options.sortKeys ? (key, value) => value : undefined;
            // 确定缩进字符串
            const indentStr = typeof options.indent === 'string'
                ? options.indent
                : ' '.repeat(options.indent);
            let formatted = JSON.stringify(data, replacer, indentStr);
            // 应用额外的格式化选项
            if (options.spaceAfterColon !== undefined || options.spaceAfterComma !== undefined) {
                formatted = this.customFormatSpaces(formatted, options);
            }
            // 添加尾部换行
            if (options.trailingNewline && !formatted.endsWith('\n')) {
                formatted += '\n';
            }
            return formatted;
        }
        catch (error) {
            logger_1.logger.warn('标准JSON格式化失败，尝试备用方法:', error);
            return this.alternativeJsonFormat(data);
        }
    }
    /**
     * 自定义空格格式化
     */
    customFormatSpaces(json, options) {
        let formatted = json;
        // 处理冒号后的空格
        if (options.spaceAfterColon !== undefined) {
            if (options.spaceAfterColon) {
                formatted = formatted.replace(/:\s*/g, ': ');
            }
            else {
                formatted = formatted.replace(/:\s*/g, ':');
            }
        }
        // 处理逗号后的空格
        if (options.spaceAfterComma !== undefined) {
            if (options.spaceAfterComma) {
                formatted = formatted.replace(/,\s*/g, ', ');
            }
            else {
                formatted = formatted.replace(/,\s*/g, ',');
            }
        }
        return formatted;
    }
    /**
     * 备用的JSON格式化方法
     */
    alternativeJsonFormat(data) {
        // 简单的备用格式化逻辑
        return JSON.stringify(data, null, 2);
    }
    /**
     * 计算JSON统计信息
     */
    calculateJsonStatistics(json) {
        const objectCount = (json.match(/\{/g) || []).length;
        const arrayCount = (json.match(/\[/g) || []).length;
        const keyCount = (json.match(/"[^\"]*":/g) || []).length;
        const stringCount = (json.match(/"[^\"]*"(?![\s]*:)/g) || []).length;
        const numberCount = (json.match(/(?<=[:\[\s,])-?\d+(\.\d+)?([eE][+-]?\d+)?(?=[,\]}\s])/g) || []).length;
        const booleanCount = (json.match(/\b(true|false)\b/g) || []).length;
        const nullCount = (json.match(/\bnull\b/g) || []).length;
        return {
            objectCount,
            arrayCount,
            keyCount,
            stringCount,
            numberCount,
            booleanCount,
            nullCount
        };
    }
}
exports.JsonFormatter = JsonFormatter;
//# sourceMappingURL=JsonFormatter.js.map