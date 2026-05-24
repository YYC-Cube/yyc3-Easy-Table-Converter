"use strict";
/**
 * @file 图片压缩工具
 * @description 提供智能图片压缩功能，保持画质的同时减小文件大小
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-25
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImageCompressor = void 0;
const BaseConverter_1 = require("../common/BaseConverter");
const sharp_1 = __importDefault(require("sharp"));
const logger_1 = require("../../utils/logger");
/**
 * 图片压缩工具类
 */
class ImageCompressor extends BaseConverter_1.BaseConverter {
    constructor() {
        super(...arguments);
        this.name = '图片压缩工具';
        this.description = '智能压缩图片大小，保持画质，支持批量处理';
        this.supportedInputFormats = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp'];
        this.supportedOutputFormats = ['png', 'jpg', 'jpeg', 'webp'];
    }
    /**
     * 执行图片压缩
     * @param inputData 输入数据
     * @param inputFormat 输入格式
     * @param outputFormat 输出格式
     * @param options 压缩选项
     */
    async convert(inputData, inputFormat, outputFormat, options = {}) {
        try {
            // 验证格式
            if (!this.canConvert(inputFormat, outputFormat)) {
                return {
                    success: false,
                    data: '',
                    format: outputFormat,
                    error: `不支持的压缩格式: ${inputFormat} 到 ${outputFormat}`
                };
            }
            const startTime = Date.now();
            const buffer = typeof inputData === 'string' ? Buffer.from(inputData, 'base64') : inputData;
            // 获取图片元数据
            const metadata = await (0, sharp_1.default)(buffer).metadata();
            // 确定最终输出格式
            const finalOutputFormat = options.outputFormat || outputFormat;
            // 配置压缩选项
            let compressionOptions = this.getCompressionOptions(options, metadata, finalOutputFormat);
            // 初始化sharp实例
            let sharpInstance = (0, sharp_1.default)(buffer);
            // 应用尺寸调整（如果需要）
            if (options.maxWidth || options.maxHeight) {
                const resizeOptions = {
                    fit: sharp_1.default.fit.inside,
                    withoutEnlargement: true
                };
                if (options.maxWidth)
                    resizeOptions.width = options.maxWidth;
                if (options.maxHeight)
                    resizeOptions.height = options.maxHeight;
                sharpInstance = sharpInstance.resize(resizeOptions);
            }
            // 执行压缩
            let compressedBuffer = await sharpInstance[finalOutputFormat.toLowerCase()](compressionOptions)
                .toBuffer();
            // 如果指定了目标大小并且未达到，尝试进一步压缩
            if (options.targetSizeKB && this.needsFurtherCompression(compressedBuffer, options.targetSizeKB)) {
                compressedBuffer = await this.compressToTargetSize(buffer, finalOutputFormat, options.targetSizeKB, options.maxWidth, options.maxHeight);
            }
            const endTime = Date.now();
            const originalSize = buffer.length;
            const compressedSize = compressedBuffer.length;
            const compressionRatio = ((originalSize - compressedSize) / originalSize * 100).toFixed(2);
            return {
                success: true,
                data: compressedBuffer,
                format: finalOutputFormat,
                metadata: {
                    originalFormat: inputFormat,
                    convertedFormat: finalOutputFormat,
                    size: compressedSize,
                    rows: metadata.height,
                    columns: metadata.width,
                    processingTime: endTime - startTime,
                    compressionRatio: parseFloat(compressionRatio),
                    originalSize: originalSize
                }
            };
        }
        catch (error) {
            logger_1.logger.error(`图片压缩失败: ${error.message}`);
            return {
                success: false,
                data: '',
                format: outputFormat,
                error: `图片压缩失败: ${error.message}`
            };
        }
    }
    /**
     * 获取压缩选项
     * @param options 用户配置的选项
     * @param metadata 图片元数据
     * @param outputFormat 输出格式
     */
    getCompressionOptions(options, metadata, outputFormat) {
        const format = outputFormat.toLowerCase();
        const compressionOptions = {};
        // 智能压缩逻辑
        if (options.smartCompression) {
            // 根据图片类型和尺寸自动调整质量
            if (metadata.width && metadata.height) {
                const totalPixels = metadata.width * metadata.height;
                // 小图使用较高质量
                if (totalPixels < 500000) {
                    compressionOptions.quality = 85;
                }
                // 中图使用中等质量
                else if (totalPixels < 2000000) {
                    compressionOptions.quality = 80;
                }
                // 大图使用较低质量
                else {
                    compressionOptions.quality = 75;
                }
            }
        }
        // 用户指定的质量优先
        if (options.quality !== undefined) {
            compressionOptions.quality = options.quality;
        }
        // 格式特定选项
        if (format === 'jpg' || format === 'jpeg') {
            compressionOptions.progressive = true;
            compressionOptions.optimiseScans = true;
        }
        else if (format === 'png') {
            compressionOptions.compressionLevel = 9; // 最高压缩级别
            compressionOptions.force = true;
        }
        else if (format === 'webp') {
            compressionOptions.lossless = options.lossless || false;
            if (!compressionOptions.lossless && !compressionOptions.quality) {
                compressionOptions.quality = 85;
            }
        }
        return compressionOptions;
    }
    /**
     * 检查是否需要进一步压缩
     * @param buffer 压缩后的缓冲区
     * @param targetSizeKB 目标大小（KB）
     */
    needsFurtherCompression(buffer, targetSizeKB) {
        const currentSizeKB = buffer.length / 1024;
        return currentSizeKB > targetSizeKB;
    }
    /**
     * 尝试压缩到目标大小
     * @param originalBuffer 原始缓冲区
     * @param format 输出格式
     * @param targetSizeKB 目标大小（KB）
     * @param maxWidth 最大宽度
     * @param maxHeight 最大高度
     */
    async compressToTargetSize(originalBuffer, format, targetSizeKB, maxWidth, maxHeight) {
        let quality = 80;
        let bestBuffer = originalBuffer;
        let iterations = 0;
        const maxIterations = 5;
        // 二分查找最佳质量设置
        while (iterations < maxIterations) {
            let sharpInstance = (0, sharp_1.default)(originalBuffer);
            // 应用尺寸限制
            if (maxWidth || maxHeight) {
                sharpInstance = sharpInstance.resize({
                    width: maxWidth,
                    height: maxHeight,
                    fit: sharp_1.default.fit.inside,
                    withoutEnlargement: true
                });
            }
            // 尝试不同质量的压缩
            const currentBuffer = await sharpInstance[format.toLowerCase()]({ quality })
                .toBuffer();
            const currentSizeKB = currentBuffer.length / 1024;
            if (currentSizeKB <= targetSizeKB * 1.1) { // 允许10%误差
                bestBuffer = currentBuffer;
                break;
            }
            // 调整质量（每次降低10%）
            quality -= 10;
            if (quality < 30)
                break; // 最低质量限制
            iterations++;
        }
        return bestBuffer;
    }
}
exports.ImageCompressor = ImageCompressor;
//# sourceMappingURL=ImageCompressor.js.map