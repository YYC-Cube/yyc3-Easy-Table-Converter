"use strict";
/**
 * @file 图片尺寸调整工具
 * @description 提供灵活的图片尺寸调整功能，支持多种调整模式和预设尺寸
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-25
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImageResizer = exports.ResizeMode = void 0;
const BaseConverter_1 = require("../common/BaseConverter");
const sharp_1 = __importDefault(require("sharp"));
const logger_1 = require("../../utils/logger");
/**
 * 调整模式枚举
 */
var ResizeMode;
(function (ResizeMode) {
    /** 等比例缩放，保持宽高比，适应指定尺寸 */
    ResizeMode["CONTAIN"] = "contain";
    /** 等比例缩放，填充指定尺寸，可能裁剪图片 */
    ResizeMode["COVER"] = "cover";
    /** 直接调整到指定尺寸，不保持宽高比 */
    ResizeMode["STRETCH"] = "stretch";
    /** 等比例缩小，不放大 */
    ResizeMode["SHRINK"] = "shrink";
    /** 等比例放大，不缩小 */
    ResizeMode["ENLARGE"] = "enlarge";
})(ResizeMode || (exports.ResizeMode = ResizeMode = {}));
/**
 * 图片尺寸调整工具类
 */
class ImageResizer extends BaseConverter_1.BaseConverter {
    constructor() {
        super(...arguments);
        this.name = '图片尺寸调整工具';
        this.description = '调整图片尺寸，支持预设尺寸和多种调整模式';
        this.supportedInputFormats = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp'];
        this.supportedOutputFormats = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp'];
        // 预定义的常用尺寸
        this.presetSizes = {
            // 社交媒体尺寸
            'facebook-post': { name: 'Facebook帖子', width: 1200, height: 630, description: 'Facebook标准帖子图片' },
            'twitter-post': { name: 'Twitter帖子', width: 1200, height: 675, description: 'Twitter标准帖子图片' },
            'instagram-post': { name: 'Instagram帖子', width: 1080, height: 1080, description: 'Instagram方形帖子' },
            'linkedin-post': { name: 'LinkedIn帖子', width: 1200, height: 627, description: 'LinkedIn标准帖子图片' },
            // 头像尺寸
            'avatar-small': { name: '小头像', width: 64, height: 64, description: '小型用户头像' },
            'avatar-medium': { name: '中头像', width: 128, height: 128, description: '中型用户头像' },
            'avatar-large': { name: '大头像', width: 256, height: 256, description: '大型用户头像' },
            // 应用图标尺寸
            'ios-icon': { name: 'iOS图标', width: 1024, height: 1024, description: 'iOS App Store图标' },
            'android-icon': { name: 'Android图标', width: 512, height: 512, description: 'Android Play Store图标' },
            'favicon': { name: '网站图标', width: 32, height: 32, description: '标准网站favicon' },
            // 文档尺寸
            'thumbnail': { name: '缩略图', width: 320, height: 240, description: '标准缩略图尺寸' },
            'banner': { name: '横幅', width: 1920, height: 300, description: '网站顶部横幅' },
            'hero': { name: '英雄区', width: 1600, height: 800, description: '网站英雄区大图' },
            // 设备屏幕
            'iphone-screen': { name: 'iPhone屏幕', width: 1125, height: 2436, description: 'iPhone X/XS/11 Pro' },
            'ipad-screen': { name: 'iPad屏幕', width: 2048, height: 2732, description: 'iPad Pro 12.9' }
        };
    }
    /**
     * 执行图片尺寸调整
     * @param inputData 输入数据
     * @param inputFormat 输入格式
     * @param outputFormat 输出格式
     * @param options 调整选项
     */
    async convert(inputData, inputFormat, outputFormat, options = {}) {
        try {
            // 验证格式
            if (!this.canConvert(inputFormat, outputFormat)) {
                return {
                    success: false,
                    data: '',
                    format: outputFormat,
                    error: `不支持的格式: ${inputFormat} 到 ${outputFormat}`
                };
            }
            const startTime = Date.now();
            const buffer = typeof inputData === 'string' ? Buffer.from(inputData, 'base64') : inputData;
            // 获取图片元数据
            const metadata = await (0, sharp_1.default)(buffer).metadata();
            // 确定目标尺寸
            const targetDimensions = this.calculateTargetDimensions(options, metadata);
            if (!targetDimensions.width || !targetDimensions.height) {
                return {
                    success: false,
                    data: '',
                    format: outputFormat,
                    error: '未指定有效的目标尺寸'
                };
            }
            // 确定最终输出格式
            const finalOutputFormat = options.outputFormat || outputFormat;
            // 配置调整选项
            const resizeOptions = this.getResizeOptions(options, targetDimensions);
            // 初始化sharp实例
            let sharpInstance = (0, sharp_1.default)(buffer);
            // 应用尺寸调整
            sharpInstance = sharpInstance.resize(resizeOptions);
            // 如果需要添加背景（contain模式）
            if (options.mode === ResizeMode.CONTAIN && options.backgroundColor) {
                sharpInstance = sharpInstance.background(options.backgroundColor).flatten();
            }
            // 配置输出质量
            const outputOptions = {};
            if (options.quality !== undefined) {
                outputOptions.quality = options.quality;
            }
            // 执行调整
            const resizedBuffer = await sharpInstance[finalOutputFormat.toLowerCase()](outputOptions)
                .toBuffer();
            const endTime = Date.now();
            return {
                success: true,
                data: resizedBuffer,
                format: finalOutputFormat,
                metadata: {
                    originalFormat: inputFormat,
                    convertedFormat: finalOutputFormat,
                    size: resizedBuffer.length,
                    rows: targetDimensions.height,
                    columns: targetDimensions.width,
                    processingTime: endTime - startTime,
                    originalWidth: metadata.width,
                    originalHeight: metadata.height,
                    resizeMode: options.mode
                }
            };
        }
        catch (error) {
            logger_1.logger.error(`图片尺寸调整失败: ${error.message}`);
            return {
                success: false,
                data: '',
                format: outputFormat,
                error: `图片尺寸调整失败: ${error.message}`
            };
        }
    }
    /**
     * 计算目标尺寸
     * @param options 调整选项
     * @param metadata 图片元数据
     */
    calculateTargetDimensions(options, metadata) {
        const { width, height, preset, mode } = options;
        // 如果指定了预设尺寸
        if (preset && this.presetSizes[preset]) {
            return {
                width: this.presetSizes[preset].width,
                height: this.presetSizes[preset].height
            };
        }
        // 如果用户直接指定了宽高
        if (width && height) {
            return { width, height };
        }
        // 如果用户只指定了宽度，按比例计算高度
        if (width && metadata.width && metadata.height) {
            const aspectRatio = metadata.width / metadata.height;
            return {
                width,
                height: Math.round(width / aspectRatio)
            };
        }
        // 如果用户只指定了高度，按比例计算宽度
        if (height && metadata.width && metadata.height) {
            const aspectRatio = metadata.width / metadata.height;
            return {
                width: Math.round(height * aspectRatio),
                height
            };
        }
        // 如果都没有指定，返回原始尺寸
        return {
            width: metadata.width,
            height: metadata.height
        };
    }
    /**
     * 获取调整选项
     * @param options 用户配置的选项
     * @param targetDimensions 目标尺寸
     */
    getResizeOptions(options, targetDimensions) {
        const { width, height } = targetDimensions;
        const resizeOptions = {
            width,
            height
        };
        // 根据模式设置fit选项
        switch (options.mode) {
            case ResizeMode.CONTAIN:
                resizeOptions.fit = sharp_1.default.fit.contain;
                break;
            case ResizeMode.COVER:
                resizeOptions.fit = sharp_1.default.fit.cover;
                // 设置裁剪位置
                if (options.position) {
                    resizeOptions.position = options.position;
                }
                break;
            case ResizeMode.STRETCH:
                resizeOptions.fit = sharp_1.default.fit.fill;
                break;
            case ResizeMode.SHRINK:
                resizeOptions.fit = sharp_1.default.fit.inside;
                resizeOptions.withoutEnlargement = true;
                break;
            case ResizeMode.ENLARGE:
                // 自定义处理，先缩小到适合再放大
                // 这里只是基础实现，可能需要更复杂的逻辑
                resizeOptions.fit = sharp_1.default.fit.contain;
                break;
            default:
                resizeOptions.fit = sharp_1.default.fit.contain;
        }
        // 设置防锯齿
        if (options.antialias !== undefined) {
            resizeOptions.antialias = options.antialias;
        }
        else {
            // 默认开启防锯齿
            resizeOptions.antialias = true;
        }
        return resizeOptions;
    }
    /**
     * 获取所有预设尺寸
     */
    getPresetSizes() {
        return Object.values(this.presetSizes);
    }
    /**
     * 验证预设尺寸名称
     * @param name 预设尺寸名称
     */
    isValidPreset(name) {
        return this.presetSizes.hasOwnProperty(name);
    }
}
exports.ImageResizer = ImageResizer;
//# sourceMappingURL=ImageResizer.js.map