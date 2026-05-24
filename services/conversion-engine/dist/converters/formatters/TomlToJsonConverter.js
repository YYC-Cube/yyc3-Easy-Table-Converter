"use strict";
/**
 * @file TOML到JSON转换器
 * @description 提供TOML格式到JSON/JS格式的转换功能
 * @module converters/formatters/TomlToJsonConverter
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
exports.TomlToJsonConverter = void 0;
const BaseConverter_1 = require("../common/BaseConverter");
/**
 * TOML到JSON转换器类
 */
class TomlToJsonConverter extends BaseConverter_1.BaseConverter {
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
        return ['json', 'js'];
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
            // 导入TOML解析库
            let toml;
            try {
                // 尝试导入@iarna/toml（常用的TOML解析库）
                try {
                    toml = await Promise.resolve().then(() => __importStar(require('@iarna/toml'))).then(m => m.default);
                }
                catch (e) {
                    // 尝试导入toml库作为备选
                    toml = await Promise.resolve().then(() => __importStar(require('toml'))).then(m => m.default);
                }
            }
            catch (importError) {
                throw new Error('缺少TOML依赖，请安装: npm install @iarna/toml 或 npm install toml');
            }
            // 解析TOML字符串
            let parsedData;
            try {
                if (toml.parse) {
                    parsedData = toml.parse(input);
                }
                else {
                    // 适配不同TOML库的API
                    parsedData = toml(input);
                }
            }
            catch (parseError) {
                throw new Error(`TOML解析失败: ${parseError instanceof Error ? parseError.message : '无效的TOML格式'}`);
            }
            // 处理时间戳格式（如果需要）
            if (!options.preserveTimestampFormat) {
                parsedData = this.convertDatesToStrings(parsedData);
            }
            // 根据输出格式决定返回类型
            let output;
            if (options.outputFormat === 'json') {
                output = JSON.stringify(parsedData, null, 2);
            }
            else {
                // 对于js格式，返回JavaScript对象的字符串表示
                output = `module.exports = ${JSON.stringify(parsedData, null, 2)};`;
            }
            const endTime = performance.now();
            return this.createResult({
                output,
                outputFormat: options.outputFormat,
                inputFormat: options.inputFormat,
                processingTimeMs: endTime - startTime,
                recordCount: this.countRecords(parsedData),
                metadata: {
                    originalSize: input.length,
                    convertedSize: output.length,
                    conversionRate: output.length / input.length,
                    tableCount: this.countTables(parsedData)
                }
            });
        }
        catch (error) {
            const endTime = performance.now();
            throw this.createError(error instanceof Error ? error.message : 'TOML转换失败', endTime - startTime);
        }
    }
    /**
     * 将日期对象转换为字符串格式
     * @param data 数据对象
     * @returns 转换后的数据对象
     */
    convertDatesToStrings(data) {
        if (!data || typeof data !== 'object')
            return data;
        if (Array.isArray(data)) {
            return data.map(this.convertDatesToStrings.bind(this));
        }
        if (data instanceof Date) {
            return data.toISOString();
        }
        const result = {};
        for (const [key, value] of Object.entries(data)) {
            result[key] = this.convertDatesToStrings(value);
        }
        return result;
    }
    /**
     * 计算记录数量
     * @param data 解析后的数据
     * @returns 记录数量
     */
    countRecords(data) {
        if (!data)
            return 0;
        if (Array.isArray(data))
            return data.length;
        if (typeof data === 'object')
            return Object.keys(data).length;
        return 1;
    }
    /**
     * 计算TOML表格数量
     * @param data 解析后的数据
     * @returns 表格数量
     */
    countTables(data) {
        if (!data || typeof data !== 'object' || Array.isArray(data))
            return 0;
        let count = 0;
        for (const value of Object.values(data)) {
            if (typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
                count += 1 + this.countTables(value);
            }
        }
        return count;
    }
}
exports.TomlToJsonConverter = TomlToJsonConverter;
//# sourceMappingURL=TomlToJsonConverter.js.map