/**
 * @file Markdown到HTML转换器
 * @description 将Markdown格式的文档或表格转换为HTML格式
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-20
 */
import { BaseConverter } from '../common/BaseConverter';
import { ConversionOptions, ConversionResult } from '../common/IConverter';
/**
 * Markdown到HTML转换选项接口
 */
export interface MarkdownToHtmlOptions extends ConversionOptions {
    tableOnly?: boolean;
    includeHeadings?: boolean;
    includeLists?: boolean;
    tableClass?: string;
    tableId?: string;
    responsiveTable?: boolean;
    wrapInDocument?: boolean;
    title?: string;
    description?: string;
    includeDefaultStyles?: boolean;
    customStyles?: string;
    theme?: 'light' | 'dark' | 'none';
    parseLinks?: boolean;
    parseImages?: boolean;
    parseCodeBlocks?: boolean;
    parseEmphasis?: boolean;
    parseBlockquotes?: boolean;
    parseHorizontalRules?: boolean;
    footnotesToEndnotes?: boolean;
    sanitizeHtml?: boolean;
    outputFormat?: 'html' | 'htm';
}
/**
 * Markdown到HTML转换器类
 */
export declare class MarkdownToHtmlConverter extends BaseConverter {
    constructor();
    /**
     * 执行Markdown到HTML的转换
     * @param inputData Markdown输入数据
     * @param inputFormat 输入格式
     * @param outputFormat 输出格式
     * @param options 转换选项
     */
    convert(inputData: Buffer | string, inputFormat: string, outputFormat: string, options?: MarkdownToHtmlOptions): Promise<ConversionResult>;
    /**
     * 将Markdown数据转换为HTML
     * @param inputData Markdown输入数据
     * @param options 转换选项
     */
    private markdownToHtml;
    /**
     * 预处理Markdown
     * @param markdown Markdown内容
     * @param options 转换选项
     */
    private preprocessMarkdown;
    /**
     * 提取并转换表格
     * @param markdown Markdown内容
     * @param options 转换选项
     */
    private extractAndConvertTables;
    /**
     * 转换Markdown表格为HTML表格
     * @param markdown Markdown内容
     * @param options 转换选项
     */
    private convertMarkdownTables;
    /**
     * 转换单个表格为HTML
     * @param tableMarkdown 表格Markdown
     * @param options 转换选项
     */
    private convertSingleTable;
    /**
     * 解析表格行
     * @param line 表格行
     */
    private parseTableRow;
    /**
     * 解析对齐方式
     * @param separatorLine 分隔线
     */
    private parseAlignments;
    /**
     * 转换标题
     * @param markdown Markdown内容
     */
    private convertHeadings;
    /**
     * 转换列表
     * @param markdown Markdown内容
     */
    private convertLists;
    /**
     * 转换无序列表
     * @param markdown Markdown内容
     */
    private convertUnorderedLists;
    /**
     * 转换有序列表
     * @param markdown Markdown内容
     */
    private convertOrderedLists;
    /**
     * 转换代码块
     * @param markdown Markdown内容
     */
    private convertCodeBlocks;
    /**
     * 转换强调（粗体、斜体）
     * @param markdown Markdown内容
     */
    private convertEmphasis;
    /**
     * 转换引用块
     * @param markdown Markdown内容
     */
    private convertBlockquotes;
    /**
     * 转换链接
     * @param markdown Markdown内容
     */
    private convertLinks;
    /**
     * 转换图片
     * @param markdown Markdown内容
     */
    private convertImages;
    /**
     * 转换分隔线
     * @param markdown Markdown内容
     */
    private convertHorizontalRules;
    /**
     * 转换脚注
     * @param markdown Markdown内容
     */
    private convertFootnotes;
    /**
     * 转换段落
     * @param markdown Markdown内容
     */
    private convertParagraphs;
    /**
     * 检查是否是HTML标签
     * @param line 文本行
     */
    private isHtmlTag;
    /**
     * 后处理HTML
     * @param html HTML内容
     * @param options 转换选项
     */
    private postprocessHtml;
    /**
     * 清理HTML内容
     * @param html HTML内容
     */
    private sanitizeHtmlContent;
    /**
     * 包装在HTML文档中
     * @param htmlContent HTML内容
     * @param options 转换选项
     */
    private wrapInHtmlDocument;
    /**
     * 获取默认样式
     * @param theme 主题
     */
    private getDefaultStyles;
    /**
     * 获取浅色主题样式
     */
    private getLightThemeStyles;
    /**
     * 获取深色主题样式
     */
    private getDarkThemeStyles;
    /**
     * 转义HTML字符
     * @param text 文本
     */
    private escapeHtml;
    /**
     * 计算统计信息
     * @param htmlContent HTML内容
     */
    private calculateStatistics;
}
//# sourceMappingURL=MarkdownToHtmlConverter.d.ts.map