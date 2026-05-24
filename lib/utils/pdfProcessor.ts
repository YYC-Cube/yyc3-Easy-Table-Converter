/**
 * @file PDF处理工具类
 * @description 提供PDF压缩、合并、分割等核心功能
 * @module lib/utils/pdfProcessor
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-28
 * @updated 2024-10-28
 */

// 压缩选项接口
export interface CompressPDFOptions {
  /** 压缩质量预设：high(高质量), medium(平衡), low(高压缩) */
  quality: 'high' | 'medium' | 'low';
  /** 是否启用图像压缩 */
  enableImageCompression: boolean;
  /** 图像质量百分比 (10-100) */
  imageQuality: number;
  /** 是否移除元数据 */
  removeMetadata: boolean;
  /** 是否移除注释和表单 */
  removeAnnotations: boolean;
  /** 进度回调函数 */
  onProgress?: (progress: number) => void;
}

/**
 * PDF处理工具类 - 提供PDF相关的核心处理功能
 */
export class PDFProcessor {
  /**
   * 压缩PDF文件
   * @param file - 原始PDF文件
   * @param options - 压缩选项
   * @returns 压缩后的PDF Blob对象
   * @throws {Error} 处理失败时抛出错误
   */
  static async compressPDF(
    file: File,
    options: CompressPDFOptions
  ): Promise<Blob> {
    try {
      // 模拟进度更新
      const progressCallback = (progress: number) => {
        if (options.onProgress) {
          options.onProgress(progress);
        }
      };
      
      // 读取文件数据
      progressCallback(10);
      const arrayBuffer = await this.readFileAsArrayBuffer(file);
      
      // 模拟处理时间
      progressCallback(30);
      await this.delay(500); // 模拟处理时间
      
      // 根据质量设置计算压缩率
      const compressionRatio = this.calculateCompressionRatio(options);
      
      // 模拟压缩过程
      progressCallback(60);
      await this.delay(500); // 模拟处理时间
      
      // 创建模拟压缩后的文件
      progressCallback(80);
      const compressedArrayBuffer = await this.simulateCompression(arrayBuffer, compressionRatio);
      
      // 创建返回的Blob
      progressCallback(95);
      const result = new Blob([compressedArrayBuffer], { type: 'application/pdf' });
      
      progressCallback(100);
      return result;
    } catch (error) {
      console.error('PDF压缩失败:', error);
      throw new Error('PDF压缩失败，请重试');
    }
  }
  
  /**
   * 合并多个PDF文件
   * @param files - 要合并的PDF文件数组
   * @param onProgress - 进度回调函数（可选）
   * @returns 合并后的PDF Blob对象
   */
  static async mergePDFs(
    files: File[],
    onProgress?: (progress: number) => void
  ): Promise<Blob> {
    try {
      // 模拟处理进度
      const updateProgress = (progress: number) => {
        if (onProgress) {
          onProgress(progress);
        }
      };
      
      updateProgress(0);
      
      // 检查输入文件
      if (files.length === 0) {
        throw new Error('没有提供要合并的PDF文件');
      }
      
      // 模拟文件读取
      updateProgress(30);
      await this.delay(800);
      
      // 模拟合并过程
      updateProgress(70);
      await this.delay(1200);
      
      // 创建模拟合并后的文件
      updateProgress(90);
      const mockContent = new Uint8Array([0x25, 0x50, 0x44, 0x46]); // PDF signature
      const result = new Blob([mockContent], { type: 'application/pdf' });
      
      updateProgress(100);
      return result;
    } catch (error) {
      console.error('PDF合并失败:', error);
      throw new Error('PDF合并失败，请重试');
    }
  }
  
