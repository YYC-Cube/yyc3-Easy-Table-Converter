"use strict";
/**
 * @file XML到CSV转换器
 * @description 提供XML格式到CSV格式的转换功能
 * @module converters/formatters/XmlToCsvConverter
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
exports.XmlToCsvConverter = void 0;
const BaseConverter_1 = require("../common/BaseConverter");
/**
 * XML到CSV转换器类
 */
class XmlToCsvConverter extends BaseConverter_1.BaseConverter {
    /**
     * 获取支持的输入格式
     * @returns 支持的输入格式数组
     */
    getSupportedInputFormats() {
        return ['xml'];
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
     * @param input 输入的XML字符串
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
            let xml2js, json2csv;
            try {
                // 导入xml2js库用于XML解析
                xml2js = await Promise.resolve().then(() => __importStar(require('xml2js')));
                // 导入json2csv库用于JSON到CSV转换
                try {
                    json2csv = await Promise.resolve().then(() => __importStar(require('json2csv'))).then(m => m.default);
                }
                catch (e) {
                    json2csv = null;
                }
            }
            catch (importError) {
                throw new Error('缺少必要依赖，请安装: npm install xml2js json2csv');
            }
            // 解析XML为JavaScript对象
            let parsedData;
            try {
                const parser = new xml2js.Parser({
                    explicitArray: true,
                    explicitRoot: true,
                    ignoreAttrs: false,
                    mergeAttrs: true
                });
                parsedData = await parser.parseStringPromise(input);
            }
            catch (parseError) {
                throw new Error(`XML解析失败: ${parseError instanceof Error ? parseError.message : '无效的XML格式'}`);
            }
            // 提取记录数据
            let records = this.extractRecords(parsedData, options);
            // 扁平化嵌套结构（如果需要）
            if (options.flattenNested) {
                records = records.map((record) => this.flattenObject(record));
            }
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
            // 生成CSV
            let csvOutput;
            if (json2csv) {
                // 使用json2csv库生成CSV
                const fields = this.extractFields(records);
                const parser = new json2csv.Parser({
                    fields,
                    delimiter: options.delimiter ?? ',',
                    header: options.includeHeader !== false
                });
                csvOutput = parser.parse(records);
            }
            else {
                // 简单的CSV生成实现
                csvOutput = this.simpleJsonToCsv(records, options);
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
                    fieldCount: this.extractFields(records).length,
                    rootNode: options.rootNodePath,
                    recordNode: options.recordNodeName
                }
            });
        }
        catch (error) {
            const endTime = performance.now();
            throw this.createError(error instanceof Error ? error.message : 'XML到CSV转换失败', endTime - startTime);
        }
    }
    /**
     * 从解析后的XML数据中提取记录
     * @param data 解析后的XML数据
     * @param options 转换选项
     * @returns 记录数组
     */
    extractRecords(data, options) {
        // 如果指定了根节点路径，尝试导航到该节点
        let currentData = data;
        if (options.rootNodePath) {
            const pathParts = options.rootNodePath.split('.');
            for (const part of pathParts) {
                if (currentData[part]) {
                    currentData = currentData[part];
                }
                else {
                    // 路径不存在，返回空数组
                    return [];
                }
            }
        }
        else {
            // 如果没有指定根节点路径，使用XML的根节点
            const rootKeys = Object.keys(currentData);
            if (rootKeys.length === 1) {
                currentData = currentData[rootKeys[0]];
            }
        }
        // 查找记录节点
        if (options.recordNodeName) {
            if (Array.isArray(currentData[options.recordNodeName])) {
                return currentData[options.recordNodeName].map((record) => this.normalizeRecord(record));
            }
            else if (currentData[options.recordNodeName]) {
                // 如果只有一个记录，也返回数组格式
                return [this.normalizeRecord(currentData[options.recordNodeName])];
            }
        }
        else {
            // 如果没有指定记录节点名称，尝试找到第一个数组类型的子节点
            for (const [key, value] of Object.entries(currentData)) {
                if (Array.isArray(value)) {
                    return value.map((record) => this.normalizeRecord(record));
                }
            }
        }
        // 如果没有找到合适的记录，返回空数组
        return [];
    }
    /**
     * 规范化记录格式
     * @param record 原始记录
     * @returns 规范化后的记录
     */
    normalizeRecord(record) {
        const normalized = {};
        for (const [key, value] of Object.entries(record)) {
            // 处理数组类型的值
            if (Array.isArray(value)) {
                if (value.length === 1) {
                    // 单元素数组直接使用该元素
                    normalized[key] = this.normalizeValue(value[0]);
                }
                else {
                    // 多元素数组转换为字符串
                    normalized[key] = value.map((item) => this.normalizeValue(item)).join('; ');
                }
            }
            else {
                normalized[key] = this.normalizeValue(value);
            }
        }
        return normalized;
    }
    /**
     * 规范化单个值
     * @param value 原始值
     * @returns 规范化后的值
     */
    normalizeValue(value) {
        if (typeof value === 'object' && value !== null) {
            // 如果是对象，尝试转换为字符串
            const keys = Object.keys(value);
            if (keys.length === 0)
                return '';
            if (keys.length === 1 && typeof value[keys[0]] === 'string')
                return value[keys[0]];
            return JSON.stringify(value);
        }
        return value ?? '';
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
            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                this.flattenObject(value, newKey, result);
            }
            else {
                result[newKey] = value;
            }
        }
        return result;
    }
    /**
     * 从记录数组中提取所有字段名
     * @param records 记录数组
     * @returns 字段名数组
     */
    extractFields(records) {
        const fieldsSet = new Set();
        for (const record of records) {
            for (const field of Object.keys(record)) {
                fieldsSet.add(field);
            }
        }
        return Array.from(fieldsSet);
    }
    /**
     * 简单的JSON到CSV转换实现
     * @param data JSON数据数组
     * @param options 转换选项
     * @returns CSV字符串
     */
    simpleJsonToCsv(data, options) {
        if (data.length === 0)
            return '';
        const delimiter = options.delimiter ?? ',';
        const fields = this.extractFields(data);
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
exports.XmlToCsvConverter = XmlToCsvConverter;
//# sourceMappingURL=XmlToCsvConverter.js.map