/**
 * @file XML格式化工具
 * @description 实现XML文件的格式化、优化和标准化功能
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-20
 */
import { BaseConverter } from '../common/BaseConverter';
import { ConversionOptions, ConversionResult } from '../common/IConverter';
/**
 * XML格式化选项接口
 */
export interface XmlFormatterOptions extends ConversionOptions {
    indent?: number;
    preserveComments?: boolean;
    removeWhitespace?: boolean;
    normalizeAttributes?: boolean;
    sortAttributes?: boolean;
    compactEmptyElements?: boolean;
    preserveXmlDeclaration?: boolean;
    addXmlDeclaration?: boolean;
    validate?: boolean;
    maxLineWidth?: number;
    collapseWhitespace?: boolean;
    stripComments?: boolean;
    prettyPrint?: boolean;
}
/**
 * XML格式化工具类
 */
export declare class XmlFormatter extends BaseConverter {
    constructor();
    /**
     * 执行XML格式化
     * @param inputData XML输入数据
     * @param inputFormat 输入格式
     * @param outputFormat 输出格式
     * @param options 格式化选项
     */
    convert(inputData: Buffer | string, inputFormat: string, outputFormat: string, options?: XmlFormatterOptions): Promise<ConversionResult>;
    /**
     * 验证XML格式是否有效
     */
    private isValidXml;
    /**
     * 移除XML注释
     */
    private removeComments;
    /**
     * 格式化XML内容
     */
    private formatXml;
    /**
     * 清理XML空白
     */
    private cleanWhitespace;
    /**
     * 美化XML格式
     */
    private prettyPrintXml;
    /**
     * 处理XML声明
     */
    private processXmlDeclaration;
    /**
     * 备用的XML格式化方法
     */
    private alternativeXmlFormat;
    /**
     * 计算XML统计信息
     */
    private calculateXmlStatistics;
}
//# sourceMappingURL=XmlFormatter.d.ts.map