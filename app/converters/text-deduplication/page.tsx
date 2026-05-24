"use client"

import { useState } from "react"
import type React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TooltipProvider } from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"
import { Copy, X, ArrowLeft, FileDown, FileUp, Settings, Trash2, Download, Upload, SlidersHorizontal } from "lucide-react"
import Link from "next/link"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"

import { Badge } from "@/components/ui/badge"


import { Header } from "@/components/Header"
import { useHistory } from "@/hooks/useHistory"

/**
 * @file 文本去重工具
 * @description 支持相似度阈值可调、重复片段高亮和批量处理功能的文本去重工具
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-16
 */

// 配置项接口
type DeduplicationConfig = {
  similarityThreshold: number
  minDuplicateLength: number
  preserveOrder: boolean
  caseSensitive: boolean
  includePartialMatches: boolean
  useLevenshteinDistance: boolean
}

// 重复片段接口
type DuplicateFragment = {
  text: string
  occurrences: number
  indices: number[]
  similarity: number
}

export default function TextDeduplication() {
  const [inputText, setInputText] = useState<string>('')
  const [processedText, setProcessedText] = useState<string>('')
  const [duplicates, setDuplicates] = useState<DuplicateFragment[]>([])
  const [config, setConfig] = useState<DeduplicationConfig>({
    similarityThreshold: 85, // 默认相似度阈值85%
    minDuplicateLength: 5,   // 最小重复长度5个字符
    preserveOrder: true,     // 保留原始顺序
    caseSensitive: false,    // 不区分大小写
    includePartialMatches: true, // 包含部分匹配
    useLevenshteinDistance: false // 使用简单匹配而非编辑距离
  })
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [showSettings, setShowSettings] = useState<boolean>(false)
  const [highlightedText, setHighlightedText] = useState<string>('')
  const [activeDuplicate, setActiveDuplicate] = useState<number | null>(null)
  const [fileList, setFileList] = useState<File[]>([])
  const [batchResults, setBatchResults] = useState<Array<{ fileName: string; originalLength: number; deduplicatedLength: number; duplicatesFound: number }>>([])
  const [activeTab, setActiveTab] = useState<string>('single')
  
  const { toast } = useToast()
  const { addHistoryItem } = useHistory()
  

  

  
  // 查找重复片段
  const findDuplicates = (text: string): DuplicateFragment[] => {
    if (!text || text.length < config.minDuplicateLength) return []
    
    const processed = config.caseSensitive ? text : text.toLowerCase()
    const fragmentMap = new Map<string, { occurrences: number; indices: number[]; similarity: number }>()
    
    // 提取所有可能的片段
    for (let i = 0; i <= text.length - config.minDuplicateLength; i++) {
      for (let j = config.minDuplicateLength; j <= text.length - i; j++) {
        const fragment = processed.substring(i, i + j)
        
        if (fragmentMap.has(fragment)) {
          // 检查是否满足相似度阈值
          const existingInfo = fragmentMap.get(fragment)!
          existingInfo.occurrences++
          existingInfo.indices.push(i)
        } else {
          fragmentMap.set(fragment, { occurrences: 1, indices: [i], similarity: 100 })
        }
      }
    }
    
    // 过滤出重复的片段并构建结果
    const result: DuplicateFragment[] = []
    fragmentMap.forEach((info, fragment) => {
      if (info.occurrences > 1) {
        // 找到原始文本中的第一个匹配
        const firstIndex = info.indices[0]
        const originalText = text.substring(firstIndex, firstIndex + fragment.length)
        
        result.push({
          text: originalText,
          occurrences: info.occurrences,
          indices: info.indices,
          similarity: info.similarity
        })
      }
    })
    
    // 按照重复次数降序排序
    return result.sort((a, b) => b.occurrences - a.occurrences)
  }
  
  // 执行文本去重
  const deduplicateText = (text: string): string => {
    if (!text || duplicates.length === 0) return text
    
    let result = text
    
    // 按照长度降序排序，优先处理较长的重复片段
    const sortedDuplicates = [...duplicates].sort((a, b) => b.text.length - a.text.length)
    
    // 构建正则表达式模式
    sortedDuplicates.forEach(duplicate => {
      // 转义特殊字符
      const escapedPattern = duplicate.text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const flags = config.caseSensitive ? 'g' : 'gi'
      const regex = new RegExp(escapedPattern, flags)
      
      // 只保留第一个匹配，移除其余匹配
      let firstMatchFound = false
      result = result.replace(regex, (match) => {
        if (!firstMatchFound) {
          firstMatchFound = true
          return match
        }
        return ''
      })
    })
    
    return result
  }
  
  // 生成高亮文本
  const generateHighlightedText = (text: string, activeIndex: number | null = null): void => {
    if (!text || duplicates.length === 0) {
      setHighlightedText(text)
      return
    }
    
    // 为每个位置标记是否被高亮
    const highlightMap = new Map<number, { className: string; length: number }>()
    
    duplicates.forEach((duplicate, index) => {
      const isActive = activeIndex !== null && index === activeIndex
      const baseClass = 'bg-yellow-200 px-0.5 rounded' // 黄色高亮
      const activeClass = 'bg-yellow-300 border-2 border-yellow-500 px-0.5 rounded' // 活跃状态高亮
      
      duplicate.indices.forEach(startIndex => {
        // 避免重叠高亮，优先显示活跃状态
        let canHighlight = true
        for (let i = startIndex; i < startIndex + duplicate.text.length; i++) {
          if (highlightMap.has(i)) {
            // 如果重叠且当前不是活跃状态，则不高亮
            if (!isActive) {
              canHighlight = false
              break
            }
          }
        }
        
        if (canHighlight) {
          highlightMap.set(startIndex, {
            className: isActive ? activeClass : baseClass,
            length: duplicate.text.length
          })
        }
      })
    })
    
    // 生成高亮文本
    let highlighted = ''
    let lastIndex = 0
    
    // 按索引排序高亮位置
    const sortedHighlights = Array.from(highlightMap.entries())
      .sort(([a], [b]) => a - b)
      .filter(([startIndex]) => startIndex >= lastIndex)
    
    sortedHighlights.forEach(([startIndex, { className, length }]) => {
      // 添加高亮前的文本
      highlighted += text.slice(lastIndex, startIndex)
      // 添加高亮文本
      highlighted += `<mark class="${className}">${text.slice(startIndex, startIndex + length)}</mark>`
      lastIndex = startIndex + length
    })
    
    // 添加最后一个高亮后的文本
    highlighted += text.slice(lastIndex)
    
    setHighlightedText(highlighted)
  }
  
  // 处理文本去重
  const handleDeduplicate = async () => {
    if (!inputText.trim()) {
      toast({ title: '提示', description: '请输入文本内容' })
      return
    }
    
    setIsProcessing(true)
    
    try {
      // 模拟异步处理
      await new Promise(resolve => setTimeout(resolve, 300))
      
      // 查找重复片段
      const foundDuplicates = findDuplicates(inputText)
      setDuplicates(foundDuplicates)
      
      // 执行去重
      const deduplicated = deduplicateText(inputText)
      setProcessedText(deduplicated)
      
      // 生成高亮文本
      generateHighlightedText(inputText)
      
      // 计算去重效果
      const originalLength = inputText.length
      const deduplicatedLength = deduplicated.length
      const reductionRate = originalLength > 0 ? ((originalLength - deduplicatedLength) / originalLength) * 100 : 0
      
      // 添加到历史记录
      addHistoryItem({
        type: "unit",
        input: {
          format: "text_deduplication_input",
          value: `原文长度: ${originalLength}`
        },
        output: {
          format: "text_deduplication_output",
          value: `去重后长度: ${deduplicatedLength}, 重复率: ${reductionRate.toFixed(2)}%`
        }
      })
      
      toast({ title: '去重完成', description: `找到 ${foundDuplicates.length} 个重复片段，减少了 ${reductionRate.toFixed(2)}% 的文本` })
      
    } catch (error) {
      toast({ title: '处理失败', description: '处理文本时发生错误' })
      console.error('Deduplication error:', error)
    } finally {
      setIsProcessing(false)
    }
  }
  
  // 处理配置变更
  const handleConfigChange = (key: keyof DeduplicationConfig, value: any) => {
    setConfig(prev => ({
      ...prev,
      [key]: value
    }))
  }
  
  // 复制结果
  const handleCopyResult = () => {
    if (!processedText) return
    
    navigator.clipboard.writeText(processedText)
    toast({ title: '已复制', description: '去重后的文本已复制到剪贴板' })
  }
  
  // 下载结果
  const handleDownloadResult = () => {
    if (!processedText) return
    
    const blob = new Blob([processedText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'deduplicated-text.txt'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast({ title: '已下载', description: '去重后的文本已下载' })
  }
  
  // 处理文件上传
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files && files.length > 0) {
      setFileList([...fileList, ...Array.from(files)])
      toast({ title: '文件已上传', description: `已添加 ${files.length} 个文件` })
    }
  }
  
  // 移除文件
  const handleRemoveFile = (index: number) => {
    const newFileList = [...fileList]
    newFileList.splice(index, 1)
    setFileList(newFileList)
  }
  
  // 批量处理文件
  const handleBatchProcess = async () => {
    if (fileList.length === 0) {
      toast({ title: '提示', description: '请先上传文件' })
      return
    }
    
    setIsProcessing(true)
    const results = []
    
    try {
      for (const file of fileList) {
        const text = await file.text()
        const originalLength = text.length
        
        // 查找重复片段并去重
        const foundDuplicates = findDuplicates(text)
        const deduplicated = deduplicateText(text)
        const deduplicatedLength = deduplicated.length
        
        results.push({
          fileName: file.name,
          originalLength,
          deduplicatedLength,
          duplicatesFound: foundDuplicates.length
        })
      }
      
      setBatchResults(results)
      toast({ title: '批量处理完成', description: `已处理 ${results.length} 个文件` })
      
    } catch (error) {
      toast({ title: '处理失败', description: '批量处理文件时发生错误' })
      console.error('Batch processing error:', error)
    } finally {
      setIsProcessing(false)
    }
  }
  
  // 清空所有
  const handleClearAll = () => {
    setInputText('')
    setProcessedText('')
    setDuplicates([])
    setHighlightedText('')
    setActiveDuplicate(null)
    setFileList([])
    setBatchResults([])
  }
  
  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50 to-emerald-100">
        {/* 动画背景 */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-teal-400/20 to-emerald-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-r from-emerald-400/20 to-teal-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-r from-cyan-400/20 to-teal-400/20 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>

        <div className="relative z-10 p-4">
          <div className="max-w-5xl mx-auto">
            {/* 返回按钮 */}
            <Link href="/">
              <Button variant="outline" className="mb-4 bg-white/90 backdrop-blur-sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                返回首页
              </Button>
            </Link>

            <Header />

            <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-2xl hover:shadow-3xl transition-all duration-300">
              <CardHeader className="bg-gradient-to-r from-teal-50 to-emerald-50 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-6 h-6 text-teal-600" />
                  <CardTitle className="text-2xl font-bold text-slate-800">文本去重工具</CardTitle>
                </div>
              </CardHeader>
              
              <CardContent className="p-6">
                {/* 标签页 */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
                  <TabsList className="grid grid-cols-2 mb-4">
                    <TabsTrigger value="single">单文本去重</TabsTrigger>
                    <TabsTrigger value="batch">批量文件去重</TabsTrigger>
                  </TabsList>
                  
                  {/* 单文本去重 */}
                  <TabsContent value="single" className="space-y-6">
                    {/* 输入区域 */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="inputText" className="font-medium">输入文本</Label>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setInputText('')}
                            disabled={!inputText}
                            className="h-8"
                          >
                            <X className="w-4 h-4 mr-1" />
                            清空
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setShowSettings(!showSettings)}
                            className="h-8"
                          >
                            <Settings className="w-4 h-4 mr-1" />
                            设置
                          </Button>
                        </div>
                      </div>
                      
                      <Textarea
                        id="inputText"
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="请输入需要去重的文本..."
                        className="h-48 min-h-[120px] resize-y"
                      />
                      
                      {/* 设置面板 */}
                      {showSettings && (
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-4">
                          <h4 className="font-medium text-gray-800">去重设置</h4>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <Label htmlFor="similarityThreshold" className="font-medium">相似度阈值: {config.similarityThreshold}%</Label>
                            </div>
                            <Slider
                              id="similarityThreshold"
                              min={50}
                              max={100}
                              step={1}
                              value={[config.similarityThreshold]}
                              onValueChange={(value) => handleConfigChange('similarityThreshold', value[0])}
                            />
                            <p className="text-xs text-gray-500">阈值越高，只有越相似的文本才会被识别为重复</p>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <Label htmlFor="minDuplicateLength" className="font-medium">最小重复长度: {config.minDuplicateLength} 字符</Label>
                            </div>
                            <Slider
                              id="minDuplicateLength"
                              min={3}
                              max={20}
                              step={1}
                              value={[config.minDuplicateLength]}
                              onValueChange={(value) => handleConfigChange('minDuplicateLength', value[0])}
                            />
                            <p className="text-xs text-gray-500">设置最小重复片段长度，避免识别太短的重复内容</p>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-center justify-between">
                              <Label htmlFor="preserveOrder" className="font-medium">保留原始顺序</Label>
                              <Switch
                                id="preserveOrder"
                                checked={config.preserveOrder}
                                onCheckedChange={(checked) => handleConfigChange('preserveOrder', checked)}
                              />
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <Label htmlFor="caseSensitive" className="font-medium">区分大小写</Label>
                              <Switch
                                id="caseSensitive"
                                checked={config.caseSensitive}
                                onCheckedChange={(checked) => handleConfigChange('caseSensitive', checked)}
                              />
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <Label htmlFor="includePartialMatches" className="font-medium">包含部分匹配</Label>
                              <Switch
                                id="includePartialMatches"
                                checked={config.includePartialMatches}
                                onCheckedChange={(checked) => handleConfigChange('includePartialMatches', checked)}
                              />
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <Label htmlFor="useLevenshteinDistance" className="font-medium">使用编辑距离</Label>
                              <Switch
                                id="useLevenshteinDistance"
                                checked={config.useLevenshteinDistance}
                                onCheckedChange={(checked) => handleConfigChange('useLevenshteinDistance', checked)}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* 操作按钮 */}
                    <div className="flex flex-wrap justify-between gap-4">
                      <Button
                        variant="outline"
                        onClick={handleClearAll}
                        disabled={!inputText && !processedText}
                      >
                        重置所有
                      </Button>
                      <Button
                        onClick={handleDeduplicate}
                        disabled={isProcessing || !inputText.trim()}
                        className="gap-2"
                      >
                        {isProcessing ? (
                          <>
                            <SlidersHorizontal className="w-4 h-4 mr-2 animate-spin" />
                            处理中...
                          </>
                        ) : (
                          <>
                            <SlidersHorizontal className="w-4 h-4 mr-2" />
                            执行去重
                          </>
                        )}
                      </Button>
                    </div>
                    
                    {/* 结果显示 */}
                    {processedText && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label className="font-medium">去重结果</Label>
                          <div className="flex gap-2">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={handleCopyResult}
                              className="h-8"
                            >
                              <Copy className="w-4 h-4 mr-1" />
                              复制
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={handleDownloadResult}
                              className="h-8"
                            >
                              <Download className="w-4 h-4 mr-1" />
                              下载
                            </Button>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* 高亮显示的原文 */}
                          <div className="space-y-2">
                            <Label className="font-medium flex items-center gap-2">
                              原文（重复内容高亮）
                              <Badge variant="outline" className="text-xs">
                                {duplicates.length} 个重复片段
                              </Badge>
                            </Label>
                            <ScrollArea className="h-48 border rounded-md bg-white overflow-x-auto">
                              <div
                                className="p-4 whitespace-pre-wrap break-all"
                                dangerouslySetInnerHTML={{ __html: highlightedText || inputText }}
                              />
                            </ScrollArea>
                          </div>
                          
                          {/* 去重后的文本 */}
                          <div className="space-y-2">
                            <Label className="font-medium flex items-center gap-2">
                              去重结果
                              <Badge variant="secondary" className="text-xs">
                                {inputText ? `${Math.round(((inputText.length - processedText.length) / inputText.length) * 100)}% 减少` : '0% 减少'}
                              </Badge>
                            </Label>
                            <ScrollArea className="h-48 border rounded-md bg-gray-50 overflow-x-auto">
                              <div className="p-4 whitespace-pre-wrap break-all">
                                {processedText || inputText}
                              </div>
                            </ScrollArea>
                          </div>
                        </div>
                        
                        {/* 重复片段列表 */}
                        {duplicates.length > 0 && (
                          <div className="space-y-2">
                            <Label className="font-medium">重复片段详情</Label>
                            <ScrollArea className="h-40 border rounded-md bg-gray-50">
                              <div className="p-4 space-y-2">
                                {duplicates.map((duplicate, index) => (
                                  <div 
                                    key={index} 
                                    className={`flex flex-col sm:flex-row sm:justify-between sm:items-center p-3 rounded-md border ${activeDuplicate === index ? 'bg-yellow-50 border-yellow-200' : 'bg-white border-gray-200'}`}
                                    onClick={() => {
                                      setActiveDuplicate(activeDuplicate === index ? null : index)
                                      generateHighlightedText(inputText, activeDuplicate === index ? null : index)
                                    }}
                                  >
                                    <div className="flex items-center gap-3 mb-2 sm:mb-0">
                                      <span className="bg-teal-100 text-teal-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium">{index + 1}</span>
                                      <span className="font-mono text-sm truncate max-w-xs sm:max-w-md">"{duplicate.text.substring(0, 50)}{duplicate.text.length > 50 ? '...' : ''}"</span>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                      <Badge variant="outline" className="text-xs">出现: {duplicate.occurrences} 次</Badge>
                                      <Badge variant="outline" className="text-xs">相似度: {duplicate.similarity.toFixed(1)}%</Badge>
                                      <Badge variant="outline" className="text-xs">长度: {duplicate.text.length} 字符</Badge>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </ScrollArea>
                          </div>
                        )}
                      </div>
                    )}
                  </TabsContent>
                  
                  {/* 批量文件去重 */}
                  <TabsContent value="batch" className="space-y-6">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="font-medium">批量文件处理</Label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setFileList([])}
                          disabled={fileList.length === 0}
                          className="h-8"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          清空文件
                        </Button>
                      </div>
                      
                      {/* 文件上传区域 */}
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:bg-gray-50 transition-colors cursor-pointer">
                        <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                        <p className="mb-2">拖拽文件到此处，或点击选择文件</p>
                        <p className="text-sm text-gray-500 mb-4">支持 .txt 格式，最大 100MB</p>
                        <input
                          type="file"
                          id="fileUpload"
                          accept=".txt"
                          multiple
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                        <Button
                          variant="outline"
                          onClick={() => document.getElementById('fileUpload')?.click()}
                        >
                          <FileUp className="w-4 h-4 mr-2" />
                          选择文件
                        </Button>
                      </div>
                      
                      {/* 文件列表 */}
                      {fileList.length > 0 && (
                        <div className="space-y-2">
                          <Label className="font-medium">已上传文件 ({fileList.length})</Label>
                          <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                            {fileList.map((file, index) => (
                              <div key={index} className="flex items-center justify-between p-2 bg-white rounded-md border border-gray-200">
                                <div className="flex items-center gap-3">
                                  <FileDown className="w-4 h-4 text-gray-500" />
                                  <span className="truncate max-w-xs sm:max-w-md text-sm">{file.name}</span>
                                  <Badge variant="outline" className="text-xs">{Math.round(file.size / 1024)} KB</Badge>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveFile(index)}
                                  className="h-8 w-8 p-0 text-gray-500 hover:text-red-500"
                                >
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* 处理按钮 */}
                      <Button
                        onClick={handleBatchProcess}
                        disabled={isProcessing || fileList.length === 0}
                        className="w-full gap-2"
                      >
                        {isProcessing ? (
                          <>
                            <SlidersHorizontal className="w-4 h-4 mr-2 animate-spin" />
                            批量处理中...
                          </>
                        ) : (
                          <>
                            <SlidersHorizontal className="w-4 h-4 mr-2" />
                            开始批量处理
                          </>
                        )}
                      </Button>
                      
                      {/* 批量处理结果 */}
                      {batchResults.length > 0 && (
                        <div className="space-y-4">
                          <Label className="font-medium">处理结果</Label>
                          <ScrollArea className="h-60 border rounded-md bg-gray-50">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b border-gray-200 bg-gray-100">
                                  <th className="px-4 py-2 text-left font-medium text-gray-600">文件名</th>
                                  <th className="px-4 py-2 text-right font-medium text-gray-600">原始大小</th>
                                  <th className="px-4 py-2 text-right font-medium text-gray-600">去重后大小</th>
                                  <th className="px-4 py-2 text-right font-medium text-gray-600">重复片段</th>
                                  <th className="px-4 py-2 text-right font-medium text-gray-600">减少比例</th>
                                </tr>
                              </thead>
                              <tbody>
                                {batchResults.map((result, index) => {
                                  const reductionRate = result.originalLength > 0 ? 
                                    ((result.originalLength - result.deduplicatedLength) / result.originalLength) * 100 : 0
                                  
                                  return (
                                    <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                                      <td className="px-4 py-3 text-left truncate max-w-xs">{result.fileName}</td>
                                      <td className="px-4 py-3 text-right">{result.originalLength}</td>
                                      <td className="px-4 py-3 text-right">{result.deduplicatedLength}</td>
                                      <td className="px-4 py-3 text-right">{result.duplicatesFound}</td>
                                      <td className="px-4 py-3 text-right">
                                        <Badge className={reductionRate > 0 ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                                          {reductionRate.toFixed(1)}%
                                        </Badge>
                                      </td>
                                    </tr>
                                  )
                                })}
                              </tbody>
                            </table>
                          </ScrollArea>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
                
                {/* 提示信息 */}
                <div className="mt-6 bg-blue-50 rounded-xl p-4 border border-blue-100">
                  <p className="text-sm text-blue-700">
                    💡 支持调整相似度阈值来控制去重严格程度，阈值越高，只有越相似的文本才会被识别为重复。
                    可以通过设置最小重复长度来避免误判太短的通用词汇。批量模式支持同时处理多个文本文件。
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}