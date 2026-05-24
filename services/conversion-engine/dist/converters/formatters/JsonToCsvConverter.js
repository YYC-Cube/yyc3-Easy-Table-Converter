"use strict";
/**
 * @file JSON到CSV转换器
 * @description 实现JSON数据到CSV格式的转换功能
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-20
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsonToCsvConverter = void 0;
const BaseConverter_1 = require("../common/BaseConverter");
const sync_1 = require("csv-stringify/sync");
const logger_1 = require("../../utils/logger");
/**
 * JSON到CSV转换器类
 */
class JsonToCsvConverter extends BaseConverter_1.BaseConverter {
    constructor() {
        super('JSON到CSV转换器', '将JSON格式数据转换为CSV格式', ['json', 'js'], ['csv', 'txt']);
    }
    /**
     * 执行JSON到CSV的转换
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
            // 确保数据是数组格式
            const dataArray = this.ensureArrayFormat(jsonData);
            // 设置默认选项
            const conversionOptions = {
                delimiter: options.delimiter || ',',
                headers: options.headers,
                columns: options.columns,
                quote: options.quote || '"',
                escape: options.escape || '"',
                ltrim: options.ltrim ?? false,
                rtrim: options.rtrim ?? false,
                rowDelimiter: options.rowDelimiter || '\n',
                ...options
            };
            // 执行转换并测量性能
            const { result: csvContent, duration } = await this.measurePerformance(() => {
                return this.jsonToCsv(dataArray, conversionOptions);
            });
            // 返回成功结果
            return this.createSuccessResult(csvContent, outputFormat, inputFormat, {
                size: Buffer.byteLength(csvContent),
                rows: dataArray.length,
                columns: conversionOptions.columns ? conversionOptions.columns.length :
                    (dataArray.length > 0 ? Object.keys(dataArray[0]).length : 0),
                processingTime: duration
            });
        }
        catch (error) {
            logger_1.logger.error('JSON到CSV转换失败:', error);
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
     * 确保数据是数组格式
     * @param data 任意JSON数据
     */
    ensureArrayFormat(data) {
        // 如果已经是数组，直接返回
        if (Array.isArray(data)) {
            return data;
        }
        // 如果是对象，转换为包含单个对象的数组
        if (typeof data === 'object' && data !== null) {
            return [data];
        }
        // 对于其他类型，包装成数组
        return [data];
    }
    /**
     * 将JSON数据转换为CSV字符串
     * @param jsonData JSON数组数据
     * @param options 转换选项
     */
    jsonToCsv(jsonData, options) {
        // 准备CSV配置
        const csvConfig = {
            delimiter: options.delimiter,
            quote: options.quote,
            escape: options.escape,
            ltrim: options.ltrim,
            rtrim: options.rtrim,
            record_delimiter: options.rowDelimiter
        };
        // 如果提供了列名，则使用它们
        if (options.columns && options.columns.length > 0) {
            csvConfig.columns = options.columns;
        }
        // 否则，尝试从数据中自动检测列
        else {
            const allColumns = new Set();
            jsonData.forEach(row => {
                if (typeof row === 'object' && row !== null) {
                    Object.keys(row).forEach(key => allColumns.add(key));
                }
            });
            csvConfig.columns = Array.from(allColumns);
        }
        // 设置CSV头部
        if (options.headers && options.headers.length > 0) {
            // 使用自定义头部
            csvConfig.header = false;
            const headerRow = options.headers.join(options.delimiter);
            const csvContent = (0, sync_1.stringify)(jsonData, csvConfig);
            return `${headerRow}${options.rowDelimiter}${csvContent}`;
        }
        else {
            // 使用列名作为头部
            csvConfig.header = true;
            return (0, sync_1.stringify)(jsonData, csvConfig);
        }
    }
    /**
     * 扁平化嵌套JSON对象
     * @param obj 嵌套对象
     * @param prefix 前缀
     */
    flattenObject(obj, prefix = '') {
        const flattened = {};
        Object.keys(obj).forEach(key => {
            const value = obj[key];
            const newKey = prefix ? `${prefix}.${key}` : key;
            if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                Object.assign(flattened, this.flattenObject(value, newKey));
            }
            else if (Array.isArray(value)) {
                flattened[newKey] = JSON.stringify(value);
            }
            else {
                flattened[newKey] = value;
            }
        });
        return flattened;
    }
}
exports.JsonToCsvConverter = JsonToCsvConverter;
//# sourceMappingURL=JsonToCsvConverter.js.map