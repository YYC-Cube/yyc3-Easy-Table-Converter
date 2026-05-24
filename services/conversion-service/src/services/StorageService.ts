/**
 * @file 存储服务
 * @description 微服务架构中的文件存储和数据持久化服务
 * @module services/conversion-service/services
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-22
 */

import fs from 'fs';
import path from 'path';
import { LoggerService, defaultLogger } from './LoggerService';

/**
 * 存储配置接口
 */
export interface StorageConfig {
  /**
   * 存储类型
   */
  type: 'local' | 's3' | 'azure';
  
  /**
   * 本地存储路径
   */
  localPath?: string;
  
  /**
   * 临时文件目录
   */
  tempDir?: string;
  
  /**
   * 文件最大大小（MB）
   */
  maxFileSizeMb?: number;
  
  /**
   * 文件保留时间（秒）
   */
  fileRetentionTimeSec?: number;
  
  /**
   * S3配置（当type为's3'时使用）
   */
  s3Config?: {
    bucketName: string;
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
  };
  
  /**
   * Azure配置（当type为'azure'时使用）
   */
  azureConfig?: {
    connectionString: string;
    containerName: string;
  };
}

/**
 * 默认存储配置
 */
const DEFAULT_CONFIG: StorageConfig = {
  type: 'local',
  localPath: './storage',
  tempDir: './temp',
  maxFileSizeMb: 100,
  fileRetentionTimeSec: 86400, // 24小时
};

/**
 * 存储服务类
 */
export class StorageService {
  private config: StorageConfig;
  private logger: LoggerService;
  private static instance: StorageService | null = null;

  /**
   * 构造函数
   * @param config 存储配置
   * @param logger 日志服务
   */
  constructor(config?: Partial<StorageConfig>, logger?: LoggerService) {
    this.logger = logger || defaultLogger;
    this.config = { ...DEFAULT_CONFIG, ...config };
    
    // 初始化存储目录
    this.initializeDirectories();
    
    // 启动清理任务
    this.startCleanupTask();
    
    this.logger.info('存储服务已初始化', { storageType: this.config.type });
  }

