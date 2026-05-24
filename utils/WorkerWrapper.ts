/**
 * @file Worker包装器类
 * @description 提供Promise接口与Web Worker通信
 * @module utils/WorkerWrapper
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 * @updated 2024-10-15
 */

// Worker消息类型
export interface WorkerMessage {
  type: string;
  payload?: any;
  id?: string;
}

// Worker响应类型
export interface WorkerResponse {
  type: string;
  payload?: any;
  id?: string;
  error?: Error;
}

// 解析选项类型
export interface ParseOptions {
  format?: string;
  delimiter?: string;
  hasHeaders?: boolean;
  skipLines?: number;
  maxRows?: number;
  maxItems?: number;
}

// 进度回调类型
type ProgressCallback = (progress: number, rowsProcessed?: number) => void;

/**
 * Worker包装器类，提供与Web Worker通信的Promise接口
 */
export class WorkerWrapper {
  private worker: Worker | null = null;
  private isReady: boolean = false;
  private messageQueue: Array<{ message: WorkerMessage; resolve: Function; reject: Function }> = [];
  private pendingResponses: Map<string, { resolve: Function; reject: Function }> = new Map();
  private progressCallbacks: Map<string, ProgressCallback> = new Map();
  private workerURL: string;
  private timeoutId: NodeJS.Timeout | null = null;
  private lastActivity: number = 0;
  private isTerminating: boolean = false;
  
  /**
   * 构造函数
   * @param workerPath Worker脚本路径或脚本字符串
   * @param options 配置选项
   */
  constructor(workerPath: string, options: { timeout?: number } = {}) {
    this.workerURL = this.createWorkerBlobURL(workerPath);
    this.initializeWorker(options.timeout || 30000); // 默认30秒超时
  }

  /**
   * 创建Worker的Blob URL
   * @param workerPath 工作路径或代码字符串
   * @returns Blob URL
   */
  private createWorkerBlobURL(workerPath: string): string {
    // 如果是完整路径或URL，使用原始路径
    if (workerPath.startsWith('http') || workerPath.endsWith('.js')) {
      return workerPath;
    }
    
    // 否则将字符串内容创建为Blob URL
    const blob = new Blob([workerPath], { type: 'application/javascript' });
    return URL.createObjectURL(blob);
  }

  /**
   * 初始化Worker
   * @param timeout 超时时间（毫秒）
   */
  private initializeWorker(timeout: number): void {
    try {
      this.worker = new Worker(this.workerURL);
      this.setupEventListeners();
      
      // 设置超时检查
      this.timeoutId = setInterval(() => {
        this.checkTimeout(timeout);
      }, 5000); // 每5秒检查一次
      
      this.lastActivity = Date.now();
      
    } catch (error) {
      console.error('Worker初始化失败:', error);
      this.rejectAllPending('Worker初始化失败');
    }
  }

  /**
   * 设置事件监听器
   */
  private setupEventListeners(): void {
    if (!this.worker) return;

    this.worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
      this.lastActivity = Date.now();
      const { type, payload, id, error } = e.data;

      switch (type) {
        case 'ready':
          this.isReady = true;
          this.processMessageQueue();
          break;

        case 'result':
          if (id && this.pendingResponses.has(id)) {
            const { resolve } = this.pendingResponses.get(id)!;
            this.pendingResponses.delete(id);
            this.progressCallbacks.delete(id);
            resolve(payload);
          }
          break;

        case 'progress':
          if (id && this.progressCallbacks.has(id)) {
            const callback = this.progressCallbacks.get(id)!;
            callback(payload?.progress || 0, payload?.rowsProcessed);
          }
          break;

        case 'error':
          if (id && this.pendingResponses.has(id)) {
            const { reject } = this.pendingResponses.get(id)!;
            this.pendingResponses.delete(id);
            this.progressCallbacks.delete(id);
            reject(new Error(payload?.message || 'Worker处理错误'));
          }
          break;

        case 'yield':
          // 继续处理队列中的任务
          this.processMessageQueue();
          break;

        default:
          console.warn('未处理的Worker消息类型:', type);
      }
    };

    this.worker.onerror = (errorEvent: ErrorEvent) => {
      this.lastActivity = Date.now();
      console.error('Worker错误:', errorEvent);
      this.rejectAllPending(`Worker错误: ${errorEvent.message}`);
    };

