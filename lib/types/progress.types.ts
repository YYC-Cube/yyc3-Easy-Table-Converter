/**
 * @file 进度监控和断点续传相关类型定义
 * @description 定义进度监控系统和断点续传功能所需的所有数据结构
 * @module types/progress
 * @author YYC
 * @version 1.0.0
 * @created 2024-07-12
 */

/**
 * 扩展的批量任务接口，支持断点续传功能
 */
export interface BatchTaskExtended {
  id: string;
  file: File;
  status: 'pending' | 'processing' | 'paused' | 'completed' | 'error';
  progress: number;
  totalChunks: number;
  completedChunks: number;
  chunkSize: number;
  uploadedBytes: number;
  result?: Blob | string;
  error?: string;
  startTime?: number;
  lastUpdateTime?: number;
  pausePosition?: number;
  retryCount: number;
  
  // 断点续传相关
  chunksMap: Map<number, boolean>; // 记录哪些块已上传
  checkpoint?: {
    position: number;
    timestamp: number;
  };
}

/**
 * 进度更新事件类型
 */
export interface ProgressUpdateEvent {
  taskId: string;
  progress: number;
  uploadedBytes: number;
  status: BatchTaskExtended['status'];
  chunkIndex?: number;
  chunkSize?: number;
}

/**
 * 断点续传配置接口
 */
export interface ResumeConfig {
  enabled: boolean;
  chunkSize: number; // 默认 chunk 大小，单位字节
  maxRetries: number; // 最大重试次数
  retryDelay: number; // 重试延迟，单位毫秒
  checkpointInterval: number; // 检查点保存间隔，单位毫秒
}

/**
 * 处理进度回调函数类型
 */
export type ProgressCallback = (event: ProgressUpdateEvent) => void;

/**
 * 任务处理函数类型，支持进度回调
 */
export type TaskProcessor<T = any> = (
  file: File,
  onProgress: (progress: number, chunkIndex?: number) => void,
  startFrom?: number
) => Promise<T>;

/**
 * 检查点存储接口
 */
export interface CheckpointStorage {
  saveCheckpoint(taskId: string, checkpoint: BatchTaskExtended['checkpoint']): Promise<void>;
  getCheckpoint(taskId: string): Promise<BatchTaskExtended['checkpoint'] | null>;
  deleteCheckpoint(taskId: string): Promise<void>;
  listCheckpoints(): Promise<Array<{ taskId: string; checkpoint: BatchTaskExtended['checkpoint'] }>>;
}

// 统一导出所有类型
export type {
  BatchTaskExtended,
  ProgressUpdateEvent,
  ResumeConfig,
  ProgressCallback,
  TaskProcessor,
  CheckpointStorage
};