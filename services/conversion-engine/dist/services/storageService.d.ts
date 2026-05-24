/**
 * @file 存储服务
 * @description 处理文件存储和管理
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-20
 */
import fs from 'fs';
/**
 * 存储服务类
 */
export declare class StorageService {
    private storagePath;
    constructor();
    /**
     * 确保目录存在，如果不存在则创建
     * @param dirPath 目录路径
     */
    private ensureDirectoryExists;
    /**
     * 保存文件到存储目录
     * @param file 文件对象
     * @param type 文件类型（input 或 output）
     * @returns Promise<string> 文件存储路径
     */
    saveFile(file: any, type: 'input' | 'output'): Promise<string>;
    /**
     * 获取文件内容
     * @param filePath 文件路径
     * @returns Promise<Buffer> 文件内容
     */
    getFile(filePath: string): Promise<Buffer>;
    /**
     * 删除文件
     * @param filePath 文件路径
     * @returns Promise<void>
     */
    deleteFile(filePath: string): Promise<void>;
    /**
     * 获取文件元数据
     * @param filePath 文件路径
     * @returns Promise<fs.Stats> 文件元数据
     */
    getFileMetadata(filePath: string): Promise<fs.Stats>;
}
/**
 * 导出服务实例创建函数
 */
export declare function createStorageService(): StorageService;
//# sourceMappingURL=storageService.d.ts.map