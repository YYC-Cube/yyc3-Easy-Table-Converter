"use strict";
/**
 * @file HTML到CSV转换器
 * @description 实现HTML表格到CSV数据的转换功能
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-20
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.HtmlToCsvConverter = void 0;
const BaseConverter_1 = require("../common/BaseConverter");
const logger_1 = require("../../utils/logger");
/**
 * HTML到CSV转换器类
 */
class HtmlToCsvConverter extends BaseConverter_1.BaseConverter {
    constructor() {
        super('HTML到CSV转换器', '将HTML表格转换为CSV数据格式', ['html'], ['csv']);
    }
    /**
     * 执行HTML到CSV的转换
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
                delimiter: options.delimiter ?? ',',
                quoteChar: options.quoteChar ?? '"',
                escapeChar: options.escapeChar ?? '"',
                includeHeaders: options.includeHeaders ?? true,
                tableSelector: options.tableSelector ?? 'table',
                ignoreEmptyRows: options.ignoreEmptyRows ?? true,
                ignoreEmptyColumns: options.ignoreEmptyColumns ?? true,
                trimWhitespace: options.trimWhitespace ?? true,
                normalizeNewlines: options.normalizeNewlines ?? true,
                includeAllTables: options.includeAllTables ?? false,
                preferFirstTable: options.preferFirstTable ?? true,
                skipHiddenElements: options.skipHiddenElements ?? true,
                cellProcessor: options.cellProcessor ?? ((cell) => cell),
                maxTables: options.maxTables ?? 10,
                maxRows: options.maxRows ?? 10000,
                maxColumns: options.maxColumns ?? 1000,
                removeHtmlTags: options.removeHtmlTags ?? true,
                preserveComments: options.preserveComments ?? false,
                collapseSpaces: options.collapseSpaces ?? true,
                includeTableCaptions: options.includeTableCaptions ?? false,
                captionPosition: options.captionPosition ?? 'none',
                mergeMultiTables: options.mergeMultiTables ?? false,
                tableSeparator: options.tableSeparator ?? '\n\n---\n\n',
                ...options
            };
            // 将Buffer转换为字符串
            const htmlContent = typeof inputData === 'string' ? inputData : inputData.toString('utf8');
            // 执行转换并测量性能
            const { result: csvContent, duration } = await this.measurePerformance(() => {
                return this.htmlToCsv(htmlContent, convertOptions);
            });
            // 计算统计信息
            const csvLines = csvContent.split(/\r?\n/).filter(line => line.trim() !== '');
            const statistics = this.calculateHtmlToCsvStatistics(htmlContent, csvContent, convertOptions);
            // 返回成功结果
            return this.createSuccessResult(csvContent, outputFormat, inputFormat, {
                size: Buffer.byteLength(csvContent),
                lines: csvLines.length,
                tablesProcessed: statistics.tablesProcessed,
                rows: statistics.rows,
                columns: statistics.columns,
                processingTime: duration
            });
        }
        catch (error) {
            logger_1.logger.error('HTML到CSV转换失败:', error);
            return this.createErrorResult(`转换失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
    }
    /**
     * HTML转CSV的核心方法
     */
    htmlToCsv(htmlContent, options) {
        // 提取表格
        const tables = this.extractTables(htmlContent, options);
        if (tables.length === 0) {
            throw new Error('在HTML中未找到表格元素');
        }
        // 限制表格数量
        const tablesToProcess = tables.slice(0, options.maxTables);
        // 处理每个表格并转换为CSV
        const csvTables = [];
        for (let tableIndex = 0; tableIndex < tablesToProcess.length; tableIndex++) {
            const table = tablesToProcess[tableIndex];
            // 提取表头
            let headers = [];
            if (options.includeHeaders) {
                headers = this.extractHeaders(table, options);
            }
            // 提取数据行
            const rows = this.extractRows(table, options);
            // 限制行数
            const limitedRows = rows.slice(0, options.maxRows);
            // 处理表头和数据，生成CSV
            const csvLines = [];
            // 添加表格标题（如果有）
            if (options.includeTableCaptions && options.captionPosition === 'before') {
                const caption = this.extractTableCaption(table, options);
                if (caption) {
                    csvLines.push(this.escapeCsvField(`表格 ${tableIndex + 1}: ${caption}`));
                    csvLines.push(''); // 空行分隔
                }
            }
            // 添加表头
            if (headers.length > 0) {
                const headerLine = headers
                    .slice(0, options.maxColumns)
                    .map((header, index) => options.cellProcessor?.(this.cleanCellContent(header, options), -1, index) || this.cleanCellContent(header, options))
                    .map(field => this.escapeCsvField(field, options.delimiter, options.quoteChar, options.escapeChar))
                    .join(options.delimiter);
                csvLines.push(headerLine);
            }
            // 添加数据行
            limitedRows.forEach((row, rowIndex) => {
                const csvRow = row
                    .slice(0, options.maxColumns)
                    .map((cell, colIndex) => options.cellProcessor?.(this.cleanCellContent(cell, options), rowIndex, colIndex) || this.cleanCellContent(cell, options))
                    .map(field => this.escapeCsvField(field, options.delimiter, options.quoteChar, options.escapeChar))
                    .join(options.delimiter);
                // 忽略空行
                if (!options.ignoreEmptyRows || csvRow.trim().length > 0) {
                    csvLines.push(csvRow);
                }
            });
            // 添加表格标题（如果在后面）
            if (options.includeTableCaptions && options.captionPosition === 'after') {
                const caption = this.extractTableCaption(table, options);
                if (caption) {
                    csvLines.push(''); // 空行分隔
                    csvLines.push(this.escapeCsvField(`表格 ${tableIndex + 1}: ${caption}`));
                }
            }
            // 如果有内容，添加到结果中
            if (csvLines.length > 0) {
                csvTables.push(csvLines.join('\n'));
            }
            // 如果只需要第一个表格，提前退出
            if (options.preferFirstTable && tableIndex === 0) {
                break;
            }
        }
        // 合并多个表格
        if (options.mergeMultiTables) {
            // 如果要合并，返回所有表格内容的合并结果
            // 这里简单地用空行分隔，实际合并逻辑可能需要更复杂的处理
            return csvTables.join('\n\n');
        }
        else {
            // 返回分隔的表格
            return csvTables.join(options.tableSeparator);
        }
    }
    /**
     * 从HTML中提取表格
     */
    extractTables(htmlContent, options) {
        const tables = [];
        // 使用正则表达式查找表格
        const tableRegex = /<table[^>]*>([\s\S]*?)<\/table>/gi;
        let match;
        while ((match = tableRegex.exec(htmlContent)) !== null) {
            // 检查是否是隐藏元素
            if (options.skipHiddenElements) {
                const tableHtml = match[0];
                // 简单检查是否有隐藏的样式或类
                if (!tableHtml.match(/(style=["'].*display\s*:\s*none.*["'])|(class=["'][^"']*hidden[^"']*["'])/i)) {
                    tables.push(tableHtml);
                }
            }
            else {
                tables.push(match[0]);
            }
        }
        return tables;
    }
    /**
     * 提取表头
     */
    extractHeaders(tableHtml, options) {
        const headers = [];
        // 提取<thead>中的表头
        const theadRegex = /<thead[^>]*>([\s\S]*?)<\/thead>/i;
        const theadMatch = tableHtml.match(theadRegex);
        if (theadMatch) {
            // 提取<th>标签
            const thRegex = /<th[^>]*>([\s\S]*?)<\/th>/gi;
            let thMatch;
            while ((thMatch = thRegex.exec(theadMatch[1])) !== null) {
                headers.push(thMatch[1]);
            }
        }
        // 如果<thead>中没有找到，从第一行<tr>中提取<th>和<td>标签
        if (headers.length === 0) {
            // 查找第一个<tr>
            const firstTrRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/i;
            const firstTrMatch = tableHtml.match(firstTrRegex);
            if (firstTrMatch) {
                // 提取<th>和<td>标签
                const cellRegex = /<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi;
                let cellMatch;
                while ((cellMatch = cellRegex.exec(firstTrMatch[1])) !== null) {
                    headers.push(cellMatch[1]);
                }
            }
        }
        return headers;
    }
    /**
     * 提取表格数据行
     */
    extractRows(tableHtml, options) {
        const rows = [];
        // 忽略<thead>部分
        const tbodyHtml = tableHtml.replace(/<thead[^>]*>([\s\S]*?)<\/thead>/i, '');
        // 提取所有<tr>行
        const trRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
        let trMatch;
        while ((trMatch = trRegex.exec(tbodyHtml)) !== null) {
            const rowCells = [];
            const rowHtml = trMatch[1];
            // 提取<tr>中的所有<td>和<th>单元格
            const cellRegex = /<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi;
            let cellMatch;
            while ((cellMatch = cellRegex.exec(rowHtml)) !== null) {
                rowCells.push(cellMatch[1]);
            }
            // 忽略空行
            if (!options.ignoreEmptyRows || rowCells.length > 0) {
                rows.push(rowCells);
            }
        }
        return rows;
    }
    /**
     * 提取表格标题
     */
    extractTableCaption(tableHtml, options) {
        const captionRegex = /<caption[^>]*>([\s\S]*?)<\/caption>/i;
        const captionMatch = tableHtml.match(captionRegex);
        if (captionMatch) {
            return this.cleanCellContent(captionMatch[1], options);
        }
        return '';
    }
    /**
     * 清理单元格内容
     */
    cleanCellContent(content, options) {
        let cleaned = content;
        // 移除HTML注释（如果不需要保留）
        if (!options.preserveComments) {
            cleaned = cleaned.replace(/<!--[\s\S]*?-->/g, '');
        }
        // 移除HTML标签
        if (options.removeHtmlTags) {
            // 处理特殊标签
            // 替换<br>标签为换行符
            cleaned = cleaned.replace(/<br\s*\/?>/gi, '\n');
            // 替换<p>标签为换行符
            cleaned = cleaned.replace(/<\/?p[^>]*>/gi, '\n');
            // 替换列表为换行符分隔的项目
            cleaned = cleaned.replace(/<li[^>]*>(.*?)<\/li>/gi, '$1\n');
            cleaned = cleaned.replace(/<ul[^>]*>|<\/ul>|<ol[^>]*>|<\/ol>/gi, '');
            // 移除其他HTML标签
            cleaned = cleaned.replace(/<[^>]*>/g, '');
        }
        // 转换HTML实体
        cleaned = this.decodeHtmlEntities(cleaned);
        // 规范化换行符
        if (options.normalizeNewlines) {
            cleaned = cleaned.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
        }
        // 修剪空白字符
        if (options.trimWhitespace) {
            cleaned = cleaned.trim();
        }
        // 折叠多个空格
        if (options.collapseSpaces) {
            cleaned = cleaned.replace(/\s+/g, ' ');
        }
        return cleaned;
    }
    /**
     * 解码HTML实体
     */
    decodeHtmlEntities(text) {
        const entities = {
            '&amp;': '&',
            '&lt;': '<',
            '&gt;': '>',
            '&quot;': '"',
            '&#39;': "'",
            '&nbsp;': ' '
        };
        let result = text;
        // 替换命名实体
        Object.entries(entities).forEach(([entity, char]) => {
            result = result.replace(new RegExp(entity, 'g'), char);
        });
        // 替换数字实体
        result = result.replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num, 10)));
        result = result.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
        return result;
    }
    /**
     * 转义CSV字段
     */
    escapeCsvField(field, delimiter, quoteChar, escapeChar) {
        // 如果字段包含分隔符、引号或换行符，需要用引号包围
        if (field.includes(delimiter) || field.includes(quoteChar) || field.includes('\n') || field.includes('\r')) {
            // 转义引号（将一个引号替换为两个引号）
            const escapedField = field.replace(new RegExp(quoteChar, 'g'), escapeChar + quoteChar);
            // 用引号包围字段
            return quoteChar + escapedField + quoteChar;
        }
        return field;
    }
    /**
     * 计算HTML到CSV转换的统计信息
     */
    calculateHtmlToCsvStatistics(htmlContent, csvContent, options) {
        // 计算处理的表格数量
        const tables = this.extractTables(htmlContent, options);
        const tablesProcessed = Math.min(tables.length, options.maxTables);
        // 计算CSV的行数和列数
        const csvLines = csvContent.split(/\r?\n/).filter(line => line.trim() !== '');
        let rows = csvLines.length;
        let columns = 0;
        if (csvLines.length > 0) {
            // 简单地以第一行为准计算列数
            // 注意：这可能不准确，因为CSV可能有不同长度的行
            columns = csvLines[0].split(options.delimiter).length;
        }
        return { tablesProcessed, rows, columns };
    }
}
exports.HtmlToCsvConverter = HtmlToCsvConverter;
//# sourceMappingURL=HtmlToCsvConverter.js.map