  /**
   * 获取存储服务实例
   * @param config 存储配置
   * @param logger 日志服务
   */
  public static getInstance(config?: Partial<StorageConfig>, logger?: LoggerService): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService(config, logger);
    }
    return StorageService.instance;
  }

  /**
   * 初始化存储目录
   */
  private initializeDirectories(): void {
    try {
      // 确保本地存储目录存在
      if (this.config.type === 'local') {
        const localDir = path.resolve(this.config.localPath!);
        if (!fs.existsSync(localDir)) {
          fs.mkdirSync(localDir, { recursive: true });
          this.logger.info(`已创建本地存储目录: ${localDir}`);
        }
      }

      // 确保临时目录存在
      const tempDir = path.resolve(this.config.tempDir!);
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
        this.logger.info(`已创建临时目录: ${tempDir}`);
      }
    } catch (error) {
      this.logger.error('初始化存储目录失败', { error });
      throw new Error(`初始化存储目录失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 启动定期清理任务
   */
  private startCleanupTask(): void {
    // 每小时运行一次清理任务
    const cleanupInterval = 60 * 60 * 1000;
    
    setInterval(() => {
      this.cleanupExpiredFiles().catch(error => {
        this.logger.error('定期清理任务失败', { error });
      });
    }, cleanupInterval);
    
    this.logger.info(`定期清理任务已启动，每 ${cleanupInterval / 1000 / 60} 分钟执行一次`);
  }

  /**
   * 清理过期文件
   */
  private async cleanupExpiredFiles(): Promise<void> {
    try {
      if (this.config.type !== 'local') {
        this.logger.debug('非本地存储模式，跳过文件清理');
        return;
      }

      const localDir = path.resolve(this.config.localPath!);
      const tempDir = path.resolve(this.config.tempDir!);
      const retentionTimeMs = this.config.fileRetentionTimeSec! * 1000;
      const now = Date.now();

      // 清理本地存储目录
      await this.cleanupDirectory(localDir, retentionTimeMs, now);
      
      // 清理临时目录
      await this.cleanupDirectory(tempDir, retentionTimeMs / 2, now); // 临时文件保留时间减半
      
      this.logger.info('文件清理任务完成');
    } catch (error) {
      this.logger.error('清理过期文件失败', { error });
      throw error;
    }
  }

  /**
   * 清理指定目录中的过期文件
   * @param dirPath 目录路径
   * @param retentionTimeMs 保留时间（毫秒）
   * @param currentTime 当前时间戳
   */
  private async cleanupDirectory(dirPath: string, retentionTimeMs: number, currentTime: number): Promise<void> {
    if (!fs.existsSync(dirPath)) {
      return;
    }

    const files = fs.readdirSync(dirPath);
    let deletedCount = 0;

    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stats = fs.statSync(filePath);
      
      // 检查文件是否过期
      if (stats.isFile() && (currentTime - stats.mtimeMs) > retentionTimeMs) {
        fs.unlinkSync(filePath);
        deletedCount++;
      }
    }

    if (deletedCount > 0) {
      this.logger.info(`清理了 ${deletedCount} 个过期文件`, { directory: dirPath });
    }
  }

  /**
   * 保存文件
   * @param fileName 文件名
   * @param data 文件数据
   * @param options 保存选项
   */
  public async saveFile(fileName: string, data: Buffer | string, options?: {
    isTemp?: boolean;
    metadata?: Record<string, any>;
  }): Promise<string> {
    try {
      const { isTemp = false, metadata } = options || {};
      
      // 验证文件大小
      const fileSizeMb = typeof data === 'string' 
        ? Buffer.byteLength(data) / (1024 * 1024) 
        : data.length / (1024 * 1024);
      
      if (fileSizeMb > this.config.maxFileSizeMb!) {
        throw new Error(`文件大小超过限制: ${fileSizeMb.toFixed(2)}MB > ${this.config.maxFileSizeMb}MB`);
      }

      // 根据存储类型保存文件
      let filePath: string;
      
      if (this.config.type === 'local') {
        filePath = this.saveLocalFile(fileName, data, isTemp);
      } else if (this.config.type === 's3') {
        // S3存储实现
        filePath = await this.saveS3File(fileName, data, isTemp);
      } else if (this.config.type === 'azure') {
        // Azure存储实现
        filePath = await this.saveAzureFile(fileName, data, isTemp);
      } else {
        throw new Error(`不支持的存储类型: ${this.config.type}`);
      }

      // 保存元数据
      if (metadata) {
        await this.saveMetadata(fileName, metadata, isTemp);
      }

      this.logger.info('文件保存成功', {
        fileName,
        size: fileSizeMb.toFixed(2) + 'MB',
        path: filePath,
        isTemp
      });

      return filePath;
    } catch (error) {
      this.logger.error('保存文件失败', {
        fileName,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * 本地保存文件
   * @param fileName 文件名
   * @param data 文件数据
   * @param isTemp 是否为临时文件
   */
  private saveLocalFile(fileName: string, data: Buffer | string, isTemp: boolean): string {
    const baseDir = isTemp 
      ? path.resolve(this.config.tempDir!) 
      : path.resolve(this.config.localPath!);
      
    // 确保文件名唯一
    const uniqueFileName = this.getUniqueFileName(baseDir, fileName);
    const filePath = path.join(baseDir, uniqueFileName);
    
    // 写入文件
    fs.writeFileSync(filePath, data);
    
    return filePath;
  }

  /**
   * S3保存文件（占位实现）
   * @param fileName 文件名
   * @param data 文件数据
   * @param isTemp 是否为临时文件
   */
  private async saveS3File(_fileName: string, _data: Buffer | string, _isTemp: boolean): Promise<string> {
    // 这里应该实现实际的S3存储逻辑
    // 使用AWS SDK上传文件到S3
    throw new Error('S3存储功能尚未实现');
  }

  /**
   * Azure保存文件（占位实现）
   * @param fileName 文件名
   * @param data 文件数据
   * @param isTemp 是否为临时文件
   */
  private async saveAzureFile(_fileName: string, _data: Buffer | string, _isTemp: boolean): Promise<string> {
    // 这里应该实现实际的Azure Blob存储逻辑
    // 使用Azure SDK上传文件到Blob存储
    throw new Error('Azure存储功能尚未实现');
  }

  /**
   * 保存文件元数据
   * @param fileName 文件名
   * @param metadata 元数据
   * @param isTemp 是否为临时文件
   */
  private async saveMetadata(fileName: string, metadata: Record<string, any>, isTemp: boolean): Promise<void> {
    if (this.config.type !== 'local') {
      // 对于云存储，可以在对象存储的元数据中保存
      return;
    }

    const baseDir = isTemp 
      ? path.resolve(this.config.tempDir!) 
      : path.resolve(this.config.localPath!);
      
    const metadataFileName = fileName + '.metadata.json';
    const metadataPath = path.join(baseDir, metadataFileName);
    
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
  }

  /**
   * 读取文件
   * @param fileName 文件名或路径
   * @param options 读取选项
   */
  public async readFile(fileName: string, options?: {
    isTemp?: boolean;
  }): Promise<Buffer> {
    try {
      const { isTemp = false } = options || {};
      
      let filePath: string;
      
      if (this.config.type === 'local') {
        // 如果是绝对路径，直接使用
        if (path.isAbsolute(fileName)) {
          filePath = fileName;
        } else {
          const baseDir = isTemp 
            ? path.resolve(this.config.tempDir!) 
            : path.resolve(this.config.localPath!);
            
          filePath = path.join(baseDir, fileName);
        }
        
        if (!fs.existsSync(filePath)) {
          throw new Error(`文件不存在: ${filePath}`);
        }
        
        return fs.readFileSync(filePath);
      } else if (this.config.type === 's3') {
        // S3读取实现
        return await this.readS3File(fileName, isTemp);
      } else if (this.config.type === 'azure') {
        // Azure读取实现
        return await this.readAzureFile(fileName, isTemp);
      } else {
        throw new Error(`不支持的存储类型: ${this.config.type}`);
      }
    } catch (error) {
      this.logger.error('读取文件失败', {
        fileName,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * 读取S3文件（占位实现）
   */
  private async readS3File(_fileName: string, _isTemp: boolean): Promise<Buffer> {
    throw new Error('S3文件读取功能尚未实现');
  }

  /**
   * 读取Azure文件（占位实现）
   */
  private async readAzureFile(_fileName: string, _isTemp: boolean): Promise<Buffer> {
    throw new Error('Azure文件读取功能尚未实现');
  }

  /**
   * 删除文件
   * @param fileName 文件名或路径
   * @param options 删除选项
   */
  public async deleteFile(fileName: string, options?: {
    isTemp?: boolean;
  }): Promise<void> {
    try {
      const { isTemp = false } = options || {};
      
      if (this.config.type === 'local') {
        let filePath: string;
        
        // 如果是绝对路径，直接使用
        if (path.isAbsolute(fileName)) {
          filePath = fileName;
        } else {
          const baseDir = isTemp 
            ? path.resolve(this.config.tempDir!) 
            : path.resolve(this.config.localPath!);
            
          filePath = path.join(baseDir, fileName);
        }
        
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          
          // 删除对应的元数据文件
          const metadataPath = filePath + '.metadata.json';
          if (fs.existsSync(metadataPath)) {
            fs.unlinkSync(metadataPath);
          }
          
          this.logger.info('文件删除成功', { filePath });
        }
      } else if (this.config.type === 's3') {
        // S3删除实现
        await this.deleteS3File(fileName, isTemp);
      } else if (this.config.type === 'azure') {
        // Azure删除实现
        await this.deleteAzureFile(fileName, isTemp);
      }
    } catch (error) {
      this.logger.error('删除文件失败', {
        fileName,
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  /**
   * 删除S3文件（占位实现）
   */
  private async deleteS3File(_fileName: string, _isTemp: boolean): Promise<void> {
    throw new Error('S3文件删除功能尚未实现');
  }

  /**
   * 删除Azure文件（占位实现）
   */
  private async deleteAzureFile(_fileName: string, _isTemp: boolean): Promise<void> {
    throw new Error('Azure文件删除功能尚未实现');
  }

  /**
   * 生成唯一文件名
   * @param dirPath 目录路径
   * @param originalFileName 原始文件名
   */
  private getUniqueFileName(dirPath: string, originalFileName: string): string {
    const ext = path.extname(originalFileName);
    const baseName = path.basename(originalFileName, ext);
    
    let counter = 0;
    let uniqueFileName = originalFileName;
    
    while (fs.existsSync(path.join(dirPath, uniqueFileName))) {
      counter++;
      uniqueFileName = `${baseName}_${counter}${ext}`;
    }
    
    return uniqueFileName;
  }

  /**
   * 获取临时文件路径
   * @param fileName 文件名
   */
  public getTempFilePath(fileName: string): string {
    return path.join(path.resolve(this.config.tempDir!), fileName);
  }

  /**
   * 获取文件统计信息
   * @param storagePath 存储路径
   */
  public getStorageStats(): {
    usedSpace: number;
    fileCount: number;
    storageType: string;
  } {
    if (this.config.type !== 'local') {
      return {
        usedSpace: 0,
        fileCount: 0,
        storageType: this.config.type
      };
    }

    let totalSize = 0;
    let totalFiles = 0;

    // 计算存储目录大小
    const storageDir = path.resolve(this.config.localPath!);
    if (fs.existsSync(storageDir)) {
      const stats = this.calculateDirectoryStats(storageDir);
      totalSize += stats.size;
      totalFiles += stats.files;
    }

    // 计算临时目录大小
    const tempDir = path.resolve(this.config.tempDir!);
    if (fs.existsSync(tempDir)) {
      const stats = this.calculateDirectoryStats(tempDir);
      totalSize += stats.size;
      totalFiles += stats.files;
    }

    return {
      usedSpace: totalSize,
      fileCount: totalFiles,
      storageType: this.config.type
    };
  }

  /**
   * 计算目录统计信息
   * @param dirPath 目录路径
   */
  private calculateDirectoryStats(dirPath: string): { size: number; files: number } {
    let size = 0;
    let files = 0;

    try {
      const entries = fs.readdirSync(dirPath);
      
      for (const entry of entries) {
        const entryPath = path.join(dirPath, entry);
        const stats = fs.statSync(entryPath);
        
        if (stats.isFile()) {
          size += stats.size;
          files++;
        } else if (stats.isDirectory()) {
          const subStats = this.calculateDirectoryStats(entryPath);
          size += subStats.size;
          files += subStats.files;
        }
      }
    } catch (error) {
      this.logger.error('计算目录统计信息失败', { dirPath, error });
    }

    return { size, files };
  }
}

// 导出默认存储服务实例
export const defaultStorageService = StorageService.getInstance();
