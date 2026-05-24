"use strict";
/**
 * @file Markdown到HTML转换器
 * @description 将Markdown格式的文档或表格转换为HTML格式
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-20
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.MarkdownToHtmlConverter = void 0;
const BaseConverter_1 = require("../common/BaseConverter");
const logger_1 = require("../../utils/logger");
/**
 * Markdown到HTML转换器类
 */
class MarkdownToHtmlConverter extends BaseConverter_1.BaseConverter {
    constructor() {
        super('Markdown到HTML转换器', '将Markdown格式的文档或表格转换为HTML格式', ['markdown', 'md'], ['html', 'htm']);
    }
    /**
     * 执行Markdown到HTML的转换
     * @param inputData Markdown输入数据
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
                includeHeadings: options.includeHeadings ?? true,
                includeLists: options.includeLists ?? true,
                // 表格选项
                tableClass: options.tableClass ?? 'markdown-table',
                tableId: options.tableId ?? '',
                responsiveTable: options.responsiveTable ?? true,
                // HTML包装
                wrapInDocument: options.wrapInDocument ?? false,
                title: options.title ?? 'Converted Document',
                description: options.description ?? '',
                // 样式选项
                includeDefaultStyles: options.includeDefaultStyles ?? true,
                customStyles: options.customStyles ?? '',
                theme: options.theme ?? 'light',
                // 高级选项
                parseLinks: options.parseLinks ?? true,
                parseImages: options.parseImages ?? true,
                parseCodeBlocks: options.parseCodeBlocks ?? true,
                parseEmphasis: options.parseEmphasis ?? true,
                parseBlockquotes: options.parseBlockquotes ?? true,
                parseHorizontalRules: options.parseHorizontalRules ?? true,
                // 特定处理
                footnotesToEndnotes: options.footnotesToEndnotes ?? true,
                sanitizeHtml: options.sanitizeHtml ?? true,
                // 输出格式
                outputFormat: options.outputFormat || outputFormat || 'html',
                ...options
            };
            // 执行转换并测量性能
            const { result: htmlContent, duration } = await this.measurePerformance(() => {
                return this.markdownToHtml(inputData, conversionOptions);
            });
            // 计算统计信息
            const statistics = this.calculateStatistics(htmlContent);
            // 返回成功结果
            return this.createSuccessResult(htmlContent, outputFormat, inputFormat, {
                size: Buffer.byteLength(htmlContent),
                tablesCount: statistics.tablesCount,
                elementsCount: statistics.elementsCount,
                charsCount: statistics.charsCount,
                processingTime: duration
            });
        }
        catch (error) {
            logger_1.logger.error('Markdown到HTML转换失败:', error);
            return this.createErrorResult(`转换失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
    }
    /**
     * 将Markdown数据转换为HTML
     * @param inputData Markdown输入数据
     * @param options 转换选项
     */
    markdownToHtml(inputData, options) {
        try {
            // 将输入数据转换为字符串
            const markdownData = Buffer.isBuffer(inputData) ? inputData.toString('utf-8') : inputData;
            // 如果只转换表格
            if (options.tableOnly) {
                let html = this.extractAndConvertTables(markdownData, options);
                // 如果需要完整HTML文档包装
                if (options.wrapInDocument) {
                    html = this.wrapInHtmlDocument(html, options);
                }
                return html;
            }
            // 完整Markdown转换
            let html = markdownData;
            // 按顺序处理各种Markdown元素
            html = this.preprocessMarkdown(html, options);
            // 转换各种Markdown元素
            if (options.parseTables !== false) {
                html = this.convertMarkdownTables(html, options);
            }
            if (options.parseHeadings) {
                html = this.convertHeadings(html);
            }
            if (options.parseLists) {
                html = this.convertLists(html);
            }
            if (options.parseCodeBlocks) {
                html = this.convertCodeBlocks(html);
            }
            if (options.parseEmphasis) {
                html = this.convertEmphasis(html);
            }
            if (options.parseBlockquotes) {
                html = this.convertBlockquotes(html);
            }
            if (options.parseLinks) {
                html = this.convertLinks(html);
            }
            if (options.parseImages) {
                html = this.convertImages(html);
            }
            if (options.parseHorizontalRules) {
                html = this.convertHorizontalRules(html);
            }
            if (options.footnotesToEndnotes) {
                html = this.convertFootnotes(html);
            }
            // 处理段落
            html = this.convertParagraphs(html);
            // 后处理
            html = this.postprocessHtml(html, options);
            // 如果需要完整HTML文档包装
            if (options.wrapInDocument) {
                html = this.wrapInHtmlDocument(html, options);
            }
            return html;
        }
        catch (error) {
            throw new Error(`Markdown到HTML转换失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
    }
    /**
     * 预处理Markdown
     * @param markdown Markdown内容
     * @param options 转换选项
     */
    preprocessMarkdown(markdown, options) {
        let result = markdown;
        // 标准化换行符
        result = result.replace(/\r\n|\r/g, '\n');
        // 清理前后空白
        result = result.trim();
        return result;
    }
    /**
     * 提取并转换表格
     * @param markdown Markdown内容
     * @param options 转换选项
     */
    extractAndConvertTables(markdown, options) {
        const tableRegex = /^\|.*\|\n\|[-\s:|]+\|(\n\|.*\|)*$/gm;
        const tables = [];
        let match;
        while ((match = tableRegex.exec(markdown)) !== null) {
            const markdownTable = match[0];
            const htmlTable = this.convertSingleTable(markdownTable, options);
            tables.push(htmlTable);
        }
        return tables.join('\n\n');
    }
    /**
     * 转换Markdown表格为HTML表格
     * @param markdown Markdown内容
     * @param options 转换选项
     */
    convertMarkdownTables(markdown, options) {
        const tableRegex = /^\|.*\|\n\|[-\s:|]+\|(\n\|.*\|)*$/gm;
        return markdown.replace(tableRegex, (match) => {
            return this.convertSingleTable(match, options);
        });
    }
    /**
     * 转换单个表格为HTML
     * @param tableMarkdown 表格Markdown
     * @param options 转换选项
     */
    convertSingleTable(tableMarkdown, options) {
        const lines = tableMarkdown.split('\n').filter(line => line.trim());
        if (lines.length < 2)
            return '';
        // 解析表头和分隔线
        const headerLine = lines[0];
        const separatorLine = lines[1];
        // 解析数据行
        const dataLines = lines.slice(2);
        // 解析表头单元格
        const headers = this.parseTableRow(headerLine);
        // 解析对齐方式
        const alignments = this.parseAlignments(separatorLine);
        // 构建HTML表格
        let tableHtml = '<table';
        // 添加表格类
        if (options.tableClass) {
            tableHtml += ` class="${options.tableClass}`;
            if (options.responsiveTable) {
                tableHtml += ' responsive-table';
            }
            tableHtml += '"';
        }
        else if (options.responsiveTable) {
            tableHtml += ' class="responsive-table"';
        }
        // 添加表格ID
        if (options.tableId) {
            tableHtml += ` id="${options.tableId}"`;
        }
        tableHtml += '>\n';
        // 添加表头
        tableHtml += '<thead>\n<tr>\n';
        headers.forEach((header, index) => {
            const alignment = alignments[index] || '';
            const style = alignment ? ` style="text-align: ${alignment};"` : '';
            tableHtml += `  <th${style}>${header}</th>\n`;
        });
        tableHtml += '</tr>\n</thead>\n';
        // 添加表体
        tableHtml += '<tbody>\n';
        dataLines.forEach(line => {
            const cells = this.parseTableRow(line);
            tableHtml += '<tr>\n';
            cells.forEach((cell, index) => {
                const alignment = alignments[index] || '';
                const style = alignment ? ` style="text-align: ${alignment};"` : '';
                tableHtml += `  <td${style}>${cell}</td>\n`;
            });
            tableHtml += '</tr>\n';
        });
        tableHtml += '</tbody>\n';
        tableHtml += '</table>';
        // 如果是响应式表格，添加包装器
        if (options.responsiveTable) {
            return `<div class="table-container">\n${tableHtml}\n</div>`;
        }
        return tableHtml;
    }
    /**
     * 解析表格行
     * @param line 表格行
     */
    parseTableRow(line) {
        // 移除首尾的|，然后分割
        return line
            .replace(/^\s*\|\s*|\s*\|\s*$/g, '')
            .split(/\s*\|\s*/);
    }
    /**
     * 解析对齐方式
     * @param separatorLine 分隔线
     */
    parseAlignments(separatorLine) {
        const cells = this.parseTableRow(separatorLine);
        const alignments = [];
        cells.forEach(cell => {
            if (cell.startsWith(':') && cell.endsWith(':')) {
                alignments.push('center');
            }
            else if (cell.startsWith(':')) {
                alignments.push('left');
            }
            else if (cell.endsWith(':')) {
                alignments.push('right');
            }
            else {
                alignments.push('');
            }
        });
        return alignments;
    }
    /**
     * 转换标题
     * @param markdown Markdown内容
     */
    convertHeadings(markdown) {
        return markdown
            .replace(/^#{6}\s+([\s\S]*?)$/gm, '<h6>$1</h6>')
            .replace(/^#{5}\s+([\s\S]*?)$/gm, '<h5>$1</h5>')
            .replace(/^#{4}\s+([\s\S]*?)$/gm, '<h4>$1</h4>')
            .replace(/^#{3}\s+([\s\S]*?)$/gm, '<h3>$1</h3>')
            .replace(/^#{2}\s+([\s\S]*?)$/gm, '<h2>$1</h2>')
            .replace(/^#{1}\s+([\s\S]*?)$/gm, '<h1>$1</h1>');
    }
    /**
     * 转换列表
     * @param markdown Markdown内容
     */
    convertLists(markdown) {
        // 先处理无序列表
        let result = this.convertUnorderedLists(markdown);
        // 再处理有序列表
        result = this.convertOrderedLists(result);
        return result;
    }
    /**
     * 转换无序列表
     * @param markdown Markdown内容
     */
    convertUnorderedLists(markdown) {
        // 简化的无序列表转换
        // 实际应用中可能需要更复杂的逻辑来处理嵌套列表
        const listRegex = /^-\s+([\s\S]*?)$/gm;
        // 先识别列表块
        const listBlockRegex = /^(-\s+[\s\S]*?)(?=\n(?!-\s)|$)/gm;
        return markdown.replace(listBlockRegex, (match) => {
            let listItems = match.replace(listRegex, '<li>$1</li>');
            return `<ul>\n${listItems}\n</ul>`;
        });
    }
    /**
     * 转换有序列表
     * @param markdown Markdown内容
     */
    convertOrderedLists(markdown) {
        // 简化的有序列表转换
        const listRegex = /^(\d+)\.\s+([\s\S]*?)$/gm;
        // 先识别列表块
        const listBlockRegex = /^(\d+\.\s+[\s\S]*?)(?=\n(?!\d+\.\s)|$)/gm;
        return markdown.replace(listBlockRegex, (match) => {
            let listItems = match.replace(listRegex, '<li>$2</li>');
            return `<ol>\n${listItems}\n</ol>`;
        });
    }
    /**
     * 转换代码块
     * @param markdown Markdown内容
     */
    convertCodeBlocks(markdown) {
        // 转换代码块（```格式）
        let result = markdown.replace(/```([\s\S]*?)```/g, (match, code) => {
            return `<pre><code>${this.escapeHtml(code)}</code></pre>`;
        });
        // 转换行内代码
        result = result.replace(/`([^`]+)`/g, (match, code) => {
            return `<code>${this.escapeHtml(code)}</code>`;
        });
        return result;
    }
    /**
     * 转换强调（粗体、斜体）
     * @param markdown Markdown内容
     */
    convertEmphasis(markdown) {
        let result = markdown;
        // 转换粗体
        result = result.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        result = result.replace(/__([^_]+)__/g, '<strong>$1</strong>');
        // 转换斜体
        result = result.replace(/\*([^*]+)\*/g, '<em>$1</em>');
        result = result.replace(/\_([^_]+)\_/g, '<em>$1</em>');
        return result;
    }
    /**
     * 转换引用块
     * @param markdown Markdown内容
     */
    convertBlockquotes(markdown) {
        const blockquoteRegex = /^>\s+([\s\S]*?)$/gm;
        // 先识别引用块
        const blockRegex = /^(>\s+[\s\S]*?)(?=\n(?!>\s)|$)/gm;
        return markdown.replace(blockRegex, (match) => {
            let quoteContent = match.replace(blockquoteRegex, '$1');
            return `<blockquote>\n${quoteContent}\n</blockquote>`;
        });
    }
    /**
     * 转换链接
     * @param markdown Markdown内容
     */
    convertLinks(markdown) {
        return markdown.replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '<a href="$2">$1</a>');
    }
    /**
     * 转换图片
     * @param markdown Markdown内容
     */
    convertImages(markdown) {
        return markdown.replace(/!\[([^\]]*)\]\(([^\)]+)\)/g, '<img src="$2" alt="$1" />');
    }
    /**
     * 转换分隔线
     * @param markdown Markdown内容
     */
    convertHorizontalRules(markdown) {
        return markdown
            .replace(/^-{3,}$/gm, '<hr />')
            .replace(/^\*{3,}$/gm, '<hr />')
            .replace(/^_{3,}$/gm, '<hr />');
    }
    /**
     * 转换脚注
     * @param markdown Markdown内容
     */
    convertFootnotes(markdown) {
        // 简化的脚注处理
        // 实际应用中可能需要更复杂的逻辑
        return markdown;
    }
    /**
     * 转换段落
     * @param markdown Markdown内容
     */
    convertParagraphs(markdown) {
        // 分割成行
        const lines = markdown.split('\n');
        const paragraphs = [];
        let currentPara = '';
        lines.forEach(line => {
            // 如果是空白行，且当前段落不为空，创建段落
            if (line.trim() === '') {
                if (currentPara.trim()) {
                    paragraphs.push(`<p>${currentPara.trim()}</p>`);
                    currentPara = '';
                }
            }
            else {
                // 检查是否已经是HTML标签
                if (!this.isHtmlTag(line)) {
                    currentPara += ' ' + line;
                }
                else {
                    // 如果是HTML标签，先完成当前段落
                    if (currentPara.trim()) {
                        paragraphs.push(`<p>${currentPara.trim()}</p>`);
                        currentPara = '';
                    }
                    paragraphs.push(line);
                }
            }
        });
        // 添加最后一个段落
        if (currentPara.trim()) {
            paragraphs.push(`<p>${currentPara.trim()}</p>`);
        }
        return paragraphs.join('\n');
    }
    /**
     * 检查是否是HTML标签
     * @param line 文本行
     */
    isHtmlTag(line) {
        return /^<[^>]+>$/.test(line.trim());
    }
    /**
     * 后处理HTML
     * @param html HTML内容
     * @param options 转换选项
     */
    postprocessHtml(html, options) {
        let result = html;
        // 清理HTML内容
        if (options.sanitizeHtml) {
            result = this.sanitizeHtmlContent(result);
        }
        return result;
    }
    /**
     * 清理HTML内容
     * @param html HTML内容
     */
    sanitizeHtmlContent(html) {
        // 简化的HTML清理
        // 实际应用中应使用专门的HTML清理库
        return html
            .replace(/<script[^>]*>([\s\S]*?)<\/script>/gi, '')
            .replace(/<iframe[^>]*>([\s\S]*?)<\/iframe>/gi, '')
            .replace(/on\w+="[^"]*"/gi, '')
            .replace(/on\w+='[^']*'/gi, '');
    }
    /**
     * 包装在HTML文档中
     * @param htmlContent HTML内容
     * @param options 转换选项
     */
    wrapInHtmlDocument(htmlContent, options) {
        let styles = '';
        // 添加默认样式
        if (options.includeDefaultStyles) {
            styles += this.getDefaultStyles(options.theme);
        }
        // 添加自定义样式
        if (options.customStyles) {
            styles += `\n${options.customStyles}`;
        }
        return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${options.title}</title>
  ${options.description ? `<meta name="description" content="${options.description}">` : ''}
  <style>
${styles}
  </style>
</head>
<body>
  <div class="content">
${htmlContent}
  </div>
</body>
</html>`;
    }
    /**
     * 获取默认样式
     * @param theme 主题
     */
    getDefaultStyles(theme) {
        if (theme === 'dark') {
            return this.getDarkThemeStyles();
        }
        return this.getLightThemeStyles();
    }
    /**
     * 获取浅色主题样式
     */
    getLightThemeStyles() {
        return `  /* 基础样式 */
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    line-height: 1.6;
    color: #333;
    background-color: #fff;
    margin: 0;
    padding: 20px;
  }
  
  .content {
    max-width: 800px;
    margin: 0 auto;
  }
  
  /* 表格样式 */
  .markdown-table {
    border-collapse: collapse;
    width: 100%;
    margin: 20px 0;
  }
  
  .markdown-table th,
  .markdown-table td {
    border: 1px solid #ddd;
    padding: 8px 12px;
  }
  
  .markdown-table th {
    background-color: #f2f2f2;
    font-weight: bold;
  }
  
  .markdown-table tr:nth-child(even) {
    background-color: #f9f9f9;
  }
  
  /* 响应式表格 */
  .table-container {
    overflow-x: auto;
  }
  
  /* 代码样式 */
  pre {
    background-color: #f5f5f5;
    padding: 15px;
    border-radius: 4px;
    overflow-x: auto;
  }
  
  code {
    font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
    background-color: #f5f5f5;
    padding: 2px 4px;
    border-radius: 3px;
  }
  
  /* 引用样式 */
  blockquote {
    border-left: 4px solid #ddd;
    padding-left: 16px;
    margin-left: 0;
    color: #666;
  }`;
    }
    /**
     * 获取深色主题样式
     */
    getDarkThemeStyles() {
        return `  /* 基础样式 */
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    line-height: 1.6;
    color: #e0e0e0;
    background-color: #121212;
    margin: 0;
    padding: 20px;
  }
  
  .content {
    max-width: 800px;
    margin: 0 auto;
  }
  
  /* 表格样式 */
  .markdown-table {
    border-collapse: collapse;
    width: 100%;
    margin: 20px 0;
  }
  
  .markdown-table th,
  .markdown-table td {
    border: 1px solid #333;
    padding: 8px 12px;
  }
  
  .markdown-table th {
    background-color: #2d2d2d;
    font-weight: bold;
  }
  
  .markdown-table tr:nth-child(even) {
    background-color: #1e1e1e;
  }
  
  /* 响应式表格 */
  .table-container {
    overflow-x: auto;
  }
  
  /* 代码样式 */
  pre {
    background-color: #1e1e1e;
    padding: 15px;
    border-radius: 4px;
    overflow-x: auto;
  }
  
  code {
    font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
    background-color: #1e1e1e;
    padding: 2px 4px;
    border-radius: 3px;
  }
  
  /* 引用样式 */
  blockquote {
    border-left: 4px solid #555;
    padding-left: 16px;
    margin-left: 0;
    color: #aaa;
  }`;
    }
    /**
     * 转义HTML字符
     * @param text 文本
     */
    escapeHtml(text) {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
    /**
     * 计算统计信息
     * @param htmlContent HTML内容
     */
    calculateStatistics(htmlContent) {
        // 计算表格数量
        const tablesCount = (htmlContent.match(/<table[^>]*>/gi) || []).length;
        // 计算HTML元素数量
        const elementsCount = (htmlContent.match(/<\/?[a-z][\s\S]*?>/gi) || []).length;
        // 计算字符数
        const charsCount = htmlContent.length;
        return {
            tablesCount,
            elementsCount,
            charsCount
        };
    }
}
exports.MarkdownToHtmlConverter = MarkdownToHtmlConverter;
//# sourceMappingURL=MarkdownToHtmlConverter.js.map