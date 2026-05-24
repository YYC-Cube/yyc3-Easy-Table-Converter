/**
 * @file 本地存储适配器
 * @description 实现本地文件系统存储功能
 * @author YYC
 * @version 2.0.0
 * @created 2024-11-23
 */

import fs from 'fs';
import path from 'path';
import { IStorageAdapter, StorageOptions } from './IStorageAdapter';

/**
 * 本地存储适配器
 */
export class LocalStorageAdapter implements IStorageAdapter {
  public storageType: 'local' = 'local';
  private uploadDir: string;

  /**
   * 构造函数
   * @param uploadDir - 上传目录
   */
  constructor(uploadDir?: string) {
    this.uploadDir = uploadDir || path.join(__dirname, '../../../../uploads');
    this.ensureUploadDirExists();
  }

  /**
   * 确保上传目录存在
   */
  private ensureUploadDirExists(): void {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
      console.log(`✅ 创建上传目录: ${this.uploadDir}`);
    }
  }

  /**
   * 保存文件
   * @param fileId - 文件ID
   * @param fileName - 文件名
   * @param buffer - 文件内容
   * @param options - 存储选项
   * @returns Promise<string> 存储路径
   */
  async saveFile(fileId: string, fileName: string, buffer: Buffer, options: StorageOptions): Promise<string> {
    try {
      const filePath = path.join(this.uploadDir, fileName);
      await fs.promises.writeFile(filePath, buffer);
      console.log(`✅ 文件保存到本地: ${fileId} - ${fileName}`);
      return filePath;
    } catch (error) {
      console.error('❌ 本地文件保存失败:', error);
      throw new Error('本地文件保存失败');
    }
  }

  /**
   * 获取文件内容
   * @param filePath - 文件路径
   * @returns Promise<Buffer> 文件内容
   */
  async getFileContent(filePath: string): Promise<Buffer> {
    try {
      // 验证文件路径安全
      if (!this.isPathSafe(filePath)) {
        throw new Error('不安全的文件路径');
      }
      
      // 检查文件是否存在
      if (!fs.existsSync(filePath)) {
        throw new Error('文件不存在');
      }
      
      const buffer = await fs.promises.readFile(filePath);
      return buffer;
    } catch (error) {
      console.error('❌ 读取本地文件失败:', error);
      throw new Error('读取本地文件失败');
    }
  }

  /**
   * 删除文件
   * @param filePath - 文件路径
   * @returns Promise<boolean> 是否成功
   */
  async deleteFile(filePath: string): Promise<boolean> {
    try {
      // 验证文件路径安全
      if (!this.isPathSafe(filePath)) {
        throw new Error('不安全的文件路径');
      }
      
      // 检查文件是否存在
      if (!fs.existsSync(filePath)) {
        return false;
      }
      
      await fs.promises.unlink(filePath);
      console.log(`✅ 本地文件删除成功: ${filePath}`);
      return true;
    } catch (error) {
      console.error('❌ 删除本地文件失败:', error);
      return false;
    }
  }

  /**
   * 验证文件路径安全性
   * @param filePath - 文件路径
   * @returns boolean 是否安全
   */
  private isPathSafe(filePath: string): boolean {
    try {
      const normalizedPath = path.resolve(filePath);
      const normalizedUploadDir = path.resolve(this.uploadDir);
      return normalizedPath.startsWith(normalizedUploadDir);
    } catch (error) {
      return false;
    }
  }
}
