/**
 * @file 增强版Excel到HTML转换器
 * @description 提供高级Excel到HTML表格转换功能，支持复杂样式和格式保留
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-20
 */
import { BaseConverter } from '../common/BaseConverter';
import { ConversionOptions, ConversionResult } from '../common/IConverter';
/**
 * 增强版Excel到HTML转换选项接口
 */
export interface EnhancedXlsxToHtmlOptions extends ConversionOptions {
    sheetName?: string;
    includeHeaders?: boolean;
    headerRow?: number;
    preserveFormatting?: boolean;
    includeColors?: boolean;
    includeFontStyles?: boolean;
    includeBorders?: boolean;
    includeMergedCells?: boolean;
    includeFormulas?: boolean;
    enableFiltering?: boolean;
    enableSorting?: boolean;
    enablePagination?: boolean;
    pageSize?: number;
    responsive?: boolean;
    maxWidth?: number;
    cellContentProcessor?: (content: string, row: number, col: number) => string;
    rowClassGenerator?: (row: number, data: any[]) => string;
    colClassGenerator?: (col: number, data: any[]) => string;
    tableClass?: string;
    headerClass?: string;
    bodyClass?: string;
    cellClass?: string;
    includeTableOfContents?: boolean;
    includeMetadata?: boolean;
    generateSummary?: boolean;
}
/**
 * 增强版Excel到HTML转换器类
 */
export declare class EnhancedXlsxToHtmlConverter extends BaseConverter {
    constructor();
    /**
     * 执行增强版Excel到HTML的转换
     * @param inputData Excel输入数据
     * @param inputFormat 输入格式
     * @param outputFormat 输出格式
     * @param options 转换选项
     */
    convert(inputData: Buffer | string, inputFormat: string, outputFormat: string, options?: EnhancedXlsxToHtmlOptions): Promise<ConversionResult>;
    /**
     * 将Excel数据转换为增强版HTML
     * @param inputData Excel输入数据
     * @param inputFormat 输入格式
     * @param options 转换选项
     */
    private excelToEnhancedHtml;
    /**
     * 解析工作簿
     * @param inputData 输入数据
     * @param inputFormat 输入格式
     * @param options 转换选项
     */
    private parseWorkbook;
    /**
     * 生成模拟数据（用于演示）
     */
    private generateMockData;
    /**
     * 生成HTML文档
     * @param workbookData 工作簿数据
     * @param options 转换选项
     */
    private generateHtmlDocument;
    /**
     * 生成HTML头部
     * @param options 转换选项
     */
    private generateHtmlHeader;
    /**
     * 生成CSS样式
     * @param options 转换选项
     */
    private generateCssStyles;
    /**
     * 生成目录
     * @param workbookData 工作簿数据
     */
    private generateTableOfContents;
    /**
     * 生成摘要
     * @param workbookData 工作簿数据
     */
    private generateSummary;
    /**
     * 生成增强版表格
     * @param data 表格数据
     * @param options 转换选项
     */
    private generateEnhancedTable;
    /**
     * 生成分页控件
     * @param options 转换选项
     */
    private generatePaginationControls;
    /**
     * 生成必要的脚本
     * @param options 转换选项
     */
    private generateRequiredScripts;
    /**
     * 添加元数据
     * @param htmlContent HTML内容
     * @param workbookData 工作簿数据
     */
    private addMetadata;
    /**
     * 计算统计信息
     * @param htmlContent HTML内容
     */
    private calculateStatistics;
}
//# sourceMappingURL=EnhancedXlsxToHtmlConverter.d.ts.map