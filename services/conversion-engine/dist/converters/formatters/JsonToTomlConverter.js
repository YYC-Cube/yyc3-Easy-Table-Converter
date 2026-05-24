"use strict";
/**
 * @file JSON到TOML转换器
 * @description 提供JSON格式到TOML格式的转换功能
 * @module converters/formatters/JsonToTomlConverter
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
exports.JsonToTomlConverter = void 0;
const BaseConverter_1 = require("../common/BaseConverter");
/**
 * JSON到TOML转换器类
 */
class JsonToTomlConverter extends BaseConverter_1.BaseConverter {
    /**
     * 获取支持的输入格式
     * @returns 支持的输入格式数组
     */
    getSupportedInputFormats() {
        return ['json', 'js'];
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
     * @param input 输入的JSON字符串
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
            // 尝试解析JSON
            let jsonData;
            try {
                // 处理JavaScript模块格式
                if (options.inputFormat === 'js' || input.trim().startsWith('module.exports =')) {
                    // 提取module.exports的值
                    const jsModuleMatch = input.match(/module\.exports\s*=\s*(.+);?/s);
                    if (jsModuleMatch) {
                        // 使用Function构造函数安全地解析简单的JavaScript对象
                        jsonData = new Function(`return ${jsModuleMatch[1]}`)();
                    }
                    else {
                        throw new Error('无效的JavaScript模块格式');
                    }
                }
                else {
                    // 标准JSON解析
                    jsonData = JSON.parse(input);
                }
            }
            catch (parseError) {
                throw new Error(`JSON解析失败: ${parseError instanceof Error ? parseError.message : '无效的JSON格式'}`);
            }
            // 处理日期（如果需要）
            if (options.parseDates) {
                jsonData = this.convertIsoStringsToDates(jsonData);
            }
            // 导入TOML序列化库
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
            // 将JavaScript对象转换为TOML
            let tomlOutput;
            try {
                if (toml.stringify) {
                    // 对于@iarna/toml库
                    tomlOutput = toml.stringify(jsonData);
                }
                else if (toml.encode) {
                    // 对于其他可能的TOML库API
                    tomlOutput = toml.encode(jsonData);
                }
                else {
                    throw new Error('不支持的TOML库API');
                }
            }
            catch (stringifyError) {
                throw new Error(`TOML序列化失败: ${stringifyError instanceof Error ? stringifyError.message : '无法转换为TOML格式'}`);
            }
            const endTime = performance.now();
            return this.createResult({
                output: tomlOutput,
                outputFormat: options.outputFormat,
                inputFormat: options.inputFormat,
                processingTimeMs: endTime - startTime,
                recordCount: this.countRecords(jsonData),
                metadata: {
                    originalSize: input.length,
                    convertedSize: tomlOutput.length,
                    conversionRate: tomlOutput.length / input.length,
                    tableCount: this.countTables(jsonData)
                }
            });
        }
        catch (error) {
            const endTime = performance.now();
            throw this.createError(error instanceof Error ? error.message : 'JSON到TOML转换失败', endTime - startTime);
        }
    }
    /**
     * 将ISO日期字符串转换为Date对象
     * @param data 数据对象
     * @returns 转换后的数据对象
     */
    convertIsoStringsToDates(data) {
        if (!data || typeof data !== 'object')
            return data;
        if (Array.isArray(data)) {
            return data.map(this.convertIsoStringsToDates.bind(this));
        }
        if (typeof data === 'string') {
            // 尝试解析ISO格式的日期字符串
            const dateMatch = data.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?(Z|[+-]\d{2}:\d{2})$/);
            if (dateMatch) {
                const date = new Date(data);
                if (!isNaN(date.getTime())) {
                    return date;
                }
            }
            return data;
        }
        const result = {};
        for (const [key, value] of Object.entries(data)) {
            result[key] = this.convertIsoStringsToDates(value);
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
exports.JsonToTomlConverter = JsonToTomlConverter;
//# sourceMappingURL=JsonToTomlConverter.js.map