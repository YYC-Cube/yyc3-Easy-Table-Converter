"use strict";
/**
 * @file XML到JSON转换器
 * @description 实现XML数据到JSON格式的转换功能
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-20
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.XmlToJsonConverter = void 0;
const BaseConverter_1 = require("../common/BaseConverter");
const xml2js_1 = require("xml2js");
const logger_1 = require("../../utils/logger");
/**
 * XML到JSON转换器类
 */
class XmlToJsonConverter extends BaseConverter_1.BaseConverter {
    constructor() {
        super('XML到JSON转换器', '将XML格式数据转换为JSON格式', ['xml', 'svg', 'html', 'xhtml'], ['json', 'js']);
    }
    /**
     * 执行XML到JSON的转换
     * @param inputData XML输入数据
     * @param inputFormat 输入格式
     * @param outputFormat 输出格式
     * @param options 转换选项
     */
    async convert(inputData, inputFormat, outputFormat, options = {}) {
        try {
            // 验证输入数据
            if (!this.validateInputData(inputData)) {
                return this.createErrorResult('输入数据为空或无效');
            }
            // 设置默认选项
            const conversionOptions = {
                explicitArray: options.explicitArray ?? false,
                ignoreAttrs: options.ignoreAttrs ?? false,
                explicitRoot: options.explicitRoot ?? true,
                trim: options.trim ?? true,
                normalize: options.normalize ?? true,
                mergeAttrs: options.mergeAttrs ?? false,
                explicitChildren: options.explicitChildren ?? false,
                ...options
            };
            // 执行转换并测量性能
            const { result: jsonData, duration } = await this.measurePerformance(async () => {
                return await this.xmlToJson(inputData, conversionOptions);
            });
            // 生成输出内容
            let outputContent;
            if (outputFormat === 'json') {
                outputContent = JSON.stringify(jsonData, null, 2);
            }
            else {
                // 对于js格式，返回带有导出语句的代码
                outputContent = `export const data = ${JSON.stringify(jsonData, null, 2)};`;
            }
            // 返回成功结果
            return this.createSuccessResult(outputContent, outputFormat, inputFormat, {
                size: Buffer.byteLength(outputContent),
                processingTime: duration
            });
        }
        catch (error) {
            logger_1.logger.error('XML到JSON转换失败:', error);
            return this.createErrorResult(`转换失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
    }
    /**
     * 将XML数据转换为JSON对象
     * @param xmlData XML数据
     * @param options 转换选项
     */
    async xmlToJson(xmlData, options) {
        return new Promise((resolve, reject) => {
            const xmlString = Buffer.isBuffer(xmlData) ? xmlData.toString('utf8') : xmlData;
            // 验证XML格式
            if (!this.isValidXmlFormat(xmlString)) {
                reject(new Error('无效的XML格式'));
                return;
            }
            // 准备xml2js解析选项
            const parserOptions = {
                explicitArray: options.explicitArray,
                ignoreAttrs: options.ignoreAttrs,
                explicitRoot: options.explicitRoot,
                trim: options.trim,
                normalize: options.normalize,
                mergeAttrs: options.mergeAttrs,
                explicitChildren: options.explicitChildren
            };
            // 解析XML
            (0, xml2js_1.parseString)(xmlString, parserOptions, (err, result) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(result);
            });
        });
    }
    /**
     * 验证XML格式
     * @param xmlString XML字符串
     */
    isValidXmlFormat(xmlString) {
        // 简单的XML格式验证
        // 检查是否包含XML声明或根元素
        const trimmedXml = xmlString.trim();
        return trimmedXml.startsWith('<?xml') ||
            (trimmedXml.startsWith('<') && trimmedXml.endsWith('>')) ||
            trimmedXml.includes('<') && trimmedXml.includes('>');
    }
    /**
     * 格式化XML数据（预处理）
     * @param xmlString XML字符串
     */
    preprocessXml(xmlString) {
        let processedXml = xmlString;
        // 处理可能的BOM字符
        if (processedXml.charCodeAt(0) === 0xFEFF) {
            processedXml = processedXml.substring(1);
        }
        // 确保有根元素（简单处理）
        const trimmedXml = processedXml.trim();
        if (!trimmedXml.startsWith('<') && !trimmedXml.endsWith('>')) {
            processedXml = `<root>${processedXml}</root>`;
        }
        return processedXml;
    }
}
exports.XmlToJsonConverter = XmlToJsonConverter;
//# sourceMappingURL=XmlToJsonConverter.js.map