/**
 * @file 通用类型定义
 * @description 定义项目中通用的TypeScript类型接口
 * @module types/common
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-24
 */

import { TaskProgress } from './batch';

/**
 * 任务进度回调函数类型
 */
export type TaskProgressCallback = (progress: TaskProgress) => void;

/**
 * 通用ID接口
 */
export interface Identifiable {
  id: string;
}

/**
 * 通用时间戳接口
 */
export interface Timestamped {
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 分页参数接口
 */
export interface PaginationParams {
  page: number;
  pageSize: number;
}

/**
 * 分页响应接口
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * 排序参数接口
 */
export interface SortParams<T> {
  sortBy: keyof T;
  sortOrder: 'asc' | 'desc';
}

/**
 * 通用响应接口
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  metadata?: Record<string, any>;
}

/**
 * 通用错误接口
 */
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

/**
 * 文件上传参数接口
 */
export interface FileUploadParams {
  file: File;
  name?: string;
  type?: string;
  metadata?: Record<string, any>;
}

/**
 * 文件信息接口
 */
export interface FileInfo {
  id: string;
  name: string;
  originalName: string;
  type: string;
  size: number;
  path: string;
  url: string;
  uploadedAt: Date;
}

/**
 * 搜索参数接口
 */
export interface SearchParams {
  query?: string;
  filters?: Record<string, any>;
  pagination?: PaginationParams;
  sort?: SortParams<any>;
}

/**
 * 加载状态类型
 */
export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

/**
 * 通用操作结果接口
 */
export interface OperationResult {
  success: boolean;
  message?: string;
  error?: string;
}

/**
 * 通用选项接口
 */
export interface Option<T = string> {
  value: T;
  label: string;
  disabled?: boolean;
  icon?: string;
}

/**
 * 通用配置接口
 */
export interface Config<T = any> {
  [key: string]: T;
}

/**
 * 通用上下文接口
 */
export interface Context<T = any> {
  [key: string]: T;
}

/**
 * 通用事件处理函数类型
 */
export type EventHandler<T = Event> = (event: T) => void;

/**
 * 通用回调函数类型
 */
export type Callback<T = void> = () => T;

/**
 * 通用值回调函数类型
 */
export type ValueCallback<T, R = void> = (value: T) => R;

/**
 * 通用错误处理函数类型
 */
export type ErrorHandler = (error: Error) => void;

/**
 * 延迟选项接口
 */
export interface DelayOptions {
  ms: number;
}

/**
 * 节流选项接口
 */
export interface ThrottleOptions {
  limit: number;
  leading?: boolean;
  trailing?: boolean;
}

/**
 * 防抖选项接口
 */
export interface DebounceOptions {
  delay: number;
  leading?: boolean;
  trailing?: boolean;
}

/**
 * 重试选项接口
 */
export interface RetryOptions {
  maxRetries: number;
  delay: number;
  exponentialBackoff?: boolean;
  maxDelay?: number;
}