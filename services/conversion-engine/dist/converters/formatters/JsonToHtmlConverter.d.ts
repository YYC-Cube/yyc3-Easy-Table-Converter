/**
 * @file JSON到HTML转换器
 * @description 实现JSON数据结构到HTML文档的转换功能
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-20
 */
import { BaseConverter } from '../common/BaseConverter';
import { ConversionOptions, ConversionResult } from '../common/IConverter';
/**
 * JSON到HTML转换选项接口
 */
export interface JsonToHtmlOptions extends ConversionOptions {
    includeHtmlWrapper?: boolean;
    includeHead?: boolean;
    includeBody?: boolean;
    title?: string;
    css?: string;
    prettyPrint?: boolean;
    indent?: number;
    textNodeKey?: string;
    attributePrefix?: string;
    rootElement?: string;
    tableClassName?: string;
    listClassName?: string;
    objectClassName?: string;
    arrayClassName?: string;
    keyClassName?: string;
    valueClassName?: string;
    includeAttributeTypes?: boolean;
    maxDepth?: number;
    useSemanticHtml?: boolean;
    collapseEmptyArrays?: boolean;
    collapseEmptyObjects?: boolean;
    includeJsonSchema?: boolean;
}
/**
 * JSON到HTML转换器类
 */
export declare class JsonToHtmlConverter extends BaseConverter {
    constructor();
    /**
     * 执行JSON到HTML的转换
     * @param inputData JSON输入数据
     * @param inputFormat 输入格式
     * @param outputFormat 输出格式
     * @param options 转换选项
     */
    convert(inputData: Buffer | string, inputFormat: string, outputFormat: string, options?: JsonToHtmlOptions): Promise<ConversionResult>;
    /**
     * 从JavaScript模块中提取JSON
     */
    private extractJsonFromJsModule;
    /**
     * 获取默认CSS样式
     */
    private getDefaultCss;
    /**
     * JSON转HTML的核心方法
     */
    private jsonToHtml;
    /**
     * 判断是否为表格数据
     */
    private isTableData;
    /**
     * 将数据渲染为表格
     */
    private renderAsTable;
    /**
     * 获取数据类型
     */
    private getDataType;
    /**
     * 计算JSON到HTML转换的统计信息
     */
    private calculateJsonToHtmlStatistics;
    /**
     * 递归计算JSON对象和数组数量
     */
    private countJsonObjects;
}
//# sourceMappingURL=JsonToHtmlConverter.d.ts.map