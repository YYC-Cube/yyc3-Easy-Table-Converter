"use strict";
/**
 * @file JSON到XML转换器
 * @description 实现JSON数据到XML格式的转换功能
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-20
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsonToXmlConverter = void 0;
const BaseConverter_1 = require("../common/BaseConverter");
const xml2js_1 = require("xml2js");
const logger_1 = require("../../utils/logger");
/**
 * JSON到XML转换器类
 */
class JsonToXmlConverter extends BaseConverter_1.BaseConverter {
    constructor() {
        super('JSON到XML转换器', '将JSON格式数据转换为XML格式', ['json', 'js'], ['xml', 'svg']);
    }
    /**
     * 执行JSON到XML的转换
     * @param inputData JSON输入数据
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
            // 解析JSON数据
            const jsonData = this.parseJsonData(inputData);
            // 准备XML数据结构
            const xmlReadyData = this.prepareXmlReadyData(jsonData, options.rootElement);
            // 设置默认选项
            const conversionOptions = {
                rootElement: options.rootElement || 'root',
                xmldec: options.xmldec || { version: '1.0', encoding: 'UTF-8' },
                cdata: options.cdata ?? false,
                headless: options.headless ?? false,
                renderOpts: options.renderOpts || { pretty: true, indent: '  ', newline: '\n' },
                ...options
            };
            // 执行转换并测量性能
            const { result: xmlContent, duration } = await this.measurePerformance(() => {
                return this.jsonToXml(xmlReadyData, conversionOptions);
            });
            // 返回成功结果
            return this.createSuccessResult(xmlContent, outputFormat, inputFormat, {
                size: Buffer.byteLength(xmlContent),
                processingTime: duration
            });
        }
        catch (error) {
            logger_1.logger.error('JSON到XML转换失败:', error);
            return this.createErrorResult(`转换失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
    }
    /**
     * 解析JSON数据
     * @param data JSON数据
     */
    parseJsonData(data) {
        try {
            const jsonString = Buffer.isBuffer(data) ? data.toString('utf8') : data;
            // 检查是否是JavaScript模块格式（包含export语句）
            if (jsonString.trim().startsWith('export')) {
                // 尝试提取JSON部分
                const match = jsonString.match(/export\s+(?:const|let|var)\s+\w+\s*=\s*([\s\S]*?)(?:;|$)/);
                if (match && match[1]) {
                    return JSON.parse(match[1]);
                }
                throw new Error('无法从JavaScript模块中提取JSON数据');
            }
            return JSON.parse(jsonString);
        }
        catch (error) {
            throw new Error(`JSON解析失败: ${error instanceof Error ? error.message : '无效的JSON格式'}`);
        }
    }
    /**
     * 准备XML就绪的数据结构
     * @param jsonData JSON数据
     * @param rootElement 根元素名称
     */
    prepareXmlReadyData(jsonData, rootElement) {
        // 如果数据已经是对象且有明确的根元素，直接使用
        if (typeof jsonData === 'object' && jsonData !== null) {
            // 如果数据不是数组且没有指定根元素，使用默认根元素
            if (!Array.isArray(jsonData) && Object.keys(jsonData).length === 1) {
                return jsonData;
            }
            // 包装在指定的根元素中
            const result = {};
            result[rootElement || 'root'] = jsonData;
            return result;
        }
        // 对于基本类型，包装在根元素中
        const result = {};
        result[rootElement || 'root'] = jsonData;
        return result;
    }
    /**
     * 将JSON数据转换为XML字符串
     * @param jsonData JSON数据
     * @param options 转换选项
     */
    jsonToXml(jsonData, options) {
        const builder = new xml2js_1.Builder({
            xmldec: options.headless ? false : options.xmldec,
            cdata: options.cdata,
            renderOpts: options.renderOpts,
            explicitRoot: true,
            allowSurrogateChars: true,
            allowEmpty: true,
            pretty: options.renderOpts?.pretty ?? true,
            indent: options.renderOpts?.indent ?? '  ',
            newline: options.renderOpts?.newline ?? '\n'
        });
        // 转换为XML字符串
        let xmlString = builder.buildObject(jsonData);
        // 处理特殊情况
        xmlString = this.postProcessXml(xmlString, options);
        return xmlString;
    }
    /**
     * 后处理XML字符串
     * @param xmlString XML字符串
     * @param options 转换选项
     */
    postProcessXml(xmlString, options) {
        // 如果需要移除XML声明
        if (options.headless) {
            xmlString = xmlString.replace(/<\?xml[^>]*\?>\s*/, '');
        }
        return xmlString;
    }
    /**
     * 规范化数据键名，确保它们是有效的XML元素名
     * @param obj 对象
     */
    normalizeKeys(obj) {
        if (Array.isArray(obj)) {
            return obj.map(item => this.normalizeKeys(item));
        }
        else if (typeof obj === 'object' && obj !== null) {
            const result = {};
            Object.keys(obj).forEach(key => {
                // 将无效的XML元素名转换为有效的
                let normalizedKey = key;
                // 替换无效字符
                normalizedKey = normalizedKey.replace(/[^\w-]/g, '_');
                // 确保不以数字或特殊字符开头
                if (!/^[a-zA-Z_]/.test(normalizedKey)) {
                    normalizedKey = `_${normalizedKey}`;
                }
                result[normalizedKey] = this.normalizeKeys(obj[key]);
            });
            return result;
        }
        return obj;
    }
}
exports.JsonToXmlConverter = JsonToXmlConverter;
//# sourceMappingURL=JsonToXmlConverter.js.map