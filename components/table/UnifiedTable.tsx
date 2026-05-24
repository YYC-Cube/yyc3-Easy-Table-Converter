/**
 * @file 统一表格组件规范
 * @description 标准化项目中的表格组件使用规范
 * @module components/table/UnifiedTable
 * @author YYC
 * @version 1.0.0
 * @created 2026-02-23
 */

'use client';

import React, { useState, useMemo } from 'react';
import { 
  Table as UITable, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  ChevronUp, 
  ChevronDown, 
  ChevronsUpDown,
  Search,
  Download,
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
  Columns,
  Filter,
  X,
  RotateCcw
} from 'lucide-react';
import { useLanguage } from '@/hooks/useLanguage';

export interface TableColumn<T = any> {
  key: string;
  title: string;
  width?: string | number;
  minWidth?: string | number;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  filterable?: boolean;
  searchable?: boolean;
  render?: (value: any, row: T, index: number) => React.ReactNode;
  className?: string;
}

export interface UnifiedTableProps<T = any> {
  data: T[];
  columns: TableColumn<T>[];
  language?: 'zh' | 'en' | 'ja';
  
  // 功能开关
  enableSort?: boolean;
  enableFilter?: boolean;
  enableSearch?: boolean;
  enablePagination?: boolean;
  enableColumnToggle?: boolean;
  enableExport?: boolean;
  enableRefresh?: boolean;
  enableRowSelect?: boolean;
  enableEdit?: boolean;
  
  // 分页配置
  pageSize?: number;
  pageSizeOptions?: number[];
  
  // 样式配置
  striped?: boolean;
  bordered?: boolean;
  hoverable?: boolean;
  compact?: boolean;
  className?: string;
  
  // 回调
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  onSortChange?: (column: string, direction: 'asc' | 'desc' | null) => void;
  onFilterChange?: (filters: Record<string, any>) => void;
  onSearchChange?: (keyword: string) => void;
  onRowSelect?: (selectedRows: T[]) => void;
  onExport?: (data: T[]) => void;
  onRefresh?: () => void;
  onRowClick?: (row: T, index: number) => void;
  
  // i18n 自定义文案
  emptyText?: string;
  loadingText?: string;
  noDataText?: string;
}

type SortDirection = 'asc' | 'desc' | null;

