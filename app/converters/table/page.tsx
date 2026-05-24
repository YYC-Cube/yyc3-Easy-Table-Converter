"use client"

import { useState, useMemo } from "react"
import type React from "react"

import { useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TooltipProvider } from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"
import { Zap, FileText, X, ArrowLeft, Search } from "lucide-react"
import Link from "next/link"

import { Header } from "@/components/Header"
import { StepBar } from "@/components/StepBar"
import { InputPanel } from "@/components/InputPanel"
import { HowToUse } from "@/components/HowToUse"

import { useTableParsers } from "@/hooks/useTableParsers"
import { useTableHistory } from "@/hooks/useTableHistory"
import { useTableSelection } from "@/hooks/useTableSelection"
import { useLanguage } from "@/hooks/useLanguage"

import { sampleData } from "@/lib/constants/sampleData"
import { formats } from "@/lib/constants/formats"
import { generateOutput } from "@/lib/formatGenerators"

import { PreviewPanel } from "@/components/PreviewPanel"
import { OutputPanel } from "@/components/OutputPanel"

type SortDirection = "asc" | "desc" | "none"
type CellPosition = { row: number; col: number }
type SelectionRange = { start: CellPosition; end: CellPosition }

// HistoryState 接口已移除（未使用）

export default function TableConverter() {
  const { t } = useLanguage()
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedFormat, setSelectedFormat] = useState("csv")
  const [inputData, setInputData] = useState("")
  const [activeTab, setActiveTab] = useState("input")
  const [filterText, setFilterText] = useState("")
  const [outputFormat, setOutputFormat] = useState("csv")
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(100) // 默认每页显示100行
  const [tableData, setTableData] = useState<string[][]>([])
  const [sortColumn, setSortColumn] = useState<number | null>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>("none")
  const [draggedRowIndex, setDraggedRowIndex] = useState<number | null>(null)
  const [draggedColumnIndex, setDraggedColumnIndex] = useState<number | null>(null)
  const [copiedFormat, setCopiedFormat] = useState<string | null>(null)
  const [editingCell, setEditingCell] = useState<CellPosition | null>(null)
  const [editingValue, setEditingValue] = useState("")

  const [selectedCells, setSelectedCells] = useState<Set<string>>(new Set())
  const [selectionRange, setSelectionRange] = useState<SelectionRange | null>(null)
  const [isSelecting, setIsSelecting] = useState(false)
  const [lastClickedCell, setLastClickedCell] = useState<CellPosition | null>(null)

  const [tableScale, setTableScale] = useState(1)

  const editInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const [isTableExpanded, setIsTableExpanded] = useState(false)

  const { parseInputData } = useTableParsers()
  const { saveToHistory, clearHistory, historyIndex, history, isUndoRedoOperation } =
    useTableHistory()
  const { clearSelection } = useTableSelection()

  const updateInputData = (data: string[][]) => {
    const newInputData = data.map((row) => row.join(",")).join("\n")
    setInputData(newInputData)
    return newInputData
  }

  const handleSampleData = () => {
    const sample = sampleData[selectedFormat as keyof typeof sampleData] || sampleData.csv
    const newTableData = parseInputData(sample, selectedFormat)
    setInputData(sample)
    setCurrentStep(2)
    setTableData(newTableData)
    saveToHistory(newTableData, sample)
  }

  const handleClear = () => {
    setInputData("")
    setTableData([])
    setCurrentStep(1)
    clearSelection()
    clearHistory()
    setIsTableExpanded(false)
    setSortColumn(null)
    setSortDirection("none")
    setEditingCell(null)
    setSelectedCells(new Set())
    setSelectionRange(null)
    setTableScale(1)
  }

  const detectDataFormat = (data: string): string => {
    // 尝试识别JSON
    if ((data.startsWith('{') && data.endsWith('}')) || 
        (data.startsWith('[') && data.endsWith(']'))) {
      try {
        JSON.parse(data)
        return 'json'
      } catch {}
    }
    
    // 尝试识别XML
    if (data.trim().startsWith('<?xml') || 
        data.includes('<record>') || 
        data.includes('<data>')) {
      try {
        if (typeof window !== 'undefined') {
          const parser = new window.DOMParser()
          parser.parseFromString(data, 'text/xml')
        }
        return 'xml'
      } catch {}
    }
    
    // 识别Markdown表格
    if (data.includes('|') && data.includes('---')) {
      return 'markdown'
    }
    
    // 识别HTML表格
    if (data.includes('<table>') && data.includes('</table>')) {
      return 'html'
    }
    
    // 识别SQL
    if (data.trim().toLowerCase().startsWith('insert into') || 
        data.trim().toLowerCase().startsWith('create table')) {
      return 'sql'
    }
    
    // 识别YAML
    if (data.includes('- ') && data.includes(':')) {
      return 'yaml'
    }
    
    // 识别TSV
    if (data.includes('\t')) {
      return 'tsv'
    }
    
    // 默认CSV
    return 'csv'
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const data = e.target?.result as string
        // 自动检测数据格式
        const detectedFormat = detectDataFormat(data)
        setSelectedFormat(detectedFormat)
        
        toast({
          title: t('messages.formatDetected'),
          description: `${t('messages.detectedAs')} ${formats.find((f) => f.value === detectedFormat)?.label}`,
        })
        
        const newTableData = parseInputData(data, detectedFormat)
        setInputData(data)
        setCurrentStep(2)
        setTableData(newTableData)
        saveToHistory(newTableData, data)
      }
      reader.readAsText(file)
    }
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    if (value === "preview" && inputData) {
      setCurrentStep(3)
    }
  }

  const handleInputChange = (value: string) => {
    const newTableData = value ? parseInputData(value, selectedFormat) : []
    setInputData(value)
    if (value) {
      setCurrentStep(2)
      setTableData(newTableData)
    } else {
      setTableData([])
      setCurrentStep(1)
    }
    if (!isUndoRedoOperation) {
      saveToHistory(newTableData, value)
    }
    // 重置分页和过滤
    setCurrentPage(1)
    setFilterText('')
  }

  // 过滤和分页数据
  const filteredAndPaginatedData = useMemo(() => {
    let filtered = tableData
    
    // 过滤逻辑
    if (filterText) {
      const lowerFilterText = filterText.toLowerCase()
      filtered = tableData.filter(row => 
        row.some(cell => 
          String(cell).toLowerCase().includes(lowerFilterText)
        )
      )
    }
    
    // 分页逻辑
    const startIndex = (currentPage - 1) * rowsPerPage
    const endIndex = startIndex + rowsPerPage
    return filtered.slice(startIndex, endIndex)
  }, [tableData, filterText, currentPage, rowsPerPage])

  // 计算总页数
  const totalPages = Math.ceil(tableData.length / rowsPerPage)

  // 处理页面变化
  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) {
      setCurrentPage(newPage)
    }
  }

  // 处理过滤文本变化
  const handleFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setFilterText(event.target.value)
    setCurrentPage(1) // 重置到第一页
  }

  const handleCopy = async (format: string) => {
    const output = generateOutput(format, tableData)
    try {
      await navigator.clipboard.writeText(output)
      setCopiedFormat(format)
      toast({
        title: t("messages.copied"),
        description: `${formats.find((f) => f.value === format)?.label}${t("messages.copiedDesc")}`,
      })
      setTimeout(() => setCopiedFormat(null), 2000)
    } catch (err) {
      toast({
        title: t("messages.copyFailed"),
        description: t("messages.copyFailedDesc"),
        variant: "destructive",
      })
    }
  }

  const handleDownload = (format: string) => {
    const output = generateOutput(format, tableData)
    const formatInfo = formats.find((f) => f.value === format)
    if (!formatInfo) return

    const blob = new Blob([output], { type: formatInfo.mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `table_data.${formatInfo.extension}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast({
      title: t("messages.downloaded"),
      description: `${formatInfo.label}${t("messages.downloadedDesc")}`,
    })
  }

  const handleTableExpand = () => {
    setIsTableExpanded(!isTableExpanded)
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        {/* 动画背景 */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-r from-pink-400/20 to-orange-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-r from-green-400/20 to-blue-400/20 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>

        <div className="relative z-10 p-4">
          <div className="max-w-7xl mx-auto">
            {/* 返回按钮 */}
            {!isTableExpanded && (
              <Link href="/">
                <Button variant="outline" className="mb-4 bg-white/90 backdrop-blur-sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {t("buttons.backToHome")}
                </Button>
              </Link>
            )}

            {!isTableExpanded && (
              <>
                <Header />
                <StepBar currentStep={currentStep} />
              </>
            )}

            <div className={isTableExpanded ? "space-y-4" : "grid grid-cols-1 lg:grid-cols-2 gap-8"}>
              <Card
                className={`bg-white/90 backdrop-blur-sm border-white/20 shadow-2xl hover:shadow-3xl transition-all duration-300 ${
                  isTableExpanded ? "h-[calc(100vh-2rem)]" : ""
                }`}
              >
                <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-100">
                  <CardTitle className="flex items-center gap-3 text-xl font-bold text-gray-800">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                      <FileText className="w-4 h-4 text-white" />
                    </div>
                    {t("panels.input")}
                    {isTableExpanded && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleTableExpand}
                        className="ml-auto bg-gradient-to-r from-gray-500 to-gray-600 text-white border-0 hover:from-gray-600 hover:to-gray-700"
                      >
                        <X className="w-4 h-4 mr-2" />
                        {t("buttons.close")}
                      </Button>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className={`p-6 ${isTableExpanded ? "h-[calc(100%-5rem)] overflow-hidden" : ""}`}>
                  <Tabs value={activeTab} onValueChange={handleTabChange}>
                    <TabsList className="grid w-full grid-cols-2 bg-gray-100 p-1 rounded-xl">
                      <TabsTrigger
                        value="input"
                        className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md transition-all duration-200"
                      >
                        {t("panels.inputTab")}
                      </TabsTrigger>
                      <TabsTrigger
                        value="preview"
                        disabled={!inputData}
                        className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md transition-all duration-200 disabled:opacity-50"
                      >
                        {t("panels.previewTab")}
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="input" className="space-y-6 mt-6">
                      <InputPanel
                        selectedFormat={selectedFormat}
                        setSelectedFormat={setSelectedFormat}
                        inputData={inputData}
                        onInputChange={handleInputChange}
                        onSampleData={handleSampleData}
                        onClear={handleClear}
                        onFileUpload={handleFileUpload}
                      />
                    </TabsContent>

                    <TabsContent
                      value="preview"
                      className={`space-y-6 mt-6 ${isTableExpanded ? "h-[calc(100%-4rem)]" : ""}`}
                    >
                      {/* 搜索和分页控件 */}
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
                        <div className="relative w-full sm:w-64">
                          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <input
                            type="text"
                            placeholder={t('messages.searchTable')}
                            value={filterText}
                            onChange={handleFilterChange}
                            className="w-full pl-10 h-10 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            {t('messages.rowsPerPage')}:
                          </span>
                          <select
                            value={rowsPerPage}
                            onChange={(e) => setRowsPerPage(Number(e.target.value))}
                            className="h-10 border rounded-md px-2 focus:outline-none focus:ring-2 focus:ring-primary"
                          >
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                            <option value={200}>200</option>
                            <option value={500}>500</option>
                            <option value={1000}>1000</option>
                          </select>
                        </div>
                      </div>
                       
                      <PreviewPanel
                  tableData={filteredAndPaginatedData}
                  setTableData={setTableData}
                  updateInputData={updateInputData}
                  saveToHistory={saveToHistory}
                  handleUndo={() => {
                    const prevState = useTableHistory().handleUndo()
                    if (prevState) {
                      setTableData(prevState.tableData)
                      setInputData(prevState.inputData)
                      clearSelection()
                    }
                  }}
                  handleRedo={() => {
                    const nextState = useTableHistory().handleRedo()
                    if (nextState) {
                      setTableData(nextState.tableData)
                      setInputData(nextState.inputData)
                      clearSelection()
                    }
                  }}
                  historyIndex={historyIndex}
                  historyLength={history.length}
                  isTableExpanded={isTableExpanded}
                  onTableExpand={handleTableExpand}
                  inputData={inputData}
                  selectedFormat={selectedFormat}
                  parseInputData={parseInputData}
                  sortColumn={sortColumn}
                  sortDirection={sortDirection}
                  onSort={(col: number, direction: SortDirection) => {
                    setSortColumn(col)
                    setSortDirection(direction)
                  }}
                  draggedRowIndex={draggedRowIndex}
                  draggedColumnIndex={draggedColumnIndex}
                  onDragStartRow={(index: number) => setDraggedRowIndex(index)}
                  onDragStartColumn={(index: number) => setDraggedColumnIndex(index)}
                  onDragEnd={() => {
                    setDraggedRowIndex(null)
                    setDraggedColumnIndex(null)
                  }}
                  onDropRow={(from: number, to: number) => {
                    // 调整from索引，考虑当前页码
                    const actualFrom = from + (currentPage - 1) * rowsPerPage
                    // 计算实际的to索引
                    let actualTo = to + (currentPage - 1) * rowsPerPage
                    // 如果拖动到边界外，调整位置
                    if (actualTo < 0) actualTo = 0
                    if (actualTo >= tableData.length) actualTo = tableData.length - 1
                    
                    const newData = [...tableData]
                    const [removed] = newData.splice(actualFrom, 1)
                    newData.splice(actualTo, 0, removed)
                    setTableData(newData)
                    updateInputData(newData)
                    saveToHistory(newData, updateInputData(newData))
                  }}
                  onDropColumn={(from: number, to: number) => {
                    const newData = tableData.map(row => {
                      const newRow = [...row]
                      const [removed] = newRow.splice(from, 1)
                      newRow.splice(to, 0, removed)
                      return newRow
                    })
                    setTableData(newData)
                    updateInputData(newData)
                    saveToHistory(newData, updateInputData(newData))
                  }}
                  editingCell={editingCell}
                  editingValue={editingValue}
                  onCellEditStart={(row: number, col: number) => {
                    setEditingCell({ row, col })
                    setEditingValue(filteredAndPaginatedData[row]?.[col] || '')
                    setTimeout(() => editInputRef.current?.focus(), 0)
                  }}
                  onCellEditChange={setEditingValue}
                  onCellEditEnd={() => {
                    if (editingCell) {
                      // 计算实际行索引
                      const actualRow = editingCell.row + (currentPage - 1) * rowsPerPage
                      const newData = [...tableData]
                      newData[actualRow] = [...newData[actualRow]]
                      newData[actualRow][editingCell.col] = editingValue
                      setTableData(newData)
                      updateInputData(newData)
                      saveToHistory(newData, updateInputData(newData))
                    }
                    setEditingCell(null)
                  }}
                  selectedCells={selectedCells}
                  selectionRange={selectionRange}
                  isSelecting={isSelecting}
                  lastClickedCell={lastClickedCell}
                  onCellClick={(row: number, col: number) => {
                    setLastClickedCell({ row, col })
                  }}
                  onSelectStart={(row: number, col: number) => {
                    setIsSelecting(true)
                    setSelectionRange({
                      start: { row, col },
                      end: { row, col }
                    })
                    const newSelectedCells = new Set<string>()
                    newSelectedCells.add(`${row},${col}`)
                    setSelectedCells(newSelectedCells)
                  }}
                  onSelectUpdate={(row: number, col: number) => {
                    if (lastClickedCell) {
                      setSelectionRange({
                        start: lastClickedCell,
                        end: { row, col }
                      })
                      const newSelectedCells = new Set<string>()
                      const minRow = Math.min(lastClickedCell.row, row)
                      const maxRow = Math.max(lastClickedCell.row, row)
                      const minCol = Math.min(lastClickedCell.col, col)
                      const maxCol = Math.max(lastClickedCell.col, col)
                      for (let r = minRow; r <= maxRow; r++) {
                        for (let c = minCol; c <= maxCol; c++) {
                          newSelectedCells.add(`${r},${c}`)
                        }
                      }
                      setSelectedCells(newSelectedCells)
                    }
                  }}
                  onSelectEnd={() => {
                    setIsSelecting(false)
                  }}
                  tableScale={tableScale}
                  setTableScale={setTableScale}
                  editInputRef={editInputRef}
                />
                       
                      {/* 分页控制 */}
                      {totalPages > 1 && (
                        <div className="mt-4 flex justify-between items-center">
                          <div className="text-sm text-muted-foreground">
                            {t('messages.showing')} {Math.min((currentPage - 1) * rowsPerPage + 1, tableData.length)} - {Math.min(currentPage * rowsPerPage, tableData.length)} {t('messages.of')} {tableData.length} {t('messages.entries')}
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handlePageChange(currentPage - 1)}
                              disabled={currentPage === 1}
                            >
                              {t('messages.prev')}
                            </Button>
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                              let pageNum
                              if (totalPages <= 5) {
                                pageNum = i + 1
                              } else if (currentPage <= 3) {
                                pageNum = i + 1
                              } else if (currentPage >= totalPages - 2) {
                                pageNum = totalPages - 4 + i
                              } else {
                                pageNum = currentPage - 2 + i
                              }
                              return (
                                <Button
                                  key={pageNum}
                                  variant={currentPage === pageNum ? "default" : "ghost"}
                                  size="sm"
                                  onClick={() => handlePageChange(pageNum)}
                                  className="w-9 h-9 p-0"
                                >
                                  {pageNum}
                                </Button>
                              )
                            })}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handlePageChange(currentPage + 1)}
                              disabled={currentPage === totalPages}
                            >
                              {t('messages.next')}
                            </Button>
                          </div>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>

              {!isTableExpanded && (
                <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-2xl hover:shadow-3xl transition-all duration-300">
                  <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b border-gray-100">
                    <CardTitle className="flex items-center gap-3 text-xl font-bold text-gray-800">
                      <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                        <Zap className="w-4 h-4 text-white" />
                      </div>
                      {t("panels.output")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <OutputPanel
                      tableData={tableData}
                      outputFormat={outputFormat}
                      setOutputFormat={setOutputFormat}
                      generateOutput={generateOutput}
                      handleCopy={handleCopy}
                      handleDownload={handleDownload}
                      copiedFormat={copiedFormat}
                    />
                  </CardContent>
                </Card>
              )}
            </div>

            {!isTableExpanded && <HowToUse />}
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
