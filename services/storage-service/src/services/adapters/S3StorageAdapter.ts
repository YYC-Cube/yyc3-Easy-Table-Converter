/**
 * @file S3存储适配器
 * @description 实现Amazon S3云存储功能
 * @author YYC
 * @version 2.0.0
 * @created 2024-11-23
 */

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { IStorageAdapter, StorageOptions } from './IStorageAdapter';
import { FileDocument } from '../../models/File';

/**
 * S3配置接口
 */
export interface S3Config {
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  endpoint?: string; // 用于兼容其他S3兼容的存储服务
}

/**
 * S3存储适配器
 */
export class S3StorageAdapter implements IStorageAdapter {
  public storageType: 's3' = 's3';
  private s3Client: S3Client;
  private bucket: string;

  /**
   * 构造函数
   * @param config - S3配置
   */
  constructor(config: S3Config) {
    this.s3Client = new S3Client({
      region: config.region,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey
      },
      endpoint: config.endpoint,
      forcePathStyle: !!config.endpoint // 对S3兼容服务使用路径样式
    });
    this.bucket = config.bucket;
    console.log(`✅ S3存储适配器初始化成功: ${config.region} - ${config.bucket}`);
  }

  /**
   * 保存文件
   * @param fileId - 文件ID
   * @param fileName - 文件名
   * @param buffer - 文件内容
   * @param options - 存储选项
   * @returns Promise<string> 存储路径（S3对象键）
   */
  async saveFile(fileId: string, fileName: string, buffer: Buffer, options: StorageOptions): Promise<string> {
    try {
      // 构建S3对象键
      const objectKey = this.buildObjectKey(fileId, fileName, options.userId);
      
      // 准备S3上传参数
      const params = {
        Bucket: this.bucket,
        Key: objectKey,
        Body: buffer,
        ContentLength: buffer.length,
        Metadata: this.buildMetadata(options)
      };

      // 上传文件到S3
      await this.s3Client.send(new PutObjectCommand(params));
      console.log(`✅ 文件上传到S3成功: ${fileId} - ${objectKey}`);
      
      return objectKey;
    } catch (error) {
      console.error('❌ S3文件上传失败:', error);
      throw new Error('S3文件上传失败');
    }
  }

  /**
   * 获取文件内容
   * @param filePath - 文件路径（S3对象键）
   * @returns Promise<Buffer> 文件内容
   */
  async getFileContent(filePath: string): Promise<Buffer> {
    try {
      const params = {
        Bucket: this.bucket,
        Key: filePath
      };

      const response = await this.s3Client.send(new GetObjectCommand(params));
      if (!response.Body) {
        throw new Error('文件内容为空');
      }

      const buffer = await this.streamToBuffer(response.Body as any);
      return buffer;
    } catch (error) {
      console.error('❌ S3文件下载失败:', error);
      throw new Error('S3文件下载失败');
    }
  }

  /**
   * 删除文件
   * @param filePath - 文件路径（S3对象键）
   * @returns Promise<boolean> 是否成功
   */
  async deleteFile(filePath: string): Promise<boolean> {
    try {
      const params = {
        Bucket: this.bucket,
        Key: filePath
      };

      await this.s3Client.send(new DeleteObjectCommand(params));
      console.log(`✅ S3文件删除成功: ${filePath}`);
      return true;
    } catch (error) {
      console.error('❌ S3文件删除失败:', error);
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
      const params = {
        Bucket: this.bucket,
        Key: file.path,
        ResponseContentDisposition: `inline; filename="${encodeURIComponent(file.originalName)}"`
      };

      const command = new GetObjectCommand(params);
      const url = await getSignedUrl(this.s3Client, command, { expiresIn });
      return url;
    } catch (error) {
      console.error('❌ 生成S3签名URL失败:', error);
      throw new Error('生成S3签名URL失败');
    }
  }

  /**
   * 构建S3对象键
   * @param fileId - 文件ID
   * @param fileName - 文件名
   * @param userId - 用户ID
   * @returns string 对象键
   */
  private buildObjectKey(fileId: string, fileName: string, userId?: string): string {
    const prefix = userId ? `users/${userId}/` : 'public/';
    return `${prefix}${fileId}/${fileName}`;
  }

  /**
   * 构建S3元数据
   * @param options - 存储选项
   * @returns Record<string, string> 元数据
   */
  private buildMetadata(options: StorageOptions): Record<string, string> {
    const metadata: Record<string, string> = {};
    
    if (options.userId) {
      metadata['user-id'] = options.userId;
    }
    
    if (options.isPublic) {
      metadata['is-public'] = 'true';
    }
    
    if (options.expiresAt) {
      metadata['expires-at'] = options.expiresAt.toISOString();
    }
    
    // 将自定义元数据添加到S3元数据
    if (options.metadata) {
      Object.keys(options.metadata).forEach(key => {
        if (options.metadata) {
          metadata[`custom-${key}`] = String(options.metadata[key]);
        }
      });
    }
    
    return metadata;
  }

  /**
   * 将流转换为Buffer
   * @param stream - 可读流
   * @returns Promise<Buffer> Buffer
   */
  private async streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      stream.on('data', (chunk) => chunks.push(chunk));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', reject);
    });
  }
}
