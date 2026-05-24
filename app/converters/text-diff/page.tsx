"use client"

import { useState, useRef } from "react"
import type React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TooltipProvider } from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"
import { FileDown, FileUp, Copy, X, ArrowLeft, Diff, RefreshCw } from "lucide-react"
import Link from "next/link"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

import { Badge } from "@/components/ui/badge"

import { Header } from "@/components/Header"

import { useHistory } from "@/hooks/useHistory"

/**
 * @file 文本差异比较器
 * @description 支持行级差异对比、变更高亮显示和合并建议功能的文本差异比较工具
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-16
 */

export default function TextDiff() {
  const [text1, setText1] = useState<string>('')
  const [text2, setText2] = useState<string>('')
  const [diffResult, setDiffResult] = useState<{ type: 'added' | 'removed' | 'unchanged'; value: string; line: number }[]>([])
  const [mergeSuggestions, setMergeSuggestions] = useState<string>('')
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [activeTab, setActiveTab] = useState<string>('input')
  const [comparisonMethod, setComparisonMethod] = useState<string>('line') // 'line' | 'word'
  
  const fileInput1Ref = useRef<HTMLInputElement>(null)
  const fileInput2Ref = useRef<HTMLInputElement>(null)
  
  const { toast } = useToast()
  const { addHistoryItem } = useHistory()
  
  // 计算文本差异
  const calculateDiff = () => {
    if (!text1 && !text2) {
      toast({ title: '错误', description: '请输入要比较的文本' })
      return
    }
    
    setIsProcessing(true)
    
    // 模拟处理延迟
    setTimeout(() => {
      const lines1 = text1.split('\n')
      const lines2 = text2.split('\n')
      const result: { type: 'added' | 'removed' | 'unchanged'; value: string; line: number }[] = []
      
      // 简单的行级差异比较算法
      const maxLines = Math.max(lines1.length, lines2.length)
      
      for (let i = 0; i < maxLines; i++) {
        const line1 = lines1[i] || ''
        const line2 = lines2[i] || ''
        
        if (line1 === line2) {
          result.push({ type: 'unchanged', value: line1, line: i + 1 })
        } else if (!line1) {
          result.push({ type: 'added', value: line2, line: i + 1 })
        } else if (!line2) {
          result.push({ type: 'removed', value: line1, line: i + 1 })
        } else {
          // 如果两行不同，分别标记为删除和添加
          result.push({ type: 'removed', value: line1, line: i + 1 })
          result.push({ type: 'added', value: line2, line: i + 1 })
        }
      }
      
      setDiffResult(result)
      
      // 生成合并建议
      generateMergeSuggestions(lines1, lines2)
      
      setIsProcessing(false)
      setActiveTab('result')
      
      // 添加到历史记录
      addHistoryItem({
        type: "unit",
        input: {
          format: "text_diff_input",
          value: `文本比较: ${text1.substring(0, 30)}... vs ${text2.substring(0, 30)}...`
        },
        output: {
          format: "text_diff_output",
          value: `${result.filter(item => item.type === 'added').length} 行添加, ${result.filter(item => item.type === 'removed').length} 行删除`
        }
      })
    }, 300)
  }
  
  // 生成合并建议
  const generateMergeSuggestions = (_lines1: string[], _lines2: string[]) => {
    let suggestions = ''
    
    // 简单的合并建议逻辑
    const addedCount = diffResult.filter(item => item.type === 'added').length
    const removedCount = diffResult.filter(item => item.type === 'removed').length
    
    suggestions = `合并建议:\n\n`
    suggestions += `- 添加了 ${addedCount} 行内容\n`
    suggestions += `- 删除了 ${removedCount} 行内容\n`
    
    if (addedCount > removedCount) {
      suggestions += `- 建议: 原文本新增了内容，可能是更新或补充\n`
    } else if (removedCount > addedCount) {
      suggestions += `- 建议: 原文本删除了较多内容，检查是否有意删除\n`
    }
    
    // 查找可能的替换操作（删除后紧跟添加）
    const replacements: { oldLine: number; newLine: number }[] = []
    for (let i = 0; i < diffResult.length - 1; i++) {
      if (diffResult[i].type === 'removed' && diffResult[i + 1].type === 'added') {
        replacements.push({ oldLine: diffResult[i].line, newLine: diffResult[i + 1].line })
      }
    }
    
    if (replacements.length > 0) {
      suggestions += `- 发现 ${replacements.length} 处可能的替换操作\n`
    }
    
    setMergeSuggestions(suggestions)
  }
  
  // 处理文件上传
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, isText1: boolean) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      if (isText1) {
        setText1(content)
      } else {
        setText2(content)
      }
    }
    reader.readAsText(file)
    
    // 重置文件输入，以便可以重新上传相同文件
    event.target.value = ''
  }
  
  // 清空输入
  const handleClear = (isText1: boolean) => {
    if (isText1) {
      setText1('')
    } else {
      setText2('')
    }
  }
  
  // 复制结果
  const handleCopyResult = () => {
    let resultText = ''
    diffResult.forEach(item => {
      const prefix = item.type === 'added' ? '+ ' : item.type === 'removed' ? '- ' : '  '
      resultText += prefix + item.value + '\n'
    })
    
    navigator.clipboard.writeText(resultText)
    toast({ title: '已复制', description: '差异结果已复制到剪贴板' })
  }
  
  // 下载结果
  const handleDownloadResult = () => {
    let resultText = ''
    diffResult.forEach(item => {
      const prefix = item.type === 'added' ? '+ ' : item.type === 'removed' ? '- ' : '  '
      resultText += prefix + item.value + '\n'
    })
    
    const blob = new Blob([resultText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'diff-result.txt'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast({ title: '已下载', description: '差异结果已下载为文本文件' })
  }
  
  // 交换两个文本输入
  const handleSwapTexts = () => {
    const temp = text1
    setText1(text2)
    setText2(temp)
  }
  
  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        {/* 动画背景 */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-blue-400/20 to-indigo-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-r from-indigo-400/20 to-blue-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-r from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl animate-pulse delay-500"></div>
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
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Diff className="w-6 h-6 text-blue-600" />
                  <CardTitle className="text-2xl font-bold text-slate-800">文本差异比较器</CardTitle>
                </div>
              </CardHeader>
              
              <CardContent className="p-6">
                <Tabs defaultValue="input" value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="input" className="text-base font-medium">输入文本</TabsTrigger>
                    <TabsTrigger value="result" className="text-base font-medium">比较结果</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="input" className="space-y-6">
                    {/* 比较方法选择 */}
                    <div className="flex items-center gap-2 mb-4">
                      <Label htmlFor="comparisonMethod">比较方法:</Label>
                      <select
                        id="comparisonMethod"
                        value={comparisonMethod}
                        onChange={(e) => setComparisonMethod(e.target.value)}
                        className="px-3 py-1.5 border rounded-md bg-white text-sm"
                      >
                        <option value="line">行级比较</option>
                        <option value="word">单词级比较</option>
                      </select>
                    </div>
                    
                    {/* 文本输入区域 */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* 第一个文本输入 */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="text1" className="font-medium">原文本</Label>
                          <div className="flex gap-2">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => fileInput1Ref.current?.click()}
                              className="h-8"
                            >
                              <FileUp className="w-4 h-4 mr-1" />
                              上传文件
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleClear(true)}
                              className="h-8"
                              disabled={!text1}
                            >
                              <X className="w-4 h-4 mr-1" />
                              清空
                            </Button>
                          </div>
                        </div>
                        <Textarea
                          id="text1"
                          value={text1}
                          onChange={(e) => setText1(e.target.value)}
                          placeholder="请输入第一个要比较的文本..."
                          className="h-64 min-h-[150px] resize-y"
                        />
                        <input
                          type="file"
                          ref={fileInput1Ref}
                          onChange={(e) => handleFileUpload(e, true)}
                          accept=".txt,.md,.js,.ts,.jsx,.tsx,.json,.html,.css,.scss"
                          className="hidden"
                        />
                      </div>
                      
                      {/* 交换按钮 */}
                      <div className="hidden lg:flex items-center justify-center">
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={handleSwapTexts}
                          className="rounded-full"
                        >
                          <RefreshCw className="w-5 h-5" />
                        </Button>
                      </div>
                      
                      {/* 第二个文本输入 */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="text2" className="font-medium">对比文本</Label>
                          <div className="flex gap-2">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => fileInput2Ref.current?.click()}
                              className="h-8"
                            >
                              <FileUp className="w-4 h-4 mr-1" />
                              上传文件
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleClear(false)}
                              className="h-8"
                              disabled={!text2}
                            >
                              <X className="w-4 h-4 mr-1" />
                              清空
                            </Button>
                          </div>
                        </div>
                        <Textarea
                          id="text2"
                          value={text2}
                          onChange={(e) => setText2(e.target.value)}
                          placeholder="请输入第二个要比较的文本..."
                          className="h-64 min-h-[150px] resize-y"
                        />
                        <input
                          type="file"
                          ref={fileInput2Ref}
                          onChange={(e) => handleFileUpload(e, false)}
                          accept=".txt,.md,.js,.ts,.jsx,.tsx,.json,.html,.css,.scss"
                          className="hidden"
                        />
                      </div>
                    </div>
                    
                    {/* 比较按钮 */}
                    <div className="flex justify-center mt-6">
                      <Button
                        onClick={calculateDiff}
                        disabled={isProcessing || (!text1 && !text2)}
                        className="w-full sm:w-auto gap-2"
                      >
                        {isProcessing ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            比较中...
                          </>
                        ) : (
                          <>
                            <Diff className="w-4 h-4 mr-2" />
                            开始比较
                          </>
                        )}
                      </Button>
                    </div>
                    
                    {/* 提示信息 */}
                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                      <p className="text-sm text-blue-700">
                        💡 支持文本输入或文件上传进行比较。目前支持行级比较，添加的内容将以绿色高亮，删除的内容将以红色高亮显示。
                      </p>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="result" className="space-y-6">
                    {/* 差异结果统计 */}
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className="bg-gray-50 rounded-lg p-4 text-center border border-gray-200">
                        <div className="text-2xl font-bold text-gray-800">{diffResult.length}</div>
                        <div className="text-sm text-gray-600">总行数</div>
                      </div>
                      <div className="bg-green-50 rounded-lg p-4 text-center border border-green-200">
                        <div className="text-2xl font-bold text-green-600">{diffResult.filter(item => item.type === 'added').length}</div>
                        <div className="text-sm text-green-600">新增行</div>
                      </div>
                      <div className="bg-red-50 rounded-lg p-4 text-center border border-red-200">
                        <div className="text-2xl font-bold text-red-600">{diffResult.filter(item => item.type === 'removed').length}</div>
                        <div className="text-sm text-red-600">删除行</div>
                      </div>
                    </div>
                    
                    {/* 操作按钮 */}
                    <div className="flex justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="px-2 py-1">
                          差异视图
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="secondary" size="sm" onClick={handleCopyResult}>
                          <Copy className="w-4 h-4 mr-1" />
                          复制
                        </Button>
                        <Button variant="secondary" size="sm" onClick={handleDownloadResult}>
                          <FileDown className="w-4 h-4 mr-1" />
                          下载
                        </Button>
                      </div>
                    </div>
                    
                    {/* 差异结果显示 */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="font-medium">差异比较结果</Label>
                      </div>
                      <ScrollArea className="h-80 border rounded-md bg-gray-50">
                        <div className="p-2 font-mono text-sm">
                          {diffResult.length > 0 ? (
                            diffResult.map((item, index) => (
                              <div
                                key={index}
                                className={`flex items-start gap-2 py-1 px-2 rounded-md ${item.type === 'added' ? 'bg-green-50 text-green-800' : item.type === 'removed' ? 'bg-red-50 text-red-800' : 'hover:bg-gray-100'}`}
                              >
                                <span className="flex-shrink-0 w-8 text-right text-gray-500">{item.line}</span>
                                <span className="flex-shrink-0 w-4">
                                  {item.type === 'added' && <span className="text-green-600">+</span>}
                                  {item.type === 'removed' && <span className="text-red-600">-</span>}
                                  {item.type === 'unchanged' && <span className="text-gray-400">│</span>}
                                </span>
                                <span className="flex-1 whitespace-pre-wrap break-all">{item.value}</span>
                              </div>
                            ))
                          ) : (
                            <div className="text-center text-gray-500 py-8">
                              暂无比较结果，请先输入文本并点击开始比较
                            </div>
                          )}
                        </div>
                      </ScrollArea>
                    </div>
                    
                    {/* 合并建议 */}
                    {mergeSuggestions && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="font-medium">合并建议</Label>
                        </div>
                        <ScrollArea className="h-40 border rounded-md bg-blue-50">
                          <div className="p-4 font-mono text-sm text-blue-800 whitespace-pre-wrap">
                            {mergeSuggestions}
                          </div>
                        </ScrollArea>
                      </div>
                    )}
                    
                    {/* 返回按钮 */}
                    <div className="flex justify-center mt-6">
                      <Button
                        variant="outline"
                        onClick={() => setActiveTab('input')}
                      >
                        返回修改输入
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