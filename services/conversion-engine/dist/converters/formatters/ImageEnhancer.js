"use strict";
/**
 * @file 图片增强工具
 * @description 提供智能图片增强功能，优化亮度、对比度、饱和度等参数
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-25
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImageEnhancer = exports.EnhancementType = void 0;
const BaseConverter_1 = require("../common/BaseConverter");
const sharp_1 = __importDefault(require("sharp"));
const logger_1 = require("../../utils/logger");
/**
 * 增强类型枚举
 */
var EnhancementType;
(function (EnhancementType) {
    /** 自动增强 */
    EnhancementType["AUTO"] = "auto";
    /** 亮度调整 */
    EnhancementType["BRIGHTNESS"] = "brightness";
    /** 对比度调整 */
    EnhancementType["CONTRAST"] = "contrast";
    /** 饱和度调整 */
    EnhancementType["SATURATION"] = "saturation";
    /** 锐化 */
    EnhancementType["SHARPEN"] = "sharpen";
    /** 降噪 */
    EnhancementType["DENOSIE"] = "denoise";
    /** 去雾 */
    EnhancementType["DEHAZE"] = "dehaze";
})(EnhancementType || (exports.EnhancementType = EnhancementType = {}));
/**
 * 图片增强工具类
 */
class ImageEnhancer extends BaseConverter_1.BaseConverter {
    constructor() {
        super(...arguments);
        this.name = '图片增强工具';
        this.description = '智能优化照片亮度、对比度、饱和度，一键美化';
        this.supportedInputFormats = ['png', 'jpg', 'jpeg', 'webp', 'bmp'];
        this.supportedOutputFormats = ['png', 'jpg', 'jpeg', 'webp'];
    }
    /**
     * 执行图片增强
     * @param inputData 输入数据
     * @param inputFormat 输入格式
     * @param outputFormat 输出格式
     * @param options 增强选项
     */
    async convert(inputData, inputFormat, outputFormat, options = {}) {
        try {
            // 验证格式
            if (!this.canConvert(inputFormat, outputFormat)) {
                return {
                    success: false,
                    data: '',
                    format: outputFormat,
                    error: `不支持的增强格式: ${inputFormat} 到 ${outputFormat}`
                };
            }
            const startTime = Date.now();
            const buffer = typeof inputData === 'string' ? Buffer.from(inputData, 'base64') : inputData;
            // 获取图片元数据
            const metadata = await (0, sharp_1.default)(buffer).metadata();
            // 确定最终输出格式
            const finalOutputFormat = options.outputFormat || outputFormat;
            // 初始化sharp实例
            let sharpInstance = (0, sharp_1.default)(buffer);
            // 应用增强操作
            sharpInstance = this.applyEnhancements(sharpInstance, options);
            // 配置输出质量
            const outputOptions = {};
            if (options.quality !== undefined) {
                outputOptions.quality = options.quality;
            }
            // 执行增强
            const enhancedBuffer = await sharpInstance[finalOutputFormat.toLowerCase()](outputOptions)
                .toBuffer();
            const endTime = Date.now();
            return {
                success: true,
                data: enhancedBuffer,
                format: finalOutputFormat,
                metadata: {
                    originalFormat: inputFormat,
                    convertedFormat: finalOutputFormat,
                    size: enhancedBuffer.length,
                    rows: metadata.height,
                    columns: metadata.width,
                    processingTime: endTime - startTime,
                    enhancementType: options.enhancementType,
                    appliedEnhancements: this.getAppliedEnhancements(options)
                }
            };
        }
        catch (error) {
            logger_1.logger.error(`图片增强失败: ${error.message}`);
            return {
                success: false,
                data: '',
                format: outputFormat,
                error: `图片增强失败: ${error.message}`
            };
        }
    }
    /**
     * 应用增强操作
     * @param sharpInstance sharp实例
     * @param options 增强选项
     */
    applyEnhancements(sharpInstance, options) {
        let processedInstance = sharpInstance;
        // 如果是自动增强或指定了自动优化
        if (options.enhancementType === EnhancementType.AUTO || options.autoEnhance) {
            return this.applyAutoEnhancement(sharpInstance);
        }
        // 根据类型应用特定增强
        switch (options.enhancementType) {
            case EnhancementType.BRIGHTNESS:
                if (options.brightness !== undefined) {
                    processedInstance = this.adjustBrightness(processedInstance, options.brightness);
                }
                break;
            case EnhancementType.CONTRAST:
                if (options.contrast !== undefined) {
                    processedInstance = this.adjustContrast(processedInstance, options.contrast);
                }
                break;
            case EnhancementType.SATURATION:
                if (options.saturation !== undefined) {
                    processedInstance = this.adjustSaturation(processedInstance, options.saturation);
                }
                break;
            case EnhancementType.SHARPEN:
                if (options.sharpenIntensity !== undefined) {
                    processedInstance = this.applySharpening(processedInstance, options.sharpenIntensity);
                }
                break;
            case EnhancementType.DENOSIE:
                if (options.denoiseStrength !== undefined) {
                    processedInstance = this.applyDenoise(processedInstance, options.denoiseStrength);
                }
                break;
            case EnhancementType.DEHAZE:
                // 去雾效果通过组合操作实现
                processedInstance = this.applyDehaze(processedInstance);
                break;
            default:
                // 应用所有指定的增强参数
                if (options.brightness !== undefined) {
                    processedInstance = this.adjustBrightness(processedInstance, options.brightness);
                }
                if (options.contrast !== undefined) {
                    processedInstance = this.adjustContrast(processedInstance, options.contrast);
                }
                if (options.saturation !== undefined) {
                    processedInstance = this.adjustSaturation(processedInstance, options.saturation);
                }
                if (options.sharpenIntensity !== undefined) {
                    processedInstance = this.applySharpening(processedInstance, options.sharpenIntensity);
                }
                if (options.hue !== undefined) {
                    processedInstance = this.adjustHue(processedInstance, options.hue);
                }
                if (options.clarity !== undefined) {
                    processedInstance = this.adjustClarity(processedInstance, options.clarity);
                }
                if (options.shadows !== undefined) {
                    processedInstance = this.adjustShadows(processedInstance, options.shadows);
                }
                if (options.highlights !== undefined) {
                    processedInstance = this.adjustHighlights(processedInstance, options.highlights);
                }
        }
        return processedInstance;
    }
    /**
     * 应用自动增强
     * @param sharpInstance sharp实例
     */
    applyAutoEnhancement(sharpInstance) {
        // 自动增强通过调整多个参数实现
        // 这是一个简单的实现，实际应用中可能需要更复杂的图像分析
        return sharpInstance
            .normalize() // 自动调整对比度
            .modulate({
            brightness: 1.05, // 略微增加亮度
            saturation: 1.1, // 略微增加饱和度
            contrast: 1.1 // 略微增加对比度
        })
            .sharpen({
            sigma: 1,
            flat: 1,
            jagged: 2
        });
    }
    /**
     * 调整亮度
     * @param sharpInstance sharp实例
     * @param brightness 亮度值 (-100 到 100)
     */
    adjustBrightness(sharpInstance, brightness) {
        // 将-100到100的范围映射到0到2
        const factor = Math.max(0, Math.min(2, (brightness + 100) / 100));
        return sharpInstance.modulate({ brightness: factor });
    }
    /**
     * 调整对比度
     * @param sharpInstance sharp实例
     * @param contrast 对比度值 (-100 到 100)
     */
    adjustContrast(sharpInstance, contrast) {
        // 将-100到100的范围映射到0到2
        const factor = Math.max(0, Math.min(2, (contrast + 100) / 100));
        return sharpInstance.modulate({ contrast: factor });
    }
    /**
     * 调整饱和度
     * @param sharpInstance sharp实例
     * @param saturation 饱和度值 (-100 到 100)
     */
    adjustSaturation(sharpInstance, saturation) {
        // 将-100到100的范围映射到0到2
        const factor = Math.max(0, Math.min(2, (saturation + 100) / 100));
        return sharpInstance.modulate({ saturation: factor });
    }
    /**
     * 调整色调
     * @param sharpInstance sharp实例
     * @param hue 色调值 (-100 到 100)
     */
    adjustHue(sharpInstance, hue) {
        // 将-100到100的范围映射到-180到180度
        const degrees = (hue * 1.8);
        return sharpInstance.modulate({ hue: degrees });
    }
    /**
     * 应用锐化
     * @param sharpInstance sharp实例
     * @param intensity 锐化强度 (0 到 10)
     */
    applySharpening(sharpInstance, intensity) {
        const sigma = Math.max(0, Math.min(5, intensity / 2));
        return sharpInstance.sharpen({
            sigma,
            flat: Math.max(0, Math.min(10, intensity / 2)),
            jagged: Math.max(0, Math.min(10, intensity))
        });
    }
    /**
     * 应用降噪
     * @param sharpInstance sharp实例
     * @param strength 降噪强度 (0 到 10)
     */
    applyDenoise(sharpInstance, strength) {
        // 使用blur来模拟降噪效果
        // 实际应用中可能需要更复杂的降噪算法
        const sigma = Math.max(0, Math.min(2, strength * 0.2));
        return sharpInstance.blur(sigma);
    }
    /**
     * 调整清晰度
     * @param sharpInstance sharp实例
     * @param clarity 清晰度值
     */
    adjustClarity(sharpInstance, clarity) {
        // 清晰度通过锐化和对比度组合实现
        const factor = Math.max(-1, Math.min(1, clarity / 100));
        if (factor > 0) {
            return sharpInstance
                .sharpen({
                sigma: factor * 2,
                flat: factor,
                jagged: factor * 3
            })
                .modulate({ contrast: 1 + factor * 0.2 });
        }
        return sharpInstance;
    }
    /**
     * 调整阴影
     * @param sharpInstance sharp实例
     * @param shadows 阴影值
     */
    adjustShadows(sharpInstance, shadows) {
        // 简单实现，通过调整亮度来模拟阴影调整
        const factor = Math.max(0, Math.min(2, (shadows + 100) / 100));
        // 这里需要更复杂的实现，当前只是简化版
        return sharpInstance.modulate({ brightness: factor });
    }
    /**
     * 调整高光
     * @param sharpInstance sharp实例
     * @param highlights 高光值
     */
    adjustHighlights(sharpInstance, highlights) {
        // 简单实现，通过调整对比度来模拟高光调整
        const factor = Math.max(0, Math.min(2, (highlights + 100) / 100));
        // 这里需要更复杂的实现，当前只是简化版
        return sharpInstance.modulate({ contrast: factor });
    }
    /**
     * 应用去雾效果
     * @param sharpInstance sharp实例
     */
    applyDehaze(sharpInstance) {
        // 去雾效果通过增加对比度、饱和度和锐化实现
        return sharpInstance
            .modulate({
            contrast: 1.2,
            saturation: 1.1
        })
            .sharpen({
            sigma: 1.5,
            flat: 1,
            jagged: 2
        });
    }
    /**
     * 获取已应用的增强列表
     * @param options 增强选项
     */
    getAppliedEnhancements(options) {
        const enhancements = [];
        if (options.enhancementType === EnhancementType.AUTO || options.autoEnhance) {
            enhancements.push('auto');
            return enhancements;
        }
        if (options.brightness !== undefined)
            enhancements.push(`brightness: ${options.brightness}`);
        if (options.contrast !== undefined)
            enhancements.push(`contrast: ${options.contrast}`);
        if (options.saturation !== undefined)
            enhancements.push(`saturation: ${options.saturation}`);
        if (options.sharpenIntensity !== undefined)
            enhancements.push(`sharpen: ${options.sharpenIntensity}`);
        if (options.denoiseStrength !== undefined)
            enhancements.push(`denoise: ${options.denoiseStrength}`);
        if (options.hue !== undefined)
            enhancements.push(`hue: ${options.hue}`);
        if (options.clarity !== undefined)
            enhancements.push(`clarity: ${options.clarity}`);
        if (options.shadows !== undefined)
            enhancements.push(`shadows: ${options.shadows}`);
        if (options.highlights !== undefined)
            enhancements.push(`highlights: ${options.highlights}`);
        return enhancements;
    }
}
exports.ImageEnhancer = ImageEnhancer;
//# sourceMappingURL=ImageEnhancer.js.map