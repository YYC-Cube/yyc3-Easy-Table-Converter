export type SortDirection = "asc" | "desc" | "none"

export interface CellPosition {
  row: number
  col: number
}

export interface SelectionRange {
  start: CellPosition
  end: CellPosition
}

export interface HistoryState {
  tableData: string[][]
  inputData: string
  timestamp: number
}

export interface Format {
  value: string
  label: string
  icon: string
  extension: string
  mimeType: string
}

export interface ConverterTool {
  id: string
  title: string
  description: string
  icon: string
  path: string
  category: "data" | "image" | "text" | "color" | "unit" | "pdf"
}

export interface ImageFormat {
  value: string
  label: string
  mimeType: string
  extension: string
}

export interface ColorFormat {
  hex: string
  rgb: { r: number; g: number; b: number }
  hsl: { h: number; s: number; l: number }
}

export interface UnitConversion {
  category: string
  units: { value: string; label: string; ratio: number }[]
}
