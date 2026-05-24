/**
 * @file 批处理进度组件
 * @description 显示整体批处理进度和统计信息
 * @module components/batch-progress
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 */
import React from 'react';
import { ChevronRight, FileText, X, HelpCircle } from './ui/icons';

interface BatchStatistics {
  total: number;
  completed: number;
  error: number;
  processing: number;
  pending: number;
  totalSize: number;
  processedSize: number;
  isProcessing: boolean;
}

interface BatchProcessingProgressProps {
  statistics: BatchStatistics;
  onCancelAll: () => void;
  onDownloadAll: () => void;
  onClearCompleted: () => void;
  formatFileSize: (bytes: number) => string;
}

/**
 * 批处理进度组件
 * @description 显示整体处理进度和统计信息
 */
const BatchProcessingProgress: React.FC<BatchProcessingProgressProps> = ({
  statistics,
  onCancelAll,
  onDownloadAll,
  onClearCompleted,
  formatFileSize,
}) => {
  const { total, completed, error, processing, pending, totalSize, processedSize, isProcessing } = statistics;

  /**
   * 计算完成百分比
   */
  const calculateProgressPercentage = () => {
    if (total === 0) return 0;
    // 已完成 + 处理中(按50%计算)
    const effectiveCompleted = completed + processing * 0.5;
    return Math.min(Math.round((effectiveCompleted / total) * 100), 100);
  };

  /**
   * 计算文件大小进度
   */
  const calculateSizeProgress = () => {
    if (totalSize === 0) return 0;
    return Math.min(Math.round((processedSize / totalSize) * 100), 100);
  };

  const progressPercentage = calculateProgressPercentage();
  const sizeProgressPercentage = calculateSizeProgress();

  /**
   * 处理取消所有操作
   */
  const handleCancelAll = () => {
    if (window.confirm('确定要取消所有处理中的文件吗？')) {
      onCancelAll();
    }
  };

  /**
   * 处理下载所有文件
   */
  const handleDownloadAll = () => {
    if (completed === 0) {
      alert('没有已完成的文件可下载');
      return;
    }
    onDownloadAll();
  };

  /**
   * 处理清空已完成文件
   */
  const handleClearCompleted = () => {
    if (window.confirm('确定要清空所有已完成的文件吗？')) {
      onClearCompleted();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* 标题栏 */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-800">批处理进度</h3>
        
        {/* 操作按钮组 */}
        <div className="flex space-x-2">
          {completed > 0 && (
            <button
              onClick={handleDownloadAll}
              className="px-3 py-1.5 text-sm text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors flex items-center"
            >
              <FileText className="h-3.5 w-3.5 mr-1" />
              下载全部
            </button>
          )}
          {completed > 0 && (
            <button
              onClick={handleClearCompleted}
              className="px-3 py-1.5 text-sm text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors flex items-center"
            >
              <X className="h-3.5 w-3.5 mr-1" />
              清空已完成
            </button>
          )}
          {isProcessing && (
            <button
              onClick={handleCancelAll}
              className="px-3 py-1.5 text-sm text-red-600 bg-red-50 rounded-md hover:bg-red-100 transition-colors flex items-center"
            >
              <X className="h-3.5 w-3.5 mr-1" />
              取消全部
            </button>
          )}
        </div>
      </div>

      {/* 进度信息 */}
      <div className="p-4">
        {/* 文件数量进度条 */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">处理进度</span>
            <span className="font-medium">{completed}/{total} 文件 ({progressPercentage}%)</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ease-out ${progressPercentage === 100 ? 'bg-green-600' : 'bg-blue-600'}`}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {/* 文件大小进度条 */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">大小进度</span>
            <span className="font-medium">
              {formatFileSize(processedSize)} / {formatFileSize(totalSize)} ({sizeProgressPercentage}%)
            </span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ease-out ${sizeProgressPercentage === 100 ? 'bg-green-600' : 'bg-blue-600'}`}
              style={{ width: `${sizeProgressPercentage}%` }}
            />
          </div>
        </div>

        {/* 统计信息网格 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">总文件数</div>
              <span className="font-semibold text-gray-800">{total}</span>
            </div>
          </div>

          <div className="p-3 bg-green-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">已完成</div>
              <span className="font-semibold text-green-700 flex items-center">
                <FileText className="h-4 w-4 mr-1" />
                {completed}
              </span>
            </div>
          </div>

          <div className="p-3 bg-red-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">错误</div>
              <span className="font-semibold text-red-700 flex items-center">
                <HelpCircle className="h-4 w-4 mr-1" />
                {error}
              </span>
            </div>
          </div>

          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">等待/处理中</div>
              <span className="font-semibold text-blue-700 flex items-center">
                <HelpCircle className="h-4 w-4 mr-1" />
                {pending + processing}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 提示信息 */}
      {isProcessing && (
        <div className="px-4 py-3 bg-blue-50 border-t border-blue-100 flex items-center text-sm text-blue-700">
          <ChevronRight className="h-4 w-4 mr-2 animate-pulse" />
          批处理正在进行中，请不要关闭浏览器窗口
        </div>
      )}

      {/* 完成提示 */}
      {total > 0 && !isProcessing && progressPercentage === 100 && (
        <div className="px-4 py-3 bg-green-50 border-t border-green-100 flex items-center text-sm text-green-700">
          <FileText className="h-4 w-4 mr-2" />
          所有文件处理完成！
        </div>
      )}
    </div>
  );
};

export default BatchProcessingProgress;
