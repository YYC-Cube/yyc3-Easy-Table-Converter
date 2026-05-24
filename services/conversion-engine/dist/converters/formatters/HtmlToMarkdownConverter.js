"use strict";
/**
 * @file HTML到Markdown转换器
 * @description 将HTML格式的表格或文档转换为Markdown格式
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-20
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.HtmlToMarkdownConverter = void 0;
const BaseConverter_1 = require("../common/BaseConverter");
const logger_1 = require("../../utils/logger");
/**
 * HTML到Markdown转换器类
 */
class HtmlToMarkdownConverter extends BaseConverter_1.BaseConverter {
    constructor() {
        super('HTML到Markdown转换器', '将HTML格式的表格或文档转换为Markdown格式', ['html'], ['markdown', 'md']);
    }
    /**
     * 执行HTML到Markdown的转换
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
            const conversionOptions = {
                // 基础选项
                tableOnly: options.tableOnly ?? false,
                includeImages: options.includeImages ?? true,
                includeLinks: options.includeLinks ?? true,
                // 表格选项
                tableFlavor: options.tableFlavor ?? 'github',
                markdownTableAlign: options.markdownTableAlign ?? 'default',
                removeEmptyRows: options.removeEmptyRows ?? true,
                removeEmptyColumns: options.removeEmptyColumns ?? true,
                // 文本处理
                preserveWhitespace: options.preserveWhitespace ?? false,
                convertBold: options.convertBold ?? true,
                convertItalic: options.convertItalic ?? true,
                convertHeadings: options.convertHeadings ?? true,
                convertLists: options.convertLists ?? true,
                // 高级选项
                escapeSpecialCharacters: options.escapeSpecialCharacters ?? true,
                maxWidth: options.maxWidth ?? 80,
                lineBreakMode: options.lineBreakMode ?? 'markdown',
                // 特定处理
                processFootnotes: options.processFootnotes ?? true,
                convertCodeBlocks: options.convertCodeBlocks ?? true,
                convertTables: options.convertTables ?? true,
                // 输出格式
                outputFormat: options.outputFormat || outputFormat || 'markdown',
                ...options
            };
            // 执行转换并测量性能
            const { result: markdownContent, duration } = await this.measurePerformance(() => {
                return this.htmlToMarkdown(inputData, conversionOptions);
            });
            // 计算统计信息
            const statistics = this.calculateStatistics(markdownContent);
            // 返回成功结果
            return this.createSuccessResult(markdownContent, outputFormat, inputFormat, {
                size: Buffer.byteLength(markdownContent),
                tablesCount: statistics.tablesCount,
                linesCount: statistics.linesCount,
                charsCount: statistics.charsCount,
                processingTime: duration
            });
        }
        catch (error) {
            logger_1.logger.error('HTML到Markdown转换失败:', error);
            return this.createErrorResult(`转换失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
    }
    /**
     * 将HTML数据转换为Markdown
     * @param inputData HTML输入数据
     * @param options 转换选项
     */
    htmlToMarkdown(inputData, options) {
        try {
            // 将输入数据转换为字符串
            const htmlData = Buffer.isBuffer(inputData) ? inputData.toString('utf-8') : inputData;
            // 如果只转换表格
            if (options.tableOnly) {
                return this.extractAndConvertTables(htmlData, options);
            }
            // 完整HTML转换
            let markdown = htmlData;
            // 按顺序处理各种HTML元素
            markdown = this.preprocessHtml(markdown, options);
            // 转换各种HTML元素
            if (options.convertTables) {
                markdown = this.convertHtmlTables(markdown, options);
            }
            if (options.convertHeadings) {
                markdown = this.convertHeadings(markdown);
            }
            if (options.convertBold) {
                markdown = this.convertBold(markdown);
            }
            if (options.convertItalic) {
                markdown = this.convertItalic(markdown);
            }
            if (options.convertLists) {
                markdown = this.convertLists(markdown);
            }
            if (options.convertCodeBlocks) {
                markdown = this.convertCodeBlocks(markdown);
            }
            if (options.includeLinks) {
                markdown = this.convertLinks(markdown);
            }
            if (options.includeImages) {
                markdown = this.convertImages(markdown);
            }
            if (options.processFootnotes) {
                markdown = this.convertFootnotes(markdown);
            }
            // 后处理
            markdown = this.postprocessMarkdown(markdown, options);
            return markdown;
        }
        catch (error) {
            throw new Error(`HTML到Markdown转换失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
    }
    /**
     * 预处理HTML
     * @param html HTML内容
     * @param options 转换选项
     */
    preprocessHtml(html, options) {
        let result = html;
        // 移除HTML注释
        result = result.replace(/<!--[\s\S]*?-->/g, '');
        // 移除DOCTYPE
        result = result.replace(/<!DOCTYPE[^>]*>/i, '');
        // 移除HTML、HEAD、BODY标签
        result = result.replace(/<\/?html[^>]*>/gi, '');
        result = result.replace(/<\/?head[^>]*>/gi, '');
        result = result.replace(/<\/?body[^>]*>/gi, '');
        // 标准化换行符
        result = result.replace(/\r\n|\r/g, '\n');
        // 如果不保留空白
        if (!options.preserveWhitespace) {
            result = result.replace(/\s+/g, ' ');
        }
        return result;
    }
    /**
     * 提取并转换表格
     * @param html HTML内容
     * @param options 转换选项
     */
    extractAndConvertTables(html, options) {
        const tables = [];
        // 提取所有表格
        const tableRegex = /<table[^>]*>([\s\S]*?)<\/table>/gi;
        let match;
        while ((match = tableRegex.exec(html)) !== null) {
            const tableHtml = match[0];
            const markdownTable = this.convertSingleTable(tableHtml, options);
            tables.push(markdownTable);
        }
        // 如果没有表格，尝试从整个HTML中提取
        if (tables.length === 0 && options.convertTables) {
            return this.convertHtmlTables(html, options);
        }
        return tables.join('\n\n');
    }
    /**
     * 转换HTML表格为Markdown表格
     * @param html HTML内容
     * @param options 转换选项
     */
    convertHtmlTables(html, options) {
        return html.replace(/<table[^>]*>([\s\S]*?)<\/table>/gi, (match, tableContent) => {
            return this.convertSingleTable(match, options);
        });
    }
    /**
     * 转换单个表格为Markdown
     * @param tableHtml 表格HTML
     * @param options 转换选项
     */
    convertSingleTable(tableHtml, options) {
        // 提取表头和表体
        const theadMatch = tableHtml.match(/<thead[^>]*>([\s\S]*?)<\/thead>/i);
        const tbodyMatch = tableHtml.match(/<tbody[^>]*>([\s\S]*?)<\/tbody>/i);
        // 解析表头行
        let headers = [];
        if (theadMatch) {
            headers = this.extractRowCells(theadMatch[1]);
        }
        else {
            // 尝试从第一行获取表头
            const firstRowMatch = tableHtml.match(/<tr[^>]*>([\s\S]*?)<\/tr>/i);
            if (firstRowMatch) {
                headers = this.extractRowCells(firstRowMatch[1]);
            }
        }
        // 解析数据行
        let rows = [];
        const rowsHtml = tbodyMatch ? tbodyMatch[1] : tableHtml;
        const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
        let rowMatch;
        while ((rowMatch = rowRegex.exec(rowsHtml)) !== null) {
            const cells = this.extractRowCells(rowMatch[1]);
            if (cells.length > 0) {
                rows.push(cells);
            }
        }
        // 如果没有表头，使用第一行作为表头
        if (headers.length === 0 && rows.length > 0) {
            headers = rows[0];
            rows = rows.slice(1);
        }
        // 过滤空行
        if (options.removeEmptyRows) {
            rows = rows.filter(row => row.some(cell => cell.trim() !== ''));
        }
        // 如果没有数据，返回空字符串
        if (headers.length === 0 && rows.length === 0) {
            return '';
        }
        // 生成Markdown表格
        return this.generateMarkdownTable(headers, rows, options);
    }
    /**
     * 提取行中的单元格
     * @param rowHtml 行HTML
     */
    extractRowCells(rowHtml) {
        const cells = [];
        // 匹配th和td
        const cellRegex = /<(th|td)[^>]*>([\s\S]*?)<\/\1>/gi;
        let cellMatch;
        while ((cellMatch = cellRegex.exec(rowHtml)) !== null) {
            const cellContent = this.cleanCellContent(cellMatch[2]);
            cells.push(cellContent);
        }
        return cells;
    }
    /**
     * 清理单元格内容
     * @param content 单元格内容
     */
    cleanCellContent(content) {
        // 移除HTML标签
        let cleaned = content.replace(/<[^>]*>/g, '');
        // 清理空白字符
        cleaned = cleaned.trim();
        cleaned = cleaned.replace(/\s+/g, ' ');
        return cleaned;
    }
    /**
     * 生成Markdown表格
     * @param headers 表头
     * @param rows 数据行
     * @param options 转换选项
     */
    generateMarkdownTable(headers, rows, options) {
        const lines = [];
        // 计算每列的最大宽度
        const columnWidths = this.calculateColumnWidths(headers, rows);
        // 生成表头分隔线
        const separator = this.generateSeparatorLine(columnWidths, options.markdownTableAlign);
        // 添加表头行
        lines.push(this.formatRow(headers, columnWidths));
        // 添加分隔线
        lines.push(separator);
        // 添加数据行
        rows.forEach(row => {
            lines.push(this.formatRow(row, columnWidths));
        });
        return lines.join('\n');
    }
    /**
     * 计算每列的最大宽度
     * @param headers 表头
     * @param rows 数据行
     */
    calculateColumnWidths(headers, rows) {
        const widths = [];
        // 初始化为表头宽度
        headers.forEach((header, index) => {
            widths[index] = header.length;
        });
        // 更新为数据宽度的最大值
        rows.forEach(row => {
            row.forEach((cell, index) => {
                if (cell.length > widths[index]) {
                    widths[index] = cell.length;
                }
            });
        });
        return widths;
    }
    /**
     * 生成分隔线
     * @param columnWidths 列宽度
     * @param alignment 对齐方式
     */
    generateSeparatorLine(columnWidths, alignment) {
        const parts = [];
        columnWidths.forEach(width => {
            let separator = '-'.repeat(width);
            // 根据对齐方式添加冒号
            if (alignment === 'center') {
                separator = `:${separator.slice(1, -1)}:`;
            }
            else if (alignment === 'left') {
                separator = `:${separator.slice(1)}`;
            }
            else if (alignment === 'right') {
                separator = `${separator.slice(0, -1)}:`;
            }
            parts.push(separator);
        });
        return `| ${parts.join(' | ')} |`;
    }
    /**
     * 格式化行
     * @param row 行数据
     * @param columnWidths 列宽度
     */
    formatRow(row, columnWidths) {
        const parts = [];
        row.forEach((cell, index) => {
            // 计算需要填充的空格数
            const padding = index < columnWidths.length ? columnWidths[index] - cell.length : 0;
            const paddedCell = cell + ' '.repeat(padding);
            parts.push(paddedCell);
        });
        return `| ${parts.join(' | ')} |`;
    }
    /**
     * 转换标题
     * @param html HTML内容
     */
    convertHeadings(html) {
        return html
            .replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, '# $1')
            .replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, '## $1')
            .replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, '### $1')
            .replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, '#### $1')
            .replace(/<h5[^>]*>([\s\S]*?)<\/h5>/gi, '##### $1')
            .replace(/<h6[^>]*>([\s\S]*?)<\/h6>/gi, '###### $1');
    }
    /**
     * 转换粗体
     * @param html HTML内容
     */
    convertBold(html) {
        return html
            .replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, '**$1**')
            .replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, '**$1**');
    }
    /**
     * 转换斜体
     * @param html HTML内容
     */
    convertItalic(html) {
        return html
            .replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, '*$1*')
            .replace(/<i[^>]*>([\s\S]*?)<\/i>/gi, '*$1*');
    }
    /**
     * 转换列表
     * @param html HTML内容
     */
    convertLists(html) {
        // 先处理无序列表
        let result = this.convertUnorderedLists(html);
        // 再处理有序列表
        result = this.convertOrderedLists(result);
        return result;
    }
    /**
     * 转换无序列表
     * @param html HTML内容
     */
    convertUnorderedLists(html) {
        return html.replace(/<ul[^>]*>([\s\S]*?)<\/ul>/gi, (match, content) => {
            // 提取列表项
            const items = content.match(/<li[^>]*>([\s\S]*?)<\/li>/gi) || [];
            const markdownItems = items.map(item => {
                const text = this.cleanCellContent(item.replace(/<li[^>]*>([\s\S]*?)<\/li>/i, '$1'));
                return `- ${text}`;
            });
            return markdownItems.join('\n');
        });
    }
    /**
     * 转换有序列表
     * @param html HTML内容
     */
    convertOrderedLists(html) {
        return html.replace(/<ol[^>]*>([\s\S]*?)<\/ol>/gi, (match, content) => {
            // 提取列表项
            const items = content.match(/<li[^>]*>([\s\S]*?)<\/li>/gi) || [];
            const markdownItems = items.map((item, index) => {
                const text = this.cleanCellContent(item.replace(/<li[^>]*>([\s\S]*?)<\/li>/i, '$1'));
                return `${index + 1}. ${text}`;
            });
            return markdownItems.join('\n');
        });
    }
    /**
     * 转换代码块
     * @param html HTML内容
     */
    convertCodeBlocks(html) {
        // 转换pre和code标签
        return html
            .replace(/<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi, '```\n$1\n```')
            .replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, '`$1`');
    }
    /**
     * 转换链接
     * @param html HTML内容
     */
    convertLinks(html) {
        return html.replace(/<a[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi, '[$2]($1)');
    }
    /**
     * 转换图片
     * @param html HTML内容
     */
    convertImages(html) {
        return html.replace(/<img[^>]*src=["']([^"']+)["'][^>]*alt=["']([^"']*)["'][^>]*>/gi, '![$2]($1)');
    }
    /**
     * 转换脚注
     * @param html HTML内容
     */
    convertFootnotes(html) {
        // 简化的脚注处理
        // 实际应用中可能需要更复杂的逻辑
        return html;
    }
    /**
     * 后处理Markdown
     * @param markdown Markdown内容
     * @param options 转换选项
     */
    postprocessMarkdown(markdown, options) {
        let result = markdown;
        // 处理换行符
        if (options.lineBreakMode === 'markdown') {
            // Markdown标准要求两个空格加换行
            result = result.replace(/\n/g, '  \n');
        }
        else if (options.lineBreakMode === 'html') {
            // 使用<br>
            result = result.replace(/\n/g, '<br>\n');
        }
        // 转义特殊字符
        if (options.escapeSpecialCharacters) {
            result = this.escapeMarkdownCharacters(result);
        }
        // 限制行宽
        if (options.maxWidth && options.maxWidth > 0) {
            result = this.wrapLines(result, options.maxWidth);
        }
        return result;
    }
    /**
     * 转义Markdown特殊字符
     * @param text 文本
     */
    escapeMarkdownCharacters(text) {
        const escapeChars = ['\*', '_', '`', '\[', '\]', '\(', '\)', '#', '\+', '-', '\.', '!'];
        let result = text;
        escapeChars.forEach(char => {
            const regex = new RegExp(char, 'g');
            result = result.replace(regex, `\\${char}`);
        });
        return result;
    }
    /**
     * 换行处理
     * @param text 文本
     * @param maxWidth 最大宽度
     */
    wrapLines(text, maxWidth) {
        const lines = text.split('\n');
        const wrappedLines = [];
        lines.forEach(line => {
            if (line.length <= maxWidth) {
                wrappedLines.push(line);
            }
            else {
                // 简单的换行处理
                // 实际应用中可能需要更复杂的逻辑，如考虑单词边界
                for (let i = 0; i < line.length; i += maxWidth) {
                    wrappedLines.push(line.substring(i, i + maxWidth));
                }
            }
        });
        return wrappedLines.join('\n');
    }
    /**
     * 计算统计信息
     * @param markdownContent Markdown内容
     */
    calculateStatistics(markdownContent) {
        // 计算表格数量（通过查找分隔线）
        const tablesCount = (markdownContent.match(/\|[-\s:|]+\|/g) || []).length;
        // 计算行数
        const linesCount = markdownContent.split('\n').length;
        // 计算字符数
        const charsCount = markdownContent.length;
        return {
            tablesCount,
            linesCount,
            charsCount
        };
    }
}
exports.HtmlToMarkdownConverter = HtmlToMarkdownConverter;
//# sourceMappingURL=HtmlToMarkdownConverter.js.map