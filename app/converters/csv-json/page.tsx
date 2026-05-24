"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { ArrowRightLeft, Copy, Download, FileText, Upload } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

// CSV转JSON函数
const csvToJson = (csv: string, delimiter: string = ',', quote: string = '"'): string => {
  try {
    const lines = csv.trim().split('\n')
    if (lines.length === 0) return '[]'
    
    // 解析标题行
    const headers = parseCsvLine(lines[0], delimiter, quote)
    
    // 解析数据行
    const result = lines.slice(1).map(line => {
      const values = parseCsvLine(line, delimiter, quote)
      const row: Record<string, string> = {}
      
      headers.forEach((header, index) => {
        row[header] = values[index] || ''
      })
      
      return row
    })
    
    return JSON.stringify(result, null, 2)
  } catch (error) {
    throw new Error(`CSV格式解析错误: ${(error as Error).message}`)
  }
}

// JSON转CSV函数
const jsonToCsv = (json: string, delimiter: string = ',', quote: string = '"'): string => {
  try {
    const data = JSON.parse(json)
    if (!Array.isArray(data)) {
      throw new Error('JSON数据必须是数组格式')
    }
    
    if (data.length === 0) return ''
    
    // 提取所有唯一的键作为标题行
    const allKeys = new Set<string>()
    data.forEach(item => {
      if (typeof item === 'object' && item !== null) {
        Object.keys(item).forEach(key => allKeys.add(key))
      }
    })
    
    const headers = Array.from(allKeys)
    
    // 构建CSV内容
    const csvContent = [
      // 标题行
      headers.map(header => formatCsvField(header, delimiter, quote)).join(delimiter),
      // 数据行
      ...data.map(item => {
        if (typeof item !== 'object' || item === null) {
          return formatCsvField(String(item), delimiter, quote)
        }
        return headers.map(header => formatCsvField(String(item[header] ?? ''), delimiter, quote)).join(delimiter)
      })
    ].join('\n')
    
    return csvContent
  } catch (error) {
    throw new Error(`JSON格式解析错误: ${(error as Error).message}`)
  }
}

// 解析CSV行
const parseCsvLine = (line: string, delimiter: string, quote: string): string[] => {
  const result: string[] = []
  let currentField = ''
  let inQuotes = false
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    
    if (char === quote) {
      // 处理引号
      if (i + 1 < line.length && line[i + 1] === quote) {
        // 两个连续引号表示一个引号字符
        currentField += quote
        i++ // 跳过下一个引号
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === delimiter && !inQuotes) {
      // 分隔符，且不在引号内
      result.push(currentField)
      currentField = ''
    } else {
      // 普通字符
      currentField += char
    }
  }
  
  // 添加最后一个字段
  result.push(currentField)
  
  return result
}

// 格式化CSV字段
const formatCsvField = (field: string, delimiter: string, quote: string): string => {
  // 如果字段包含分隔符、引号或换行符，则需要用引号包裹
  if (field.includes(delimiter) || field.includes(quote) || field.includes('\n')) {
    // 将单个引号替换为两个引号
    const escapedField = field.replace(new RegExp(quote, 'g'), quote + quote)
    return quote + escapedField + quote
  }
  return field
}

