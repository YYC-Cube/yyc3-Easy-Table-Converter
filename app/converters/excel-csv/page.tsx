"use client"

import { useState, useRef, useEffect } from "react"
import type React from "react"
import * as XLSX from "xlsx"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TooltipProvider } from "@/components/ui/tooltip"
// useToast removed as it's not being used
import { FileDown, FileUp, AlertCircle, ChevronDown, ChevronUp, X, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
// Separator removed as it's not being used

import { Header } from "@/components/Header"
import { StepBar } from "@/components/StepBar"
import { useLanguage } from "@/hooks/useLanguage"
import { useHistory } from "@/hooks/useHistory"

/**
 * @file Excel/CSV 高级互转工具
 * @description 支持多工作表导入/导出、保留基本格式、大文件处理的Excel和CSV转换工具
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-11
 */

interface SheetData {
  name: string
  data: any[]
  originalData?: any
}

export default function ExcelCSVConverter() {
  const { t } = useLanguage()
  const [currentStep, setCurrentStep] = useState(1)
  const [activeTab, setActiveTab] = useState("input")
  const [selectedSheets, setSelectedSheets] = useState<string[]>([])
  const [sheets, setSheets] = useState<SheetData[]>([])
  const [outputFormat, setOutputFormat] = useState<"excel" | "csv">("excel")
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingProgress, setProcessingProgress] = useState(0)
  const [hasError, setHasError] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false)
  const [includeHeaders, setIncludeHeaders] = useState(true)
  const [csvDelimiter, setCsvDelimiter] = useState(",")
  const [fileName, setFileName] = useState("")
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const toastRef = useRef<any>(null)
  const { addHistoryItem } = useHistory()

  // 安全的toast函数，确保在客户端环境中使用
  const safeToast = (options: any) => {
    if (typeof window !== 'undefined' && toastRef.current) {
      toastRef.current(options)
    }
  }

  // 在客户端渲染后初始化toast
  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('@/hooks/use-toast').then(({ useToast }) => {
        const toastHook = useToast();
        toastRef.current = toastHook.toast;
      });
    }
  }, [])

  // 处理文件上传
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    setFileName(file.name)
    setHasError(false)
    setErrorMessage("")
    setIsProcessing(true)
    setProcessingProgress(0)
    
    const fileExtension = file.name.split('.').pop()?.toLowerCase()
    
    try {
      const reader = new FileReader()
      
      reader.onprogress = (e) => {
        if (e.lengthComputable) {
          setProcessingProgress(Math.floor((e.loaded / e.total) * 80))
        }
      }
      
      reader.onload = (e) => {
        try {
          const data = e.target?.result
          const workbook = XLSX.read(data, { 
            type: 'binary',
            cellDates: true,
            cellStyles: true
          })
          
          const newSheets: SheetData[] = []
          workbook.SheetNames.forEach((sheetName, index) => {
            const worksheet = workbook.Sheets[sheetName]
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
              header: 1, // 先获取原始数据结构
              raw: false
            })
            
            // 转换为对象数组
            const objectData = XLSX.utils.sheet_to_json(worksheet, {
              defval: '',
              raw: false
            })
            
            newSheets.push({
              name: sheetName,
              data: objectData,
              originalData: jsonData
            })
            
            // 更新进度
            setProcessingProgress(80 + Math.floor((index + 1) / workbook.SheetNames.length * 20))
          })
          
          setSheets(newSheets)
          setSelectedSheets(newSheets.map(s => s.name))
          setCurrentStep(2)
          setActiveTab("preview")
          setIsProcessing(false)
          
          // 记录历史
          addHistoryItem({
              type: "table",
              input: {
              fileName: file.name,
              format: 'excel'
            },
            output: {
              format: 'sheets'
            }
          })
          
          safeToast({
            title: t("messages.uploadSuccess"),
            description: `${t("messages.uploadedFile")}: ${file.name}`,
          })
          
        } catch (error) {
          setHasError(true)
          setErrorMessage(t("messages.parseError") + " " + (error as Error).message)
          setIsProcessing(false)
          safeToast({
            title: t("messages.uploadFailed"),
            description: (error as Error).message,
            variant: "destructive",
          })
        }
      }
      
      if (fileExtension === 'csv' || fileExtension === 'tsv') {
        reader.readAsText(file)
      } else {
        reader.readAsBinaryString(file)
      }
      
    } catch (error) {
      setHasError(true)
      setErrorMessage(t("messages.uploadError") + " " + (error as Error).message)
      setIsProcessing(false)
      safeToast({
        title: t("messages.uploadFailed"),
        description: (error as Error).message,
        variant: "destructive",
      })
    }
  }

  // 切换工作表选择
  const toggleSheetSelection = (sheetName: string) => {
    setSelectedSheets(prev => 
      prev.includes(sheetName)
        ? prev.filter(s => s !== sheetName)
        : [...prev, sheetName]
    )
  }

  // 选择所有工作表
  const selectAllSheets = () => {
    setSelectedSheets(sheets.map(s => s.name))
  }

  // 取消选择所有工作表
  const deselectAllSheets = () => {
    setSelectedSheets([])
  }

  // 导出文件
  const handleExport = async () => {
    if (selectedSheets.length === 0) {
      safeToast({
        title: t("messages.noSheetsSelected"),
        description: t("messages.pleaseSelectSheets"),
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)
    setProcessingProgress(0)

    try {
      const workbook = XLSX.utils.book_new()
      
      // 处理每个选定的工作表
      selectedSheets.forEach((sheetName, index) => {
        const sheet = sheets.find(s => s.name === sheetName)
        if (!sheet) return
        
        let worksheet: XLSX.WorkSheet
        
        if (outputFormat === 'excel') {
          // 导出为Excel
          if (includeHeaders && sheet.data.length > 0) {
            worksheet = XLSX.utils.json_to_sheet(sheet.data)
          } else if (sheet.originalData) {
            worksheet = XLSX.utils.aoa_to_sheet(sheet.originalData)
          } else {
            worksheet = XLSX.utils.json_to_sheet(sheet.data)
          }
        } else {
          // 导出为CSV
          if (includeHeaders && sheet.data.length > 0) {
            worksheet = XLSX.utils.json_to_sheet(sheet.data)
          } else {
            const dataWithoutHeaders = sheet.data.map((item: any) => 
              Object.values(item)
            )
            worksheet = XLSX.utils.aoa_to_sheet(dataWithoutHeaders)
          }
        }
        
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
        
        // 更新进度
        setProcessingProgress(Math.floor((index + 1) / selectedSheets.length * 80))
      })
      
      // 生成文件
      let output: string | Uint8Array
      let mimeType: string
      let fileExtension: string
      
      if (outputFormat === 'excel') {
        output = XLSX.write(workbook, { 
          bookType: 'xlsx', 
          type: 'array',
          cellStyles: true
        })
        mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        fileExtension = 'xlsx'
      } else {
        // 对于CSV，只导出第一个选定的工作表
        const firstSheet = sheets.find(s => s.name === selectedSheets[0])
        if (!firstSheet) throw new Error(t("messages.noSheetFound"))
        
        // 手动处理表头，避免使用skipHeader
        const sheetData = XLSX.utils.json_to_sheet([])
        if (includeHeaders) {
          // 保留表头
          XLSX.utils.sheet_add_json(sheetData, firstSheet.data, { origin: 1 })
        } else {
          // 跳过表头，直接添加数据
          XLSX.utils.sheet_add_json(sheetData, firstSheet.data, { origin: 0, skipHeader: true })
        }
        output = XLSX.utils.sheet_to_csv(sheetData, { FS: csvDelimiter })
        mimeType = 'text/csv'
        fileExtension = 'csv'
      }
      
      setProcessingProgress(90)
      
      // 创建并下载文件
      // 确保output是字符串类型，符合BlobPart要求
      const blob = new Blob([output as string], { type: mimeType })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `exported_${Date.now()}.${fileExtension}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      setProcessingProgress(100)
      
      // 记录历史
      addHistoryItem({
        type: "table",
        input: {
          format: 'sheets'
        },
        output: {
          format: outputFormat
        }
      })
      
      safeToast({
        title: t("messages.exportSuccess"),
        description: `${t("messages.exportedAs")} ${outputFormat.toUpperCase()}`,
      })
      
    } catch (error) {
      safeToast({
        title: t("messages.exportFailed"),
        description: (error as Error).message,
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
      setTimeout(() => setProcessingProgress(0), 1000)
    }
  }

  // 重置
  const handleReset = () => {
    setSheets([])
    setSelectedSheets([])
    setCurrentStep(1)
    setActiveTab("input")
    setFileName("")
    setHasError(false)
    setErrorMessage("")
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
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
            <Link href="/">
              <Button variant="outline" className="mb-4 bg-white/90 backdrop-blur-sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                返回首页
              </Button>
            </Link>

            <Header />
            <StepBar currentStep={currentStep} />

            <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-2xl hover:shadow-3xl transition-all duration-300">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-100">
                <CardTitle className="flex items-center gap-3 text-xl font-bold text-gray-800">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                    <FileUp className="w-4 h-4 text-white" />
                  </div>
                  Excel/CSV 高级互转
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-2 bg-gray-100 p-1 rounded-xl mb-6">
                    <TabsTrigger 
                      value="input" 
                      className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md transition-all duration-200"
                    >
                      上传文件
                    </TabsTrigger>
                    <TabsTrigger 
                      value="preview" 
                      disabled={sheets.length === 0}
                      className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md transition-all duration-200 disabled:opacity-50"
                    >
                      预览导出
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="input" className="space-y-6">
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center bg-gray-50 hover:bg-gray-100 transition-colors duration-200 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".xlsx,.xls,.csv,.tsv"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                        <FileUp className="w-8 h-8 text-blue-600" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-800 mb-2">拖放文件到此处或点击上传</h3>
                      <p className="text-sm text-gray-500 mb-4">支持格式: XLSX, XLS, CSV, TSV</p>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">支持大文件处理 (10MB+)</Badge>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 ml-2">多工作表导入/导出</Badge>
                      <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 ml-2">保留基本格式</Badge>
                    </div>

                    {fileName && (
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <FileUp className="w-5 h-5 text-blue-600" />
                          </div>
                          <span className="text-sm font-medium truncate max-w-md">{fileName}</span>
                        </div>
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          onClick={handleReset}
                          className="bg-red-500 hover:bg-red-600"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    )}

                    {isProcessing && (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">处理中...</span>
                          <span className="text-sm font-medium text-blue-600">{processingProgress}%</span>
                        </div>
                        <Progress value={processingProgress} className="h-2 bg-gray-200" />
                      </div>
                    )}

                    {hasError && (
                      <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-red-700">{errorMessage}</p>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="preview" className="space-y-6">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium text-gray-800">工作表选择</h3>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={selectAllSheets}>全选</Button>
                        <Button variant="ghost" size="sm" onClick={deselectAllSheets}>取消全选</Button>
                      </div>
                    </div>

                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      {sheets.map((sheet, index) => (
                        <div 
                          key={sheet.name}
                          className={`p-3 flex items-center gap-3 cursor-pointer transition-colors duration-200 ${selectedSheets.includes(sheet.name) ? 'bg-blue-50 border-l-4 border-l-blue-500' : 'hover:bg-gray-50'} ${index < sheets.length - 1 ? 'border-b border-gray-200' : ''}`}
                          onClick={() => toggleSheetSelection(sheet.name)}
                        >
                          <input 
                            type="checkbox" 
                            checked={selectedSheets.includes(sheet.name)}
                            onChange={() => {}} 
                            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                          />
                          <span className="font-medium text-gray-800">{sheet.name}</span>
                          <Badge variant="outline" className="ml-auto">{sheet.data.length} 行</Badge>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium text-gray-800">导出设置</h3>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                          className="flex items-center gap-1"
                        >
                          高级选项
                          {showAdvancedOptions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </Button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-gray-700">导出格式</label>
                          <div className="flex gap-2">
                            <Button 
                              variant={outputFormat === 'excel' ? 'default' : 'ghost'} 
                              onClick={() => setOutputFormat('excel')}
                              className={`${outputFormat === 'excel' ? 'bg-green-600 hover:bg-green-700' : ''}`}
                            >
                              Excel (.xlsx)
                            </Button>
                            <Button 
                              variant={outputFormat === 'csv' ? 'default' : 'ghost'} 
                              onClick={() => setOutputFormat('csv')}
                              className={`${outputFormat === 'csv' ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                            >
                              CSV (.csv)
                            </Button>
                          </div>
                        </div>

                        {showAdvancedOptions && (
                          <>
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-gray-700">包含表头</label>
                              <div className="flex items-center gap-2">
                                <input 
                                  type="checkbox" 
                                  checked={includeHeaders} 
                                  onChange={(e) => setIncludeHeaders(e.target.checked)}
                                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                                />
                                <span className="text-sm text-gray-600">保留第一行作为表头</span>
                              </div>
                            </div>

                            {outputFormat === 'csv' && (
                              <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">CSV 分隔符</label>
                                <select 
                                  value={csvDelimiter}
                                  onChange={(e) => setCsvDelimiter(e.target.value)}
                                  className="w-full p-2 border border-gray-300 rounded-md bg-white"
                                >
                                  <option value=",">逗号 (,)</option>
                                  <option value=";">分号 (;)</option>
                                  <option value="\t">制表符 (Tab)</option>
                                </select>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {selectedSheets.length > 0 && (
                      <div>
                        <h3 className="text-lg font-medium text-gray-800 mb-3">工作表预览</h3>
                        <ScrollArea className="h-[300px] border border-gray-200 rounded-lg">
                          {selectedSheets.map((sheetName) => {
                            const sheet = sheets.find(s => s.name === sheetName)
                            if (!sheet || sheet.data.length === 0) return null
                            
                            const sampleData = sheet.data.slice(0, 5) // 只显示前5行
                            const headers = Object.keys(sampleData[0])
                            
                            return (
                              <div key={sheetName} className="p-4 border-b border-gray-200 last:border-b-0">
                                <h4 className="font-medium text-gray-700 mb-3">{sheetName} (显示前5行)</h4>
                                <div className="overflow-x-auto">
                                  <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                      <tr>
                                        {headers.map((header, idx) => (
                                          <th key={idx} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{header}</th>
                                        ))}
                                      </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                      {sampleData.map((row, rowIdx) => (
                                        <tr key={rowIdx}>
                                          {headers.map((header, colIdx) => (
                                            <td key={colIdx} className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{row[header]}</td>
                                          ))}
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )
                          })}
                        </ScrollArea>
                      </div>
                    )}

                    <div className="flex gap-3">
                      <Button 
                        variant="default" 
                        onClick={handleExport}
                        disabled={isProcessing || selectedSheets.length === 0}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white transition-all duration-300"
                      >
                        {isProcessing ? (
                          <>
                            <span className="mr-2">处理中...</span>
                            <Progress value={processingProgress} className="h-1.5 w-16" />
                          </>
                        ) : (
                          <>
                            <FileDown className="w-4 h-4 mr-2" />
                            导出 {outputFormat.toUpperCase()}
                          </>
                        )}
                      </Button>
                      <Button variant="ghost" onClick={handleReset} disabled={isProcessing}>
                        重新开始
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
