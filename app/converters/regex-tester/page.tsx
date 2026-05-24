"use client"

import { useState, useEffect } from "react"
import type React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import { TooltipProvider } from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"
import { Search, Copy, AlertCircle, X, ArrowLeft, Code, Settings, Info, Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"

import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

import { Header } from "@/components/Header"
import { useHistory } from "@/hooks/useHistory"

/**
 * @file 正则表达式测试器
 * @description 支持实时匹配结果、常用模式库和语法错误提示的正则表达式测试工具
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-16
 */

// 常用正则表达式模式库
const commonPatterns = [
  {
    name: "邮箱地址",
    pattern: "^[\\w.-]+@[\\w.-]+\\.[a-zA-Z]{2,}$",
    description: "匹配标准邮箱格式"
  },
  {
    name: "手机号码(中国)",
    pattern: "^1[3-9]\\d{9}$",
    description: "匹配中国大陆手机号码"
  },
  {
    name: "URL地址",
    pattern: "^https?:\\/\\/[\\w\\-._~:\\/?#[\\]@!\\$&'\\(\\)\\*\\+,;=]+$",
    description: "匹配HTTP/HTTPS URL"
  },
  {
    name: "IPv4地址",
    pattern: "^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$",
    description: "匹配IPv4地址格式"
  },
  {
    name: "身份证号(中国)",
    pattern: "^[1-9]\\d{5}(18|19|20)\\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\\d|3[01])\\d{3}[\\dXx]$",
    description: "匹配18位中国身份证号码"
  },
  {
    name: "日期格式(YYYY-MM-DD)",
    pattern: "^\\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])$",
    description: "匹配YYYY-MM-DD格式日期"
  },
  {
    name: "整数",
    pattern: "^-?\\d+$",
    description: "匹配正整数、负整数和零"
  },
  {
    name: "浮点数",
    pattern: "^-?\\d+(\\.\\d+)?$",
    description: "匹配浮点数"
  },
  {
    name: "中文字符",
    pattern: "[\\u4e00-\\u9fa5]+",
    description: "匹配中文字符"
  },
  {
    name: "十六进制颜色值",
    pattern: "^#?([a-fA-F0-9]{6}|[a-fA-F0-9]{3})$",
    description: "匹配十六进制颜色值"
  }
]

export default function RegexTester() {
  const [pattern, setPattern] = useState<string>('')
  const [testText, setTestText] = useState<string>('')
  const [matches, setMatches] = useState<{ text: string; index: number; length: number }[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState<boolean>(false)
  const [showPatternLibrary, setShowPatternLibrary] = useState<boolean>(false)
  const [flags, setFlags] = useState({
    global: true,
    ignoreCase: false,
    multiline: false,
    dotAll: false,
    unicode: false,
    sticky: false
  })
  const [highlightedText, setHighlightedText] = useState<string>('')
  const [showExplanation, setShowExplanation] = useState<boolean>(false)
  const [regexExplanation, setRegexExplanation] = useState<string>('')
  
  const { toast } = useToast()
  const { addHistoryItem } = useHistory()
  
  // 实时测试正则表达式
  useEffect(() => {
    if (!pattern || !testText) {
      setMatches([])
      setError(null)
      setHighlightedText(testText)
      return
    }
    
    testRegex()
  }, [pattern, testText, flags])
  
  // 测试正则表达式
  const testRegex = () => {
    setIsProcessing(true)
    setError(null)
    
    // 构建标志字符串
    let flagsStr = ''
    if (flags.global) flagsStr += 'g'
    if (flags.ignoreCase) flagsStr += 'i'
    if (flags.multiline) flagsStr += 'm'
    if (flags.dotAll) flagsStr += 's'
    if (flags.unicode) flagsStr += 'u'
    if (flags.sticky) flagsStr += 'y'
    
    try {
      // 创建正则表达式对象
      const regex = new RegExp(pattern, flagsStr)
      const newMatches: { text: string; index: number; length: number }[] = []
      
      if (flags.global) {
        // 全局匹配
        let match
        while ((match = regex.exec(testText)) !== null) {
          newMatches.push({
            text: match[0],
            index: match.index,
            length: match[0].length
          })
          // 防止零宽度匹配导致的无限循环
          if (match.index === regex.lastIndex) {
            regex.lastIndex++
          }
        }
      } else {
        // 单次匹配
        const match = regex.exec(testText)
        if (match) {
          newMatches.push({
            text: match[0],
            index: match.index,
            length: match[0].length
          })
        }
      }
      
      setMatches(newMatches)
      
      // 生成高亮文本
      generateHighlightedText(newMatches)
      
      // 生成正则表达式解释
      generateRegexExplanation(pattern, flagsStr)
      
      // 添加到历史记录
      if (newMatches.length > 0) {
        addHistoryItem({
          type: "unit",
          input: {
            format: "regex_test_input",
            value: `模式: ${pattern.substring(0, 30)}...`
          },
          output: {
            format: "regex_test_output",
            value: `${newMatches.length} 个匹配结果`
          }
        })
      }
      
    } catch (err) {
      setError((err as Error).message)
      setHighlightedText(testText)
    } finally {
      setIsProcessing(false)
    }
  }
  
  // 生成高亮文本
  const generateHighlightedText = (matchResults: typeof matches) => {
    if (!matchResults.length) {
      setHighlightedText(testText)
      return
    }
    
    // 按照索引排序匹配结果
    const sortedMatches = [...matchResults].sort((a, b) => a.index - b.index)
    
    let highlighted = ''
    let lastIndex = 0
    
    sortedMatches.forEach(match => {
      // 添加匹配前的文本
      highlighted += testText.slice(lastIndex, match.index)
      // 添加高亮的匹配文本
      highlighted += `<mark class="bg-yellow-300 px-0.5 rounded">${testText.slice(match.index, match.index + match.length)}</mark>`
      lastIndex = match.index + match.length
    })
    
    // 添加最后一个匹配后的文本
    highlighted += testText.slice(lastIndex)
    
    setHighlightedText(highlighted)
  }
  
  // 生成正则表达式解释
  const generateRegexExplanation = (regexPattern: string, regexFlags: string) => {
    let explanation = `正则表达式解释:\n\n`
    explanation += `模式: ${regexPattern}\n`
    explanation += `标志: ${regexFlags || '无'}\n\n`
    
    // 简单的解释规则
    if (regexPattern.includes('@')) explanation += `- 包含 @ 字符，可能用于匹配邮箱\n`
    if (regexPattern.includes('\\d')) explanation += `- \\d 匹配数字字符\n`
    if (regexPattern.includes('\\w')) explanation += `- \\w 匹配字母、数字或下划线\n`
    if (regexPattern.includes('\\s')) explanation += `- \\s 匹配空白字符\n`
    if (regexPattern.includes('^')) explanation += `- ^ 匹配字符串开始\n`
    if (regexPattern.includes('$')) explanation += `- $ 匹配字符串结束\n`
    if (regexPattern.includes('+')) explanation += `- + 匹配前面的元素一次或多次\n`
    if (regexPattern.includes('*')) explanation += `- * 匹配前面的元素零次或多次\n`
    if (regexPattern.includes('?')) explanation += `- ? 匹配前面的元素零次或一次\n`
    if (regexFlags.includes('g')) explanation += `- g 全局匹配，查找所有匹配项\n`
    if (regexFlags.includes('i')) explanation += `- i 忽略大小写\n`
    if (regexFlags.includes('m')) explanation += `- m 多行匹配，^ 和 $ 匹配每行的开始和结束\n`
    
    setRegexExplanation(explanation)
  }
  
  // 处理标志变更
  const handleFlagChange = (flagName: keyof typeof flags) => {
    setFlags(prev => ({
      ...prev,
      [flagName]: !prev[flagName]
    }))
  }
  
  // 从模式库选择模式
  const selectPattern = (selectedPattern: typeof commonPatterns[0]) => {
    setPattern(selectedPattern.pattern)
    setShowPatternLibrary(false)
    toast({ title: '已选择', description: selectedPattern.name })
  }
  
  // 复制匹配结果
  const handleCopyMatches = () => {
    const matchesText = matches.map((match, index) => `${index + 1}: ${match.text}`).join('\n')
    navigator.clipboard.writeText(matchesText)
    toast({ title: '已复制', description: '匹配结果已复制到剪贴板' })
  }
  
  // 复制正则表达式
  const handleCopyPattern = () => {
    navigator.clipboard.writeText(pattern)
    toast({ title: '已复制', description: '正则表达式已复制到剪贴板' })
  }
  
  // 清空输入
  const handleClear = () => {
    setPattern('')
    setTestText('')
    setMatches([])
    setError(null)
  }
  
  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-100">
        {/* 动画背景 */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-purple-400/20 to-indigo-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-r from-indigo-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-r from-fuchsia-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse delay-500"></div>
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
              <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Code className="w-6 h-6 text-purple-600" />
                  <CardTitle className="text-2xl font-bold text-slate-800">正则表达式测试器</CardTitle>
                </div>
              </CardHeader>
              
              <CardContent className="p-6">
                {/* 正则表达式输入 */}
                <div className="space-y-4 mb-6">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="pattern" className="font-medium flex items-center gap-2">
                      正则表达式
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="w-4 h-4 text-gray-500 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent side="bottom">
                            <p className="max-w-xs">输入正则表达式模式，不需要包含斜杠分隔符</p>
                          </TooltipContent>
                        </Tooltip>
                    </Label>
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleCopyPattern}
                        disabled={!pattern}
                        className="h-8"
                      >
                        <Copy className="w-4 h-4 mr-1" />
                        复制
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setShowPatternLibrary(!showPatternLibrary)}
                        className="h-8"
                      >
                        <Settings className="w-4 h-4 mr-1" />
                        模式库
                      </Button>
                    </div>
                  </div>
                  
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-500">/</div>
                    <Input
                      id="pattern"
                      value={pattern}
                      onChange={(e) => setPattern(e.target.value)}
                      placeholder="输入正则表达式模式..."
                      className={`pl-8 font-mono ${error ? 'border-red-500' : ''}`}
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-500">/</div>
                  </div>
                  
                  {/* 错误提示 */}
                  {error && (
                    <div className="flex items-start gap-2 text-red-600 text-sm p-3 bg-red-50 rounded-md border border-red-100">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>语法错误: {error}</span>
                    </div>
                  )}
                  
                  {/* 标志选项 */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
                    <div className="flex items-center gap-2">
                      <Switch
                        id="flag-global"
                        checked={flags.global}
                        onCheckedChange={() => handleFlagChange('global')}
                      />
                      <Label htmlFor="flag-global" className="flextext-sm-sm font-medium cursor-pointer">
                        全局匹配 (g)
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        id="flag-ignoreCase"
                        checked={flags.ignoreCase}
                        onCheckedChange={() => handleFlagChange('ignoreCase')}
                      />
                      <Label htmlFor="flag-ignoreCase" className="font-medium cursor-pointer">
                        忽略大小写 (i)
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        id="flag-multiline"
                        checked={flags.multiline}
                        onCheckedChange={() => handleFlagChange('multiline')}
                      />
                      <Label htmlFor="flag-multiline" className="font-medium cursor-pointer">
                        多行匹配 (m)
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        id="flag-dotAll"
                        checked={flags.dotAll}
                        onCheckedChange={() => handleFlagChange('dotAll')}
                      />
                      <Label htmlFor="flag-dotAll" className="font-medium cursor-pointer">
                        点匹配所有 (s)
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        id="flag-unicode"
                        checked={flags.unicode}
                        onCheckedChange={() => handleFlagChange('unicode')}
                      />
                      <Label htmlFor="flag-unicode" className="font-medium cursor-pointer">
                        Unicode (u)
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        id="flag-sticky"
                        checked={flags.sticky}
                        onCheckedChange={() => handleFlagChange('sticky')}
                      />
                      <Label htmlFor="flag-sticky" className="font-medium cursor-pointer">
                        粘性匹配 (y)
                      </Label>
                    </div>
                  </div>
                  
                  {/* 模式库 */}
                  {showPatternLibrary && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200 max-h-60 overflow-y-auto">
                      <h4 className="font-medium mb-3 text-gray-800">常用正则表达式模式</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {commonPatterns.map((item, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            className="justify-start text-left h-auto py-2"
                            onClick={() => selectPattern(item)}
                          >
                            <div className="font-medium">{item.name}</div>
                            <div className="text-xs text-gray-500 mt-1">{item.description}</div>
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* 测试文本输入 */}
                <div className="space-y-4 mb-6">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="testText" className="font-medium">测试文本</Label>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setTestText('')}
                      disabled={!testText}
                      className="h-8"
                    >
                      <X className="w-4 h-4 mr-1" />
                      清空
                    </Button>
                  </div>
                  <Textarea
                    id="testText"
                    value={testText}
                    onChange={(e) => setTestText(e.target.value)}
                    placeholder="输入要测试的文本..."
                    className="h-40 min-h-[100px] resize-y"
                  />
                </div>
                
                {/* 操作按钮 */}
                <div className="flex justify-between mb-6">
                  <Button
                    variant="outline"
                    onClick={handleClear}
                    disabled={!pattern && !testText}
                  >
                    重置所有
                  </Button>
                  <Button
                    onClick={testRegex}
                    disabled={isProcessing || !pattern && !testText}
                    className="gap-2"
                  >
                    {isProcessing ? (
                      <>
                        <Search className="w-4 h-4 mr-2 animate-spin" />
                        匹配中...
                      </>
                    ) : (
                      <>
                        <Search className="w-4 h-4 mr-2" />
                        重新匹配
                      </>
                    )}
                  </Button>
                </div>
                
                {/* 匹配结果 */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="font-medium flex items-center gap-2">
                      匹配结果
                      <Badge variant={matches.length > 0 ? "secondary" : "outline"}>
                        {matches.length} 个匹配
                      </Badge>
                    </Label>
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleCopyMatches}
                        disabled={matches.length === 0}
                        className="h-8"
                      >
                        <Copy className="w-4 h-4 mr-1" />
                        复制结果
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setShowExplanation(!showExplanation)}
                        className="h-8"
                      >
                        {showExplanation ? (
                          <>
                            <EyeOff className="w-4 h-4 mr-1" />
                            隐藏解释
                          </>
                        ) : (
                          <>
                            <Eye className="w-4 h-4 mr-1" />
                            显示解释
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                  
                  {/* 高亮显示的文本 */}
                  <ScrollArea className="h-40 border rounded-md bg-white overflow-x-auto">
                    <div
                      className="p-4 font-mono text-sm whitespace-pre-wrap break-all"
                      dangerouslySetInnerHTML={{ __html: highlightedText || '<span class="text-gray-500">请输入测试文本...</span>' }}
                    />
                  </ScrollArea>
                  
                  {/* 匹配列表 */}
                  {matches.length > 0 && (
                    <div className="mt-4">
                      <ScrollArea className="h-40 border rounded-md bg-gray-50">
                        <div className="p-4 space-y-2">
                          {matches.map((match, index) => (
                            <div key={index} className="flex justify-between items-center p-2 bg-white rounded-md border border-gray-200 hover:bg-gray-50 transition-colors">
                              <div className="flex items-center gap-3">
                                <span className="bg-purple-100 text-purple-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium">{index + 1}</span>
                                <span className="font-mono text-sm">"{match.text}"</span>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                位置: {match.index}, 长度: {match.length}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  )}
                  
                  {/* 正则表达式解释 */}
                  {showExplanation && (
                    <div className="mt-4">
                      <ScrollArea className="h-40 border rounded-md bg-blue-50">
                        <div className="p-4 font-mono text-sm text-blue-800 whitespace-pre-wrap">
                          {regexExplanation}
                        </div>
                      </ScrollArea>
                    </div>
                  )}
                </div>
                
                {/* 提示信息 */}
                <div className="mt-6 bg-blue-50 rounded-xl p-4 border border-blue-100">
                  <p className="text-sm text-blue-700">
                    💡 支持实时正则表达式测试，输入模式和文本后立即显示匹配结果。可以使用模式库快速选择常用的正则表达式，也可以自定义标志选项来调整匹配行为。
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