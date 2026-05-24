"use client"

import { useState } from "react"
import type React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import { TooltipProvider } from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"
import { Copy, CheckCircle, X, Languages, Book, Star, Download, Upload, RefreshCw, Globe, AlertCircle } from "lucide-react"
import { Input } from "@/components/ui/input"

import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"






import { Header } from "@/components/Header"
import { useHistory } from "@/hooks/useHistory"

/**
 * @file 智能文本翻译工具
 * @description 支持50+语言、翻译质量评估和专业领域术语支持的智能翻译工具
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-16
 */

// 语言列表
const languageList = [
  { code: "auto", name: "自动检测" },
  { code: "zh", name: "中文" },
  { code: "en", name: "英语" },
  { code: "ja", name: "日语" },
  { code: "ko", name: "韩语" },
  { code: "fr", name: "法语" },
  { code: "de", name: "德语" },
  { code: "es", name: "西班牙语" },
  { code: "it", name: "意大利语" },
  { code: "ru", name: "俄语" },
  { code: "pt", name: "葡萄牙语" },
  { code: "ar", name: "阿拉伯语" },
  { code: "hi", name: "印地语" },
  { code: "th", name: "泰语" },
  { code: "vi", name: "越南语" },
  { code: "nl", name: "荷兰语" },
  { code: "pl", name: "波兰语" },
  { code: "tr", name: "土耳其语" },
  { code: "sv", name: "瑞典语" },
  { code: "da", name: "丹麦语" },
  { code: "no", name: "挪威语" },
  { code: "fi", name: "芬兰语" },
  { code: "cs", name: "捷克语" },
  { code: "hu", name: "匈牙利语" },
  { code: "ro", name: "罗马尼亚语" },
  { code: "el", name: "希腊语" },
  { code: "bg", name: "保加利亚语" },
  { code: "sl", name: "斯洛文尼亚语" },
  { code: "sk", name: "斯洛伐克语" },
  { code: "uk", name: "乌克兰语" },
  { code: "be", name: "白俄罗斯语" },
  { code: "sr", name: "塞尔维亚语" },
  { code: "hr", name: "克罗地亚语" },
  { code: "bs", name: "波斯尼亚语" },
  { code: "lt", name: "立陶宛语" },
  { code: "lv", name: "拉脱维亚语" },
  { code: "et", name: "爱沙尼亚语" },
  { code: "he", name: "希伯来语" },
  { code: "fa", name: "波斯语" },
  { code: "ur", name: "乌尔都语" },
  { code: "bn", name: "孟加拉语" },
  { code: "pa", name: "旁遮普语" },
  { code: "gu", name: "古吉拉特语" },
  { code: "mr", name: "马拉地语" },
  { code: "te", name: "泰卢固语" },
  { code: "ta", name: "泰米尔语" },
  { code: "kn", name: "卡纳达语" },
  { code: "ml", name: "马拉雅拉姆语" },
  { code: "my", name: "缅甸语" },
  { code: "km", name: "高棉语" },
  { code: "lo", name: "老挝语" },
  { code: "id", name: "印尼语" },
  { code: "ms", name: "马来语" },
  { code: "fil", name: "菲律宾语" },
  { code: "tlh", name: "克林贡语" },
  { code: "cy", name: "威尔士语" },
  { code: "ga", name: "爱尔兰语" }
]

// 专业领域
const domains = [
  { value: "general", label: "通用" },
  { value: "tech", label: "技术" },
  { value: "medical", label: "医学" },
  { value: "legal", label: "法律" },
  { value: "finance", label: "金融" },
  { value: "business", label: "商务" },
  { value: "academic", label: "学术" },
  { value: "literature", label: "文学" },
  { value: "news", label: "新闻" },
  { value: "entertainment", label: "娱乐" }
]

// 翻译质量评估接口
type QualityScore = {
  score: number
  readability: number
  accuracy: number
  fluency: number
  suggestions: string[]
}

// 术语库接口
type TermPair = {
  source: string
  target: string
  domain?: string
  notes?: string
}

