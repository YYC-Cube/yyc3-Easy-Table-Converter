"use strict";
/**
 * @file YAML到CSV转换器
 * @description 提供YAML格式到CSV格式的转换功能
 * @module converters/formatters/YamlToCsvConverter
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-16
 * @updated 2024-10-16
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.YamlToCsvConverter = void 0;
const BaseConverter_1 = require("../common/BaseConverter");
/**
 * YAML到CSV转换器类
 */
class YamlToCsvConverter extends BaseConverter_1.BaseConverter {
    /**
     * 获取支持的输入格式
     * @returns 支持的输入格式数组
     */
    getSupportedInputFormats() {
        return ['yaml', 'yml'];
    }
    /**
     * 获取支持的输出格式
     * @returns 支持的输出格式数组
     */
    getSupportedOutputFormats() {
        return ['csv'];
    }
    /**
     * 执行实际的转换操作
     * @param input 输入的YAML字符串
     * @param options 转换选项
     * @returns 转换结果对象
     */
    async convert(input, options) {
        const startTime = performance.now();
        try {
            // 验证输入
            if (!input || typeof input !== 'string' || input.trim() === '') {
                throw new Error('输入不能为空');
            }
            // 导入必要的库
            let yaml;
            let json2csv;
            try {
                // 导入js-yaml库用于YAML解析
                yaml = await Promise.resolve().then(() => __importStar(require('js-yaml')));
                // 尝试导入json2csv库
                try {
                    json2csv = await Promise.resolve().then(() => __importStar(require('json2csv'))).then(m => m.default);
                }
                catch (e) {
                    json2csv = null;
                }
            }
            catch (importError) {
                throw new Error('缺少必要依赖，请安装: npm install js-yaml json2csv');
            }
            // 解析YAML为JavaScript对象
            let parsedData;
            try {
                parsedData = yaml.load(input);
            }
            catch (parseError) {
                throw new Error(`YAML解析失败: ${parseError instanceof Error ? parseError.message : '无效的YAML格式'}`);
            }
            // 处理数据，确保是数组格式
            let records;
            if (Array.isArray(parsedData)) {
                records = parsedData;
            }
            else if (options.arrayPath) {
                // 如果指定了数组路径，尝试导航到该路径
                records = this.navigateToPath(parsedData, options.arrayPath);
                if (!Array.isArray(records)) {
                    throw new Error(`在指定路径 ${options.arrayPath} 处未找到数组`);
                }
            }
            else {
                // 如果是对象，尝试找到第一个数组
                records = this.findFirstArray(parsedData);
                if (!Array.isArray(records) || records.length === 0) {
                    // 如果没有找到数组，将对象转换为单元素数组
                    records = [parsedData];
                }
            }
            // 扁平化嵌套对象（如果需要）
            if (options.flattenNested) {
                records = records.map((record) => this.flattenObject(record));
            }
            // 规范化记录，处理日期等特殊类型
            records = records.map((record) => this.normalizeRecord(record, options));
            // 移除空值字段（如果需要）
            if (options.skipEmptyFields) {
                records = records.map((record) => {
                    const cleaned = {};
                    for (const [key, value] of Object.entries(record)) {
                        if (value !== null && value !== undefined && value !== '') {
                            cleaned[key] = value;
                        }
                    }
                    return cleaned;
                });
            }
            // 提取字段名
            let fields = this.extractFields(records);
            // 如果提供了自定义表头，使用它们
            if (options.headers && options.headers.length > 0) {
                fields = options.headers;
            }
            // 生成CSV
            let csvOutput;
            if (json2csv && records.length > 0) {
                // 使用json2csv库生成CSV
                const parser = new json2csv.Parser({
                    fields,
                    delimiter: options.delimiter ?? ',',
                    header: options.includeHeader !== false
                });
                csvOutput = parser.parse(records);
            }
            else {
                // 简单的CSV生成实现
                csvOutput = this.simpleJsonToCsv(records, fields, options);
            }
            const endTime = performance.now();
            return this.createResult({
                output: csvOutput,
                outputFormat: options.outputFormat,
                inputFormat: options.inputFormat,
                processingTimeMs: endTime - startTime,
                recordCount: records.length,
                metadata: {
                    originalSize: input.length,
                    convertedSize: csvOutput.length,
                    conversionRate: csvOutput.length / input.length,
                    fieldCount: fields.length,
                    arrayPath: options.arrayPath,
                    flattenNested: options.flattenNested,
                    dateFormat: options.dateFormat
                }
            });
        }
        catch (error) {
            const endTime = performance.now();
            throw this.createError(error instanceof Error ? error.message : 'YAML到CSV转换失败', endTime - startTime);
        }
    }
    /**
     * 导航到对象中的指定路径
     * @param obj 目标对象
     * @param path 路径字符串，使用点分隔
     * @returns 路径对应的对象值
     */
    navigateToPath(obj, path) {
        const parts = path.split('.');
        let current = obj;
        for (const part of parts) {
            if (current && typeof current === 'object' && part in current) {
                current = current[part];
            }
            else {
                return null;
            }
        }
        return current;
    }
    /**
     * 查找对象中的第一个数组
     * @param obj 目标对象
     * @returns 找到的数组或空数组
     */
    findFirstArray(obj) {
        if (Array.isArray(obj))
            return obj;
        if (typeof obj !== 'object' || obj === null)
            return [];
        for (const value of Object.values(obj)) {
            if (Array.isArray(value))
                return value;
            if (typeof value === 'object' && value !== null) {
                const nestedArray = this.findFirstArray(value);
                if (nestedArray.length > 0)
                    return nestedArray;
            }
        }
        return [];
    }
    /**
     * 扁平化嵌套对象
     * @param obj 嵌套对象
     * @param parentKey 父键名
     * @param result 结果对象
     * @returns 扁平化后的对象
     */
    flattenObject(obj, parentKey = '', result = {}) {
        for (const [key, value] of Object.entries(obj)) {
            const newKey = parentKey ? `${parentKey}_${key}` : key;
            if (typeof value === 'object' && value !== null && !Array.isArray(value) && !(value instanceof Date)) {
                this.flattenObject(value, newKey, result);
            }
            else if (Array.isArray(value)) {
                // 对于数组，转换为字符串
                result[newKey] = value.join(', ');
            }
            else {
                result[newKey] = value;
            }
        }
        return result;
    }
    /**
     * 规范化记录，处理特殊类型
     * @param record 原始记录
     * @param options 转换选项
     * @returns 规范化后的记录
     */
    normalizeRecord(record, options) {
        if (typeof record !== 'object' || record === null) {
            return { value: this.formatValue(record, options) };
        }
        const normalized = {};
        for (const [key, value] of Object.entries(record)) {
            normalized[key] = this.formatValue(value, options);
        }
        return normalized;
    }
    /**
     * 格式化单个值
     * @param value 原始值
     * @param options 转换选项
     * @returns 格式化后的值
     */
    formatValue(value, options) {
        if (value === null || value === undefined)
            return null;
        // 处理日期类型
        if (value instanceof Date) {
            return this.formatDate(value, options.dateFormat);
        }
        // 处理数组
        if (Array.isArray(value)) {
            return value.map(item => this.formatValue(item, options)).join(', ');
        }
        // 处理嵌套对象
        if (typeof value === 'object') {
            return JSON.stringify(value);
        }
        // 自动检测类型
        if (options.autoDetectTypes) {
            if (typeof value === 'string') {
                // 尝试将字符串转换为数字或布尔值
                if (/^\d+$/.test(value))
                    return parseInt(value, 10);
                if (/^\d+\.\d+$/.test(value))
                    return parseFloat(value);
                if (value.toLowerCase() === 'true')
                    return true;
                if (value.toLowerCase() === 'false')
                    return false;
            }
        }
        return value;
    }
    /**
     * 格式化日期
     * @param date 日期对象
     * @param format 格式字符串
     * @returns 格式化后的日期字符串
     */
    formatDate(date, format) {
        if (!format) {
            return date.toISOString();
        }
        // 简单的日期格式化实现
        return format
            .replace('YYYY', date.getFullYear().toString())
            .replace('MM', (date.getMonth() + 1).toString().padStart(2, '0'))
            .replace('DD', date.getDate().toString().padStart(2, '0'))
            .replace('HH', date.getHours().toString().padStart(2, '0'))
            .replace('mm', date.getMinutes().toString().padStart(2, '0'))
            .replace('ss', date.getSeconds().toString().padStart(2, '0'));
    }
    /**
     * 从记录数组中提取所有字段名
     * @param records 记录数组
     * @returns 字段名数组
     */
    extractFields(records) {
        const fieldsSet = new Set();
        for (const record of records) {
            if (typeof record === 'object' && record !== null) {
                for (const field of Object.keys(record)) {
                    fieldsSet.add(field);
                }
            }
        }
        return Array.from(fieldsSet);
    }
    /**
     * 简单的JSON到CSV转换实现
     * @param data JSON数据数组
     * @param fields 字段名数组
     * @param options 转换选项
     * @returns CSV字符串
     */
    simpleJsonToCsv(data, fields, options) {
        if (data.length === 0)
            return '';
        const delimiter = options.delimiter ?? ',';
        const lines = [];
        // 添加表头
        if (options.includeHeader !== false) {
            lines.push(fields.map(field => this.quoteField(field, delimiter)).join(delimiter));
        }
        // 添加数据行
        for (const record of data) {
            const values = fields.map(field => {
                const value = record[field] ?? '';
                return this.quoteField(String(value), delimiter);
            });
            lines.push(values.join(delimiter));
        }
        return lines.join('\n');
    }
    /**
     * 为CSV字段添加引号
     * @param field 字段值
     * @param delimiter 分隔符
     * @returns 加引号后的字段值
     */
    quoteField(field, delimiter) {
        if (field.includes(delimiter) || field.includes('"') || field.includes('\n') || field.includes('\r')) {
            // 如果字段包含特殊字符，需要添加引号并转义内部的引号
            return `"${field.replace(/"/g, '""')}"`;
        }
        return field;
    }
}
exports.YamlToCsvConverter = YamlToCsvConverter;
//# sourceMappingURL=YamlToCsvConverter.js.map