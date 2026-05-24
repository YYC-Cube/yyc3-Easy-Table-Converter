"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, ArrowRight, Calculator } from "lucide-react"
import Link from "next/link"

const unitCategories = {
  length: {
    name: "长度",
    units: {
      meter: { name: "米 (m)", ratio: 1 },
      kilometer: { name: "千米 (km)", ratio: 0.001 },
      centimeter: { name: "厘米 (cm)", ratio: 100 },
      millimeter: { name: "毫米 (mm)", ratio: 1000 },
      mile: { name: "英里 (mi)", ratio: 0.000621371 },
      yard: { name: "码 (yd)", ratio: 1.09361 },
      foot: { name: "英尺 (ft)", ratio: 3.28084 },
      inch: { name: "英寸 (in)", ratio: 39.3701 },
    },
  },
  weight: {
    name: "重量",
    units: {
      kilogram: { name: "千克 (kg)", ratio: 1 },
      gram: { name: "克 (g)", ratio: 1000 },
      milligram: { name: "毫克 (mg)", ratio: 1000000 },
      ton: { name: "吨 (t)", ratio: 0.001 },
      pound: { name: "磅 (lb)", ratio: 2.20462 },
      ounce: { name: "盎司 (oz)", ratio: 35.274 },
    },
  },
  temperature: {
    name: "温度",
    units: {
      celsius: { name: "摄氏度 (°C)", ratio: 1 },
      fahrenheit: { name: "华氏度 (°F)", ratio: 1 },
      kelvin: { name: "开尔文 (K)", ratio: 1 },
    },
  },
  area: {
    name: "面积",
    units: {
      squareMeter: { name: "平方米 (m²)", ratio: 1 },
      squareKilometer: { name: "平方千米 (km²)", ratio: 0.000001 },
      squareCentimeter: { name: "平方厘米 (cm²)", ratio: 10000 },
      hectare: { name: "公顷 (ha)", ratio: 0.0001 },
      acre: { name: "英亩 (ac)", ratio: 0.000247105 },
      squareFoot: { name: "平方英尺 (ft²)", ratio: 10.7639 },
    },
  },
  volume: {
    name: "体积",
    units: {
      liter: { name: "升 (L)", ratio: 1 },
      milliliter: { name: "毫升 (mL)", ratio: 1000 },
      cubicMeter: { name: "立方米 (m³)", ratio: 0.001 },
      gallon: { name: "加仑 (gal)", ratio: 0.264172 },
      quart: { name: "夸脱 (qt)", ratio: 1.05669 },
      pint: { name: "品脱 (pt)", ratio: 2.11338 },
    },
  },
}

export default function UnitConverter() {
  const [category, setCategory] = useState("length")
  const [fromUnit, setFromUnit] = useState("meter")
  const [toUnit, setToUnit] = useState("kilometer")
  const [inputValue, setInputValue] = useState("")
  const [result, setResult] = useState("")

  const convertUnit = (value: string) => {
    if (!value || isNaN(Number(value))) {
      setResult("")
      return
    }

    const num = Number(value)
    const currentCategory = unitCategories[category as keyof typeof unitCategories]

    if (category === "temperature") {
      let celsius = 0
      if (fromUnit === "celsius") celsius = num
      else if (fromUnit === "fahrenheit") celsius = (num - 32) * (5 / 9)
      else if (fromUnit === "kelvin") celsius = num - 273.15

      let output = 0
      if (toUnit === "celsius") output = celsius
      else if (toUnit === "fahrenheit") output = celsius * (9 / 5) + 32
      else if (toUnit === "kelvin") output = celsius + 273.15

      setResult(output.toFixed(6))
    } else {
      const fromRatio = (currentCategory.units[fromUnit as keyof typeof currentCategory.units] as { ratio: number }).ratio
      const toRatio = (currentCategory.units[toUnit as keyof typeof currentCategory.units] as { ratio: number }).ratio
      const baseValue = num / fromRatio
      const convertedValue = baseValue * toRatio
      setResult(convertedValue.toFixed(6))
    }
  }

  const handleInputChange = (value: string) => {
    setInputValue(value)
    convertUnit(value)
  }

  const handleCategoryChange = (newCategory: string) => {
    setCategory(newCategory)
    const units = Object.keys(unitCategories[newCategory as keyof typeof unitCategories].units)
    setFromUnit(units[0])
    setToUnit(units[1] || units[0])
    setInputValue("")
    setResult("")
  }

  const swapUnits = () => {
    const temp = fromUnit
    setFromUnit(toUnit)
    setToUnit(temp)
    if (result) {
      setInputValue(result)
      convertUnit(result)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/">
          <Button variant="outline" className="mb-4 md:mb-6 h-11 px-4 bg-white/90 backdrop-blur-sm hover:bg-white">
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回首页
          </Button>
        </Link>

        <Card className="card-unit bg-white/95 backdrop-blur-sm shadow-xl">
          <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50 border-b p-4 md:p-6">
            <CardTitle className="flex items-center gap-2 md:gap-3 text-xl md:text-2xl">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-orange-500 to-amber-500 rounded-xl flex items-center justify-center shadow-lg">
                <Calculator className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              单位换算器
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 md:p-6 space-y-6">
            <div>
              <Label className="text-base font-semibold mb-3 block">选择类别</Label>
              <Select value={category} onValueChange={handleCategoryChange}>
                <SelectTrigger className="w-full h-12 md:h-14 text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(unitCategories).map(([key, cat]) => (
                    <SelectItem key={key} value={key} className="text-base py-3">
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 gap-4 items-end">
              <div className="space-y-3">
                <Label className="text-base font-semibold">从</Label>
                <Select value={fromUnit} onValueChange={setFromUnit}>
                  <SelectTrigger className="w-full h-12 md:h-14 text-base">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(unitCategories[category as keyof typeof unitCategories].units).map(
                      ([key, unit]) => (
                        <SelectItem key={key} value={key} className="text-base py-3">
                          {unit.name}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  value={inputValue}
                  onChange={(e) => handleInputChange(e.target.value)}
                  placeholder="输入数值"
                  className="h-12 md:h-14 text-base"
                />
              </div>

              <div className="flex justify-center">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={swapUnits}
                  className="h-12 w-12 md:h-14 md:w-14 rounded-full hover:bg-orange-50 hover:border-orange-300 transition-all bg-transparent"
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
                    {Object.entries(unitCategories[category as keyof typeof unitCategories].units).map(
                      ([key, unit]) => (
                        <SelectItem key={key} value={key} className="text-base py-3">
                          {unit.name}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
                <div className="h-12 md:h-14 px-4 py-3 bg-gradient-to-r from-orange-50 to-amber-50 border-2 border-orange-200 rounded-lg flex items-center">
                  <span className="text-base md:text-lg font-semibold text-orange-900 truncate">{result || "0"}</span>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-l-4 border-blue-500 p-3 md:p-4 rounded-lg">
              <p className="text-sm text-slate-700 leading-relaxed">
                <strong>提示：</strong>支持长度、重量、温度、面积、体积等常用单位换算，输入数值后自动计算结果
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
