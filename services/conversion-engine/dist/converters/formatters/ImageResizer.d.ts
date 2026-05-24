/**
 * @file 图片尺寸调整工具
 * @description 提供灵活的图片尺寸调整功能，支持多种调整模式和预设尺寸
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-25
 */
import { BaseConverter } from '../common/BaseConverter';
import { ConversionResult, ConversionOptions } from '../common/IConverter';
/**
 * 调整模式枚举
 */
export declare enum ResizeMode {
    /** 等比例缩放，保持宽高比，适应指定尺寸 */
    CONTAIN = "contain",
    /** 等比例缩放，填充指定尺寸，可能裁剪图片 */
    COVER = "cover",
    /** 直接调整到指定尺寸，不保持宽高比 */
    STRETCH = "stretch",
    /** 等比例缩小，不放大 */
    SHRINK = "shrink",
    /** 等比例放大，不缩小 */
    ENLARGE = "enlarge"
}
/**
 * 预设尺寸类型
 */
export interface PresetSize {
    name: string;
    width: number;
    height: number;
    description: string;
}
/**
 * 尺寸调整选项接口
 */
export interface ImageResizeOptions extends ConversionOptions {
    /** 目标宽度 */
    width?: number;
    /** 目标高度 */
    height?: number;
    /** 调整模式 */
    mode?: ResizeMode;
    /** 预设尺寸名称 */
    preset?: string;
    /** 背景颜色（当使用contain模式时） */
    backgroundColor?: string;
    /** 输出质量 (0-100) */
    quality?: number;
    /** 是否保持元数据 */
    preserveMetadata?: boolean;
    /** 裁剪位置（当使用cover模式时） */
    position?: 'top' | 'bottom' | 'left' | 'right' | 'center' | 'attention';
    /** 是否使用防锯齿 */
    antialias?: boolean;
    /** 输出格式（可选，保持原格式或指定新格式） */
    outputFormat?: string;
}
/**
 * 图片尺寸调整工具类
 */
export declare class ImageResizer extends BaseConverter {
    protected readonly name = "\u56FE\u7247\u5C3A\u5BF8\u8C03\u6574\u5DE5\u5177";
    protected readonly description = "\u8C03\u6574\u56FE\u7247\u5C3A\u5BF8\uFF0C\u652F\u6301\u9884\u8BBE\u5C3A\u5BF8\u548C\u591A\u79CD\u8C03\u6574\u6A21\u5F0F";
    protected readonly supportedInputFormats: string[];
    protected readonly supportedOutputFormats: string[];
    private readonly presetSizes;
    /**
     * 执行图片尺寸调整
     * @param inputData 输入数据
     * @param inputFormat 输入格式
     * @param outputFormat 输出格式
     * @param options 调整选项
     */
    convert(inputData: Buffer | string, inputFormat: string, outputFormat: string, options?: ImageResizeOptions): Promise<ConversionResult>;
    /**
     * 计算目标尺寸
     * @param options 调整选项
     * @param metadata 图片元数据
     */
    private calculateTargetDimensions;
    /**
     * 获取调整选项
     * @param options 用户配置的选项
     * @param targetDimensions 目标尺寸
     */
    private getResizeOptions;
    /**
     * 获取所有预设尺寸
     */
    getPresetSizes(): PresetSize[];
    /**
     * 验证预设尺寸名称
     * @param name 预设尺寸名称
     */
    isValidPreset(name: string): boolean;
}
//# sourceMappingURL=ImageResizer.d.ts.map