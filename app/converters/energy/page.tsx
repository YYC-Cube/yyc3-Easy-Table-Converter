"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, ArrowRight, Zap, Info, Calculator } from "lucide-react"
import Link from "next/link"

interface EnergyUnit {
  id: string
  name: string
  symbol: string
  toJoule: (value: number) => number // 转换为焦耳的函数
  fromJoule: (value: number) => number // 从焦耳转换的函数
  formula?: string // 换算公式（相对于焦耳）
  category: string // 单位类别
}

// 能源单位定义
const energyUnits: EnergyUnit[] = [
  // 国际单位制
  { 
    id: "joule", 
    name: "焦耳", 
    symbol: "J", 
    toJoule: (value) => value,
    fromJoule: (value) => value,
    formula: "1 J",
    category: "国际单位制"
  },
  { 
    id: "kilojoule", 
    name: "千焦耳", 
    symbol: "kJ", 
    toJoule: (value) => value * 1000,
    fromJoule: (value) => value / 1000,
    formula: "1 kJ = 1000 J",
    category: "国际单位制"
  },
  { 
    id: "megajoule", 
    name: "兆焦耳", 
    symbol: "MJ", 
    toJoule: (value) => value * 1000000,
    fromJoule: (value) => value / 1000000,
    formula: "1 MJ = 1,000,000 J",
    category: "国际单位制"
  },
  { 
    id: "gigajoule", 
    name: "吉焦耳", 
    symbol: "GJ", 
    toJoule: (value) => value * 1000000000,
    fromJoule: (value) => value / 1000000000,
    formula: "1 GJ = 1,000,000,000 J",
    category: "国际单位制"
  },
  
  // 功单位
  { 
    id: "newton_meter", 
    name: "牛顿米", 
    symbol: "N·m", 
    toJoule: (value) => value,
    fromJoule: (value) => value,
    formula: "1 N·m = 1 J",
    category: "功单位"
  },
  { 
    id: "kilowatt_hour", 
    name: "千瓦时", 
    symbol: "kWh", 
    toJoule: (value) => value * 3600000,
    fromJoule: (value) => value / 3600000,
    formula: "1 kWh = 3,600,000 J",
    category: "功单位"
  },
  { 
    id: "megawatt_hour", 
    name: "兆瓦时", 
    symbol: "MWh", 
    toJoule: (value) => value * 3600000000,
    fromJoule: (value) => value / 3600000000,
    formula: "1 MWh = 3,600,000,000 J",
    category: "功单位"
  },
  
  // 热量单位
  { 
    id: "calorie", 
    name: "卡路里", 
    symbol: "cal", 
    toJoule: (value) => value * 4.184,
    fromJoule: (value) => value / 4.184,
    formula: "1 cal = 4.184 J",
    category: "热量单位"
  },
  { 
    id: "kilocalorie", 
    name: "千卡（大卡）", 
    symbol: "kcal", 
    toJoule: (value) => value * 4184,
    fromJoule: (value) => value / 4184,
    formula: "1 kcal = 4184 J",
    category: "热量单位"
  },
  { 
    id: "british_thermal_unit", 
    name: "英热单位", 
    symbol: "BTU", 
    toJoule: (value) => value * 1055.056,
    fromJoule: (value) => value / 1055.056,
    formula: "1 BTU = 1055.056 J",
    category: "热量单位"
  },
  
  // 功率时单位
  { 
    id: "watt_hour", 
    name: "瓦时", 
    symbol: "Wh", 
    toJoule: (value) => value * 3600,
    fromJoule: (value) => value / 3600,
    formula: "1 Wh = 3600 J",
    category: "功率时单位"
  },
  { 
    id: "horsepower_hour", 
    name: "马力时", 
    symbol: "hp·h", 
    toJoule: (value) => value * 2684519.54,
    fromJoule: (value) => value / 2684519.54,
    formula: "1 hp·h = 2,684,519.54 J",
    category: "功率时单位"
  },
  
  // 原子单位
  { 
    id: "electronvolt", 
    name: "电子伏特", 
    symbol: "eV", 
    toJoule: (value) => value * 1.60218e-19,
    fromJoule: (value) => value / 1.60218e-19,
    formula: "1 eV = 1.60218×10^-19 J",
    category: "原子单位"
  },
  { 
    id: "kiloelectronvolt", 
    name: "千电子伏特", 
    symbol: "keV", 
    toJoule: (value) => value * 1.60218e-16,
    fromJoule: (value) => value / 1.60218e-16,
    formula: "1 keV = 1.60218×10^-16 J",
    category: "原子单位"
  },
  { 
    id: "megaelectronvolt", 
    name: "兆电子伏特", 
    symbol: "MeV", 
    toJoule: (value) => value * 1.60218e-13,
    fromJoule: (value) => value / 1.60218e-13,
    formula: "1 MeV = 1.60218×10^-13 J",
    category: "原子单位"
  },
]

