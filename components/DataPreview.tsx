/**
 * @file 数据预览组件
 * @description 提供表格数据的预览和简单编辑功能
 * @module components/data-preview
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-16
 * @updated 2024-10-16
 */

'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ChevronDown, ChevronUp, Download, Search, Filter, Columns, Eye, Save, ArrowUpDown, Maximize2, X, AlertTriangle, Trash2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

/**
 * 表格预览数据接口
 */
export interface TableData {
  headers: string[];
  rows: any[][];
  totalRows: number;
  hasMore?: boolean;
}

/**
 * 文件信息接口
 */
export interface FileInfo {
  fileId: string;
  name: string;
  type: string;
  size?: number;
}

/**
 * 数据预览组件属性接口
 */
export interface DataPreviewProps {
  /** 表格数据 */
  data: TableData;
  /** 文件信息 */
  fileInfo: FileInfo;
  /** 加载状态 */
  loading?: boolean;
  /** 错误信息 */
  error?: string | null;
  /** 是否可编辑 */
  editable?: boolean;
  /** 最大显示行数 */
  maxDisplayRows?: number;
  /** 下载回调函数 */
  onDownload?: (fileId: string) => void;
  /** 加载更多回调函数 */
  onLoadMore?: () => void;
  /** 编辑完成回调函数 */
  onEditComplete?: (data: TableData) => void;
  /** 自定义CSS类名 */
  className?: string;
}

/**
 * 数据预览组件 - 提供表格数据的现代预览和编辑体验
 */
