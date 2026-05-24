"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Filter, Undo, Redo, ZoomIn, ZoomOut, Maximize2 } from "lucide-react"
import { TableView } from "./TableView"
import { useTableSelection } from "@/hooks/useTableSelection"
import { useLanguage } from "@/hooks/useLanguage"

type SortDirection = "asc" | "desc" | "none"
type CellPosition = { row: number; col: number }
type SelectionRange = { start: CellPosition; end: CellPosition }

interface PreviewPanelProps {
  tableData: string[][]
  setTableData: (data: string[][]) => void
  updateInputData: (data: string[][]) => string
  saveToHistory: (tableData: string[][], inputData: string) => void
  handleUndo: () => void
  handleRedo: () => void
  historyIndex: number
  historyLength: number
  isTableExpanded: boolean
  onTableExpand: () => void
  inputData: string
  selectedFormat: string
  parseInputData: (data: string, format: string) => string[][]
  sortColumn: number | null
  sortDirection: SortDirection
  onSort: (col: number, direction: SortDirection) => void
  draggedRowIndex: number | null
  draggedColumnIndex: number | null
  onDragStartRow: (index: number) => void
  onDragStartColumn: (index: number) => void
  onDragEnd: () => void
  onDropRow: (from: number, to: number) => void
  onDropColumn: (from: number, to: number) => void
  editingCell: CellPosition | null
  editingValue: string
  onCellEditStart: (row: number, col: number) => void
  onCellEditChange: (value: string) => void
  onCellEditEnd: () => void
  selectedCells: Set<string>
  selectionRange: SelectionRange | null
  isSelecting: boolean
  lastClickedCell: CellPosition | null
  onCellClick: (row: number, col: number) => void
  onSelectStart: (row: number, col: number) => void
  onSelectUpdate: (row: number, col: number) => void
  onSelectEnd: () => void
  tableScale: number
  setTableScale: (scale: number) => void
  editInputRef: React.RefObject<HTMLInputElement>
}

export const PreviewPanel = ({
  tableData,
  setTableData,
  updateInputData,
  saveToHistory,
  handleUndo,
  handleRedo,
  historyIndex,
  historyLength,
  isTableExpanded,
  onTableExpand,
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
  selectedCells,
  selectionRange,
  isSelecting,
  lastClickedCell,
  onCellClick,
  onSelectStart,
  onSelectUpdate,
  onSelectEnd,
  tableScale,
  setTableScale,
  editInputRef,
}: PreviewPanelProps) => {
  const [filterText, setFilterText] = useState("")
  const { getSelectedCellsInfo } = useTableSelection()
  const { t } = useLanguage()

  const handleTableZoomIn = () => {
    setTableScale((prev) => Math.min(prev + 0.2, 2.0))
  }

  const handleTableZoomOut = () => {
    setTableScale((prev) => Math.max(prev - 0.2, 0.6))
  }

  const filteredData = tableData.filter((row) =>
    row.some((cell) => cell.toLowerCase().includes(filterText.toLowerCase())),
  )

  return (
    <>
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleUndo}
            disabled={historyIndex <= 0}
            className="bg-gradient-to-r from-gray-500 to-gray-600 text-white border-0 hover:from-gray-600 hover:to-gray-700 shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
          >
            <Undo className="w-4 h-4 mr-2" />
            {t("buttons.undo")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRedo}
            disabled={historyIndex >= historyLength - 1}
            className="bg-gradient-to-r from-gray-500 to-gray-600 text-white border-0 hover:from-gray-600 hover:to-gray-700 shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
          >
            <Redo className="w-4 h-4 mr-2" />
            {t("buttons.redo")}
          </Button>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleTableZoomOut}
            className="bg-gradient-to-r from-gray-500 to-gray-600 text-white border-0 hover:from-gray-600 hover:to-gray-700 shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <ZoomOut className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleTableZoomIn}
            className="bg-gradient-to-r from-gray-500 to-gray-600 text-white border-0 hover:from-gray-600 hover:to-gray-700 shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onTableExpand}
            className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 hover:from-purple-600 hover:to-pink-600 shadow-lg hover:shadow-xl transition-all duration-200"
          >
            <Maximize2 className="w-4 h-4 mr-2" />
            {t("buttons.expandTable")}
          </Button>
        </div>
      </div>

      {filteredData.length > 0 && (
        <TableView
        filteredData={filteredData}
        tableData={tableData}
        setTableData={setTableData}
        updateInputData={updateInputData}
        saveToHistory={saveToHistory}
        tableScale={tableScale}
        isTableExpanded={isTableExpanded}
        inputData={inputData}
        selectedFormat={selectedFormat}
        parseInputData={parseInputData}
        sortColumn={sortColumn}
        sortDirection={sortDirection}
        onSort={onSort}
        draggedRowIndex={draggedRowIndex}
        draggedColumnIndex={draggedColumnIndex}
        onDragStartRow={onDragStartRow}
        onDragStartColumn={onDragStartColumn}
        onDragEnd={onDragEnd}
        onDropRow={onDropRow}
        onDropColumn={onDropColumn}
        editingCell={editingCell}
        editingValue={editingValue}
        onCellEditStart={onCellEditStart}
        onCellEditChange={onCellEditChange}
        onCellEditEnd={onCellEditEnd}
        selectedCells={selectedCells}
        selectionRange={selectionRange}
        isSelecting={isSelecting}
        lastClickedCell={lastClickedCell}
        onCellClick={onCellClick}
        onSelectStart={onSelectStart}
        onSelectUpdate={onSelectUpdate}
        onSelectEnd={onSelectEnd}
        editInputRef={editInputRef}
      />
      )}
    </>
  )
}
