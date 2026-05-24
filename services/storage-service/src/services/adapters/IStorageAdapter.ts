/**
 * @file 存储适配器接口
 * @description 定义统一的存储操作接口，用于支持多种存储后端
 * @author YYC
 * @version 2.0.0
 * @created 2024-11-23
 */

import { FileDocument } from '../../models/File';

/**
 * 存储选项接口
 */
export interface StorageOptions {
  userId?: string;
  isPublic?: boolean;
  expiresAt?: Date;
  metadata?: Record<string, any>;
}

/**
 * 存储适配器接口
 */
export interface IStorageAdapter {
  /**
   * 存储类型
   */
  storageType: 'local' | 's3' | 'gcs';

  /**
   * 保存文件
   * @param fileId - 文件ID
   * @param fileName - 文件名
   * @param buffer - 文件内容
   * @param options - 存储选项
   * @returns Promise<string> 存储路径
   */
  saveFile(fileId: string, fileName: string, buffer: Buffer, options: StorageOptions): Promise<string>;

  /**
   * 获取文件内容
   * @param filePath - 文件路径
   * @returns Promise<Buffer> 文件内容
   */
  getFileContent(filePath: string): Promise<Buffer>;

  /**
   * 删除文件
   * @param filePath - 文件路径
   * @returns Promise<boolean> 是否成功
   */
  deleteFile(filePath: string): Promise<boolean>;

  /**
   * 生成访问URL（针对云存储）
   * @param file - 文件文档
   * @param expiresIn - 过期时间（秒）
   * @returns Promise<string> 访问URL
   */
  generateSignedUrl?(file: FileDocument, expiresIn?: number): Promise<string>;
}
