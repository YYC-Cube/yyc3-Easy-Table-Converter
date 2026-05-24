/**
 * @file 进度监控钩子
 * @description 整合进度监控和断点续传功能的React钩子
 * @module hooks/useProgressMonitor
 * @author YYC
 * @version 1.0.0
 * @created 2024-07-12
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { BatchProcessorWithResume } from '@/lib/utils/batchProcessorWithResume';
import { BatchTaskExtended, ProgressUpdateEvent, TaskProcessor, ResumeConfig } from '@/lib/types/progress.types';

interface UseProgressMonitorOptions<T> {
  processor: TaskProcessor<T>;
  resumeConfig?: Partial<ResumeConfig>;
  concurrency?: number;
  autoProcess?: boolean;
  onTaskComplete?: (taskId: string, result: T) => void;
  onTaskError?: (taskId: string, error: string) => void;
}

interface UseProgressMonitorReturn<T> {
  // 状态
  tasks: BatchTaskExtended[];
  isProcessing: boolean;
  totalProgress: number;
  
  // 任务管理
  addFile: (file: File) => string;
  pauseTask: (taskId: string) => Promise<void>;
  resumeTask: (taskId: string) => Promise<void>;
  cancelTask: (taskId: string) => void;
  clearCompletedTasks: () => void;
  clearAllTasks: () => Promise<void>;
  
  // 处理控制
  processTasks: () => Promise<void>;
  pauseAll: () => Promise<void>;
  resumeAll: () => Promise<void>;
  
  // 任务查询
  getTaskById: (taskId: string) => BatchTaskExtended | undefined;
  getTaskResult: (taskId: string) => T | undefined;
}

export function useProgressMonitor<T>({ 
  processor, 
  resumeConfig = {},
  concurrency = 3,
  autoProcess = true,
  onTaskComplete,
  onTaskError
}: UseProgressMonitorOptions<T>): UseProgressMonitorReturn<T> {
  const [tasks, setTasks] = useState<BatchTaskExtended[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const processorRef = useRef<BatchProcessorWithResume>();
  const isProcessingRef = useRef(false);

  // 初始化处理器
  useEffect(() => {
    processorRef.current = new BatchProcessorWithResume(resumeConfig);
    
    // 注册进度更新回调
    processorRef.current.onProgressWithDetails((event: ProgressUpdateEvent) => {
      if (event.taskId) {
        // 更新单个任务的进度
        updateTaskProgress(event.taskId, event);
      }
    });
    
    // 清理函数
    return () => {
      processorRef.current?.destroy();
    };
  }, []);

  // 更新任务进度
  const updateTaskProgress = useCallback((taskId: string, event: ProgressUpdateEvent) => {
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === taskId
          ? {
              ...task,
              progress: event.progress ?? task.progress,
              uploadedBytes: event.uploadedBytes ?? task.uploadedBytes,
              status: event.status ?? task.status,
              completedChunks: event.chunkIndex !== undefined 
                ? event.chunkIndex + 1 
                : task.completedChunks
            }
          : task
      )
    );
  }, []);

  // 添加文件
  const addFile = useCallback((file: File): string => {
    const taskId = processorRef.current?.addTask(file) || '';
    
    // 更新任务列表
    if (taskId) {
      const newTask = processorRef.current?.getTasks().find(t => t.id === taskId);
      if (newTask) {
        setTasks(prevTasks => [...prevTasks, newTask]);
        
        // 如果开启自动处理且当前没有处理中的任务，则启动处理
        if (autoProcess && !isProcessingRef.current) {
          processTasks();
        }
      }
    }
    
    return taskId;
  }, [autoProcess]);

  // 处理任务
  const processTasks = useCallback(async () => {
    if (!processorRef.current || isProcessingRef.current) return;
    
    try {
      isProcessingRef.current = true;
      setIsProcessing(true);
      
      await processorRef.current.processBatchWithResume(processor, concurrency);
      
      // 更新任务状态
      const updatedTasks = processorRef.current.getTasks();
      setTasks(updatedTasks);
      
      // 检查是否有新完成的任务并触发回调
      updatedTasks.forEach(task => {
        if (task.status === 'completed' && task.result && onTaskComplete) {
          onTaskComplete(task.id, task.result as T);
        }
        if (task.status === 'error' && task.error && onTaskError) {
          onTaskError(task.id, task.error);
        }
      });
    } catch (error) {
      console.error('批量处理任务失败:', error);
    } finally {
      isProcessingRef.current = false;
      setIsProcessing(false);
      
      // 更新任务列表
      if (processorRef.current) {
        setTasks(processorRef.current.getTasks());
      }
    }
  }, [processor, concurrency, onTaskComplete, onTaskError]);

  // 暂停任务
  const pauseTask = useCallback(async (taskId: string): Promise<void> => {
    if (!processorRef.current) return;
    
    try {
      await processorRef.current.pauseTask(taskId);
      const updatedTasks = processorRef.current.getTasks();
      setTasks(updatedTasks);
    } catch (error) {
      console.error(`暂停任务 ${taskId} 失败:`, error);
      throw error;
    }
  }, []);

  // 恢复任务
  const resumeTask = useCallback(async (taskId: string): Promise<void> => {
    if (!processorRef.current) return;
    
    try {
      await processorRef.current.resumeTask(taskId);
      const updatedTasks = processorRef.current.getTasks();
      setTasks(updatedTasks);
      
      // 如果任务恢复后有处理中的任务且没有在处理批次，则启动处理
      if (!isProcessingRef.current) {
        processTasks();
      }
    } catch (error) {
      console.error(`恢复任务 ${taskId} 失败:`, error);
      throw error;
    }
  }, [processTasks]);

  // 取消任务
  const cancelTask = useCallback((taskId: string) => {
    // 这里需要添加取消任务的逻辑
    // 由于BatchProcessorWithResume中没有直接的取消方法，我们可以通过过滤状态来实现
    setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
  }, []);

  // 暂停所有任务
  const pauseAll = useCallback(async (): Promise<void> => {
    if (!processorRef.current) return;
    
    const activeTasks = tasks.filter(task => task.status === 'processing');
    await Promise.all(activeTasks.map(task => processorRef.current?.pauseTask(task.id)));
    
    // 更新任务列表
    if (processorRef.current) {
      setTasks(processorRef.current.getTasks());
    }
  }, [tasks]);

  // 恢复所有任务
  const resumeAll = useCallback(async (): Promise<void> => {
    if (!processorRef.current) return;
    
    const pausedTasks = tasks.filter(task => task.status === 'paused');
    await Promise.all(pausedTasks.map(task => processorRef.current?.resumeTask(task.id)));
    
    // 更新任务列表
    if (processorRef.current) {
      setTasks(processorRef.current.getTasks());
    }
    
    // 启动处理
    if (!isProcessingRef.current) {
      processTasks();
    }
  }, [tasks, processTasks]);

  // 清除已完成的任务
  const clearCompletedTasks = useCallback(() => {
    setTasks(prevTasks => prevTasks.filter(
      task => task.status !== 'completed' && task.status !== 'error'
    ));
  }, []);

  // 清除所有任务
  const clearAllTasks = useCallback(async (): Promise<void> => {
    if (!processorRef.current) return;
    
    await processorRef.current.clearAll();
    setTasks([]);
  }, []);

  // 获取指定ID的任务
  const getTaskById = useCallback((taskId: string): BatchTaskExtended | undefined => {
    return tasks.find(task => task.id === taskId);
  }, [tasks]);

  // 获取任务结果
  const getTaskResult = useCallback((taskId: string): T | undefined => {
    const task = tasks.find(task => task.id === taskId);
    return task?.status === 'completed' ? (task.result as T) : undefined;
  }, [tasks]);

  // 计算总进度
  const totalProgress = tasks.length > 0
    ? tasks.reduce((sum, task) => sum + (task.progress || 0), 0) / tasks.length
    : 0;

  return {
    tasks,
    isProcessing,
    totalProgress,
    addFile,
    pauseTask,
    resumeTask,
    cancelTask,
    clearCompletedTasks,
    clearAllTasks,
    processTasks,
    pauseAll,
    resumeAll,
    getTaskById,
    getTaskResult
  };
}
