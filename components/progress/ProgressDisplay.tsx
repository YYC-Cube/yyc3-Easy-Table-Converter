/**
 * @file 进度显示组件
 * @description 用于文件处理任务的进度展示，支持暂停/恢复操作
 * @module components/progress/ProgressDisplay
 * @author YYC
 * @version 1.0.0
 * @created 2024-07-12
 */

import React, { useState, useEffect } from 'react';
import {
  BatchTaskExtended,
  ProgressUpdateEvent
} from '@/lib/types/progress.types';

interface ProgressDisplayProps {
  tasks: BatchTaskExtended[];
  onPauseTask: (taskId: string) => Promise<void>;
  onResumeTask: (taskId: string) => Promise<void>;
  onCancelTask: (taskId: string) => void;
  onDownload?: (taskId: string) => void;
}

export const ProgressDisplay: React.FC<ProgressDisplayProps> = ({
  tasks,
  onPauseTask,
  onResumeTask,
  onCancelTask,
  onDownload
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // 计算总体进度
  const calculateTotalProgress = () => {
    if (tasks.length === 0) return 0;
    
    const totalWeightedProgress = tasks.reduce(
      (sum, task) => sum + (task.progress || 0),
      0
    );
    
    return totalWeightedProgress / tasks.length;
  };

  const handlePauseTask = async (taskId: string) => {
    try {
      await onPauseTask(taskId);
    } catch (error) {
      console.error('暂停任务失败:', error);
      // 这里可以添加用户友好的错误提示
    }
  };

  const handleResumeTask = async (taskId: string) => {
    try {
      await onResumeTask(taskId);
    } catch (error) {
      console.error('恢复任务失败:', error);
      // 这里可以添加用户友好的错误提示
    }
  };

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 格式化时间
  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  // 计算预计剩余时间
  const calculateEstimatedTime = (task: BatchTaskExtended): string | null => {
    if (!task.startTime || task.progress === 0 || task.status !== 'processing') {
      return null;
    }
    
    const elapsedTime = (Date.now() - task.startTime) / 1000; // 秒
    const estimatedTotalTime = (elapsedTime / task.progress) * 100;
    const remainingTime = estimatedTotalTime - elapsedTime;
    
    if (remainingTime < 0) return null;
    
    if (remainingTime < 60) {
      return Math.ceil(remainingTime) + ' 秒';
    } else if (remainingTime < 3600) {
      return Math.ceil(remainingTime / 60) + ' 分钟';
    } else {
      return Math.ceil(remainingTime / 3600) + ' 小时';
    }
  };

  // 计算上传速度
  const calculateUploadSpeed = (task: BatchTaskExtended): string | null => {
    if (!task.startTime || task.uploadedBytes === 0 || task.status !== 'processing') {
      return null;
    }
    
    const elapsedTime = (Date.now() - task.startTime) / 1000; // 秒
    const bytesPerSecond = task.uploadedBytes / elapsedTime;
    
    if (bytesPerSecond < 1024) {
      return bytesPerSecond.toFixed(2) + ' B/s';
    } else if (bytesPerSecond < 1024 * 1024) {
      return (bytesPerSecond / 1024).toFixed(2) + ' KB/s';
    } else {
      return (bytesPerSecond / (1024 * 1024)).toFixed(2) + ' MB/s';
    }
  };

  // 获取状态标签样式
  const getStatusBadgeClass = (status: string): string => {
    switch (status) {
      case 'processing':
        return 'bg-blue-500 text-white';
      case 'pending':
        return 'bg-gray-400 text-white';
      case 'completed':
        return 'bg-green-500 text-white';
      case 'paused':
        return 'bg-amber-500 text-white';
      case 'error':
        return 'bg-red-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  // 获取状态文本
  const getStatusText = (status: string): string => {
    switch (status) {
      case 'processing':
        return '处理中';
      case 'pending':
        return '等待中';
      case 'completed':
        return '已完成';
      case 'paused':
        return '已暂停';
      case 'error':
        return '处理失败';
      default:
        return status;
    }
  };

  const activeTasksCount = tasks.filter(t => 
    t.status === 'processing' || t.status === 'paused' || t.status === 'pending'
  ).length;

  const completedTasksCount = tasks.filter(t => t.status === 'completed').length;
  const errorTasksCount = tasks.filter(t => t.status === 'error').length;

  if (tasks.length === 0) {
    return null;
  }

  return (
    
    <div className="mt-6 bg-white rounded-lg shadow-md p-4">
      {/* 总进度标题栏 */}
      <div 
        className="flex justify-between items-center cursor-pointer mb-4"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <h3 className="text-lg font-medium text-gray-800">
          文件处理进度
          {activeTasksCount > 0 && (
            <span className="ml-2 text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
              进行中 {activeTasksCount}
            </span>
          )}
          {completedTasksCount > 0 && (
            <span className="ml-2 text-sm bg-green-100 text-green-800 px-2 py-1 rounded-full">
              已完成 {completedTasksCount}
            </span>
          )}
          {errorTasksCount > 0 && (
            <span className="ml-2 text-sm bg-red-100 text-red-800 px-2 py-1 rounded-full">
              错误 {errorTasksCount}
            </span>
          )}
        </h3>
        <div className="text-gray-500 flex items-center">
          <span className="mr-2 text-sm">
            {Math.round(calculateTotalProgress())}%
          </span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-5 w-5 transition-transform duration-200`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            style={{ transform: isCollapsed ? 'rotate(180deg)' : 'rotate(0)' }}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </div>

      {/* 总体进度条 */}
      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
        <div
          className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${calculateTotalProgress()}%` }}
        />
      </div>

      {/* 任务列表 */}
      {!isCollapsed && (
        <div className="space-y-4">
          {tasks.map((task) => (
            <div 
              key={task.id} 
              className="border rounded-lg p-3 hover:bg-gray-50 transition-colors"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="flex items-center">
                    <span className="font-medium text-gray-800 truncate max-w-[500px]">
                      {task.file.name}
                    </span>
                    <span 
                      className={`ml-2 text-xs px-2 py-0.5 rounded-full ${getStatusBadgeClass(task.status)}`}
                    >
                      {getStatusText(task.status)}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {formatFileSize(task.uploadedBytes)} / {formatFileSize(task.file.size)} •
                    {task.status === 'processing' && calculateUploadSpeed(task) && (
                      <span> 速度: {calculateUploadSpeed(task)}</span>
                    )}
                    {task.status === 'processing' && calculateEstimatedTime(task) && (
                      <span> 预计剩余: {calculateEstimatedTime(task)}</span>
                    )}
                    {task.status === 'error' && task.error && (
                      <span className="text-red-500 ml-1">({task.error})</span>
                    )}
                  </div>
                </div>
                <div className="flex space-x-2">
                  {task.status === 'processing' && (
                    <button
                      onClick={() => handlePauseTask(task.id)}
                      className="p-1.5 rounded hover:bg-gray-200 text-gray-700"
                      title="暂停"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  )}
                  {task.status === 'paused' && (
                    <button
                      onClick={() => handleResumeTask(task.id)}
                      className="p-1.5 rounded hover:bg-gray-200 text-gray-700"
                      title="继续"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                      </svg>
                    </button>
                  )}
                  {task.status === 'completed' && onDownload && (
                    <button
                      onClick={() => onDownload(task.id)}
                      className="p-1.5 rounded hover:bg-gray-200 text-gray-700"
                      title="下载结果"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
                      </svg>
                    </button>
                  )}
                  <button
                    onClick={() => onCancelTask(task.id)}
                    className="p-1.5 rounded hover:bg-gray-200 text-gray-700"
                    title="删除"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="relative w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`absolute top-0 left-0 h-full rounded-full transition-all duration-300 ease-out ${getStatusBadgeClass(task.status)}`}
                  style={{ width: `${task.progress}%` }}
                />
                {task.status === 'paused' && task.uploadedBytes > 0 && (
                  <div className="absolute right-0 top-0 -translate-y-6 text-xs text-amber-600">
                    已暂停于 {formatFileSize(task.uploadedBytes)}
                  </div>
                )}
              </div>
              
              {/* 详细进度信息 */}
              {task.status === 'processing' && task.totalChunks > 1 && (
                <div className="text-xs text-gray-500 mt-1 flex justify-between">
                  <span>块 {task.completedChunks} / {task.totalChunks}</span>
                  <span>{formatTime(task.startTime)}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
