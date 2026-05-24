"use strict";
/**
 * @file TOML到Excel转换器
 * @description 实现TOML数据到Excel格式的转换功能
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
exports.TomlToXlsxConverter = void 0;
const BaseConverter_1 = require("../common/BaseConverter");
const logger_1 = require("../../utils/logger");
/**
 * TOML到Excel转换器类
 */
class TomlToXlsxConverter extends BaseConverter_1.BaseConverter {
    constructor() {
        super('TOML到Excel转换器', '将TOML数据转换为Excel文件格式', ['toml'], ['xlsx', 'xls', 'xlsm', 'xlsb']);
    }
    /**
     * 执行TOML到Excel的转换
     * @param inputData TOML输入数据
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
            const toml = await Promise.resolve().then(() => __importStar(require('@iarna/toml')));
            const XLSX = await Promise.resolve().then(() => __importStar(require('xlsx')));
            // 设置默认选项
            const conversionOptions = {
                sheetName: options.sheetName || 'Sheet1',
                autoFitColumns: options.autoFitColumns ?? true,
                flattenTables: options.flattenTables ?? false,
                formatCells: options.formatCells ?? true,
                includeBOM: options.includeBOM ?? false,
                outputType: options.outputType || outputFormat,
                tableNameKey: options.tableNameKey || 'table_name',
                arrayHandling: options.arrayHandling || 'separateSheet',
                ...options
            };
            // 解析TOML数据
            let tomlData;
            try {
                const inputStr = typeof inputData === 'string' ? inputData : inputData.toString('utf8');
                tomlData = toml.parse(inputStr);
            }
            catch (error) {
                throw new Error(`解析TOML数据失败: ${error instanceof Error ? error.message : '无效的TOML格式'}`);
            }
            // 验证数据结构
            if (!tomlData || typeof tomlData !== 'object') {
                throw new Error('TOML数据必须是对象格式');
            }
            // 执行转换并测量性能
            const { result: workbook, duration } = await this.measurePerformance(() => {
                return this.tomlToExcel(tomlData, XLSX, conversionOptions);
            });
            // 生成输出内容
            const outputContent = XLSX.write(workbook, {
                bookType: conversionOptions.outputType,
                type: 'buffer',
                cellDates: true,
                includeBOM: conversionOptions.includeBOM
            });
            // 计算统计信息
            let totalRows = 0;
            let totalColumns = 0;
            // 统计所有工作表的总行数和最大列数
            workbook.SheetNames.forEach(sheetName => {
                const worksheet = workbook.Sheets[sheetName];
                if (worksheet && worksheet['!ref']) {
                    const range = this.decodeRange(worksheet['!ref']);
                    totalRows += range.e.r + 1;
                    totalColumns = Math.max(totalColumns, range.e.c + 1);
                }
            });
            // 返回成功结果
            return this.createSuccessResult(outputContent, outputFormat, inputFormat, {
                size: outputContent.length,
                rows: totalRows,
                columns: totalColumns,
                sheets: workbook.SheetNames.length,
                processingTime: duration
            });
        }
        catch (error) {
            logger_1.logger.error('TOML到Excel转换失败:', error);
            return this.createErrorResult(`转换失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
    }
    /**
     * 将TOML数据转换为Excel工作簿
     * @param tomlData TOML数据
     * @param XLSX xlsx库实例
     * @param options 转换选项
     */
    tomlToExcel(tomlData, XLSX, options) {
        const workbook = XLSX.utils.book_new();
        if (options.flattenTables) {
            // 扁平化模式 - 将所有表合并到一个工作表
            const flattenedData = this.flattenTomlData(tomlData, options.tableNameKey);
            const worksheet = XLSX.utils.json_to_sheet(flattenedData);
            XLSX.utils.book_append_sheet(workbook, worksheet, options.sheetName);
            if (options.autoFitColumns) {
                this.autoFitColumns(worksheet);
            }
        }
        else {
            // 标准模式 - 每个表或数组作为单独的工作表
            this.processTomlTables(tomlData, workbook, XLSX, options, '');
        }
        // 如果没有工作表，创建一个空的
        if (workbook.SheetNames.length === 0) {
            const emptyData = [this.formatObjectForExcel(tomlData)];
            const worksheet = XLSX.utils.json_to_sheet(emptyData);
            XLSX.utils.book_append_sheet(workbook, worksheet, options.sheetName);
        }
        return workbook;
    }
    /**
     * 递归处理TOML表结构
     */
    processTomlTables(data, workbook, XLSX, options, parentPath) {
        Object.entries(data).forEach(([key, value]) => {
            const currentPath = parentPath ? `${parentPath}.${key}` : key;
            if (Array.isArray(value)) {
                this.processTomlArray(key, value, workbook, XLSX, options, currentPath);
            }
            else if (typeof value === 'object' && value !== null) {
                // 检查是否是嵌套表（包含多个字段的对象）
                if (Object.keys(value).length > 0) {
                    // 尝试检测是否是数组的数组（表格数据）
                    if (this.isTableArray(value)) {
                        // 作为表格数据处理
                        const worksheet = XLSX.utils.json_to_sheet(this.convertTableArray(value));
                        XLSX.utils.book_append_sheet(workbook, worksheet, this.truncateSheetName(key));
                        if (options.autoFitColumns) {
                            this.autoFitColumns(worksheet);
                        }
                    }
                    else {
                        // 递归处理嵌套表
                        this.processTomlTables(value, workbook, XLSX, options, currentPath);
                    }
                }
            }
        });
        // 如果当前层级有简单值，创建一个汇总表
        const simpleValues = this.extractSimpleValues(data);
        if (Object.keys(simpleValues).length > 0) {
            const summarySheetName = parentPath || options.sheetName;
            const summaryData = [simpleValues];
            const worksheet = XLSX.utils.json_to_sheet(summaryData);
            XLSX.utils.book_append_sheet(workbook, worksheet, this.truncateSheetName(summarySheetName));
            if (options.autoFitColumns) {
                this.autoFitColumns(worksheet);
            }
        }
    }
    /**
     * 处理TOML数组
     */
    processTomlArray(key, array, workbook, XLSX, options, currentPath) {
        if (array.length === 0)
            return;
        switch (options.arrayHandling) {
            case 'separateSheet':
                // 每个数组作为单独的工作表
                if (this.isObjectArray(array)) {
                    // 对象数组作为表格数据
                    const worksheet = XLSX.utils.json_to_sheet(array.map(item => this.formatObjectForExcel(item)));
                    XLSX.utils.book_append_sheet(workbook, worksheet, this.truncateSheetName(key));
                    if (options.autoFitColumns) {
                        this.autoFitColumns(worksheet);
                    }
                }
                else {
                    // 简单数组作为两列（索引和值）
                    const indexedData = array.map((item, index) => ({
                        index,
                        value: this.formatValueForExcel(item)
                    }));
                    const worksheet = XLSX.utils.json_to_sheet(indexedData);
                    XLSX.utils.book_append_sheet(workbook, worksheet, this.truncateSheetName(key));
                }
                break;
            case 'singleColumn':
                // 在父工作表中作为单列处理（这里简化处理）
                break;
            case 'inline':
            default:
                // 内联处理，这里简化为单独工作表
                const inlineData = [{ [key]: JSON.stringify(array) }];
                const worksheet = XLSX.utils.json_to_sheet(inlineData);
                XLSX.utils.book_append_sheet(workbook, worksheet, this.truncateSheetName(key));
                break;
        }
    }
    /**
     * 扁平化TOML数据
     */
    flattenTomlData(data, tableNameKey) {
        const result = [];
        this.recursiveFlatten(data, {}, result, tableNameKey, '');
        return result;
    }
    /**
     * 递归扁平化数据
     */
    recursiveFlatten(obj, currentRow, result, tableNameKey, path) {
        const keys = Object.keys(obj);
        let hasNestedObjects = false;
        // 先处理所有简单值
        keys.forEach(key => {
            const value = obj[key];
            const fullPath = path ? `${path}.${key}` : key;
            if (typeof value !== 'object' || value === null || value instanceof Date) {
                currentRow[fullPath] = value;
            }
            else {
                hasNestedObjects = true;
            }
        });
        // 如果没有嵌套对象，添加当前行
        if (!hasNestedObjects && keys.length > 0) {
            currentRow[tableNameKey] = path || 'root';
            result.push({ ...currentRow });
        }
        else {
            // 递归处理嵌套对象
            keys.forEach(key => {
                const value = obj[key];
                const fullPath = path ? `${path}.${key}` : key;
                if (typeof value === 'object' && value !== null && !(value instanceof Date)) {
                    if (Array.isArray(value)) {
                        // 处理数组
                        value.forEach((item, index) => {
                            if (typeof item === 'object' && item !== null) {
                                this.recursiveFlatten(item, { ...currentRow, [`${fullPath}[${index}]`]: 'object' }, result, tableNameKey, fullPath);
                            }
                            else {
                                const row = { ...currentRow };
                                row[tableNameKey] = fullPath;
                                row[`${fullPath}[${index}]`] = item;
                                result.push(row);
                            }
                        });
                    }
                    else {
                        // 递归处理嵌套对象
                        this.recursiveFlatten(value, { ...currentRow }, result, tableNameKey, fullPath);
                    }
                }
            });
        }
    }
    /**
     * 自动调整Excel列宽
     */
    autoFitColumns(worksheet) {
        const range = worksheet['!ref'] ? this.decodeRange(worksheet['!ref']) : { s: { r: 0, c: 0 }, e: { r: 0, c: 0 } };
        const colWidths = [];
        // 计算每列的最大宽度
        for (let row = range.s.r; row <= range.e.r; row++) {
            for (let col = range.s.c; col <= range.e.c; col++) {
                const cellAddress = this.encodeCell({ r: row, c: col });
                const cell = worksheet[cellAddress];
                if (cell && cell.v) {
                    const cellLength = String(cell.v).length;
                    colWidths[col] = Math.max(colWidths[col] || 8, cellLength + 2); // 最小宽度8，加2个边距
                }
            }
        }
        // 设置列宽
        if (colWidths.length > 0) {
            worksheet['!cols'] = colWidths.map(width => ({ wch: width }));
        }
    }
    /**
     * 格式化对象以便在Excel中正确显示
     */
    formatObjectForExcel(obj) {
        if (typeof obj !== 'object' || obj === null) {
            return obj;
        }
        const formattedObj = {};
        Object.entries(obj).forEach(([key, value]) => {
            formattedObj[key] = this.formatValueForExcel(value);
        });
        return formattedObj;
    }
    /**
     * 格式化值以便在Excel中正确显示
     */
    formatValueForExcel(value) {
        if (value === null || value === undefined) {
            return '';
        }
        if (value instanceof Date) {
            return value.toISOString();
        }
        if (Array.isArray(value)) {
            return JSON.stringify(value);
        }
        if (typeof value === 'object') {
            return JSON.stringify(value);
        }
        return value;
    }
    /**
     * 检查数组是否包含对象
     */
    isObjectArray(array) {
        return array.some(item => typeof item === 'object' && item !== null && !Array.isArray(item));
    }
    /**
     * 检查是否是表格数组格式
     */
    isTableArray(obj) {
        // 简化检查：如果对象包含数组且数组元素是对象
        return Object.values(obj).some(value => Array.isArray(value) && this.isObjectArray(value));
    }
    /**
     * 转换表格数组格式
     */
    convertTableArray(obj) {
        const result = [];
        Object.entries(obj).forEach(([key, value]) => {
            if (Array.isArray(value)) {
                value.forEach((item, index) => {
                    if (!result[index]) {
                        result[index] = {};
                    }
                    if (typeof item === 'object' && item !== null) {
                        Object.entries(item).forEach(([field, val]) => {
                            result[index][`${key}.${field}`] = val;
                        });
                    }
                    else {
                        result[index][key] = item;
                    }
                });
            }
        });
        return result;
    }
    /**
     * 提取简单值
     */
    extractSimpleValues(data) {
        const result = {};
        Object.entries(data).forEach(([key, value]) => {
            if (typeof value !== 'object' || value === null || value instanceof Date) {
                result[key] = value;
            }
            else if (Array.isArray(value) && value.length > 0 && typeof value[0] !== 'object') {
                // 简单数组也作为简单值处理
                result[key] = JSON.stringify(value);
            }
        });
        return result;
    }
    /**
     * 截断工作表名称（Excel限制为31个字符）
     */
    truncateSheetName(name) {
        return name.length > 31 ? name.substring(0, 28) + '...' : name;
    }
    /**
     * 解码Excel单元格范围
     */
    decodeRange(range) {
        const parts = range.split(':');
        const start = this.decodeCellAddress(parts[0]);
        const end = this.decodeCellAddress(parts[1]);
        return {
            s: start,
            e: end
        };
    }
    /**
     * 解码Excel单元格地址
     */
    decodeCellAddress(address) {
        const colMatch = address.match(/[A-Z]+/);
        const rowMatch = address.match(/[0-9]+/);
        if (!colMatch || !rowMatch) {
            throw new Error(`无效的单元格地址: ${address}`);
        }
        const colStr = colMatch[0];
        const row = parseInt(rowMatch[0], 10) - 1;
        // 解码列字母为数字
        let col = 0;
        for (let i = 0; i < colStr.length; i++) {
            col = col * 26 + (colStr.charCodeAt(i) - 64);
        }
        col -= 1;
        return { r: row, c: col };
    }
    /**
     * 编码Excel单元格坐标
     */
    encodeCell(cell) {
        // 编码列数字为字母
        let colStr = '';
        let col = cell.c + 1;
        while (col > 0) {
            const remainder = (col - 1) % 26;
            colStr = String.fromCharCode(65 + remainder) + colStr;
            col = Math.floor((col - 1) / 26);
        }
        return `${colStr}${cell.r + 1}`;
    }
}
exports.TomlToXlsxConverter = TomlToXlsxConverter;
//# sourceMappingURL=TomlToXlsxConverter.js.map