export default function TextTranslation() {
  const [sourceText, setSourceText] = useState<string>('')
  const [translatedText, setTranslatedText] = useState<string>('')
  const [sourceLang, setSourceLang] = useState<string>('auto')
  const [targetLang, setTargetLang] = useState<string>('en')
  const [isTranslating, setIsTranslating] = useState<boolean>(false)
  const [qualityScore, setQualityScore] = useState<QualityScore | null>(null)
  const [activeDomain, setActiveDomain] = useState<string>('general')
  const [_showSettings, _setShowSettings] = useState<boolean>(false)
  const [customTerms, setCustomTerms] = useState<TermPair[]>([])
  const [showTerminology, setShowTerminology] = useState<boolean>(false)
  const [_newTerm, _setNewTerm] = useState<TermPair>({ source: '', target: '' })
  const [translationHistory, setTranslationHistory] = useState<Array<{ source: string; target: string; sourceLang: string; targetLang: string; timestamp: Date }>>([])
  const [showHistory, setShowHistory] = useState<boolean>(false)
  const [copied, setCopied] = useState<boolean>(false)
  
  const { toast } = useToast()
  const { addHistoryItem } = useHistory()
  
  // 处理文件上传 - 支持 .txt, .md, .json 文件
  const handleUpload = async () => {
    try {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = '.txt,.md,.json,.csv,.xml,.html'
      
      input.onchange = async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0]
        if (!file) return
        
        const reader = new FileReader()
        reader.onload = (event) => {
          const content = event.target?.result as string
          setSourceText(content)
          toast({ 
            title: '文件上传成功', 
            description: `已加载: ${file.name}` 
          })
        }
        reader.onerror = () => {
          toast({ 
            title: '文件读取失败', 
            description: '无法读取文件内容', 
            variant: 'destructive' 
          })
        }
        reader.readAsText(file)
      }
      
      input.click()
    } catch (error) {
      toast({ title: '上传失败', description: '无法上传文件', variant: 'destructive' })
    }
  }
  
  // 处理复制功能
  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast({ title: '复制成功', description: '内容已复制到剪贴板' })
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast({ title: '复制失败', description: '无法复制内容', variant: 'destructive' })
    }
  }
  
  // 处理下载功能 - 导出翻译结果
  const handleDownload = () => {
    if (!translatedText) {
      toast({ 
        title: '无内容', 
        description: '请先进行翻译再下载', 
        variant: 'destructive' 
      })
      return
    }
    
    try {
      const blob = new Blob([translatedText], { type: 'text/plain;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `translation_${sourceLang}_${targetLang}_${Date.now()}.txt`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      toast({ 
        title: '下载成功', 
        description: '翻译结果已保存到文件' 
      })
    } catch (error) {
      toast({ title: '下载失败', description: '无法下载文件', variant: 'destructive' })
    }
  }
  
  // 处理重置功能
  const handleReset = () => {
    setSourceText('')
    setTranslatedText('')
    setQualityScore(null)
    toast({ title: '已重置', description: '翻译内容已重置' })
  }
  
  // 模拟翻译函数
  const translateText = async (text: string, fromLang: string, toLang: string, domain: string): Promise<string> => {
    // 在实际应用中，这里应该调用真实的翻译API
    // 这里使用模拟的延迟和简单的翻译结果
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 应用自定义术语
    let result = text
    customTerms.forEach(term => {
      // 简单的替换实现，实际应该更复杂
      const regex = new RegExp(term.source, 'gi')
      result = result.replace(regex, term.target)
    })
    
    // 根据不同领域添加前缀，模拟领域特定翻译
    const domainPrefix = {
      tech: '[技术] ',
      medical: '[医学] ',
      legal: '[法律] ',
      finance: '[金融] ',
      business: '[商务] ',
      academic: '[学术] ',
      literature: '[文学] ',
      news: '[新闻] ',
      entertainment: '[娱乐] '
    }[domain] || ''
    
    // 模拟翻译结果
    if (fromLang === 'auto') {
      // 简单检测文本语言（实际应该更复杂）
      const isChinese = /[\u4e00-\u9fa5]/.test(text)
      fromLang = isChinese ? 'zh' : 'en'
    }
    
    // 根据源语言和目标语言生成模拟翻译
    if (fromLang === 'zh' && toLang === 'en') {
      // 中文到英文的简单模拟
      result = `${domainPrefix}Translated from Chinese: ${result}`
    } else if (fromLang === 'en' && toLang === 'zh') {
      // 英文到中文的简单模拟
      result = `${domainPrefix}从英文翻译: ${result}`
    } else {
      // 其他语言组合
      result = `${domainPrefix}Translated text (${fromLang} → ${toLang}): ${result}`
    }
    
    return result
  }
  
  // 评估翻译质量
  const evaluateTranslation = (_original: string, _translated: string): QualityScore => {
    // 模拟质量评估，实际应用中应该使用更复杂的算法
    const baseScore = 85 + Math.random() * 15 // 85-100之间的随机分数
    const readability = 80 + Math.random() * 20
    const accuracy = 75 + Math.random() * 25
    const fluency = 82 + Math.random() * 18
    
    const suggestions = [
      "考虑调整句子结构以提高流畅度",
      "检查专业术语使用是否准确",
      "注意保持原文的语气和风格",
      "可考虑使用更简洁的表达方式"
    ].filter(() => Math.random() > 0.5) // 随机选择一些建议
    
    return {
      score: Math.round(baseScore),
      readability: Math.round(readability),
      accuracy: Math.round(accuracy),
      fluency: Math.round(fluency),
      suggestions
    }
  }
  
  // 处理翻译
  const handleTranslate = async () => {
    if (!sourceText.trim()) {
      toast({ title: '提示', description: '请输入要翻译的文本' })
      return
    }
    
    setIsTranslating(true)
    
    try {
      // 执行翻译
      const result = await translateText(sourceText, sourceLang, targetLang, activeDomain)
      setTranslatedText(result)
      
      // 评估翻译质量
      const quality = evaluateTranslation(sourceText, result)
      setQualityScore(quality)
      
      // 添加到翻译历史
      const historyItem = {
        source: sourceText.substring(0, 100) + (sourceText.length > 100 ? '...' : ''),
        target: result.substring(0, 100) + (result.length > 100 ? '...' : ''),
        sourceLang: sourceLang === 'auto' ? '自动' : languageList.find(lang => lang.code === sourceLang)?.name || sourceLang,
        targetLang: languageList.find(lang => lang.code === targetLang)?.name || targetLang,
        timestamp: new Date()
      }
      
      setTranslationHistory(prev => [historyItem, ...prev.slice(0, 9)]) // 保留最近10条
      
      // 修复历史记录调用格式
        addHistoryItem({
          type: "unit",
          input: {
            format: "translation_input",
            value: `${sourceLang} - ${targetLang} (${activeDomain})`
          },
          output: {
            format: "translation_output",
            value: `翻译质量: ${qualityScore?.score || 0}/100`
          }
        })
      
      toast({ title: '翻译完成', description: `翻译质量评分: ${quality.score}/100` })
      
    } catch (error) {
      toast({ title: '翻译失败', description: '请稍后重试' })
      console.error('Translation error:', error)
    } finally {
      setIsTranslating(false)
    }
  }
  
  // 交换语言
  const handleSwapLanguages = () => {
    if (sourceLang !== 'auto') {
      setSourceLang(targetLang)
      setTargetLang(sourceLang)
      setSourceText(translatedText)
      setTranslatedText(sourceText)
    } else {
      toast({ title: '提示', description: '源语言为自动检测时无法交换' })
    }
  }
  
  // 复制翻译结果功能暂时未使用
  
  // 下载翻译结果功能暂时未使用
  
  // 添加自定义术语功能暂时未使用
  
  // 删除自定义术语功能暂时未使用
  
  // 清空所有功能暂时未使用
  
  // 渲染质量评分条功能暂时未使用
  
  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4 md:p-8 flex flex-col">
        <div className="max-w-7xl w-full mx-auto flex-grow">
          <Header />

          <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-2xl hover:shadow-3xl transition-all duration-300">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Globe className="w-6 h-6 text-blue-600" />
                <CardTitle className="text-2xl font-bold text-slate-800">智能文本翻译工具</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {/* 翻译控制面板 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* 源文本 */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Select value={sourceLang} onValueChange={setSourceLang}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="选择源语言" />
                      </SelectTrigger>
                      <SelectContent>
                        {languageList.map((lang) => (
                          <SelectItem key={lang.code} value={lang.code}>{lang.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setSourceText('')}
                        disabled={!sourceText}
                      >
                        <X className="w-4 h-4 mr-1" />
                        清空
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={handleUpload}
                      >
                        <Upload className="w-4 h-4 mr-1" />
                        上传文件
                      </Button>
                    </div>
                  </div>
                  <Textarea
                    value={sourceText}
                    onChange={(e) => setSourceText(e.target.value)}
                    placeholder="请输入或粘贴要翻译的文本..."
                    className="min-h-[200px] resize-y"
                    maxLength={10000}
                  />
                  <div className="text-xs text-gray-500 text-right">
                    {sourceText.length}/10000 字符
                  </div>
                </div>
                
                {/* 目标文本 */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Select value={targetLang} onValueChange={setTargetLang}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="选择目标语言" />
                      </SelectTrigger>
                      <SelectContent>
                        {languageList.filter(lang => lang.code !== 'auto').map((lang) => (
                          <SelectItem key={lang.code} value={lang.code}>{lang.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleCopy(translatedText)}
                        disabled={!translatedText}
                      >
                        {copied ? (
                          <>
                            <CheckCircle className="w-4 h-4 mr-1" />
                            已复制
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 mr-1" />
                            复制
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={handleDownload}
                        disabled={!translatedText}
                      >
                        <Download className="w-4 h-4 mr-1" />
                        下载
                      </Button>
                    </div>
                  </div>
                  <ScrollArea className="min-h-[200px] max-h-[300px] border rounded-md p-4 bg-gray-50">
                    <div className="whitespace-pre-wrap break-words">
                      {translatedText || '翻译结果将显示在这里...'}
                    </div>
                  </ScrollArea>
                </div>
              </div>
              
              {/* 控制按钮和设置 */}
              <div className="flex flex-wrap justify-between gap-4 mb-6">
                <div className="flex flex-wrap gap-2">
                  <Select value={activeDomain} onValueChange={setActiveDomain}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="专业领域" />
                    </SelectTrigger>
                    <SelectContent>
                      {domains.map((domain) => (
                        <SelectItem key={domain.value} value={domain.value}>{domain.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleSwapLanguages}
                    className="gap-1"
                  >
                    <Languages className="w-4 h-4" />
                    交换语言
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowTerminology(!showTerminology)}
                    className="gap-1"
                  >
                    <Book className="w-4 h-4" />
                    术语库
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowHistory(!showHistory)}
                    className="gap-1"
                  >
                    <Star className="w-4 h-4" />
                    历史记录
                  </Button>
                </div>
                
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    onClick={handleReset}
                  >
                    <RefreshCw className="w-4 h-4 mr-1" />
                    重置所有
                  </Button>
                  <Button
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={handleTranslate}
                    disabled={!sourceText.trim() || isTranslating}
                  >
                    {isTranslating ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                        翻译中...
                      </>
                    ) : (
                      <>
                        <Globe className="w-4 h-4 mr-1" />
                        开始翻译
                      </>
                    )}
                  </Button>
                </div>
              </div>
              
              {/* 术语库设置 */}
              {showTerminology && (
                <div className="mb-6 p-4 border rounded-lg bg-blue-50">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-medium text-lg text-blue-800">术语库管理</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowTerminology(false)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    {customTerms.map((termPair: TermPair, index: number) => (
                      <div key={index} className="flex items-center gap-2 flex-wrap">
                        <Input
                          value={termPair.source}
                          onChange={(e) => {
                            const newTerms = [...customTerms];
                            newTerms[index] = { ...newTerms[index], source: e.target.value };
                            setCustomTerms(newTerms);
                          }}
                          placeholder="源术语"
                          className="w-[150px]"
                        />
                        <span className="text-gray-500">→</span>
                        <Input
                          value={termPair.target}
                          onChange={(e) => {
                            const newTerms = [...customTerms];
                            newTerms[index] = { ...newTerms[index], target: e.target.value };
                            setCustomTerms(newTerms);
                          }}
                          placeholder="目标术语"
                          className="w-[150px]"
                        />
                        <Select
                          value={termPair.domain || 'general'}
                          onValueChange={(value) => {
                            const newTerms = [...customTerms];
                            newTerms[index] = { ...newTerms[index], domain: value };
                            setCustomTerms(newTerms);
                          }}
                        >
                          <SelectTrigger className="w-[120px]">
                            <SelectValue placeholder="领域" />
                          </SelectTrigger>
                          <SelectContent>
                            {domains.map((domain) => (
                              <SelectItem key={domain.value} value={domain.value}>{domain.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            const newTerms = customTerms.filter((_: TermPair, i: number) => i !== index);
                            setCustomTerms(newTerms);
                          }}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        setCustomTerms([...customTerms, { source: '', target: '', domain: 'general' }]);
                      }}
                      className="w-full mt-2"
                    >
                      添加术语对
                    </Button>
                  </div>
                </div>
              )}
              
              {/* 历史记录 */}
              {showHistory && (
                <div className="mb-6 p-4 border rounded-lg bg-indigo-50">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-medium text-lg text-indigo-800">翻译历史</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowHistory(false)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <ScrollArea className="max-h-[200px]">
                    {translationHistory.length > 0 ? (
                      <ul className="space-y-3">
                        {translationHistory.map((item, index) => {
                          // 获取语言名称函数
                          const getLanguageName = (code: string) => {
                            const lang = languageList.find(l => l.code === code);
                            return lang ? lang.name : code;
                          };
                          
                          // 加载历史记录项函数
                          const loadHistoryItem = (historyItem: any) => {
                            setSourceText(historyItem.source);
                            setTranslatedText(historyItem.target);
                            setSourceLang(historyItem.sourceLang);
                            setTargetLang(historyItem.targetLang);
                          };
                          
                          return (
                            <li key={index} className="p-3 bg-white rounded border border-gray-100 hover:shadow-sm transition-shadow">
                              <div className="text-xs text-gray-500 mb-1">
                                {new Date(item.timestamp).toLocaleString()} | {getLanguageName(item.sourceLang)} → {getLanguageName(item.targetLang)}
                              </div>
                              <div className="text-sm line-clamp-2">{item.source}</div>
                              <Separator className="my-2" />
                              <div className="text-sm line-clamp-2 text-gray-700">{item.target}</div>
                              <div className="flex justify-end mt-2 gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => loadHistoryItem(item)}
                                >
                                  加载
                                </Button>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <div className="text-center text-gray-500 py-6">
                        暂无翻译历史
                      </div>
                    )}
                  </ScrollArea>
                </div>
              )}
              
              {/* 翻译质量评估 */}
              {qualityScore && (
                <div className="mb-6 space-y-4">
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-xl border border-green-100">
                    <h3 className="font-medium text-lg text-green-800 mb-2">翻译质量评分</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-green-600 mb-1">{qualityScore.score.toFixed(1)}</div>
                        <div className="text-sm text-green-700">总体评分</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-blue-600 mb-1">{qualityScore.readability.toFixed(1)}</div>
                        <div className="text-sm text-blue-700">可读性</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-purple-600 mb-1">{qualityScore.accuracy.toFixed(1)}</div>
                        <div className="text-sm text-purple-700">准确性</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-amber-600 mb-1">{qualityScore.fluency.toFixed(1)}</div>
                        <div className="text-sm text-amber-700">流畅度</div>
                      </div>
                    </div>
                  </div>
                  
                  {qualityScore.suggestions && qualityScore.suggestions.length > 0 && (
                    <div className="bg-amber-50 p-4 rounded-xl border border-amber-100">
                      <h3 className="font-medium text-lg text-amber-800 mb-2">改进建议</h3>
                      <ul className="space-y-2">
                        {qualityScore.suggestions.map((suggestion, index) => (
                          <li key={index} className="flex gap-2 items-start">
                            <AlertCircle className="w-4 h-4 text-amber-600 mt-1 flex-shrink-0" />
                            <span className="text-sm text-amber-800">{suggestion}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
              
              {/* 提示信息 */}
              <div className="mt-6 bg-blue-50 rounded-xl p-4 border border-blue-100">
                <p className="text-sm text-blue-800 leading-relaxed">
                  通过术语库功能，您可以添加领域特定术语，进一步提高专业术语翻译的准确性。
                  翻译完成后会自动评估翻译质量并提供改进建议。
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </TooltipProvider>
  );
}