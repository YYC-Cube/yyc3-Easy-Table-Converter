"use strict";
/**
 * @file CSV到HTML转换器
 * @description 实现CSV数据到HTML表格的转换功能
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-20
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CsvToHtmlConverter = void 0;
const BaseConverter_1 = require("../common/BaseConverter");
const logger_1 = require("../../utils/logger");
/**
 * CSV到HTML转换器类
 */
class CsvToHtmlConverter extends BaseConverter_1.BaseConverter {
    constructor() {
        super('CSV到HTML转换器', '将CSV数据转换为格式化的HTML表格', ['csv'], ['html']);
    }
    /**
     * 执行CSV到HTML的转换
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
            const convertOptions = {
                delimiter: options.delimiter ?? ',',
                quoteChar: options.quoteChar ?? '"',
                escapeChar: options.escapeChar ?? '"',
                hasHeaders: options.hasHeaders ?? true,
                includeHtmlWrapper: options.includeHtmlWrapper ?? true,
                includeHead: options.includeHead ?? true,
                includeBody: options.includeBody ?? true,
                title: options.title ?? 'CSV to HTML',
                css: options.css ?? this.getDefaultCss(),
                prettyPrint: options.prettyPrint ?? true,
                tableClassName: options.tableClassName ?? 'csv-table',
                headerRowClassName: options.headerRowClassName ?? 'csv-header-row',
                headerCellClassName: options.headerCellClassName ?? 'csv-header-cell',
                rowClassName: options.rowClassName ?? 'csv-row',
                cellClassName: options.cellClassName ?? 'csv-cell',
                alternateRowClassName: options.alternateRowClassName ?? 'csv-row-alternate',
                maxRows: options.maxRows ?? 1000,
                limitRows: options.limitRows ?? false,
                showRowNumbers: options.showRowNumbers ?? false,
                sortableColumns: options.sortableColumns ?? false,
                searchable: options.searchable ?? false,
                pagination: options.pagination ?? false,
                rowsPerPage: options.rowsPerPage ?? 50,
                responsive: options.responsive ?? true,
                borderCollapse: options.borderCollapse ?? true,
                includeTableSummary: options.includeTableSummary ?? false,
                tableSummary: options.tableSummary ?? 'CSV数据转换表格',
                includeCsvStatistics: options.includeCsvStatistics ?? true,
                highlightHeaders: options.highlightHeaders ?? true,
                customTableAttributes: options.customTableAttributes ?? {},
                customRowAttributes: options.customRowAttributes ?? (() => ({})),
                customCellAttributes: options.customCellAttributes ?? (() => ({})),
                ...options
            };
            // 将Buffer转换为字符串
            const csvContent = typeof inputData === 'string' ? inputData : inputData.toString('utf8');
            // 执行转换并测量性能
            const { result: htmlContent, duration } = await this.measurePerformance(() => {
                return this.csvToHtml(csvContent, convertOptions);
            });
            // 解析CSV以获取统计信息
            const rows = this.parseCsv(csvContent, convertOptions.delimiter, convertOptions.quoteChar, convertOptions.escapeChar);
            const headers = convertOptions.hasHeaders && rows.length > 0 ? rows[0] : [];
            const dataRows = convertOptions.hasHeaders && rows.length > 0 ? rows.slice(1) : rows;
            const columnCount = headers.length > 0 ? headers.length : (rows.length > 0 ? rows[0].length : 0);
            // 返回成功结果
            return this.createSuccessResult(htmlContent, outputFormat, inputFormat, {
                size: Buffer.byteLength(htmlContent),
                rows: dataRows.length,
                columns: columnCount,
                totalRows: rows.length,
                hasHeaders: convertOptions.hasHeaders,
                processingTime: duration
            });
        }
        catch (error) {
            logger_1.logger.error('CSV到HTML转换失败:', error);
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
      .csv-table {
        width: 100%;
        border-collapse: collapse;
        background-color: white;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        border-radius: 4px;
        overflow: hidden;
      }
      .csv-table th,
      .csv-table td {
        padding: 12px 15px;
        text-align: left;
        border-bottom: 1px solid #ddd;
      }
      .csv-header-row th {
        background-color: #4CAF50;
        color: white;
        font-weight: bold;
      }
      .csv-header-cell {
        white-space: nowrap;
      }
      .csv-row:nth-child(even) {
        background-color: #f2f2f2;
      }
      .csv-row:hover {
        background-color: #e9f7fe;
      }
      .csv-cell {
        vertical-align: top;
      }
      .csv-stats {
        margin-bottom: 15px;
        padding: 10px;
        background-color: #e8f5e9;
        border-radius: 4px;
        font-size: 14px;
      }
      .csv-pagination {
        margin-top: 15px;
        text-align: center;
      }
      .csv-pagination button {
        padding: 5px 10px;
        margin: 0 3px;
        background-color: #f1f1f1;
        border: 1px solid #ddd;
        border-radius: 3px;
        cursor: pointer;
      }
      .csv-pagination button:hover {
        background-color: #e9e9e9;
      }
      .csv-search {
        margin-bottom: 15px;
        padding: 8px;
        width: 100%;
        box-sizing: border-box;
        border: 1px solid #ddd;
        border-radius: 4px;
      }
      .csv-row-number {
        font-weight: bold;
        color: #666;
      }
      /* 响应式设计 */
      @media (max-width: 768px) {
        .csv-table-responsive {
          overflow-x: auto;
          display: block;
        }
      }
    `;
    }
    /**
     * 解析CSV内容
     */
    parseCsv(csvContent, delimiter, quoteChar, escapeChar) {
        const rows = [];
        let currentRow = [];
        let currentCell = '';
        let inQuotes = false;
        let escaped = false;
        for (let i = 0; i < csvContent.length; i++) {
            const char = csvContent[i];
            if (escaped) {
                currentCell += char;
                escaped = false;
            }
            else if (char === escapeChar && inQuotes) {
                escaped = true;
            }
            else if (char === quoteChar) {
                inQuotes = !inQuotes;
            }
            else if (char === delimiter && !inQuotes) {
                currentRow.push(currentCell);
                currentCell = '';
            }
            else if ((char === '\n' || char === '\r' || char === '\r\n') && !inQuotes) {
                // 处理换行符
                if (char === '\r' && i + 1 < csvContent.length && csvContent[i + 1] === '\n') {
                    i++; // 跳过\n
                }
                currentRow.push(currentCell);
                if (currentRow.length > 0 || currentCell !== '') {
                    rows.push([...currentRow]);
                }
                currentRow = [];
                currentCell = '';
            }
            else {
                currentCell += char;
            }
        }
        // 添加最后一行
        if (currentRow.length > 0 || currentCell !== '') {
            currentRow.push(currentCell);
            rows.push([...currentRow]);
        }
        // 过滤空行
        return rows.filter(row => row.length > 0 && row.some(cell => cell.trim() !== ''));
    }
    /**
     * CSV转HTML的核心方法
     */
    csvToHtml(csvContent, options) {
        // 解析CSV
        const rows = this.parseCsv(csvContent, options.delimiter, options.quoteChar, options.escapeChar);
        // 提取表头和数据
        let headers = [];
        let dataRows = [];
        if (options.hasHeaders && rows.length > 0) {
            headers = rows[0];
            dataRows = rows.slice(1);
        }
        else {
            dataRows = [...rows];
            // 如果没有表头，自动生成表头
            if (dataRows.length > 0) {
                headers = Array.from({ length: dataRows[0].length }, (_, i) => `列 ${i + 1}`);
            }
        }
        // 限制行数
        if (options.limitRows && dataRows.length > options.maxRows) {
            dataRows = dataRows.slice(0, options.maxRows);
        }
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
                // 添加排序功能的JavaScript
                if (options.sortableColumns) {
                    html += this.getSortableScript();
                }
                // 添加搜索功能的JavaScript
                if (options.searchable) {
                    html += this.getSearchScript();
                }
                // 添加分页功能的JavaScript
                if (options.pagination) {
                    html += this.getPaginationScript(options.rowsPerPage);
                }
                html += '</head>\n';
            }
            if (options.includeBody) {
                html += '<body>\n';
                // 添加统计信息
                if (options.includeCsvStatistics) {
                    html += this.getCsvStatistics(dataRows.length, headers.length, options.limitRows ? `(限制为${options.maxRows}行)` : '');
                }
                // 添加搜索框
                if (options.searchable) {
                    html += `<input type="text" id="csv-search" class="csv-search" placeholder="搜索表格内容...">\n`;
                }
                html += '<div class="csv-container">\n';
                html += this.buildTable(headers, dataRows, options);
                html += '</div>\n';
                // 添加分页控件
                if (options.pagination && dataRows.length > options.rowsPerPage) {
                    html += `<div id="csv-pagination" class="csv-pagination"></div>\n`;
                }
                html += '</body>\n';
            }
            html += '</html>';
        }
        else {
            // 仅返回表格
            html = this.buildTable(headers, dataRows, options);
        }
        return html;
    }
    /**
     * 构建HTML表格
     */
    buildTable(headers, dataRows, options) {
        const tableId = 'csv-table';
        const containerClass = options.responsive ? 'csv-table-responsive' : '';
        let html = `<div class="${containerClass}">\n`;
        // 构建表格属性
        let tableAttributes = `class="${options.tableClassName}" id="${tableId}"`;
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
        html += `<table ${tableAttributes};
    }
}
exports.CsvToHtmlConverter = CsvToHtmlConverter;
//# sourceMappingURL=CsvToHtmlConverter.js.map