"use strict";
/**
 * @file Excel到CSV转换器
 * @description 提供Excel(XLSX/XLS)格式到CSV格式的转换功能
 * @module converters/formatters/XlsxToCsvConverter
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
exports.XlsxToCsvConverter = void 0;
const BaseConverter_1 = require("../common/BaseConverter");
/**
 * Excel到CSV转换器类
 */
class XlsxToCsvConverter extends BaseConverter_1.BaseConverter {
    /**
     * 获取支持的输入格式
     * @returns 支持的输入格式数组
     */
    getSupportedInputFormats() {
        return ['xlsx', 'xls'];
    }
    /**
     * 获取支持的输出格式
     * @returns 支持的输出格式数组
     */
    getSupportedOutputFormats() {
        return ['csv'];
    }
    /**
     * 执行实际的转换操作
     * @param input 输入的Excel文件数据（base64编码或Buffer）
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
            // 导入xlsx库
            let XLSX;
            try {
                XLSX = await Promise.resolve().then(() => __importStar(require('xlsx'))).then(m => m.default);
            }
            catch (importError) {
                throw new Error('缺少xlsx依赖，请安装: npm install xlsx');
            }
            // 将输入转换为工作簿对象
            // 假设输入是base64编码的字符串
            let workbook;
            try {
                // 尝试从base64字符串解析
                const buffer = Buffer.from(input, 'base64');
                workbook = XLSX.read(buffer, { type: 'buffer' });
            }
            catch (parseError) {
                throw new Error(`Excel文件解析失败: ${parseError instanceof Error ? parseError.message : '无效的Excel文件格式'}`);
            }
            // 选择工作表
            let worksheet;
            if (typeof options.sheetIndex === 'string') {
                // 按名称选择工作表
                worksheet = workbook.Sheets[options.sheetIndex];
                if (!worksheet) {
                    throw new Error(`找不到名称为 "${options.sheetIndex}" 的工作表`);
                }
            }
            else {
                // 按索引选择工作表
                const sheetName = workbook.SheetNames[options.sheetIndex ?? 0];
                if (!sheetName) {
                    throw new Error('找不到指定索引的工作表');
                }
                worksheet = workbook.Sheets[sheetName];
            }
            // 将工作表转换为CSV
            const csvOutput = XLSX.utils.sheet_to_csv(worksheet, {
                FS: options.delimiter ?? ',',
                header: options.includeHeader !== false, // 默认包含头部
                skipEmptyRows: options.skipEmptyRows ?? true
            });
            // 应用行数限制
            let finalCsv = csvOutput;
            if (options.maxRows) {
                const lines = csvOutput.split(/\r?\n/);
                const headerLines = options.includeHeader !== false ? 1 : 0;
                const maxLines = headerLines + options.maxRows;
                if (lines.length > maxLines) {
                    finalCsv = lines.slice(0, maxLines).join('\n');
                }
            }
            // 如果需要，手动处理字段引用
            if (options.quoteFields) {
                finalCsv = this.quoteAllFields(finalCsv, options.delimiter ?? ',');
            }
            const endTime = performance.now();
            // 计算记录数（减去可能的表头行）
            const lines = finalCsv.split(/\r?\n/).filter(line => line.trim() !== '');
            const recordCount = options.includeHeader !== false && lines.length > 0
                ? lines.length - 1
                : lines.length;
            return this.createResult({
                output: finalCsv,
                outputFormat: options.outputFormat,
                inputFormat: options.inputFormat,
                processingTimeMs: endTime - startTime,
                recordCount: recordCount,
                metadata: {
                    originalSize: input.length,
                    convertedSize: finalCsv.length,
                    conversionRate: finalCsv.length / input.length,
                    sheetName: typeof options.sheetIndex === 'string' ? options.sheetIndex : workbook.SheetNames[options.sheetIndex ?? 0],
                    hasHeader: options.includeHeader !== false,
                    lineCount: lines.length
                }
            });
        }
        catch (error) {
            const endTime = performance.now();
            throw this.createError(error instanceof Error ? error.message : 'Excel到CSV转换失败', endTime - startTime);
        }
    }
    /**
     * 引用所有CSV字段
     * @param csv CSV字符串
     * @param delimiter 分隔符
     * @returns 所有字段都被引号包围的CSV字符串
     */
    quoteAllFields(csv, delimiter) {
        const lines = csv.split(/\r?\n/);
        const quotedLines = lines.map(line => {
            const fields = line.split(delimiter);
            const quotedFields = fields.map(field => {
                // 如果字段已经被引号包围，先移除它们
                const trimmedField = field.trim();
                const cleanField = trimmedField.startsWith('"') && trimmedField.endsWith('"')
                    ? trimmedField.substring(1, trimmedField.length - 1)
                    : trimmedField;
                // 转义内部的引号
                const escapedField = cleanField.replace(/"/g, '""');
                // 添加引号
                return `"${escapedField}"`;
            });
            return quotedFields.join(delimiter);
        });
        return quotedLines.join('\n');
    }
}
exports.XlsxToCsvConverter = XlsxToCsvConverter;
//# sourceMappingURL=XlsxToCsvConverter.js.map