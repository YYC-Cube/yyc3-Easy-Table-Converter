"use strict";
/**
 * @file Excel(XLSX)到JSON转换器
 * @description 实现Excel数据到JSON格式的转换功能
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
exports.XlsxToJsonConverter = void 0;
const BaseConverter_1 = require("../common/BaseConverter");
const XLSX = __importStar(require("xlsx"));
const logger_1 = require("../../utils/logger");
/**
 * Excel(XLSX)到JSON转换器类
 */
class XlsxToJsonConverter extends BaseConverter_1.BaseConverter {
    constructor() {
        super('Excel到JSON转换器', '将Excel文件数据转换为JSON格式', ['xlsx', 'xls', 'xlsm', 'xlsb'], ['json', 'js']);
    }
    /**
     * 执行Excel到JSON的转换
     * @param inputData Excel输入数据
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
            // 确保输入是Buffer格式
            const workbook = this.readWorkbook(inputData);
            // 设置默认选项
            const conversionOptions = {
                sheetName: options.sheetName,
                sheetIndex: options.sheetIndex ?? 0,
                headerRow: options.headerRow ?? 0,
                range: options.range,
                raw: options.raw ?? false,
                cellDates: options.cellDates ?? true,
                allSheets: options.allSheets ?? false,
                limitRows: options.limitRows || Infinity,
                ...options
            };
            // 执行转换并测量性能
            const { result: jsonData, duration } = await this.measurePerformance(() => {
                return this.excelToJson(workbook, conversionOptions);
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
            // 计算统计信息
            let totalRows = 0;
            if (conversionOptions.allSheets && typeof jsonData === 'object' && jsonData !== null) {
                Object.values(jsonData).forEach((sheetData) => {
                    if (Array.isArray(sheetData)) {
                        totalRows += sheetData.length;
                    }
                });
            }
            else if (Array.isArray(jsonData)) {
                totalRows = jsonData.length;
            }
            // 返回成功结果
            return this.createSuccessResult(outputContent, outputFormat, inputFormat, {
                size: Buffer.byteLength(outputContent),
                rows: totalRows,
                sheets: conversionOptions.allSheets ? Object.keys(jsonData).length : 1,
                processingTime: duration
            });
        }
        catch (error) {
            logger_1.logger.error('Excel到JSON转换失败:', error);
            return this.createErrorResult(`转换失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
    }
    /**
     * 读取Excel工作簿
     * @param data Excel数据
     */
    readWorkbook(data) {
        try {
            if (typeof data === 'string') {
                throw new Error('Excel转换需要二进制数据，请提供文件Buffer');
            }
            return XLSX.read(data, { type: 'buffer', cellDates: true });
        }
        catch (error) {
            throw new Error(`读取Excel文件失败: ${error instanceof Error ? error.message : '无效的Excel文件格式'}`);
        }
    }
    /**
     * 将Excel数据转换为JSON
     * @param workbook Excel工作簿
     * @param options 转换选项
     */
    excelToJson(workbook, options) {
        const xlsxOptions = {
            header: options.headerRow === 0 ? 'A' : options.headerRow + 1,
            raw: options.raw,
            dateNF: options.cellDates ? 'yyyy-mm-dd' : undefined,
            range: options.range
        };
        // 处理所有工作表
        if (options.allSheets) {
            const result = {};
            workbook.SheetNames.forEach(sheetName => {
                const worksheet = workbook.Sheets[sheetName];
                let data = XLSX.utils.sheet_to_json(worksheet, xlsxOptions);
                // 应用行限制
                if (options.limitRows && data.length > options.limitRows) {
                    data = data.slice(0, options.limitRows);
                }
                result[sheetName] = data;
            });
            return result;
        }
        // 处理特定工作表
        let targetSheet;
        if (options.sheetName && workbook.SheetNames.includes(options.sheetName)) {
            targetSheet = options.sheetName;
        }
        else if (options.sheetIndex >= 0 && options.sheetIndex < workbook.SheetNames.length) {
            targetSheet = workbook.SheetNames[options.sheetIndex];
        }
        else {
            // 使用第一个工作表作为默认
            targetSheet = workbook.SheetNames[0];
        }
        const worksheet = workbook.Sheets[targetSheet];
        let data = XLSX.utils.sheet_to_json(worksheet, xlsxOptions);
        // 应用行限制
        if (options.limitRows && data.length > options.limitRows) {
            data = data.slice(0, options.limitRows);
        }
        return data;
    }
    /**
     * 获取Excel工作簿信息
     * @param workbook Excel工作簿
     */
    getWorkbookInfo(workbook) {
        return {
            sheets: workbook.SheetNames,
            sheetCount: workbook.SheetNames.length
        };
    }
    /**
     * 清理Excel数据中的特殊字符
     * @param data 数据对象
     */
    cleanData(data) {
        if (Array.isArray(data)) {
            return data.map(item => this.cleanData(item));
        }
        else if (typeof data === 'object' && data !== null) {
            const result = {};
            Object.keys(data).forEach(key => {
                let value = data[key];
                // 清理字符串值
                if (typeof value === 'string') {
                    value = value.trim();
                }
                // 处理null或undefined
                if (value === null || value === undefined) {
                    value = '';
                }
                result[key] = value;
            });
            return result;
        }
        return data;
    }
}
exports.XlsxToJsonConverter = XlsxToJsonConverter;
//# sourceMappingURL=XlsxToJsonConverter.js.map