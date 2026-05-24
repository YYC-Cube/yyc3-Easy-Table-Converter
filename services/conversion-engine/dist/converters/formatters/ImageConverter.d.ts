/**
 * @file 图片格式转换器
 * @description 提供各种图片格式之间的转换功能
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-25
 */
import { BaseConverter } from '../common/BaseConverter';
import { ConversionResult, ConversionOptions } from '../common/IConverter';
/**
 * 图片转换选项接口
 */
export interface ImageConversionOptions extends ConversionOptions {
    /** 输出质量 (0-100) */
    quality?: number;
    /** 是否保持透明度 */
    preserveAlpha?: boolean;
    /** 背景颜色，当不保持透明度时使用 */
    backgroundColor?: string;
    /** 是否使用渐进式JPEG */
    progressive?: boolean;
    /** 是否使用无损压缩 */
    lossless?: boolean;
}
/**
 * 图片格式转换器类
 */
export declare class ImageConverter extends BaseConverter {
    protected readonly name = "\u56FE\u7247\u683C\u5F0F\u8F6C\u6362\u5668";
    protected readonly description = "\u652F\u6301PNG\u3001JPG\u3001WEBP\u3001GIF\u3001BMP\u7B49\u56FE\u7247\u683C\u5F0F\u4E92\u8F6C";
    protected readonly supportedInputFormats: string[];
    protected readonly supportedOutputFormats: string[];
    /**
     * 执行图片格式转换
     * @param inputData 输入数据
     * @param inputFormat 输入格式
     * @param outputFormat 输出格式
     * @param options 转换选项
     */
    convert(inputData: Buffer | string, inputFormat: string, outputFormat: string, options?: ImageConversionOptions): Promise<ConversionResult>;
    /**
     * 验证图片格式
     * @param format 格式名称
     */
    private isValidImageFormat;
}
//# sourceMappingURL=ImageConverter.d.ts.map