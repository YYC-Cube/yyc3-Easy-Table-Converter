/**
 * @file 键盘快捷键Hook
 * @description 处理表格组件的键盘导航和操作快捷键
 * @module hooks/useKeyboardShortcuts
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-16
 */

import { useEffect, useCallback, useRef } from 'react';

interface UseKeyboardShortcutsProps {
  /** 当前选中的单元格位置 */
  selectedCell: { row: number; col: number } | null;
  /** 设置选中单元格的函数 */
  setSelectedCell: (cell: { row: number; col: number } | null) => void;
  /** 表格数据 */
  data: string[][];
  /** 编辑单元格的回调 */
  onEdit: (row: number, col: number) => void;
  /** 保存编辑的回调 */
  onSave: (e?: any) => void;
  /** 取消编辑的回调 */
  onCancel: (e?: any) => void;
}

/**
 * 键盘快捷键Hook - 处理表格组件的键盘导航和操作
 */
export const useKeyboardShortcuts = ({
  selectedCell,
  setSelectedCell,
  data,
  onEdit,
  onSave,
  onCancel,
}: UseKeyboardShortcutsProps) => {
  // 从数据中计算行数和列数
  const rowCount = data?.length || 0;
  const colCount = rowCount > 0 ? (data[0]?.length || 0) : 0;
  // 键盘事件引用，用于后续清理
  const keyboardEventRef = useRef<(e: KeyboardEvent) => void>();

  // 处理键盘导航
  const handleNavigation = useCallback((e: KeyboardEvent) => {
    // 优化：确保表格有数据才处理导航
    if (!selectedCell || rowCount === 0 || colCount === 0) {
      // 如果按了方向键但没有选中任何单元格，默认选中第一个单元格
      if (rowCount > 0 && colCount > 0 && (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
        e.preventDefault();
        setSelectedCell({ row: 0, col: 0 });
      }
      return;
    }

    const { row: currentRow, col: currentCol } = selectedCell;
    let newRow = currentRow;
    let newCol = currentCol;

    // 根据不同的按键确定新的位置
    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        newRow = Math.max(0, currentRow - 1);
        break;
      case 'ArrowDown':
        e.preventDefault();
        newRow = Math.min(rowCount - 1, currentRow + 1);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        newCol = Math.max(0, currentCol - 1);
        break;
      case 'ArrowRight':
        e.preventDefault();
        newCol = Math.min(colCount - 1, currentCol + 1);
        break;
      // 添加Page Up/Page Down支持
      case 'PageUp':
        e.preventDefault();
        // 向上翻页（大约10行）
        newRow = Math.max(0, currentRow - 10);
        break;
      case 'PageDown':
        e.preventDefault();
        // 向下翻页（大约10行）
        newRow = Math.min(rowCount - 1, currentRow + 10);
        break;
      // 添加Home/End键支持
      case 'Home':
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          newCol = 0;
        }
        break;
      case 'End':
        if (!e.ctrlKey && !e.metaKey) {
          e.preventDefault();
          newCol = colCount - 1;
        }
        break;
      default:
        return;
    }

    // 设置新选中的单元格
    setSelectedCell({ row: newRow, col: newCol });
    
    // 优化：尝试聚焦到选中的单元格（需要单元格元素有ID）
    setTimeout(() => {
      const cellElement = document.getElementById(`cell-${newRow}-${newCol}`);
      if (cellElement) {
        cellElement.focus({ preventScroll: true });
      }
    }, 0);
  }, [selectedCell, rowCount, colCount, setSelectedCell]);

  // 处理键盘操作
  const handleActions = useCallback((e: KeyboardEvent) => {
    // 如果没有选中的单元格，部分操作无法执行
    if (!selectedCell || rowCount === 0 || colCount === 0) return;

    const { row, col } = selectedCell;
    
    // 安全检查：确保行和列在有效范围内
    if (row < 0 || row >= rowCount || col < 0 || col >= colCount) return;

    // 编辑模式切换
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      // 优化：确保单元格存在数据
      if (data[row] && data[row][col] !== undefined) {
        onEdit(row, col);
      }
      return;
    }

    // 保存编辑 (Enter键在编辑模式下)
    if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault();
      onSave(e);
      return;
    }

    // 取消编辑 (Escape键)
    if (e.key === 'Escape') {
      e.preventDefault();
      onCancel(e);
      // 优化：取消编辑后重新选中单元格
      setTimeout(() => {
        const cellElement = document.getElementById(`cell-${row}-${col}`);
        if (cellElement) {
          cellElement.focus({ preventScroll: true });
        }
      }, 0);
      return;
    }

    // 复制粘贴操作 (Ctrl/Cmd + C/V)
    if (e.ctrlKey || e.metaKey) {
      // 优化：防止在输入框中时触发
      const activeElement = document.activeElement;
      if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case 'c':
          e.preventDefault();
          try {
            // 尝试使用剪贴板API复制内容
            if (navigator.clipboard && data[row] && data[row][col] !== undefined) {
              navigator.clipboard.writeText(data[row][col]).catch(err => {
                console.error('复制失败:', err);
              });
            }
          } catch (err) {
            console.error('复制操作异常:', err);
          }
          break;
        case 'v':
          e.preventDefault();
          try {
            // 尝试使用剪贴板API粘贴内容
            if (navigator.clipboard) {
              navigator.clipboard.readText().then(text => {
                console.log('粘贴内容:', text, '到单元格:', row, col);
                // 这里可以调用更新单元格内容的方法
              }).catch(err => {
                console.error('粘贴失败:', err);
              });
            }
          } catch (err) {
            console.error('粘贴操作异常:', err);
          }
          break;
        case 'a':
          e.preventDefault();
          console.log('选中所有单元格');
          break;
      }
    }

    // 删除键 (Delete/Backspace) - 删除单元格内容
    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      console.log('删除单元格内容:', row, col);
      // 可以添加删除单元格内容的逻辑
    }
  }, [selectedCell, data, onEdit, onSave, onCancel, rowCount, colCount]);

  // 键盘事件处理主函数
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // 阻止默认行为并处理快捷键
    handleNavigation(e);
    handleActions(e);
  }, [handleNavigation, handleActions]);

  // 设置和清理键盘事件监听
  useEffect(() => {
    // 保存事件处理函数引用
    keyboardEventRef.current = handleKeyDown;
    
    // 添加事件监听器
    document.addEventListener('keydown', handleKeyDown);

    // 清理函数
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // 暴露一些辅助方法
  return {
    // 手动触发键盘事件的方法（用于测试或特殊情况）
    triggerKeyDown: useCallback((key: string, options: { ctrlKey?: boolean; metaKey?: boolean; shiftKey?: boolean } = {}) => {
      const event = new KeyboardEvent('keydown', {
        key,
        ...options,
      });
      keyboardEventRef.current?.(event);
    }, []),
  };
};
