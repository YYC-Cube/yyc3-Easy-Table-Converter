"use strict";
/**
 * @file YAML到XML转换器
 * @description 提供YAML格式到XML格式的转换功能
 * @module converters/formatters/YamlToXmlConverter
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
exports.YamlToXmlConverter = void 0;
const BaseConverter_1 = require("../common/BaseConverter");
/**
 * YAML到XML转换器类
 */
class YamlToXmlConverter extends BaseConverter_1.BaseConverter {
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
        return ['xml'];
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
            let js2xmlparser;
            try {
                // 导入js-yaml库用于YAML解析
                yaml = await Promise.resolve().then(() => __importStar(require('js-yaml')));
                // 尝试导入js2xmlparser库
                try {
                    js2xmlparser = await Promise.resolve().then(() => __importStar(require('js2xmlparser'))).then(m => m.default);
                }
                catch (e) {
                    js2xmlparser = null;
                }
            }
            catch (importError) {
                throw new Error('缺少必要依赖，请安装: npm install js-yaml js2xmlparser');
            }
            // 解析YAML为JavaScript对象
            let parsedData;
            try {
                parsedData = yaml.load(input);
            }
            catch (parseError) {
                throw new Error(`YAML解析失败: ${parseError instanceof Error ? parseError.message : '无效的YAML格式'}`);
            }
            // 扁平化嵌套结构（如果需要）
            if (options.flattenNested && parsedData && typeof parsedData === 'object') {
                parsedData = this.flattenObject(parsedData);
            }
            // 准备XML数据结构
            const xmlData = this.prepareXmlData(parsedData, options);
            // 生成XML
            let xmlOutput;
            if (js2xmlparser) {
                // 使用js2xmlparser生成XML
                const js2xmlOptions = {
                    prettyPrinting: true,
                    declaration: {
                        include: options.includeXmlDeclaration !== false
                    },
                    format: {
                        doubleQuotes: true,
                        indent: ' '.repeat(options.indent || 2)
                    }
                };
                xmlOutput = js2xmlparser.parse(options.rootElement || 'root', xmlData, js2xmlOptions);
            }
            else {
                // 简单的XML生成实现
                xmlOutput = this.simpleJsonToXml(xmlData, options);
            }
            const endTime = performance.now();
            return this.createResult({
                output: xmlOutput,
                outputFormat: options.outputFormat,
                inputFormat: options.inputFormat,
                processingTimeMs: endTime - startTime,
                recordCount: this.countRecords(parsedData),
                metadata: {
                    originalSize: input.length,
                    convertedSize: xmlOutput.length,
                    conversionRate: xmlOutput.length / input.length,
                    rootElement: options.rootElement || 'root',
                    includeXmlDeclaration: options.includeXmlDeclaration !== false,
                    useCdata: options.useCdata || false,
                    flattenNested: options.flattenNested || false
                }
            });
        }
        catch (error) {
            const endTime = performance.now();
            throw this.createError(error instanceof Error ? error.message : 'YAML到XML转换失败', endTime - startTime);
        }
    }
    /**
     * 扁平化嵌套对象
     * @param obj 嵌套对象
     * @param parentKey 父键名
     * @param result 结果对象
     * @returns 扁平化后的对象
     */
    flattenObject(obj, parentKey = '', result = {}) {
        if (Array.isArray(obj)) {
            return obj.map(item => this.flattenObject(item));
        }
        if (typeof obj !== 'object' || obj === null) {
            return obj;
        }
        for (const [key, value] of Object.entries(obj)) {
            const newKey = parentKey ? `${parentKey}_${key}` : key;
            if (typeof value === 'object' && value !== null && !Array.isArray(value) && !(value instanceof Date)) {
                this.flattenObject(value, newKey, result);
            }
            else {
                result[newKey] = value;
            }
        }
        return result;
    }
    /**
     * 准备XML数据结构
     * @param data 解析后的数据
     * @param options 转换选项
     * @returns 准备好的数据结构
     */
    prepareXmlData(data, options) {
        // 规范化数据
        if (Array.isArray(data)) {
            // 对于数组，创建适当的结构
            const arrayElementName = options.arrayElementName || 'items';
            const recordElementName = options.recordElementName || 'item';
            return {
                [arrayElementName]: data.map((item) => {
                    const record = {};
                    if (typeof item === 'object' && item !== null) {
                        record[recordElementName] = this.normalizeData(item, options);
                    }
                    else {
                        record[recordElementName] = { '#text': this.formatValue(item, options) };
                    }
                    return record;
                })
            };
        }
        else if (typeof data === 'object' && data !== null) {
            // 对于对象，规范化结构
            return this.normalizeData(data, options);
        }
        else {
            // 对于简单值，包装在对象中
            return { value: this.formatValue(data, options) };
        }
    }
    /**
     * 规范化数据结构
     * @param data 输入数据
     * @param options 转换选项
     * @returns 规范化后的数据
     */
    normalizeData(data, options) {
        if (typeof data !== 'object' || data === null) {
            return this.formatValue(data, options);
        }
        if (data instanceof Date) {
            return this.formatValue(data, options);
        }
        if (Array.isArray(data)) {
            const recordElementName = options.recordElementName || 'item';
            return data.map((item) => {
                if (typeof item === 'object' && item !== null) {
                    return { [recordElementName]: this.normalizeData(item, options) };
                }
                else {
                    return { [recordElementName]: { '#text': this.formatValue(item, options) } };
                }
            });
        }
        // 处理普通对象
        const result = {};
        for (const [key, value] of Object.entries(data)) {
            // 检查是否为属性（可以根据规则判断）
            if (options.attributesAsProperties && typeof value !== 'object') {
                if (!result['@'])
                    result['@'] = {};
                result['@'][key] = value;
            }
            else {
                // 处理嵌套对象
                if (typeof value === 'object' && value !== null && !Array.isArray(value) && !(value instanceof Date)) {
                    result[key] = this.normalizeData(value, options);
                }
                else {
                    const formattedValue = this.formatValue(value, options);
                    if (options.useCdata && typeof formattedValue === 'string') {
                        result[key] = { '#cdata': formattedValue };
                    }
                    else {
                        result[key] = formattedValue;
                    }
                }
            }
        }
        return result;
    }
    /**
     * 格式化单个值
     * @param value 原始值
     * @param options 转换选项
     * @returns 格式化后的值
     */
    formatValue(value, options) {
        if (value === null || value === undefined)
            return '';
        // 处理日期
        if (value instanceof Date) {
            return this.formatDate(value, options.dateFormat);
        }
        // 处理数组
        if (Array.isArray(value)) {
            return value.map(item => this.formatValue(item, options)).join(', ');
        }
        // 处理对象
        if (typeof value === 'object') {
            return JSON.stringify(value);
        }
        // 其他类型保持原样
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
        return format
            .replace('YYYY', date.getFullYear().toString())
            .replace('MM', (date.getMonth() + 1).toString().padStart(2, '0'))
            .replace('DD', date.getDate().toString().padStart(2, '0'))
            .replace('HH', date.getHours().toString().padStart(2, '0'))
            .replace('mm', date.getMinutes().toString().padStart(2, '0'))
            .replace('ss', date.getSeconds().toString().padStart(2, '0'));
    }
    /**
     * 简单的JSON到XML转换实现
     * @param data 输入数据
     * @param options 转换选项
     * @returns XML字符串
     */
    simpleJsonToXml(data, options) {
        const lines = [];
        const rootElement = options.rootElement || 'root';
        const indent = ' '.repeat(options.indent || 2);
        // 添加XML声明
        if (options.includeXmlDeclaration !== false) {
            lines.push('<?xml version="1.0" encoding="UTF-8"?>');
        }
        // 生成XML内容
        this.buildXmlString(data, rootElement, lines, 0, indent, options);
        return lines.join('\n');
    }
    /**
     * 递归构建XML字符串
     * @param data 输入数据
     * @param elementName 元素名称
     * @param lines 行数组
     * @param level 缩进级别
     * @param indent 缩进字符串
     * @param options 转换选项
     */
    buildXmlString(data, elementName, lines, level, indent, options) {
        const currentIndent = indent.repeat(level);
        // 处理空值
        if (data === null || data === undefined) {
            lines.push(`${currentIndent}<${elementName}/>`);
            return;
        }
        // 处理字符串、数字、布尔值
        if (typeof data !== 'object') {
            const text = this.escapeXml(String(data));
            if (options.useCdata && typeof data === 'string') {
                lines.push(`${currentIndent}<${elementName}><![CDATA[${text}]]></${elementName}>`);
            }
            else {
                lines.push(`${currentIndent}<${elementName}>${text}</${elementName}>`);
            }
            return;
        }
        // 处理数组
        if (Array.isArray(data)) {
            const itemElementName = options.recordElementName || 'item';
            for (const item of data) {
                this.buildXmlString(item, itemElementName, lines, level, indent, options);
            }
            return;
        }
        // 处理对象
        const childIndent = currentIndent + indent;
        lines.push(`${currentIndent}<${elementName}>`);
        for (const [key, value] of Object.entries(data)) {
            this.buildXmlString(value, key, lines, level + 1, indent, options);
        }
        lines.push(`${currentIndent}</${elementName}>`);
    }
    /**
     * 转义XML特殊字符
     * @param text 输入文本
     * @returns 转义后的文本
     */
    escapeXml(text) {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }
    /**
     * 统计记录数量
     * @param data 输入数据
     * @returns 记录数量
     */
    countRecords(data) {
        if (Array.isArray(data)) {
            return data.length;
        }
        else if (typeof data === 'object' && data !== null) {
            // 计算对象中数组的长度
            for (const value of Object.values(data)) {
                if (Array.isArray(value)) {
                    return value.length;
                }
            }
            return 1; // 单个对象算一条记录
        }
        return 1;
    }
}
exports.YamlToXmlConverter = YamlToXmlConverter;
//# sourceMappingURL=YamlToXmlConverter.js.map