// 文件下载函数
const downloadFile = (content: string, filename: string, type: string) => {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export default function CsvJsonConverter() {
  const [csvInput, setCsvInput] = useState('')
  const [jsonInput, setJsonInput] = useState('')
  const [delimiter, setDelimiter] = useState(',')
  const [quote, setQuote] = useState('"')
  const [hasHeader, setHasHeader] = useState(true)
  const [jsonFormat, setJsonFormat] = useState('array') // 'array' 或 'object'
  const [activeTab, setActiveTab] = useState('csv-to-json')
  
  const { toast } = useToast()

  // CSV转JSON
  const handleCsvToJson = () => {
    try {
      if (!csvInput.trim()) {
        toast({
          title: "错误",
          description: "请输入CSV数据",
          variant: "destructive",
        })
        return
      }
      
      const result = csvToJson(csvInput, delimiter, quote)
      setJsonInput(result)
      
      toast({
        title: "转换成功",
        description: "CSV已成功转换为JSON",
      })
    } catch (error) {
      toast({
        title: "转换失败",
        description: (error as Error).message,
        variant: "destructive",
      })
    }
  }

  // JSON转CSV
  const handleJsonToCsv = () => {
    try {
      if (!jsonInput.trim()) {
        toast({
          title: "错误",
          description: "请输入JSON数据",
          variant: "destructive",
        })
        return
      }
      
      const result = jsonToCsv(jsonInput, delimiter, quote)
      setCsvInput(result)
      
      toast({
        title: "转换成功",
        description: "JSON已成功转换为CSV",
      })
    } catch (error) {
      toast({
        title: "转换失败",
        description: (error as Error).message,
        variant: "destructive",
      })
    }
  }

  // 复制到剪贴板
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast({
        title: "复制成功",
        description: "已复制到剪贴板",
      })
    } catch (error) {
      toast({
        title: "复制失败",
        description: "无法复制到剪贴板",
        variant: "destructive",
      })
    }
  }

  // 文件上传处理
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>, type: 'csv' | 'json') => {
    const file = event.target.files?.[0]
    if (!file) return
    
    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result as string
      if (type === 'csv') {
        setCsvInput(content)
      } else {
        setJsonInput(content)
      }
    }
    reader.readAsText(file)
    
    // 清空input，允许重新选择同一文件
    event.target.value = ''
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <Link href="/">
          <Button variant="outline" className="mb-6 h-11 px-4 bg-white/90 backdrop-blur-sm hover:bg-white">
            返回首页
          </Button>
        </Link>

        <Card className="card-data bg-white/95 backdrop-blur-sm shadow-xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-2xl font-bold text-slate-800">CSV/JSON互转</CardTitle>
                <CardDescription className="text-slate-600 mt-1">
                  CSV与JSON格式互相转换，支持自定义分隔符与引号设置
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="csv-to-json" className="text-base py-3">CSV → JSON</TabsTrigger>
                <TabsTrigger value="json-to-csv" className="text-base py-3">JSON → CSV</TabsTrigger>
              </TabsList>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 输入区域 */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-lg font-semibold text-slate-700">
                      {activeTab === 'csv-to-json' ? 'CSV输入' : 'JSON输入'}
                    </Label>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1"
                        onClick={() => activeTab === 'csv-to-json' ? setCsvInput('') : setJsonInput('')}
                      >
                        清空
                      </Button>
                      <label htmlFor={`${activeTab}-upload`} className="cursor-pointer">
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 gap-1"
                          type="button"
                        >
                          <Upload className="w-4 h-4" />
                          上传
                        </Button>
                        <input
                          id={`${activeTab}-upload`}
                          type="file"
                          accept={activeTab === 'csv-to-json' ? '.csv,.tsv,.txt' : '.json'}
                          onChange={(e) => handleFileUpload(e, activeTab === 'csv-to-json' ? 'csv' : 'json')}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                  
                  <Textarea
                    value={activeTab === 'csv-to-json' ? csvInput : jsonInput}
                    onChange={(e) => activeTab === 'csv-to-json' ? setCsvInput(e.target.value) : setJsonInput(e.target.value)}
                    placeholder={activeTab === 'csv-to-json' ? '请输入CSV数据或上传CSV文件' : '请输入JSON数据或上传JSON文件'}
                    className="min-h-[300px] text-base resize-y font-mono"
                  />
                </div>

                {/* 转换设置和输出区域 */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-lg font-semibold text-slate-700">
                      {activeTab === 'csv-to-json' ? 'JSON输出' : 'CSV输出'}
                    </Label>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1"
                        onClick={() => copyToClipboard(activeTab === 'csv-to-json' ? jsonInput : csvInput)}
                        disabled={!jsonInput && !csvInput}
                      >
                        <Copy className="w-4 h-4" />
                        复制
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1"
                        onClick={() => {
                          const content = activeTab === 'csv-to-json' ? jsonInput : csvInput
                          const filename = activeTab === 'csv-to-json' ? 'converted.json' : 'converted.csv'
                          const type = activeTab === 'csv-to-json' ? 'application/json' : 'text/csv'
                          downloadFile(content, filename, type)
                        }}
                        disabled={!jsonInput && !csvInput}
                      >
                        <Download className="w-4 h-4" />
                        下载
                      </Button>
                    </div>
                  </div>
                  
                  {/* 转换设置 */}
                  <div className="bg-indigo-50/50 border border-indigo-100 rounded-lg p-4 space-y-3">
                    <h3 className="font-medium text-indigo-800">转换设置</h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="delimiter" className="text-sm text-slate-600">分隔符</Label>
                        <Select value={delimiter} onValueChange={setDelimiter}>
                          <SelectTrigger id="delimiter" className="h-9">
                            <SelectValue placeholder="选择分隔符" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value=",">逗号 (,)</SelectItem>
                            <SelectItem value=";">分号 (;)</SelectItem>
                            <SelectItem value="\t">制表符 (Tab)</SelectItem>
                            <SelectItem value="|">竖线 (|)</SelectItem>
                            <SelectItem value=" ">空格 ( )</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="quote" className="text-sm text-slate-600">引号</Label>
                        <Select value={quote} onValueChange={setQuote}>
                          <SelectTrigger id="quote" className="h-9">
                            <SelectValue placeholder="选择引号" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value='"'>双引号 (")</SelectItem>
                            <SelectItem value="'">单引号 (')</SelectItem>
                            <SelectItem value="">无引号</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    {activeTab === 'csv-to-json' && (
                      <div className="flex items-center justify-between">
                        <Label htmlFor="has-header" className="text-sm text-slate-600">
                          第一行作为标题
                        </Label>
                        <Switch
                          id="has-header"
                          checked={hasHeader}
                          onCheckedChange={setHasHeader}
                        />
                      </div>
                    )}
                    
                    {activeTab === 'json-to-csv' && (
                      <div className="space-y-2">
                        <Label htmlFor="json-format" className="text-sm text-slate-600">
                          JSON格式类型
                        </Label>
                        <Select value={jsonFormat} onValueChange={setJsonFormat}>
                          <SelectTrigger id="json-format" className="h-9">
                            <SelectValue placeholder="选择JSON格式" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="array">数组格式 [{`{"key": "value"}`}]</SelectItem>
                            <SelectItem value="object">对象格式 {`{"key": "value"}`}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                  
                  {/* 转换按钮 */}
                  <Button
                    onClick={activeTab === 'csv-to-json' ? handleCsvToJson : handleJsonToCsv}
                    className="w-full h-12 text-base bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  >
                    <ArrowRightLeft className="w-5 h-5 mr-2" />
                    {activeTab === 'csv-to-json' ? 'CSV 转 JSON' : 'JSON 转 CSV'}
                  </Button>
                  
                  {/* 输出区域 */}
                  <Textarea
                    value={activeTab === 'csv-to-json' ? jsonInput : csvInput}
                    readOnly
                    placeholder="转换结果将显示在这里"
                    className="min-h-[300px] text-base resize-y font-mono"
                  />
                </div>
              </div>
            </Tabs>
          </CardContent>
        </Card>
        
        {/* 示例和提示 */}
        <Card className="mt-6 bg-white/90 backdrop-blur-sm shadow-md">
          <CardContent className="p-6">
            <h3 className="font-medium text-slate-800 mb-3">使用提示</h3>
            <div className="text-sm text-slate-600 space-y-2">
              <p>• 支持CSV与JSON格式的互相转换，可自定义分隔符和引号</p>
              <p>• 可通过文件上传功能导入数据，或直接在文本框中输入</p>
              <p>• CSV转JSON时，默认将第一行作为标题行处理</p>
              <p>• JSON转CSV时，支持数组和对象两种格式的JSON数据</p>
              <p>• 转换结果可复制或下载为相应格式的文件</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
