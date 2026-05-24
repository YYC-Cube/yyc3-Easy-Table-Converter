/**
 * @file 文件传输工具
 * @description 实现文件分块读取、上传和断点续传的核心逻辑
 * @module utils/fileTransfer
 * @author YYC
 * @version 1.0.0
 * @created 2024-07-12
 */

/**
 * 分块上传进度回调函数类型
 */
export type ChunkUploadProgressCallback = (progress: number, chunkIndex: number) => void;

/**
 * 文件分块配置接口
 */
export interface ChunkConfig {
  /** 分块大小（字节） */
  chunkSize: number;
  /** 最大重试次数 */
  maxRetries: number;
  /** 重试延迟（毫秒） */
  retryDelay: number;
  /** 并发数 */
  concurrency: number;
}

/**
 * 默认分块配置
 */
export const DEFAULT_CHUNK_CONFIG: ChunkConfig = {
  chunkSize: 5 * 1024 * 1024, // 5MB
  maxRetries: 3,
  retryDelay: 2000,
  concurrency: 3
};

/**
 * 文件传输工具类
 */
export class FileTransfer {
  private config: ChunkConfig;

  constructor(config: Partial<ChunkConfig> = {}) {
    this.config = {
      ...DEFAULT_CHUNK_CONFIG,
      ...config
    };
  }

  /**
   * 将文件分成多个块
   * @param file 要分块的文件
   * @param startFrom 起始位置（用于断点续传）
   * @returns 文件块数组
   */
  getChunks(file: File, startFrom: number = 0): Array<{ blob: Blob; index: number; start: number; end: number }> {
    const chunks: Array<{ blob: Blob; index: number; start: number; end: number }> = [];
    const totalChunks = Math.ceil(file.size / this.config.chunkSize);
    
    // 计算从哪个块开始
    const startChunkIndex = Math.floor(startFrom / this.config.chunkSize);
    
    for (let i = startChunkIndex; i < totalChunks; i++) {
      const start = i * this.config.chunkSize;
      const end = Math.min(start + this.config.chunkSize, file.size);
      const blob = file.slice(start, end);
      
      chunks.push({
        blob,
        index: i,
        start,
        end
      });
    }
    
    return chunks;
  }

  /**
   * 读取文件为ArrayBuffer
   * @param file 要读取的文件
   * @param start 起始位置
   * @param end 结束位置
   * @returns Promise<ArrayBuffer>
   */
  readFileChunk(file: File, start: number, end: number): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = () => {
        if (reader.result instanceof ArrayBuffer) {
          resolve(reader.result);
        } else {
          reject(new Error('读取文件块失败'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error(`读取文件失败: ${reader.error?.message || '未知错误'}`));
      };
      
      const blob = file.slice(start, end);
      reader.readAsArrayBuffer(blob);
    });
  }

  /**
   * 异步处理文件块，支持并发控制和错误重试
   * @param chunks 文件块数组
   * @param processFunction 处理单个块的函数
   * @param onProgress 进度回调函数
   * @returns Promise<Array<ReturnType<T>>>
   */
  async processChunks<T>(
    chunks: Array<{ blob: Blob; index: number; start: number; end: number }>,
    processFunction: (chunk: { blob: Blob; index: number; start: number; end: number }) => Promise<T>,
    onProgress?: ChunkUploadProgressCallback
  ): Promise<Array<T>> {
    const results: Array<T> = new Array(chunks.length).fill(null);
    const pendingTasks: Array<Promise<void>> = [];
    const semaphore = new Semaphore(this.config.concurrency);
    
    // 处理单个块并支持重试
    const processChunkWithRetry = async (chunkIndex: number): Promise<void> => {
      const chunk = chunks[chunkIndex];
      let lastError: Error | null = null;
      
      for (let attempt = 0; attempt <= this.config.maxRetries; attempt++) {
        try {
          if (attempt > 0) {
            // 重试前等待
            await new Promise(resolve => setTimeout(resolve, this.config.retryDelay));
          }
          
          const result = await processFunction(chunk);
          results[chunkIndex] = result;
          
          // 通知进度
          if (onProgress) {
            const overallProgress = ((chunkIndex + 1) / chunks.length) * 100;
            onProgress(overallProgress, chunkIndex);
          }
          
          return;
        } catch (error) {
          lastError = error as Error;
          console.warn(`块 ${chunk.index} 处理失败，尝试重试 (${attempt + 1}/${this.config.maxRetries}):`, error);
        }
      }
      
      throw lastError || new Error(`块 ${chunk.index} 达到最大重试次数`);
    };
    
    // 控制并发执行
    for (let i = 0; i < chunks.length; i++) {
      await semaphore.acquire();
      
      const task = processChunkWithRetry(i)
        .catch(error => {
          console.error(`处理块 ${i} 时发生错误:`, error);
          throw error;
        })
        .finally(() => {
          semaphore.release();
        });
      
      pendingTasks.push(task);
    }
    
    // 等待所有任务完成
    await Promise.all(pendingTasks);
    return results;
  }

  /**
   * 模拟分块上传（用于前端处理）
   * @param file 要上传的文件
   * @param onProgress 进度回调
   * @param startFrom 起始位置
   * @returns Promise<Blob>
   */
  async simulateChunckedUpload(
    file: File,
    onProgress?: ChunkUploadProgressCallback,
    startFrom: number = 0
  ): Promise<Blob> {
    // 获取文件块
    const chunks = this.getChunks(file, startFrom);
    
    // 模拟处理每个块
    await this.processChunks(
      chunks,
      async (chunk) => {
        // 模拟处理延迟
        await new Promise(resolve => setTimeout(resolve, 100 + Math.random() * 200));
        // 在实际应用中，这里会调用API上传块
        return chunk.blob;
      },
      onProgress
    );
    
    // 返回原文件作为结果（在实际应用中可能是服务器返回的处理后的文件）
    return file;
  }

  /**
   * 计算上传速度和估计剩余时间
   * @param uploadedBytes 已上传字节数
   * @param startTime 开始时间戳
   * @param totalSize 总大小
   * @returns { speed: number, remainingTime: number }
   */
  calculateTransferStats(
    uploadedBytes: number,
    startTime: number,
    totalSize: number
  ): { speed: number; remainingTime: number } {
    const elapsedTime = (Date.now() - startTime) / 1000; // 秒
    
    if (elapsedTime <= 0 || uploadedBytes <= 0) {
      return { speed: 0, remainingTime: 0 };
    }
    
    const speed = uploadedBytes / elapsedTime; // 字节/秒
    const remainingBytes = totalSize - uploadedBytes;
    const remainingTime = remainingBytes / speed; // 秒
    
    return { speed, remainingTime };
  }
}

