/**
 * @file 批处理类型定义
 * @description 定义批处理相关的TypeScript类型接口
 * @module types/batch
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-24
 */

/**
 * 批处理文件状态枚举
 */
export enum BatchStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  ERROR = 'error',
  SKIPPED = 'skipped'
}

/**
 * 批处理结果接口
 */
export interface BatchResult {
  success: boolean;
  data: any;
  metadata?: Record<string, any>;
}

/**
 * 批处理文件接口
 */
export interface BatchFile {
  id: string;
  name: string;
  size: number;
  content: string;
  status: BatchStatus;
  error: string | null;
  result: BatchResult | null;
  processedAt: Date | null;
  processingTime: number;
}

/**
 * 重试配置接口
 */
export interface RetryConfig {
  maxRetries: number;
  retryDelay: number;
}

/**
 * 分块配置接口
 */
export interface ChunkingConfig {
  enabled: boolean;
  chunkSize: number;
  overlap: number;
}

/**
 * AI处理类型
 */
export type AIProcessingType = 'text' | 'data' | 'image';

/**
 * 批处理任务配置接口
 */
export interface BatchTaskConfig {
  useAI: boolean;
  aiModelId: string;
  aiProcessingType: AIProcessingType;
  retryConfig: RetryConfig;
  timeout: number;
  chunking: ChunkingConfig;
}

/**
 * 任务进度信息接口
 */
export interface TaskProgress {
  taskId: string;
  progress: number;
  completedFiles: number;
  failedFiles: number;
  totalFiles: number;
}

/**
 * 批处理任务统计接口
 */
export interface BatchTaskStats {
  totalFiles: number;
  completedFiles: number;
  failedFiles: number;
  processingTime: number;
  averageProcessingTime: number;
}

/**
 * 批处理任务接口
 */
export interface BatchTask {
  id: string;
  files: BatchFile[];
  totalFiles: number;
  completedFiles: number;
  failedFiles: number;
  totalSize: number;
  processedSize: number;
  status: 'pending' | 'processing' | 'completed' | 'completed_with_errors' | 'error' | 'cancelled' | 'paused';
  config: BatchTaskConfig;
  createdAt: Date;
  updatedAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
  processingTime: number;
  progressCallback?: (progress: TaskProgress) => void;
}

/**
 * 批处理任务查询参数接口
 */
export interface BatchTaskQuery {
  status?: string;
  search?: string;
  page?: number;
  pageSize?: number;
  sortBy?: keyof BatchTask;
  sortOrder?: 'asc' | 'desc';
}

/**
 * 批处理任务列表响应接口
 */
export interface BatchTaskListResponse {
  tasks: BatchTask[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * 批处理文件详情响应接口
 */
export interface BatchFileDetail {
  file: BatchFile;
  taskId: string;
  taskStatus: string;
}

/**
 * 批处理性能指标接口
 */
export interface BatchPerformanceMetrics {
  totalTasks: number;
  completedTasks: number;
  averageProcessingTime: number;
  successRate: number;
  errorRate: number;
  filesProcessed: number;
  totalProcessingTime: number;
  aiUsage: {
    totalCalls: number;
    successfulCalls: number;
    failedCalls: number;
    averageResponseTime: number;
    tokensUsed: number;
  };
}