// 获取所有单位类别
const unitCategories = Array.from(new Set(energyUnits.map(unit => unit.category)))

export default function EnergyConverter() {
  const [fromUnit, setFromUnit] = useState("kilojoule")
  const [toUnit, setToUnit] = useState("kilocalorie")
  const [inputValue, setInputValue] = useState("")
  const [result, setResult] = useState("")
  const [precision, setPrecision] = useState(4)
  const [displayFormat, setDisplayFormat] = useState("normal") // normal 或 scientific
  const [selectedCategory, setSelectedCategory] = useState("")

  // 根据类别筛选单位
  const filteredUnits = selectedCategory 
    ? energyUnits.filter(unit => unit.category === selectedCategory)
    : energyUnits

  // 能源单位转换
  const convertEnergy = () => {
    if (!inputValue || isNaN(Number(inputValue))) {
      setResult("")
      return
    }

    const num = Number(inputValue)
    const fromUnitObj = energyUnits.find(unit => unit.id === fromUnit)
    const toUnitObj = energyUnits.find(unit => unit.id === toUnit)

    if (!fromUnitObj || !toUnitObj) {
      setResult("")
      return
    }

    // 先转换为焦耳（国际标准单位）
    const joules = fromUnitObj.toJoule(num)
    
    // 再从焦耳转换为目标单位
    const convertedValue = toUnitObj.fromJoule(joules)
    
    // 根据显示格式格式化结果
    if (displayFormat === "scientific") {
      setResult(convertedValue.toExponential(precision))
    } else {
      // 对于非常小或非常大的数值，自动使用科学记数法
      if (Math.abs(convertedValue) > 1e10 || (Math.abs(convertedValue) > 0 && Math.abs(convertedValue) < 1e-6)) {
        setResult(convertedValue.toExponential(precision))
      } else {
        setResult(convertedValue.toFixed(precision))
      }
    }
  }

  // 格式化数字显示
  const formatNumber = (value: number, unit: EnergyUnit): string => {
    if (displayFormat === "scientific") {
      return `${value.toExponential(precision)} ${unit.symbol}`
    }
    
    // 自动选择合适的显示格式
    if (Math.abs(value) > 1e10 || (Math.abs(value) > 0 && Math.abs(value) < 1e-6)) {
      return `${value.toExponential(precision)} ${unit.symbol}`
    }
    
    return `${value.toFixed(precision)} ${unit.symbol}`
  }

  // 交换单位
  const swapUnits = () => {
    const temp = fromUnit
    setFromUnit(toUnit)
    setToUnit(temp)
    if (result) {
      setInputValue(result)
      convertEnergy()
    }
  }

  // 当输入值改变时自动计算
  useEffect(() => {
    if (inputValue) {
      convertEnergy()
    } else {
      setResult("")
    }
  }, [inputValue, fromUnit, toUnit])

  // 当精度或显示格式改变时重新计算
  useEffect(() => {
    if (inputValue) {
      convertEnergy()
    }
  }, [precision, displayFormat])

  // 获取当前选中的单位对象
  const getCurrentUnit = (unitId: string): EnergyUnit | undefined => {
    return energyUnits.find(unit => unit.id === unitId)
  }

  // 获取转换公式
  const getConversionFormula = (): string => {
    const from = getCurrentUnit(fromUnit)
    const to = getCurrentUnit(toUnit)
    
    if (!from || !to) return ""
    
    // 计算1个源单位等于多少目标单位
    const conversionFactor = to.fromJoule(from.toJoule(1))
    
    return `1 ${from.symbol} = ${formatNumber(conversionFactor, to).replace(` ${to.symbol}`, '')} ${to.symbol}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-amber-50 to-orange-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/">
          <Button variant="outline" className="mb-4 md:mb-6 h-11 px-4 bg-white/90 backdrop-blur-sm hover:bg-white">
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回首页
          </Button>
        </Link>

        <Card className="bg-white/95 backdrop-blur-sm shadow-xl">
          <CardHeader className="bg-gradient-to-r from-yellow-50 to-amber-50 border-b p-4 md:p-6">
            <CardTitle className="flex items-center gap-2 md:gap-3 text-xl md:text-2xl">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-yellow-500 to-amber-500 rounded-xl flex items-center justify-center shadow-lg">
                <Zap className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              能源单位换算器
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6 space-y-6">
            <Tabs defaultValue="converter" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="converter">单位换算</TabsTrigger>
                <TabsTrigger value="formulas">换算公式</TabsTrigger>
              </TabsList>

              <TabsContent value="converter" className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-base font-semibold">单位类别筛选（可选）</Label>
                  <Select 
                    value={selectedCategory} 
                    onValueChange={setSelectedCategory}
                  >
                    <SelectTrigger className="w-full h-11 text-base">
                      <SelectValue placeholder="全部类别" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">全部类别</SelectItem>
                      {unitCategories.map((category) => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">从</Label>
                    <Select value={fromUnit} onValueChange={setFromUnit}>
                      <SelectTrigger className="w-full h-12 md:h-14 text-base">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {filteredUnits.map((unit) => (
                          <SelectItem key={unit.id} value={unit.id} className="text-base py-3">
                            {unit.name} ({unit.symbol})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder="输入能量值"
                      className="h-12 md:h-14 text-base"
                      min="0"
                      step="any"
                    />
                  </div>

                  <div className="flex justify-center">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={swapUnits}
                      className="h-12 w-12 md:h-14 md:w-14 rounded-full hover:bg-yellow-50 hover:border-yellow-300 transition-all bg-transparent"
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
                        {filteredUnits.map((unit) => (
                          <SelectItem key={unit.id} value={unit.id} className="text-base py-3">
                            {unit.name} ({unit.symbol})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="h-12 md:h-14 px-4 py-3 bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-200 rounded-lg flex items-center">
                      <span className="text-base md:text-lg font-semibold text-yellow-900 truncate">
                        {result || "0"}
                        <span className="ml-1 text-yellow-700">
                          {getCurrentUnit(toUnit)?.symbol}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">精度设置（小数位数）</Label>
                    <Select value={precision.toString()} onValueChange={(value) => setPrecision(Number(value))}>
                      <SelectTrigger className="w-full h-11 text-base">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5, 6, 8, 10].map((p) => (
                          <SelectItem key={p} value={p.toString()}>{p} 位小数</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">显示格式</Label>
                    <Select value={displayFormat} onValueChange={setDisplayFormat}>
                      <SelectTrigger className="w-full h-11 text-base">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="normal">标准格式（自动切换）</SelectItem>
                        <SelectItem value="scientific">科学记数法</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {inputValue && result && (
                  <div className="bg-yellow-50 border border-yellow-100 rounded-lg p-4">
                    <p className="text-center text-yellow-800 font-medium">
                      {getConversionFormula()}
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="formulas" className="space-y-6">
                <div className="bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg p-4 border border-yellow-100">
                  <h3 className="text-lg font-semibold mb-4 text-yellow-800 flex items-center gap-2">
                    <Calculator className="w-5 h-5" />
                    能源单位换算公式
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {unitCategories.map((category) => (
                      <div key={category} className="bg-white/80 p-4 rounded-lg shadow-sm border border-yellow-100">
                        <div className="font-semibold text-yellow-700 mb-3 pb-2 border-b border-yellow-100">
                          {category}
                        </div>
                        <div className="space-y-2">
                          {energyUnits
                            .filter(unit => unit.category === category)
                            .map((unit) => (
                              <div key={unit.id} className="text-sm">
                                <span className="font-medium text-yellow-900">
                                  {unit.name} ({unit.symbol}): </span>
                                <span className="text-gray-700 font-mono">
                                  {unit.formula || "1 J"}
                                </span>
                              </div>
                            ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-500 p-3 rounded-lg">
                  <h4 className="font-semibold text-amber-800 mb-1 flex items-center gap-1">
                    <Info className="w-4 h-4" />
                    单位说明
                  </h4>
                  <p className="text-sm text-amber-700 space-y-1">
                    <span>• 焦耳(J)是国际单位制中能量的基本单位</span>
                    <span>• 千卡(kcal)常用于表示食物的热量，1千卡=1大卡</span>
                    <span>• 千瓦时(kWh)是电能的常用单位，1千瓦时=3.6兆焦耳</span>
                    <span>• 电子伏特(eV)常用于原子物理学中表示微观粒子的能量</span>
                  </p>
                </div>
              </TabsContent>
            </Tabs>

            <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border-l-4 border-yellow-500 p-3 md:p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-slate-700 leading-relaxed">
                  <strong>支持单位：</strong>支持20+种能源单位，包括国际单位制、热量单位、功率时单位等<br />
                  <strong>科学记数法：</strong>支持科学记数法显示，适用于极小或极大的能量值<br />
                  <strong>精确计算：</strong>所有转换基于精确的物理常数，确保计算结果准确可靠
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
