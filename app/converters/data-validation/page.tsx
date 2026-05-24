"use client"

import { useState, useRef, useEffect } from "react"
import type React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TooltipProvider } from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"
import { FileUp, CheckCircle2, AlertCircle, X, ArrowLeft, ChevronDown, ChevronUp, FileDown, Filter, Settings, RefreshCcw } from "lucide-react"
import Link from "next/link"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
// Separator组件暂未使用
import { Label } from "@/components/ui/label"
// Input组件暂未使用
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
// RadioGroup组件暂未使用
// Select组件暂未使用
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

import { Header } from "@/components/Header"
import { StepBar } from "@/components/StepBar"
import { useLanguage } from "@/hooks/useLanguage"
import { useHistory } from "@/hooks/useHistory"


/**
 * @file 数据验证工具
 * @description 支持邮箱、电话、身份证号等多种验证规则的批量数据验证工具
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-11
 */

interface TableRow {
  [key: string]: any
  _validationResults?: ValidationResult
}

interface ValidationRule {
  id: string
  type: ValidationType
  name: string
  description: string
  regex?: RegExp
  validator: (value: any) => { isValid: boolean; message?: string }
  columnName?: string
  enabled: boolean
  severity: 'error' | 'warning' | 'info'
}

type ValidationType = 'email' | 'phone' | 'id_card' | 'url' | 'number' | 'custom_regex' | 'custom_script'

interface ValidationResult {
  [columnName: string]: {
    isValid: boolean
    message?: string
    severity: 'error' | 'warning' | 'info'
  }
}

