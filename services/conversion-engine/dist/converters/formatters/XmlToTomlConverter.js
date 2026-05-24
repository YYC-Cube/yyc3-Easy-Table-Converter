"use strict";
/**
 * @file XML到TOML转换器
 * @description 提供XML格式到TOML格式的转换功能
 * @module converters/formatters/XmlToTomlConverter
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
exports.XmlToTomlConverter = void 0;
const BaseConverter_1 = require("../common/BaseConverter");
/**
 * XML到TOML转换器类
 */
class XmlToTomlConverter extends BaseConverter_1.BaseConverter {
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
        return ['toml'];
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
            let xml2js;
            let toml;
            try {
                // 导入xml2js库用于XML解析
                xml2js = await Promise.resolve().then(() => __importStar(require('xml2js')));
                // 导入toml库用于TOML序列化
                toml = await Promise.resolve().then(() => __importStar(require('@iarna/toml')));
            }
            catch (importError) {
                throw new Error('缺少必要依赖，请安装: npm install xml2js @iarna/toml');
            }
            // 解析XML为JavaScript对象
            let parsedData;
            try {
                const parser = new xml2js.Parser({
                    explicitArray: true,
                    explicitRoot: true,
                    ignoreAttrs: !options.attributesToProperties,
                    mergeAttrs: options.attributesToProperties,
                    preserveChildrenOrder: true,
                    charsAsChildren: true,
                    cdataKeyName: options.preserveCdata ? '_cdata' : undefined,
                    valueKey: '_',
                    attrkey: '$'
                });
                parsedData = await parser.parseStringPromise(input);
            }
            catch (parseError) {
                throw new Error(`XML解析失败: ${parseError instanceof Error ? parseError.message : '无效的XML格式'}`);
            }
            // 处理数据结构
            let processedData = parsedData;
            // 如果指定了根节点路径，尝试导航到该节点
            if (options.rootNodePath) {
                const pathParts = options.rootNodePath.split('.');
                let current = parsedData;
                for (const part of pathParts) {
                    if (current[part]) {
                        current = current[part];
                    }
                    else {
                        throw new Error(`根节点路径 ${options.rootNodePath} 不存在`);
                    }
                }
                processedData = current;
            }
            else {
                // 如果没有指定根节点路径，使用XML的根节点
                const rootKeys = Object.keys(processedData);
                if (rootKeys.length === 1) {
                    processedData = processedData[rootKeys[0]];
                }
            }
            // 规范化数据结构
            processedData = this.normalizeData(processedData, options);
            // 扁平化嵌套结构（如果需要）
            if (options.flattenNested && typeof processedData === 'object' && processedData !== null) {
                processedData = this.flattenObject(processedData);
            }
            // 序列化为TOML字符串
            let tomlOutput;
            try {
                tomlOutput = toml.stringify(processedData);
            }
            catch (stringifyError) {
                throw new Error(`TOML序列化失败: ${stringifyError instanceof Error ? stringifyError.message : '数据结构不兼容'}`);
            }
            const endTime = performance.now();
            return this.createResult({
                output: tomlOutput,
                outputFormat: options.outputFormat,
                inputFormat: options.inputFormat,
                processingTimeMs: endTime - startTime,
                recordCount: this.countRecords(processedData),
                metadata: {
                    originalSize: input.length,
                    convertedSize: tomlOutput.length,
                    conversionRate: tomlOutput.length / input.length,
                    rootNode: options.rootNodePath,
                    attributesToProperties: options.attributesToProperties,
                    flattenNested: options.flattenNested,
                    arrayFormat: options.arrayFormat
                }
            });
        }
        catch (error) {
            const endTime = performance.now();
            throw this.createError(error instanceof Error ? error.message : 'XML到TOML转换失败', endTime - startTime);
        }
    }
    /**
     * 规范化数据结构
     * @param data 输入数据
     * @param options 转换选项
     * @returns 规范化后的数据
     */
    normalizeData(data, options) {
        // 处理数组
        if (Array.isArray(data)) {
            if (data.length === 0)
                return [];
            if (data.length === 1 && !options.mergeTextNodes) {
                // 单元素数组简化为单个值
                return this.normalizeData(data[0], options);
            }
            // TOML对数组的特殊处理
            const normalizedArray = data.map((item) => this.normalizeData(item, options));
            // 检查是否所有元素都是简单类型（数字、字符串、布尔值、日期）
            const allSimpleTypes = normalizedArray.every(item => typeof item !== 'object' || item === null);
            // 如果都是简单类型，可以保留为普通数组
            if (allSimpleTypes) {
                return normalizedArray;
            }
            // 对于复杂对象数组，将其转换为映射表形式
            // 以数组索引作为键
            const result = {};
            normalizedArray.forEach((item, index) => {
                result[`item_${index}`] = item;
            });
            return result;
        }
        // 处理对象
        if (typeof data === 'object' && data !== null) {
            const normalized = {};
            let hasAttributes = false;
            let hasText = false;
            let textValue = '';
            // 处理属性和文本节点
            for (const [key, value] of Object.entries(data)) {
                if (key === '$') {
                    // XML属性
                    if (options.attributesToProperties) {
                        Object.assign(normalized, this.normalizeData(value, options));
                    }
                    else {
                        normalized.attributes = this.normalizeData(value, options);
                    }
                    hasAttributes = true;
                }
                else if (key === '_') {
                    // 文本内容
                    textValue = this.normalizeData(value, options);
                    hasText = true;
                }
                else if (key === '_cdata' && options.preserveCdata) {
                    // CDATA内容
                    normalized.cdata = this.normalizeData(value, options);
                }
                else {
                    // 子节点
                    // 处理TOML中的特殊字符
                    const normalizedKey = this.normalizeKey(key);
                    normalized[normalizedKey] = this.normalizeData(value, options);
                }
            }
            // 特殊情况处理：如果只有文本内容，直接返回文本
            if (!hasAttributes && Object.keys(normalized).length === 0 && hasText) {
                return textValue;
            }
            // 如果有文本内容，添加到结果中
            if (hasText) {
                if (options.mergeTextNodes && Object.keys(normalized).length > 0) {
                    normalized.text = textValue;
                }
                else if (Object.keys(normalized).length === 0) {
                    return textValue;
                }
                else {
                    normalized.text = textValue;
                }
            }
            return normalized;
        }
        // 处理简单值
        return this.formatValue(data, options);
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
        // 处理日期字符串
        if (typeof value === 'string') {
            if (this.isValidDate(value)) {
                const date = new Date(value);
                // TOML支持ISO 8601格式的日期
                return date.toISOString();
            }
            // 尝试转换数字
            if (options.preserveNumberTypes) {
                if (/^\d+$/.test(value))
                    return parseInt(value, 10);
                if (/^\d+\.\d+$/.test(value))
                    return parseFloat(value);
            }
            // 尝试转换布尔值
            if (value.toLowerCase() === 'true')
                return true;
            if (value.toLowerCase() === 'false')
                return false;
        }
        return value;
    }
    /**
     * 检查字符串是否为有效日期
     * @param dateString 日期字符串
     * @returns 是否为有效日期
     */
    isValidDate(dateString) {
        // 简单的日期格式检查
        const datePatterns = [
            /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/, // ISO 8601
            /^\d{2}\/\d{2}\/\d{4}$/ // MM/DD/YYYY
        ];
        // 检查是否匹配任何日期格式
        if (datePatterns.some(pattern => pattern.test(dateString))) {
            const date = new Date(dateString);
            return !isNaN(date.getTime());
        }
        return false;
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
            // 对于数组，将其转换为对象，使用索引作为键
            const arrayObj = {};
            obj.forEach((item, index) => {
                arrayObj[`item_${index}`] = this.flattenObject(item);
            });
            return arrayObj;
        }
        if (typeof obj !== 'object' || obj === null) {
            return obj;
        }
        for (const [key, value] of Object.entries(obj)) {
            // 规范化键名
            const normalizedKey = this.normalizeKey(key);
            const newKey = parentKey ? `${parentKey}.${normalizedKey}` : normalizedKey;
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
     * 规范化TOML键名
     * @param key 原始键名
     * @returns 规范化后的键名
     */
    normalizeKey(key) {
        // TOML对键名的特殊处理
        // 如果键名包含特殊字符，需要加引号
        const hasSpecialChars = /[^\w\d_]/i.test(key);
        if (hasSpecialChars) {
            // 转义内部的引号
            const escapedKey = key.replace(/"/g, '"');
            return `"${escapedKey}"`;
        }
        return key;
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
            // 检查对象中是否包含数组
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
exports.XmlToTomlConverter = XmlToTomlConverter;
//# sourceMappingURL=XmlToTomlConverter.js.map