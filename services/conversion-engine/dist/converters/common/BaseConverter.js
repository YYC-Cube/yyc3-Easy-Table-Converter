"use strict";
/**
 * @file 转换器基类
 * @description 提供所有转换器共用的基础功能实现
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-20
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseConverter = void 0;
const logger_1 = require("../../utils/logger");
/**
 * 转换器基类
 */
class BaseConverter {
    constructor(name, description, supportedInputFormats, supportedOutputFormats) {
        this.version = '1.0.0';
        this.supportedInputFormats = [];
        this.supportedOutputFormats = [];
        this.name = name;
        this.description = description;
        this.supportedInputFormats = supportedInputFormats;
        this.supportedOutputFormats = supportedOutputFormats;
    }
    /**
     * 获取支持的输入格式
     */
    getSupportedInputFormats() {
        return [...this.supportedInputFormats];
    }
    /**
     * 获取支持的输出格式
     */
    getSupportedOutputFormats() {
        return [...this.supportedOutputFormats];
    }
    /**
     * 检查是否支持指定的转换
     * @param inputFormat 输入格式
     * @param outputFormat 输出格式
     */
    canConvert(inputFormat, outputFormat) {
        const normalizedInput = this.normalizeFormat(inputFormat);
        const normalizedOutput = this.normalizeFormat(outputFormat);
        return this.supportedInputFormats.includes(normalizedInput) &&
            this.supportedOutputFormats.includes(normalizedOutput);
    }
    /**
     * 获取转换器信息
     */
    getConverterInfo() {
        const supportedConversions = this.generateSupportedConversions();
        return {
            name: this.name,
            description: this.description,
            supportedConversions,
            version: this.version
        };
    }
    /**
     * 标准化格式名称
     * @param format 格式名称
     */
    normalizeFormat(format) {
        if (!format)
            return '';
        return format.toLowerCase().trim();
    }
    /**
     * 生成支持的转换列表
     */
    generateSupportedConversions() {
        const conversions = [];
        for (const input of this.supportedInputFormats) {
            for (const output of this.supportedOutputFormats) {
                if (input !== output) {
                    conversions.push(`${input} -> ${output}`);
                }
            }
        }
        return conversions;
    }
    /**
     * 创建成功的转换结果
     * @param data 转换后的数据
     * @param format 输出格式
     * @param inputFormat 输入格式
     * @param metadata 元数据
     */
    createSuccessResult(data, format, inputFormat, metadata) {
        return {
            success: true,
            data,
            format,
            metadata: {
                originalFormat: inputFormat,
                convertedFormat: format,
                ...metadata
            }
        };
    }
    /**
     * 创建失败的转换结果
     * @param error 错误信息
     */
    createErrorResult(error) {
        return {
            success: false,
            data: Buffer.alloc(0),
            format: '',
            error
        };
    }
    /**
     * 验证输入数据
     * @param inputData 输入数据
     */
    validateInputData(inputData) {
        if (!inputData) {
            return false;
        }
        if (Buffer.isBuffer(inputData) && inputData.length === 0) {
            return false;
        }
        if (typeof inputData === 'string' && inputData.trim() === '') {
            return false;
        }
        return true;
    }
    /**
     * 测量转换性能
     * @param func 要测量的函数
     */
    async measurePerformance(func) {
        const startTime = Date.now();
        try {
            const result = await func();
            const duration = Date.now() - startTime;
            return {
                result,
                duration
            };
        }
        catch (error) {
            logger_1.logger.error('测量性能时发生错误:', error);
            throw error;
        }
    }
}
exports.BaseConverter = BaseConverter;
//# sourceMappingURL=BaseConverter.js.map