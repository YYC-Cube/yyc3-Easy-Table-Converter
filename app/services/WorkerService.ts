/**
 * @file Worker服务类
 * @description 封装Web Worker的使用，提供文件处理和批处理的便捷接口
 * @module services/WorkerService
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-24
 */

import { supportsWebWorkers } from '../utils/performance';
import { TaskProgress } from '../types/batch';

// 定义Worker消息类型
interface ProcessFileRequest {
  type: 'PROCESS_FILE';
  fileContent: string;
  fileType: string;
  action: 'parse' | 'convert' | 'validate';
  options?: any;
}

interface ProcessBatchRequest {
  type: 'PROCESS_BATCH';
  files: Array<{ content: string; type: string; name: string }>;
  action: 'parse' | 'convert' | 'validate';
  options?: any;
}

interface ProgressUpdate {
  type: 'PROGRESS';
  percentage: number;
  status: string;
  fileIndex?: number;
}

interface ProcessResult {
  type: 'RESULT';
  data: any;
  error?: string;
}

/**
 * Worker服务类 - 封装Web Worker操作
 */
export class WorkerService {
  private worker: Worker | null = null;
  private isSupported: boolean;
  private pendingOperations: Map<number, { resolve: Function; reject: Function }> = new Map();
  private operationCounter: number = 0;
  private progressCallbacks: Map<number, (progress: TaskProgress) => void> = new Map();

  constructor() {
    this.isSupported = supportsWebWorkers();
    if (this.isSupported) {
      this.initializeWorker();
    }
  }

  /**
   * 初始化Worker
   */
  private initializeWorker(): void {
    try {
      // 使用动态导入来获取Worker路径
      // 在Next.js中，Worker文件需要放在public目录下或使用特定的导入方式
      // 这里使用相对路径，实际部署时需要调整
      this.worker = new Worker('/workers/fileProcessor.worker.js');
      
      this.worker.onmessage = (event) => {
        const message = event.data;
        
        switch (message.type) {
          case 'PROGRESS':
            this.handleProgressUpdate(message);
            break;
          case 'RESULT':
            this.handleResult(message);
            break;
        }
      };
      
      this.worker.onerror = (error) => {
        console.error('Worker错误:', error);
        // 通知所有等待的操作
        this.pendingOperations.forEach(({ reject }, id) => {
          reject(new Error(`Worker错误: ${error.message}`));
          this.pendingOperations.delete(id);
          this.progressCallbacks.delete(id);
        });
      };
    } catch (error) {
      console.error('初始化Worker失败:', error);
      this.worker = null;
      this.isSupported = false;
    }
  }

  /**
   * 处理进度更新
   */
  private handleProgressUpdate(update: ProgressUpdate): void {
    // 这里简化处理，实际应该与具体操作ID关联
    this.progressCallbacks.forEach(callback => {
      callback({
        taskId: 'unknown',
        progress: update.percentage,
        completedFiles: update.fileIndex !== undefined ? update.fileIndex + 1 : 0,
        failedFiles: 0,
        totalFiles: 1
      });
    });
  }

  /**
   * 处理操作结果
   */
  private handleResult(result: ProcessResult): void {
    // 简化处理，实际应该从消息中获取操作ID
    const firstOperationId = Array.from(this.pendingOperations.keys())[0];
    if (firstOperationId !== undefined) {
      const operation = this.pendingOperations.get(firstOperationId);
      if (operation) {
        if (result.error) {
          operation.reject(new Error(result.error));
        } else {
          operation.resolve(result.data);
        }
        this.pendingOperations.delete(firstOperationId);
        this.progressCallbacks.delete(firstOperationId);
      }
    }
  }

  /**
   * 检查Worker是否可用
   */
  public isWorkerAvailable(): boolean {
    return this.isSupported && this.worker !== null;
  }

  /**
   * 处理单个文件
   */
  public async processFile(
    fileContent: string,
    fileType: string,
    action: 'parse' | 'convert' | 'validate',
    options?: any,
    onProgress?: (progress: TaskProgress) => void
  ): Promise<any> {
    // 如果Worker不可用，使用主线程处理（降级方案）
    if (!this.isWorkerAvailable()) {
      console.warn('Worker不可用，使用主线程处理');
      return this.processFileInMainThread(fileContent, fileType, action, options, onProgress);
    }

    return new Promise((resolve, reject) => {
      const operationId = this.operationCounter++;
      this.pendingOperations.set(operationId, { resolve, reject });
      
      if (onProgress) {
        this.progressCallbacks.set(operationId, onProgress);
      }

      const request: ProcessFileRequest = {
        type: 'PROCESS_FILE',
        fileContent,
        fileType,
        action,
        options
      };

      try {
        this.worker?.postMessage(request);
      } catch (error) {
        reject(new Error(`发送消息到Worker失败: ${error instanceof Error ? error.message : String(error)}`));
        this.pendingOperations.delete(operationId);
        this.progressCallbacks.delete(operationId);
      }
    });
  }

  /**
   * 批量处理文件
   */
  public async processBatch(
    files: Array<{ content: string; type: string; name: string }>,
    action: 'parse' | 'convert' | 'validate',
    options?: any,
    onProgress?: (progress: TaskProgress) => void
  ): Promise<any[]> {
    // 如果Worker不可用，使用主线程处理（降级方案）
    if (!this.isWorkerAvailable()) {
      console.warn('Worker不可用，使用主线程处理');
      return this.processBatchInMainThread(files, action, options, onProgress);
    }

    return new Promise((resolve, reject) => {
      const operationId = this.operationCounter++;
      this.pendingOperations.set(operationId, { resolve, reject });
      
      if (onProgress) {
        this.progressCallbacks.set(operationId, onProgress);
      }

      const request: ProcessBatchRequest = {
        type: 'PROCESS_BATCH',
        files,
        action,
        options
      };

      try {
        this.worker?.postMessage(request);
      } catch (error) {
        reject(new Error(`发送消息到Worker失败: ${error instanceof Error ? error.message : String(error)}`));
        this.pendingOperations.delete(operationId);
        this.progressCallbacks.delete(operationId);
      }
    });
  }

