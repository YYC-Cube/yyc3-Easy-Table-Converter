/**
 * @file 任务重试服务
 * @description 提供任务重试管理、重试策略配置和重试历史追踪
 * @module services/taskRetryService
 * @author YYC
 * @version 1.0.0
 * @created 2026-02-22
 */

export interface RetryPolicy {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableErrors: string[];
}

export interface RetryRecord {
  taskId: string;
  attemptNumber: number;
  timestamp: Date;
  error: string;
  success: boolean;
  duration: number;
}

export interface RetryConfig {
  taskId: string;
  retryPolicy?: Partial<RetryPolicy>;
  onRetry?: (attempt: number, error: Error) => void;
  onSuccess?: (result: any) => void;
  onFailure?: (error: Error) => void;
}

const DEFAULT_RETRY_POLICY: RetryPolicy = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
  retryableErrors: [
    'ECONNREFUSED',
    'ETIMEDOUT',
    'ENOTFOUND',
    'ECONNRESET',
    'NETWORK_ERROR',
    'TIMEOUT'
  ]
};

class TaskRetryService {
  private retryHistory: Map<string, RetryRecord[]> = new Map();
  private customPolicies: Map<string, RetryPolicy> = new Map();

  /**
   * 执行带重试的任务
   */
  async executeWithRetry<T>(
    task: () => Promise<T>,
    config: RetryConfig
  ): Promise<T> {
    const { taskId, retryPolicy, onRetry, onSuccess, onFailure } = config;
    const policy = this.getPolicy(taskId, retryPolicy);
    
    let lastError: Error | undefined;
    const history: RetryRecord[] = [];
    
    for (let attempt = 1; attempt <= policy.maxAttempts; attempt++) {
      const startTime = Date.now();
      
      try {
        const result = await task();
        const duration = Date.now() - startTime;
        
        const record: RetryRecord = {
          taskId,
          attemptNumber: attempt,
          timestamp: new Date(),
          error: '',
          success: true,
          duration
        };
        history.push(record);
        
        this.saveHistory(taskId, history);
        onSuccess?.(result);
        
        return result;
      } catch (error) {
        const duration = Date.now() - startTime;
        lastError = error as Error;
        
        const record: RetryRecord = {
          taskId,
          attemptNumber: attempt,
          timestamp: new Date(),
          error: lastError.message,
          success: false,
          duration
        };
        history.push(record);
        
        const isRetryable = this.isRetryableError(lastError, policy);
        
        if (attempt < policy.maxAttempts && isRetryable) {
          const delay = this.calculateDelay(attempt, policy);
          
          onRetry?.(attempt, lastError);
          
          await this.sleep(delay);
        } else {
          break;
        }
      }
    }
    
    this.saveHistory(taskId, history);
    onFailure?.(lastError!);
    
    throw lastError || new Error('任务执行失败');
  }

  /**
   * 获取重试策略
   */
  getPolicy(taskId: string, customPolicy?: Partial<RetryPolicy>): RetryPolicy {
    if (this.customPolicies.has(taskId)) {
      return { ...DEFAULT_RETRY_POLICY, ...this.customPolicies.get(taskId), ...customPolicy };
    }
    return { ...DEFAULT_RETRY_POLICY, ...customPolicy };
  }

  /**
   * 设置自定义重试策略
   */
  setPolicy(taskId: string, policy: Partial<RetryPolicy>): void {
    this.customPolicies.set(taskId, { ...DEFAULT_RETRY_POLICY, ...policy });
  }

  /**
   * 清除自定义策略
   */
  clearPolicy(taskId: string): void {
    this.customPolicies.delete(taskId);
  }

  /**
   * 检查错误是否可重试
   */
  private isRetryableError(error: Error, policy: RetryPolicy): boolean {
    const errorCode = (error as any).code || error.name;
    return policy.retryableErrors.some(e => 
      errorCode.includes(e) || error.message.includes(e)
    );
  }

  /**
   * 计算重试延迟
   */
  private calculateDelay(attempt: number, policy: RetryPolicy): number {
    const delay = Math.min(
      policy.baseDelay * Math.pow(policy.backoffMultiplier, attempt - 1),
      policy.maxDelay
    );
    const jitter = Math.random() * 0.3 * delay;
    return Math.floor(delay + jitter);
  }

  /**
   * 保存重试历史
   */
  private saveHistory(taskId: string, history: RetryRecord[]): void {
    this.retryHistory.set(taskId, history);
  }

  /**
   * 获取重试历史
   */
  getHistory(taskId: string): RetryRecord[] {
    return this.retryHistory.get(taskId) || [];
  }

  /**
   * 获取重试统计
   */
  getStats(taskId: string): {
    totalAttempts: number;
    successfulAttempts: number;
    failedAttempts: number;
    averageDuration: number;
    successRate: number;
  } {
    const history = this.getHistory(taskId);
    
    if (history.length === 0) {
      return {
        totalAttempts: 0,
        successfulAttempts: 0,
        failedAttempts: 0,
        averageDuration: 0,
        successRate: 0
      };
    }
    
    const successful = history.filter(r => r.success).length;
    const failed = history.filter(r => !r.success).length;
    const totalDuration = history.reduce((sum, r) => sum + r.duration, 0);
    
    return {
      totalAttempts: history.length,
      successfulAttempts: successful,
      failedAttempts: failed,
      averageDuration: Math.floor(totalDuration / history.length),
      successRate: Math.round((successful / history.length) * 100)
    };
  }

  /**
   * 清除历史记录
   */
  clearHistory(taskId?: string): void {
    if (taskId) {
      this.retryHistory.delete(taskId);
    } else {
      this.retryHistory.clear();
    }
  }

  /**
   * 睡眠函数
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const taskRetryService = new TaskRetryService();
export default taskRetryService;
