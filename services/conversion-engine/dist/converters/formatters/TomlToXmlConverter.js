"use strict";
/**
 * @file TOML到XML转换器
 * @description 提供TOML格式到XML格式的转换功能
 * @module converters/formatters/TomlToXmlConverter
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
exports.TomlToXmlConverter = void 0;
const BaseConverter_1 = require("../common/BaseConverter");
/**
 * TOML到XML转换器类
 */
class TomlToXmlConverter extends BaseConverter_1.BaseConverter {
    /**
     * 获取支持的输入格式
     * @returns 支持的输入格式数组
     */
    getSupportedInputFormats() {
        return ['toml'];
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
     * @param input 输入的TOML字符串
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
            let toml;
            let js2xmlparser;
            try {
                // 导入toml库用于TOML解析
                toml = await Promise.resolve().then(() => __importStar(require('@iarna/toml')));
                // 导入js2xmlparser库用于XML生成
                js2xmlparser = await Promise.resolve().then(() => __importStar(require('js2xmlparser')));
            }
            catch (importError) {
                throw new Error('缺少必要依赖，请安装: npm install @iarna/toml js2xmlparser');
            }
            // 解析TOML为JavaScript对象
            let parsedData;
            try {
                parsedData = toml.parse(input);
            }
            catch (parseError) {
                throw new Error(`TOML解析失败: ${parseError instanceof Error ? parseError.message : '无效的TOML格式'}`);
            }
            // 规范化数据结构
            const normalizedData = this.normalizeData(parsedData, options);
            // 构建XML数据结构
            const xmlData = {
                [options.rootElement || 'root']: normalizedData
            };
            // 设置XML生成选项
            const xmlOptions = {
                declaration: {
                    include: options.includeDeclaration !== false
                },
                prettyPrinting: true,
                format: {}
            };
            if (options.indent && options.indent >= 0) {
                xmlOptions.format.indent = ' '.repeat(options.indent);
            }
            else {
                xmlOptions.format.indent = '  ';
            }
            // 处理CDATA包装
            if (options.wrapCdata) {
                xmlOptions.textKey = '#text';
            }
            // 生成XML字符串
            let xmlOutput;
            try {
                xmlOutput = js2xmlparser.parse(options.rootElement || 'root', xmlData, xmlOptions);
            }
            catch (xmlError) {
                throw new Error(`XML生成失败: ${xmlError instanceof Error ? xmlError.message : '数据结构不兼容'}`);
            }
            // 处理CDATA（如果需要）
            if (options.wrapCdata) {
                // 这里可以根据需要进一步处理CDATA
                // js2xmlparser本身不直接支持CDATA，可能需要手动处理
                xmlOutput = this.wrapTextInCdata(xmlOutput);
            }
            const endTime = performance.now();
            return this.createResult({
                output: xmlOutput,
                outputFormat: options.outputFormat,
                inputFormat: options.inputFormat,
                processingTimeMs: endTime - startTime,
                recordCount: this.countRecords(normalizedData),
                metadata: {
                    originalSize: input.length,
                    convertedSize: xmlOutput.length,
                    conversionRate: xmlOutput.length / input.length,
                    rootElement: options.rootElement || 'root',
                    includeDeclaration: options.includeDeclaration,
                    propertiesToAttributes: options.propertiesToAttributes,
                    wrapCdata: options.wrapCdata,
                    indent: options.indent
                }
            });
        }
        catch (error) {
            const endTime = performance.now();
            throw this.createError(error instanceof Error ? error.message : 'TOML到XML转换失败', endTime - startTime);
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
                return { [options.recordElement || 'item']: [] };
            // 为数组项创建统一的元素名称
            const recordElement = options.recordElement || 'item';
            // 检查数组中的元素类型是否一致
            const types = new Set(data.map(item => typeof item));
            // 如果所有元素都是简单类型，创建统一的数组结构
            if (types.size === 1 && types.has('string') || types.has('number') || types.has('boolean')) {
                return data.map(item => this.createRecordElement(recordElement, item, options));
            }
            // 对于复杂类型，处理每个元素
            return data.map(item => {
                if (typeof item === 'object' && item !== null) {
                    return this.normalizeData(item, options);
                }
                return this.createRecordElement(recordElement, item, options);
            });
        }
        // 处理对象
        if (typeof data === 'object' && data !== null) {
            const normalized = {};
            for (const [key, value] of Object.entries(data)) {
                // 规范化键名，确保是有效的XML元素名
                const normalizedKey = this.normalizeElementName(key);
                // 递归处理值
                const processedValue = this.normalizeData(value, options);
                if (options.propertiesToAttributes &&
                    (typeof processedValue !== 'object' || processedValue === null || Array.isArray(processedValue))) {
                    // 如果属性是简单类型，可以考虑转换为XML属性
                    // 但js2xmlparser需要特殊处理，这里暂时保持为子元素
                    normalized[normalizedKey] = processedValue;
                }
                else {
                    normalized[normalizedKey] = processedValue;
                }
            }
            return normalized;
        }
        // 处理简单值
        return this.formatValue(data, options);
    }
    /**
     * 创建记录元素
     * @param elementName 元素名称
     * @param value 元素值
     * @param options 转换选项
     * @returns 记录元素对象
     */
    createRecordElement(elementName, value, options) {
        // 创建记录元素
        const element = {};
        // 如果是简单值，直接设置为文本内容
        if (typeof value !== 'object' || value === null) {
            const formattedValue = this.formatValue(value, options);
            element[elementName] = formattedValue;
        }
        else {
            // 如果是对象，合并属性
            element[elementName] = this.normalizeData(value, options);
        }
        return element;
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
            if (options.useIsoDate) {
                return value.toISOString();
            }
            else if (options.dateFormat) {
                return this.formatDate(value, options.dateFormat);
            }
            else {
                return value.toISOString();
            }
        }
        // 处理其他类型
        if (typeof value === 'boolean') {
            return value.toString();
        }
        if (typeof value === 'number') {
            return value.toString();
        }
        // 字符串值
        if (typeof value === 'string') {
            // 处理特殊字符
            return value
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
        }
        return String(value);
    }
    /**
     * 格式化日期
     * @param date 日期对象
     * @param format 格式字符串
     * @returns 格式化后的日期字符串
     */
    formatDate(date, format) {
        return format
            .replace('YYYY', date.getFullYear().toString())
            .replace('MM', (date.getMonth() + 1).toString().padStart(2, '0'))
            .replace('DD', date.getDate().toString().padStart(2, '0'))
            .replace('HH', date.getHours().toString().padStart(2, '0'))
            .replace('mm', date.getMinutes().toString().padStart(2, '0'))
            .replace('ss', date.getSeconds().toString().padStart(2, '0'));
    }
    /**
     * 规范化XML元素名称
     * @param name 原始名称
     * @returns 规范化后的元素名称
     */
    normalizeElementName(name) {
        // XML元素名不能以数字或特殊字符开头
        let normalized = name
            // 移除引号（如果有）
            .replace(/^"|"$/g, '')
            // 将特殊字符替换为下划线
            .replace(/[^\w\d_.-]/g, '_');
        // 确保不以数字开头
        if (/^\d/.test(normalized)) {
            normalized = `_${normalized}`;
        }
        // 确保不以特殊字符开头
        if (/^[^a-zA-Z]/.test(normalized)) {
            normalized = `element_${normalized}`;
        }
        return normalized;
    }
    /**
     * 将文本内容包装在CDATA中
     * @param xml XML字符串
     * @returns 处理后的XML字符串
     */
    wrapTextInCdata(xml) {
        // 简单的CDATA包装处理
        // 注意：这是一个简化的实现，实际使用时可能需要更复杂的逻辑
        const textNodeRegex = />([^<]+)</g;
        return xml.replace(textNodeRegex, (match, text) => {
            // 只包装非空且包含特殊字符的文本
            if (text.trim() && /[<>&"']/.test(text)) {
                return `<![CDATA[${text}]]><`;
            }
            return match;
        });
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
            // 检查对象是否包含数组或类似记录的结构
            for (const value of Object.values(data)) {
                if (Array.isArray(value)) {
                    return value.length;
                }
            }
            return 1;
        }
        return 1;
    }
}
exports.TomlToXmlConverter = TomlToXmlConverter;
//# sourceMappingURL=TomlToXmlConverter.js.map