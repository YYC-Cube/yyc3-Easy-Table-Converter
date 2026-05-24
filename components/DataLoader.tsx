/**
 * @file DataLoader组件
 * @description 高性能数据加载组件，支持多种数据源和文件格式
 * @module components/DataLoader
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 * @updated 2024-10-15
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { LoadingState } from './LoadingState';
import { useDataProcessor } from '../hooks/useDataProcessor';
import { WorkerWrapper } from '../utils/WorkerWrapper';
import { useLoadingState } from '../hooks/useLoadingState';

// 支持的文件格式类型
export type SupportedFormat = 'csv' | 'json' | 'tsv' | 'xlsx' | 'xls';

// 操作状态类型
export type LoadingState = 'idle' | 'loading' | 'processing' | 'success' | 'error';

// 数据源类型
export type DataSource = 'file' | 'url' | 'api' | 'cache';

// 数据加载参数接口
export interface DataLoaderParams {
  source?: DataSource;
  file?: File;
  url?: string;
  apiEndpoint?: string;
  apiMethod?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  apiHeaders?: Record<string, string>;
  apiBody?: any;
  cacheKey?: string;
  maxRows?: number;
  chunkSize?: number;
}

// 组件属性接口
export interface DataLoaderProps {
  /** 是否自动开始加载 */
  autoLoad?: boolean;
  /** 最大文件大小（字节） */
  maxFileSize?: number;
  /** 支持的文件格式 */
  supportedFormats?: SupportedFormat[];
  /** 是否显示进度 */
  showProgress?: boolean;
  /** 最小显示时间（毫秒） */
  minDuration?: number;
  /** 加载完成回调 */
  onLoadComplete?: (data: any[]) => void;
  /** 加载错误回调 */
  onLoadError?: (error: Error) => void;
  /** 进度更新回调 */
  onProgressUpdate?: (progress: number) => void;
  /** 自定义样式类名 */
  className?: string;
  /** 初始数据参数 */
  initialParams?: DataLoaderParams;
}

// 数据格式信息接口
interface FormatInfo {
  extension: SupportedFormat;
  mimeType: string;
  parser: (content: string | ArrayBuffer) => Promise<any[]>;
}

// CSV解析器
async function parseCSV(content: string | ArrayBuffer): Promise<any[]> {
  const text = typeof content === 'string' ? content : new TextDecoder().decode(content);
  const lines = text.trim().split('\n');
  const headers = lines[0].split(',');
  
  return lines.slice(1).map(line => {
    const values = line.split(',');
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    return row;
  });
}

// JSON解析器
async function parseJSON(content: string | ArrayBuffer): Promise<any[]> {
  const text = typeof content === 'string' ? content : new TextDecoder().decode(content);
  const parsed = JSON.parse(text);
  return Array.isArray(parsed) ? parsed : [parsed];
}

// TSV解析器
async function parseTSV(content: string | ArrayBuffer): Promise<any[]> {
  const text = typeof content === 'string' ? content : new TextDecoder().decode(content);
  const lines = text.trim().split('\n');
  const headers = lines[0].split('\t');
  
  return lines.slice(1).map(line => {
    const values = line.split('\t');
    const row: Record<string, string> = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    return row;
  });
}

// 默认支持的文件格式配置
const DEFAULT_FORMATS: FormatInfo[] = [
  {
    extension: 'csv',
    mimeType: 'text/csv',
    parser: parseCSV
  },
  {
    extension: 'json',
    mimeType: 'application/json',
    parser: parseJSON
  },
  {
    extension: 'tsv',
    mimeType: 'text/tab-separated-values',
    parser: parseTSV
  }
  // Excel格式解析将在支持xlsx库后添加
];

/**
 * @description DataLoader组件 - 高性能数据加载组件
 * @param {DataLoaderProps} props 组件属性
 */
