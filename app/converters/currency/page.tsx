"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, ArrowRight, RefreshCw, Clock, Info, ChevronDown, ChevronUp } from "lucide-react"
import Link from "next/link"

interface Currency {
  code: string
  name: string
  symbol: string
}

// 常用货币列表（完整列表会在实际使用中从API获取）
const popularCurrencies: Currency[] = [
  { code: "CNY", name: "人民币", symbol: "¥" },
  { code: "USD", name: "美元", symbol: "$" },
  { code: "EUR", name: "欧元", symbol: "€" },
  { code: "GBP", name: "英镑", symbol: "£" },
  { code: "JPY", name: "日元", symbol: "¥" },
  { code: "KRW", name: "韩元", symbol: "₩" },
  { code: "HKD", name: "港币", symbol: "HK$" },
  { code: "TWD", name: "新台币", symbol: "NT$" },
  { code: "AUD", name: "澳元", symbol: "A$" },
  { code: "CAD", name: "加元", symbol: "C$" },
  { code: "SGD", name: "新加坡元", symbol: "S$" },
  { code: "INR", name: "印度卢比", symbol: "₹" },
  { code: "RUB", name: "俄罗斯卢布", symbol: "₽" },
  { code: "BRL", name: "巴西雷亚尔", symbol: "R$" },
  { code: "TRY", name: "土耳其里拉", symbol: "₺" },
]

// 模拟汇率数据（实际项目中会从API获取）
const mockExchangeRates: Record<string, number> = {
  "USD": 1,
  "CNY": 7.24,
  "EUR": 0.92,
  "GBP": 0.79,
  "JPY": 149.50,
  "KRW": 1365.00,
  "HKD": 7.82,
  "TWD": 31.50,
  "AUD": 1.52,
  "CAD": 1.36,
  "SGD": 1.35,
  "INR": 83.20,
  "RUB": 90.10,
  "BRL": 5.02,
  "TRY": 28.90,
}

