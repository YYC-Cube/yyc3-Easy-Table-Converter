/**
 * @file 批量处理 Hook
 * @description 集成断点续传功能的批量文件处理钩子
 * @module hooks/useBatchProcessor
 * @author YYC
 * @version 1.0.0
 * @created 2024-07-12
 */

"use client"

import { useState, useCallback } from "react"
import { BatchProcessor, type BatchTask } from "@/lib/utils/batchProcessor"
import { BatchProcessorWithResume } from "@/lib/utils/batchProcessorWithResume"
import { type ResumeConfig } from "@/lib/types/progress.types"

interface UseBatchProcessorOptions {
  /** 是否启用断点续传功能 */
  enableResume?: boolean;
  /** 断点续传配置 */
  resumeConfig?: Partial<ResumeConfig>;
}

export const useBatchProcessor = ({ enableResume = false, resumeConfig = {} }: UseBatchProcessorOptions = {}) => {
  const [processor] = useState(() => 
    enableResume 
      ? new BatchProcessorWithResume(resumeConfig)
      : new BatchProcessor()
  );
  const [tasks, setTasks] = useState<BatchTask[]>([])

  useState(() => {
    if ('onProgressWithDetails' in processor) {
      // 使用断点续传版本的进度回调
      processor.onProgressWithDetails((event) => {
        // 更新任务列表
        setTasks(processor.getTasks());
      });
    } else {
      // 使用原始版本的进度回调
      processor.onProgress((updatedTasks) => {
        setTasks([...updatedTasks]);
      });
    }
  })

  const addFiles = useCallback(
    (files: File[]) => {
      const ids = processor.addTasks(files)
      setTasks(processor.getTasks())
      return ids
    },
    [processor],
  )

  const removeTask = useCallback(
    (id: string) => {
      processor.removeTask(id)
      setTasks(processor.getTasks())
    },
    [processor],
  )

  const clearCompleted = useCallback(() => {
    processor.clearCompleted()
    setTasks(processor.getTasks())
  }, [processor])

  const clearAll = useCallback(() => {
    processor.clearAll()
    setTasks(processor.getTasks())
  }, [processor])

  const processBatch = useCallback(
    async <T,>(processorFn: (file: File, onProgress?: (progress: number, chunkIndex?: number) => void, startFrom?: number) => Promise<T>, concurrency = 3) => {
      if ('processBatchWithResume' in processor) {
        // 使用断点续传版本的处理方法
        await processor.processBatchWithResume(processorFn, concurrency);
      } else {
        // 使用原始版本的处理方法
        await processor.processBatch(processorFn, concurrency);
      }
      setTasks(processor.getTasks())
    },
    [processor],
  );

  // 暂停任务（只有启用断点续传功能时可用）
  const pauseTask = useCallback(
    async (taskId: string): Promise<void> => {
      if ('pauseTask' in processor) {
        await processor.pauseTask(taskId);
        setTasks(processor.getTasks());
      } else {
        console.warn('暂停功能需要启用断点续传');
      }
    },
    [processor]
  );

  // 恢复任务（只有启用断点续传功能时可用）
  const resumeTask = useCallback(
    async (taskId: string): Promise<void> => {
      if ('resumeTask' in processor) {
        await processor.resumeTask(taskId);
        setTasks(processor.getTasks());
      } else {
        console.warn('恢复功能需要启用断点续传');
      }
    },
    [processor]
  );

  // 暂停所有任务（只有启用断点续传功能时可用）
  const pauseAll = useCallback(
    async (): Promise<void> => {
      if ('pauseTask' in processor) {
        await Promise.all(
          tasks
            .filter(task => task.status === 'processing')
            .map(task => processor.pauseTask(task.id))
        );
        setTasks(processor.getTasks());
      } else {
        console.warn('暂停功能需要启用断点续传');
      }
    },
    [processor, tasks]
  );

  // 恢复所有任务（只有启用断点续传功能时可用）
  const resumeAll = useCallback(
    async (): Promise<void> => {
      if ('resumeTask' in processor) {
        await Promise.all(
          tasks
            .filter(task => task.status === 'paused')
            .map(task => processor.resumeTask(task.id))
        );
        setTasks(processor.getTasks());
      } else {
        console.warn('恢复功能需要启用断点续传');
      }
    },
    [processor, tasks]
  );

  return {
    tasks,
    addFiles,
    removeTask,
    clearCompleted,
    clearAll,
    processBatch,
    pauseTask,
    resumeTask,
    pauseAll,
    resumeAll,
    isResumeEnabled: enableResume
  }
}
