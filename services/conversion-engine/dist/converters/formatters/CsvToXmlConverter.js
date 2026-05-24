"use strict";
/**
 * @file CSV到XML转换器
 * @description 实现CSV数据到XML格式的转换功能
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-20
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CsvToXmlConverter = void 0;
const BaseConverter_1 = require("../common/BaseConverter");
const stream_1 = require("stream");
const csv_parser_1 = __importDefault(require("csv-parser"));
const xml2js_1 = require("xml2js");
const logger_1 = require("../../utils/logger");
/**
 * CSV到XML转换器类
 */
class CsvToXmlConverter extends BaseConverter_1.BaseConverter {
    constructor() {
        super('CSV到XML转换器', '将CSV格式数据转换为XML格式', ['csv', 'txt'], ['xml', 'svg']);
    }
    /**
     * 执行CSV到XML的转换
     * @param inputData CSV输入数据
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
                delimiter: options.delimiter || ',',
                rootElement: options.rootElement || 'data',
                rowElement: options.rowElement || 'row',
                headers: options.headers,
                skipEmptyLines: options.skipEmptyLines ?? true,
                maxRows: options.maxRows || Infinity,
                xmldec: options.xmldec || { version: '1.0', encoding: 'UTF-8' },
                ...options
            };
            // 执行转换并测量性能
            const { result: xmlContent, duration } = await this.measurePerformance(async () => {
                // 第一步：CSV转JSON
                const csvData = await this.csvToJson(inputData, conversionOptions);
                // 第二步：JSON转XML
                return this.jsonToXml(csvData, conversionOptions);
            });
            // 返回成功结果
            return this.createSuccessResult(xmlContent, outputFormat, inputFormat, {
                size: Buffer.byteLength(xmlContent),
                processingTime: duration
            });
        }
        catch (error) {
            logger_1.logger.error('CSV到XML转换失败:', error);
            return this.createErrorResult(`转换失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
    }
    /**
     * 将CSV数据转换为JSON数组
     * @param csvData CSV数据
     * @param options 转换选项
     */
    async csvToJson(csvData, options) {
        return new Promise((resolve, reject) => {
            const results = [];
            const csvContent = Buffer.isBuffer(csvData) ? csvData.toString('utf8') : csvData;
            const csvStreamOptions = {
                separator: options.delimiter,
                skipEmptyLines: options.skipEmptyLines,
                mapHeaders: ({ header, index }) => {
                    // 如果提供了自定义头部，则使用自定义头部
                    if (options.headers && options.headers[index] !== undefined) {
                        return options.headers[index];
                    }
                    return header.trim();
                }
            };
            // 创建可读流
            const stream = stream_1.Readable.from(csvContent);
            stream
                .pipe((0, csv_parser_1.default)(csvStreamOptions))
                .on('data', (data) => {
                // 检查是否达到最大行数限制
                if (results.length < options.maxRows) {
                    results.push(data);
                }
            })
                .on('end', () => {
                resolve(results);
            })
                .on('error', (error) => {
                reject(error);
            });
        });
    }
    /**
     * 将JSON数组转换为XML字符串
     * @param jsonData JSON数组数据
     * @param options 转换选项
     */
    jsonToXml(jsonData, options) {
        // 构建XML数据结构
        const xmlData = {};
        xmlData[options.rootElement] = {
            [options.rowElement]: jsonData.map(row => {
                // 规范化字段名，确保它们是有效的XML元素名
                const normalizedRow = {};
                Object.keys(row).forEach(key => {
                    let normalizedKey = key;
                    // 替换无效字符
                    normalizedKey = normalizedKey.replace(/[^\w-]/g, '_');
                    // 确保不以数字或特殊字符开头
                    if (!/^[a-zA-Z_]/.test(normalizedKey)) {
                        normalizedKey = `_${normalizedKey}`;
                    }
                    // 处理空值
                    const value = row[key] === null || row[key] === undefined ? '' : row[key];
                    normalizedRow[normalizedKey] = value;
                });
                return normalizedRow;
            })
        };
        // 创建XML构建器
        const builder = new xml2js_1.Builder({
            xmldec: options.xmldec,
            renderOpts: {
                pretty: true,
                indent: '  ',
                newline: '\n'
            },
            explicitRoot: true,
            allowSurrogateChars: true,
            allowEmpty: true
        });
        return builder.buildObject(xmlData);
    }
    /**
     * 验证CSV格式
     * @param csvString CSV字符串
     */
    isValidCsvFormat(csvString) {
        // 简单的CSV格式验证
        return csvString.includes(',') || csvString.includes(';') || csvString.includes('\t');
    }
}
exports.CsvToXmlConverter = CsvToXmlConverter;
//# sourceMappingURL=CsvToXmlConverter.js.map