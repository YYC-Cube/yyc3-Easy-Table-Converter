"use client"

import { useState, useRef } from "react"
import * as React from "react"
import { Button } from "../../../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs"
import { TooltipProvider } from "../../../components/ui/tooltip"
import { Copy, CheckCircle, X, ArrowLeft, AlertCircle, Info, Download, Upload, Sparkles, Clock, Layers } from "lucide-react"
import { useToast } from "../../../hooks/use-toast"
import Link from "next/link"
import { ScrollArea } from "../../../components/ui/scroll-area"
import { Textarea } from "../../../components/ui/textarea"
import { Label } from "../../../components/ui/label"

import { Switch } from "../../../components/ui/switch"
import { Separator } from "../../../components/ui/separator"
import { Badge } from "../../../components/ui/badge"
import { Tooltip, TooltipContent, TooltipTrigger } from "../../../components/ui/tooltip"
import { Alert, AlertDescription } from "../../../components/ui/alert"

import { Header } from "../../../components/Header"
import { useHistory } from "../../../hooks/useHistory"
import { BatchProcessor } from "../../../components/text-tools/BatchProcessor"

/**
 * @file AI 文本摘要生成器
 * @description 使用AI技术生成多长度的文本摘要，支持核心信息提取和大文本处理
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-20
 */

// 摘要长度类型
type SummaryLength = 'short' | 'medium' | 'long'

// 摘要生成配置
type SummaryConfig = {
  length: SummaryLength
  preserveKeyPoints: boolean
  includeStats: boolean
}

// 摘要统计信息
type SummaryStats = {
  originalWords: number
  summarizedWords: number
  compressionRatio: number
  processingTime?: number
}

