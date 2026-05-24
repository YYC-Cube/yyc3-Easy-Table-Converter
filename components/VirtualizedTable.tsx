/**
 * @file 虚拟滚动表格组件
 * @description 支持百万行级数据的高性能虚拟滚动表格
 * @module components
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-22
 */

import React, { useMemo, useRef, useEffect, useState } from 'react';
import { FixedSizeGrid as Grid } from 'react-window';
import type { Column } from '@/types';

interface VirtualizedTableProps {
  columns: Column[];
  data: any[];
  height?: number;
  rowHeight?: number;
  headerHeight?: number;
  cellPadding?: string;
  onCellClick?: (rowIndex: number, columnIndex: number, value: any) => void;
}

export const VirtualizedTable: React.FC<VirtualizedTableProps> = ({
  columns,
  data,
  height = 600,
  rowHeight = 40,
  headerHeight = 45,
  cellPadding = 'px-4 py-2',
  onCellClick,
}) => {
  const gridRef = useRef<HTMLDivElement>(null);
  const [columnWidths, setColumnWidths] = useState<number[]>(
    columns.map(() => 150) // 默认列宽
  );

  // 计算总宽度
  const totalWidth = useMemo(() => {
    return columnWidths.reduce((sum, width) => sum + width, 0);
  }, [columnWidths]);

  // 动态调整列宽
  useEffect(() => {
    // 基于内容计算初始列宽
    const calculateColumnWidths = () => {
      const widths: number[] = [];
      
      columns.forEach((column, index) => {
        // 基于列标题长度设置最小宽度
        const titleWidth = column.title.length * 8 + 32; // 字符宽度 + 内边距
        
        // 可选：分析数据内容设置更合理的宽度
        // 这里可以进一步优化，实际项目中可以采样部分数据计算
        const minWidth = Math.max(titleWidth, 120);
        widths[index] = minWidth;
      });
      
      setColumnWidths(widths);
    };

    calculateColumnWidths();
  }, [columns]);

  // 渲染表头单元格
  const Header = ({ columnIndex, style }: { columnIndex: number; style: React.CSSProperties }) => {
    const column = columns[columnIndex];
    
    return (
      <div
        style={{
          ...style,
          display: 'flex',
          alignItems: 'center',
          borderBottom: '2px solid #e2e8f0',
          backgroundColor: '#f8fafc',
          fontWeight: 600,
          color: '#334155',
          fontSize: '0.875rem',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          position: 'relative',
          userSelect: 'none',
        }}
        className={cellPadding}
      >
        {column.title}
        {column.sortable && (
          <span className="ml-1 text-xs opacity-50">⇅</span>
        )}
        {/* 可以添加列宽调整手柄 */}
      </div>
    );
  };

  // 渲染数据单元格
  const Cell = ({ rowIndex, columnIndex, style }: { rowIndex: number; columnIndex: number; style: React.CSSProperties }) => {
    const column = columns[columnIndex];
    const row = data[rowIndex];
    const value = row[column.key];
    
    // 自定义单元格渲染
    const renderContent = () => {
      if (column.render) {
        return column.render(value, row, rowIndex);
      }
      
      // 基本类型处理
      if (value === null || value === undefined) {
        return <span className="text-gray-400">-</span>;
      }
      
      // 根据数据类型显示不同样式
      if (typeof value === 'number') {
        return <span className="text-right">{value.toLocaleString()}</span>;
      }
      
      if (typeof value === 'boolean') {
        return (
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {value ? '是' : '否'}
          </span>
        );
      }
      
      // 日期格式化
      if (value instanceof Date) {
        return <span>{value.toLocaleDateString()}</span>;
      }
      
      // 字符串截断
      const displayText = String(value);
      const maxLength = 100;
      const truncated = displayText.length > maxLength ? `${displayText.slice(0, maxLength)}...` : displayText;
      
      return (
        <div 
          className="truncate"
          title={displayText.length > maxLength ? displayText : undefined}
        >
          {truncated}
        </div>
      );
    };

    return (
      <div
        style={{
          ...style,
          display: 'flex',
          alignItems: 'center',
          borderBottom: '1px solid #e2e8f0',
          backgroundColor: rowIndex % 2 === 0 ? '#ffffff' : '#f8fafc',
          fontSize: '0.875rem',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
        className={`${cellPadding} hover:bg-indigo-50 transition-colors cursor-pointer`}
        onClick={() => onCellClick && onCellClick(rowIndex, columnIndex, value)}
      >
        {renderContent()}
      </div>
    );
  };

  return (
    <div className="relative border rounded-lg overflow-hidden bg-white shadow">
      {/* 表头网格 */}
      <Grid
        ref={gridRef}
        columnCount={columns.length}
        columnWidth={(index) => columnWidths[index]}
        height={height}
        rowCount={data.length + 1} // +1 for header
        rowHeight={(index) => (index === 0 ? headerHeight : rowHeight)}
        width="100%"
        overscanColumnCount={5}
        overscanRowCount={10}
      >
        {({ columnIndex, rowIndex, style }) => {
          if (rowIndex === 0) {
            return <Header columnIndex={columnIndex} style={style} />;
          }
          return <Cell columnIndex={columnIndex} rowIndex={rowIndex - 1} style={style} />;
        }}
      </Grid>
      
      {/* 数据统计信息 */}
      <div className="px-4 py-2 border-t bg-gray-50 text-xs text-gray-500">
        共 {data.length.toLocaleString()} 条数据
      </div>
      
      {/* 加载状态指示器（可扩展） */}
    </div>
  );
};

export default VirtualizedTable;