/**
 * 信号量类，用于控制并发
 */
class Semaphore {
  private available: number;
  private queue: Array<() => void> = [];

  constructor(initialAvailable: number) {
    if (initialAvailable <= 0) {
      throw new Error('信号量初始值必须大于0');
    }
    this.available = initialAvailable;
  }

  /**
   * 获取信号量
   */
  async acquire(): Promise<void> {
    if (this.available > 0) {
      this.available--;
      return;
    }
    
    return new Promise((resolve) => {
      this.queue.push(resolve);
    });
  }

  /**
   * 释放信号量
   */
  release(): void {
    this.available++;
    
    if (this.queue.length > 0) {
      const resolve = this.queue.shift();
      if (resolve) {
        resolve();
        this.available--;
      }
    }
  }
}

/**
 * 创建处理函数包装器，支持进度报告
 * @param processFunction 原始处理函数
 * @param file 文件对象
 * @param onProgress 进度回调
 * @param startFrom 起始位置
 * @returns 增强的处理函数
 */
export function createProgressAwareProcessor<T>(
  processFunction: (file: File, startFrom?: number) => Promise<T>,
  file: File,
  onProgress?: (progress: number, chunkIndex?: number) => void,
  startFrom: number = 0
): () => Promise<T> {
  return async () => {
    // 如果需要细粒度的进度报告，可以使用FileReader的progress事件
    // 这里简化处理，使用setInterval模拟进度更新
    const updateInterval = 200; // 每200ms更新一次
    let lastProgress = 0;
    
    const progressInterval = setInterval(() => {
      if (lastProgress < 95) {
        // 模拟进度递增
        lastProgress += (Math.random() * 5);
        if (onProgress) {
          onProgress(lastProgress);
        }
      }
    }, updateInterval);
    
    try {
      const result = await processFunction(file, startFrom);
      
      // 确保最终进度为100%
      clearInterval(progressInterval);
      if (onProgress) {
        onProgress(100);
      }
      
      return result;
    } catch (error) {
      clearInterval(progressInterval);
      throw error;
    }
  };
}

/**
 * 将ArrayBuffer转换为Blob
 * @param arrayBuffer ArrayBuffer对象
 * @param mimeType MIME类型
 * @returns Blob对象
 */
export function arrayBufferToBlob(arrayBuffer: ArrayBuffer, mimeType: string = 'application/octet-stream'): Blob {
  return new Blob([arrayBuffer], { type: mimeType });
}

/**
 * 将Blob转换为DataURL
 * @param blob Blob对象
 * @returns Promise<string>
 */
export function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Blob转DataURL失败'));
    reader.readAsDataURL(blob);
  });
}

/**
 * 创建下载链接
 * @param blob 要下载的Blob
 * @param filename 文件名
 * @returns HTMLAnchorElement
 */
export function createDownloadLink(blob: Blob, filename: string): HTMLAnchorElement {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  return link;
}

/**
 * 触发文件下载
 * @param blob 要下载的Blob
 * @param filename 文件名
 */
export function downloadFile(blob: Blob, filename: string): void {
  const link = createDownloadLink(blob, filename);
  document.body.appendChild(link);
  link.click();
  
  // 清理
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  }, 100);
}
