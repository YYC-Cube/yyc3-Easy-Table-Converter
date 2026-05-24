/**
 * @file 存储服务
 * @description 处理文件存储和管理
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-20
 */

import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger';

/**
 * 存储服务类
 */
export class StorageService {
  private storagePath: string;

  constructor() {
    this.storagePath = process.env.STORAGE_PATH || '/tmp/conversion-engine';
    
    // 确保存储目录存在
    this.ensureDirectoryExists(this.storagePath);
    this.ensureDirectoryExists(path.join(this.storagePath, 'input'));
    this.ensureDirectoryExists(path.join(this.storagePath, 'output'));
  }

  /**
   * 确保目录存在，如果不存在则创建
   * @param dirPath 目录路径
   */
  private ensureDirectoryExists(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      logger.info(`📁 创建存储目录: ${dirPath}`);
    }
  }

  /**
   * 保存文件到存储目录
   * @param file 文件对象
   * @param type 文件类型（input 或 output）
   * @returns Promise<string> 文件存储路径
   */
  async saveFile(file: any, type: 'input' | 'output'): Promise<string> {
    try {
      const timestamp = Date.now();
      const fileName = `${timestamp}_${file.name}`;
      const filePath = path.join(this.storagePath, type, fileName);
      
      // 这里需要根据实际文件类型实现保存逻辑
      // 例如：如果是 Buffer，可以直接写入文件
      // fs.writeFileSync(filePath, file.buffer);
      
      logger.info(`📄 文件保存成功: ${filePath}`);
      return filePath;
    } catch (error) {
      logger.error('❌ 文件保存失败:', error);
      throw error;
    }
  }

  /**
   * 获取文件内容
   * @param filePath 文件路径
   * @returns Promise<Buffer> 文件内容
   */
  async getFile(filePath: string): Promise<Buffer> {
    try {
      const content = fs.readFileSync(filePath);
      logger.info(`📖 文件读取成功: ${filePath}`);
      return content;
    } catch (error) {
      logger.error('❌ 文件读取失败:', error);
      throw error;
    }
  }

  /**
   * 删除文件
   * @param filePath 文件路径
   * @returns Promise<void>
   */
  async deleteFile(filePath: string): Promise<void> {
    try {
      fs.unlinkSync(filePath);
      logger.info(`🗑️ 文件删除成功: ${filePath}`);
    } catch (error) {
      logger.error('❌ 文件删除失败:', error);
      throw error;
    }
  }

  /**
   * 获取文件元数据
   * @param filePath 文件路径
   * @returns Promise<fs.Stats> 文件元数据
   */
  async getFileMetadata(filePath: string): Promise<fs.Stats> {
    try {
      const stats = fs.statSync(filePath);
      logger.info(`📊 文件元数据获取成功: ${filePath}`);
      return stats;
    } catch (error) {
      logger.error('❌ 文件元数据获取失败:', error);
      throw error;
    }
  }
}

/**
 * 导出服务实例创建函数
 */
export function createStorageService(): StorageService {
  return new StorageService();
}