const DataPreview: React.FC<DataPreviewProps> = ({
  data,
  fileInfo,
  loading = false,
  error = null,
  editable = false,
  maxDisplayRows = 100,
  onDownload,
  onLoadMore,
  onEditComplete,
  className = ''
}) => {
  // 表格配置状态
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(
    data.headers.reduce((acc, header) => ({ ...acc, [header]: true }), {})
  );
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'ascending' | 'descending' | null }>(
    { key: '', direction: null }
  );
  const [expanded, setExpanded] = useState(false);
  const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [localData, setLocalData] = useState<TableData>(data);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  // 初始化本地数据
  useEffect(() => {
    setLocalData(data);
  }, [data]);

  // 过滤和排序数据
  const processedData = useMemo(() => {
    let result = [...localData.rows];

    // 应用搜索过滤
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(row =>
        row.some(cell => 
          cell?.toString().toLowerCase().includes(term)
        )
      );
    }

    // 应用排序
    if (sortConfig.key && sortConfig.direction) {
      const columnIndex = localData.headers.findIndex(h => h === sortConfig.key);
      if (columnIndex !== -1) {
        result.sort((a, b) => {
          if (a[columnIndex] < b[columnIndex]) {
            return sortConfig.direction === 'ascending' ? -1 : 1;
          }
          if (a[columnIndex] > b[columnIndex]) {
            return sortConfig.direction === 'ascending' ? 1 : -1;
          }
          return 0;
        });
      }
    }

    // 限制显示行数
    if (result.length > maxDisplayRows) {
      result = result.slice(0, maxDisplayRows);
    }

    return result;
  }, [localData, searchTerm, sortConfig, maxDisplayRows]);

  // 处理排序
  const handleSort = useCallback((header: string) => {
    setSortConfig(prevConfig => {
      if (prevConfig.key === header) {
        // 循环切换排序方向: ascending -> descending -> null
        if (prevConfig.direction === 'ascending') {
          return { key: header, direction: 'descending' };
        }
        if (prevConfig.direction === 'descending') {
          return { key: '', direction: null };
        }
        return { key: header, direction: 'ascending' };
      }
      return { key: header, direction: 'ascending' };
    });
  }, []);

  // 处理单元格编辑
  const handleEditStart = useCallback((row: number, col: number) => {
    if (!editable) return;
    
    const value = processedData[row][col] || '';
    setEditingCell({ row, col });
    setEditValue(value.toString());
  }, [editable, processedData]);

  const handleEditSave = useCallback(() => {
    if (!editingCell) return;

    const { row, col } = editingCell;
    const actualRowIndex = localData.rows.findIndex(r => 
      JSON.stringify(r) === JSON.stringify(processedData[row])
    );

    if (actualRowIndex !== -1) {
      const updatedData = { ...localData };
      const updatedRows = [...updatedData.rows];
      const updatedRow = [...updatedRows[actualRowIndex]];
      updatedRow[col] = editValue;
      updatedRows[actualRowIndex] = updatedRow;
      updatedData.rows = updatedRows;

      setLocalData(updatedData);
      onEditComplete?.(updatedData);
    }

    setEditingCell(null);
    setEditValue('');
  }, [editingCell, editValue, localData, processedData, onEditComplete]);

  const handleEditCancel = useCallback(() => {
    setEditingCell(null);
    setEditValue('');
  }, []);

  // 处理列显示/隐藏
  const toggleColumnVisibility = useCallback((header: string) => {
    setColumnVisibility(prev => ({
      ...prev,
      [header]: !prev[header]
    }));
  }, []);

  // 处理行删除
  const handleDeleteRow = useCallback((rowIndex: number) => {
    const actualRowIndex = localData.rows.findIndex(r => 
      JSON.stringify(r) === JSON.stringify(processedData[rowIndex])
    );

    if (actualRowIndex !== -1) {
      const updatedData = { ...localData };
      const updatedRows = updatedData.rows.filter((_, i) => i !== actualRowIndex);
      updatedData.rows = updatedRows;
      updatedData.totalRows = Math.max(0, updatedData.totalRows - 1);
      
      setLocalData(updatedData);
      onEditComplete?.(updatedData);
    }
  }, [localData, processedData, onEditComplete]);

  // 渲染排序图标
  const renderSortIcon = useCallback((header: string) => {
    if (sortConfig.key !== header) {
      return <ArrowUpDown className="w-4 h-4 text-gray-400 cursor-pointer ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />;
    }

    if (sortConfig.direction === 'ascending') {
      return <ChevronUp className="w-4 h-4 text-blue-500 cursor-pointer ml-1" />;
    }

    if (sortConfig.direction === 'descending') {
      return <ChevronDown className="w-4 h-4 text-blue-500 cursor-pointer ml-1" />;
    }

    return <ArrowUpDown className="w-4 h-4 text-gray-400 cursor-pointer ml-1" />;
  }, [sortConfig]);

  // 格式化文件大小
  const formatFileSize = useCallback((bytes?: number) => {
    if (!bytes) return 'N/A';
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  // 渲染单元格内容
  const renderCell = useCallback((row: number, col: number) => {
    const header = localData.headers[col];
    
    // 如果该列被隐藏，不渲染
    if (!columnVisibility[header]) return null;

    const isEditing = editingCell?.row === row && editingCell?.col === col;
    
    if (isEditing) {
      return (
        <td className="px-4 py-2 border-b border-gray-200 bg-blue-50">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleEditSave}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleEditSave();
                if (e.key === 'Escape') handleEditCancel();
              }}
              className="w-full p-1 border border-blue-300 rounded focus:ring-2 focus:ring-blue-200 focus:border-blue-300 outline-none"
              autoFocus
            />
            <button 
              onClick={handleEditSave} 
              className="p-1 text-green-600 hover:text-green-800"
            >
              <Save className="w-4 h-4" />
            </button>
            <button 
              onClick={handleEditCancel} 
              className="p-1 text-gray-500 hover:text-gray-700"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </td>
      );
    }

    return (
      <td 
        className={`px-4 py-2 border-b border-gray-200 transition-colors duration-150 hover:bg-gray-50 ${editable ? 'cursor-pointer' : ''}`}
        onClick={() => editable && handleEditStart(row, col)}
      >
        {processedData[row][col] || ''}
      </td>
    );
  }, [processedData, editingCell, editValue, localData.headers, columnVisibility, editable, handleEditStart, handleEditSave, handleEditCancel]);

  // 处理下载
  const handleDownload = useCallback(() => {
    onDownload?.(fileInfo.fileId);
  }, [fileInfo.fileId, onDownload]);

  // 获取可见的表头（已整合到渲染逻辑中）

  return (
    <div className={`data-preview-container bg-white rounded-lg shadow-md overflow-hidden transition-all duration-300 ${className} ${expanded ? 'max-w-none' : 'max-w-7xl'}`}>
      {/* 预览标题栏 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center flex-1 min-w-0">
          <Eye className="w-5 h-5 text-blue-600 mr-2 flex-shrink-0" />
          <div>
            <h2 className="text-lg font-semibold text-gray-800 truncate">{fileInfo.name}</h2>
            <p className="text-sm text-gray-500">
              {formatFileSize(fileInfo.size)} • {localData.totalRows} 行数据
            </p>
          </div>
        </div>
        
        {/* 工具栏 */}
        <div className="flex items-center space-x-2 ml-4">
          {showSearch && (
            <div className="relative mr-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="搜索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300"
              />
            </div>
          )}
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  onClick={() => setShowSearch(!showSearch)} 
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-full transition-colors duration-150"
                >
                  <Search className="w-4 h-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>搜索</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  onClick={() => setShowFilters(!showFilters)} 
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-full transition-colors duration-150"
                >
                  <Filter className="w-4 h-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>过滤</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  onClick={() => setShowMoreMenu(!showMoreMenu)} 
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-full transition-colors duration-150"
                >
                  <Columns className="w-4 h-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>列显示</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button 
                  onClick={() => setExpanded(!expanded)} 
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-200 rounded-full transition-colors duration-150"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>最大化</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          {onDownload && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button 
                    onClick={handleDownload} 
                    className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-full transition-colors duration-150"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>下载</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>

      {/* 过滤菜单 */}
      {showFilters && (
        <div className="p-4 border-b border-gray-200 bg-gray-50 animate-fadeIn">
          <div className="text-sm text-gray-700 font-medium mb-2">过滤选项 (待实现)</div>
          <div className="text-sm text-gray-500">过滤功能正在开发中...</div>
        </div>
      )}

      {/* 更多操作菜单 */}
      {showMoreMenu && (
        <div className="absolute right-4 mt-1 w-64 bg-white rounded-md shadow-lg border border-gray-200 z-10 animate-fadeIn">
          <div className="p-2 text-sm font-medium text-gray-700 border-b border-gray-200">
            列显示选项
          </div>
          {localData.headers.map(header => (
            <div 
              key={header} 
              className="flex items-center justify-between px-4 py-2 hover:bg-gray-50 cursor-pointer"
            >
              <span className="text-sm text-gray-700">{header}</span>
              <input
                type="checkbox"
                checked={columnVisibility[header]}
                onChange={() => toggleColumnVisibility(header)}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
            </div>
          ))}
        </div>
      )}

      {/* 表格内容 */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-200 border-t-blue-600" />
            <p className="mt-2 text-gray-500">加载中...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center bg-red-50">
            <AlertTriangle className="inline-block text-red-500 w-6 h-6 mb-2" />
            <p className="text-red-600">{error}</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {localData.headers.map((header) => {
                  if (!columnVisibility[header]) return null;
                  
                  return (
                    <th
                      key={header}
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider group cursor-pointer"
                      onClick={() => handleSort(header)}
                    >
                      <div className="flex items-center">
                        {header}
                        {renderSortIcon(header)}
                      </div>
                    </th>
                  );
                })}
                {editable && (
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {processedData.length > 0 ? (
                processedData.map((row, rowIndex) => (
                  <tr key={rowIndex} className="hover:bg-gray-50 transition-colors duration-150">
                    {row.map((_, colIndex) => renderCell(rowIndex, colIndex))}
                    {editable && (
                      <td className="px-4 py-2 border-b border-gray-200">
                        <button 
                          onClick={() => handleDeleteRow(rowIndex)}
                          className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors duration-150"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={localData.headers.length + (editable ? 1 : 0)} className="px-4 py-8 text-center text-gray-500">
                    没有找到匹配的数据
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* 底部信息和操作栏 */}
      <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
        <div className="text-sm text-gray-500">
          显示 {processedData.length} 条，共 {localData.totalRows} 条
        </div>
        {localData.hasMore && onLoadMore && (
          <button
            onClick={onLoadMore}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors duration-150 text-sm"
          >
            加载更多
          </button>
        )}
      </div>
    </div>
  );
};

export default DataPreview;
