"use strict";
/**
 * @file HTML到Excel转换器
 * @description 实现HTML表格到Excel文件的转换功能
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
exports.HtmlToXlsxConverter = void 0;
const BaseConverter_1 = require("../common/BaseConverter");
const logger_1 = require("../../utils/logger");
/**
 * HTML到Excel转换器类
 */
class HtmlToXlsxConverter extends BaseConverter_1.BaseConverter {
    constructor() {
        super('HTML到Excel转换器', '将HTML表格转换为Excel文件', ['html'], ['xlsx', 'xls']);
    }
    /**
     * 执行HTML到Excel的转换
     * @param inputData HTML输入数据
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
            const convertOptions = {
                sheetName: options.sheetName ?? 'Sheet1',
                useMultipleSheets: options.useMultipleSheets ?? true,
                includeStyles: options.includeStyles ?? true,
                includeHeaders: options.includeHeaders ?? true,
                headerRowIndex: options.headerRowIndex ?? 0,
                dataRowStartIndex: options.dataRowStartIndex ?? 1,
                includeHiddenRows: options.includeHiddenRows ?? false,
                includeHiddenColumns: options.includeHiddenColumns ?? false,
                tableSelector: options.tableSelector ?? 'table',
                tablesToConvert: options.tablesToConvert ?? [],
                maxTables: options.maxTables ?? 10,
                preserveFormatting: options.preserveFormatting ?? false,
                autoFitColumns: options.autoFitColumns ?? true,
                defaultColumnWidth: options.defaultColumnWidth ?? 15,
                defaultRowHeight: options.defaultRowHeight ?? 18,
                dateFormat: options.dateFormat ?? 'YYYY-MM-DD',
                numberFormat: options.numberFormat ?? '#,##0.00',
                stringFormat: options.stringFormat ?? '@',
                headerBackgroundColor: options.headerBackgroundColor ?? '#4F81BD',
                headerFontColor: options.headerFontColor ?? '#FFFFFF',
                headerFontBold: options.headerFontBold ?? true,
                dataBackgroundColor: options.dataBackgroundColor ?? '#FFFFFF',
                dataFontColor: options.dataFontColor ?? '#000000',
                alternatingRowColors: options.alternatingRowColors ?? true,
                alternatingRowBackgroundColor: options.alternatingRowBackgroundColor ?? '#F2F2F2',
                freezeHeaders: options.freezeHeaders ?? true,
                freezeRows: options.freezeRows ?? 1,
                freezeColumns: options.freezeColumns ?? 0,
                mergeCells: options.mergeCells ?? true,
                includeTableCaptions: options.includeTableCaptions ?? true,
                captionPosition: options.captionPosition ?? 'top',
                convertUrlsToHyperlinks: options.convertUrlsToHyperlinks ?? true,
                convertImages: options.convertImages ?? false,
                imageMaxWidth: options.imageMaxWidth ?? 200,
                imageMaxHeight: options.imageMaxHeight ?? 200,
                skipEmptyRows: options.skipEmptyRows ?? true,
                skipEmptyColumns: options.skipEmptyColumns ?? false,
                detectDataTypes: options.detectDataTypes ?? true,
                trimWhitespace: options.trimWhitespace ?? true,
                removeEmptyTags: options.removeEmptyTags ?? true,
                cellValueProcessor: options.cellValueProcessor ?? ((value) => value),
                rowProcessor: options.rowProcessor ?? ((row) => row),
                columnProcessor: options.columnProcessor ?? ((column) => column),
                includeMetadata: options.includeMetadata ?? true,
                metadataSheetName: options.metadataSheetName ?? 'Metadata',
                includeTableSummary: options.includeTableSummary ?? true,
                forceTextFormat: options.forceTextFormat ?? false,
                customCellStyles: options.customCellStyles ?? true,
                ...options
            };
            // 执行转换并测量性能
            const { result: buffer, duration } = await this.measurePerformance(async () => {
                // 动态导入所需库
                const xlsx = await Promise.resolve().then(() => __importStar(require('xlsx')));
                const { JSDOM } = await Promise.resolve().then(() => __importStar(require('jsdom')));
                // 解析HTML
                const htmlContent = typeof inputData === 'string' ? inputData : inputData.toString();
                const dom = new JSDOM(htmlContent);
                const document = dom.window.document;
                // 创建Excel工作簿
                const workbook = xlsx.utils.book_new();
                // 处理HTML表格
                this.processTables(document, workbook, convertOptions, xlsx);
                // 导出为Buffer
                const outputType = outputFormat === 'xls' ? 'binary' : 'buffer';
                const excelBuffer = xlsx.write(workbook, {
                    type: outputType,
                    bookType: outputFormat === 'xls' ? 'xls' : 'xlsx',
                    cellStyles: convertOptions.includeStyles,
                    cellDates: convertOptions.detectDataTypes
                });
                // 如果是二进制格式，转换为Buffer
                if (outputType === 'binary') {
                    const binary = excelBuffer;
                    const len = binary.length;
                    const buffer = Buffer.alloc(len);
                    for (let i = 0; i < len; i++) {
                        buffer.writeUInt8(binary.charCodeAt(i), i);
                    }
                    return buffer;
                }
                return excelBuffer;
            });
            // 返回成功结果
            return this.createSuccessResult(buffer, outputFormat, inputFormat, {
                size: buffer.length,
                processingTime: duration
            });
        }
        catch (error) {
            logger_1.logger.error('HTML到Excel转换失败:', error);
            return this.createErrorResult(`转换失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
    }
    /**
     * 处理HTML表格
     */
    processTables(document, workbook, options, xlsx) {
        // 获取所有表格
        const tables = Array.from(document.querySelectorAll(options.tableSelector));
        if (tables.length === 0) {
            logger_1.logger.warn('没有找到表格元素');
            return;
        }
        // 确定要转换的表格索引
        const tablesToProcess = this.getTablesToProcess(tables.length, options);
        // 处理每个表格
        let processedTables = 0;
        let sheetIndex = 0;
        tables.forEach((table, tableIndex) => {
            // 检查是否在要处理的表格列表中
            if (!tablesToProcess.includes(tableIndex))
                return;
            // 检查最大表格限制
            if (processedTables >= options.maxTables)
                return;
            // 生成工作表名称
            let sheetName = this.generateSheetName(tableIndex, sheetIndex, options, table);
            // 处理表格数据
            const tableData = this.extractTableData(table, options);
            // 如果表格数据为空且跳过空行，则不创建工作表
            if (tableData.length === 0 || (options.skipEmptyRows && this.isAllRowsEmpty(tableData))) {
                return;
            }
            // 创建工作表
            const worksheet = xlsx.utils.aoa_to_sheet(tableData);
            // 应用样式和格式
            this.applyWorksheetOptions(worksheet, options, tableData);
            // 将工作表添加到工作簿
            xlsx.utils.book_append_sheet(workbook, worksheet, sheetName);
            processedTables++;
            sheetIndex++;
        });
        // 添加元数据工作表
        if (options.includeMetadata && processedTables > 0) {
            this.addMetadataSheet(workbook, tables.length, processedTables, options, xlsx);
        }
    }
    /**
     * 获取要处理的表格索引列表
     */
    getTablesToProcess(tableCount, options) {
        if (options.tablesToConvert && options.tablesToConvert.length > 0) {
            return options.tablesToConvert.filter(index => index >= 0 && index < tableCount);
        }
        // 默认处理所有表格
        return Array.from({ length: Math.min(tableCount, options.maxTables) }, (_, i) => i);
    }
    /**
     * 生成工作表名称
     */
    generateSheetName(tableIndex, sheetIndex, options, table) {
        // 如果只有一个表格，使用指定的工作表名称
        if (!options.useMultipleSheets) {
            return options.sheetName;
        }
        // 尝试从表格标题获取名称
        if (options.includeTableCaptions) {
            const caption = table.querySelector('caption');
            if (caption) {
                const captionText = caption.textContent.trim();
                if (captionText) {
                    // 截断过长的标题，并确保唯一性
                    return this.sanitizeSheetName(`${captionText.substring(0, 20)}${captionText.length > 20 ? '...' : ''}`);
                }
            }
        }
        // 使用索引生成名称
        return this.sanitizeSheetName(`${options.sheetName}${sheetIndex > 0 ? (sheetIndex + 1) : ''}`);
    }
    /**
     * 清理工作表名称（Excel对工作表名称有限制）
     */
    sanitizeSheetName(name) {
        // 移除不允许的字符
        const sanitized = name.replace(/[\\/:*?"<>|]/g, '');
        // 限制长度为31个字符
        return sanitized.substring(0, 31).trim();
    }
    /**
     * 提取表格数据
     */
    extractTableData(table, options) {
        const result = [];
        // 处理表格标题
        if (options.includeTableCaptions && options.captionPosition === 'top') {
            const caption = table.querySelector('caption');
            if (caption) {
                result.push([caption.textContent.trim()]);
            }
        }
        // 处理表头
        const thead = table.querySelector('thead');
        let headers = [];
        if (thead && options.includeHeaders) {
            const headerRow = thead.rows[options.headerRowIndex];
            if (headerRow) {
                headers = Array.from(headerRow.cells).map(cell => this.extractCellValue(cell, options));
                result.push(headers);
            }
        }
        // 处理表格主体
        const tbody = table.querySelector('tbody') || table;
        const rows = Array.from(tbody.rows);
        rows.forEach((row, rowIndex) => {
            // 跳过表头行（如果已经处理过）
            if (thead && rowIndex === options.headerRowIndex)
                return;
            // 检查是否隐藏行
            if (!options.includeHiddenRows && this.isRowHidden(row))
                return;
            // 提取行数据
            const rowData = [];
            let isEmptyRow = true;
            Array.from(row.cells).forEach((cell, colIndex) => {
                // 检查是否隐藏列
                if (!options.includeHiddenColumns && this.isColumnHidden(cell))
                    return;
                // 提取单元格值
                let cellValue = this.extractCellValue(cell, options);
                // 应用单元格值处理器
                cellValue = options.cellValueProcessor(cellValue, rowIndex, colIndex);
                // 检测数据类型
                if (options.detectDataTypes && !options.forceTextFormat) {
                    cellValue = this.detectDataType(cellValue);
                }
                // 处理URL转换为超链接
                if (options.convertUrlsToHyperlinks && typeof cellValue === 'string') {
                    cellValue = this.convertUrlToHyperlink(cellValue);
                }
                rowData.push(cellValue);
                if (cellValue !== null && cellValue !== undefined && cellValue !== '') {
                    isEmptyRow = false;
                }
            });
            // 应用行处理器
            const processedRow = options.rowProcessor(rowData, rowIndex);
            // 检查是否跳过空行
            if (!options.skipEmptyRows || !isEmptyRow) {
                result.push(processedRow);
            }
        });
        // 处理表格标题（底部）
        if (options.includeTableCaptions && options.captionPosition === 'bottom') {
            const caption = table.querySelector('caption');
            if (caption) {
                result.push([caption.textContent.trim()]);
            }
        }
        // 应用列处理器
        if (result.length > 0) {
            const maxColumns = Math.max(...result.map(row => row.length));
            for (let colIndex = 0; colIndex < maxColumns; colIndex++) {
                const columnData = result.map(row => row[colIndex]);
                const processedColumn = options.columnProcessor(columnData, colIndex);
                processedColumn.forEach((value, rowIndex) => {
                    if (rowIndex < result.length) {
                        result[rowIndex][colIndex] = value;
                    }
                });
            }
        }
        // 处理空列
        if (options.skipEmptyColumns && result.length > 0) {
            return this.removeEmptyColumns(result);
        }
        return result;
    }
    /**
     * 提取单元格值
     */
    extractCellValue(cell, options) {
        // 获取单元格文本内容
        let text = cell.textContent || '';
        // 清理空白字符
        if (options.trimWhitespace) {
            text = text.trim();
        }
        // 处理图像
        if (options.convertImages) {
            const img = cell.querySelector('img');
            if (img) {
                // 这里可以添加图像处理逻辑
                // 目前只返回图像alt或src
                return img.alt || img.src || text;
            }
        }
        // 处理链接
        if (options.convertUrlsToHyperlinks) {
            const link = cell.querySelector('a');
            if (link && link.href) {
                return link.href;
            }
        }
        return text;
    }
    /**
     * 检测数据类型
     */
    detectDataType(value) {
        // 尝试解析为数字
        if (!isNaN(Number(value)) && isFinite(Number(value)) && value.trim() !== '') {
            const num = Number(value);
            return Number.isInteger(num) ? num : num;
        }
        // 尝试解析为日期
        const dateFormats = [
            /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/,
            /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/,
            /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})[T\s](\d{1,2}):(\d{2})(?::(\d{2})?)?(?:\.(\d+))?(Z|[+-]\d{2}:?\d{2})?$/
        ];
        for (const format of dateFormats) {
            if (format.test(value)) {
                const date = new Date(value);
                if (!isNaN(date.getTime())) {
                    return date;
                }
            }
        }
        // 默认返回字符串
        return value;
    }
    /**
     * 转换URL为超链接
     */
    convertUrlToHyperlink(text) {
        const urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/;
        if (urlRegex.test(text)) {
            return text; // xlsx库会自动识别URL
        }
        return text;
    }
    /**
     * 检查行是否隐藏
     */
    isRowHidden(row) {
        const style = row.getAttribute('style') || '';
        return style.includes('display: none') || style.includes('visibility: hidden');
    }
    /**
     * 检查列是否隐藏
     */
    isColumnHidden(cell) {
        // 检查单元格样式
        const style = cell.getAttribute('style') || '';
        if (style.includes('display: none') || style.includes('visibility: hidden')) {
            return true;
        }
        // 检查列样式
        let parent = cell.parentElement;
        while (parent) {
            const parentStyle = parent.getAttribute('style') || '';
            if (parentStyle.includes('display: none') || parentStyle.includes('visibility: hidden')) {
                return true;
            }
            parent = parent.parentElement;
        }
        return false;
    }
    /**
     * 检查是否所有行都为空
     */
    isAllRowsEmpty(data) {
        return data.every(row => row.every(cell => cell === null || cell === undefined || cell === ''));
    }
    /**
     * 移除空列
     */
    removeEmptyColumns(data) {
        if (data.length === 0)
            return data;
        const maxColumns = Math.max(...data.map(row => row.length));
        const nonEmptyColumns = [];
        // 找出非空列
        for (let colIndex = 0; colIndex < maxColumns; colIndex++) {
            let isEmpty = true;
            for (const row of data) {
                if (row[colIndex] !== null && row[colIndex] !== undefined && row[colIndex] !== '') {
                    isEmpty = false;
                    break;
                }
            }
            if (!isEmpty) {
                nonEmptyColumns.push(colIndex);
            }
        }
        // 重构数据，只保留非空列
        return data.map(row => nonEmptyColumns.map(colIndex => row[colIndex]));
    }
    /**
     * 应用工作表选项
     */
    applyWorksheetOptions(worksheet, options, data) {
        // 设置默认列宽
        if (options.defaultColumnWidth > 0) {
            worksheet['!cols'] = Array.from({ length: data[0]?.length || 1 }, () => ({
                wch: options.defaultColumnWidth
            }));
        }
        // 设置默认行高
        if (options.defaultRowHeight > 0) {
            worksheet['!rows'] = data.map(() => ({
                hpx: options.defaultRowHeight * 96 / 72 // 转换为像素
            }));
        }
        // 冻结窗格
        if (options.freezeHeaders || (options.freezeRows > 0 || options.freezeColumns > 0)) {
            const freezeRow = options.freezeRows > 0 ? options.freezeRows : (options.includeHeaders ? 1 : 0);
            const freezeCol = options.freezeColumns;
            if (freezeRow > 0 || freezeCol > 0) {
                worksheet['!freeze'] = {
                    xSplit: freezeCol,
                    ySplit: freezeRow,
                    topLeftCell: `${String.fromCharCode(64 + freezeCol + 1)}${freezeRow + 1}`,
                    activePane: 'bottomRight'
                };
            }
        }
        // 应用单元格样式（如果需要）
        if (options.includeStyles && options.customCellStyles) {
            // 这里可以添加更复杂的样式处理
            // 目前主要通过xlsx库的配置来实现基本样式
        }
        // 自动调整列宽
        if (options.autoFitColumns) {
            // xlsx库默认会尝试自动调整列宽
        }
    }
    /**
     * 添加元数据工作表
     */
    addMetadataSheet(workbook, totalTables, processedTables, options, xlsx) {
        const metadata = [
            ['HTML到Excel转换元数据'],
            [],
            ['转换时间', new Date().toISOString()],
            ['原始HTML表格总数', totalTables],
            ['处理的表格数', processedTables],
            ['使用多工作表', options.useMultipleSheets ? '是' : '否'],
            ['包含样式', options.includeStyles ? '是' : '否'],
            ['检测数据类型', options.detectDataTypes ? '是' : '否'],
            ['转换URL为超链接', options.convertUrlsToHyperlinks ? '是' : '否'],
            ['转换图像', options.convertImages ? '是' : '否'],
            ['跳过空行', options.skipEmptyRows ? '是' : '否'],
            ['跳过空列', options.skipEmptyColumns ? '是' : '否'],
            ['日期格式', options.dateFormat],
            ['数字格式', options.numberFormat],
            ['表头背景色', options.headerBackgroundColor],
            ['表头字体色', options.headerFontColor],
            ['表头字体加粗', options.headerFontBold ? '是' : '否'],
            ['自动调整列宽', options.autoFitColumns ? '是' : '否']
        ];
        const metadataSheet = xlsx.utils.aoa_to_sheet(metadata);
        xlsx.utils.book_append_sheet(workbook, metadataSheet, options.metadataSheetName);
    }
}
exports.HtmlToXlsxConverter = HtmlToXlsxConverter;
//# sourceMappingURL=HtmlToXlsxConverter.js.map