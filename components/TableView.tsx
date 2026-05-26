"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ArrowUpDown, ArrowUp, ArrowDown, GripVertical, MoreVertical, Plus, X, Edit3, LoaderIcon, AlertCircleIcon, ZapIcon, BarChart3, FileDown, Search, Filter, XCircle, Trash2, Edit, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useTableSelection } from "@/hooks/useTableSelection"
type SortDirection = "asc" | "desc" | "none"
type CellPosition = { row: number; col: number }
type SelectionRange = { start: CellPosition; end: CellPosition }
import { useLanguage } from "@/hooks/useLanguage"
import { useDataProcessor } from "@/hooks/useDataProcessor"
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts"
// TableDataVisualizer暂时移除
import { ExportDialog } from './ExportDialog';
import { ExportUtils, ExportFormat } from '../lib/exportUtils';

interface TableViewProps {
  filteredData: string[][]
  tableData: string[][]
  setTableData: (data: string[][]) => void
  updateInputData: (data: string[][]) => string
  saveToHistory: (tableData: string[][], inputData: string) => void
  tableScale: number
  isTableExpanded: boolean
  inputData: string
  selectedFormat: string
  parseInputData: (data: string, format: string) => string[][]
  sortColumn?: number | null
  sortDirection?: SortDirection
  onSort?: (col: number, direction: SortDirection) => void
  draggedRowIndex?: number | null
  draggedColumnIndex?: number | null
  onDragStartRow?: (index: number) => void
  onDragStartColumn?: (index: number) => void
  onDragEnd?: () => void
  onDropRow?: (from: number, to: number) => void
  onDropColumn?: (from: number, to: number) => void
  editingCell?: CellPosition | null
  editingValue?: string
  onCellEditStart?: (row: number, col: number) => void
  onCellEditChange?: (value: string) => void
  onCellEditEnd?: () => void
  selectedCells?: Set<string>
  selectionRange?: SelectionRange | null
  isSelecting?: boolean
  lastClickedCell?: CellPosition | null
  onCellClick?: (row: number, col: number) => void
  onSelectStart?: (row: number, col: number) => void
  onSelectUpdate?: (row: number, col: number) => void
  onSelectEnd?: () => void
  editInputRef?: React.RefObject<HTMLInputElement>
  useVirtualScroll?: boolean
  enableWorkerProcessing?: boolean
}

