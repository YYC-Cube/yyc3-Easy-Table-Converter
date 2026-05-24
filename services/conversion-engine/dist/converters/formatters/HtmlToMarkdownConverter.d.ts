/**
 * @file HTML到Markdown转换器
 * @description 将HTML格式的表格或文档转换为Markdown格式
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-20
 */
import { BaseConverter } from '../common/BaseConverter';
import { ConversionOptions, ConversionResult } from '../common/IConverter';
/**
 * HTML到Markdown转换选项接口
 */
export interface HtmlToMarkdownOptions extends ConversionOptions {
    tableOnly?: boolean;
    includeImages?: boolean;
    includeLinks?: boolean;
    tableFlavor?: 'pipe' | 'simple' | 'github';
    markdownTableAlign?: 'left' | 'right' | 'center' | 'default';
    removeEmptyRows?: boolean;
    removeEmptyColumns?: boolean;
    preserveWhitespace?: boolean;
    convertBold?: boolean;
    convertItalic?: boolean;
    convertHeadings?: boolean;
    convertLists?: boolean;
    escapeSpecialCharacters?: boolean;
    maxWidth?: number;
    lineBreakMode?: 'markdown' | 'html' | 'system';
    processFootnotes?: boolean;
    convertCodeBlocks?: boolean;
    convertTables?: boolean;
    outputFormat?: 'markdown' | 'md';
}
/**
 * HTML到Markdown转换器类
 */
export declare class HtmlToMarkdownConverter extends BaseConverter {
    constructor();
    /**
     * 执行HTML到Markdown的转换
     * @param inputData HTML输入数据
     * @param inputFormat 输入格式
     * @param outputFormat 输出格式
     * @param options 转换选项
     */
    convert(inputData: Buffer | string, inputFormat: string, outputFormat: string, options?: HtmlToMarkdownOptions): Promise<ConversionResult>;
    /**
     * 将HTML数据转换为Markdown
     * @param inputData HTML输入数据
     * @param options 转换选项
     */
    private htmlToMarkdown;
    /**
     * 预处理HTML
     * @param html HTML内容
     * @param options 转换选项
     */
    private preprocessHtml;
    /**
     * 提取并转换表格
     * @param html HTML内容
     * @param options 转换选项
     */
    private extractAndConvertTables;
    /**
     * 转换HTML表格为Markdown表格
     * @param html HTML内容
     * @param options 转换选项
     */
    private convertHtmlTables;
    /**
     * 转换单个表格为Markdown
     * @param tableHtml 表格HTML
     * @param options 转换选项
     */
    private convertSingleTable;
    /**
     * 提取行中的单元格
     * @param rowHtml 行HTML
     */
    private extractRowCells;
    /**
     * 清理单元格内容
     * @param content 单元格内容
     */
    private cleanCellContent;
    /**
     * 生成Markdown表格
     * @param headers 表头
     * @param rows 数据行
     * @param options 转换选项
     */
    private generateMarkdownTable;
    /**
     * 计算每列的最大宽度
     * @param headers 表头
     * @param rows 数据行
     */
    private calculateColumnWidths;
    /**
     * 生成分隔线
     * @param columnWidths 列宽度
     * @param alignment 对齐方式
     */
    private generateSeparatorLine;
    /**
     * 格式化行
     * @param row 行数据
     * @param columnWidths 列宽度
     */
    private formatRow;
    /**
     * 转换标题
     * @param html HTML内容
     */
    private convertHeadings;
    /**
     * 转换粗体
     * @param html HTML内容
     */
    private convertBold;
    /**
     * 转换斜体
     * @param html HTML内容
     */
    private convertItalic;
    /**
     * 转换列表
     * @param html HTML内容
     */
    private convertLists;
    /**
     * 转换无序列表
     * @param html HTML内容
     */
    private convertUnorderedLists;
    /**
     * 转换有序列表
     * @param html HTML内容
     */
    private convertOrderedLists;
    /**
     * 转换代码块
     * @param html HTML内容
     */
    private convertCodeBlocks;
    /**
     * 转换链接
     * @param html HTML内容
     */
    private convertLinks;
    /**
     * 转换图片
     * @param html HTML内容
     */
    private convertImages;
    /**
     * 转换脚注
     * @param html HTML内容
     */
    private convertFootnotes;
    /**
     * 后处理Markdown
     * @param markdown Markdown内容
     * @param options 转换选项
     */
    private postprocessMarkdown;
    /**
     * 转义Markdown特殊字符
     * @param text 文本
     */
    private escapeMarkdownCharacters;
    /**
     * 换行处理
     * @param text 文本
     * @param maxWidth 最大宽度
     */
    private wrapLines;
    /**
     * 计算统计信息
     * @param markdownContent Markdown内容
     */
    private calculateStatistics;
}
//# sourceMappingURL=HtmlToMarkdownConverter.d.ts.map