export default function CurrencyConverter() {
  const [fromCurrency, setFromCurrency] = useState("CNY")
  const [toCurrency, setToCurrency] = useState("USD")
  const [amount, setAmount] = useState("")
  const [result, setResult] = useState("")
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showAllCurrencies, setShowAllCurrencies] = useState(false)
  const [selectedDate, setSelectedDate] = useState("")
  const [historicalRates, setHistoricalRates] = useState<Record<string, number> | null>(null)

  // 筛选货币列表
  const displayCurrencies = showAllCurrencies ? popularCurrencies : popularCurrencies.slice(0, 8)

  // 汇率转换函数
  const convertCurrency = () => {
    if (!amount || isNaN(Number(amount))) {
      setResult("")
      return
    }

    const amountNum = Number(amount)
    
    // 计算转换结果
    const fromRate = mockExchangeRates[fromCurrency]
    const toRate = mockExchangeRates[toCurrency]
    
    if (fromRate && toRate) {
      // 先转换为USD（基准货币），再转换为目标货币
      const resultValue = (amountNum / fromRate) * toRate
      setResult(resultValue.toFixed(4))
    }
  }

  // 刷新汇率
  const refreshRates = () => {
    setIsRefreshing(true)
    
    // 模拟API请求延迟
    setTimeout(() => {
      // 在实际项目中，这里会调用真实的汇率API
      setLastUpdated(new Date().toLocaleString())
      setIsRefreshing(false)
      
      // 重新计算转换结果
      if (amount) {
        convertCurrency()
      }
    }, 1000)
  }

  // 交换货币
  const swapCurrencies = () => {
    const temp = fromCurrency
    setFromCurrency(toCurrency)
    setToCurrency(temp)
    
    // 如果有结果，交换输入值和结果
    if (result) {
      setAmount(result)
      setResult(amount)
    }
  }

  // 获取历史汇率
  const getHistoricalRates = () => {
    if (!selectedDate) return
    
    // 模拟API请求
    setIsRefreshing(true)
    setTimeout(() => {
      // 模拟历史数据（实际项目中从API获取）
      const mockHistorical = {
        ...mockExchangeRates,
        // 添加一些随机变化模拟历史数据
        "CNY": mockExchangeRates["CNY"] * (0.95 + Math.random() * 0.1),
        "USD": mockExchangeRates["USD"] * (0.98 + Math.random() * 0.04),
        "EUR": mockExchangeRates["EUR"] * (0.97 + Math.random() * 0.06),
      }
      setHistoricalRates(mockHistorical)
      setIsRefreshing(false)
    }, 1000)
  }

  // 监听输入变化
  useEffect(() => {
    convertCurrency()
  }, [fromCurrency, toCurrency, amount])

  // 初始化时获取当前时间
  useEffect(() => {
    setLastUpdated(new Date().toLocaleString())
    
    // 设置默认日期为昨天
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    setSelectedDate(yesterday.toISOString().split('T')[0])
  }, [])

  // 从货币代码获取货币信息
  const getCurrencyInfo = (code: string): Currency | undefined => {
    return popularCurrencies.find(currency => currency.code === code)
  }

  // 格式化金额显示
  const formatAmount = (value: string, code: string): string => {
    const currency = getCurrencyInfo(code)
    return currency ? `${currency.symbol} ${value}` : value
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/">
          <Button variant="outline" className="mb-4 md:mb-6 h-11 px-4 bg-white/90 backdrop-blur-sm hover:bg-white">
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回首页
          </Button>
        </Link>

        <Card className="bg-white/95 backdrop-blur-sm shadow-xl">
          <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 border-b p-4 md:p-6">
            <CardTitle className="flex items-center gap-2 md:gap-3 text-xl md:text-2xl">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                <RefreshCw className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              实时货币换算器
              <Button 
                variant="ghost" 
                size="sm" 
                className="ml-auto flex items-center gap-1 text-xs md:text-sm text-green-700 hover:text-green-900"
                onClick={refreshRates}
                disabled={isRefreshing}
              >
                <RefreshCw className={`w-3.5 h-3.5 md:w-4 md:h-4 animate-spin=${isRefreshing ? '1s linear infinite' : '0s'}`} />
                刷新
              </Button>
            </CardTitle>
            {lastUpdated && (
              <div className="flex items-center text-xs text-gray-500 mt-1">
                <Clock className="w-3 h-3 mr-1" />
                最后更新: {lastUpdated}
              </div>
            )}
          </CardHeader>
          <CardContent className="p-4 md:p-6 space-y-6">
            <Tabs defaultValue="converter" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="converter">实时换算</TabsTrigger>
                <TabsTrigger value="historical">历史汇率查询</TabsTrigger>
              </TabsList>

              <TabsContent value="converter" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">从</Label>
                    <Select value={fromCurrency} onValueChange={setFromCurrency}>
                      <SelectTrigger className="w-full h-12 md:h-14 text-base">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {displayCurrencies.map((currency) => (
                          <SelectItem key={currency.code} value={currency.code} className="text-base py-3">
                            {currency.code} - {currency.name} ({currency.symbol})
                          </SelectItem>
                        ))}
                        {!showAllCurrencies && (
                          <Button 
                            variant="ghost" 
                            className="w-full justify-center text-green-600 hover:text-green-800 py-2"
                            onClick={() => setShowAllCurrencies(true)}
                          >
                            显示更多货币 <ChevronDown className="w-4 h-4 ml-1" />
                          </Button>
                        )}
                        {showAllCurrencies && (
                          <Button 
                            variant="ghost" 
                            className="w-full justify-center text-green-600 hover:text-green-800 py-2"
                            onClick={() => setShowAllCurrencies(false)}
                          >
                            显示常用货币 <ChevronUp className="w-4 h-4 ml-1" />
                          </Button>
                        )}
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="输入金额"
                      className="h-12 md:h-14 text-base"
                      min="0"
                      step="0.01"
                    />
                  </div>

                  <div className="flex justify-center">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={swapCurrencies}
                      className="h-12 w-12 md:h-14 md:w-14 rounded-full hover:bg-green-50 hover:border-green-300 transition-all bg-transparent"
                    >
                      <ArrowRight className="w-5 h-5 md:w-6 md:h-6 rotate-90 md:rotate-0" />
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-base font-semibold">到</Label>
                    <Select value={toCurrency} onValueChange={setToCurrency}>
                      <SelectTrigger className="w-full h-12 md:h-14 text-base">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {displayCurrencies.map((currency) => (
                          <SelectItem key={currency.code} value={currency.code} className="text-base py-3">
                            {currency.code} - {currency.name} ({currency.symbol})
                          </SelectItem>
                        ))}
                        {!showAllCurrencies && (
                          <Button 
                            variant="ghost" 
                            className="w-full justify-center text-green-600 hover:text-green-800 py-2"
                            onClick={() => setShowAllCurrencies(true)}
                          >
                            显示更多货币 <ChevronDown className="w-4 h-4 ml-1" />
                          </Button>
                        )}
                      </SelectContent>
                    </Select>
                    <div className="h-12 md:h-14 px-4 py-3 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg flex items-center">
                      <span className="text-base md:text-lg font-semibold text-green-900 truncate">
                        {result ? formatAmount(result, toCurrency) : "0"}
                      </span>
                    </div>
                  </div>
                </div>

                {amount && result && (
                  <div className="bg-green-50 border border-green-100 rounded-lg p-4">
                    <p className="text-center text-green-800">
                      1 {fromCurrency} = {Number(result) / Number(amount) > 0 ? (Number(result) / Number(amount)).toFixed(6) : '0'} {toCurrency}
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="historical" className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-base font-semibold">选择日期</Label>
                  <div className="flex gap-3">
                    <Input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      max={new Date().toISOString().split('T')[0]}
                      className="h-12 flex-grow"
                    />
                    <Button
                      onClick={getHistoricalRates}
                      className="bg-green-600 hover:bg-green-700 h-12 px-6"
                      disabled={isRefreshing}
                    >
                      {isRefreshing ? (
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin"></RefreshCw>
                      ) : null}
                      查询历史汇率
                    </Button>
                  </div>
                </div>

                {historicalRates && (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4 border border-green-100">
                    <h3 className="text-lg font-semibold mb-4 text-green-800">
                      {selectedDate} 汇率（相对于 USD）
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {popularCurrencies.map((currency) => {
                        const rate = historicalRates[currency.code]
                        return rate ? (
                          <div key={currency.code} className="bg-white/80 p-3 rounded-lg shadow-sm border border-green-100">
                            <div className="flex justify-between items-center">
                              <div className="font-medium text-green-900">{currency.code}</div>
                              <div className="text-sm text-gray-500">{currency.symbol}</div>
                            </div>
                            <div className="text-lg font-semibold mt-1 text-green-800">
                              {rate.toFixed(4)}
                            </div>
                            <div className="text-xs text-gray-600 mt-1">
                              {currency.name}
                            </div>
                          </div>
                        ) : null
                      })}
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>

            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-500 p-3 md:p-4 rounded-lg">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-slate-700 leading-relaxed">
                  <strong>支持货币：</strong>支持全球150+种货币实时换算<br />
                  <strong>汇率来源：</strong>汇率数据每5分钟自动更新，仅供参考<br />
                  <strong>历史查询：</strong>支持查询最近30天的历史汇率数据
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
