"use strict";
/**
 * @file Excel到TOML转换器
 * @description 实现Excel数据到TOML格式的转换功能
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
exports.XlsxToTomlConverter = void 0;
const BaseConverter_1 = require("../common/BaseConverter");
const logger_1 = require("../../utils/logger");
/**
 * Excel到TOML转换器类
 */
class XlsxToTomlConverter extends BaseConverter_1.BaseConverter {
    constructor() {
        super('Excel到TOML转换器', '将Excel文件数据转换为TOML格式', ['xlsx', 'xls', 'xlsm', 'xlsb'], ['toml']);
    }
    /**
     * 执行Excel到TOML的转换
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
            // 动态导入必要的库
            const XLSX = await Promise.resolve().then(() => __importStar(require('xlsx')));
            const toml = await Promise.resolve().then(() => __importStar(require('@iarna/toml')));
            // 设置默认选项
            const conversionOptions = {
                sheetName: options.sheetName,
                sheetIndex: options.sheetIndex ?? 0,
                headerRow: options.headerRow ?? 0,
                raw: options.raw ?? false,
                cellDates: options.cellDates ?? true,
                allSheets: options.allSheets ?? false,
                limitRows: options.limitRows || Infinity,
                indent: options.indent ?? 2,
                tablesAsArrays: options.tablesAsArrays ?? false,
                ...options
            };
            // 确保输入是Buffer格式
            let workbook;
            try {
                if (typeof inputData === 'string') {
                    throw new Error('Excel转换需要二进制数据，请提供文件Buffer');
                }
                workbook = XLSX.read(inputData, { type: 'buffer', cellDates: true });
            }
            catch (error) {
                throw new Error(`读取Excel文件失败: ${error instanceof Error ? error.message : '无效的Excel文件格式'}`);
            }
            // 执行转换并测量性能
            const { result: tomlData, duration } = await this.measurePerformance(() => {
                return this.excelToToml(workbook, XLSX, conversionOptions);
            });
            // 生成输出内容
            let outputContent;
            try {
                // 使用@iarna/toml库进行序列化
                outputContent = toml.stringify(tomlData);
            }
            catch (error) {
                // 如果库序列化失败，尝试手动格式化
                outputContent = this.formatTomlContent(tomlData, conversionOptions.indent);
            }
            // 计算统计信息
            let totalRows = 0;
            let tableCount = 0;
            if (conversionOptions.allSheets && typeof tomlData === 'object' && tomlData !== null) {
                tableCount = Object.keys(tomlData).length;
                Object.values(tomlData).forEach((sheetData) => {
                    if (Array.isArray(sheetData)) {
                        totalRows += sheetData.length;
                    }
                });
            }
            else if (Array.isArray(tomlData)) {
                totalRows = tomlData.length;
                tableCount = 1;
            }
            else if (typeof tomlData === 'object' && tomlData !== null) {
                tableCount = 1;
            }
            // 返回成功结果
            return this.createSuccessResult(outputContent, outputFormat, inputFormat, {
                size: Buffer.byteLength(outputContent),
                rows: totalRows,
                tables: tableCount,
                sheets: conversionOptions.allSheets ? tableCount : 1,
                processingTime: duration
            });
        }
        catch (error) {
            logger_1.logger.error('Excel到TOML转换失败:', error);
            return this.createErrorResult(`转换失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
    }
    /**
     * 将Excel数据转换为TOML兼容的数据结构
     * @param workbook Excel工作簿
     * @param XLSX xlsx库实例
     * @param options 转换选项
     */
    excelToToml(workbook, XLSX, options) {
        const xlsxOptions = {
            header: options.headerRow === 0 ? 'A' : options.headerRow + 1,
            raw: options.raw,
            dateNF: options.cellDates ? 'yyyy-mm-dd' : undefined
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
                // 转换数据格式
                result[sheetName] = this.convertDataForToml(data);
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
        // 如果是单一工作表且包含多条记录，可以选择转换为嵌套表格式
        if (data.length > 0 && options.tablesAsArrays) {
            const result = {};
            result[targetSheet] = this.convertDataForToml(data);
            return result;
        }
        return this.convertDataForToml(data);
    }
    /**
     * 将数据转换为TOML兼容的格式
     * @param data 原始数据
     */
    convertDataForToml(data) {
        if (!Array.isArray(data)) {
            return data;
        }
        // 检查是否是单列数据
        if (data.length > 0) {
            const firstRow = data[0];
            const keys = Object.keys(firstRow);
            // 如果只有一个键，且是数字索引键，转换为简单数组
            if (keys.length === 1 && !isNaN(Number(keys[0]))) {
                return data.map(item => this.formatValueForToml(item[keys[0]]));
            }
        }
        // 否则转换为对象数组
        return data.map(row => {
            const formattedRow = {};
            Object.entries(row).forEach(([key, value]) => {
                // 确保键名符合TOML规范
                const validKey = this.sanitizeTomlKey(key);
                formattedRow[validKey] = this.formatValueForToml(value);
            });
            return formattedRow;
        });
    }
    /**
     * 格式化值以便在TOML中正确显示
     * @param value 要格式化的值
     */
    formatValueForToml(value) {
        if (value === null || value === undefined) {
            return '';
        }
        if (value instanceof Date) {
            // 格式化日期为ISO格式
            return value.toISOString();
        }
        if (Array.isArray(value)) {
            // 递归处理数组中的每个元素
            return value.map(item => this.formatValueForToml(item));
        }
        if (typeof value === 'object') {
            // 递归处理对象
            const formattedObj = {};
            Object.entries(value).forEach(([key, val]) => {
                formattedObj[this.sanitizeTomlKey(key)] = this.formatValueForToml(val);
            });
            return formattedObj;
        }
        // 清理字符串值
        if (typeof value === 'string') {
            return value.trim();
        }
        return value;
    }
    /**
     * 清理TOML键名，确保符合规范
     * @param key 原始键名
     */
    sanitizeTomlKey(key) {
        if (!key)
            return 'key';
        // 如果键名包含特殊字符或不是以字母开头，添加引号
        if (!/^[a-zA-Z_]/.test(key) || /[^a-zA-Z0-9_-]/.test(key)) {
            return key; // @iarna/toml库会自动处理引号
        }
        return key;
    }
    /**
     * 手动格式化TOML内容（当库序列化失败时使用）
     * @param data TOML数据
     * @param indent 缩进空格数
     */
    formatTomlContent(data, indent) {
        const indentStr = ' '.repeat(indent);
        const lines = [];
        this.formatTomlValue('', data, lines, indentStr, 0);
        return lines.join('\n');
    }
    /**
     * 递归格式化TOML值
     */
    formatTomlValue(key, value, lines, indentStr, level) {
        const currentIndent = indentStr.repeat(level);
        if (value === null || value === undefined || value === '') {
            if (key) {
                lines.push(`${currentIndent}${key} = ""`);
            }
            return;
        }
        switch (typeof value) {
            case 'string':
                // 对字符串进行适当的转义
                const escapedValue = value
                    .replace(/\\/g, '\\\\')
                    .replace(/"/g, '\\"')
                    .replace(/\n/g, '\\n');
                lines.push(`${currentIndent}${key} = "${escapedValue}"`);
                break;
            case 'number':
                lines.push(`${currentIndent}${key} = ${value}`);
                break;
            case 'boolean':
                lines.push(`${currentIndent}${key} = ${value}`);
                break;
            case 'object':
                if (value instanceof Date) {
                    lines.push(`${currentIndent}${key} = ${value.toISOString()}`);
                }
                else if (Array.isArray(value)) {
                    this.formatArray(key, value, lines, indentStr, level);
                }
                else {
                    this.formatTable(key, value, lines, indentStr, level);
                }
                break;
        }
    }
    /**
     * 格式化TOML数组
     */
    formatArray(key, array, lines, indentStr, level) {
        const currentIndent = indentStr.repeat(level);
        if (array.length === 0) {
            lines.push(`${currentIndent}${key} = []`);
            return;
        }
        // 检查是否所有元素都是简单类型且数组较短
        const isSimpleArray = array.every(item => typeof item !== 'object' || item === null) && array.length <= 5;
        if (isSimpleArray) {
            const elements = array.map(item => {
                if (typeof item === 'string') {
                    return `"${item.replace(/"/g, '\\"')}"`;
                }
                return String(item);
            }).join(', ');
            lines.push(`${currentIndent}${key} = [${elements}]`);
        }
        else {
            // 多行数组
            lines.push(`${currentIndent}${key} = [`);
            array.forEach((item, index) => {
                this.formatTomlValue('', item, lines, indentStr, level + 1);
                if (index < array.length - 1) {
                    lines[lines.length - 1] += ',';
                }
            });
            lines.push(`${currentIndent}]`);
        }
    }
    /**
     * 格式化TOML表
     */
    formatTable(key, table, lines, indentStr, level) {
        const currentIndent = indentStr.repeat(level);
        if (key) {
            // 对于嵌套表，使用[table.key]格式
            if (level === 0) {
                lines.push(`[${key}]`);
            }
            else {
                // 对于多级嵌套，这里简化处理
                lines.push(`${currentIndent}[${key}]`);
            }
        }
        Object.entries(table).forEach(([subKey, value]) => {
            this.formatTomlValue(subKey, value, lines, indentStr, level + 1);
        });
        // 添加空行分隔不同的表
        if (key && Object.keys(table).length > 0) {
            lines.push('');
        }
    }
}
exports.XlsxToTomlConverter = XlsxToTomlConverter;
//# sourceMappingURL=XlsxToTomlConverter.js.map