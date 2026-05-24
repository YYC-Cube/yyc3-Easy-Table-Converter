/**
 * @file 存储服务核心业务逻辑
 * @description 实现文件存储、检索、删除等核心功能
 * @author YYC
 * @version 2.0.0
 * @created 2024-11-20
 * @updated 2024-11-23
 */

import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { FileDocument, FileModel } from '../models/File';
import { IStorageAdapter, StorageOptions } from './adapters/IStorageAdapter';
import { StorageAdapterFactory, StorageAdapterConfig } from './adapters/StorageAdapterFactory';
import { 
  memoryCache, 
  parallelProcess, 
  shouldUseChunking, 
  chunkBuffer, 
  mergeChunks,
  retry 
} from '../utils/performanceOptimizer';
import { 
  validateFileSecurity, 
  calculateFileHash, 
  generateSafeFilename,
  maskSensitiveInfo 
} from '../utils/securityUtils';

// 存储配置接口
export interface StorageServiceConfig {
  defaultStorageType: 'local' | 's3' | 'gcs';
  localConfig?: {
    uploadDir: string;
  };
  s3Config?: {
    bucketName: string;
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    endpoint?: string;
    forcePathStyle?: boolean;
  };
  gcsConfig?: {
    bucketName: string;
    projectId?: string;
    keyFilename?: string;
  };
}

// 存储服务类
export class StorageService {
  private adapters: Record<string, IStorageAdapter> = {};
  private defaultStorageType: 'local' | 's3' | 'gcs';

  /**
   * 构造函数
   * @param config - 存储服务配置
   */
  constructor(config?: Partial<StorageServiceConfig>) {
    const defaultConfig: StorageServiceConfig = {
      defaultStorageType: 'local',
      localConfig: {
        uploadDir: path.join(__dirname, '../../../uploads')
      }
    };

    const mergedConfig = { ...defaultConfig, ...config };
    this.defaultStorageType = mergedConfig.defaultStorageType;

    // 初始化存储适配器
    this.initializeAdapters(mergedConfig);
  }

  /**
   * 初始化存储适配器
   * @param config - 存储服务配置
   */
  private initializeAdapters(config: StorageServiceConfig): void {
    // 初始化本地存储适配器
    if (config.localConfig) {
      const localAdapterConfig: StorageAdapterConfig = {
        type: 'local',
        options: {
          localPath: config.localConfig.uploadDir,
          maxFileSize: 50 * 1024 * 1024, // 50MB
          fileExpiryDays: 7
        }
      };
      this.adapters['local'] = StorageAdapterFactory.createAdapter(localAdapterConfig);
    }

    // 初始化S3存储适配器
    if (config.s3Config) {
      const s3AdapterConfig: StorageAdapterConfig = {
        type: 's3',
        options: {
          ...config.s3Config,
          maxFileSize: 50 * 1024 * 1024, // 50MB
          fileExpiryDays: 7
        }
      };
      this.adapters['s3'] = StorageAdapterFactory.createAdapter(s3AdapterConfig);
    }

    // 初始化GCS存储适配器
    if (config.gcsConfig) {
      const gcsAdapterConfig: StorageAdapterConfig = {
        type: 'gcs',
        options: {
          ...config.gcsConfig,
          maxFileSize: 50 * 1024 * 1024, // 50MB
          fileExpiryDays: 7
        }
      };
      this.adapters['gcs'] = StorageAdapterFactory.createAdapter(gcsAdapterConfig);
    }

    console.log(`✅ 存储服务初始化完成，支持存储类型: ${Object.keys(this.adapters).join(', ')}`);
  }

  /**
   * 获取存储适配器
   * @param storageType - 存储类型
   * @returns IStorageAdapter 存储适配器
   */
  private getAdapter(storageType: string): IStorageAdapter {
    const adapter = this.adapters[storageType];
    if (!adapter) {
      throw new Error(`不支持的存储类型: ${storageType}`);
    }
    return adapter;
  }

