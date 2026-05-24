"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, ArrowRight, Database, Info, Plus, X, ChevronDown, ChevronUp } from "lucide-react"
import Link from "next/link"

interface DataUnit {
  name: string
  symbol: string
  baseUnit: string // 基础单位（B, b）
  exponent: number // 相对于基础单位的指数（10^3 或 2^10）
  type: 'decimal' | 'binary' // 十进制或二进制
}

// 数据存储单位定义
const dataUnits: DataUnit[] = [
  // 字节单位（二进制）
  { name: "字节", symbol: "B", baseUnit: "B", exponent: 0, type: "binary" },
  { name: "千字节", symbol: "KB", baseUnit: "B", exponent: 1, type: "binary" },
  { name: "兆字节", symbol: "MB", baseUnit: "B", exponent: 2, type: "binary" },
  { name: "吉字节", symbol: "GB", baseUnit: "B", exponent: 3, type: "binary" },
  { name: "太字节", symbol: "TB", baseUnit: "B", exponent: 4, type: "binary" },
  { name: "拍字节", symbol: "PB", baseUnit: "B", exponent: 5, type: "binary" },
  { name: "艾字节", symbol: "EB", baseUnit: "B", exponent: 6, type: "binary" },
  
  // 字节单位（十进制）
  { name: "字节(十进)", symbol: "B", baseUnit: "B", exponent: 0, type: "decimal" },
  { name: "千字节(十进)", symbol: "kB", baseUnit: "B", exponent: 1, type: "decimal" },
  { name: "兆字节(十进)", symbol: "MB", baseUnit: "B", exponent: 2, type: "decimal" },
  { name: "吉字节(十进)", symbol: "GB", baseUnit: "B", exponent: 3, type: "decimal" },
  { name: "太字节(十进)", symbol: "TB", baseUnit: "B", exponent: 4, type: "decimal" },
  { name: "拍字节(十进)", symbol: "PB", baseUnit: "B", exponent: 5, type: "decimal" },
  { name: "艾字节(十进)", symbol: "EB", baseUnit: "B", exponent: 6, type: "decimal" },
  
  // 比特单位
  { name: "比特", symbol: "bit", baseUnit: "b", exponent: 0, type: "binary" },
  { name: "千比特", symbol: "Kbit", baseUnit: "b", exponent: 1, type: "binary" },
  { name: "兆比特", symbol: "Mbit", baseUnit: "b", exponent: 2, type: "binary" },
  { name: "吉比特", symbol: "Gbit", baseUnit: "b", exponent: 3, type: "binary" },
  { name: "太比特", symbol: "Tbit", baseUnit: "b", exponent: 4, type: "binary" },
]

interface BatchConversionItem {
  id: string
  value: string
  fromUnit: string
  result: string
}