export const TableView = ({
  filteredData,
  tableData,
  setTableData,
  updateInputData,
  saveToHistory,
  tableScale,
  isTableExpanded,
  inputData,
  selectedFormat,
  parseInputData,
  sortColumn,
  sortDirection,
  onSort,
  draggedRowIndex,
  draggedColumnIndex,
  onDragStartRow,
  onDragStartColumn,
  onDragEnd,
  onDropRow,
  onDropColumn,
  editingCell,
  editingValue,
  onCellEditStart,
  onCellEditChange,
  onCellEditEnd,
  selectedCells: _selectedCells,
  selectionRange: _selectionRange,
  isSelecting: _isSelecting,
  lastClickedCell: _lastClickedCell,
  onCellClick,
  onSelectStart: _onSelectStart,
  onSelectUpdate: _onSelectUpdate,
  onSelectEnd: _onSelectEnd,
  editInputRef,
  useVirtualScroll: _useVirtualScroll = true,
  enableWorkerProcessing = true,
}: TableViewProps) => {
  // 使用传入的props或本地state
  const [localSortColumn, setLocalSortColumn] = useState<number | null>(sortColumn ?? null)
  const [localSortDirection, setLocalSortDirection] = useState<SortDirection>(sortDirection ?? "none")
  const [localDraggedRowIndex, setLocalDraggedRowIndex] = useState<number | null>(draggedRowIndex ?? null)
  const [localDraggedColumnIndex, setLocalDraggedColumnIndex] = useState<number | null>(draggedColumnIndex ?? null)
  const [localEditingCell, setLocalEditingCell] = useState<{ row: number; col: number } | null>(editingCell ?? null)
  const [localEditingValue, setLocalEditingValue] = useState(editingValue ?? "")
  const [showVisualizer, setShowVisualizer] = useState(false)
  const [columnWidths, setColumnWidths] = useState<{[key: number]: number}>({})
  const [resizingColumn, setResizingColumn] = useState<number | null>(null)
  const [startX, setStartX] = useState(0)
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<string[][]>([])
  const [isSearchActive, setIsSearchActive] = useState(false)
  const [_isBatchEditOpen, setIsBatchEditOpen] = useState(false)
  const [batchEditColumn, setBatchEditColumn] = useState<number | null>(null)
  const [batchEditValue, setBatchEditValue] = useState('')
  
  // 优先使用传入的ref，如果没有则使用本地ref
  const localEditInputRef = useRef<HTMLInputElement>(null)
  const finalEditInputRef = editInputRef || localEditInputRef
  const [isLargeData, setIsLargeData] = useState(false)
  const [processingStats, setProcessingStats] = useState<Record<string, string>>({})
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null)
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set())
  
  // 处理单元格点击事件，更新选中单元格状态
  const handleCellClick = (rowIndex: number, colIndex: number, _value?: string) => {
    if (onCellClick) {
      onCellClick(rowIndex, colIndex)
    } else {
      handleSelectionCellClick(rowIndex, colIndex, {} as React.MouseEvent)
    }
    setSelectedCell({ row: rowIndex, col: colIndex })
  }

  const { toast } = useToast()
  const { isCellSelected, handleCellClick: handleSelectionCellClick, handleCellMouseDown, handleCellMouseEnter } = useTableSelection()
  const { t } = useLanguage()
  
  const handleCellEditConfirm = () => {
    if (onCellEditEnd) {
      onCellEditEnd()
    } else if (localEditingCell) {
      const newTableData = [...tableData]
      newTableData[localEditingCell.row][localEditingCell.col] = localEditingValue
      setTableData(newTableData)
      const newInputData = updateInputData(newTableData)
      saveToHistory(newTableData, newInputData)
      setLocalEditingCell(null)
      setLocalEditingValue("")
      toast({
        title: t("messages.cellUpdated"),
        description: t("messages.cellUpdatedDesc"),
      })
    }
  }

  const handleCellEditCancel = () => {
    if (onCellEditEnd) {
      onCellEditEnd()
    } else {
      setLocalEditingCell(null)
      setLocalEditingValue("")
    }
  }

  // 集成键盘快捷键钩子
  const _keyboardShortcuts = useKeyboardShortcuts({
    selectedCell,
    setSelectedCell,
    data: tableData,
    onEdit: (row, col) => handleCellDoubleClick(row, col),
    onSave: handleCellEditConfirm,
    onCancel: handleCellEditCancel
  })
  
  // 处理可视化器显示/隐藏
  const handleToggleVisualizer = () => {
    if (tableData.length <= 1) {
      toast({
        title: t("messages.insufficientData"),
        description: t("messages.needMoreDataForVisualization"),
        variant: "destructive"
      })
      return
    }
    setShowVisualizer(!showVisualizer)
  }

  // 处理数据导出
  const handleExport = (format: ExportFormat, options: any) => {
    try {
      // 检查数据是否为空
      if (!tableData || tableData.length === 0) {
        alert('没有可导出的数据');
        return;
      }

      // 获取要导出的数据
      let dataToExport = [...tableData];
      
      // 根据选项处理数据
      if (!options.includeHeaders && dataToExport.length > 0) {
        dataToExport = dataToExport.slice(1);
      }

      // 限制导出的行数（大数据集保护）
      const MAX_EXPORT_ROWS = 10000;
      if (dataToExport.length > MAX_EXPORT_ROWS) {
        dataToExport = dataToExport.slice(0, MAX_EXPORT_ROWS);
        console.warn(`数据量超过限制，已截断至${MAX_EXPORT_ROWS}行`);
      }

      // 执行导出
      ExportUtils.exportData(dataToExport, format, options);
    } catch (error) {
      console.error('导出失败:', error);
      alert(`导出失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  // 处理搜索功能
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setIsSearchActive(false);
      setSearchResults([]);
      return;
    }
    
    const lowerQuery = query.toLowerCase().trim();
    
    // 搜索实现 - 对于大数据集使用Web Worker优化性能
    if (enableWorkerProcessing && tableData.length > 1000) {
      // 这里可以使用Web Worker来处理大数据集的搜索
      // 为简化，先使用常规方法
      performSearch(lowerQuery);
    } else {
      performSearch(lowerQuery);
    }
  };

  // 执行搜索
  const performSearch = (query: string) => {
    const results: string[][] = [];
    
    // 始终包含表头
    if (tableData.length > 0) {
      results.push(tableData[0]);
    }
    
    // 搜索每一行数据
    for (let i = 1; i < tableData.length; i++) {
      const row = tableData[i];
      let matchFound = false;
      
      // 检查行中是否有匹配项
      for (const cell of row) {
        if (cell.toLowerCase().includes(query)) {
          matchFound = true;
          break;
        }
      }
      
      if (matchFound) {
        results.push(row);
      }
    }
    
    setSearchResults(results);
    setIsSearchActive(true);
  };

  // 清除搜索
  const clearSearch = () => {
    setSearchQuery('');
    setIsSearchActive(false);
    setSearchResults([]);
  };

  // 获取当前要显示的数据（原始数据或搜索结果）
    const getCurrentData = () => {
      return isSearchActive && searchQuery.trim() ? searchResults : filteredData;
    };

    // 处理全选
    const _handleSelectAll = () => {
      const currentData = getCurrentData();
      if (currentData.length <= 1) return;
      
      const allIndices = Array.from({ length: currentData.length - 1 }, (_, i) => i + 1);
      setSelectedRows(new Set(allIndices));
    };

    // 处理取消全选
    const handleDeselectAll = () => {
      setSelectedRows(new Set());
    };

    // 检查是否全选
    const _isAllSelected = () => {
      const currentData = getCurrentData();
      if (currentData.length <= 1) return false;
      return selectedRows.size === currentData.length - 1;
    };

    // 处理批量删除
    const handleBatchDelete = () => {
      if (selectedRows.size === 0) {
        toast({
          title: "未选择行",
          description: "请先选择要删除的行",
          variant: "destructive",
        });
        return;
      }

      if (window.confirm(`确定要删除选中的 ${selectedRows.size} 行吗？此操作不可撤销。`)) {
        try {
          // 将选中的索引按降序排列，从后往前删除，避免索引偏移
          const sortedIndices = Array.from(selectedRows).sort((a, b) => b - a);
          
          // 确保我们操作的是完整的原始数据
          const newData = [...tableData];
          
          // 执行删除
          sortedIndices.forEach(index => {
            newData.splice(index, 1);
          });
          
          setTableData(newData);
          const newInputData = updateInputData(newData);
          saveToHistory(newData, newInputData);
          
          setSelectedRows(new Set());
          
          // 显示成功消息
          toast({
            title: "删除成功",
            description: `已成功删除 ${selectedRows.size} 行数据`,
            variant: "destructive",
          });
        } catch (error) {
          console.error("批量删除失败:", error);
          toast({
            title: "删除失败",
            description: "批量删除过程中发生错误",
            variant: "destructive",
          });
        }
      }
    };

    // 处理批量编辑
    const handleBatchEdit = () => {
      if (selectedRows.size === 0) {
        toast({
          title: "未选择行",
          description: "请先选择要编辑的行",
          variant: "destructive",
        });
        return;
      }
      
      // 打开批量编辑对话框
      setIsBatchEditOpen(true);
    };

    // 确认批量编辑
    const _confirmBatchEdit = () => {
      if (batchEditColumn === null || selectedRows.size === 0) return;
      
      try {
        // 获取原始数据的副本
        const newData = [...tableData];
        
        // 更新选中行的指定列
        selectedRows.forEach(rowIndex => {
          if (rowIndex >= 0 && rowIndex < newData.length) {
            newData[rowIndex] = [...newData[rowIndex]];
            newData[rowIndex][batchEditColumn] = batchEditValue;
          }
        });
        
        setTableData(newData);
        const newInputData = updateInputData(newData);
        saveToHistory(newData, newInputData);
        
        // 显示成功消息
        toast({
          title: "编辑成功",
          description: `已成功更新 ${selectedRows.size} 行数据`,
        });
        
        // 关闭对话框并重置状态
        setIsBatchEditOpen(false);
        setBatchEditColumn(null);
        setBatchEditValue('');
        setSelectedRows(new Set());
      } catch (error) {
        console.error("批量编辑失败:", error);
        toast({
          title: "编辑失败",
          description: "批量编辑过程中发生错误",
          variant: "destructive",
        });
      }
    };

    // 取消批量编辑
    const _cancelBatchEdit = () => {
      setIsBatchEditOpen(false);
      setBatchEditColumn(null);
      setBatchEditValue('');
    };
  
  // 使用数据处理钩子
  const {
    processData,
    isProcessing,
    error: processingError,
  } = useDataProcessor()

  useEffect(() => {
    if (localEditingCell && finalEditInputRef.current) {
      finalEditInputRef.current.focus();
      finalEditInputRef.current.select();
    }
  }, [localEditingCell])
  
  // 当父组件传入的排序状态变化时更新本地状态
  useEffect(() => {
    if (sortColumn !== undefined) {
      setLocalSortColumn(sortColumn ?? null)
    }
  }, [sortColumn])
  
  useEffect(() => {
    if (sortDirection !== undefined) {
      setLocalSortDirection(sortDirection ?? "none")
    }
  }, [sortDirection])

  // 当父组件传入的editingCell变化时更新本地状态
  useEffect(() => {
    if (editingCell !== undefined) {
      setLocalEditingCell(editingCell ?? null)
    }
  }, [editingCell])
  
  // 当父组件传入的editingValue变化时更新本地状态
  useEffect(() => {
    if (editingValue !== undefined) {
      setLocalEditingValue(editingValue ?? "")
    }
  }, [editingValue])
  
  // 当父组件传入的draggedRowIndex变化时更新本地状态
  useEffect(() => {
    if (draggedRowIndex !== undefined) {
      setLocalDraggedRowIndex(draggedRowIndex ?? null)
    }
  }, [draggedRowIndex])
  
  // 当父组件传入的draggedColumnIndex变化时更新本地状态
  useEffect(() => {
    if (draggedColumnIndex !== undefined) {
      setLocalDraggedColumnIndex(draggedColumnIndex ?? null)
    }
  }, [draggedColumnIndex])

  const _handleDragCancel = () => {
    if (onDragEnd) {
      onDragEnd()
    } else {
      setLocalDraggedRowIndex(null)
      setLocalDraggedColumnIndex(null)
    }
  }

  // 列宽调整相关函数
  const _handleResizeStart = (e: React.MouseEvent, columnIndex: number) => {
    e.preventDefault()
    e.stopPropagation()
    setResizingColumn(columnIndex)
    setStartX(e.pageX)
    
    // 添加全局事件监听器
    document.addEventListener('mousemove', handleResize)
    document.addEventListener('mouseup', handleResizeEnd)
    
    // 防止选择文本和其他默认行为
    document.body.style.userSelect = 'none'
    document.body.style.cursor = 'col-resize'
  }

  const handleResize = (e: MouseEvent) => {
    if (resizingColumn === null) return
    
    const deltaX = e.pageX - startX
    const currentWidth = columnWidths[resizingColumn] || 150
    const newWidth = Math.max(50, currentWidth + deltaX) // 最小宽度限制为50px
    
    setColumnWidths(prev => ({
      ...prev,
      [resizingColumn]: newWidth
    }))
    
    setStartX(e.pageX)
  }

  const handleResizeEnd = () => {
    setResizingColumn(null)
    // 移除全局事件监听器
    document.removeEventListener('mousemove', handleResize)
    document.removeEventListener('mouseup', handleResizeEnd)
    // 恢复默认行为
    document.body.style.userSelect = ''
    document.body.style.cursor = ''
  }

  // 当组件卸载时，清除拖拽状态
  useEffect(() => {
    return () => {
      setLocalDraggedRowIndex(null)
      setLocalDraggedColumnIndex(null)
    }
  }, [])

  // 检查是否为大数据集
  useEffect(() => {
    const totalCells = tableData.length * (tableData[0]?.length || 1)
    setIsLargeData(totalCells > 10000) // 当单元格数量超过10000时视为大数据集
  }, [tableData])

  useEffect(() => {
    setProcessingStats({})
  }, [])

  const _getSortIcon = (columnIndex: number) => {
    if (localSortColumn !== columnIndex) return <ArrowUpDown className="w-4 h-4 text-gray-400" />
    if (localSortDirection === "asc") return <ArrowUp className="w-4 h-4 text-blue-500" />
    if (localSortDirection === "desc") return <ArrowDown className="w-4 h-4 text-blue-500" />
    return <ArrowUpDown className="w-4 h-4 text-gray-400" />
  }

  // 处理表格排序
  const _handleSort = async (columnIndex: number) => {
    if (tableData.length <= 1) return

    // 如果有传入的onSort回调，则调用它
    if (onSort) {
      // 计算新的排序方向
      let newDirection: SortDirection = "asc"
      if (localSortColumn === columnIndex) {
        newDirection = localSortDirection === "asc" ? "desc" : localSortDirection === "desc" ? "none" : "asc"
      }
      onSort(columnIndex, newDirection)
      return
    }

    let newDirection: SortDirection = "asc"
    if (localSortColumn === columnIndex) {
      if (localSortDirection === "asc") newDirection = "desc"
      else if (localSortDirection === "desc") newDirection = "none"
      else newDirection = "asc"
    }

    setLocalSortColumn(columnIndex)
    setLocalSortDirection(newDirection)

    if (newDirection === "none") {
      const originalData = parseInputData(inputData, selectedFormat)
      setTableData(originalData)
      return
    }

    // 对于大数据集，使用Web Worker进行排序
    if (isLargeData && enableWorkerProcessing && tableData.length > 1) {
      try {
        // 准备数据格式（将二维数组转换为对象数组）
        const headers = tableData[0]
        const dataRows = tableData.slice(1)
        
        // 转换为对象数组
        const objectData = dataRows.map(row => {
          const obj: Record<string, string> = {}
          row.forEach((cell, colIndex) => {
            obj[headers[colIndex] || `column_${colIndex}`] = cell
          })
          return obj
        })
        
        const result = await processData(JSON.stringify(objectData), 'SORT')
        
        // 将排序结果转换回二维数组
        if (result && result.data) {
          const sortedRows = result.data.map((obj: Record<string, string>) => {
            return headers.map(colName => obj[colName] || '')
          })
          
          const newTableData = [headers, ...sortedRows]
          setTableData(newTableData)
          const newInputData = updateInputData(newTableData)
          saveToHistory(newTableData, newInputData)
        }
      } catch (error) {
        console.error('排序失败:', error)
        // 回退到主线程排序
        toast({
          title: t("messages.sortFailed"),
          description: t("messages.fallingBackToMainThread"),
          variant: "destructive"
        })
        handleMainThreadSort(columnIndex, newDirection)
      }
    } else {
      // 小数据集直接在主线程排序
      handleMainThreadSort(columnIndex, newDirection)
    }
  }

  // 主线程排序（回退方案）
  const handleMainThreadSort = (columnIndex: number, newDirection: SortDirection) => {
    const headers = tableData[0]
    const dataRows = tableData.slice(1)

    const sortedRows = [...dataRows].sort((a, b) => {
      const aVal = a[columnIndex] || ""
      const bVal = b[columnIndex] || ""

      const aNum = Number.parseFloat(aVal)
      const bNum = Number.parseFloat(bVal)
      const isNumeric = !isNaN(aNum) && !isNaN(bNum)

      if (isNumeric) {
        return newDirection === "asc" ? aNum - bNum : bNum - aNum
      } else {
        return newDirection === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
      }
    })

    const newTableData = [headers, ...sortedRows]
    setTableData(newTableData)
    const newInputData = updateInputData(newTableData)
    saveToHistory(newTableData, newInputData)
  }

  const handleCellDoubleClick = (rowIndex: number, colIndex: number) => {
    // 如果有传入的onCellEditStart回调，则调用它
    if (onCellEditStart) {
      onCellEditStart(rowIndex, colIndex)
    } else {
      setLocalEditingCell({ row: rowIndex, col: colIndex })
      setLocalEditingValue(tableData[rowIndex][colIndex] || "")
    }
  }

  const handleCellEdit = (value: string) => {
    // 如果有传入的onCellEditChange回调，则调用它
    if (onCellEditChange) {
      onCellEditChange(value)
    } else {
      setLocalEditingValue(value)
    }
  }

  const handleCellEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleCellEditConfirm()
    } else if (e.key === "Escape") {
      handleCellEditCancel()
    }
  }

  const addRowAt = (position: number, direction: "above" | "below") => {
    if (tableData.length === 0) return
    const insertIndex = direction === "above" ? position : position + 1
    const newRow = new Array(tableData[0].length).fill("")
    const newTableData = [...tableData]
    newTableData.splice(insertIndex, 0, newRow)
    setTableData(newTableData)
    const newInputData = updateInputData(newTableData)
    saveToHistory(newTableData, newInputData)
    toast({
      title: t("messages.rowAdded"),
      description: `${insertIndex + 1}${t("messages.rowAddedDesc")}`,
    })
  }

  const _addColumnAt = (position: number, direction: "left" | "right") => {
    if (tableData.length === 0) return
    const insertIndex = direction === "left" ? position : position + 1
    const newTableData = tableData.map((row, rowIndex) => {
      const newRow = [...row]
      newRow.splice(insertIndex, 0, rowIndex === 0 ? t("contextMenu.newColumn") : "")
      return newRow
    })
    setTableData(newTableData)
    const newInputData = updateInputData(newTableData)
    saveToHistory(newTableData, newInputData)
    toast({
      title: t("messages.columnAdded"),
      description: `${insertIndex + 1}${t("messages.columnAddedDesc")}`,
    })
  }

  const deleteRow = (rowIndex: number) => {
    if (tableData.length <= 1) {
      toast({
        title: t("messages.cannotDelete"),
        description: t("messages.cannotDeleteHeader"),
        variant: "destructive",
      })
      return
    }
    const newTableData = tableData.filter((_, index) => index !== rowIndex)
    setTableData(newTableData)
    const newInputData = updateInputData(newTableData)
    saveToHistory(newTableData, newInputData)
    toast({
      title: t("messages.rowDeleted"),
      description: `${rowIndex + 1}${t("messages.rowDeletedDesc")}`,
    })
  }

  const _deleteColumn = (colIndex: number) => {
    if (tableData.length === 0 || tableData[0].length <= 1) {
      toast({
        title: t("messages.cannotDelete"),
        description: t("messages.cannotDeleteLastColumn"),
        variant: "destructive",
      })
      return
    }
    const newTableData = tableData.map((row) => row.filter((_, index) => index !== colIndex))
    setTableData(newTableData)
    const newInputData = updateInputData(newTableData)
    saveToHistory(newTableData, newInputData)
    toast({
      title: t("messages.columnDeleted"),
      description: `${colIndex + 1}${t("messages.columnDeletedDesc")}`,
    })
  }

  const _handleRowDragStart = (e: React.DragEvent, index: number) => {
    if (onDragStartRow) {
      onDragStartRow(index)
    } else {
      setLocalDraggedRowIndex(index)
    }
    e.dataTransfer.effectAllowed = "move"
  }

  const _handleRowDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
  }

  const _handleRowDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    
    if (onDropRow) {
      const draggedIndex = localDraggedRowIndex ?? draggedRowIndex ?? null
      if (draggedIndex !== null && draggedIndex !== dropIndex) {
        onDropRow(draggedIndex, dropIndex)
      }
    } else {
      if (localDraggedRowIndex === null || localDraggedRowIndex === dropIndex) return

      const newTableData = [...tableData]
      const draggedRow = newTableData[localDraggedRowIndex]
      newTableData.splice(localDraggedRowIndex, 1)
      newTableData.splice(dropIndex, 0, draggedRow)

      setTableData(newTableData)
      setLocalDraggedRowIndex(null)
      const newInputData = updateInputData(newTableData)
      saveToHistory(newTableData, newInputData)
    }
  }

  const _handleColumnDragStart = (e: React.DragEvent, index: number) => {
    if (onDragStartColumn) {
      onDragStartColumn(index)
    } else {
      setLocalDraggedColumnIndex(index)
    }
    e.dataTransfer.effectAllowed = "move"
  }

  const _handleColumnDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    
    if (onDropColumn) {
      const draggedIndex = localDraggedColumnIndex ?? draggedColumnIndex ?? null
      if (draggedIndex !== null && draggedIndex !== dropIndex) {
        onDropColumn(draggedIndex, dropIndex)
      }
    } else {
      if (localDraggedColumnIndex === null || localDraggedColumnIndex === dropIndex) return

      const newTableData = tableData.map((row) => {
        const newRow = [...row]
        const draggedCell = newRow[localDraggedColumnIndex]
        newRow.splice(localDraggedColumnIndex, 1)
        newRow.splice(dropIndex, 0, draggedCell)
        return newRow
      })

      setTableData(newTableData)
      setLocalDraggedColumnIndex(null)
      const newInputData = updateInputData(newTableData)
      saveToHistory(newTableData, newInputData)
    }
  }

  // 渲染性能信息
  const renderPerformanceInfo = () => {
    if (!isLargeData) return null
    
    return (
      <div className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 border-b border-gray-200">
        <ZapIcon size={16} className="text-blue-500" />
        <span>
          大数据集模式: {tableData.length} 行 × {tableData[0]?.length || 0} 列
          {enableWorkerProcessing && ' (Worker 加速)'}
        </span>
        {isProcessing && (
          <span className="flex items-center gap-1 text-blue-600">
            <LoaderIcon size={14} className="animate-spin" />
            {t("messages.processing")}...
          </span>
        )}
        {processingError && (
          <span className="flex items-center gap-1 text-red-600">
            <AlertCircleIcon size={14} />
            {processingError instanceof Error ? processingError.message : String(processingError)}
          </span>
        )}
        {Object.keys(processingStats).length > 0 && (
          <span className="text-xs text-gray-500">
            {t("messages.processingTime")}: {processingStats.total || 'N/A'}
          </span>
        )}
        {isProcessing && (
          <Button
            onClick={() => {}}
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20"
          >
            {t("messages.cancel")}
          </Button>
        )}
      </div>
  )
  }// 自定义单元格渲染器
  const _cellRenderer = (value: string, rowIndex: number, colIndex: number, isHeader: boolean) => {
    if (isHeader) {
      return (
        <div className="flex items-center gap-2">
          <GripVertical className="w-4 h-4 text-gray-400 dark:text-gray-500 cursor-move hover:text-gray-600 dark:hover:text-gray-300 transition-colors" />
          {localEditingCell?.row === rowIndex && localEditingCell?.col === colIndex ? (
            <Input
              ref={finalEditInputRef}
              value={localEditingValue}
              onChange={(e) => handleCellEdit(e.target.value)}
              onKeyDown={handleCellEditKeyDown}
              onBlur={handleCellEditConfirm}
              className="h-6 text-sm font-semibold text-gray-700 bg-white border-blue-300"
            />
          ) : (
            <span className="font-semibold text-gray-700 cursor-pointer hover:bg-blue-100 px-1 py-0.5 rounded">
              {value}
            </span>
          )}
        </div>
      );
    }
    
    return (
      <div className="flex items-center gap-2">
        {colIndex === 0 && (
          <>
            <GripVertical className="w-4 h-4 text-gray-400 cursor-move" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 hover:bg-gray-100"
                >
                  <MoreVertical className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => addRowAt(rowIndex - 1, "above")}>
                  <Plus className="w-4 h-4 mr-2" />
                  {t("contextMenu.addRowAbove")}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => addRowAt(rowIndex - 1, "below")}>
                  <Plus className="w-4 h-4 mr-2" />
                  {t("contextMenu.addRowBelow")}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => deleteRow(rowIndex)}
                  className="text-red-600 hover:text-red-700"
                >
                  <X className="w-4 h-4 mr-2" />
                  {t("contextMenu.deleteRow")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        )}
        {localEditingCell?.row === rowIndex && localEditingCell?.col === colIndex ? (
          <Input
            ref={finalEditInputRef}
            value={localEditingValue}
            onChange={(e) => handleCellEdit(e.target.value)}
            onKeyDown={handleCellEditKeyDown}
            onBlur={handleCellEditConfirm}
            className="h-6 text-sm bg-white border-blue-300"
          />
        ) : (
          <span
            className={`cursor-pointer hover:bg-blue-100 px-1 py-0.5 rounded flex-1 inline-flex items-center gap-1 ${isCellSelected(rowIndex, colIndex) ? "bg-blue-200" : ""}`}
            onDoubleClick={() => handleCellDoubleClick(rowIndex, colIndex)}
            onClick={(e) => {
              if (onCellClick) {
                onCellClick(rowIndex, colIndex)
              } else {
                handleSelectionCellClick(rowIndex, colIndex, e)
              }
            }}
            onMouseDown={(e) => handleCellMouseDown(rowIndex, colIndex, e)}
            onMouseEnter={() => handleCellMouseEnter(rowIndex, colIndex)}
            id={`cell-${rowIndex}-${colIndex}`}
          >
            {value}
            <Edit3 className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
          </span>
        )}
      </div>
    );
  };
  
  // 渲染表格工具栏
  const renderTableToolbar = () => {
    return (
      <div className="flex flex-col gap-2 p-2 bg-gray-50 border-b border-gray-200">
        {/* 主工具栏 - 适配不同屏幕尺寸 */}
        <div className="flex flex-wrap items-center justify-between gap-2 w-full">
          {/* 左侧按钮组 - 大屏幕全部显示，中屏幕隐藏部分文字，小屏幕只显示图标 */}
          <div className="flex flex-wrap items-center gap-1">
            <Button
              className={`h-8 flex items-center gap-1 ${showVisualizer ? 'bg-blue-500 text-white' : ''} sm:px-2 md:px-3`}
              onClick={handleToggleVisualizer}
            >
              <BarChart3 size={16} />
              <span className="hidden sm:inline">{t("actions.visualize")}</span>
            </Button>
            
            {/* 搜索框 - 响应式宽度 */}
            <div className="relative flex-grow min-w-[200px] sm:w-auto">
              <Input
                type="text"
                placeholder="搜索表格内容..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="h-8 pl-8 pr-8 w-full sm:w-64 md:w-72"
                aria-label="搜索表格"
              />
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              {searchQuery && (
                <button
                  onClick={clearSearch}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 hover:text-gray-600"
                  aria-label="清除搜索"
                >
                  <XCircle className="h-4 w-4" />
                </button>
              )}
            </div>
            
            {/* 导出和筛选按钮 - 小屏幕隐藏文字 */}
            <Button
              className="h-8 px-2 sm:px-3 flex items-center gap-1"
              onClick={() => setIsExportDialogOpen(true)}
            >
              <FileDown size={16} />
              <span className="hidden sm:inline">导出</span>
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  className="h-8 px-2 sm:px-3 flex items-center gap-1"
                >
                  <Filter size={16} />
                  <span className="hidden sm:inline">筛选</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72 p-2">
                <div className="space-y-4 p-2">
                  <div>
                    <h3 className="text-sm font-medium mb-2">高级筛选</h3>
                    <p className="text-xs text-gray-500">功能开发中，敬请期待...</p>
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        {/* 批量操作工具栏 - 单独一行，确保在所有屏幕尺寸下都有良好显示 */}
        {selectedRows.size > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2 w-full bg-blue-50 px-3 py-1.5 rounded-md">
            <span className="text-sm">已选择 {selectedRows.size} 项</span>
            <div className="flex flex-wrap items-center gap-1">
              <Button
                size="sm"
                variant="destructive"
                className="h-7 px-2 text-xs sm:text-sm"
                onClick={handleBatchDelete}
              >
                <Trash2 size={14} className="mr-1" />
                <span className="hidden sm:inline">删除</span>
              </Button>
              <Button
                size="sm"
                className="h-7 px-2 text-xs sm:text-sm"
                onClick={handleBatchEdit}
              >
                <Edit size={14} className="mr-1" />
                <span className="hidden sm:inline">编辑</span>
              </Button>
              <Button
                size="sm"
                variant="secondary"
                className="h-7 px-2 text-xs sm:text-sm"
                onClick={handleDeselectAll}
              >
                <span className="hidden sm:inline">取消选择</span>
                <X size={14} className="sm:hidden" />
              </Button>
            </div>
          </div>
        )}
        
        <ExportDialog
          isOpen={isExportDialogOpen}
          onOpenChange={setIsExportDialogOpen}
          onExport={handleExport}
          tableDataLength={tableData.length}
          maxExportRows={10000}
        />
      </div>
    );
  };

  // 添加响应式状态管理
  const [isMobileView, setIsMobileView] = useState(false);
  
  useEffect(() => {
    function handleResize() {
      setIsMobileView(window.innerWidth < 640);
    }
    
    // 初始化
    handleResize();
    
    // 添加事件监听
    window.addEventListener('resize', handleResize);
    
    // 清理函数
    return function cleanup() {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // 主组件渲染
  return (
    <div className="table-view-container">
      {isMobileView && (
        <div className="bg-amber-50 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 text-xs sm:text-sm p-2 border-b border-amber-200 dark:border-amber-800/30">
          <div className="flex items-center gap-2 justify-center">
              <AlertCircle size={14} />
              <span className="whitespace-nowrap">建议在大屏幕上使用，以获得最佳表格编辑体验</span>
          </div>
        </div>
      )}
      {renderTableToolbar()}
      {renderPerformanceInfo()}
      {/* 可视化组件暂时移除 */}
      <div
        className={`overflow-x-auto ${isTableExpanded ? 
          "max-h-[calc(100vh-20rem)]" : 
          "max-h-[400px] sm:max-h-[500px] md:max-h-[600px]"}`}
        style={{
          userSelect: "none",
          transform: `scale(${tableScale})`,
          transformOrigin: "top left",
          transition: "transform 0.2s ease-in-out",
        }}
      >
        {/* 简化版本：只显示表格数据的前几行 */}
        <table className="w-full text-sm whitespace-nowrap">
          <thead>
            <tr>
              <th className="p-2 border">表头</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="p-2 border">测试数据</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