  /**
   * 保存文件到存储系统
   * @param file - 上传的文件对象
   * @param options - 存储选项
   * @returns Promise<FileDocument>
   */
  async saveFile(
    file: {
      originalname: string;
      mimetype: string;
      size: number;
      buffer: Buffer;
    },
    options: {
      userId?: string;
      isPublic?: boolean;
      expiresAt?: Date;
      metadata?: Record<string, any>;
      storageType?: 'local' | 's3' | 'gcs';
    } = {}  
  ): Promise<FileDocument> {
    try {
      // 安全验证
      const securityCheck = validateFileSecurity(file);
      if (!securityCheck.isValid) {
        throw new Error(securityCheck.error || '文件安全验证失败');
      }
      
      // 确定使用的存储类型
      const targetStorageType = options.storageType || this.defaultStorageType;
      const adapter = this.getAdapter(targetStorageType);
      
      // 生成文件ID和安全文件名
      const fileId = uuidv4();
      const safeFileName = generateSafeFilename(file.originalname);
      const fileExtension = path.extname(file.originalname).toLowerCase();
      
      // 计算文件哈希用于完整性验证
      const fileHash = calculateFileHash(file.buffer);
      
      // 准备存储选项
      const storageOptions: StorageOptions = {
        userId: options.userId,
        isPublic: options.isPublic || false,
        expiresAt: options.expiresAt,
        metadata: {
          ...(options.metadata || {}),
          fileHash
        }
      };

      // 分块上传处理
      let filePath: string;
      if (shouldUseChunking(file.size)) {
        const chunks = chunkBuffer(file.buffer);
        const chunkPaths = await parallelProcess(
          chunks.map((chunk, index) => ({ chunk, index })),
          async ({ chunk, index }) => {
            const chunkFileName = `${fileId}_chunk_${index}${fileExtension}`;
            return await adapter.saveFile(fileId, chunkFileName, chunk, storageOptions);
          }
        );
        
        // 合并分块
        filePath = await adapter.mergeChunks(fileId, safeFileName, chunkPaths, storageOptions);
      } else {
        // 小文件直接上传
        filePath = await adapter.saveFile(fileId, safeFileName, file.buffer, storageOptions);
      }

      // 创建文件记录
      const fileRecord = new FileModel({
        id: fileId,
        name: safeFileName,
        originalName: file.originalname,
        format: fileExtension.slice(1), // 移除点号
        mimeType: file.mimetype,
        path: filePath,
        size: file.size,
        userId: options.userId,
        metadata: {
          ...(options.metadata || {}),
          fileHash
        },
        storageType: targetStorageType,
        isPublic: options.isPublic || false,
        expiresAt: options.expiresAt
      });

      // 保存到数据库
      await fileRecord.save();
      console.log(`✅ 文件保存成功: ${fileId} - ${file.originalname} (存储类型: ${targetStorageType})`);
      return fileRecord;
    } catch (error) {
      console.error('❌ 文件保存失败:', maskSensitiveInfo(error));
      throw new Error('文件保存失败');
    }
  }

  /**
   * 获取文件信息
   * @param fileId - 文件ID
   * @returns Promise<FileDocument | null>
   */
  async getFileInfo(fileId: string): Promise<FileDocument | null> {
    try {
      const file = await FileModel.findByIdAndUpdateAccess(fileId);
      if (!file) {
        console.warn(`⚠️ 文件不存在: ${fileId}`);
        return null;
      }
      return file;
    } catch (error) {
      console.error('❌ 获取文件信息失败:', error);
      throw new Error('获取文件信息失败');
    }
  }

