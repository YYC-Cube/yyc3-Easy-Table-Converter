"use client"

import type React from "react"

import { useState, useEffect } from "react"
import type { CellPosition, SelectionRange } from "@/lib/types"
import { useLanguage } from "@/hooks/useLanguage"

export const useTableSelection = () => {
  const { t } = useLanguage()
  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set())
  const [selectionRange, setSelectionRange] = useState<SelectionRange | null>(null)
  const [isSelecting, setIsSelecting] = useState(false)
  const [lastClickedCell, setLastClickedCell] = useState<CellPosition | null>(null)

  const getCellKey = (row: number, col: number) => `${row}-${col}`

  const isCellSelected = (row: number, col: number) => {
    return selectedCells.has(getCellKey(row, col))
  }

  const handleCellClick = (row: number, col: number, e: React.MouseEvent) => {
    const cellPos = { row, col }

    if (e.ctrlKey || e.metaKey) {
      const cellKey = getCellKey(row, col)
      const newSelected = new Set(selectedCells)
      if (newSelected.has(cellKey)) {
        newSelected.delete(cellKey)
      } else {
        newSelected.add(cellKey)
      }
      setSelectedCells(newSelected)
      setSelectionRange(null)
    } else if (e.shiftKey && lastClickedCell) {
      const range = { start: lastClickedCell, end: cellPos }
      setSelectionRange(range)

      const newSelected = new Set<string>()
      const minRow = Math.min(range.start.row, range.end.row)
      const maxRow = Math.max(range.start.row, range.end.row)
      const minCol = Math.min(range.start.col, range.end.col)
      const maxCol = Math.max(range.start.col, range.end.col)

      for (let r = minRow; r <= maxRow; r++) {
        for (let c = minCol; c <= maxCol; c++) {
          newSelected.add(getCellKey(r, c))
        }
      }
      setSelectedCells(newSelected)
    } else {
      setSelectedCells(new Set([getCellKey(row, col)]))
      setSelectionRange(null)
      setLastClickedCell(cellPos)
    }
  }

  const handleCellMouseDown = (row: number, col: number, e: React.MouseEvent) => {
    if (!e.ctrlKey && !e.metaKey && !e.shiftKey) {
      setIsSelecting(true)
      setSelectionRange({ start: { row, col }, end: { row, col } })
      setSelectedCells(new Set([getCellKey(row, col)]))
    }
  }

  const handleCellMouseEnter = (row: number, col: number) => {
    if (isSelecting && selectionRange) {
      const newRange = { ...selectionRange, end: { row, col } }
      setSelectionRange(newRange)

      const newSelected = new Set<string>()
      const minRow = Math.min(newRange.start.row, newRange.end.row)
      const maxRow = Math.max(newRange.start.row, newRange.end.row)
      const minCol = Math.min(newRange.start.col, newRange.end.col)
      const maxCol = Math.max(newRange.start.col, newRange.end.col)

      for (let r = minRow; r <= maxRow; r++) {
        for (let c = minCol; c <= maxCol; c++) {
          newSelected.add(getCellKey(r, c))
        }
      }
      setSelectedCells(newSelected)
    }
  }

  const handleMouseUp = () => {
    setIsSelecting(false)
  }

  const clearSelection = () => {
    setSelectedCells(new Set())
    setSelectionRange(null)
  }

  const getSelectedCellsInfo = () => {
    if (selectedCells.size === 0) return ""
    if (selectedCells.size === 1) return t("selection.single")
    return `${selectedCells.size}${t("selection.multiple")}`
  }

  useEffect(() => {
    document.addEventListener("mouseup", handleMouseUp)
    return () => document.removeEventListener("mouseup", handleMouseUp)
  }, [])

  return {
    selectedCells,
    selectionRange,
    isSelecting,
    lastClickedCell,
    isCellSelected,
    handleCellClick,
    handleCellMouseDown,
    handleCellMouseEnter,
    clearSelection,
    getSelectedCellsInfo,
  }
}