export default function DataUnitConverter() {
  const [fromUnit, setFromUnit] = useState("MB")
  const [toUnit, setToUnit] = useState("GB")
  const [inputValue, setInputValue] = useState("")
  const [result, setResult] = useState("")
  const [precision, setPrecision] = useState(2)
  const [showAdvancedUnits, setShowAdvancedUnits] = useState(false)
  const [batchItems, setBatchItems] = useState<BatchConversionItem[]>([
    { id: "1", value: "", fromUnit: "MB", result: "" }
  ])
  const [batchToUnit, setBatchToUnit] = useState("GB")

  // 筛选显示的单位
  const displayUnits = showAdvancedUnits 
    ? dataUnits 
    : dataUnits.filter(unit => 
        (unit.baseUnit === "B" && unit.exponent <= 3) || 
        (unit.baseUnit === "b" && unit.exponent <= 2)
      )

  // 转换数据单位
  const convertDataUnit = (value: string, fromUnitId: string, toUnitId: string): string => {
    if (!value || isNaN(Number(value))) {
      return ""
    }

    const num = Number(value)
    const fromUnit = dataUnits.find(u => u.symbol === fromUnitId || `${u.symbol}-${u.type}` === fromUnitId)
    const toUnit = dataUnits.find(u => u.symbol === toUnitId || `${u.symbol}-${u.type}` === toUnitId)

    if (!fromUnit || !toUnit) return ""

    // 获取单位的基数（二进制为1024，十进制为1000）
    const fromBase = fromUnit.type === "binary" ? 1024 : 1000
    const toBase = toUnit.type === "binary" ? 1024 : 1000

    // 先转换为基础单位
    let baseValue = num * Math.pow(fromBase, fromUnit.exponent)
    
    // 如果基础单位不同（字节和比特），进行转换（1字节 = 8比特）
    if (fromUnit.baseUnit !== toUnit.baseUnit) {
      if (fromUnit.baseUnit === "B" && toUnit.baseUnit === "b") {
        baseValue *= 8 // 字节转比特
      } else if (fromUnit.baseUnit === "b" && toUnit.baseUnit === "B") {
        baseValue /= 8 // 比特转字节
      }
    }

    // 从基础单位转换为目标单位
    const convertedValue = baseValue / Math.pow(toBase, toUnit.exponent)
    return convertedValue.toFixed(precision)
  }

  // 处理单个转换
  const handleSingleConvert = () => {
    const resultValue = convertDataUnit(inputValue, fromUnit, toUnit)
    setResult(resultValue)
  }

  // 处理批量转换
  const handleBatchConvert = () => {
    const updatedItems = batchItems.map(item => ({
      ...item,
      result: convertDataUnit(item.value, item.fromUnit, batchToUnit)
    }))
    setBatchItems(updatedItems)
  }

  // 添加批量转换项
  const addBatchItem = () => {
    if (batchItems.length < 10) { // 限制最多10个批量项
      setBatchItems([
        ...batchItems,
        { id: Date.now().toString(), value: "", fromUnit: "MB", result: "" }
      ])
    }
  }

  // 移除批量转换项
  const removeBatchItem = (id: string) => {
    if (batchItems.length > 1) {
      setBatchItems(batchItems.filter(item => item.id !== id))
    }
  }

  // 更新批量项的值
  const updateBatchItem = (id: string, field: keyof BatchConversionItem, value: string) => {
    setBatchItems(batchItems.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ))
  }

  // 当精度改变时重新计算
  useEffect(() => {
    if (inputValue) {
      handleSingleConvert()
    }
    // 重新计算批量转换结果
    handleBatchConvert()
  }, [precision])

  // 当输入值改变时自动计算
  useEffect(() => {
    if (inputValue) {
      handleSingleConvert()
    } else {
      setResult("")
    }
  }, [inputValue, fromUnit, toUnit])

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-fuchsia-50 to-pink-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/">
          <Button variant="outline" className="mb-4 md:mb-6 h-11 px-4 bg-white/90 backdrop-blur-sm hover:bg-white">
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回首页
          </Button>
        </Link>

        <Card className="bg-white/95 backdrop-blur-sm shadow-xl">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-fuchsia-50 border-b p-4 md:p-6">
            <CardTitle className="flex items-center gap-2 md:gap-3 text-xl md:text-2xl">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-purple-500 to-fuchsia-500 rounded-xl flex items-center justify-center shadow-lg">
                <Database className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              数据存储单位换算器
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6 space-y-6">
            <Tabs defaultValue="single" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="single">单次转换</TabsTrigger>
                <TabsTrigger value="batch">批量换算</TabsTrigger>
              </TabsList>

              <TabsContent value="single" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">从</Label>
                    <Select value={fromUnit} onValueChange={setFromUnit}>
                      <SelectTrigger className="w-full h-12 md:h-14 text-base">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {displayUnits.map((unit, index) => {
                          const value = unit.type === "binary" && unit.baseUnit === "B" && index > 0 && index < 7
                            ? unit.symbol // 二进制字节单位使用简单符号
                            : `${unit.symbol}-${unit.type}` // 其他单位添加类型标识
                          return (
                            <SelectItem key={value} value={value} className="text-base py-3">
                              {unit.name} ({unit.symbol})
                            </SelectItem>
                          )
                        })}
                        {!showAdvancedUnits && (
                          <Button 
                            variant="ghost" 
                            className="w-full justify-center text-purple-600 hover:text-purple-800 py-2"
                            onClick={() => setShowAdvancedUnits(true)}
                          >
                            显示高级单位 <ChevronDown className="w-4 h-4 ml-1" />
                          </Button>
                        )}
                        {showAdvancedUnits && (
                          <Button 
                            variant="ghost" 
                            className="w-full justify-center text-purple-600 hover:text-purple-800 py-2"
                            onClick={() => setShowAdvancedUnits(false)}
                          >
                            显示常用单位 <ChevronUp className="w-4 h-4 ml-1" />
                          </Button>
                        )}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder="输入数值"
                      className="h-12 md:h-14 text-base"
                      min="0"
                      step="any"
                    />
                  </div>

                  <div className="flex justify-center">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        const temp = fromUnit
                        setFromUnit(toUnit)
                        setToUnit(temp)
                        if (result) {
                          setInputValue(result)
                          setResult(inputValue)
                        }
                      }}
                      className="h-12 w-12 md:h-14 md:w-14 rounded-full hover:bg-purple-50 hover:border-purple-300 transition-all bg-transparent"
                    >
                      <ArrowRight className="w-5 h-5 md:w-6 md:h-6 rotate-90 md:rotate-0" />
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-base font-semibold">到</Label>
                    <Select value={toUnit} onValueChange={setToUnit}>
                      <SelectTrigger className="w-full h-12 md:h-14 text-base">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {displayUnits.map((unit, index) => {
                          const value = unit.type === "binary" && unit.baseUnit === "B" && index > 0 && index < 7
                            ? unit.symbol
                            : `${unit.symbol}-${unit.type}`
                          return (
                            <SelectItem key={value} value={value} className="text-base py-3">
                              {unit.name} ({unit.symbol})
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                    <div className="h-12 md:h-14 px-4 py-3 bg-gradient-to-r from-purple-50 to-fuchsia-50 border-2 border-purple-200 rounded-lg flex items-center">
                      <span className="text-base md:text-lg font-semibold text-purple-900 truncate">
                        {result || "0"}
                        <span className="ml-1 text-purple-700">
                          {dataUnits.find(u => 
                            u.symbol === toUnit || `${u.symbol}-${u.type}` === toUnit
                          )?.symbol}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-base font-semibold">精度设置（小数位数）</Label>
                  <div className="flex gap-3">
                    <Select value={precision.toString()} onValueChange={(value) => setPrecision(Number(value))}>
                      <SelectTrigger className="w-full md:w-48 h-12 text-base">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[0, 1, 2, 3, 4, 5, 6, 8, 10].map((p) => (
                          <SelectItem key={p} value={p.toString()}>{p} 位小数</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button 
                      className="bg-purple-600 hover:bg-purple-700 h-12 px-6 md:flex-shrink-0"
                      onClick={handleSingleConvert}
                    >
                      重新计算
                    </Button>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="batch" className="space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <Label className="text-base font-semibold">转换目标单位</Label>
                    <Button 
                      size="sm" 
                      className="bg-purple-600 hover:bg-purple-700"
                      onClick={handleBatchConvert}
                    >
                      批量计算
                    </Button>
                  </div>
                  <Select value={batchToUnit} onValueChange={setBatchToUnit}>
                    <SelectTrigger className="w-full h-12 text-base">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="max-h-[200px]">
                      {displayUnits.slice(0, 10).map((unit, index) => {
                        const value = unit.type === "binary" && unit.baseUnit === "B" && index > 0 && index < 7
                          ? unit.symbol
                          : `${unit.symbol}-${unit.type}`
                        return (
                          <SelectItem key={value} value={value} className="text-base py-3">
                            {unit.name} ({unit.symbol})
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  {batchItems.map((item, index) => (
                    <div key={item.id} className="flex gap-3 items-center">
                      <div className="w-8 text-center text-gray-500 font-medium">{index + 1}</div>
                      <Input
                        type="number"
                        value={item.value}
                        onChange={(e) => updateBatchItem(item.id, "value", e.target.value)}
                        placeholder="输入数值"
                        className="h-12 flex-1"
                        min="0"
                        step="any"
                      />
                      <Select 
                        value={item.fromUnit} 
                        onValueChange={(value) => updateBatchItem(item.id, "fromUnit", value)}
                      >
                        <SelectTrigger className="w-32 h-12 text-base">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {displayUnits.slice(0, 7).map((unit, idx) => {
                            const value = unit.type === "binary" && unit.baseUnit === "B" && idx > 0 && idx < 7
                              ? unit.symbol
                              : `${unit.symbol}-${unit.type}`
                            return (
                              <SelectItem key={value} value={value} className="py-2">
                                {unit.symbol}
                              </SelectItem>
                            )
                          })}
                        </SelectContent>
                      </Select>
                      <div className="h-12 px-3 py-2 bg-gradient-to-r from-purple-50 to-fuchsia-50 border border-purple-200 rounded-lg min-w-[120px] flex items-center justify-end">
                        <span className="text-sm font-medium text-purple-900">
                          {item.result || "0"}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeBatchItem(item.id)}
                        disabled={batchItems.length === 1}
                        className="h-8 w-8 text-gray-400 hover:text-red-500"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="ghost"
                    onClick={addBatchItem}
                    disabled={batchItems.length >= 10}
                    className="w-full flex items-center justify-center gap-2 text-purple-600 hover:text-purple-800 hover:bg-purple-50 mt-2"
                  >
                    <Plus className="h-4 w-4" />
                    添加更多转换项（最多10项）
                  </Button>
                </div>
              </TabsContent>
            </Tabs>

            <div className="bg-gradient-to-r from-purple-50 to-fuchsia-50 border-l-4 border-purple-500 p-3 md:p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-slate-700 leading-relaxed">
                  <strong>支持单位：</strong>字节(B)、千字节(KB)、兆字节(MB)、吉字节(GB)、太字节(TB)等<br />
                  <strong>换算标准：</strong>支持二进制(1024)和十进制(1000)两种换算标准<br />
                  <strong>字节与比特：</strong>1字节 = 8比特，系统会自动处理单位转换
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
