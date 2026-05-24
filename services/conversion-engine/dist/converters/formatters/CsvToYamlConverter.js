"use strict";
/**
 * @file CSV到YAML转换器
 * @description 提供CSV格式到YAML格式的转换功能
 * @module converters/formatters/CsvToYamlConverter
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
exports.CsvToYamlConverter = void 0;
const BaseConverter_1 = require("../common/BaseConverter");
/**
 * CSV到YAML转换器类
 */
class CsvToYamlConverter extends BaseConverter_1.BaseConverter {
    /**
     * 获取支持的输入格式
     * @returns 支持的输入格式数组
     */
    getSupportedInputFormats() {
        return ['csv'];
    }
    /**
     * 获取支持的输出格式
     * @returns 支持的输出格式数组
     */
    getSupportedOutputFormats() {
        return ['yaml', 'yml'];
    }
    /**
     * 执行实际的转换操作
     * @param input 输入的CSV字符串
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
            let Papa;
            try {
                // 导入js-yaml库用于YAML序列化
                yaml = await Promise.resolve().then(() => __importStar(require('js-yaml')));
                // 导入papaparse库用于CSV解析
                try {
                    Papa = await Promise.resolve().then(() => __importStar(require('papaparse'))).then(m => m.default);
                }
                catch (e) {
                    Papa = null;
                }
            }
            catch (importError) {
                throw new Error('缺少必要依赖，请安装: npm install js-yaml papaparse');
            }
            // 解析CSV为JavaScript对象
            let records;
            let headers = [];
            if (Papa) {
                // 使用papaparse进行解析
                const parseResult = Papa.parse(input, {
                    delimiter: options.delimiter || ',',
                    header: options.hasHeader !== false,
                    skipEmptyLines: true,
                    transformHeader: (header) => header.trim(),
                    transform: (value, headerName) => {
                        if (!options.autoDetectTypes) {
                            return value === '' ? null : value;
                        }
                        // 自动检测数据类型
                        return this.autoDetectType(value);
                    }
                });
                if (parseResult.errors && parseResult.errors.length > 0) {
                    throw new Error(`CSV解析错误: ${parseResult.errors[0].message}`);
                }
                records = parseResult.data;
                headers = parseResult.meta.fields || [];
            }
            else {
                // 简单的CSV解析实现
                const parseResult = this.simpleCsvParse(input, options);
                records = parseResult.records;
                headers = parseResult.headers;
            }
            // 处理自定义表头
            if (options.headers && options.headers.length > 0) {
                headers = options.headers;
                // 如果已解析的记录是对象数组，需要重新映射
                if (records.length > 0 && typeof records[0] === 'object' && records[0] !== null) {
                    const originalKeys = Object.keys(records[0]);
                    records = records.map(record => {
                        const newRecord = {};
                        originalKeys.forEach((key, index) => {
                            if (index < options.headers.length) {
                                newRecord[options.headers[index]] = record[key];
                            }
                        });
                        return newRecord;
                    });
                }
            }
            // 处理数据格式
            let yamlData;
            if (options.asArray !== false) {
                // 默认转换为对象数组
                yamlData = records;
            }
            else if (options.keyField && records.length > 0) {
                // 转换为嵌套对象，使用指定字段作为键
                yamlData = {};
                records.forEach(record => {
                    if (record[options.keyField] !== undefined && record[options.keyField] !== null) {
                        const key = String(record[options.keyField]);
                        // 创建一个新对象，排除键字段
                        const value = {};
                        Object.entries(record).forEach(([field, val]) => {
                            if (field !== options.keyField) {
                                value[field] = val;
                            }
                        });
                        yamlData[key] = value;
                    }
                });
            }
            else {
                // 如果没有指定keyField，使用索引作为键
                yamlData = {};
                records.forEach((record, index) => {
                    yamlData[`item_${index}`] = record;
                });
            }
            // 移除空值字段（如果需要）
            if (!options.includeEmptyFields) {
                if (Array.isArray(yamlData)) {
                    yamlData = yamlData.map((item) => this.removeEmptyFields(item));
                }
                else if (typeof yamlData === 'object' && yamlData !== null) {
                    for (const [key, value] of Object.entries(yamlData)) {
                        yamlData[key] = this.removeEmptyFields(value);
                    }
                }
            }
            // 设置YAML序列化选项
            const yamlOptions = {};
            if (options.indent && options.indent >= 2) {
                yamlOptions.indent = options.indent;
            }
            // 序列化为YAML字符串
            const yamlOutput = yaml.dump(yamlData, yamlOptions);
            const endTime = performance.now();
            return this.createResult({
                output: yamlOutput,
                outputFormat: options.outputFormat,
                inputFormat: options.inputFormat,
                processingTimeMs: endTime - startTime,
                recordCount: records.length,
                metadata: {
                    originalSize: input.length,
                    convertedSize: yamlOutput.length,
                    conversionRate: yamlOutput.length / input.length,
                    fieldCount: headers.length,
                    yamlStructure: options.asArray !== false ? 'array' : 'object',
                    keyField: options.keyField || 'index'
                }
            });
        }
        catch (error) {
            const endTime = performance.now();
            throw this.createError(error instanceof Error ? error.message : 'CSV到YAML转换失败', endTime - startTime);
        }
    }
    /**
     * 自动检测值的数据类型
     * @param value 字符串值
     * @returns 转换后的值
     */
    autoDetectType(value) {
        if (value === '')
            return null;
        // 尝试解析布尔值
        if (value.toLowerCase() === 'true')
            return true;
        if (value.toLowerCase() === 'false')
            return false;
        // 尝试解析数字
        if (/^\d+$/.test(value))
            return parseInt(value, 10);
        if (/^\d+\.\d+$/.test(value))
            return parseFloat(value);
        // 尝试解析日期
        if (this.isValidDate(value))
            return new Date(value);
        // 默认返回字符串
        return value;
    }
    /**
     * 检查字符串是否为有效日期
     * @param dateString 日期字符串
     * @returns 是否为有效日期
     */
    isValidDate(dateString) {
        const date = new Date(dateString);
        return !isNaN(date.getTime());
    }
    /**
     * 移除对象中的空值字段
     * @param obj 输入对象
     * @returns 移除空值后的对象
     */
    removeEmptyFields(obj) {
        if (Array.isArray(obj)) {
            return obj.map(item => this.removeEmptyFields(item));
        }
        if (typeof obj === 'object' && obj !== null) {
            const result = {};
            for (const [key, value] of Object.entries(obj)) {
                if (value !== null && value !== undefined && value !== '') {
                    result[key] = this.removeEmptyFields(value);
                }
            }
            return result;
        }
        return obj;
    }
    /**
     * 简单的CSV解析实现
     * @param csv CSV字符串
     * @param options 转换选项
     * @returns 解析结果
     */
    simpleCsvParse(csv, options) {
        const delimiter = options.delimiter || ',';
        const lines = csv.split(/\r?\n/).filter(line => line.trim() !== '');
        const records = [];
        let headers = [];
        if (lines.length === 0) {
            return { records, headers };
        }
        // 解析表头
        const firstLine = this.parseCsvLine(lines[0], delimiter);
        if (options.hasHeader !== false) {
            headers = firstLine;
            lines.shift(); // 移除表头行
        }
        else {
            // 如果没有表头，创建默认表头
            headers = Array.from({ length: firstLine.length }, (_, i) => `field_${i + 1}`);
        }
        // 解析数据行
        for (const line of lines) {
            const values = this.parseCsvLine(line, delimiter);
            const record = {};
            values.forEach((value, index) => {
                if (index < headers.length) {
                    record[headers[index]] = options.autoDetectTypes ? this.autoDetectType(value) : value;
                }
            });
            records.push(record);
        }
        return { records, headers };
    }
    /**
     * 解析单行CSV数据
     * @param line CSV行
     * @param delimiter 分隔符
     * @returns 字段数组
     */
    parseCsvLine(line, delimiter) {
        const result = [];
        let current = '';
        let inQuotes = false;
        let i = 0;
        while (i < line.length) {
            const char = line[i];
            if (char === '"') {
                if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
                    // 处理转义引号
                    current += '"';
                    i += 2;
                }
                else {
                    inQuotes = !inQuotes;
                    i++;
                }
            }
            else if (char === delimiter && !inQuotes) {
                // 分隔符，添加当前字段
                result.push(current.trim());
                current = '';
                i++;
            }
            else {
                // 普通字符
                current += char;
                i++;
            }
        }
        // 添加最后一个字段
        result.push(current.trim());
        return result;
    }
}
exports.CsvToYamlConverter = CsvToYamlConverter;
//# sourceMappingURL=CsvToYamlConverter.js.map