  /**
   * 在主线程中处理单个文件（降级方案）
   */
  private async processFileInMainThread(
    fileContent: string,
    fileType: string,
    action: 'parse' | 'convert' | 'validate',
    options?: any,
    onProgress?: (progress: TaskProgress) => void
  ): Promise<any> {
    // 模拟进度更新
    onProgress?.({ 
      taskId: 'unknown',
      progress: 0, 
      completedFiles: 0, 
      failedFiles: 0, 
      totalFiles: 1 
    });
    
    // 简单的文件处理实现
    try {
      let result: any;
      
      switch (action) {
        case 'parse':
          result = this.parseFile(fileContent, fileType, options);
          break;
        case 'validate':
          result = this.validateFile(fileContent, fileType);
          break;
        case 'convert':
          const parsed = this.parseFile(fileContent, fileType, options);
          const targetType = options?.targetType || 'json';
          result = this.convertFile(parsed, targetType, options);
          break;
      }
      
      onProgress?.({ 
        taskId: 'unknown',
        progress: 100, 
        completedFiles: 1, 
        failedFiles: 0, 
        totalFiles: 1 
      });
      return result;
    } catch (error) {
      throw new Error(`处理文件失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 在主线程中批量处理文件（降级方案）
   */
  private async processBatchInMainThread(
    files: Array<{ content: string; type: string; name: string }>,
    action: 'parse' | 'convert' | 'validate',
    options?: any,
    onProgress?: (progress: TaskProgress) => void
  ): Promise<any[]> {
    const results: any[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      onProgress?.({
        taskId: 'unknown',
        progress: Math.round(((i + 1) / files.length) * 100),
        completedFiles: i + 1,
        failedFiles: results.filter(r => !r.success).length,
        totalFiles: files.length
      });
      
      try {
        let result: any;
        
        switch (action) {
          case 'parse':
            result = this.parseFile(file.content, file.type, options);
            break;
          case 'validate':
            result = this.validateFile(file.content, file.type);
            break;
          case 'convert':
            const parsed = this.parseFile(file.content, file.type, options);
            const targetType = options?.targetType || 'json';
            result = this.convertFile(parsed, targetType, options);
            break;
        }
        
        results.push({
          name: file.name,
          type: file.type,
          success: true,
          data: result
        });
      } catch (error) {
        results.push({
          name: file.name,
          type: file.type,
          success: false,
          error: error instanceof Error ? error.message : String(error)
        });
      }
      
      // 让出主线程，避免UI阻塞
      if (i % 5 === 0) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }
    
    return results;
  }

  // 以下是降级方案使用的简单解析函数
  
  private parseFile(content: string, fileType: string, options?: any): any {
    try {
      switch (fileType.toLowerCase()) {
        case 'json':
          return JSON.parse(content);
        case 'yaml':
        case 'yml':
          // 简化的YAML解析
          return this.parseYAML(content);
        case 'csv':
          return this.parseCSV(content, options?.delimiter || ',');
        default:
          throw new Error(`不支持的文件类型: ${fileType}`);
      }
    } catch (error) {
      throw new Error(`解析文件失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private parseYAML(yaml: string): any {
    const result: any = {};
    const lines = yaml.split('\n');
    
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine || trimmedLine.startsWith('#')) continue;
      
      const colonIndex = trimmedLine.indexOf(':');
      if (colonIndex > 0) {
        const key = trimmedLine.substring(0, colonIndex).trim();
        let value: any = trimmedLine.substring(colonIndex + 1).trim();
        
        if (value === 'true') value = true;
        else if (value === 'false') value = false;
        else if (value === 'null') value = null;
        else if (!isNaN(Number(value))) value = Number(value);
        
        result[key] = value;
      }
    }
    
    return result;
  }

  private parseCSV(csv: string, delimiter: string): any[] {
    const lines = csv.split('\n').filter(line => line.trim());
    if (lines.length === 0) return [];
    
    const headers = lines[0].split(delimiter).map(header => header.trim());
    const result: any[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(delimiter).map(value => value.trim());
      const row: any = {};
      
      for (let j = 0; j < headers.length; j++) {
        row[headers[j]] = values[j] || '';
      }
      
      result.push(row);
    }
    
    return result;
  }

  private convertFile(parsedData: any, targetType: string, options?: any): string {
    try {
      switch (targetType.toLowerCase()) {
        case 'json':
          return JSON.stringify(parsedData, null, options?.indent || 2);
        default:
          throw new Error(`不支持的目标格式: ${targetType}`);
      }
    } catch (error) {
      throw new Error(`转换文件失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private validateFile(content: string, fileType: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    try {
      switch (fileType.toLowerCase()) {
        case 'json':
          JSON.parse(content);
          break;
        default:
          errors.push(`不支持验证的文件类型: ${fileType}`);
      }
      
      return { valid: errors.length === 0, errors };
    } catch (error) {
      return { 
        valid: false, 
        errors: [`文件验证失败: ${error instanceof Error ? error.message : String(error)}`] 
      };
    }
  }

  /**
   * 终止Worker
   */
  public terminate(): void {
    if (this.worker) {
      try {
        this.worker.terminate();
        this.worker = null;
      } catch (error) {
        console.error('终止Worker失败:', error);
      }
    }
    this.pendingOperations.clear();
    this.progressCallbacks.clear();
  }
}

// 导出单例
export const workerService = new WorkerService();