"use strict";
/**
 * @file 图片水印工具
 * @description 为图片添加文字或图片水印，支持多种水印位置、透明度和旋转角度设置
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-25
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImageWatermark = exports.WatermarkPosition = exports.WatermarkType = void 0;
const BaseConverter_1 = require("../common/BaseConverter");
const sharp_1 = __importDefault(require("sharp"));
const logger_1 = require("../../utils/logger");
/**
 * 水印类型枚举
 */
var WatermarkType;
(function (WatermarkType) {
    /** 文字水印 */
    WatermarkType["TEXT"] = "text";
    /** 图片水印 */
    WatermarkType["IMAGE"] = "image";
})(WatermarkType || (exports.WatermarkType = WatermarkType = {}));
/**
 * 水印位置枚举
 */
var WatermarkPosition;
(function (WatermarkPosition) {
    /** 左上角 */
    WatermarkPosition["TOP_LEFT"] = "top_left";
    /** 右上角 */
    WatermarkPosition["TOP_RIGHT"] = "top_right";
    /** 左下角 */
    WatermarkPosition["BOTTOM_LEFT"] = "bottom_left";
    /** 右下角 */
    WatermarkPosition["BOTTOM_RIGHT"] = "bottom_right";
    /** 中央 */
    WatermarkPosition["CENTER"] = "center";
    /** 平铺 */
    WatermarkPosition["TILE"] = "tile";
})(WatermarkPosition || (exports.WatermarkPosition = WatermarkPosition = {}));
/**
 * 图片水印工具类
 */
