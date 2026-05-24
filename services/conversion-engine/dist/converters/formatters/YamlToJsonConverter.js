"use strict";
/**
 * @file YAML到JSON转换器
 * @description 提供YAML格式到JSON/JS格式的转换功能
 * @module converters/formatters/YamlToJsonConverter
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
exports.YamlToJsonConverter = void 0;
const BaseConverter_1 = require("../common/BaseConverter");
/**
 * YAML到JSON转换器类
 */
class YamlToJsonConverter extends BaseConverter_1.BaseConverter {
    constructor() {
        super('YAML to JSON Converter', '将YAML格式转换为JSON或JavaScript格式', ['yaml', 'yml'], ['json', 'js']);
    }
    /**
     * 执行实际的转换操作
     * @param inputData 输入的YAML字符串或Buffer
     * @param inputFormat 输入格式
     * @param outputFormat 输出格式
     * @param options 转换选项
     * @returns 转换结果对象
     */
    async convert(inputData, inputFormat, outputFormat, options = {}) {
        const startTime = performance.now();
        try {
            // 验证输入
            if (!this.validateInputData(inputData)) {
                throw new Error('输入不能为空');
            }
            const input = typeof inputData === 'string' ? inputData : inputData.toString('utf8');
            const yamlOptions = options;
            // 导入js-yaml库
            let jsyaml;
            try {
                // 动态导入，避免在不支持的环境中出错
                jsyaml = await Promise.resolve().then(() => __importStar(require('js-yaml'))).then(m => m.default);
            }
            catch (importError) {
                throw new Error('缺少js-yaml依赖，请安装: npm install js-yaml');
            }
            // 准备解析选项
            const parseOptions = {
                strict: yamlOptions.strictMode ?? true,
                schema: yamlOptions.strictMode ? jsyaml.DEFAULT_SCHEMA : jsyaml.FAILSAFE_SCHEMA
            };
            // 解析YAML为JavaScript对象
            const parsedData = jsyaml.load(input, parseOptions);
            // 处理空值情况
            if (parsedData === null && !yamlOptions.preserveNulls) {
                throw new Error('YAML解析结果为空');
            }
            // 根据输出格式决定返回类型
            let output;
            if (outputFormat === 'json') {
                output = JSON.stringify(parsedData, null, 2);
            }
            else {
                // 对于js格式，返回JavaScript对象的字符串表示
                output = `module.exports = ${JSON.stringify(parsedData, null, 2)};`;
            }
            const recordCount = this.countRecords(parsedData);
            const metadata = {
                originalSize: input.length,
                convertedSize: output.length,
                conversionRate: input.length > 0 ? output.length / input.length : 0,
                recordCount,
                processingTimeMs: Date.now() - startTime
            };
            return this.createSuccessResult(output, outputFormat, inputFormat, metadata);
        }
        catch (error) {
            return this.createErrorResult(error instanceof Error ? error.message : 'YAML转换失败');
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
exports.YamlToJsonConverter = YamlToJsonConverter;
//# sourceMappingURL=YamlToJsonConverter.js.map