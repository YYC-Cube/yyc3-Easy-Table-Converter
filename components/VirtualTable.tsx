/**
 * @file 虚拟滚动表格组件
 * @description 支持百万级数据的高性能表格渲染组件，优化版支持虚拟行列和固定表头
 * @module components
 * @author YYC
 * @version 2.0.0
 * @created 2024-11-23
 * @updated 2024-11-24
 */

"use client"

import React, { useMemo, useState, useCallback, useRef, useEffect } from "react"
import { useWindowSize } from "@/hooks/useWindowSize"

interface VirtualTableProps {
  /** 表格数据，包括表头 */
  tableData: string[][]
  /** 表格行高 */
  rowHeight?: number
  /** 表头行高 */
  headerHeight?: number
  /** 可视区域外的缓冲区行数 */
  overscanRows?: number
  /** 可视区域外的缓冲区列数 */
  overscanCols?: number
  /** 单元格渲染器 */
  cellRenderer?: (value: string, rowIndex: number, colIndex: number, isHeader?: boolean, isSelected?: boolean) => React.ReactNode
  /** 行点击事件处理函数 */
  onRowClick?: (rowIndex: number, row: string[]) => void
  /** 单元格点击事件处理函数 */
  onCellClick?: (rowIndex: number, colIndex: number, value: string) => void
  /** 单元格键盘事件处理函数 */
  onCellKeyDown?: (rowIndex: number, colIndex: number, event: KeyboardEvent) => void
  /** 是否为筛选后的数据 */
  isFiltered?: boolean
  /** 容器类名 */
  className?: string
  /** 表格宽度 */
  tableWidth?: number | string
  /** 列宽数组 */
  columnWidths?: (number | undefined)[]
  /** 默认列宽 */
  defaultColumnWidth?: number
}

