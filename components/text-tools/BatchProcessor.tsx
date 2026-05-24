/**
 * @file 批量文本处理器组件
 * @description 为文本处理类工具提供统一的批量处理界面
 * @module text-tools
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 */
"use client"

import React, { useState, useCallback } from 'react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  FileUp,
  FileDown,
  Copy,
  CheckCircle,
  AlertCircle,
  X,
  RefreshCw,
  Settings,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast';

/**
 * 批量处理项接口
 */
export interface BatchItem {
  id: string
  input: string
  output?: string
  status: 'pending' | 'processing' | 'success' | 'error'
  errorMessage?: string
  metadata?: Record<string, any>
}

/**
 * 批量处理器配置选项
 */
export interface BatchProcessorOptions {
  delimiter?: string
  maxBatchSize?: number
  concurrentJobs?: number
}

/**
 * 批量处理器属性接口
 */
export interface BatchProcessorProps {
  title?: string
  description?: string
  processorFn: (input: string, index: number) => Promise<string | { result: string; metadata?: Record<string, any> }>
  options?: BatchProcessorOptions
  initialInput?: string
  onBatchComplete?: (results: BatchItem[]) => void
  outputLabel?: string
  inputLabel?: string
}

/**
 * 批量文本处理器组件
 * @param props 组件属性
 */
