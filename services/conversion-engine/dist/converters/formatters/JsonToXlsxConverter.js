"use strict";
/**
 * @file JSON到Excel(XLSX)转换器
 * @description 实现JSON数据到Excel格式的转换功能
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
exports.JsonToXlsxConverter = void 0;
const BaseConverter_1 = require("../common/BaseConverter");
const XLSX = __importStar(require("xlsx"));
const logger_1 = require("../../utils/logger");
/**
 * JSON到Excel(XLSX)转换器类
 */
class JsonToXlsxConverter extends BaseConverter_1.BaseConverter {
    constructor() {
        super('JSON到Excel转换器', '将JSON格式数据转换为Excel格式', ['json', 'js'], ['xlsx', 'xls']);
    }
    /**
     * 执行JSON到Excel的转换
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
            // 设置默认选项
            const conversionOptions = {
                sheetName: options.sheetName || 'Sheet1',
                headers: options.headers,
                columns: options.columns,
                freezeFirstRow: options.freezeFirstRow ?? true,
                cellDates: options.cellDates ?? true,
                dateFormat: options.dateFormat || 'yyyy-mm-dd',
                writeOpts: options.writeOpts || {},
                ...options
            };
            // 执行转换并测量性能
            const { result: excelBuffer, duration } = await this.measurePerformance(() => {
                return this.jsonToExcel(jsonData, conversionOptions, outputFormat);
            });
            // 计算统计信息
            let rows = 0;
            let columns = 0;
            if (Array.isArray(jsonData)) {
                rows = jsonData.length;
                if (rows > 0) {
                    columns = conversionOptions.columns ? conversionOptions.columns.length : Object.keys(jsonData[0]).length;
                }
            }
            // 返回成功结果
            return this.createSuccessResult(excelBuffer, outputFormat, inputFormat, {
                size: excelBuffer.length,
                rows,
                columns,
                sheets: 1,
                processingTime: duration
            });
        }
        catch (error) {
            logger_1.logger.error('JSON到Excel转换失败:', error);
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
     * 将JSON数据转换为Excel格式
     * @param jsonData JSON数据
     * @param options 转换选项
     * @param outputFormat 输出格式
     */
    jsonToExcel(jsonData, options, outputFormat) {
        // 确保数据是数组格式
        const dataArray = this.prepareDataArray(jsonData, options.columns);
        // 创建工作表
        const worksheet = XLSX.utils.json_to_sheet(dataArray, {
            header: options.columns,
            skipHeader: !options.freezeFirstRow
        });
        // 应用冻结首行
        if (options.freezeFirstRow && dataArray.length > 0) {
            worksheet['!freeze'] = { s: { r: 1, c: 0 } };
        }
        // 应用自定义表头
        if (options.headers && options.headers.length > 0 && options.columns) {
            const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:A1');
            // 设置表头
            for (let i = 0; i < options.headers.length; i++) {
                const cellAddress = XLSX.utils.encode_cell({ r: 0, c: i });
                worksheet[cellAddress] = { v: options.headers[i] };
            }
        }
        // 创建工作簿
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, options.sheetName);
        // 设置写入选项
        const writeOptions = {
            bookType: outputFormat,
            type: 'buffer',
            cellDates: options.cellDates,
            cellStyles: true,
            ...options.writeOpts
        };
        // 写入Excel文件
        return XLSX.write(workbook, writeOptions);
    }
    /**
     * 准备数据数组，确保格式正确
     * @param jsonData JSON数据
     * @param columns 列定义
     */
    prepareDataArray(jsonData, columns) {
        let dataArray = [];
        // 处理数组数据
        if (Array.isArray(jsonData)) {
            dataArray = jsonData;
        }
        // 处理对象数据（转换为单元素数组）
        else if (typeof jsonData === 'object' && jsonData !== null) {
            // 检查是否是嵌套对象结构
            const keys = Object.keys(jsonData);
            // 如果对象的值是数组，可能是多工作表结构
            if (keys.length > 0 && Array.isArray(jsonData[keys[0]])) {
                // 使用第一个工作表的数据
                dataArray = jsonData[keys[0]];
            }
            else {
                // 转换为单元素数组
                dataArray = [jsonData];
            }
        }
        // 处理原始类型（包装成对象）
        else {
            dataArray = [{ value: jsonData }];
        }
        // 如果指定了列，确保每个对象只包含指定的列
        if (columns && columns.length > 0) {
            return dataArray.map(item => {
                const newItem = {};
                columns.forEach(col => {
                    newItem[col] = item[col];
                });
                return newItem;
            });
        }
        return dataArray;
    }
    /**
     * 规范化日期格式
     * @param data 数据对象
     */
    normalizeDates(data, dateFormat) {
        if (Array.isArray(data)) {
            return data.map(item => this.normalizeDates(item, dateFormat));
        }
        else if (typeof data === 'object' && data !== null) {
            const result = {};
            Object.keys(data).forEach(key => {
                let value = data[key];
                // 转换日期字符串为Date对象
                if (typeof value === 'string') {
                    const dateRegex = /^\d{4}-\d{2}-\d{2}/;
                    if (dateRegex.test(value)) {
                        value = new Date(value);
                    }
                }
                result[key] = value;
            });
            return result;
        }
        return data;
    }
}
exports.JsonToXlsxConverter = JsonToXlsxConverter;
//# sourceMappingURL=JsonToXlsxConverter.js.map