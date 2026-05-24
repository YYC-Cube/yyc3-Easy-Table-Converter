/**
 * @file 图片增强工具
 * @description 提供智能图片增强功能，优化亮度、对比度、饱和度等参数
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-25
 */
import { BaseConverter } from '../common/BaseConverter';
import { ConversionResult, ConversionOptions } from '../common/IConverter';
/**
 * 增强类型枚举
 */
export declare enum EnhancementType {
    /** 自动增强 */
    AUTO = "auto",
    /** 亮度调整 */
    BRIGHTNESS = "brightness",
    /** 对比度调整 */
    CONTRAST = "contrast",
    /** 饱和度调整 */
    SATURATION = "saturation",
    /** 锐化 */
    SHARPEN = "sharpen",
    /** 降噪 */
    DENOSIE = "denoise",
    /** 去雾 */
    DEHAZE = "dehaze"
}
/**
 * 图片增强选项接口
 */
export interface ImageEnhancementOptions extends ConversionOptions {
    /** 增强类型 */
    enhancementType?: EnhancementType;
    /** 亮度调整 (-100 到 100) */
    brightness?: number;
    /** 对比度调整 (-100 到 100) */
    contrast?: number;
    /** 饱和度调整 (-100 到 100) */
    saturation?: number;
    /** 锐化强度 (0 到 10) */
    sharpenIntensity?: number;
    /** 降噪强度 (0 到 10) */
    denoiseStrength?: number;
    /** 是否应用自动优化 */
    autoEnhance?: boolean;
    /** 输出质量 (0-100) */
    quality?: number;
    /** 色调调整 (-100 到 100) */
    hue?: number;
    /** 输出格式（可选，保持原格式或指定新格式） */
    outputFormat?: string;
    /** 是否调整清晰度 */
    clarity?: number;
    /** 阴影调整 (-100 到 100) */
    shadows?: number;
    /** 高光调整 (-100 到 100) */
    highlights?: number;
}
/**
 * 图片增强工具类
 */
export declare class ImageEnhancer extends BaseConverter {
    protected readonly name = "\u56FE\u7247\u589E\u5F3A\u5DE5\u5177";
    protected readonly description = "\u667A\u80FD\u4F18\u5316\u7167\u7247\u4EAE\u5EA6\u3001\u5BF9\u6BD4\u5EA6\u3001\u9971\u548C\u5EA6\uFF0C\u4E00\u952E\u7F8E\u5316";
    protected readonly supportedInputFormats: string[];
    protected readonly supportedOutputFormats: string[];
    /**
     * 执行图片增强
     * @param inputData 输入数据
     * @param inputFormat 输入格式
     * @param outputFormat 输出格式
     * @param options 增强选项
     */
    convert(inputData: Buffer | string, inputFormat: string, outputFormat: string, options?: ImageEnhancementOptions): Promise<ConversionResult>;
    /**
     * 应用增强操作
     * @param sharpInstance sharp实例
     * @param options 增强选项
     */
    private applyEnhancements;
    /**
     * 应用自动增强
     * @param sharpInstance sharp实例
     */
    private applyAutoEnhancement;
    /**
     * 调整亮度
     * @param sharpInstance sharp实例
     * @param brightness 亮度值 (-100 到 100)
     */
    private adjustBrightness;
    /**
     * 调整对比度
     * @param sharpInstance sharp实例
     * @param contrast 对比度值 (-100 到 100)
     */
    private adjustContrast;
    /**
     * 调整饱和度
     * @param sharpInstance sharp实例
     * @param saturation 饱和度值 (-100 到 100)
     */
    private adjustSaturation;
    /**
     * 调整色调
     * @param sharpInstance sharp实例
     * @param hue 色调值 (-100 到 100)
     */
    private adjustHue;
    /**
     * 应用锐化
     * @param sharpInstance sharp实例
     * @param intensity 锐化强度 (0 到 10)
     */
    private applySharpening;
    /**
     * 应用降噪
     * @param sharpInstance sharp实例
     * @param strength 降噪强度 (0 到 10)
     */
    private applyDenoise;
    /**
     * 调整清晰度
     * @param sharpInstance sharp实例
     * @param clarity 清晰度值
     */
    private adjustClarity;
    /**
     * 调整阴影
     * @param sharpInstance sharp实例
     * @param shadows 阴影值
     */
    private adjustShadows;
    /**
     * 调整高光
     * @param sharpInstance sharp实例
     * @param highlights 高光值
     */
    private adjustHighlights;
    /**
     * 应用去雾效果
     * @param sharpInstance sharp实例
     */
    private applyDehaze;
    /**
     * 获取已应用的增强列表
     * @param options 增强选项
     */
    private getAppliedEnhancements;
}
//# sourceMappingURL=ImageEnhancer.d.ts.map