"use strict";
/**
 * @file YAML格式化工具
 * @description 实现YAML文件的格式化、优化和标准化功能
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-20
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
exports.YamlFormatter = void 0;
const BaseConverter_1 = require("../common/BaseConverter");
const logger_1 = require("../../utils/logger");
/**
 * YAML格式化工具类
 */
class YamlFormatter extends BaseConverter_1.BaseConverter {
    constructor() {
        super('YAML格式化工具', '对YAML文件进行格式化、优化和标准化处理', ['yaml', 'yml'], ['yaml', 'yml']);
    }
    /**
     * 执行YAML格式化
     * @param inputData YAML输入数据
     * @param inputFormat 输入格式
     * @param outputFormat 输出格式
     * @param options 格式化选项
     */
    async convert(inputData, inputFormat, outputFormat, options = {}) {
        try {
            // 验证输入数据
            if (!this.validateInputData(inputData)) {
                return this.createErrorResult('输入数据为空或无效');
            }
            // 动态导入js-yaml库
            const yaml = await Promise.resolve().then(() => __importStar(require('js-yaml')));
            // 设置默认选项
            const formatOptions = {
                indent: options.indent ?? 2,
                lineWidth: options.lineWidth ?? -1,
                canonical: options.canonical ?? false,
                schema: options.schema ?? 'default',
                strict: options.strict ?? false,
                noRefs: options.noRefs ?? true,
                sortKeys: options.sortKeys ?? false,
                keepComments: options.keepComments ?? false,
                trimTrailingSpaces: options.trimTrailingSpaces ?? true,
                normalizeNewlines: options.normalizeNewlines ?? true,
                validate: options.validate ?? true,
                ...options
            };
            // 将Buffer转换为字符串
            let yamlContent = typeof inputData === 'string' ? inputData : inputData.toString('utf8');
            // 预处理内容（如果需要）
            if (formatOptions.trimTrailingSpaces) {
                yamlContent = this.trimTrailingSpaces(yamlContent);
            }
            if (formatOptions.normalizeNewlines) {
                yamlContent = this.normalizeNewlines(yamlContent);
            }
            // 解析YAML数据
            let parsedData;
            try {
                const schema = this.getSchema(formatOptions.schema);
                parsedData = yaml.load(yamlContent, { schema });
            }
            catch (error) {
                throw new Error(`YAML解析失败: ${error instanceof Error ? error.message : '无效的YAML格式'}`);
            }
            // 验证解析结果
            if (formatOptions.validate && !this.isValidYamlStructure(parsedData)) {
                throw new Error('YAML结构验证失败: 解析结果为空或无效');
            }
            // 执行格式化并测量性能
            const { result: formattedYaml, duration } = await this.measurePerformance(() => {
                return this.formatYaml(parsedData, yaml, formatOptions);
            });
            // 计算统计信息
            const lineCount = formattedYaml.split('\n').length;
            const structureStats = this.analyzeYamlStructure(formattedYaml);
            // 返回成功结果
            return this.createSuccessResult(formattedYaml, outputFormat, inputFormat, {
                size: Buffer.byteLength(formattedYaml),
                lines: lineCount,
                objects: structureStats.objects,
                arrays: structureStats.arrays,
                scalars: structureStats.scalars,
                processingTime: duration
            });
        }
        catch (error) {
            logger_1.logger.error('YAML格式化失败:', error);
            return this.createErrorResult(`格式化失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
    }
    /**
     * 根据名称获取YAML schema
     */
    getSchema(schemaName) {
        const yaml = require('js-yaml');
        switch (schemaName) {
            case 'core':
                return yaml.CORE_SCHEMA;
            case 'json':
                return yaml.JSON_SCHEMA;
            case 'extended':
                return yaml.EXTENDED_SCHEMA;
            case 'fail':
                return yaml.FAILSAFE_SCHEMA;
            case 'safe':
                return yaml.SAFE_SCHEMA;
            default:
                return yaml.DEFAULT_SCHEMA;
        }
    }
    /**
     * 验证YAML结构
     */
    isValidYamlStructure(data) {
        return data !== null && (typeof data === 'object' || Array.isArray(data) || data !== undefined);
    }
    /**
     * 格式化YAML数据
     */
    formatYaml(data, yaml, options) {
        const dumpOptions = {
            indent: options.indent,
            lineWidth: options.lineWidth,
            noRefs: options.noRefs,
            sortKeys: options.sortKeys,
            canonical: options.canonical
        };
        // 应用schema
        const schema = this.getSchema(options.schema);
        dumpOptions.schema = schema;
        try {
            return yaml.dump(data, dumpOptions);
        }
        catch (error) {
            // 如果库格式化失败，使用备用方法
            logger_1.logger.warn('js-yaml格式化失败，尝试备用方法:', error);
            return this.alternativeYamlFormat(data, options);
        }
    }
    /**
     * 备用的YAML格式化方法
     */
    alternativeYamlFormat(data, options) {
        const lines = [];
        this.formatValue('', data, lines, options.indent || 2, 0);
        return lines.join('\n');
    }
    /**
     * 递归格式化YAML值
     */
    formatValue(key, value, lines, indent, level) {
        const indentStr = ' '.repeat(indent * level);
        if (value === null || value === undefined) {
            lines.push(`${indentStr}${key}: null`);
            return;
        }
        if (Array.isArray(value)) {
            if (key) {
                lines.push(`${indentStr}${key}:`);
            }
            if (value.length === 0) {
                if (!key) {
                    lines.push(`${indentStr}[]`);
                }
                return;
            }
            const nestedIndent = ' '.repeat(indent * (level + 1));
            value.forEach((item, index) => {
                if (typeof item === 'object' && item !== null) {
                    lines.push(`${nestedIndent}-`);
                    this.formatValue('', item, lines, indent, level + 2);
                }
                else {
                    lines.push(`${nestedIndent}- ${this.formatScalarValue(item)}`);
                }
            });
        }
        else if (typeof value === 'object') {
            if (key) {
                lines.push(`${indentStr}${key}:`);
            }
            const keys = Object.keys(value);
            if (keys.length === 0) {
                if (!key) {
                    lines.push(`${indentStr}{}`);
                }
                return;
            }
            keys.forEach((k, index) => {
                this.formatValue(k, value[k], lines, indent, key ? level + 1 : level);
            });
        }
        else {
            const formattedValue = this.formatScalarValue(value);
            if (key) {
                lines.push(`${indentStr}${key}: ${formattedValue}`);
            }
            else {
                lines.push(`${indentStr}${formattedValue}`);
            }
        }
    }
    /**
     * 格式化标量值
     */
    formatScalarValue(value) {
        if (typeof value === 'string') {
            // 检查是否需要引号
            if (/[\s:{}[\],&*#?|\-<>=!%@`]/.test(value) || value === '' || /^[0-9]/.test(value)) {
                return `"${value.replace(/"/g, '\\"')}"`;
            }
            return value;
        }
        if (typeof value === 'boolean') {
            return value.toString();
        }
        if (typeof value === 'number') {
            return value.toString();
        }
        return String(value);
    }
    /**
     * 去除行尾空格
     */
    trimTrailingSpaces(content) {
        return content.replace(/\s+$/gm, '');
    }
    /**
     * 标准化换行符
     */
    normalizeNewlines(content) {
        return content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    }
    /**
     * 分析YAML结构统计信息
     */
    analyzeYamlStructure(yamlContent) {
        const lines = yamlContent.split('\n');
        let objects = 0;
        let arrays = 0;
        let scalars = 0;
        lines.forEach(line => {
            const trimmed = line.trim();
            if (trimmed.includes(':') && !trimmed.startsWith('-') && !trimmed.startsWith('#')) {
                objects++;
            }
            if (trimmed.startsWith('-')) {
                arrays++;
            }
            if (/^[^#: \-\[\]{}]+$/.test(trimmed) && trimmed) {
                scalars++;
            }
        });
        return { objects, arrays, scalars };
    }
}
exports.YamlFormatter = YamlFormatter;
//# sourceMappingURL=YamlFormatter.js.map