    this.worker.onmessageerror = (error: MessageEvent) => {
      this.lastActivity = Date.now();
      console.error('Worker消息解析错误:', error);
    };
  }

  /**
   * 检查Worker是否超时
   * @param timeout 超时时间（毫秒）
   */
  private checkTimeout(timeout: number): void {
    if (this.lastActivity && Date.now() - this.lastActivity > timeout) {
      console.warn('Worker超时，重新初始化');
      this.terminate();
      this.initializeWorker(timeout);
    }
  }

  /**
   * 处理消息队列
   */
  private processMessageQueue(): void {
    if (!this.isReady || !this.worker || this.isTerminating) return;

    while (this.messageQueue.length > 0) {
      const { message, resolve, reject } = this.messageQueue.shift()!;
      
      // 发送消息到Worker
      try {
        this.worker?.postMessage(message);
        
        // 只有当消息有ID时才添加到待处理响应中
        if (message.id) {
          this.pendingResponses.set(message.id, { resolve, reject });
        } else {
          // 无ID的消息直接解析
          resolve();
        }
      } catch (error) {
        console.error('发送消息到Worker失败:', error);
        reject(error);
      }
    }
  }

  /**
   * 拒绝所有待处理的请求
   * @param reason 拒绝原因
   */
  private rejectAllPending(reason: string): void {
    const error = new Error(reason);
    
    // 拒绝队列中的消息
    while (this.messageQueue.length > 0) {
      const { reject } = this.messageQueue.shift()!;
      reject(error);
    }
    
    // 拒绝待处理的响应
    this.pendingResponses.forEach(({ reject }) => reject(error));
    this.pendingResponses.clear();
    this.progressCallbacks.clear();
  }

  /**
   * 发送消息到Worker
   * @param type 消息类型
   * @param payload 消息载荷
   * @param onProgress 进度回调
   * @returns Promise<WorkerResponse>
   */
  public sendMessage(type: string, payload?: any, onProgress?: ProgressCallback): Promise<any> {
    return new Promise((resolve, reject) => {
      if (this.isTerminating) {
        return reject(new Error('Worker正在终止'));
      }

      // 生成唯一ID
      const id = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const message: WorkerMessage = { type, payload, id };

      // 如果有进度回调，保存它
      if (onProgress) {
        this.progressCallbacks.set(id, onProgress);
      }

      // 如果Worker准备好，立即发送，否则加入队列
      if (this.isReady && this.worker) {
        try {
          this.worker.postMessage(message);
          this.pendingResponses.set(id, { resolve, reject });
        } catch (error) {
          console.error('发送消息失败:', error);
          reject(error);
        }
      } else {
        this.messageQueue.push({ message, resolve, reject });
      }
    });
  }

  /**
   * 解析数据
   * @param content 要解析的内容
   * @param options 解析选项
   * @param onProgress 进度回调
   * @returns Promise<ParseResult>
   */
  public parseData(content: string, options: ParseOptions = {}, onProgress?: ProgressCallback): Promise<any> {
    return this.sendMessage('parse', { content, ...options }, onProgress);
  }

  /**
   * 发送心跳检测
   * @returns Promise<boolean>
   */
  public ping(): Promise<boolean> {
    return this.sendMessage('ping')
      .then(() => true)
      .catch(() => false);
  }

  /**
   * 终止Worker
   */
  public terminate(): void {
    if (this.isTerminating) return;
    
    this.isTerminating = true;
    this.isReady = false;
    
    // 清除超时计时器
    if (this.timeoutId) {
      clearInterval(this.timeoutId);
      this.timeoutId = null;
    }

    // 终止Worker
    if (this.worker) {
      try {
        this.worker.terminate();
      } catch (error) {
        console.error('终止Worker失败:', error);
      }
      this.worker = null;
    }

    // 清理资源
    if (this.workerURL.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(this.workerURL);
      } catch (error) {
        console.error('撤销Blob URL失败:', error);
      }
    }

    // 拒绝所有待处理的请求
    this.rejectAllPending('Worker已终止');
  }

  /**
   * 检查Worker是否可用
   * @returns boolean
   */
  public get isWorkerAvailable(): boolean {
    return this.isReady && !!this.worker && !this.isTerminating;
  }
}

export default WorkerWrapper;
