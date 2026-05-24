"use strict";
/**
 * @file 图片格式转换器
 * @description 提供各种图片格式之间的转换功能
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-25
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ImageConverter = void 0;
const BaseConverter_1 = require("../common/BaseConverter");
const sharp_1 = __importDefault(require("sharp"));
const logger_1 = require("../../utils/logger");
/**
 * 图片格式转换器类
 */
class ImageConverter extends BaseConverter_1.BaseConverter {
    constructor() {
        super(...arguments);
        this.name = '图片格式转换器';
        this.description = '支持PNG、JPG、WEBP、GIF、BMP等图片格式互转';
        this.supportedInputFormats = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp', 'svg'];
        this.supportedOutputFormats = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'bmp'];
    }
    /**
     * 执行图片格式转换
     * @param inputData 输入数据
     * @param inputFormat 输入格式
     * @param outputFormat 输出格式
     * @param options 转换选项
     */
    async convert(inputData, inputFormat, outputFormat, options = {}) {
        try {
            // 验证格式
            if (!this.canConvert(inputFormat, outputFormat)) {
                return {
                    success: false,
                    data: '',
                    format: outputFormat,
                    error: `不支持的转换: ${inputFormat} 到 ${outputFormat}`
                };
            }
            const startTime = Date.now();
            const buffer = typeof inputData === 'string' ? Buffer.from(inputData, 'base64') : inputData;
            // 使用sharp进行转换
            let sharpInstance = (0, sharp_1.default)(buffer);
            // 获取图片元数据
            const metadata = await sharpInstance.metadata();
            // 配置转换选项
            const conversionOptions = {};
            // 质量设置
            if (options.quality !== undefined) {
                conversionOptions.quality = options.quality;
            }
            // 背景色处理（如果不保持透明度）
            if (!options.preserveAlpha && ['jpg', 'jpeg'].includes(outputFormat.toLowerCase())) {
                conversionOptions.background = options.backgroundColor || { r: 255, g: 255, b: 255, alpha: 1 };
            }
            // 其他格式特定选项
            if (outputFormat.toLowerCase() === 'jpg' || outputFormat.toLowerCase() === 'jpeg') {
                conversionOptions.progressive = options.progressive !== undefined ? options.progressive : true;
            }
            if (outputFormat.toLowerCase() === 'webp') {
                conversionOptions.lossless = options.lossless !== undefined ? options.lossless : false;
            }
            // 执行转换
            const convertedBuffer = await sharpInstance[outputFormat.toLowerCase()](conversionOptions)
                .toBuffer();
            const endTime = Date.now();
            return {
                success: true,
                data: convertedBuffer,
                format: outputFormat,
                metadata: {
                    originalFormat: inputFormat,
                    convertedFormat: outputFormat,
                    size: convertedBuffer.length,
                    rows: metadata.height,
                    columns: metadata.width,
                    processingTime: endTime - startTime
                }
            };
        }
        catch (error) {
            logger_1.logger.error(`图片转换失败: ${error.message}`);
            return {
                success: false,
                data: '',
                format: outputFormat,
                error: `图片转换失败: ${error.message}`
            };
        }
    }
    /**
     * 验证图片格式
     * @param format 格式名称
     */
    isValidImageFormat(format) {
        const validFormats = [...this.supportedInputFormats, ...this.supportedOutputFormats];
        return validFormats.includes(format.toLowerCase());
    }
}
exports.ImageConverter = ImageConverter;
//# sourceMappingURL=ImageConverter.js.map