export const VirtualTable: React.FC<VirtualTableProps> = ({
  tableData,
  rowHeight = 40,
  headerHeight = 50,
  overscanRows = 5,
  overscanCols = 5,
  cellRenderer,
  onRowClick,
  onCellClick,
  isFiltered = false,
  className = "",
  tableWidth = "100%",
  columnWidths,
  defaultColumnWidth = 120,
}) => {
  const [scrollTop, setScrollTop] = useState(0)
  const [scrollLeft, setScrollLeft] = useState(0)
  const [selectedCell, setSelectedCell] = useState<{row: number, col: number} | null>(null)
  const tableContainerRef = useRef<HTMLDivElement>(null)
  const { height: windowHeight } = useWindowSize()
  const rowCacheRef = useRef<Map<string, React.ReactNode>>(new Map())
  
  // 计算表格高度，如果容器未定义，则使用窗口高度的60%
  const tableHeight = tableContainerRef.current?.clientHeight || windowHeight * 0.6
  const tableWidthValue = typeof tableWidth === 'number' ? tableWidth : tableContainerRef.current?.clientWidth || 1000

  // 计算可见区域的行信息
  const visibleRows = useMemo(() => {
    // 没有数据时返回空状态
    if (!tableData || tableData.length === 0) {
      return {
        startIndex: 0,
        endIndex: 0,
        totalRows: 0,
        visibleCount: 0,
        offsetY: 0,
      }
    }

    // 计算总行数
    const totalRows = tableData.length
    
    // 计算起始行索引和结束行索引
    // 对于表头行特殊处理
    const isHeaderVisible = scrollTop < headerHeight
    let startIndex: number
    
    if (isHeaderVisible) {
      // 表头可见，从表头开始计算
      startIndex = 0
    } else {
      // 表头不可见，从内容行开始计算
      startIndex = Math.max(1, Math.floor((scrollTop - headerHeight) / rowHeight) + 1)
    }
    
    const visibleCount = Math.ceil(tableHeight / rowHeight) + overscanRows * 2
    const endIndex = Math.min(totalRows - 1, startIndex + visibleCount)
    
    // 计算Y轴偏移量（不包含表头）
    const contentOffsetY = Math.max(0, startIndex - 1) * rowHeight

    return {
      startIndex,
      endIndex,
      totalRows,
      visibleCount,
      contentOffsetY,
      isHeaderVisible,
    }
  }, [scrollTop, tableData, rowHeight, headerHeight, tableHeight, overscanRows])
  
  // 计算可见区域的列信息
  const visibleCols = useMemo(() => {
    // 没有数据时返回空状态
    if (!tableData || tableData.length === 0 || !tableData[0]) {
      return {
        startIndex: 0,
        endIndex: 0,
        totalCols: 0,
        offsetX: 0,
      }
    }

    const totalCols = tableData[0].length
    let accumulatedWidth = 0
    let startIndex = 0
    
    // 查找可见起始列
    for (let i = 0; i < totalCols; i++) {
      const colWidth = columnWidths?.[i] || defaultColumnWidth
      if (accumulatedWidth + colWidth > scrollLeft) {
        startIndex = Math.max(0, i - overscanCols)
        break
      }
      accumulatedWidth += colWidth
    }
    
    // 查找可见结束列
    let visibleWidth = 0
    let endIndex = startIndex
    
    while (endIndex < totalCols) {
      const colWidth = columnWidths?.[endIndex] || defaultColumnWidth
      if (visibleWidth + colWidth > tableWidthValue + overscanCols * defaultColumnWidth) {
        break
      }
      visibleWidth += colWidth
      endIndex++
    }
    
    endIndex = Math.min(totalCols - 1, endIndex + overscanCols)
    
    // 计算X轴偏移量
    let offsetX = 0
    for (let i = 0; i < startIndex; i++) {
      offsetX += columnWidths?.[i] || defaultColumnWidth
    }

    return {
      startIndex,
      endIndex,
      totalCols,
      offsetX,
    }
  }, [scrollLeft, tableData, tableWidthValue, columnWidths, defaultColumnWidth, overscanCols])

  // 获取表头数据
  const headerCells = useMemo(() => {
    if (!tableData || tableData.length === 0) return []
    return tableData[0]
  }, [tableData])
  
  // 计算表格总宽度
  const totalTableWidth = useMemo(() => {
    if (!headerCells || headerCells.length === 0) return 0
    
    let width = 0
    for (let i = 0; i < headerCells.length; i++) {
      width += columnWidths?.[i] || defaultColumnWidth
    }
    return width
  }, [headerCells, columnWidths, defaultColumnWidth])

  // 获取需要渲染的数据行
  const rowsToRender = useMemo(() => {
    if (!tableData || tableData.length === 0) return []
    
    const { startIndex, endIndex, isHeaderVisible } = visibleRows
    
    // 如果表头可见，确保包含表头行
    const adjustedStartIndex = isHeaderVisible ? 0 : startIndex
    
    return tableData.slice(adjustedStartIndex, endIndex + 1)
  }, [tableData, visibleRows])
  
  // 获取可见行的实际索引
  const getVisibleRowIndices = useMemo(() => {
    const { startIndex, endIndex, isHeaderVisible } = visibleRows
    const indices: number[] = []
    
    const adjustedStartIndex = isHeaderVisible ? 0 : startIndex
    for (let i = adjustedStartIndex; i <= endIndex; i++) {
      indices.push(i)
    }
    
    return indices
  }, [visibleRows])

  // 处理滚动事件
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
    setScrollLeft(e.currentTarget.scrollLeft)
  }, [])

  // 计算表格总高度
  const totalHeight = useMemo(() => {
    if (!tableData || tableData.length === 0) return 0
    return headerHeight + (tableData.length - 1) * rowHeight
  }, [tableData, rowHeight, headerHeight])
  
  // 清除缓存（在数据发生大变化时使用）
  useEffect(() => {
    if (tableData?.length !== undefined) {
      rowCacheRef.current.clear()
    }
  }, [tableData?.length])

  // 处理行点击
  const handleRowClick = useCallback(
    (rowIndex: number) => {
      if (onRowClick && tableData[rowIndex]) {
        onRowClick(rowIndex, tableData[rowIndex])
      }
    },
    [tableData, onRowClick]
  )

  // 直接使用传入的onCellClick处理函数
  const handleCellClick = useCallback(
    (rowIndex: number, colIndex: number) => {
      // 设置选中的单元格
      setSelectedCell({ row: rowIndex, col: colIndex });
      if (onCellClick && tableData && tableData[rowIndex] && tableData[rowIndex][colIndex] !== undefined) {
        onCellClick(rowIndex, colIndex, tableData[rowIndex][colIndex])
      }
    },
    [tableData, onCellClick]
  )

  // 渲染单元格内容
  const renderCell = useCallback(
    (value: string, rowIndex: number, colIndex: number, isHeader = false) => {
      if (cellRenderer) {
        // 传递选中状态给自定义渲染器
        const isSelected = selectedCell && selectedCell.row === rowIndex && selectedCell.col === colIndex;
        return cellRenderer(value, rowIndex, colIndex, isHeader, isSelected)
      }
      return value || ""
    },
    [cellRenderer, selectedCell]
  )
  
  // 获取列宽
  const getColumnWidth = (colIndex: number): number => {
    return columnWidths?.[colIndex] || defaultColumnWidth
  }

  // 渲染行（带缓存优化）
  const renderRow = useCallback(
    (actualRowIndex: number) => {
      const rowData = tableData[actualRowIndex]
      if (!rowData) return null
      
      const isHeader = actualRowIndex === 0
      const rowClasses = isHeader 
        ? "bg-gradient-to-r from-gray-50 to-blue-50 font-semibold sticky top-0 z-10"
        : "hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
      
      const computedHeight = isHeader ? headerHeight : rowHeight
      
      // 计算可见列数据
      const visibleCells = rowData.slice(visibleCols.startIndex, visibleCols.endIndex + 1)
      
      // 尝试从缓存获取行渲染结果
      const cacheKey = `${actualRowIndex}-${visibleCols.startIndex}-${visibleCols.endIndex}`
      
      // 如果缓存存在且数据没有变化，直接返回缓存结果
      if (rowCacheRef.current.has(cacheKey) && !isHeader) {
        return rowCacheRef.current.get(cacheKey)
      }
      
      const rowElement = (
        <tr 
          key={cacheKey}
          className={rowClasses}
          style={{ 
            height: `${computedHeight}px`,
            // 对于内容行，设置Y轴偏移
            transform: isHeader ? 'none' : `translateY(${visibleRows.contentOffsetY}px)`
          }}
          onClick={() => !isHeader && handleRowClick(actualRowIndex)}
        >
          {/* 左侧占位列，用于水平滚动 */}
          <td 
            style={{ 
              width: `${visibleCols.offsetX}px`, 
              height: 0, 
              padding: 0, 
              border: 'none' 
            }}
          ></td>
          
          {/* 可见列 */}
          {visibleCells.map((cell, renderColIndex) => {
            const actualColIndex = visibleCols.startIndex + renderColIndex
            const colWidth = getColumnWidth(actualColIndex)
            
            return (
              <td
                id={`cell-${actualRowIndex}-${actualColIndex}`}
                key={actualColIndex}
                className={`py-2 px-3 border-b border-gray-200 dark:border-gray-700 transition-all duration-200 ${isHeader ? 'text-gray-700 dark:text-gray-200' : 'text-gray-600 dark:text-gray-300'}`}
                style={{ width: `${colWidth}px`, minWidth: `${colWidth}px` }}
                onClick={(e) => {
                  e.stopPropagation()
                  handleCellClick(actualRowIndex, actualColIndex, cell)
                }}
              >
                {renderCell(cell, actualRowIndex, actualColIndex, isHeader)}
              </td>
            )
          })}
          
          {/* 右侧占位列，确保总宽度 */}
          <td 
            style={{ 
              width: `${totalTableWidth - visibleCols.offsetX - 
                (visibleCols.endIndex - visibleCols.startIndex + 1) * defaultColumnWidth}px`, 
              height: 0, 
              padding: 0, 
              border: 'none' 
            }}
          ></td>
        </tr>
      )
      
      // 将结果缓存（除了表头）
      if (!isHeader) {
        rowCacheRef.current.set(cacheKey, rowElement)
      }
      
      return rowElement
    },
    [rowHeight, headerHeight, handleRowClick, handleCellClick, renderCell, 
     tableData, visibleCols, visibleRows.contentOffsetY, totalTableWidth, getColumnWidth]
  )

  // 使用ResizeObserver监听容器大小变化
  useEffect(() => {
    const container = tableContainerRef.current
    if (!container) return

    const resizeObserver = new ResizeObserver(() => {
      // 强制重新计算可见区域
      setScrollTop(container.scrollTop)
    })

    resizeObserver.observe(container)
    return () => resizeObserver.disconnect()
  }, [])

  // 渲染空状态
  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-white dark:bg-gray-900">
      <div className="text-gray-400 dark:text-gray-500 mb-2">📊</div>
      <p className="text-gray-600 dark:text-gray-300 font-medium">暂无数据</p>
      <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">请导入数据或添加内容</p>
    </div>
  )

  return (
    <div 
      ref={tableContainerRef}
      className={`relative overflow-auto bg-white dark:bg-gray-900 ${className} transition-all duration-300`}
      onScroll={handleScroll}
      style={{ 
        maxHeight: tableHeight,
        width: tableWidth,
        // 优化滚动性能
        willChange: 'scroll-position',
        // 硬件加速
        transform: 'translateZ(0)',
      }}
    >
      {isFiltered && (
        <div className="absolute top-0 left-0 right-0 bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-4 py-2 border-b border-green-200 dark:border-green-800/30 z-30 shadow-sm">
          正在查看筛选后的结果，共 {tableData.length - 1} 行数据
        </div>
      )}
      
      {!tableData || tableData.length === 0 ? (
        renderEmptyState()
      ) : (
        <div className="relative bg-white dark:bg-gray-900">
          {/* 固定表头层 */}
          <div 
            className="sticky top-0 z-20 overflow-x-hidden" 
            style={{ height: headerHeight, backgroundColor: 'inherit' }}
          >
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr style={{ height: `${headerHeight}px` }}>
                  {/* 左侧占位列 */}
                  <td 
                    style={{ 
                      width: `${scrollLeft}px`, 
                      height: 0, 
                      padding: 0, 
                      border: 'none' 
                    }}
                  ></td>
                  
                  {/* 可见表头列 */}
                  {headerCells.slice(visibleCols.startIndex, visibleCols.endIndex + 1).map((cell, renderColIndex) => {
                    const actualColIndex = visibleCols.startIndex + renderColIndex
                    const colWidth = getColumnWidth(actualColIndex)
                    
                    return (
                      <th
                    id={`cell-0-${actualColIndex}`}
                    key={actualColIndex}
                    className="bg-gradient-to-r from-gray-50 dark:from-gray-800 to-blue-50 dark:to-blue-900/20 font-semibold py-2 px-3 border-b border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 transition-all duration-200"
                    style={{ width: `${colWidth}px`, minWidth: `${colWidth}px` }}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleCellClick(0, actualColIndex, cell)
                    }}
                  >
                    {renderCell(cell, 0, actualColIndex, true)}
                  </th>
                    )
                  })}
                  
                  {/* 右侧占位列 */}
                  <td 
                    style={{ 
                      width: `${totalTableWidth - scrollLeft - 
                        (visibleCols.endIndex - visibleCols.startIndex + 1) * defaultColumnWidth}px`, 
                      height: 0, 
                      padding: 0, 
                      border: 'none' 
                    }}
                  ></td>
                </tr>
              </thead>
            </table>
          </div>
          
          {/* 数据行容器 */}
          <div style={{ height: totalHeight - headerHeight }}>
            <table className="w-full text-sm border-collapse">
              <tbody>
                {/* 占位行，用于创建滚动条高度 */}
                <tr style={{ height: `${totalHeight}px` }}>
                  <td style={{ padding: 0, height: 0 }}></td>
                </tr>
                
                {/* 渲染可见内容行（不包含表头） */}
                {getVisibleRowIndices
                  .filter(index => index > 0) // 跳过表头行，因为已经单独渲染
                  .map(actualRowIndex => renderRow(actualRowIndex))
                }
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {/* 性能指示器 - 仅在开发环境显示 */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute bottom-2 right-2 text-xs text-gray-500 dark:text-gray-300 bg-white/80 dark:bg-gray-900/80 px-2 py-1 rounded-md backdrop-blur-sm">
          可见行: {visibleRows.endIndex - visibleRows.startIndex + 1}
          /{tableData?.length || 0}
        </div>
      )}
    </div>
  )
}

export default VirtualTable