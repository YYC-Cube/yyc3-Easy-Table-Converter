"use strict";
/**
 * @file Excel到HTML转换器
 * @description 实现Excel文件到HTML表格的转换功能
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
exports.XlsxToHtmlConverter = void 0;
const BaseConverter_1 = require("../common/BaseConverter");
const logger_1 = require("../../utils/logger");
/**
 * Excel到HTML转换器类
 */
class XlsxToHtmlConverter extends BaseConverter_1.BaseConverter {
    constructor() {
        super('Excel到HTML转换器', '将Excel文件转换为格式化的HTML表格', ['xlsx', 'xls', 'xlsm', 'xlsb'], ['html']);
    }
    /**
     * 执行Excel到HTML的转换
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
            // 设置默认选项
            const convertOptions = {
                includeHtmlWrapper: options.includeHtmlWrapper ?? true,
                includeHead: options.includeHead ?? true,
                includeBody: options.includeBody ?? true,
                title: options.title ?? 'Excel to HTML',
                css: options.css ?? this.getDefaultCss(),
                prettyPrint: options.prettyPrint ?? true,
                includeAllSheets: options.includeAllSheets ?? false,
                sheetNames: options.sheetNames ?? [],
                sheetIndices: options.sheetIndices ?? [],
                tableClassName: options.tableClassName ?? 'excel-table',
                headerRowClassName: options.headerRowClassName ?? 'excel-header-row',
                headerCellClassName: options.headerCellClassName ?? 'excel-header-cell',
                rowClassName: options.rowClassName ?? 'excel-row',
                cellClassName: options.cellClassName ?? 'excel-cell',
                alternateRowClassName: options.alternateRowClassName ?? 'excel-row-alternate',
                maxRows: options.maxRows ?? 1000,
                limitRows: options.limitRows ?? false,
                showSheetNames: options.showSheetNames ?? true,
                showRowNumbers: options.showRowNumbers ?? false,
                showColumnHeaders: options.showColumnHeaders ?? true,
                mergeCells: options.mergeCells ?? true,
                preserveFormatting: options.preserveFormatting ?? true,
                formatDates: options.formatDates ?? true,
                dateFormat: options.dateFormat ?? 'YYYY-MM-DD',
                formatNumbers: options.formatNumbers ?? true,
                numberFormat: options.numberFormat ?? '#,##0.00',
                emptyCellPlaceholder: options.emptyCellPlaceholder ?? '',
                responsive: options.responsive ?? true,
                borderCollapse: options.borderCollapse ?? true,
                includeTableSummary: options.includeTableSummary ?? false,
                tableSummary: options.tableSummary ?? 'Excel数据转换表格',
                includeExcelStatistics: options.includeExcelStatistics ?? true,
                highlightHeaders: options.highlightHeaders ?? true,
                customTableAttributes: options.customTableAttributes ?? {},
                customRowAttributes: options.customRowAttributes ?? (() => ({})),
                customCellAttributes: options.customCellAttributes ?? (() => ({})),
                sheetTitlePrefix: options.sheetTitlePrefix ?? '工作表: ',
                sheetTitleSuffix: options.sheetTitleSuffix ?? '',
                ...options
            };
            // 执行转换并测量性能
            const { result: htmlContent, duration } = await this.measurePerformance(async () => {
                // 动态导入xlsx库
                const xlsx = await Promise.resolve().then(() => __importStar(require('xlsx')));
                // 读取Excel文件
                const workbook = typeof inputData === 'string'
                    ? xlsx.readFile(inputData)
                    : xlsx.read(inputData, { type: 'buffer' });
                // 生成HTML
                return this.excelToHtml(workbook, convertOptions, xlsx);
            });
            // 返回成功结果
            return this.createSuccessResult(htmlContent, outputFormat, inputFormat, {
                size: Buffer.byteLength(htmlContent),
                processingTime: duration
            });
        }
        catch (error) {
            logger_1.logger.error('Excel到HTML转换失败:', error);
            return this.createErrorResult(`转换失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
    }
    /**
     * 获取默认CSS样式
     */
    getDefaultCss() {
        return `
      body {
        font-family: Arial, sans-serif;
        margin: 0;
        padding: 20px;
        background-color: #f5f5f5;
      }
      .excel-table {
        width: 100%;
        border-collapse: collapse;
        background-color: white;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        border-radius: 4px;
        overflow: hidden;
        margin-bottom: 30px;
      }
      .excel-table th,
      .excel-table td {
        padding: 10px 12px;
        text-align: left;
        border: 1px solid #ddd;
      }
      .excel-header-row th {
        background-color: #2196F3;
        color: white;
        font-weight: bold;
      }
      .excel-header-cell {
        white-space: nowrap;
      }
      .excel-row:nth-child(even) {
        background-color: #f8f9fa;
      }
      .excel-row:hover {
        background-color: #e3f2fd;
      }
      .excel-cell {
        vertical-align: top;
      }
      .excel-sheet-title {
        font-size: 18px;
        font-weight: bold;
        color: #333;
        margin: 20px 0 15px 0;
        padding-bottom: 10px;
        border-bottom: 2px solid #2196F3;
      }
      .excel-stats {
        margin-bottom: 20px;
        padding: 15px;
        background-color: #e3f2fd;
        border-radius: 4px;
        font-size: 14px;
      }
      .excel-row-number {
        font-weight: bold;
        color: #666;
        background-color: #f1f1f1 !important;
        text-align: center !important;
        min-width: 50px;
      }
      .excel-merged-cell {
        background-color: #fff3e0;
        font-weight: bold;
      }
      .excel-date-cell {
        color: #e91e63;
      }
      .excel-number-cell {
        text-align: right !important;
        color: #2196f3;
      }
      .excel-empty-cell {
        color: #999;
        font-style: italic;
      }
      /* 响应式设计 */
      @media (max-width: 768px) {
        .excel-table-responsive {
          overflow-x: auto;
          display: block;
        }
      }
    `;
    }
    /**
     * Excel转HTML的核心方法
     */
    excelToHtml(workbook, options, xlsx) {
        // 获取要处理的工作表
        const sheetsToProcess = this.getSheetsToProcess(workbook, options);
        // 构建HTML
        let html = '';
        // 完整HTML包装器
        if (options.includeHtmlWrapper) {
            html += '<!DOCTYPE html>\n';
            html += '<html>\n';
            if (options.includeHead) {
                html += '<head>\n';
                html += `<title>${this.escapeHtml(options.title)}</title>\n`;
                if (options.css) {
                    html += `<style>\n${options.css}\n</style>\n`;
                }
                html += '</head>\n';
            }
            if (options.includeBody) {
                html += '<body>\n';
                // 添加Excel统计信息
                if (options.includeExcelStatistics) {
                    html += this.getExcelStatistics(workbook, sheetsToProcess, options);
                }
                // 处理每个工作表
                sheetsToProcess.forEach((sheetName) => {
                    html += this.processSheet(workbook, sheetName, options, xlsx);
                });
                html += '</body>\n';
            }
            html += '</html>';
        }
        else {
            // 仅返回表格
            sheetsToProcess.forEach((sheetName) => {
                html += this.processSheet(workbook, sheetName, options, xlsx);
            });
        }
        return html;
    }
    /**
     * 获取要处理的工作表列表
     */
    getSheetsToProcess(workbook, options) {
        const sheetNames = workbook.SheetNames;
        const sheetsToProcess = [];
        // 如果指定了工作表名称
        if (options.sheetNames && options.sheetNames.length > 0) {
            options.sheetNames.forEach(sheetName => {
                if (sheetNames.includes(sheetName)) {
                    sheetsToProcess.push(sheetName);
                }
            });
        }
        // 如果指定了工作表索引
        else if (options.sheetIndices && options.sheetIndices.length > 0) {
            options.sheetIndices.forEach(index => {
                if (index >= 0 && index < sheetNames.length) {
                    sheetsToProcess.push(sheetNames[index]);
                }
            });
        }
        // 如果需要所有工作表
        else if (options.includeAllSheets) {
            return [...sheetNames];
        }
        // 默认只处理第一个工作表
        else if (sheetNames.length > 0) {
            sheetsToProcess.push(sheetNames[0]);
        }
        return sheetsToProcess;
    }
    /**
     * 处理单个工作表
     */
    processSheet(workbook, sheetName, options, xlsx) {
        const worksheet = workbook.Sheets[sheetName];
        if (!worksheet)
            return '';
        let html = '';
        // 添加工作表标题
        if (options.showSheetNames) {
            html += `<div class="excel-sheet-title">${options.sheetTitlePrefix}${this.escapeHtml(sheetName)}${options.sheetTitleSuffix}</div>\n`;
        }
        // 获取工作表的数据范围
        const range = xlsx.utils.decode_range(worksheet['!ref'] || 'A1:A1');
        // 准备表格容器
        const containerClass = options.responsive ? 'excel-table-responsive' : '';
        html += `<div class="${containerClass}">\n`;
        // 构建表格属性
        let tableAttributes = `class="${options.tableClassName}" id="excel-table-${this.escapeHtml(sheetName).replace(/\s+/g, '-')}"`;
        if (options.includeTableSummary) {
            tableAttributes += ` summary="${this.escapeHtml(options.tableSummary)}"`;
        }
        if (options.borderCollapse) {
            tableAttributes += ' style="border-collapse: collapse;"';
        }
        // 添加自定义表格属性
        Object.entries(options.customTableAttributes).forEach(([key, value]) => {
            tableAttributes += ` ${key}="${this.escapeHtml(value)}"`;
        });
        html += `<table ${tableAttributes}>`;
        // 获取合并单元格信息
        const mergedCells = worksheet['!merges'] || [];
        // 处理行
        let rowCount = 0;
        for (let rowNum = range.s.r; rowNum <= range.e.r; rowNum++) {
            // 检查行数限制
            if (options.limitRows && rowCount >= options.maxRows)
                break;
            const isHeaderRow = rowNum === range.s.r && options.showColumnHeaders;
            const rowClass = isHeaderRow
                ? `${options.headerRowClassName}`
                : `${options.rowClassName} ${(rowNum - (options.showColumnHeaders ? 0 : 1)) % 2 === 1 ? options.alternateRowClassName : ''}`;
            // 获取自定义行属性
            const customRowAttrs = this.getCustomAttributes(options.customRowAttributes, [], rowNum, sheetName);
            const rowAttributes = `class="${rowClass}" ${customRowAttrs}`;
            html += `<tr ${rowAttributes}>`;
            // 如果需要显示行号
            if (options.showRowNumbers) {
                const rowNumber = options.showColumnHeaders && rowNum === range.s.r ? '#' : (rowNum - range.s.r + 1).toString();
                html += `<th class="excel-row-number" scope="row">${rowNumber}</th>`;
            }
            // 处理列
            for (let colNum = range.s.c; colNum <= range.e.range.s.c; colNum++) {
                const cellAddress = xlsx.utils.encode_cell({ r: rowNum, c: colNum });
                const cell = worksheet[cellAddress];
                // 检查是否是合并单元格的一部分
                const mergeInfo = this.getMergeInfo(mergedCells, rowNum, colNum);
                // 处理单元格内容和样式
                html += this.processCell(cell, rowNum, colNum, mergeInfo, isHeaderRow, options, sheetName);
            }
            html += '</tr>';
            rowCount++;
        }
        html += '</table>\n';
        html += '</div>\n';
        return html;
    }
    /**
     * 处理单个单元格
     */
    processCell(cell, rowNum, colNum, mergeInfo, isHeaderCell, options, sheetName) {
        // 获取单元格值
        let cellValue = cell ? cell.v : null;
        let cellType = cell ? cell.t : 's'; // 默认字符串类型
        // 格式化单元格值
        const formattedValue = this.formatCellValue(cellValue, cellType, options);
        // 确定单元格类
        let cellClass = isHeaderCell
            ? options.headerCellClassName
            : options.cellClassName;
        // 根据数据类型添加额外的类
        if (!isHeaderCell) {
            if (cellType === 'n') {
                cellClass += ' excel-number-cell';
            }
            else if (cellType === 'd') {
                cellClass += ' excel-date-cell';
            }
            else if (formattedValue === '') {
                cellClass += ' excel-empty-cell';
            }
        }
        // 如果是合并单元格
        if (mergeInfo && mergeInfo.isTopLeft) {
            cellClass += ' excel-merged-cell';
        }
        // 获取自定义单元格属性
        const customCellAttrs = this.getCustomAttributes(options.customCellAttributes, formattedValue, rowNum, colNum, sheetName);
        // 构建单元格属性
        let cellAttributes = `class="${cellClass}"`;
        if (isHeaderCell) {
            cellAttributes += ' scope="col"';
        }
        // 添加合并单元格属性
        if (mergeInfo && mergeInfo.isTopLeft && options.mergeCells) {
            cellAttributes += ` rowspan="${mergeInfo.rowspan}" colspan="${mergeInfo.colspan}"`;
        }
        // 添加自定义属性
        cellAttributes += ` ${customCellAttrs}`;
        // 如果不是合并单元格的左上角单元格且启用了合并，则跳过
        if (mergeInfo && !mergeInfo.isTopLeft && options.mergeCells) {
            return '';
        }
        const cellTag = isHeaderCell ? 'th' : 'td';
        return `<${cellTag} ${cellAttributes}>${formattedValue}</${cellTag}>`;
    }
    /**
     * 格式化单元格值
     */
    formatCellValue(value, cellType, options) {
        if (value === null || value === undefined) {
            return options.emptyCellPlaceholder;
        }
        // 处理日期类型
        if (cellType === 'd' && options.formatDates) {
            const date = new Date((value - 25569) * 86400 * 1000);
            if (!isNaN(date.getTime())) {
                return date.toISOString().split('T')[0]; // YYYY-MM-DD 格式
            }
        }
        // 处理数字类型
        if (cellType === 'n' && options.formatNumbers) {
            if (Number.isInteger(value)) {
                return value.toString();
            }
            else {
                return value.toLocaleString();
            }
        }
        // 字符串类型
        if (typeof value === 'string') {
            return this.escapeHtml(value.trim() || options.emptyCellPlaceholder);
        }
        // 布尔类型
        if (typeof value === 'boolean') {
            return value ? 'TRUE' : 'FALSE';
        }
        // 其他类型
        return this.escapeHtml(String(value) || options.emptyCellPlaceholder);
    }
    /**
     * 获取合并单元格信息
     */
    getMergeInfo(mergedCells, rowNum, colNum) {
        for (const merge of mergedCells) {
            if (rowNum >= merge.s.r && rowNum <= merge.e.r && colNum >= merge.s.c && colNum <= merge.e.c) {
                return {
                    isTopLeft: rowNum === merge.s.r && colNum === merge.s.c,
                    rowspan: merge.e.r - merge.s.r + 1,
                    colspan: merge.e.c - merge.s.c + 1
                };
            }
        }
        return null;
    }
    /**
     * 获取自定义属性字符串
     */
    getCustomAttributes(customAttrFunction, ...args) {
        try {
            const attributes = customAttrFunction(...args);
            return Object.entries(attributes)
                .map(([key, value]) => `${key}="${this.escapeHtml(String(value))}"`)
                .join(' ');
        }
        catch (error) {
            logger_1.logger.warn('获取自定义属性时出错:', error);
            return '';
        }
    }
    /**
     * 获取Excel统计信息
     */
    getExcelStatistics(workbook, sheetsToProcess, options) {
        const totalSheets = workbook.SheetNames.length;
        const processedSheets = sheetsToProcess.length;
        return `<div class="excel-stats">\n` +
            `<strong>Excel文件统计信息:</strong><br>\n` +
            `- 总工作表数: ${totalSheets}<br>\n` +
            `- 处理的工作表数: ${processedSheets}<br>\n` +
            `- 日期格式: ${options.formatDates ? options.dateFormat : '禁用'}<br>\n` +
            `- 数字格式: ${options.formatNumbers ? options.numberFormat : '禁用'}<br>\n` +
            `- 响应式表格: ${options.responsive ? '启用' : '禁用'}<br>\n` +
            `</div>\n`;
    }
    /**
     * 转义HTML特殊字符
     */
    escapeHtml(text) {
        if (typeof text !== 'string') {
            text = String(text);
        }
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
}
exports.XlsxToHtmlConverter = XlsxToHtmlConverter;
//# sourceMappingURL=XlsxToHtmlConverter.js.map