  /**
   * 获取文件内容
   * @param fileId - 文件ID
   * @returns Promise<{ file: FileDocument, buffer: Buffer } | null>
   */
  async getFileContent(fileId: string): Promise<{ file: FileDocument, buffer: Buffer } | null> {
    try {
      // 检查内存缓存
      const cacheKey = `file:${fileId}`;
      const cachedBuffer = memoryCache.get(cacheKey);
      if (cachedBuffer) {
        console.log(`✅ 从缓存获取文件: ${fileId}`);
        const file = await FileModel.findByIdAndUpdateAccess(fileId);
        if (file) {
          return { file, buffer: cachedBuffer };
        }
      }
      
      const file = await FileModel.findByIdAndUpdateAccess(fileId);
      if (!file) {
        console.warn(`⚠️ 文件不存在: ${fileId}`);
        return null;
      }

      // 检查文件是否过期
      if (file.expiresAt && file.expiresAt < new Date()) {
        console.warn(`⚠️ 文件已过期: ${fileId}`);
        return null;
      }

      // 获取对应的存储适配器
      const adapter = this.getAdapter(file.storageType);
      
      // 使用重试机制读取文件内容
      const retryableGetContent = retry(adapter.getFileContent.bind(adapter), 3, 1000);
      const buffer = await retryableGetContent(file.path);
      
      // 验证文件完整性
      if (file.metadata?.fileHash && calculateFileHash(buffer) !== file.metadata.fileHash) {
        console.error(`❌ 文件完整性验证失败: ${fileId}`);
        throw new Error('文件完整性验证失败');
      }
      
      // 缓存小文件
      if (buffer.length < 10 * 1024 * 1024) { // 10MB以下的文件才缓存
        memoryCache.set(cacheKey, buffer);
      }
      
      return { file, buffer };
    } catch (error) {
      console.error('❌ 获取文件内容失败:', maskSensitiveInfo(error));
      throw new Error('获取文件内容失败');
    }
  }

  /**
   * 删除文件
   * @param fileId - 文件ID
   * @returns Promise<boolean>
   */
  async deleteFile(fileId: string): Promise<boolean> {
    try {
      const file = await FileModel.findById(fileId);
      if (!file) {
        console.warn(`⚠️ 文件不存在: ${fileId}`);
        return false;
      }

      // 获取对应的存储适配器
      const adapter = this.getAdapter(file.storageType);
      
      // 使用重试机制删除文件
      const retryableDelete = retry(adapter.deleteFile.bind(adapter), 3, 1000);
      const storageDeleted = await retryableDelete(file.path);
      
      if (!storageDeleted) {
        console.warn(`⚠️ 文件物理删除失败: ${file.path}`);
        // 仍然尝试删除数据库记录
      }

      // 删除内存缓存
      memoryCache.delete(`file:${fileId}`);
      
      // 删除数据库记录
      await FileModel.findByIdAndDelete(fileId);
      console.log(`✅ 文件删除成功: ${fileId} (存储类型: ${file.storageType})`);
      return true;
    } catch (error) {
      console.error('❌ 文件删除失败:', maskSensitiveInfo(error));
      throw new Error('文件删除失败');
    }
  }

  /**
   * 列出用户的文件
   * @param userId - 用户ID
   * @param options - 查询选项
   * @returns Promise<FileDocument[]>
   */
  async listUserFiles(
    userId: string,
    options: {
      limit?: number;
      offset?: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    } = {}
  ): Promise<FileDocument[]> {
    try {
      const { limit = 20, offset = 0, sortBy = 'createdAt', sortOrder = 'desc' } = options;
      
      const query = FileModel.find({ userId })
        .limit(limit)
        .skip(offset)
        .sort({ [sortBy]: sortOrder });
      
      return await query.exec();
    } catch (error) {
      console.error('❌ 列出用户文件失败:', error);
      throw new Error('列出用户文件失败');
    }
  }

  /**
   * 清理过期文件
   * @returns Promise<number> 删除的文件数量
   */
  async cleanupExpiredFiles(): Promise<number> {
    try {
      const expiredFiles = await FileModel.findExpired();
      let deletedCount = 0;

      for (const file of expiredFiles) {
        try {
          // 获取对应的存储适配器
          const adapter = this.getAdapter(file.storageType);
          
          // 删除物理文件
          const storageDeleted = await adapter.deleteFile(file.path);
          if (storageDeleted) {
            await FileModel.findByIdAndDelete(file._id);
            deletedCount++;
            console.log(`✅ 过期文件清理成功: ${file.id} - ${file.originalName} (存储类型: ${file.storageType})`);
          }
        } catch (fileError) {
          console.error(`❌ 清理文件失败: ${file.id}`, fileError);
        }
      }

      return deletedCount;
    } catch (error) {
      console.error('❌ 清理过期文件失败:', error);
      throw new Error('清理过期文件失败');
    }
  }
}