export function UnifiedTable<T extends Record<string, any>>({
  data,
  columns,
  language: propLanguage,
  enableSort = true,
  enableFilter = false,
  enableSearch = false,
  enablePagination = true,
  enableColumnToggle = false,
  enableExport = false,
  enableRefresh = false,
  enableRowSelect = false,
  enableEdit = false,
  pageSize = 20,
  pageSizeOptions = [10, 20, 50, 100],
  striped = false,
  bordered = false,
  hoverable = true,
  compact = false,
  className = '',
  onPageChange,
  onPageSizeChange,
  onSortChange,
  onFilterChange,
  onSearchChange,
  onRowSelect,
  onExport,
  onRefresh,
  onRowClick,
  emptyText,
  loadingText,
  noDataText,
}: UnifiedTableProps<T>) {
  const { t, language: contextLanguage } = useLanguage();
  const language = propLanguage || contextLanguage;
  
  const [currentPage, setCurrentPage] = useState(1);
  const [currentPageSize, setCurrentPageSize] = useState(pageSize);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(columns.map(col => col.key))
  );
  
  const i18n = {
    emptyText: emptyText || t('table.emptyText') || '暂无数据',
    loadingText: loadingText || t('table.loadingText') || '加载中...',
    noDataText: noDataText || t('table.noDataText') || '没有找到匹配的数据',
    search: t('table.search') || '搜索',
    refresh: t('table.refresh') || '刷新',
    export: t('table.export') || '导出',
    columns: t('table.columns') || '列',
    previous: t('table.previous') || '上一页',
    next: t('table.next') || '下一页',
    page: t('table.page') || '第',
    pageOf: t('table.pageOf') || '页，共',
    rows: t('table.rows') || '行',
    selected: t('table.selected') || '已选择',
    ...(language === 'en' ? {
      emptyText: 'No Data',
      loadingText: 'Loading...',
      noDataText: 'No matching data found',
      search: 'Search',
      refresh: 'Refresh',
      export: 'Export',
      columns: 'Columns',
      previous: 'Previous',
      next: 'Next',
      page: 'Page',
      pageOf: 'of',
      rows: 'rows',
      selected: 'selected'
    } : {})
  };

  const filteredData = useMemo(() => {
    let result = [...data];
    
    if (searchKeyword && enableSearch) {
      const keyword = searchKeyword.toLowerCase();
      result = result.filter(row => 
        Object.values(row).some(value => 
          String(value).toLowerCase().includes(keyword)
        )
      );
    }
    
    return result;
  }, [data, searchKeyword, enableSearch]);

  const sortedData = useMemo(() => {
    if (!sortColumn || !sortDirection) return filteredData;
    
    return [...filteredData].sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];
      
      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;
      
      const comparison = aVal < bVal ? -1 : 1;
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, sortColumn, sortDirection]);

  const paginatedData = useMemo(() => {
    if (!enablePagination) return sortedData;
    
    const start = (currentPage - 1) * currentPageSize;
    const end = start + currentPageSize;
    return sortedData.slice(start, end);
  }, [sortedData, currentPage, currentPageSize, enablePagination]);

  const totalPages = Math.ceil(sortedData.length / currentPageSize);

  const handleSort = (columnKey: string) => {
    if (!enableSort) return;
    
    let newDirection: SortDirection;
    if (sortColumn === columnKey) {
      if (sortDirection === 'asc') newDirection = 'desc';
      else if (sortDirection === 'desc') newDirection = null;
      else newDirection = 'asc';
    } else {
      newDirection = 'asc';
    }
    
    setSortColumn(newDirection ? columnKey : null);
    setSortDirection(newDirection);
    onSortChange?.(columnKey, newDirection);
  };

  const handlePageChange = (page: number) => {
    const validPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(validPage);
    onPageChange?.(validPage);
  };

  const handlePageSizeChange = (newSize: number) => {
    setCurrentPageSize(newSize);
    setCurrentPage(1);
    onPageSizeChange?.(newSize);
  };

  const handleSearch = (keyword: string) => {
    setSearchKeyword(keyword);
    setCurrentPage(1);
    onSearchChange?.(keyword);
  };

  const handleRowSelect = (index: number) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedRows(newSelected);
    
    const selectedData = paginatedData.filter((_, i) => newSelected.has(i));
    onRowSelect?.(selectedData);
  };

  const handleExport = () => {
    onExport?.(sortedData);
  };

  const getSortIcon = (columnKey: string) => {
    if (sortColumn !== columnKey) {
      return <ChevronsUpDown className="w-4 h-4 opacity-30" />;
    }
    return sortDirection === 'asc' 
      ? <ChevronUp className="w-4 h-4" />
      : <ChevronDown className="w-4 h-4" />;
  };

  const toggleColumnVisibility = (columnKey: string) => {
    const newVisible = new Set(visibleColumns);
    if (newVisible.has(columnKey)) {
      if (newVisible.size > 1) {
        newVisible.delete(columnKey);
      }
    } else {
      newVisible.add(columnKey);
    }
    setVisibleColumns(newVisible);
  };

  const visibleColumnsList = columns.filter(col => visibleColumns.has(col.key));

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 工具栏 */}
      {(enableSearch || enableExport || enableRefresh || enableColumnToggle) && (
        <div className="flex flex-wrap items-center gap-2 pb-3 border-b">
          {enableSearch && (
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={i18n.search}
                value={searchKeyword}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-9"
              />
              {searchKeyword && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 p-0"
                  onClick={() => handleSearch('')}
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>
          )}
          
          <div className="flex items-center gap-2 ml-auto">
            {enableRefresh && (
              <Button variant="outline" size="sm" onClick={() => onRefresh?.()}>
                <RotateCcw className="w-4 h-4 mr-1" />
                {i18n.refresh}
              </Button>
            )}
            
            {enableExport && (
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="w-4 h-4 mr-1" />
                {i18n.export}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* 表格 */}
      <div className="rounded-md border">
        <UITable>
          <TableHeader>
            <TableRow>
              {enableRowSelect && (
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    checked={selectedRows.size === paginatedData.length && paginatedData.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedRows(new Set(paginatedData.map((_, i) => i)));
                        onRowSelect?.(paginatedData);
                      } else {
                        setSelectedRows(new Set());
                        onRowSelect?.([]);
                      }
                    }}
                    className="w-4 h-4"
                  />
                </TableHead>
              )}
              {visibleColumnsList.map((column) => (
                <TableHead
                  key={column.key}
                  style={{
                    width: column.width,
                    minWidth: column.minWidth,
                    textAlign: column.align || 'left'
                  }}
                  className={cn(
                    enableSort && column.sortable && 'cursor-pointer select-none',
                    column.className
                  )}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className={cn(
                    'flex items-center gap-1',
                    column.align === 'center' && 'justify-center',
                    column.align === 'right' && 'justify-end'
                  )}>
                    <span>{column.title}</span>
                    {enableSort && column.sortable && getSortIcon(column.key)}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={visibleColumnsList.length + (enableRowSelect ? 1 : 0)}
                  className="h-32 text-center text-muted-foreground"
                >
                  {i18n.noDataText}
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((row, rowIndex) => (
                <TableRow
                  key={rowIndex}
                  className={cn(
                    hoverable && 'hover:bg-muted/50',
                    striped && rowIndex % 2 === 1 && 'bg-muted/30',
                    selectedRows.has(rowIndex) && 'bg-primary/10',
                    onRowClick && 'cursor-pointer'
                  )}
                  onClick={() => onRowClick?.(row, rowIndex)}
                >
                  {enableRowSelect && (
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedRows.has(rowIndex)}
                        onChange={() => handleRowSelect(rowIndex)}
                        className="w-4 h-4"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </TableCell>
                  )}
                  {visibleColumnsList.map((column) => (
                    <TableCell
                      key={column.key}
                      style={{
                        textAlign: column.align || 'left'
                      }}
                      className={column.className}
                    >
                      {column.render 
                        ? column.render(row[column.key], row, rowIndex)
                        : row[column.key]
                      }
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </UITable>
      </div>

      {/* 分页 */}
      {enablePagination && totalPages > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-4 py-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{i18n.page} {currentPage} {i18n.pageOf} {totalPages} {i18n.pageOf}</span>
            <span className="text-muted-foreground/50">|</span>
            <span>{i18n.rows}:</span>
            <Select
              value={String(currentPageSize)}
              onValueChange={(value) => handlePageSizeChange(Number(value))}
            >
              <SelectTrigger className="w-20 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
            >
              <ChevronFirst className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            <div className="flex items-center gap-1 px-2">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? 'default' : 'ghost'}
                    size="sm"
                    className="w-8 h-8 p-0"
                    onClick={() => handlePageChange(pageNum)}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages}
            >
              <ChevronLast className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ');
}

export default UnifiedTable;