const TextSummaryPage: React.FC = () => {
  // 状态管理
  const [inputText, setInputText] = useState<string>('')
  const [summary, setSummary] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState<boolean>(false)
  const [isCopied, setIsCopied] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [config, setConfig] = useState<SummaryConfig>({
    length: 'medium',
    preserveKeyPoints: true,
    includeStats: true
  })
  const [stats, setStats] = useState<SummaryStats | null>(null)
  const [processingStartTime, setProcessingStartTime] = useState<number>(0)
  const [processingMode, setProcessingMode] = useState<'single' | 'batch'>('single')
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()
  const { addHistoryItem } = useHistory()

  // 模拟AI摘要生成函数（实际项目中应替换为真实的AI模型调用）
  const generateSummary = async () => {
    if (!inputText.trim()) {
      setError('请输入需要摘要的文本')
      return
    }

    setError(null)
    setIsGenerating(true)
    setProcessingStartTime(Date.now())

    try {
      // 模拟处理延迟
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // 简单的摘要生成逻辑（实际项目中应替换为AI模型调用）
      const words = inputText.trim().split(/\s+/)
      const originalWordsCount = words.length
      
      // 根据选择的长度确定摘要长度
      let summaryLength = 0
      switch (config.length) {
        case 'short':
          summaryLength = Math.max(30, Math.floor(originalWordsCount * 0.2))
          break
        case 'medium':
          summaryLength = Math.max(100, Math.floor(originalWordsCount * 0.4))
          break
        case 'long':
          summaryLength = Math.max(200, Math.floor(originalWordsCount * 0.6))
          break
      }

      // 提取关键句子（简化版）
      const sentences = inputText.split(/[.!?。！？]+/).filter(s => s.trim())
      
      // 模拟保留关键点的逻辑
      let selectedSentences: string[] = []
      if (config.preserveKeyPoints) {
        // 简化版：优先选择包含某些关键词的句子
        const keyWords = ['重要', '关键', '需要', '必须', '建议', '总结', '结论', '结果', '发现', '问题', '解决方案']
        
        // 首先选择包含关键词的句子
        const keySentences = sentences.filter(sentence => 
          keyWords.some(keyword => sentence.includes(keyword))
        )
        selectedSentences = [...keySentences]
        
        // 如果关键句子不够，添加其他句子
        if (selectedSentences.length < sentences.length * 0.5) {
          const remainingSentences = sentences.filter(s => !selectedSentences.includes(s))
          selectedSentences = [...selectedSentences, ...remainingSentences.slice(0, Math.floor(sentences.length * 0.5) - selectedSentences.length)]
        }
      } else {
        // 不特别处理，直接选择句子
        selectedSentences = sentences.slice(0, Math.floor(sentences.length * 0.6))
      }

      // 确保摘要不超过目标长度
      const summaryWords: string[] = []
      for (const sentence of selectedSentences) {
        const sentenceWords = sentence.trim().split(/\s+/)
        for (const word of sentenceWords) {
          if (summaryWords.length < summaryLength) {
            summaryWords.push(word)
          } else {
            break
          }
        }
        if (summaryWords.length >= summaryLength) {
          break
        }
      }

      // 构建摘要文本
      let summaryText = summaryWords.join(' ')
      
      // 确保摘要以句号结束
      if (!['.', '!', '?', '。', '！', '？'].includes(summaryText.slice(-1))) {
        summaryText += '。'
      }

      setSummary(summaryText)
      
      // 计算统计信息
      const processingTime = Math.round((Date.now() - processingStartTime) / 1000)
      const summarizedWordsCount = summaryWords.length
      const compressionRatio = Math.round((1 - summarizedWordsCount / originalWordsCount) * 100)
      
      setStats({
        originalWords: originalWordsCount,
        summarizedWords: summarizedWordsCount,
        compressionRatio,
        processingTime
      })
      
      // 添加到历史记录
      addHistoryItem({
        type: 'json-xml',
        input: { value: inputText.slice(0, 50) + (inputText.length > 50 ? '...' : '') },
        output: { value: summaryText.slice(0, 50) + (summaryText.length > 50 ? '...' : '') },
        settings: {
          mode: config.preserveKeyPoints ? 'key-points' : 'standard',
          length: config.length
        }
      })

    } catch (err) {
      setError('摘要生成失败，请重试')
      console.error('摘要生成错误:', err)
    } finally {
      setIsGenerating(false)
    }
  }

  // 复制摘要到剪贴板
  const copyToClipboard = () => {
    if (!summary) return
    
    navigator.clipboard.writeText(summary).then(() => {
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
      toast({
        title: '复制成功',
        description: '摘要已复制到剪贴板',
      })
    }).catch(err => {
      console.error('复制失败:', err)
      toast({
        title: '复制失败',
        description: '无法复制到剪贴板，请手动复制',
        variant: 'destructive'
      })
    })
  }

  // 处理文件上传
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      setInputText(content)
    }
    reader.onerror = () => {
      setError('文件读取失败，请重试')
    }
    reader.readAsText(file)
    
    // 重置文件输入，允许重新上传同一文件
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // 下载摘要为文本文件
  const downloadSummary = () => {
    if (!summary) return

    const blob = new Blob([summary], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `summary-${new Date().toISOString().slice(0, 10)}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // 重置表单
  const handleReset = () => {
    setInputText('')
    setSummary('')
    setError(null)
    setStats(null)
  }

  // 批量处理文本摘要
    const batchProcessSummary = async (items: string[]): Promise<Array<{success: boolean, input: string, output?: string, error?: string, metadata?: SummaryStats}>> => {
      const results: Array<{success: boolean, input: string, output?: string, error?: string, metadata?: SummaryStats}> = [];
      
      for (let i = 0; i < items.length; i++) { const text = items[i];
      try {
        // 复用现有的摘要生成逻辑
        const words = text.trim().split(/\s+/);
        const originalWordsCount = words.length;
        
        let summaryLength = 0;
        switch (config.length) {
          case 'short':
            summaryLength = Math.max(30, Math.floor(originalWordsCount * 0.2));
            break;
          case 'medium':
            summaryLength = Math.max(100, Math.floor(originalWordsCount * 0.4));
            break;
          case 'long':
            summaryLength = Math.max(200, Math.floor(originalWordsCount * 0.6));
            break;
        }

        const sentences = text.split(/[.!?。！？]+/).filter(s => s.trim());
        let selectedSentences: string[] = [];
        
        if (config.preserveKeyPoints) {
          const keyWords = ['重要', '关键', '需要', '必须', '建议', '总结', '结论', '结果', '发现', '问题', '解决方案'];
          const keySentences = sentences.filter(sentence => 
            keyWords.some(keyword => sentence.includes(keyword))
          );
          selectedSentences = [...keySentences];
          
          if (selectedSentences.length < sentences.length * 0.5) {
            const remainingSentences = sentences.filter(s => !selectedSentences.includes(s));
            selectedSentences = [...selectedSentences, ...remainingSentences.slice(0, Math.floor(sentences.length * 0.5) - selectedSentences.length)];
          }
        } else {
          selectedSentences = sentences.slice(0, Math.floor(sentences.length * 0.6));
        }

        const summaryWords: string[] = [];
        for (const sentence of selectedSentences) {
          const sentenceWords = sentence.trim().split(/\s+/);
          for (const word of sentenceWords) {
            if (summaryWords.length < summaryLength) {
              summaryWords.push(word);
            } else {
              break;
            }
          }
          if (summaryWords.length >= summaryLength) {
            break;
          }
        }

        let summaryText = summaryWords.join(' ');
        if (!['.', '!', '?', '。', '！', '？'].includes(summaryText.slice(-1))) {
          summaryText += '。';
        }

        const summarizedWordsCount = summaryWords.length;
        const compressionRatio = Math.round((1 - summarizedWordsCount / originalWordsCount) * 100);

        results.push({
          success: true,
          input: text,
          output: summaryText,
          metadata: {
            originalWords: originalWordsCount,
            summarizedWords: summarizedWordsCount,
            compressionRatio,
          }
        });
      } catch (error) {
        results.push({
          success: false,
          input: text,
          error: '摘要生成失败',
        });
      }
    }
    
    return results;
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <Header />
        <main className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="flex items-center gap-2 mb-6">
            <Link href="/" className="text-gray-600 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400 transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">AI 文本摘要生成器</h1>
          </div>

          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950 dark:to-purple-950 border-b">
              <CardTitle className="flex items-center gap-3 text-xl font-bold text-gray-800 dark:text-white">
                <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                AI 文本摘要生成器
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <Tabs defaultValue="input">
                <TabsList className="grid w-full grid-cols-3 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl mb-6">
                  <TabsTrigger value="input">文本输入</TabsTrigger>
                  <TabsTrigger value="batch">批量处理</TabsTrigger>
                  <TabsTrigger value="about">使用说明</TabsTrigger>
                </TabsList>
                
                <TabsContent value="input" className="space-y-6 animate-in fade-in-50 duration-300">
                  {/* 处理模式切换 */}
                  <div className="flex items-center gap-3 mb-4">
                    <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                      当前模式: {processingMode === 'single' ? '单文本处理' : '批量处理'}
                    </Badge>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setProcessingMode('batch')}
                    >
                      <Layers className="h-4 w-4 mr-2" />
                      切换到批量处理
                    </Button>
                  </div>
                  
                  {/* 输入区域 */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="input-text" className="text-base font-medium">输入文本</Label>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">{inputText.trim().split(/\s+/).length} 词</span>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isGenerating}
                          className="h-8 px-3 gap-1"
                        >
                          <Upload className="h-4 w-4" />
                          上传文件
                        </Button>
                        <input 
                          type="file" 
                          ref={fileInputRef} 
                          onChange={handleFileUpload}
                          accept=".txt,.md,.doc,.docx,.pdf"
                          className="hidden"
                     />
                      </div>
                    </div>
                    <ScrollArea className="rounded-lg border bg-white dark:bg-gray-900 h-[300px]">
                      <Textarea
                        id="input-text"
                        value={inputText || ''}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="请粘贴或输入需要生成摘要的文本（支持10000字以上）..."
                        className="min-h-[300px] resize-none border-none p-4 focus-visible:ring-0"
                        disabled={isGenerating}
                      />
                    </ScrollArea>
                    
                    {inputText.length > 10000 && (
                      <Alert className="bg-amber-50 border-amber-200 text-amber-800">
                        <Info className="h-4 w-4 text-amber-600" />
                        <AlertDescription className="text-sm">
                          文本长度超过10000字，处理可能需要更长时间
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                  
                  <Separator />
                  
                  {/* 配置区域 */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">摘要配置</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* 摘要长度 */}
                      <div className="space-y-2">
                        <Label>摘要长度</Label>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { value: 'short', label: '简短', description: '核心观点' },
                            { value: 'medium', label: '中等', description: '平衡详细度' },
                            { value: 'long', label: '详细', description: '包含更多细节' }
                          ].map((option) => (
                            <Tooltip key={option.value}>
                              <TooltipTrigger asChild>
                                <Button
                                  type="button"
                                  variant={config.length === option.value ? "default" : "outline"}
                                  className={`justify-center ${config.length === option.value ? 'bg-indigo-600 hover:bg-indigo-700' : ''}`}
                                  onClick={() => setConfig({ ...config, length: option.value as SummaryLength })}
                                  disabled={isGenerating}
                                >
                                  {option.label}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{option.description}</p>
                              </TooltipContent>
                            </Tooltip>
                          ))}
                        </div>
                      </div>
                      
                      {/* 保留关键点 */}
                      <div className="space-y-2">
                        <Label>保留关键点</Label>
                        <div className="flex items-center justify-between rounded-md border p-3">
                          <div className="space-y-0.5">
                            <p className="text-sm font-medium">优化摘要质量</p>
                            <p className="text-xs text-gray-500">优先提取重要信息</p>
                          </div>
                          <Switch
                            checked={config.preserveKeyPoints}
                            onCheckedChange={(checked) => setConfig({ ...config, preserveKeyPoints: checked })}
                            disabled={isGenerating}
                          />
                        </div>
                      </div>
                      
                      {/* 包含统计信息 */}
                      <div className="space-y-2">
                        <Label>显示统计信息</Label>
                        <div className="flex items-center justify-between rounded-md border p-3">
                          <div className="space-y-0.5">
                            <p className="text-sm font-medium">字数统计与压缩比</p>
                            <p className="text-xs text-gray-500">摘要前后对比</p>
                          </div>
                          <Switch
                            checked={config.includeStats}
                            onCheckedChange={(checked) => setConfig({ ...config, includeStats: checked })}
                            disabled={isGenerating}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  {/* 操作按钮 */}
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      variant="default"
                      onClick={generateSummary}
                      disabled={isGenerating || !inputText.trim()}
                      className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white transition-all duration-300"
                    >
                      {isGenerating ? (
                        <>
                          <span className="mr-2">生成中...</span>
                          {stats && (
                            <Clock className="h-4 w-4 animate-pulse" />
                          )}
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          生成摘要
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleReset}
                      disabled={isGenerating}
                    >
                      <X className="h-4 w-4 mr-2" />
                      清空
                    </Button>
                  </div>
                  
                  {/* 错误提示 */}
                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}
                  
                  {/* 摘要结果 */}
                  {summary && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>生成的摘要</Label>
                        <div className="flex items-center gap-2">
                          {stats && config.includeStats && (
                            <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                              压缩率 {stats.compressionRatio}%
                            </Badge>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={copyToClipboard}
                            className="h-8 px-3 gap-1"
                          >
                            {isCopied ? (
                              <>
                                <CheckCircle className="h-4 w-4" />
                                已复制
                              </>
                            ) : (
                              <>
                                <Copy className="h-4 w-4" />
                                复制
                              </>
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={downloadSummary}
                            className="h-8 px-3 gap-1"
                          >
                            <Download className="h-4 w-4" />
                            下载
                          </Button>
                        </div>
                      </div>
                      
                      <ScrollArea className="rounded-lg border bg-white dark:bg-gray-900 h-[300px]">
                        <div className="p-4 prose prose-indigo max-w-none dark:prose-invert">
                          <p>{summary || ''}</p>
                        </div>
                      </ScrollArea>
                      
                      {/* 统计信息 */}
                      {stats && config.includeStats && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                          <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                            <p className="text-xs text-gray-500 dark:text-gray-400">原文字数</p>
                            <p className="text-lg font-semibold">{stats.originalWords}</p>
                          </div>
                          <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                            <p className="text-xs text-gray-500 dark:text-gray-400">摘要字数</p>
                            <p className="text-lg font-semibold">{stats.summarizedWords}</p>
                          </div>
                          <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                            <p className="text-xs text-gray-500 dark:text-gray-400">压缩率</p>
                            <p className="text-lg font-semibold">{stats.compressionRatio}%</p>
                          </div>
                          <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                            <p className="text-xs text-gray-500 dark:text-gray-400">处理时间</p>
                            <p className="text-lg font-semibold">{stats.processingTime}s</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="batch" className="animate-in fade-in-50 duration-300">
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                        当前模式: 批量处理
                      </Badge>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setProcessingMode('single')}
                      >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        切换到单文本处理
                      </Button>
                    </div>
                    
                    <BatchProcessor
                        processorFn={async (input: string, _index: number) => {
                          try {
                            // 调用现有的批量处理函数
                            const results = await batchProcessSummary([input]);
                            const result = results[0];
                            
                            if (result.success && result.output && result.metadata) {
                              return {
                                result: result.output,
                                metadata: result.metadata
                              };
                            } else {
                              return { result: result.error || '摘要生成失败', error: result.error };
                            }
                          } catch (error) {
                            return { result: '摘要生成失败', error: String(error) };
                          }
                        }}
                      options={{
                        delimiter: '\n',
                        maxBatchSize: 50,
                        concurrentJobs: 3
                      }}
                      inputLabel="输入多个文本，每行一个文本块，或上传包含多个文本的文件..."
                      outputLabel="摘要结果"
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="about" className="animate-in fade-in-50 duration-300">
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <h3 className="text-xl font-bold">关于 AI 文本摘要生成器</h3>
                      <p className="text-gray-600 dark:text-gray-300">
                        本工具使用先进的AI技术，能够自动提取文本的核心信息，生成简洁、准确的摘要。
                        支持处理长文本，并可根据您的需求调整摘要长度和详细程度。
                      </p>
                    </div>
                    
                    <div className="space-y-3">
                      <h3 className="font-semibold">主要功能</h3>
                      <ul className="list-disc pl-5 space-y-2 text-gray-600 dark:text-gray-300">
                        <li>多长度摘要：支持简短、中等和详细三种长度的摘要生成</li>
                        <li>核心信息提取：智能识别并保留文本中的关键信息点</li>
                        <li>大文本支持：可处理10000字以上的长文本内容</li>
                        <li>统计分析：提供原文与摘要的字数对比和压缩率统计</li>
                        <li>文件上传：支持多种格式文本文件的直接上传和处理</li>
                      </ul>
                    </div>
                    
                    <div className="space-y-3">
                      <h3 className="font-semibold">使用建议</h3>
                      <ul className="list-disc pl-5 space-y-2 text-gray-600 dark:text-gray-300">
                        <li>对于重要文档，建议选择"保留关键点"选项以确保重要信息不丢失</li>
                        <li>长文档可能需要较长的处理时间，请耐心等待</li>
                        <li>对于不同类型的文本（如新闻、论文、报告），可能需要调整摘要长度以获得最佳效果</li>
                        <li>生成的摘要仅供参考，重要内容请核对原文</li>
                      </ul>
                    </div>
                    
                    <div className="space-y-3">
                      <h3 className="font-semibold">支持的文件格式</h3>
                      <div className="flex flex-wrap gap-2">
                        <Badge>纯文本 (.txt)</Badge>
                        <Badge>Markdown (.md)</Badge>
                        <Badge>Word 文档 (.doc, .docx)</Badge>
                        <Badge>PDF 文件 (.pdf)</Badge>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </main>
      </div>
    </TooltipProvider>
  )
}

export default TextSummaryPage