class ImageWatermark extends BaseConverter_1.BaseConverter {
    constructor() {
        super(...arguments);
        this.name = '图片水印工具';
        this.description = '为图片添加文字或图片水印，支持多种样式和位置设置';
        this.supportedInputFormats = ['png', 'jpg', 'jpeg', 'webp', 'bmp'];
        this.supportedOutputFormats = ['png', 'jpg', 'jpeg', 'webp'];
    }
    /**
     * 执行图片水印添加
     * @param inputData 输入数据
     * @param inputFormat 输入格式
     * @param outputFormat 输出格式
     * @param options 水印选项
     */
    async convert(inputData, inputFormat, outputFormat, options) {
        try {
            // 验证格式
            if (!this.canConvert(inputFormat, outputFormat)) {
                return {
                    success: false,
                    data: '',
                    format: outputFormat,
                    error: `不支持的水印格式: ${inputFormat} 到 ${outputFormat}`
                };
            }
            // 验证水印选项
            if (!this.validateWatermarkOptions(options)) {
                return {
                    success: false,
                    data: '',
                    format: outputFormat,
                    error: '水印选项不完整或无效'
                };
            }
            const startTime = Date.now();
            const buffer = typeof inputData === 'string' ? Buffer.from(inputData, 'base64') : inputData;
            // 确定最终输出格式
            const finalOutputFormat = options.keepOriginalFormat ? inputFormat : outputFormat;
            // 获取主图片信息
            const mainImage = (0, sharp_1.default)(buffer);
            const metadata = await mainImage.metadata();
            // 准备水印
            let watermarkImage;
            if (options.type === WatermarkType.TEXT) {
                watermarkImage = await this.createTextWatermark(options);
            }
            else {
                const watermarkBuffer = typeof options.watermarkImage === 'string'
                    ? Buffer.from(options.watermarkImage, 'base64')
                    : options.watermarkImage;
                watermarkImage = (0, sharp_1.default)(watermarkBuffer).ensureAlpha();
            }
            // 获取水印元数据
            const watermarkMetadata = await watermarkImage.metadata();
            // 应用水印
            const watermarkedBuffer = await this.applyWatermark(buffer, watermarkImage, metadata, watermarkMetadata, options, finalOutputFormat);
            const endTime = Date.now();
            return {
                success: true,
                data: watermarkedBuffer,
                format: finalOutputFormat,
                metadata: {
                    originalFormat: inputFormat,
                    convertedFormat: finalOutputFormat,
                    size: watermarkedBuffer.length,
                    rows: metadata.height,
                    columns: metadata.width,
                    processingTime: endTime - startTime,
                    watermarkType: options.type,
                    watermarkPosition: options.position,
                    opacity: options.opacity
                }
            };
        }
        catch (error) {
            logger_1.logger.error(`添加水印失败: ${error.message}`);
            return {
                success: false,
                data: '',
                format: outputFormat,
                error: `添加水印失败: ${error.message}`
            };
        }
    }
    /**
     * 验证水印选项
     * @param options 水印选项
     */
    validateWatermarkOptions(options) {
        // 检查必需参数
        if (!options.type || !options.position || options.opacity === undefined) {
            return false;
        }
        // 检查文字水印必需参数
        if (options.type === WatermarkType.TEXT && !options.text) {
            return false;
        }
        // 检查图片水印必需参数
        if (options.type === WatermarkType.IMAGE && !options.watermarkImage) {
            return false;
        }
        // 验证透明度范围
        if (options.opacity < 0 || options.opacity > 100) {
            return false;
        }
        return true;
    }
    /**
     * 创建文字水印
     * @param options 水印选项
     */
    async createTextWatermark(options) {
        // 默认文字样式
        const fontFamily = options.fontFamily || 'Arial';
        const fontSize = options.fontSize || 24;
        const fontColor = options.fontColor || 'rgba(0, 0, 0, 1)';
        const fontWeight = options.fontWeight || 'normal';
        // 创建SVG文字水印
        const svgText = `
      <svg width="400" height="200" xmlns="http://www.w3.org/2000/svg">
        <text 
          x="50%" 
          y="50%" 
          font-family="${fontFamily}" 
          font-size="${fontSize}" 
          font-weight="${fontWeight}" 
          fill="${fontColor}" 
          text-anchor="middle" 
          dominant-baseline="middle"
        >
          ${options.text}
        </text>
      </svg>
    `;
        // 创建文字水印图片
        return (0, sharp_1.default)(Buffer.from(svgText)).ensureAlpha();
    }
    /**
     * 应用水印
     * @param mainBuffer 主图片数据
     * @param watermarkImage 水印图片
     * @param mainMetadata 主图片元数据
     * @param watermarkMetadata 水印元数据
     * @param options 水印选项
     * @param outputFormat 输出格式
     */
    async applyWatermark(mainBuffer, watermarkImage, mainMetadata, watermarkMetadata, options, outputFormat) {
        // 准备主图片
        let mainImage = (0, sharp_1.default)(mainBuffer);
        // 处理水印透明度
        const opacity = options.opacity / 100;
        watermarkImage = watermarkImage.opacity(opacity);
        // 处理旋转
        if (options.rotation && options.rotation !== 0) {
            watermarkImage = watermarkImage.rotate(options.rotation);
        }
        // 处理不同的水印位置
        switch (options.position) {
            case WatermarkPosition.TOP_LEFT:
            case WatermarkPosition.TOP_RIGHT:
            case WatermarkPosition.BOTTOM_LEFT:
            case WatermarkPosition.BOTTOM_RIGHT:
            case WatermarkPosition.CENTER:
                return this.applySingleWatermark(mainImage, watermarkImage, mainMetadata, watermarkMetadata, options, outputFormat);
            case WatermarkPosition.TILE:
                return this.applyTileWatermark(mainBuffer, watermarkImage, mainMetadata, watermarkMetadata, options, outputFormat);
            default:
                throw new Error(`不支持的水印位置: ${options.position}`);
        }
    }
    /**
     * 应用单个水印
     * @param mainImage 主图片
     * @param watermarkImage 水印图片
     * @param mainMetadata 主图片元数据
     * @param watermarkMetadata 水印元数据
     * @param options 水印选项
     * @param outputFormat 输出格式
     */
    async applySingleWatermark(mainImage, watermarkImage, mainMetadata, watermarkMetadata, options, outputFormat) {
        const padding = options.padding || 20;
        // 计算水印位置
        let left = 0;
        let top = 0;
        const mainWidth = mainMetadata.width || 0;
        const mainHeight = mainMetadata.height || 0;
        const watermarkWidth = watermarkMetadata.width || 0;
        const watermarkHeight = watermarkMetadata.height || 0;
        // 确保水印不会超出图片边界，适当缩放
        const maxWatermarkWidth = mainWidth * 0.3;
        const maxWatermarkHeight = mainHeight * 0.3;
        let scale = 1;
        if (watermarkWidth > maxWatermarkWidth) {
            scale = maxWatermarkWidth / watermarkWidth;
        }
        if (watermarkHeight > maxWatermarkHeight) {
            const heightScale = maxWatermarkHeight / watermarkHeight;
            scale = Math.min(scale, heightScale);
        }
        if (scale < 1) {
            watermarkImage = watermarkImage.resize({
                width: Math.round(watermarkWidth * scale),
                height: Math.round(watermarkHeight * scale),
                fit: 'inside'
            });
            // 更新水印尺寸
            const newMetadata = await watermarkImage.metadata();
            watermarkWidth = newMetadata.width || 0;
            watermarkHeight = newMetadata.height || 0;
        }
        // 计算位置
        switch (options.position) {
            case WatermarkPosition.TOP_LEFT:
                left = padding;
                top = padding;
                break;
            case WatermarkPosition.TOP_RIGHT:
                left = mainWidth - watermarkWidth - padding;
                top = padding;
                break;
            case WatermarkPosition.BOTTOM_LEFT:
                left = padding;
                top = mainHeight - watermarkHeight - padding;
                break;
            case WatermarkPosition.BOTTOM_RIGHT:
                left = mainWidth - watermarkWidth - padding;
                top = mainHeight - watermarkHeight - padding;
                break;
            case WatermarkPosition.CENTER:
                left = Math.floor((mainWidth - watermarkWidth) / 2);
                top = Math.floor((mainHeight - watermarkHeight) / 2);
                break;
        }
        // 合成水印
        return mainImage
            .composite([{
                input: await watermarkImage.toBuffer(),
                left,
                top
            }])[outputFormat.toLowerCase()](options.quality ? { quality: options.quality } : {})
            .toBuffer();
    }
    /**
     * 应用平铺水印
     * @param mainBuffer 主图片数据
     * @param watermarkImage 水印图片
     * @param mainMetadata 主图片元数据
     * @param watermarkMetadata 水印元数据
     * @param options 水印选项
     * @param outputFormat 输出格式
     */
    async applyTileWatermark(mainBuffer, watermarkImage, mainMetadata, watermarkMetadata, options, outputFormat) {
        const mainWidth = mainMetadata.width || 0;
        const mainHeight = mainMetadata.height || 0;
        const watermarkWidth = watermarkMetadata.width || 0;
        const watermarkHeight = watermarkMetadata.height || 0;
        // 计算平铺参数
        const spacing = options.tileSpacing || 40;
        const scale = options.tileScale || 0.5;
        // 缩放水印
        const scaledWatermark = watermarkImage.resize({
            width: Math.round(watermarkWidth * scale),
            height: Math.round(watermarkHeight * scale),
            fit: 'inside'
        });
        const scaledMetadata = await scaledWatermark.metadata();
        const scaledWidth = scaledMetadata.width || 0;
        const scaledHeight = scaledMetadata.height || 0;
        // 计算平铺水印数量
        const tilesX = Math.ceil(mainWidth / (scaledWidth + spacing));
        const tilesY = Math.ceil(mainHeight / (scaledHeight + spacing));
        // 准备平铺水印
        const watermarkBuffer = await scaledWatermark.toBuffer();
        const composites = [];
        // 生成平铺水印位置
        for (let y = 0; y < tilesY; y++) {
            for (let x = 0; x < tilesX; x++) {
                composites.push({
                    input: watermarkBuffer,
                    left: x * (scaledWidth + spacing),
                    top: y * (scaledHeight + spacing)
                });
            }
        }
        // 应用所有水印
        return (0, sharp_1.default)(mainBuffer)
            .composite(composites)[outputFormat.toLowerCase()](options.quality ? { quality: options.quality } : {})
            .toBuffer();
    }
    /**
     * 预生成水印模板
     * @param options 水印选项
     */
    async generateWatermarkTemplate(options) {
        if (options.type === WatermarkType.TEXT) {
            const textWatermark = await this.createTextWatermark(options);
            return textWatermark.png().toBuffer();
        }
        else {
            const watermarkBuffer = typeof options.watermarkImage === 'string'
                ? Buffer.from(options.watermarkImage, 'base64')
                : options.watermarkImage;
            return (0, sharp_1.default)(watermarkBuffer)
                .opacity(options.opacity / 100)
                .png()
                .toBuffer();
        }
    }
}
exports.ImageWatermark = ImageWatermark;
//# sourceMappingURL=ImageWatermark.js.map