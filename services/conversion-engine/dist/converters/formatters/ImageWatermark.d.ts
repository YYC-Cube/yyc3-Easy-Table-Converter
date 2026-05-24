/**
 * @file 图片水印工具
 * @description 为图片添加文字或图片水印，支持多种水印位置、透明度和旋转角度设置
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-25
 */
import { BaseConverter } from '../common/BaseConverter';
import { ConversionResult, ConversionOptions } from '../common/IConverter';
/**
 * 水印类型枚举
 */
export declare enum WatermarkType {
    /** 文字水印 */
    TEXT = "text",
    /** 图片水印 */
    IMAGE = "image"
}
/**
 * 水印位置枚举
 */
export declare enum WatermarkPosition {
    /** 左上角 */
    TOP_LEFT = "top_left",
    /** 右上角 */
    TOP_RIGHT = "top_right",
    /** 左下角 */
    BOTTOM_LEFT = "bottom_left",
    /** 右下角 */
    BOTTOM_RIGHT = "bottom_right",
    /** 中央 */
    CENTER = "center",
    /** 平铺 */
    TILE = "tile"
}
/**
 * 水印选项接口
 */
export interface WatermarkOptions extends ConversionOptions {
    /** 水印类型 */
    type: WatermarkType;
    /** 水印位置 */
    position: WatermarkPosition;
    /** 水印透明度 (0-100) */
    opacity: number;
    /** 旋转角度 (0-360) */
    rotation?: number;
    /** 文字水印内容 */
    text?: string;
    /** 文字字体 */
    fontFamily?: string;
    /** 文字大小 */
    fontSize?: number;
    /** 文字颜色 */
    fontColor?: string;
    /** 文字粗体 */
    fontWeight?: 'normal' | 'bold';
    /** 图片水印数据 */
    watermarkImage?: Buffer | string;
    /** 水印与边缘的距离 */
    padding?: number;
    /** 平铺水印的间隔 */
    tileSpacing?: number;
    /** 平铺水印的缩放比例 */
    tileScale?: number;
    /** 输出质量 (0-100) */
    quality?: number;
    /** 是否保持原图片格式 */
    keepOriginalFormat?: boolean;
}
/**
 * 图片水印工具类
 */
export declare class ImageWatermark extends BaseConverter {
    protected readonly name = "\u56FE\u7247\u6C34\u5370\u5DE5\u5177";
    protected readonly description = "\u4E3A\u56FE\u7247\u6DFB\u52A0\u6587\u5B57\u6216\u56FE\u7247\u6C34\u5370\uFF0C\u652F\u6301\u591A\u79CD\u6837\u5F0F\u548C\u4F4D\u7F6E\u8BBE\u7F6E";
    protected readonly supportedInputFormats: string[];
    protected readonly supportedOutputFormats: string[];
    /**
     * 执行图片水印添加
     * @param inputData 输入数据
     * @param inputFormat 输入格式
     * @param outputFormat 输出格式
     * @param options 水印选项
     */
    convert(inputData: Buffer | string, inputFormat: string, outputFormat: string, options: WatermarkOptions): Promise<ConversionResult>;
    /**
     * 验证水印选项
     * @param options 水印选项
     */
    private validateWatermarkOptions;
    /**
     * 创建文字水印
     * @param options 水印选项
     */
    private createTextWatermark;
    /**
     * 应用水印
     * @param mainBuffer 主图片数据
     * @param watermarkImage 水印图片
     * @param mainMetadata 主图片元数据
     * @param watermarkMetadata 水印元数据
     * @param options 水印选项
     * @param outputFormat 输出格式
     */
    private applyWatermark;
    /**
     * 应用单个水印
     * @param mainImage 主图片
     * @param watermarkImage 水印图片
     * @param mainMetadata 主图片元数据
     * @param watermarkMetadata 水印元数据
     * @param options 水印选项
     * @param outputFormat 输出格式
     */
    private applySingleWatermark;
    /**
     * 应用平铺水印
     * @param mainBuffer 主图片数据
     * @param watermarkImage 水印图片
     * @param mainMetadata 主图片元数据
     * @param watermarkMetadata 水印元数据
     * @param options 水印选项
     * @param outputFormat 输出格式
     */
    private applyTileWatermark;
    /**
     * 预生成水印模板
     * @param options 水印选项
     */
    generateWatermarkTemplate(options: WatermarkOptions): Promise<Buffer>;
}
//# sourceMappingURL=ImageWatermark.d.ts.map