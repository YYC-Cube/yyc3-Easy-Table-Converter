"use strict";
/**
 * @file 存储服务
 * @description 处理文件存储和管理
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-20
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StorageService = void 0;
exports.createStorageService = createStorageService;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const logger_1 = require("../utils/logger");
/**
 * 存储服务类
 */
class StorageService {
    constructor() {
        this.storagePath = process.env.STORAGE_PATH || '/tmp/conversion-engine';
        // 确保存储目录存在
        this.ensureDirectoryExists(this.storagePath);
        this.ensureDirectoryExists(path_1.default.join(this.storagePath, 'input'));
        this.ensureDirectoryExists(path_1.default.join(this.storagePath, 'output'));
    }
    /**
     * 确保目录存在，如果不存在则创建
     * @param dirPath 目录路径
     */
    ensureDirectoryExists(dirPath) {
        if (!fs_1.default.existsSync(dirPath)) {
            fs_1.default.mkdirSync(dirPath, { recursive: true });
            logger_1.logger.info(`📁 创建存储目录: ${dirPath}`);
        }
    }
    /**
     * 保存文件到存储目录
     * @param file 文件对象
     * @param type 文件类型（input 或 output）
     * @returns Promise<string> 文件存储路径
     */
    async saveFile(file, type) {
        try {
            const timestamp = Date.now();
            const fileName = `${timestamp}_${file.name}`;
            const filePath = path_1.default.join(this.storagePath, type, fileName);
            // 这里需要根据实际文件类型实现保存逻辑
            // 例如：如果是 Buffer，可以直接写入文件
            // fs.writeFileSync(filePath, file.buffer);
            logger_1.logger.info(`📄 文件保存成功: ${filePath}`);
            return filePath;
        }
        catch (error) {
            logger_1.logger.error('❌ 文件保存失败:', error);
            throw error;
        }
    }
    /**
     * 获取文件内容
     * @param filePath 文件路径
     * @returns Promise<Buffer> 文件内容
     */
    async getFile(filePath) {
        try {
            const content = fs_1.default.readFileSync(filePath);
            logger_1.logger.info(`📖 文件读取成功: ${filePath}`);
            return content;
        }
        catch (error) {
            logger_1.logger.error('❌ 文件读取失败:', error);
            throw error;
        }
    }
    /**
     * 删除文件
     * @param filePath 文件路径
     * @returns Promise<void>
     */
    async deleteFile(filePath) {
        try {
            fs_1.default.unlinkSync(filePath);
            logger_1.logger.info(`🗑️ 文件删除成功: ${filePath}`);
        }
        catch (error) {
            logger_1.logger.error('❌ 文件删除失败:', error);
            throw error;
        }
    }
    /**
     * 获取文件元数据
     * @param filePath 文件路径
     * @returns Promise<fs.Stats> 文件元数据
     */
    async getFileMetadata(filePath) {
        try {
            const stats = fs_1.default.statSync(filePath);
            logger_1.logger.info(`📊 文件元数据获取成功: ${filePath}`);
            return stats;
        }
        catch (error) {
            logger_1.logger.error('❌ 文件元数据获取失败:', error);
            throw error;
        }
    }
}
exports.StorageService = StorageService;
/**
 * 导出服务实例创建函数
 */
function createStorageService() {
    return new StorageService();
}
//# sourceMappingURL=storageService.js.map