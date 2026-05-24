/**
 * @file GCS存储适配器
 * @description 实现Google Cloud Storage云存储功能
 * @author YYC
 * @version 2.0.0
 * @created 2024-11-23
 */

import { Storage, Bucket } from '@google-cloud/storage';
import { IStorageAdapter, StorageOptions } from './IStorageAdapter';
import { FileDocument } from '../../models/File';

/**
 * GCS配置接口
 */
export interface GCSConfig {
  projectId: string;
  credentials?: any;
  bucket: string;
}

/**
 * GCS存储适配器
 */
export class GCSStorageAdapter implements IStorageAdapter {
  public storageType: 'gcs' = 'gcs';
  private storage: Storage;
  private bucket: Bucket;

  /**
   * 构造函数
   * @param config - GCS配置
   */
  constructor(config: GCSConfig) {
    this.storage = new Storage({
      projectId: config.projectId,
      credentials: config.credentials
    });
    this.bucket = this.storage.bucket(config.bucket);
    console.log(`✅ GCS存储适配器初始化成功: ${config.projectId} - ${config.bucket}`);
  }

  /**
   * 保存文件
   * @param fileId - 文件ID
   * @param fileName - 文件名
   * @param buffer - 文件内容
   * @param options - 存储选项
   * @returns Promise<string> 存储路径（GCS对象名称）
   */
  async saveFile(fileId: string, fileName: string, buffer: Buffer, options: StorageOptions): Promise<string> {
    try {
      // 构建GCS对象名称
      const objectName = this.buildObjectName(fileId, fileName, options.userId);
      
      // 获取文件引用
      const file = this.bucket.file(objectName);
      
      // 准备文件写入选项
      const writeOptions: any = {
        metadata: this.buildMetadata(options),
        resumable: false // 对于小文件使用非可恢复上传
      };
      
      // 设置公开访问权限
      if (options.isPublic) {
        writeOptions.public = true;
      }
      
      // 上传文件到GCS
      await file.save(buffer, writeOptions);
      console.log(`✅ 文件上传到GCS成功: ${fileId} - ${objectName}`);
      
      return objectName;
    } catch (error) {
      console.error('❌ GCS文件上传失败:', error);
      throw new Error('GCS文件上传失败');
    }
  }

  /**
   * 获取文件内容
   * @param filePath - 文件路径（GCS对象名称）
   * @returns Promise<Buffer> 文件内容
   */
  async getFileContent(filePath: string): Promise<Buffer> {
    try {
      // 获取文件引用
      const file = this.bucket.file(filePath);
      
      // 检查文件是否存在
      const [exists] = await file.exists();
      if (!exists) {
        throw new Error('文件不存在');
      }
      
      // 下载文件内容
      const [buffer] = await file.download();
      return buffer;
    } catch (error) {
      console.error('❌ GCS文件下载失败:', error);
      throw new Error('GCS文件下载失败');
    }
  }

  /**
   * 删除文件
   * @param filePath - 文件路径（GCS对象名称）
   * @returns Promise<boolean> 是否成功
   */
  async deleteFile(filePath: string): Promise<boolean> {
    try {
      // 获取文件引用
      const file = this.bucket.file(filePath);
      
      // 检查文件是否存在
      const [exists] = await file.exists();
      if (!exists) {
        return false;
      }
      
      // 删除文件
      await file.delete();
      console.log(`✅ GCS文件删除成功: ${filePath}`);
      return true;
    } catch (error) {
      console.error('❌ GCS文件删除失败:', error);
      return false;
    }
  }

  /**
   * 生成访问URL
   * @param file - 文件文档
   * @param expiresIn - 过期时间（秒）
   * @returns Promise<string> 签名URL
   */
  async generateSignedUrl(file: FileDocument, expiresIn: number = 3600): Promise<string> {
    try {
      // 获取文件引用
      const fileObj = this.bucket.file(file.path);
      
      // 生成签名URL
      const [url] = await fileObj.getSignedUrl({
        version: 'v4',
        action: 'read',
        expires: Date.now() + expiresIn * 1000,
        responseDisposition: `inline; filename="${encodeURIComponent(file.originalName)}"`,
        responseType: file.mimeType
      });
      
      return url;
    } catch (error) {
      console.error('❌ 生成GCS签名URL失败:', error);
      throw new Error('生成GCS签名URL失败');
    }
  }

  /**
   * 构建GCS对象名称
   * @param fileId - 文件ID
   * @param fileName - 文件名
   * @param userId - 用户ID
   * @returns string 对象名称
   */
  private buildObjectName(fileId: string, fileName: string, userId?: string): string {
    const prefix = userId ? `users/${userId}/` : 'public/';
    return `${prefix}${fileId}/${fileName}`;
  }

  /**
   * 构建GCS元数据
   * @param options - 存储选项
   * @returns Record<string, string> 元数据
   */
  private buildMetadata(options: StorageOptions): Record<string, string> {
    const metadata: Record<string, string> = {
      'created-at': new Date().toISOString()
    };
    
    if (options.userId) {
      metadata['user-id'] = options.userId;
    }
    
    if (options.isPublic) {
      metadata['is-public'] = 'true';
    }
    
    if (options.expiresAt) {
      metadata['expires-at'] = options.expiresAt.toISOString();
    }
    
    // 将自定义元数据添加到GCS元数据
    if (options.metadata) {
      Object.keys(options.metadata).forEach(key => {
        if (options.metadata) {
          metadata[`custom-${key}`] = String(options.metadata[key]);
        }
      });
    }
    
    return metadata;
  }
}