export const BatchProcessor: React.FC<BatchProcessorProps> = ({
  title = '批量文本处理',
  description = '批量处理多条文本数据',
  processorFn,
  options = {},
  initialInput = '',
  onBatchComplete,
  outputLabel = '处理结果',
  inputLabel = '输入文本'
}) => {
  // 解构选项，设置默认值
  const {
    delimiter = '\n', // 默认按换行符分割
    maxBatchSize = 100, // 最大批量大小
    concurrentJobs = 5 // 并发任务数
  } = options

  // 状态管理
  const [rawInput, setRawInput] = useState<string>(initialInput)
  const [batchItems, setBatchItems] = useState<BatchItem[]>([])
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [processingProgress, setProcessingProgress] = useState<number>(0)
  const [customDelimiter, setCustomDelimiter] = useState<string>(delimiter)
  const [useCustomDelimiter, setUseCustomDelimiter] = useState<boolean>(delimiter !== '\n')
  const [showOptions, setShowOptions] = useState<boolean>(false)
  const [totalProcessed, setTotalProcessed] = useState<number>(0)
  const [totalSuccess, setTotalSuccess] = useState<number>(0)
  const [totalError, setTotalError] = useState<number>(0)

  const { toast } = useToast()

  // 分割输入文本为批量项
  const splitInputToBatchItems = useCallback(() => {
    const currentDelimiter = useCustomDelimiter ? customDelimiter : '\n'
    let items = rawInput
      .split(currentDelimiter)
      .map((input, index) => ({
        id: `item-${index}-${Date.now()}`,
        input: input.trim(),
        status: 'pending' as const
      }))
      .filter(item => item.input.length > 0) // 过滤空行

    // 限制批量大小
    if (items.length > maxBatchSize) {
      items = items.slice(0, maxBatchSize)
      toast({
        title: '批量大小限制',
        description: `已自动截取前 ${maxBatchSize} 项进行处理`,
        variant: 'warning'
      })
    }

    return items
  }, [rawInput, useCustomDelimiter, customDelimiter, maxBatchSize, toast])

  // 准备批量处理
  const prepareBatch = () => {
    const items = splitInputToBatchItems()
    if (items.length === 0) {
      toast({
        title: '无有效输入',
        description: '请输入需要处理的文本数据',
        variant: 'error'
      })
      return false
    }

    setBatchItems(items)
    setProcessingProgress(0)
    setTotalProcessed(0)
    setTotalSuccess(0)
    setTotalError(0)
    return true
  }

  // 处理单个项
  const processItem = async (item: BatchItem, index: number): Promise<void> => {
    try {
      setBatchItems(prev => 
        prev.map(prevItem => 
          prevItem.id === item.id 
            ? { ...prevItem, status: 'processing' as const }
            : prevItem
        )
      )

      const result = await processorFn(item.input, index)
      
      let output = ''
      let metadata: Record<string, any> | undefined
      
      if (typeof result === 'string') {
        output = result
      } else {
        output = result.result
        metadata = result.metadata
      }

      setBatchItems(prev => 
        prev.map(prevItem => 
          prevItem.id === item.id 
            ? { ...prevItem, output, status: 'success' as const, metadata }
            : prevItem
        )
      )
      
      setTotalSuccess(prev => prev + 1)
    } catch (error) {
      setBatchItems(prev => 
        prev.map(prevItem => 
          prevItem.id === item.id 
            ? { 
                ...prevItem, 
                status: 'error' as const, 
                errorMessage: error instanceof Error ? error.message : String(error) 
              }
            : prevItem
        )
      )
      
      setTotalError(prev => prev + 1)
    } finally {
      const newTotalProcessed = totalProcessed + 1
      setTotalProcessed(newTotalProcessed)
      setProcessingProgress(Math.round((newTotalProcessed / batchItems.length) * 100))
    }
  }

  // 执行批量处理
  const processBatch = async () => {
    if (!prepareBatch()) return
    
    setIsProcessing(true)
    const queue = [...batchItems]
    const activeJobs = new Set<Promise<void>>()
    
    try {
      while (queue.length > 0 || activeJobs.size > 0) {
        // 启动新的并发任务
        while (queue.length > 0 && activeJobs.size < concurrentJobs) {
          const item = queue.shift()
          if (item) {
            const job = processItem(item, batchItems.findIndex(i => i.id === item.id))
            activeJobs.add(job)
            job.finally(() => activeJobs.delete(job))
          }
        }
        
        if (activeJobs.size > 0) {
          await Promise.race(Array.from(activeJobs))
        }
      }
      
      // 全部完成后回调
      if (onBatchComplete) {
        onBatchComplete(batchItems)
      }
      
      toast({
        title: '批量处理完成',
        description: `成功: ${totalSuccess}, 失败: ${totalError}`,
        variant: totalError > 0 ? 'warning' : 'success'
      })
    } finally {
      setIsProcessing(false)
    }
  }

  // 复制所有结果
  const copyAllResults = () => {
    const results = batchItems
      .filter(item => item.output)
      .map(item => item.output)
      .join(useCustomDelimiter ? customDelimiter : '\n')
    
    navigator.clipboard.writeText(results)
    toast({
      title: '已复制',
      description: '所有处理结果已复制到剪贴板',
      variant: 'success'
    })
  }

  // 复制单个结果
  const copyItemResult = (output: string) => {
    navigator.clipboard.writeText(output)
    toast({
      title: '已复制',
      description: '结果已复制到剪贴板',
      variant: 'success'
    })
  }

  // 下载结果文件
  const downloadResults = () => {
    const results = batchItems
      .filter(item => item.output)
      .map(item => item.output)
      .join('\n')
    
    const blob = new Blob([results], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `batch-results-${new Date().toISOString().slice(0, 10)}.txt`
    a.click()
    URL.revokeObjectURL(url)
    
    toast({
      title: '已下载',
      description: '结果文件已下载',
      variant: 'success'
    })
  }

  // 清空所有
  const clearAll = () => {
    setRawInput('')
    setBatchItems([])
    setProcessingProgress(0)
    setTotalProcessed(0)
    setTotalSuccess(0)
    setTotalError(0)
  }

  // 上传文件
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      setRawInput(content)
      toast({
        title: '文件已上传',
        description: `${file.name} 已成功读取`,
        variant: 'success'
      })
    }
    reader.readAsText(file)
    
    // 清空input以允许重新上传同一文件
    event.target.value = ''
  }

  return (
    <Card className="w-full bg-white/90 backdrop-blur-sm border-white/20 shadow-xl">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-blue-600" />
              {title}
            </CardTitle>
            <CardDescription className="text-slate-600">{description}</CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowOptions(!showOptions)}
            className="text-slate-600"
          >
            <Settings className="w-4 h-4 mr-1" />
            选项
            {showOptions ? <ChevronUp className="w-4 h-4 ml-1" /> : <ChevronDown className="w-4 h-4 ml-1" />}
          </Button>
        </div>
        
        {/* 高级选项 */}
        {showOptions && (
          <div className="mt-4 p-3 bg-white/70 rounded-md border border-gray-200">
            <div className="flex items-center gap-2 mb-3">
              <Switch
                id="use-custom-delimiter"
                checked={useCustomDelimiter}
                onCheckedChange={setUseCustomDelimiter}
              />
              <Label htmlFor="use-custom-delimiter" className="font-medium cursor-pointer">
                使用自定义分隔符
              </Label>
            </div>
            
            {useCustomDelimiter && (
              <div className="space-y-2">
                <Label htmlFor="custom-delimiter" className="text-sm text-slate-600">
                  自定义分隔符
                </Label>
                <Input
                  id="custom-delimiter"
                  value={customDelimiter}
                  onChange={(e) => setCustomDelimiter(e.target.value)}
                  placeholder="例如: , ; | 等"
                  className="font-mono text-sm"
                />
                <p className="text-xs text-slate-500">
                  提示: 使用 \n 表示换行符，\t 表示制表符
                </p>
              </div>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className="p-0">
        <Tabs defaultValue="input" className="w-full">
          <TabsList className="w-full grid grid-cols-2 bg-gray-100">
            <TabsTrigger value="input" className="data-[state=active]:bg-white">
              批量输入
            </TabsTrigger>
            <TabsTrigger value="results" className="data-[state=active]:bg-white">
              处理结果
              {batchItems.length > 0 && (
                <Badge className="ml-2">{batchItems.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* 输入标签页 */}
          <TabsContent value="input" className="p-6 space-y-4 m-0">
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="batch-input" className="font-medium">
                {inputLabel}
                <span className="text-gray-500 text-sm ml-2">(每行一条，或使用自定义分隔符)</span>
              </Label>
              <div className="flex gap-2">
                <label htmlFor="file-upload" className="relative">
                  <input
                    id="file-upload"
                    type="file"
                    accept=".txt,.csv,.json"
                    onChange={handleFileUpload}
                    className="sr-only"
                  />
                  <Button variant="outline" size="sm" asChild>
                    <span>
                      <FileUp className="w-4 h-4 mr-1" />
                      上传文件
                    </span>
                  </Button>
                </label>
                <Button variant="outline" size="sm" onClick={clearAll} disabled={isProcessing}>
                  <X className="w-4 h-4 mr-1" />
                  清空
                </Button>
              </div>
            </div>
            
            <Textarea
              id="batch-input"
              value={rawInput}
              onChange={(e) => setRawInput(e.target.value)}
              placeholder="请输入或粘贴需要批量处理的文本..."
              className="min-h-[200px] font-mono text-sm resize-y"
              disabled={isProcessing}
            />
            
            {isProcessing ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">处理进度: {processingProgress}%</span>
                  <span className="text-sm text-slate-500">
                    {totalProcessed}/{batchItems.length}
                  </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-300"
                    style={{ width: `${processingProgress}%` }}
                  ></div>
                </div>
                <div className="flex gap-2">
                  {totalSuccess > 0 && (
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      成功: {totalSuccess}
                    </Badge>
                  )}
                  {totalError > 0 && (
                    <Badge className="bg-red-100 text-red-800 hover:bg-red-200">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      失败: {totalError}
                    </Badge>
                  )}
                </div>
              </div>
            ) : (
              <Button 
                onClick={processBatch} 
                disabled={rawInput.trim() === ''}
                className="w-full"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                开始批量处理
              </Button>
            )}
          </TabsContent>

          {/* 结果标签页 */}
          <TabsContent value="results" className="p-0 m-0 max-h-[600px] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
              <div className="flex gap-2">
                <Badge variant="outline">总计: {batchItems.length}</Badge>
                {totalSuccess > 0 && (
                  <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    成功: {totalSuccess}
                  </Badge>
                )}
                {totalError > 0 && (
                  <Badge className="bg-red-100 text-red-800 hover:bg-red-200">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    失败: {totalError}
                  </Badge>
                )}
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={copyAllResults}
                  disabled={batchItems.filter(item => item.output).length === 0}
                >
                  <Copy className="w-4 h-4 mr-1" />
                  复制全部
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={downloadResults}
                  disabled={batchItems.filter(item => item.output).length === 0}
                >
                  <FileDown className="w-4 h-4 mr-1" />
                  下载结果
                </Button>
              </div>
            </div>
            
            {batchItems.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-slate-500">
                <AlertCircle className="w-12 h-12 mb-4 opacity-30" />
                <p>暂无处理结果</p>
                <p className="text-sm mt-1">请先在批量输入标签页中开始处理</p>
              </div>
            ) : (
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {batchItems.map((item, index) => (
                    <div 
                      key={item.id} 
                      className={`p-4 rounded-lg border ${getItemStatusClass(item.status)}`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-700">#{index + 1}</span>
                          <Badge variant="outline" className={getStatusBadgeClass(item.status)}>
                            {getStatusLabel(item.status)}
                          </Badge>
                        </div>
                        {item.status === 'success' && item.output && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => copyItemResult(item.output!)}
                            className="h-8 w-8 p-0"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <div className="space-y-1">
                          <Label className="text-xs font-medium text-slate-500">输入:</Label>
                          <div className="font-mono text-sm bg-gray-50 p-2 rounded break-all">
                            {item.input}
                          </div>
                        </div>
                        
                        {item.status === 'success' && item.output && (
                          <div className="space-y-1">
                            <Label className="text-xs font-medium text-slate-500">{outputLabel}:</Label>
                            <div className="font-mono text-sm bg-green-50 p-2 rounded break-all">
                              {item.output}
                            </div>
                          </div>
                        )}
                        
                        {item.status === 'error' && item.errorMessage && (
                          <div className="space-y-1">
                            <Label className="text-xs font-medium text-red-500">错误:</Label>
                            <div className="font-mono text-sm bg-red-50 p-2 rounded break-all text-red-600">
                              {item.errorMessage}
                            </div>
                          </div>
                        )}
                        
                        {item.status === 'processing' && (
                          <div className="animate-pulse text-slate-400">
                            处理中...
                          </div>
                        )}
                        
                        {item.metadata && Object.keys(item.metadata).length > 0 && (
                          <div className="space-y-1">
                            <Label className="text-xs font-medium text-slate-500">元数据:</Label>
                            <div className="text-xs text-slate-600 bg-blue-50 p-2 rounded">
                              {Object.entries(item.metadata).map(([key, value]) => (
                                <div key={key} className="flex items-center">
                                  <span className="font-medium mr-2">{key}:</span>
                                  <span>{JSON.stringify(value)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

// 根据状态获取样式类
const getItemStatusClass = (status: BatchItem['status']) => {
  switch (status) {
    case 'success':
      return 'border-green-200 bg-green-50/50'
    case 'error':
      return 'border-red-200 bg-red-50/50'
    case 'processing':
      return 'border-blue-200 bg-blue-50/50'
    default:
      return 'border-gray-200 bg-white'
  }
}

// 根据状态获取徽章样式
const getStatusBadgeClass = (status: BatchItem['status']) => {
  switch (status) {
    case 'success':
      return 'bg-green-100 text-green-800 hover:bg-green-200'
    case 'error':
      return 'bg-red-100 text-red-800 hover:bg-red-200'
    case 'processing':
      return 'bg-blue-100 text-blue-800 hover:bg-blue-200'
    default:
      return 'bg-gray-100 text-gray-800 hover:bg-gray-200'
  }
}

// 获取状态标签文本
const getStatusLabel = (status: BatchItem['status']) => {
  switch (status) {
    case 'success':
      return '成功'
    case 'error':
      return '失败'
    case 'processing':
      return '处理中'
    default:
      return '等待中'
  }
}
