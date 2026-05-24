"use strict";
/**
 * @file CSV到Excel转换器
 * @description 提供CSV格式到Excel(XLSX)格式的转换功能
 * @module converters/formatters/CsvToXlsxConverter
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
exports.CsvToXlsxConverter = void 0;
const BaseConverter_1 = require("../common/BaseConverter");
/**
 * CSV到Excel转换器类
 */
class CsvToXlsxConverter extends BaseConverter_1.BaseConverter {
    /**
     * 获取支持的输入格式
     * @returns 支持的输入格式数组
     */
    getSupportedInputFormats() {
        return ['csv'];
    }
    /**
     * 获取支持的输出格式
     * @returns 支持的输出格式数组
     */
    getSupportedOutputFormats() {
        return ['xlsx', 'xls'];
    }
    /**
     * 执行实际的转换操作
     * @param input 输入的CSV字符串
     * @param options 转换选项
     * @returns 转换结果对象
     */
    async convert(input, options) {
        const startTime = performance.now();
        try {
            // 验证输入
            if (!input || typeof input !== 'string' || input.trim() === '') {
                throw new Error('输入不能为空');
            }
            // 导入所需库
            let XLSX, Papa;
            try {
                // 导入xlsx库用于Excel文件生成
                XLSX = await Promise.resolve().then(() => __importStar(require('xlsx'))).then(m => m.default);
                // 导入papaparse库用于CSV解析
                try {
                    Papa = await Promise.resolve().then(() => __importStar(require('papaparse'))).then(m => m.default);
                }
                catch (e) {
                    // 如果papaparse不可用，使用简单的CSV解析
                    Papa = null;
                }
            }
            catch (importError) {
                throw new Error('缺少必要依赖，请安装: npm install xlsx papaparse');
            }
            // 解析CSV
            let rows;
            let headers = [];
            if (Papa) {
                // 使用papaparse进行高级解析
                const parseResult = Papa.parse(input, {
                    header: options.hasHeader ?? true,
                    delimiter: options.delimiter ?? ',',
                    skipEmptyLines: true,
                    dynamicTyping: options.autoDetectTypes ?? true
                });
                if (parseResult.errors && parseResult.errors.length > 0) {
                    const errorMessages = parseResult.errors.map(err => err.message).join('; ');
                    throw new Error(`CSV解析错误: ${errorMessages}`);
                }
                rows = parseResult.data;
                headers = parseResult.meta.fields || [];
            }
            else {
                // 简单的CSV解析实现
                rows = this.simpleCsvParse(input, options);
                if (options.hasHeader ?? true && rows.length > 0) {
                    headers = rows[0];
                    rows = rows.slice(1);
                }
            }
            // 应用行数限制
            if (options.maxRows && rows.length > options.maxRows) {
                rows = rows.slice(0, options.maxRows);
            }
            // 创建工作簿
            const workbook = XLSX.utils.book_new();
            // 创建工作表数据
            let worksheetData;
            if (options.hasHeader ?? true && headers.length > 0) {
                // 有表头的情况
                if (Papa && options.hasHeader) {
                    // 如果papaparse已经处理了表头，使用对象数组格式
                    worksheetData = rows;
                }
                else {
                    // 否则使用二维数组格式
                    worksheetData = [headers, ...rows];
                }
            }
            else {
                // 无表头的情况
                worksheetData = rows;
            }
            // 创建工作表
            const worksheet = options.hasHeader && !Papa
                ? XLSX.utils.aoa_to_sheet(worksheetData)
                : XLSX.utils.json_to_sheet(worksheetData);
            // 应用冻结首行
            if (options.freezeFirstRow && (options.hasHeader ?? true)) {
                worksheet['!freeze'] = { s: { r: 1, c: 0 } }; // 冻结第一行以下的所有行
            }
            // 将工作表添加到工作簿
            XLSX.utils.book_append_sheet(workbook, worksheet, options.sheetName || 'Sheet1');
            // 生成Excel文件（返回Buffer）
            const excelBuffer = XLSX.write(workbook, {
                type: 'buffer',
                bookType: 'xlsx'
            });
            const endTime = performance.now();
            // 对于二进制数据，我们返回base64编码的字符串，实际应用中可能需要调整
            return this.createResult({
                output: excelBuffer.toString('base64'),
                outputFormat: options.outputFormat,
                inputFormat: options.inputFormat,
                processingTimeMs: endTime - startTime,
                recordCount: rows.length,
                metadata: {
                    originalSize: input.length,
                    convertedSize: excelBuffer.length,
                    conversionRate: excelBuffer.length / input.length,
                    sheetName: options.sheetName || 'Sheet1',
                    hasHeader: options.hasHeader ?? true,
                    columnCount: headers.length > 0 ? headers.length : (rows[0]?.length || 0)
                },
                isBinary: true
            });
        }
        catch (error) {
            const endTime = performance.now();
            throw this.createError(error instanceof Error ? error.message : 'CSV到Excel转换失败', endTime - startTime);
        }
    }
    /**
     * 简单的CSV解析实现（当papaparse不可用时的备选方案）
     * @param csv CSV字符串
     * @param options 解析选项
     * @returns 解析后的二维数组
     */
    simpleCsvParse(csv, options) {
        const delimiter = options.delimiter ?? ',';
        const lines = csv.split(/\r?\n/).filter(line => line.trim() !== '');
        const result = [];
        for (const line of lines) {
            const row = [];
            let current = '';
            let inQuotes = false;
            let quoteChar = '"';
            for (let i = 0; i < line.length; i++) {
                const char = line[i];
                // 处理引号
                if (char === quoteChar && (i === 0 || line[i - 1] !== '\\')) {
                    inQuotes = !inQuotes;
                }
                // 处理分隔符
                else if (char === delimiter && !inQuotes) {
                    row.push(current.trim());
                    current = '';
                }
                // 处理其他字符
                else {
                    current += char;
                }
            }
            row.push(current.trim());
            result.push(row);
        }
        return result;
    }
}
exports.CsvToXlsxConverter = CsvToXlsxConverter;
//# sourceMappingURL=CsvToXlsxConverter.js.map