export const DataLoader: React.FC<DataLoaderProps> = ({
  autoLoad = false,
  maxFileSize = 10 * 1024 * 1024, // 默认10MB
  supportedFormats = ['csv', 'json', 'tsv'],
  showProgress: _showProgress = true,
  minDuration = 300,
  onLoadComplete,
  onLoadError,
  onProgressUpdate,
  className = '',
  initialParams
}) => {
  // 状态管理
  const {
    state,
    error,
    progress,
    start,
    process,
    success,
    fail,
    updateProgress,
    reset
  } = useLoadingState();
  
  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState('');
  const [sourceType, setSourceType] = useState<DataSource>('file');
  const [isFileTooLarge, setIsFileTooLarge] = useState(false);
  
  // 引用
  const fileInputRef = useRef<HTMLInputElement>(null);
  const startTimeRef = useRef<number>(0);
  
  // Web Worker 初始化
  const workerWrapperRef = useRef<WorkerWrapper | null>(null);
  
  // 初始化Worker
  useEffect(() => {
    // 使用空字符串作为Worker脚本路径，后续根据需要动态设置
    workerWrapperRef.current = new WorkerWrapper('');
    
    // 清理函数
    return () => {
      if (workerWrapperRef.current) {
        workerWrapperRef.current.terminate();
      }
    };
  }, []);
  
  // Worker进度更新通过processWithWorker函数中的回调处理，不需要全局监听
  
  // 使用数据处理钩子
  const { profileData, optimizeData } = useDataProcessor();

  // 过滤支持的格式
  const enabledFormats = DEFAULT_FORMATS.filter(format => 
    supportedFormats.includes(format.extension)
  );

  // 格式检测
  const detectFormat = useCallback((file: File): SupportedFormat | null => {
    const extension = file.name.split('.').pop()?.toLowerCase() as SupportedFormat;
    return supportedFormats.includes(extension) ? extension : null;
  }, [supportedFormats]);



  // 读取文件内容
  const readFile = useCallback((file: File): Promise<string | ArrayBuffer> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          resolve(e.target.result);
        } else {
          reject(new Error('文件读取失败'));
        }
      };
      reader.onerror = () => reject(new Error('文件读取错误'));
      
      // 根据文件类型选择读取方式
      if (file.type.includes('text') || file.name.endsWith('.json')) {
        reader.readAsText(file);
      } else {
        reader.readAsArrayBuffer(file);
      }
    });
  }, []);

  // 使用Web Worker处理数据
  const processWithWorker = useCallback(async (content: string | ArrayBuffer, format: string): Promise<any[]> => {
    const worker = workerWrapperRef.current;
    if (!worker) {
      throw new Error('Worker未初始化');
    }
    
    process();
    // 将ArrayBuffer转换为字符串
    const textContent = typeof content === 'string' ? content : new TextDecoder().decode(content);
    const data = await worker.parseData(textContent, { format });
    return data;
  }, []);
  
  // 在主线程处理数据（用于小型数据）
  const processInMainThread = useCallback(async (content: string | ArrayBuffer, format: string): Promise<any[]> => {
    const formatInfo = enabledFormats.find(f => f.extension === format);
    if (!formatInfo) {
      throw new Error('格式解析器不存在');
    }
    
    process();
    updateProgress(60);
    let data = await formatInfo.parser(content);
    updateProgress(80);
    
    // 数据特征分析和优化
    await profileData(data);
    
    // 应用数据优化
    data = await optimizeData(data);
    
    return data;
  }, [enabledFormats, profileData, optimizeData]);
  
  // 加载本地文件
  const loadFromFile = useCallback(async (file: File) => {
    try {
      start();
      startTimeRef.current = Date.now();
      updateProgress(0);
      
      // 检查文件大小
      if (file.size > maxFileSize) {
        setIsFileTooLarge(true);
        fail(`文件大小超过限制（最大 ${(maxFileSize / 1024 / 1024).toFixed(2)}MB）`);
        throw new Error(`文件大小超过限制（最大 ${(maxFileSize / 1024 / 1024).toFixed(2)}MB）`);
      }
      
      setIsFileTooLarge(false);
      
      // 检测格式
      const format = detectFormat(file);
      if (!format) {
        fail('不支持的文件格式');
        throw new Error('不支持的文件格式');
      }
      
      // 更新进度
      updateProgress(30);
      
      // 读取文件内容
      const content = await readFile(file);
      
      // 根据文件大小决定处理方式
      let data: any[] = [];
      const useWorker = file.size > 500 * 1024; // 500KB以上的文件使用Worker
      
      if (useWorker && workerWrapperRef.current) {
        data = await processWithWorker(content, format);
      } else {
        data = await processInMainThread(content, format);
      }
      
      // 确保最小显示时间
      const elapsed = Date.now() - startTimeRef.current;
      if (elapsed < minDuration) {
        await new Promise(resolve => setTimeout(resolve, minDuration - elapsed));
      }
      
      updateProgress(100);
      success(data);
      
      // 回调
      onLoadComplete?.(data);
      onProgressUpdate?.(100);
      
      return data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('加载失败');
      fail(error);
      onLoadError?.(error);
      throw error;
    }
  }, [maxFileSize, detectFormat, readFile, minDuration, onLoadComplete, onLoadError, onProgressUpdate, processWithWorker, processInMainThread, start, process, success, fail, updateProgress]);

  // 加载远程URL
  const loadFromUrl = useCallback(async (url: string) => {
    try {
      start();
      startTimeRef.current = Date.now();
      updateProgress(0);
      
      // 简单的URL验证
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        throw new Error('无效的URL格式');
      }
      
      // 使用fetch API加载数据
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP错误! 状态: ${response.status}`);
      }
      
      updateProgress(50);
      
      // 尝试检测内容类型
      const contentType = response.headers.get('content-type');
      let data: any[] = [];
      
      // 对于JSON数据，直接解析
      if (contentType?.includes('json')) {
        const jsonData = await response.json();
        data = Array.isArray(jsonData) ? jsonData : [jsonData];
      } else {
        // 获取文本内容
        const text = await response.text();
        
        // 确定格式
        let format: string;
        if (contentType?.includes('csv')) {
          format = 'csv';
        } else if (contentType?.includes('tab-separated-values')) {
          format = 'tsv';
        } else {
          // 尝试根据内容判断格式
          try {
            JSON.parse(text);
            format = 'json';
          } catch {
            format = 'csv'; // 默认假设为CSV
          }
        }
        
        // 根据数据量大小选择处理方式
        const useWorker = text.length > 500 * 1024; // 500KB以上的数据使用Worker
        
        if (useWorker && workerWrapperRef.current && format !== 'json') {
          data = await processWithWorker(text, format);
        } else if (format === 'json') {
          try {
            const jsonData = JSON.parse(text);
            data = Array.isArray(jsonData) ? jsonData : [jsonData];
          } catch {
            throw new Error('无法解析JSON数据');
          }
        } else {
          // 在主线程处理
          data = await processInMainThread(text, format);
        }
      }
      
      // 数据特征分析和优化
      await profileData(data);
      
      // 应用数据优化
      data = await optimizeData(data);
      
      // 确保最小显示时间
      const elapsed = Date.now() - startTimeRef.current;
      if (elapsed < minDuration) {
        await new Promise(resolve => setTimeout(resolve, minDuration - elapsed));
      }
      
      updateProgress(100);
      success(data);
      
      // 回调
      onLoadComplete?.(data);
      onProgressUpdate?.(100);
      
      return data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('加载失败');
      fail(error);
      onLoadError?.(error);
      throw error;
    }
  }, [profileData, optimizeData, minDuration, onLoadComplete, onLoadError, onProgressUpdate, processWithWorker, processInMainThread, start, process, success, fail, updateProgress]);

  // 从API加载数据
  const loadFromApi = useCallback(async (endpoint: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE', headers?: Record<string, string>, body?: any) => {
    try {
      start();
      startTimeRef.current = Date.now();
      updateProgress(0);
      
      // 简单的URL验证
      if (!endpoint.startsWith('http://') && !endpoint.startsWith('https://')) {
        throw new Error('无效的API端点格式');
      }
      
      // 准备请求配置
      const requestConfig: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...headers
        }
      };
      
      // 添加请求体（如果有）
      if ((method === 'POST' || method === 'PUT') && body) {
        requestConfig.body = JSON.stringify(body);
      }
      
      // 使用fetch API加载数据
      const response = await fetch(endpoint, requestConfig);
      
      if (!response.ok) {
        throw new Error(`API请求失败! 状态: ${response.status}`);
      }
      
      updateProgress(50);
      
      // 解析响应数据
      let data: any[] = [];
      
      // 尝试检测内容类型
      const contentType = response.headers.get('content-type');
      
      // 获取响应内容
      const responseText = await response.text();
      
      // 对于大数据响应，可以根据需要使用Worker处理
      if (contentType?.includes('json')) {
        try {
          const jsonData = JSON.parse(responseText);
          data = Array.isArray(jsonData) ? jsonData : [jsonData];
        } catch {
          throw new Error('API返回的不是有效的JSON数据');
        }
      } else if (contentType?.includes('csv')) {
        // CSV数据可能很大，使用Worker处理
        if (responseText.length > 500 * 1024 && workerWrapperRef.current) {
          data = await processWithWorker(responseText, 'csv');
        } else {
          data = await processInMainThread(responseText, 'csv');
        }
      } else if (contentType?.includes('tab-separated-values')) {
        // TSV数据可能很大，使用Worker处理
        if (responseText.length > 500 * 1024 && workerWrapperRef.current) {
          data = await processWithWorker(responseText, 'tsv');
        } else {
          data = await processInMainThread(responseText, 'tsv');
        }
      } else {
        // 默认按JSON处理
        try {
          const jsonData = JSON.parse(responseText);
          data = Array.isArray(jsonData) ? jsonData : [jsonData];
        } catch {
          throw new Error('API返回的不是有效的JSON数据');
        }
      }
      
      // 数据特征分析和优化
      await profileData(data);
      
      // 应用数据优化
      data = await optimizeData(data);
      
      // 确保最小显示时间
      const elapsed = Date.now() - startTimeRef.current;
      if (elapsed < minDuration) {
        await new Promise(resolve => setTimeout(resolve, minDuration - elapsed));
      }
      
      updateProgress(100);
      success(data);
      
      // 回调
      onLoadComplete?.(data);
      onProgressUpdate?.(100);
      
      return data;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('API加载失败');
      fail(error);
      onLoadError?.(error);
      throw error;
    }
  }, [profileData, optimizeData, minDuration, onLoadComplete, onLoadError, onProgressUpdate, processWithWorker, processInMainThread, start, process, success, fail, updateProgress]);

  // API加载状态管理
  const [apiEndpoint, setApiEndpoint] = useState('');
  const [apiMethod, setApiMethod] = useState<'GET' | 'POST' | 'PUT' | 'DELETE'>('GET');
  const [apiHeaders, setApiHeaders] = useState('{}');
  const [apiBody, setApiBody] = useState('');

  // 开始加载数据
  const startLoading = useCallback(async () => {
    if (state === 'loading' || state === 'processing') return;
    
    try {
      if (sourceType === 'file' && file) {
        await loadFromFile(file);
      } else if (sourceType === 'url' && url) {
        await loadFromUrl(url);
      } else if (sourceType === 'api' && apiEndpoint) {
        const headers = apiHeaders ? JSON.parse(apiHeaders) : {};
        const body = apiBody ? JSON.parse(apiBody) : undefined;
        await loadFromApi(apiEndpoint, apiMethod, headers, body);
      }
    } catch (err) {
      console.error('加载数据失败:', err);
    }
  }, [state, sourceType, file, url, apiEndpoint, apiMethod, apiHeaders, apiBody, loadFromFile, loadFromUrl, loadFromApi]);

  // 处理文件选择
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setSourceType('file');
      reset(); // 重置状态，包括错误状态
      
      // 如果启用了自动加载
      if (autoLoad) {
        startLoading();
      }
    }
  }, [autoLoad, startLoading, reset]);

  // 处理URL提交
  const handleUrlSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    reset(); // 重置状态，包括错误状态
    setSourceType('url');
    
    if (autoLoad && url) {
      startLoading();
    }
  }, [autoLoad, url, startLoading, reset]);

  // 处理手动开始加载
  const handleStartLoad = useCallback(() => {
    startLoading();
  }, [startLoading]);

  // 重置状态
  const handleReset = useCallback(() => {
    reset();
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [reset]);

  // 初始参数处理
  useEffect(() => {
    if (initialParams) {
      if (initialParams.source === 'url' && initialParams.url) {
        setSourceType('url');
        setUrl(initialParams.url);
        if (autoLoad) {
          setTimeout(() => startLoading(), 0);
        }
      } else if (initialParams.source === 'file' && initialParams.file) {
        setSourceType('file');
        setFile(initialParams.file);
        if (autoLoad) {
          setTimeout(() => startLoading(), 0);
        }
      } else if (initialParams.source === 'api' && initialParams.apiEndpoint) {
        setSourceType('api');
        setApiEndpoint(initialParams.apiEndpoint);
        if (initialParams.apiMethod) {
          setApiMethod(initialParams.apiMethod);
        }
        if (initialParams.apiHeaders) {
          setApiHeaders(JSON.stringify(initialParams.apiHeaders));
        }
        if (initialParams.apiBody) {
          setApiBody(JSON.stringify(initialParams.apiBody));
        }
        if (autoLoad) {
          setTimeout(() => startLoading(), 0);
        }
      }
    }
  }, [initialParams, autoLoad, startLoading]);

  // 渲染加载状态
  const renderLoadingState = () => {
    if (state === 'loading' || state === 'processing') {
      // 根据数据源类型显示不同的加载消息
      const loadingMessages: Record<string, string> = {
        file: '正在解析文件...',
        url: '正在从远程URL获取数据...',
        api: '正在从API获取数据...'
      };
      
      const currentMessage = loadingMessages[sourceType] || '正在加载数据...';
      
      // 根据进度显示不同的状态
      const progressClass = 
        progress < 30 ? 'bg-blue-300' :
        progress < 70 ? 'bg-blue-500' : 'bg-blue-700';
      
      return (
        <div className="loading-state p-6 rounded-lg shadow-lg bg-white">
          <div className="flex flex-col items-center justify-center">
            <div className="loading-spinner animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
            <h3 className="text-lg font-medium text-gray-800 mb-2">{currentMessage}</h3>
            
            {/* 进度条容器 */}
            <div className="w-full max-w-md h-3 bg-gray-200 rounded-full overflow-hidden mb-2">
              <div 
                className={`h-full ${progressClass} transition-all duration-300 ease-in-out`}
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            
            {/* 进度文本 */}
            <div className="flex justify-between w-full max-w-md text-sm text-gray-600 mb-4">
              <span>{progress}%</span>
              <span>{progress === 100 ? '即将完成' : '处理中...'}</span>
            </div>
            
            {/* 取消按钮 */}
            <button 
              onClick={handleReset} 
              className="px-4 py-2 text-sm text-blue-600 hover:text-blue-800 transition-colors"
            >
              取消
            </button>
          </div>
        </div>
      );
    }
    
    return null;
  };
  
  // 渲染错误状态
  const renderError = () => {
    if (error) {
      // 根据错误类型提供更具体的提示
      const getErrorInfo = (error: Error) => {
        if (error.message.includes('无效的URL') || error.message.includes('无效的API端点')) {
          return {
            icon: '🔗',
            title: 'URL格式错误',
            description: error.message,
            suggestion: '请检查URL或API端点格式是否正确'
          };
        }
        if (error.message.includes('HTTP错误') || error.message.includes('API请求失败')) {
          return {
            icon: '🌐',
            title: '网络请求错误',
            description: error.message,
            suggestion: '请检查网络连接或目标服务器状态'
          };
        }
        if (error.message.includes('解析') || error.message.includes('格式')) {
          return {
            icon: '📄',
            title: '数据格式错误',
            description: error.message,
            suggestion: '请确保提供的数据格式正确'
          };
        }
        return {
          icon: '❌',
          title: '加载失败',
          description: error.message,
          suggestion: '请稍后重试或检查数据源'
        };
      };
      
      const errorInfo = getErrorInfo(error);
      
      return (
        <div className="error-state p-6 rounded-lg shadow-lg bg-white">
          <div className="flex flex-col items-center text-center">
            <div className="text-4xl mb-4">{errorInfo.icon}</div>
            <h3 className="text-lg font-medium text-red-600 mb-2">{errorInfo.title}</h3>
            <p className="text-gray-700 mb-2">{errorInfo.description}</p>
            <p className="text-gray-500 text-sm mb-4">💡 {errorInfo.suggestion}</p>
            
            <div className="flex gap-3">
              <button 
                onClick={() => {
                  reset();
                  if (sourceType === 'file' && fileInputRef.current) {
                    fileInputRef.current.click();
                  }
                }} 
                className="px-5 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                重试
              </button>
              <button 
                onClick={handleReset} 
                className="px-5 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };
  
  // 渲染成功状态
  const renderSuccess = () => {
    if (state === 'success') {
      return (
        <div className="success-state p-6 rounded-lg shadow-lg bg-white">
          <div className="flex flex-col items-center text-center">
            <div className="text-4xl mb-4">✅</div>
            <h3 className="text-lg font-medium text-green-600 mb-2">数据加载成功！</h3>
            
            <div className="flex gap-3 mt-4">
              <button 
                onClick={handleReset} 
                className="px-5 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
              >
                加载新数据
              </button>
              <button 
                onClick={() => {
                  reset();
                  // 可以添加其他操作，如切换到其他数据源
                }} 
                className="px-5 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // 渲染文件上传区域
  const renderFileUpload = () => {
    return (
      <div className="file-upload-container mb-4">
        <label 
          htmlFor="file-input" 
          className={`file-upload-label border-2 ${file ? 'border-green-400' : 'border-dashed border-gray-300'} rounded-lg p-8 text-center cursor-pointer hover:bg-gray-50 transition-colors`}
        >
          {file ? (
            <div className="file-preview">
              <div className="flex items-center justify-center mb-4">
                <div className="text-4xl mr-3">📄</div>
                <div className="text-left">
                  <h4 className="font-medium text-gray-800 truncate max-w-xs">{file.name}</h4>
                  <p className="text-sm text-gray-500">
                    {formatBytes(file.size)} • {getFileExtension(file.name).toUpperCase()}
                  </p>
                </div>
              </div>
              
              {/* 文件进度指示器（如果正在处理） */}
              {state === 'loading' && sourceType === 'file' && (
                <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full" 
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              )}
              
              <div className="flex flex-col sm:flex-row gap-2 justify-center mt-4">
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                >
                  更换文件
                </button>
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setFile(null);
                    if (fileInputRef.current) {
                      fileInputRef.current.value = '';
                    }
                  }}
                  className="px-4 py-2 border border-red-300 text-red-600 rounded hover:bg-red-50 transition-colors"
                >
                  移除
                </button>
              </div>
            </div>
          ) : (
            <div className="upload-placeholder">
              <div className="upload-icon text-5xl mb-3">📁</div>
              <h3 className="text-lg font-medium text-gray-700 mb-1">拖拽文件到此处或点击上传</h3>
              <p className="text-sm text-gray-500 mb-4">最大文件大小: {formatBytes(maxFileSize)}</p>
              <p className="text-xs text-gray-400 mb-6">支持的格式: {enabledFormats.map(f => f.extension).join(', ')}</p>
              <button 
                className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                onClick={(e) => {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }}
              >
                选择文件
              </button>
            </div>
          )}
          <input 
            id="file-input" 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept={enabledFormats.map(f => `.${f.extension}`).join(',')}
            className="hidden"
          />
        </label>
        {isFileTooLarge && (
          <p className="mt-1 text-sm text-red-600">
            文件大小超过限制（最大 {formatBytes(maxFileSize)}）
          </p>
        )}
      </div>
    );
  };
  
  // 格式化字节数
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  // 获取文件扩展名
  const getFileExtension = (filename: string): string => {
    return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
  };

  // 渲染URL输入区域
  const renderUrlInput = () => {
    // 验证URL格式
    const validateUrl = (url: string) => {
      if (!url) return { isValid: true, error: '' };
      
      try {
        new URL(url);
        return { isValid: true, error: '' };
      } catch {
        return { 
          isValid: false, 
          error: '请输入有效的URL地址（以http://或https://开头）'
        };
      }
    };
    
    const urlValidation = validateUrl(url);
    
    return (
      <form onSubmit={handleUrlSubmit} className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          远程URL
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-400">🌐</span>
          </div>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/data.json"
            className={`w-full pl-10 pr-3 py-2 border rounded-l-md focus:outline-none focus:ring-2 transition-colors ${ 
              urlValidation.isValid ? 
                'border-gray-300 focus:border-blue-500 focus:ring-blue-500/20' : 
                'border-red-300 focus:border-red-500 focus:ring-red-500/20'
            }`}
          />
          <button
            type="submit"
            className="absolute right-0 top-0 px-4 py-2 bg-blue-500 text-white rounded-r-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            加载
          </button>
        </div>
        
        {/* 错误提示 */}
        {!urlValidation.isValid && (
          <p className="mt-1 text-sm text-red-600 flex items-center">
            <span className="mr-1">⚠️</span>
            {urlValidation.error}
          </p>
        )}
        
        {/* 示例提示 */}
        <p className="mt-2 text-xs text-gray-400">
          示例: https://api.example.com/data.json 或 https://example.com/data.csv
        </p>
      </form>
    );
  };


  // 处理API提交
  const handleApiSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    setSourceType('api');
    
    try {
      const headers = apiHeaders ? JSON.parse(apiHeaders) : {};
      const body = apiBody ? JSON.parse(apiBody) : undefined;
      
      if (autoLoad && apiEndpoint) {
        loadFromApi(apiEndpoint, apiMethod, headers, body);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('请求参数格式错误');
      fail(error);
      onLoadError?.(error);
    }
  }, [autoLoad, apiEndpoint, apiMethod, apiHeaders, apiBody, loadFromApi, onLoadError, fail]);

  // 渲染API输入区域
  const renderApiInput = () => {
    return (
      <form onSubmit={handleApiSubmit} className="space-y-4 mb-4">
        {/* API端点 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            API端点
          </label>
          <input
            type="text"
            value={apiEndpoint}
            onChange={(e) => setApiEndpoint(e.target.value)}
            placeholder="https://api.example.com/data"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          />
        </div>
        
        {/* 请求方法 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            请求方法
          </label>
          <select
            value={apiMethod}
            onChange={(e) => setApiMethod(e.target.value as 'GET' | 'POST' | 'PUT' | 'DELETE')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="DELETE">DELETE</option>
          </select>
        </div>
        
        {/* 请求头 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            请求头 (JSON格式)
          </label>
          <textarea
            value={apiHeaders}
            onChange={(e) => setApiHeaders(e.target.value)}
            placeholder="输入JSON格式的请求头"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 font-mono text-sm"
          />
        </div>
        
        {/* 请求体 (仅POST/PUT) */}
        {(apiMethod === 'POST' || apiMethod === 'PUT') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              请求体 (JSON格式)
            </label>
            <textarea
            value={apiBody}
            onChange={(e) => setApiBody(e.target.value)}
            placeholder="输入JSON格式的请求体"
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 font-mono text-sm"
          />
          </div>
        )}
        
        {/* 提交按钮 */}
        <button
          type="submit"
          className="w-full px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          发送请求
        </button>
      </form>
    );
  };

  return (
    <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-gray-900">数据加载器</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setSourceType('file')}
            className={`px-3 py-1 text-sm rounded ${sourceType === 'file' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            文件上传
          </button>
          <button
            onClick={() => setSourceType('url')}
            className={`px-3 py-1 text-sm rounded ${sourceType === 'url' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            远程URL
          </button>
          <button
            onClick={() => setSourceType('api')}
            className={`px-3 py-1 text-sm rounded ${sourceType === 'api' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            API端点
          </button>
        </div>
      </div>

      {renderError()}
      {renderSuccess()}
      {renderLoadingState()}

      {state === 'idle' && (
        <>
          {sourceType === 'file' ? renderFileUpload() : sourceType === 'api' ? renderApiInput() : renderUrlInput()}
          
          {!autoLoad && ((sourceType === 'file' && file) || 
                        (sourceType === 'url' && url) || 
                        (sourceType === 'api' && apiEndpoint)) && (
            <button
              onClick={handleStartLoad}
              className="w-full mt-4 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              开始加载
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default DataLoader;
