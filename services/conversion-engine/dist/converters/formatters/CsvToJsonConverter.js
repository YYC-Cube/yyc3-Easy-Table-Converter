"use strict";
/**
 * @file CSV到JSON转换器
 * @description 实现CSV数据到JSON格式的转换功能
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-20
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CsvToJsonConverter = void 0;
const BaseConverter_1 = require("../common/BaseConverter");
const stream_1 = require("stream");
const csv_parser_1 = __importDefault(require("csv-parser"));
const logger_1 = require("../../utils/logger");
/**
 * CSV到JSON转换器类
 */
class CsvToJsonConverter extends BaseConverter_1.BaseConverter {
    constructor() {
        super('CSV到JSON转换器', '将CSV格式数据转换为JSON格式', ['csv', 'txt'], ['json', 'js']);
    }
    /**
     * 执行CSV到JSON的转换
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
                headers: options.headers,
                skipEmptyLines: options.skipEmptyLines ?? true,
                maxRows: options.maxRows || Infinity,
                parseNumbers: options.parseNumbers ?? false,
                ...options
            };
            // 执行转换并测量性能
            const { result: jsonData, duration } = await this.measurePerformance(async () => {
                return await this.csvToJson(inputData, conversionOptions);
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
                rows: Array.isArray(jsonData) ? jsonData.length : Object.keys(jsonData).length,
                processingTime: duration
            });
        }
        catch (error) {
            logger_1.logger.error('CSV到JSON转换失败:', error);
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
                },
                mapValues: ({ value }) => {
                    // 如果启用了数字解析
                    if (options.parseNumbers) {
                        const numValue = Number(value);
                        if (!isNaN(numValue) && value.trim() !== '') {
                            return numValue;
                        }
                    }
                    return value;
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
     * 验证CSV数据格式
     * @param data CSV数据
     */
    isValidCsvFormat(data) {
        // 简单的CSV格式验证：检查是否包含逗号（默认分隔符）
        // 实际应用中可能需要更复杂的验证逻辑
        return data.includes(',') || data.includes(';') || data.includes('\t');
    }
}
exports.CsvToJsonConverter = CsvToJsonConverter;
//# sourceMappingURL=CsvToJsonConverter.js.map