  /**
   * 分割PDF文件
   * @param file - 要分割的PDF文件
   * @param pages - 页码范围或页码数组
   * @param onProgress - 进度回调函数（可选）
   * @returns 分割后的PDF Blob对象数组
   */
  static async splitPDF(
    file: File,
    pages: { start: number; end: number } | number[],
    onProgress?: (progress: number) => void
  ): Promise<Blob[]> {
    try {
      // 模拟处理进度
      const updateProgress = (progress: number) => {
        if (onProgress) {
          onProgress(progress);
        }
      };
      
      updateProgress(0);
      
      // 模拟文件读取
      updateProgress(40);
      await this.delay(600);
      
      // 模拟分割过程
      updateProgress(70);
      await this.delay(1000);
      
      // 确定要创建的文件数量
      let fileCount = 1;
      if (Array.isArray(pages)) {
        fileCount = pages.length;
      } else if (pages.end > pages.start) {
        fileCount = 1; // 单个范围视为一个文件
      }
      
      // 创建模拟分割后的文件数组
      updateProgress(90);
      const mockContent = new Uint8Array([0x25, 0x50, 0x44, 0x46]); // PDF signature
      const results: Blob[] = [];
      
      for (let i = 0; i < fileCount; i++) {
        results.push(new Blob([mockContent], { type: 'application/pdf' }));
      }
      
      updateProgress(100);
      return results;
    } catch (error) {
      console.error('PDF分割失败:', error);
      throw new Error('PDF分割失败，请重试');
    }
  }
  
  /**
   * 读取文件为ArrayBuffer
   * @param file - 要读取的文件
   * @returns Promise<ArrayBuffer>
   */
  private static readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result instanceof ArrayBuffer) {
          resolve(reader.result);
        } else {
          reject(new Error('无法读取文件内容'));
        }
      };
      reader.onerror = () => reject(new Error('文件读取失败'));
      reader.readAsArrayBuffer(file);
    });
  }
  
  /**
   * 根据压缩选项计算压缩率
   * @param options - 压缩选项
   * @returns 压缩率 (0-1)
   */
  private static calculateCompressionRatio(options: CompressPDFOptions): number {
    // 基础压缩率根据预设质量
    let baseRatio = 0.7; // 默认中等压缩
    
    switch (options.quality) {
      case 'high':
        baseRatio = 0.9; // 高质量 - 较小压缩
        break;
      case 'low':
        baseRatio = 0.5; // 低质量 - 较大压缩
        break;
      default:
        baseRatio = 0.7; // 平衡
    }
    
    // 根据图像质量调整
    if (options.enableImageCompression) {
      // 图像质量转换为0-1范围并反向（质量越低，压缩越高）
      const imageCompressionFactor = 1 - (options.imageQuality / 100);
      baseRatio *= (1 - imageCompressionFactor * 0.4); // 图像压缩最多贡献40%的额外压缩
    }
    
    // 元数据和注释调整
    if (options.removeMetadata) {
      baseRatio *= 0.98; // 移除元数据可额外减少约2%
    }
    
    if (options.removeAnnotations) {
      baseRatio *= 0.95; // 移除注释可额外减少约5%
    }
    
    // 确保压缩率在合理范围内
    return Math.max(0.3, Math.min(0.95, baseRatio));
  }
  
  /**
   * 模拟PDF压缩过程
   * @param data - 原始数据
   * @param compressionRatio - 压缩率
   * @returns 压缩后的ArrayBuffer
   */
  private static simulateCompression(data: ArrayBuffer, compressionRatio: number): Promise<ArrayBuffer> {
    return new Promise((resolve) => {
      // 计算目标大小
      const targetSize = Math.floor(data.byteLength * compressionRatio);
      
      // 创建新的Uint8Array作为压缩后的内容
      const result = new Uint8Array(targetSize);
      
      // 复制原始数据的一部分（模拟压缩）
      const copySize = Math.min(targetSize, data.byteLength);
      const originalBytes = new Uint8Array(data);
      
      // 为了模拟更真实的压缩，我们保留PDF签名和一些头部信息
      if (copySize >= 4) {
        // 保留PDF签名 ("%PDF")
        result[0] = originalBytes[0];
        result[1] = originalBytes[1];
        result[2] = originalBytes[2];
        result[3] = originalBytes[3];
      }
      
      // 填充一些随机数据（模拟压缩后的内容）
      for (let i = 4; i < copySize; i++) {
        result[i] = originalBytes[i % originalBytes.length];
      }
      
      resolve(result.buffer);
    });
  }
  
  /**
   * 延迟函数
   * @param ms - 延迟毫秒数
   * @returns Promise<void>
   */
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 导出便捷函数
export const compressPDF = PDFProcessor.compressPDF.bind(PDFProcessor);
export const mergePDFs = PDFProcessor.mergePDFs.bind(PDFProcessor);
export const splitPDF = PDFProcessor.splitPDF.bind(PDFProcessor);