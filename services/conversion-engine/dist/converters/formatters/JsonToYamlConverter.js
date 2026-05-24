"use strict";
/**
 * @file JSON到YAML转换器
 * @description 提供JSON格式到YAML格式的转换功能
 * @module converters/formatters/JsonToYamlConverter
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
exports.JsonToYamlConverter = void 0;
const BaseConverter_1 = require("../common/BaseConverter");
/**
 * JSON到YAML转换器类
 */
class JsonToYamlConverter extends BaseConverter_1.BaseConverter {
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
        return ['yaml', 'yml'];
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
            // 导入js-yaml库
            let jsyaml;
            try {
                jsyaml = await Promise.resolve().then(() => __importStar(require('js-yaml'))).then(m => m.default);
            }
            catch (importError) {
                throw new Error('缺少js-yaml依赖，请安装: npm install js-yaml');
            }
            // 准备转储选项
            const dumpOptions = {
                indent: options.indent ?? 2,
                quotingType: options.singleQuote ? "'" : '"',
                noRefs: true, // 避免使用锚点引用
                sortKeys: false, // 保持键的原始顺序
                lineWidth: -1 // 禁用行宽限制
            };
            // 将JavaScript对象转换为YAML
            const yamlOutput = jsyaml.dump(jsonData, dumpOptions);
            const endTime = performance.now();
            return this.createResult({
                output: yamlOutput,
                outputFormat: options.outputFormat,
                inputFormat: options.inputFormat,
                processingTimeMs: endTime - startTime,
                recordCount: this.countRecords(jsonData),
                metadata: {
                    originalSize: input.length,
                    convertedSize: yamlOutput.length,
                    conversionRate: yamlOutput.length / input.length
                }
            });
        }
        catch (error) {
            const endTime = performance.now();
            throw this.createError(error instanceof Error ? error.message : 'JSON到YAML转换失败', endTime - startTime);
        }
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
}
exports.JsonToYamlConverter = JsonToYamlConverter;
//# sourceMappingURL=JsonToYamlConverter.js.map