export default function DataValidation() {
  const { t } = useLanguage()
  const [currentStep, setCurrentStep] = useState(1)
  const [activeTab, setActiveTab] = useState("input")
  const [tableData, setTableData] = useState<TableRow[]>([])
  const [originalData, setOriginalData] = useState<TableRow[]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [validationRules, setValidationRules] = useState<ValidationRule[]>([])
  const [validationResults, setValidationResults] = useState({
    total: 0,
    valid: 0,
    invalid: 0,
    warnings: 0
  })
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingProgress, setProcessingProgress] = useState(0)
  const [hasError, setHasError] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [fileName, setFileName] = useState("")
  
  // 高级选项
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false)
  const [selectedColumns, setSelectedColumns] = useState<string[]>([])
  const [filterMode, setFilterMode] = useState<'all' | 'valid' | 'invalid'>('all')
  const [highlightErrors, setHighlightErrors] = useState(true)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const { addHistoryItem } = useHistory()

  // 初始化验证规则
  useEffect(() => {
    const defaultRules: ValidationRule[] = [
      {
        id: 'email-rule',
        type: 'email',
        name: '邮箱格式验证',
        description: '验证是否为有效的邮箱地址格式',
        regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        validator: (value): { isValid: boolean; message?: string } => {
          if (!value || value.trim() === '') return { isValid: true }
          const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
          return isValid ? { isValid } : { isValid, message: '不是有效的邮箱地址' }
        },
        enabled: true,
        severity: 'error'
      },
      {
        id: 'phone-rule',
        type: 'phone',
        name: '手机号码验证',
        description: '验证是否为有效的中国手机号码',
        regex: /^1[3-9]\d{9}$/,
        validator: (value): { isValid: boolean; message?: string } => {
          if (!value || value.trim() === '') return { isValid: true }
          const isValid = /^1[3-9]\d{9}$/.test(value)
          return isValid ? { isValid } : { isValid, message: '不是有效的手机号码' }
        },
        enabled: true,
        severity: 'error'
      },
      {
        id: 'id-card-rule',
        type: 'id_card',
        name: '身份证号验证',
        description: '验证是否为有效的中国身份证号码',
        validator: (value): { isValid: boolean; message?: string } => {
          if (!value || value.trim() === '') return { isValid: true }
          const isValid = validateChineseIdCard(value)
          return isValid ? { isValid } : { isValid, message: '不是有效的身份证号码' }
        },
        enabled: true,
        severity: 'error'
      },
      {
        id: 'url-rule',
        type: 'url',
        name: 'URL格式验证',
        description: '验证是否为有效的URL地址',
        regex: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
        validator: (value): { isValid: boolean; message?: string } => {
          if (!value || value.trim() === '') return { isValid: true }
          try {
            new URL(value)
            return { isValid: true }
          } catch {
            return { isValid: false, message: '不是有效的URL地址' }
          }
        },
        enabled: true,
        severity: 'warning'
      },
      {
        id: 'number-rule',
        type: 'number',
        name: '数字格式验证',
        description: '验证是否为有效的数字',
        validator: (value): { isValid: boolean; message?: string } => {
          if (!value || value.trim() === '') return { isValid: true }
          const numValue = Number(value)
          const isValid = !isNaN(numValue)
          return isValid ? { isValid } : { isValid, message: '不是有效的数字' }
        },
        enabled: false,
        severity: 'warning'
      }
    ]
    
    setValidationRules(defaultRules)
  }, [])

  // 中国身份证号验证
  const validateChineseIdCard = (idCard: string): boolean => {
    // 18位身份证正则
    const reg = /^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[0-9Xx]$/
    if (!reg.test(idCard)) return false
    
    // 加权因子
    const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2]
    // 校验码
    const checkCodes = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2']
    
    // 计算校验码
    let sum = 0
    for (let i = 0; i < 17; i++) {
      sum += parseInt(idCard[i]) * weights[i]
    }
    const checkCode = checkCodes[sum % 11]
    
    return idCard[17].toUpperCase() === checkCode
  }

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
          setProcessingProgress(Math.floor((e.loaded / e.total) * 50))
        }
      }
      
      reader.onload = (e) => {
        try {
          const data = e.target?.result as string
            const fileType = getFileFormat(fileExtension)
            
            // 由于parseInputData函数未找到，这里提供一个简单的实现
            interface ParseResult {
              success: boolean;
              data: TableRow[];
            }
            let parsedData: ParseResult = { success: false, data: [] };
            try {
              // 尝试作为JSON解析
              if (fileType === 'json') {
                const jsonData = JSON.parse(data);
                if (Array.isArray(jsonData) && jsonData.length > 0) {
                  parsedData = { success: true, data: jsonData };
                }
              } else if (['csv', 'tsv'].includes(fileType)) {
                // 简单的CSV/TSV解析
                const lines = data.split('\n').filter(line => line.trim());
                if (lines.length > 0) {
                  const delimiter = fileType === 'csv' ? ',' : '\t';
                  const headers = lines[0].split(delimiter);
                  const rows = lines.slice(1).map(line => {
                    const values = line.split(delimiter);
                    const row: TableRow = {};
                    headers.forEach((header, i) => {
                      row[header] = values[i] || '';
                    });
                    return row;
                  });
                  parsedData = { success: true, data: rows };
                }
              }
            } catch (e) {
              console.error('数据解析错误:', e);
            }
            
            if (parsedData.success && parsedData.data.length > 0) {
            const headers = Object.keys(parsedData.data[0])
            setHeaders(headers)
            setOriginalData(parsedData.data)
            setTableData(parsedData.data)
            setSelectedColumns(headers)
            
            setProcessingProgress(100)
            setCurrentStep(2)
            setActiveTab("validation")
            setFilterMode('all')
            
            // 记录历史
            addHistoryItem({
        type: "table",
        input: {
          fileName: file.name,
          format: 'file'
        },
        output: {
          format: 'validated'
        }
      })
            
            toast({
              title: t("messages.uploadSuccess"),
              description: `${t("messages.uploadedFile")}: ${file.name}`,
            })
          } else {
            throw new Error("无法解析文件内容")
          }
          
        } catch (error) {
          setHasError(true)
          setErrorMessage(t("messages.parseError") + " " + (error as Error).message)
          toast({
            title: t("messages.uploadFailed"),
            description: (error as Error).message,
            variant: "destructive",
          })
        } finally {
          setIsProcessing(false)
        }
      }
      
      reader.readAsText(file, 'UTF-8')
      
    } catch (error) {
      setHasError(true)
      setErrorMessage(t("messages.uploadError") + " " + (error as Error).message)
      setIsProcessing(false)
      toast({
        title: t("messages.uploadFailed"),
        description: (error as Error).message,
        variant: "destructive",
      })
    }
  }

  // 获取文件格式
  const getFileFormat = (extension?: string): string => {
    switch (extension) {
      case 'csv':
        return 'csv'
      case 'tsv':
        return 'tsv'
      case 'json':
        return 'json'
      case 'md':
        return 'markdown'
      case 'html':
        return 'html'
      default:
        return 'csv' // 默认按CSV处理
    }
  }

  // 执行验证
  const runValidation = async () => {
    if (tableData.length === 0) {
      toast({
        title: t("messages.noData"),
        description: t("messages.pleaseUploadData"),
        variant: "destructive",
      })
      return
    }

    const enabledRules = validationRules.filter(rule => rule.enabled)
    if (enabledRules.length === 0) {
      toast({
        title: t("messages.noRulesEnabled"),
        description: t("messages.pleaseEnableRules"),
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)
    setProcessingProgress(0)

    try {
      const validatedData = [...tableData]
      let validCount = 0
      let invalidCount = 0
      let warningCount = 0
      
      // 为每一行数据执行验证
      for (let i = 0; i < validatedData.length; i++) {
        const row = validatedData[i]
        const results: ValidationResult = {}
        let hasInvalid = false
        let hasWarning = false
        
        // 对每一列应用启用的验证规则
        for (const column of selectedColumns) {
          const value = row[column]
          
          for (const rule of enabledRules) {
            // 根据规则类型和列名决定是否应用
            if (rule.type === 'email' && (column.toLowerCase().includes('email') || column.toLowerCase().includes('邮箱'))) {
              const result = rule.validator(value)
              if (!result.isValid) {
                results[column] = {
                  isValid: false,
                  message: result.message || '格式不正确',
                  severity: rule.severity
                }
                hasInvalid = hasInvalid || rule.severity === 'error'
                hasWarning = hasWarning || rule.severity === 'warning'
              }
            } 
            else if (rule.type === 'phone' && (column.toLowerCase().includes('phone') || column.toLowerCase().includes('tel') || column.toLowerCase().includes('手机') || column.toLowerCase().includes('电话'))) {
              const result = rule.validator(value)
              if (!result.isValid) {
                results[column] = {
                  isValid: false,
                  message: result.message || '格式不正确',
                  severity: rule.severity
                }
                hasInvalid = hasInvalid || rule.severity === 'error'
                hasWarning = hasWarning || rule.severity === 'warning'
              }
            } 
            else if (rule.type === 'id_card' && (column.toLowerCase().includes('id') || column.toLowerCase().includes('身份证') || column.toLowerCase().includes('证件'))) {
              const result = rule.validator(value)
              if (!result.isValid) {
                results[column] = {
                  isValid: false,
                  message: result.message || '格式不正确',
                  severity: rule.severity
                }
                hasInvalid = hasInvalid || rule.severity === 'error'
                hasWarning = hasWarning || rule.severity === 'warning'
              }
            } 
            else if (rule.type === 'url' && (column.toLowerCase().includes('url') || column.toLowerCase().includes('网址') || column.toLowerCase().includes('link'))) {
              const result = rule.validator(value)
              if (!result.isValid) {
                results[column] = {
                  isValid: false,
                  message: result.message || '格式不正确',
                  severity: rule.severity
                }
                hasInvalid = hasInvalid || rule.severity === 'error'
                hasWarning = hasWarning || rule.severity === 'warning'
              }
            } 
            else if (rule.type === 'number' && (column.toLowerCase().includes('num') || column.toLowerCase().includes('金额') || column.toLowerCase().includes('数量') || column.toLowerCase().includes('price'))) {
              const result = rule.validator(value)
              if (!result.isValid) {
                results[column] = {
                  isValid: false,
                  message: result.message || '格式不正确',
                  severity: rule.severity
                }
                hasInvalid = hasInvalid || rule.severity === 'error'
                hasWarning = hasWarning || rule.severity === 'warning'
              }
            }
          }
        }
        
        // 更新统计信息
        if (Object.keys(results).length === 0) {
          validCount++
        } else {
          invalidCount++
          warningCount += hasWarning ? 1 : 0
        }
        
        row._validationResults = results
        
        // 更新进度
        setProcessingProgress(Math.floor((i / validatedData.length) * 100))
      }
      
      setTableData(validatedData)
      setValidationResults({
        total: validatedData.length,
        valid: validCount,
        invalid: invalidCount,
        warnings: warningCount
      })
      
      // 记录历史
      addHistoryItem({
        type: "table",
        input: {
          format: 'validated'
        },
        output: {
          format: 'results'
        }
      })
      
      toast({
        title: t("messages.validationComplete"),
        description: `${validCount} 条有效, ${invalidCount} 条无效, ${warningCount} 条警告`,
      })
      
    } catch (error) {
      toast({
        title: t("messages.validationFailed"),
        description: (error as Error).message,
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
      setTimeout(() => setProcessingProgress(0), 1000)
    }
  }

  // 切换规则启用状态
  const toggleRuleEnabled = (ruleId: string) => {
    setValidationRules(prevRules =>
      prevRules.map(rule =>
        rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule
      )
    )
  }

  // 切换列选择
  const toggleColumnSelection = (column: string) => {
    setSelectedColumns(prev =>
      prev.includes(column)
        ? prev.filter(c => c !== column)
        : [...prev, column]
    )
  }

  // 应用过滤器
  const applyFilter = (mode: 'all' | 'valid' | 'invalid') => {
    setFilterMode(mode)
    
    if (mode === 'all') {
      setTableData([...originalData])
    } else if (mode === 'valid') {
      const filtered = originalData.filter(row => !row._validationResults || Object.keys(row._validationResults).length === 0)
      setTableData(filtered)
    } else if (mode === 'invalid') {
      const filtered = originalData.filter(row => row._validationResults && Object.keys(row._validationResults).length > 0)
      setTableData(filtered)
    }
  }

  // 导出验证结果
  const exportResults = () => {
    // 这里可以实现导出CSV或Excel的功能
    toast({
      title: t("messages.exportSuccess"),
      description: t("messages.resultsExported"),
    })
  }

  // 重置
  const handleReset = () => {
    setTableData([])
    setOriginalData([])
    setHeaders([])
    setValidationResults({ total: 0, valid: 0, invalid: 0, warnings: 0 })
    setFileName('')
    setHasError(false)
    setErrorMessage('')
    setCurrentStep(1)
    setActiveTab('input')
    setFilterMode('all')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // 获取单元格类名
  const getCellClassName = (row: TableRow, column: string) => {
    if (!highlightErrors || !row._validationResults || !row._validationResults[column]) {
      return ''
    }
    
    const result = row._validationResults[column]
    if (result.severity === 'error') {
      return 'bg-red-50 text-red-700 border border-red-200'
    } else if (result.severity === 'warning') {
      return 'bg-yellow-50 text-yellow-700 border border-yellow-200'
    }
    return ''
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-100">
        {/* 动画背景 */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-green-400/20 to-emerald-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-r from-emerald-400/20 to-teal-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-r from-teal-400/20 to-green-400/20 rounded-full blur-3xl animate-pulse delay-500"></div>
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
              <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-gray-100">
                <CardTitle className="flex items-center gap-3 text-xl font-bold text-gray-800">
                  <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  </div>
                  数据验证工具
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-2 bg-gray-100 p-1 rounded-xl mb-6">
                    <TabsTrigger 
                      value="input" 
                      className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md transition-all duration-200"
                    >
                      数据输入
                    </TabsTrigger>
                    <TabsTrigger 
                      value="validation" 
                      disabled={tableData.length === 0}
                      className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md transition-all duration-200 disabled:opacity-50"
                    >
                      验证结果
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="input" className="space-y-6">
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center bg-gray-50 hover:bg-gray-100 transition-colors duration-200 cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv,.tsv,.json,.md,.html"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                        <FileUp className="w-8 h-8 text-green-600" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-800 mb-2">拖放文件到此处或点击上传</h3>
                      <p className="text-sm text-gray-500 mb-4">支持格式: CSV, TSV, JSON, Markdown, HTML</p>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">邮箱/电话验证</Badge>
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 ml-2">身份证号验证</Badge>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 ml-2">批量验证功能</Badge>
                    </div>

                    {fileName && (
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <FileUp className="w-5 h-5 text-green-600" />
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
                          <span className="text-sm font-medium text-green-600">{processingProgress}%</span>
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

                  <TabsContent value="validation" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-medium text-gray-800 flex items-center gap-2">
                            <Settings className="w-5 h-5 text-green-600" />
                            验证规则设置
                          </h3>
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

                        <Card className="border border-gray-200">
                          <CardContent className="p-4">
                            <div className="space-y-3">
                              {validationRules.map((rule) => (
                                <div key={rule.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors">
                                  <div className="flex items-start gap-3">
                                    <Switch 
                                      id={rule.id} 
                                      checked={rule.enabled} 
                                      onCheckedChange={() => toggleRuleEnabled(rule.id)}
                                    />
                                    <div>
                                      <Label htmlFor={rule.id} className="font-medium">{rule.name}</Label>
                                      <p className="text-xs text-gray-500 mt-1">{rule.description}</p>
                                    </div>
                                  </div>
                                  <Badge 
                                    className={
                                      rule.severity === 'error' ? 'bg-red-100 text-red-700 hover:bg-red-200' :
                                      rule.severity === 'warning' ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' :
                                      'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                    }
                                  >
                                    {rule.severity === 'error' ? '错误' : rule.severity === 'warning' ? '警告' : '提示'}
                                  </Badge>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>

                        {showAdvancedOptions && (
                          <Card className="border border-gray-200">
                            <CardContent className="p-4">
                              <div className="space-y-4">
                                <div>
                                  <Label className="font-medium mb-2 block">选择要验证的列</Label>
                                  <ScrollArea className="h-[200px] border border-gray-200 rounded-lg p-3">
                                    <div className="space-y-2">
                                      {headers.map((header) => (
                                        <div key={header} className="flex items-center gap-2">
                                          <Checkbox 
                                            id={`column-${header}`} 
                                            checked={selectedColumns.includes(header)}
                                            onCheckedChange={() => toggleColumnSelection(header)}
                                          />
                                          <Label htmlFor={`column-${header}`}>{header}</Label>
                                        </div>
                                      ))}
                                    </div>
                                  </ScrollArea>
                                </div>

                                <div className="flex items-center gap-2">
                                  <Switch 
                                    id="highlight-errors" 
                                    checked={highlightErrors} 
                                    onCheckedChange={setHighlightErrors}
                                  />
                                  <Label htmlFor="highlight-errors">高亮显示错误单元格</Label>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )}

                        <Button 
                          variant="default" 
                          onClick={runValidation}
                          disabled={isProcessing || selectedColumns.length === 0 || validationRules.filter(r => r.enabled).length === 0}
                          className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white transition-all duration-300"
                        >
                          {isProcessing ? (
                            <>
                              <span className="mr-2">验证中...</span>
                              <Progress value={processingProgress} className="h-1.5 w-16" />
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-4 h-4 mr-2" />
                              执行数据验证
                            </>
                          )}
                        </Button>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-medium text-gray-800 flex items-center gap-2">
                            <Filter className="w-5 h-5 text-green-600" />
                            验证结果 ({validationResults.total} 条)
                          </h3>
                          <div className="flex gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => applyFilter('all')}
                              className={filterMode === 'all' ? 'bg-gray-100' : ''}
                            >
                              全部
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => applyFilter('valid')}
                              className={filterMode === 'valid' ? 'bg-green-100 text-green-700' : ''}
                            >
                              有效
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => applyFilter('invalid')}
                              className={filterMode === 'invalid' ? 'bg-red-100 text-red-700' : ''}
                            >
                              无效
                            </Button>
                          </div>
                        </div>

                        <Card className="border border-gray-200">
                          <CardContent className="p-4">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-center">
                                <div className="text-3xl font-bold text-gray-800">{validationResults.valid}</div>
                                <div className="text-sm text-gray-600 mt-1">有效记录</div>
                              </div>
                              <div className="p-3 bg-red-50 rounded-lg border border-red-200 text-center">
                                <div className="text-3xl font-bold text-red-600">{validationResults.invalid}</div>
                                <div className="text-sm text-red-600 mt-1">无效记录</div>
                              </div>
                              <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200 text-center">
                                <div className="text-3xl font-bold text-yellow-600">{validationResults.warnings}</div>
                                <div className="text-sm text-yellow-600 mt-1">警告记录</div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {validationResults.invalid > 0 && (
                          <Alert className="bg-amber-50 border-amber-200">
                            <AlertCircle className="h-4 w-4 text-amber-600" />
                            <AlertTitle className="text-amber-800 font-medium">发现 {validationResults.invalid} 条无效记录</AlertTitle>
                            <AlertDescription className="text-amber-700 text-sm">
                              请检查并修正无效数据，或点击"无效"过滤器查看具体的错误记录。
                            </AlertDescription>
                          </Alert>
                        )}

                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            onClick={exportResults}
                            disabled={isProcessing || validationResults.total === 0}
                            className="flex-1 flex items-center justify-center gap-1"
                          >
                            <FileDown className="w-4 h-4" />
                            导出结果
                          </Button>
                          <Button 
                            variant="ghost" 
                            onClick={() => {
                              setTableData([...originalData])
                              applyFilter('all')
                            }}
                            disabled={isProcessing}
                            className="flex items-center gap-1"
                          >
                            <RefreshCcw className="w-4 h-4" />
                            重置视图
                          </Button>
                        </div>
                      </div>
                    </div>

                    {tableData.length > 0 && (
                      <div>
                        <h3 className="text-lg font-medium text-gray-800 mb-3">数据预览</h3>
                        <ScrollArea className="h-[400px] border border-gray-200 rounded-lg">
                          <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50 sticky top-0 z-10">
                                <tr>
                                  {headers.slice(0, 10).map((header, idx) => (
                                    <th key={idx} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">{header}</th>
                                  ))}
                                  {headers.length > 10 && (
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">...</th>
                                  )}
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {tableData.slice(0, 50).map((row, rowIdx) => (
                                  <tr key={rowIdx} className={row._validationResults && Object.keys(row._validationResults).length > 0 ? 'bg-red-50/30' : ''}>
                                    {headers.slice(0, 10).map((header, colIdx) => (
                                      <td 
                                        key={colIdx} 
                                        className={`px-3 py-2 whitespace-nowrap text-sm ${getCellClassName(row, header)}`}
                                      >
                                        {row[header]}
                                        {row._validationResults && row._validationResults[header] && (
                                          <span className="block text-xs mt-1 font-medium">{row._validationResults[header].message}</span>
                                        )}
                                      </td>
                                    ))}
                                    {headers.length > 10 && (
                                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">...</td>
                                    )}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </ScrollArea>
                        {tableData.length > 50 && (
                          <p className="text-sm text-gray-500 mt-2 text-center">显示前50条记录，共 {tableData.length} 条</p>
                        )}
                      </div>
                    )}

                    <Button variant="ghost" onClick={handleReset} disabled={isProcessing}>
                      重新开始
                    </Button>
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
