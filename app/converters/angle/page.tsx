"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, ArrowRight, Calculator, RotateCw, Info } from "lucide-react"
import Link from "next/link"

interface AngleUnit {
  name: string
  symbol: string
  toRadians: (value: number) => number
  fromRadians: (value: number) => number
}

const angleUnits: Record<string, AngleUnit> = {
  degrees: {
    name: "度",
    symbol: "°",
    toRadians: (value: number) => (value * Math.PI) / 180,
    fromRadians: (value: number) => (value * 180) / Math.PI
  },
  radians: {
    name: "弧度",
    symbol: "rad",
    toRadians: (value: number) => value,
    fromRadians: (value: number) => value
  },
  gradians: {
    name: "梯度",
    symbol: "grad",
    toRadians: (value: number) => (value * Math.PI) / 200,
    fromRadians: (value: number) => (value * 200) / Math.PI
  }
}

interface TrigonometricResult {
  sin: number
  cos: number
  tan: number
  asin?: number
  acos?: number
  atan?: number
}

export default function AngleConverter() {
  const [fromUnit, setFromUnit] = useState("degrees")
  const [toUnit, setToUnit] = useState("radians")
  const [inputValue, setInputValue] = useState("")
  const [result, setResult] = useState("")
  const [trigResults, setTrigResults] = useState<TrigonometricResult | null>(null)
  const [angle, setAngle] = useState(0) // 用于可视化的角度（弧度）
  const [precision, setPrecision] = useState(4)

  // 角度换算函数
  const convertAngle = (value: string) => {
    if (!value || isNaN(Number(value))) {
      setResult("")
      setTrigResults(null)
      return
    }

    const num = Number(value)
    const from = angleUnits[fromUnit]
    const to = angleUnits[toUnit]

    // 转换为弧度作为中间单位
    const radians = from.toRadians(num)
    setAngle(radians)
    
    // 从弧度转换为目标单位
    const convertedValue = to.fromRadians(radians)
    setResult(convertedValue.toFixed(precision))

    // 计算三角函数值
    calculateTrigonometricFunctions(radians)
  }

  // 计算三角函数
  const calculateTrigonometricFunctions = (radians: number) => {
    const sin = Math.sin(radians)
    const cos = Math.cos(radians)
    let tan = Math.tan(radians)
    
    // 处理正切值过大的情况
    if (Math.abs(tan) > 1e10) {
      tan = Number.POSITIVE_INFINITY
    }
    
    setTrigResults({
      sin: sin,
      cos: cos,
      tan: tan,
      asin: Math.asin(Math.max(-1, Math.min(1, sin))),
      acos: Math.acos(Math.max(-1, Math.min(1, cos))),
      atan: Math.atan(tan)
    })
  }

  const handleInputChange = (value: string) => {
    setInputValue(value)
    convertAngle(value)
  }

  const swapUnits = () => {
    const temp = fromUnit
    setFromUnit(toUnit)
    setToUnit(temp)
    if (result) {
      setInputValue(result)
      convertAngle(result)
    }
  }

  const formatTrigValue = (value: number | undefined): string => {
    if (value === undefined) return "N/A"
    if (value === Number.POSITIVE_INFINITY) return "∞"
    if (value === Number.NEGATIVE_INFINITY) return "-∞"
    return value.toFixed(precision)
  }

  // 格式化角度显示的逻辑已直接内联到组件中

  // 当精度改变时重新计算
  useEffect(() => {
    if (inputValue) {
      convertAngle(inputValue)
    }
  }, [precision])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-violet-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/">
          <Button variant="outline" className="mb-4 md:mb-6 h-11 px-4 bg-white/90 backdrop-blur-sm hover:bg-white">
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回首页
          </Button>
        </Link>

        <Card className="bg-white/95 backdrop-blur-sm shadow-xl">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b p-4 md:p-6">
            <CardTitle className="flex items-center gap-2 md:gap-3 text-xl md:text-2xl">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-lg">
                <RotateCw className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              角度单位换算器
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6 space-y-6">
            <Tabs defaultValue="converter" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="converter">单位换算</TabsTrigger>
                <TabsTrigger value="trigonometric">三角函数</TabsTrigger>
                <TabsTrigger value="visualization">角度可视化</TabsTrigger>
              </TabsList>

              <TabsContent value="converter" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">从</Label>
                    <Select value={fromUnit} onValueChange={setFromUnit}>
                      <SelectTrigger className="w-full h-12 md:h-14 text-base">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(angleUnits).map(([key, unit]) => (
                          <SelectItem key={key} value={key} className="text-base py-3">
                            {unit.name} ({unit.symbol})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      value={inputValue}
                      onChange={(e) => handleInputChange(e.target.value)}
                      placeholder="输入角度值"
                      className="h-12 md:h-14 text-base"
                    />
                  </div>

                  <div className="flex justify-center">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={swapUnits}
                      className="h-12 w-12 md:h-14 md:w-14 rounded-full hover:bg-blue-50 hover:border-blue-300 transition-all bg-transparent"
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
                      <SelectContent>
                        {Object.entries(angleUnits).map(([key, unit]) => (
                          <SelectItem key={key} value={key} className="text-base py-3">
                            {unit.name} ({unit.symbol})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="h-12 md:h-14 px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg flex items-center">
                      <span className="text-base md:text-lg font-semibold text-blue-900 truncate">
                        {result ? `${result} ${angleUnits[toUnit].symbol}` : "0"}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-base font-semibold">精度设置</Label>
                  <Select value={precision.toString()} onValueChange={(value) => setPrecision(Number(value))}>
                    <SelectTrigger className="w-full h-11 text-base">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[2, 3, 4, 5, 6, 8, 10].map((p) => (
                        <SelectItem key={p} value={p.toString()}>{p} 位小数</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>

              <TabsContent value="trigonometric" className="space-y-6">
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-3 text-blue-800">三角函数计算结果</h3>
                  {trigResults ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-blue-700">sin(θ)</span>
                          <span className="font-mono text-blue-900">{formatTrigValue(trigResults.sin)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-blue-700">cos(θ)</span>
                          <span className="font-mono text-blue-900">{formatTrigValue(trigResults.cos)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-blue-700">tan(θ)</span>
                          <span className="font-mono text-blue-900">{formatTrigValue(trigResults.tan)}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-blue-700">asin(sin(θ))</span>
                          <span className="font-mono text-blue-900">{formatTrigValue(trigResults.asin)} rad</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-blue-700">acos(cos(θ))</span>
                          <span className="font-mono text-blue-900">{formatTrigValue(trigResults.acos)} rad</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-blue-700">atan(tan(θ))</span>
                          <span className="font-mono text-blue-900">{formatTrigValue(trigResults.atan)} rad</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-6 text-gray-500">
                      请先在换算页面输入角度值
                    </div>
                  )}
                </div>

                <div className="bg-indigo-50 border-l-4 border-indigo-500 p-3 rounded-lg">
                  <div className="flex items-start">
                    <Info className="w-5 h-5 text-indigo-600 mr-2 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-indigo-800 mb-1">三角函数公式</h4>
                      <p className="text-sm text-indigo-700 space-y-1">
                        <span>sin(θ) = 对边 / 斜边</span>
                        <span>cos(θ) = 邻边 / 斜边</span>
                        <span>tan(θ) = 对边 / 邻边 = sin(θ) / cos(θ)</span>
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="visualization" className="space-y-4">
                <div className="flex justify-center py-8">
                  <div className="relative" style={{ width: '250px', height: '250px' }}>
                    {/* 圆形背景 */}
                    <svg width="100%" height="100%" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="#e0e7ff"
                        strokeWidth="2"
                      />
                      {/* 角度弧线 */}
                      {inputValue && (
                        <path
                          d={`M 50 50 L 50 5 A 45 45 0 ${angle > Math.PI ? 1 : 0} 1 ${50 + 45 * Math.cos(angle - Math.PI / 2)} ${50 + 45 * Math.sin(angle - Math.PI / 2)}`}
                          fill="none"
                          stroke="#6366f1"
                          strokeWidth="3"
                          strokeLinecap="round"
                        />
                      )}
                      {/* 角度线 */}
                      <line
                        x1="50"
                        y1="50"
                        x2="50"
                        y2="5"
                        stroke="#9ca3af"
                        strokeWidth="2"
                        strokeDasharray="4 2"
                      />
                      {inputValue && (
                        <line
                          x1="50"
                          y1="50"
                          x2={50 + 45 * Math.cos(angle - Math.PI / 2)}
                          y2={50 + 45 * Math.sin(angle - Math.PI / 2)}
                          stroke="#4f46e5"
                          strokeWidth="2"
                          strokeLinecap="round"
                        />
                      )}
                    </svg>
                    {/* 角度标签 */}
                    {inputValue && (
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                        <div className="font-bold text-blue-900 text-lg">
                          {inputValue}
                          <span className="ml-1">{angleUnits[fromUnit].symbol}</span>
                        </div>
                        {fromUnit !== toUnit && (
                          <div className="text-blue-600">
                            = {result} {angleUnits[toUnit].symbol}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                {!inputValue && (
                  <div className="text-center text-gray-500 py-4">
                    请在换算页面输入角度值以查看可视化结果
                  </div>
                )}
              </TabsContent>
            </Tabs>

            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 p-3 md:p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <Calculator className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-slate-700 leading-relaxed">
                  <strong>支持单位：</strong>度 (°)、弧度 (rad)、梯度 (grad)<br />
                  <strong>转换关系：</strong>360° = 2π rad = 400 grad<br />
                  输入数值后自动完成单位换算、三角函数计算和角度可视化显示
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
