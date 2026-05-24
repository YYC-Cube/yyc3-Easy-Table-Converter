/**
 * @file 图片压缩工具
 * @description 提供智能图片压缩功能，保持画质的同时减小文件大小
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-25
 */
import { BaseConverter } from '../common/BaseConverter';
import { ConversionResult, ConversionOptions } from '../common/IConverter';
/**
 * 图片压缩选项接口
 */
export interface ImageCompressionOptions extends ConversionOptions {
    /** 压缩质量 (0-100) */
    quality?: number;
    /** 最大宽度（可选，用于等比例缩小） */
    maxWidth?: number;
    /** 最大高度（可选，用于等比例缩小） */
    maxHeight?: number;
    /** 是否使用无损压缩 */
    lossless?: boolean;
    /** 是否启用智能压缩（根据图片内容自动选择最佳参数） */
    smartCompression?: boolean;
    /** 输出格式（可选，保持原格式或指定新格式） */
    outputFormat?: string;
    /** 压缩目标大小（KB，近似值） */
    targetSizeKB?: number;
}
/**
 * 图片压缩工具类
 */
export declare class ImageCompressor extends BaseConverter {
    protected readonly name = "\u56FE\u7247\u538B\u7F29\u5DE5\u5177";
    protected readonly description = "\u667A\u80FD\u538B\u7F29\u56FE\u7247\u5927\u5C0F\uFF0C\u4FDD\u6301\u753B\u8D28\uFF0C\u652F\u6301\u6279\u91CF\u5904\u7406";
    protected readonly supportedInputFormats: string[];
    protected readonly supportedOutputFormats: string[];
    /**
     * 执行图片压缩
     * @param inputData 输入数据
     * @param inputFormat 输入格式
     * @param outputFormat 输出格式
     * @param options 压缩选项
     */
    convert(inputData: Buffer | string, inputFormat: string, outputFormat: string, options?: ImageCompressionOptions): Promise<ConversionResult>;
    /**
     * 获取压缩选项
     * @param options 用户配置的选项
     * @param metadata 图片元数据
     * @param outputFormat 输出格式
     */
    private getCompressionOptions;
    /**
     * 检查是否需要进一步压缩
     * @param buffer 压缩后的缓冲区
     * @param targetSizeKB 目标大小（KB）
     */
    private needsFurtherCompression;
    /**
     * 尝试压缩到目标大小
     * @param originalBuffer 原始缓冲区
     * @param format 输出格式
     * @param targetSizeKB 目标大小（KB）
     * @param maxWidth 最大宽度
     * @param maxHeight 最大高度
     */
    private compressToTargetSize;
}
//# sourceMappingURL=ImageCompressor.d.ts.map