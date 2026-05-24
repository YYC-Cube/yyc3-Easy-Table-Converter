/**
 * @file 批处理文件项组件
 * @description 显示单个文件的状态和操作选项
 * @module components/batch-file-item
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 */
import React from 'react';
// 创建简单的图标占位符组件
const IconPlaceholder: React.FC<{name: string; className?: string}> = ({ name, className }) => (
  <div className={className}>
    {name.charAt(0).toUpperCase()}
  </div>
);

// 重命名为更友好的名称
const FileText = (props: { className?: string }) => <IconPlaceholder name="File" {...props} />;
const Upload = (props: { className?: string }) => <IconPlaceholder name="U" {...props} />;
const FileCheck = (props: { className?: string }) => <IconPlaceholder name="✓" {...props} />;
const AlertTriangle = (props: { className?: string }) => <IconPlaceholder name="!" {...props} />;
const RefreshCw = (props: { className?: string }) => <IconPlaceholder name="↻" {...props} />;
const Download = (props: { className?: string }) => <IconPlaceholder name="↓" {...props} />;
const X = (props: { className?: string }) => <IconPlaceholder name="✕" {...props} />;
// 移除未使用的Trash2组件

interface FileItem {
  id: string;
  name: string;
  size: number;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
  error?: string;
  downloadUrl?: string;
}

interface BatchFileItemProps {
  file: FileItem;
  onRemove: (fileId: string) => void;
  onRetry: (fileId: string) => void;
  onDownload: (fileId: string) => void;
  formatFileSize: (bytes: number) => string;
}

/**
 * 批处理文件项组件
 * @description 显示单个文件的详细信息和操作按钮
 */
const BatchFileItem: React.FC<BatchFileItemProps> = ({
  file,
  onRemove,
  onRetry,
  onDownload,
  formatFileSize,
}) => {
  /**
   * 获取状态图标
   */
  const getStatusIcon = () => {
    switch (file.status) {
      case 'pending':
        return <FileText className="text-gray-400" />;
      case 'uploading':
        return <Upload className="text-blue-500 animate-pulse" />;
      case 'processing':
        return <RefreshCw className="text-yellow-500 animate-spin" />;
      case 'completed':
        return <FileCheck className="text-green-500" />;
      case 'error':
        return <AlertTriangle className="text-red-500" />;
      default:
        return <FileText className="text-gray-400" />;
    }
  };

  /**
   * 获取状态文本
   */
  const getStatusText = () => {
    switch (file.status) {
      case 'pending':
        return '等待处理';
      case 'uploading':
        return `上传中 ${file.progress}%`;
      case 'processing':
        return '处理中';
      case 'completed':
        return '已完成';
      case 'error':
        return `错误: ${file.error || '未知错误'}`;
      default:
        return '未知状态';
    }
  };

  /**
   * 获取状态类名
   */
  const getStatusClassName = () => {
    switch (file.status) {
      case 'pending':
        return 'text-gray-500';
      case 'uploading':
        return 'text-blue-500';
      case 'processing':
        return 'text-yellow-500';
      case 'completed':
        return 'text-green-500';
      case 'error':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  /**
   * 处理删除确认
   */
  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`确定要删除文件「${file.name}」吗？`)) {
      onRemove(file.id);
    }
  };

  /**
   * 处理重试
   */
  const handleRetry = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRetry(file.id);
  };

  /**
   * 处理下载
   */
  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDownload(file.id);
  };

  /**
   * 是否显示进度条
   */
  const showProgress = file.status === 'uploading';

  return (
    <div className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-2 sm:space-y-0">
        {/* 文件名 */}
        <div className="w-full sm:w-2/5 flex items-center">
          <FileText className="mr-2 text-gray-500 flex-shrink-0" />
          <div className="truncate">
            <div className="text-sm font-medium text-gray-800 truncate" title={file.name}>
              {file.name}
            </div>
            {file.error && (
              <div className="text-xs text-red-500 flex items-center mt-1">
                <AlertTriangle className="mr-1" />
                {file.error}
              </div>
            )}
          </div>
        </div>

        {/* 文件大小 */}
        <div className="w-full sm:w-1/5 text-sm text-gray-500">
          {formatFileSize(file.size)}
        </div>

        {/* 状态 */}
        <div className={`w-full sm:w-1/5 flex items-center ${getStatusClassName()}`}>
          {getStatusIcon()}
          <span className="ml-2 text-sm font-medium">{getStatusText()}</span>
        </div>

        {/* 操作按钮 */}
        <div className="w-full sm:w-1/5 flex justify-end space-x-1">
          {file.status === 'completed' && file.downloadUrl && (
            <button
              onClick={handleDownload}
              className="p-1.5 rounded-md text-blue-600 hover:bg-blue-100 transition-colors"
              title="下载文件"
            >
              <Download />
            </button>
          )}
          {file.status === 'error' && (
            <button
              onClick={handleRetry}
              className="p-1.5 rounded-md text-yellow-600 hover:bg-yellow-100 transition-colors"
              title="重试"
            >
              <RefreshCw />
            </button>
          )}
          {(file.status === 'pending' || file.status === 'error') && (
            <button
              onClick={handleRemove}
              className="p-1.5 rounded-md text-red-600 hover:bg-red-100 transition-colors"
              title="删除文件"
            >
              <X />
            </button>
          )}
        </div>
      </div>

      {/* 进度条 */}
      {showProgress && (
        <div className="mt-2 h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-600 transition-all duration-300 ease-out"
            style={{ width: `${file.progress}%` }}
          />
        </div>
      )}
    </div>
  );
};

export default BatchFileItem;
