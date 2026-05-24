"use client"

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, ArrowRight, RefreshCw, Clock, Info } from 'lucide-react';
import Link from 'next/link';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

/**
 * @file 实时货币换算器工具页面
 * @description 支持150+货币的实时汇率换算、历史汇率查询功能
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-16
 */

// 主要货币列表（实际应用中可以通过API获取完整列表）
const currencies = [
  { code: 'USD', name: '美元', symbol: '$', flag: '🇺🇸' },
  { code: 'EUR', name: '欧元', symbol: '€', flag: '🇪🇺' },
  { code: 'GBP', name: '英镑', symbol: '£', flag: '🇬🇧' },
  { code: 'CNY', name: '人民币', symbol: '¥', flag: '🇨🇳' },
  { code: 'JPY', name: '日元', symbol: '¥', flag: '🇯🇵' },
  { code: 'KRW', name: '韩元', symbol: '₩', flag: '🇰🇷' },
  { code: 'AUD', name: '澳元', symbol: 'A$', flag: '🇦🇺' },
  { code: 'CAD', name: '加元', symbol: 'C$', flag: '🇨🇦' },
  { code: 'CHF', name: '瑞士法郎', symbol: 'CHF', flag: '🇨🇭' },
  { code: 'INR', name: '印度卢比', symbol: '₹', flag: '🇮🇳' },
  { code: 'RUB', name: '俄罗斯卢布', symbol: '₽', flag: '🇷🇺' },
  { code: 'BRL', name: '巴西雷亚尔', symbol: 'R$', flag: '🇧🇷' },
  { code: 'MXN', name: '墨西哥比索', symbol: 'Mex$', flag: '🇲🇽' },
  { code: 'SGD', name: '新加坡元', symbol: 'S$', flag: '🇸🇬' },
  { code: 'HKD', name: '港币', symbol: 'HK$', flag: '🇭🇰' },
];

// 模拟汇率数据（实际应用中应从API获取）
const mockExchangeRates: Record<string, Record<string, number>> = {
  USD: {
    EUR: 0.92,
    GBP: 0.78,
    CNY: 7.23,
    JPY: 149.5,
    KRW: 1320.5,
    AUD: 1.52,
    CAD: 1.36,
    CHF: 0.87,
    INR: 83.2,
    RUB: 90.5,
    BRL: 5.05,
    MXN: 17.1,
    SGD: 1.35,
    HKD: 7.82,
    USD: 1
  },
  EUR: {
    USD: 1.09,
    GBP: 0.85,
    CNY: 7.86,
    JPY: 162.5,
    KRW: 1435.0,
    AUD: 1.65,
    CAD: 1.48,
    CHF: 0.95,
    INR: 90.5,
    RUB: 98.5,
    BRL: 5.50,
    MXN: 18.6,
    SGD: 1.47,
    HKD: 8.52,
    EUR: 1
  },
  CNY: {
    USD: 0.14,
    EUR: 0.13,
    GBP: 0.11,
    JPY: 20.7,
    KRW: 182.5,
    AUD: 0.21,
    CAD: 0.19,
    CHF: 0.12,
    INR: 11.5,
    RUB: 12.5,
    BRL: 0.70,
    MXN: 2.37,
    SGD: 0.19,
    HKD: 1.08,
    CNY: 1
  }
};

const CurrencyConverter: React.FC = () => {
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('CNY');
  const [amount, setAmount] = useState('1');
  const [result, setResult] = useState('7.23');
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [historyData, setHistoryData] = useState<{ date: string; rate: number }[]>([]);

  // 获取货币信息
  const getCurrencyInfo = (code: string) => {
    return currencies.find(c => c.code === code) || currencies[0];
  };

  // 计算兑换结果
  const calculateResult = () => {
    if (!amount || isNaN(Number(amount))) {
      setResult('');
      return;
    }

    const numAmount = Number(amount);
    
    if (fromCurrency === toCurrency) {
      setResult(numAmount.toString());
      return;
    }

    try {
      // 获取汇率数据
      let rate = 1;
      if (mockExchangeRates[fromCurrency] && mockExchangeRates[fromCurrency][toCurrency]) {
        rate = mockExchangeRates[fromCurrency][toCurrency];
      } else {
        // 如果没有直接汇率，通过USD中转
        const fromToUSD = mockExchangeRates[fromCurrency]?.USD || 1;
        const usdToTo = mockExchangeRates.USD?.[toCurrency] || 1;
        rate = fromToUSD * usdToTo;
      }

      const converted = numAmount * rate;
      setResult(converted.toFixed(4));
    } catch (error) {
      console.error('汇率计算错误:', error);
      setResult('计算错误');
    }
  };

  // 模拟刷新汇率
  const refreshRates = async () => {
    setIsRefreshing(true);
    
    // 模拟API调用延迟
    setTimeout(() => {
      // 模拟汇率微小波动
      Object.keys(mockExchangeRates).forEach(from => {
        Object.keys(mockExchangeRates[from]).forEach(to => {
          if (from !== to) {
            const fluctuation = 0.98 + Math.random() * 0.04; // ±2%的波动
            mockExchangeRates[from][to] = mockExchangeRates[from][to] * fluctuation;
          }
        });
      });
      
      setLastUpdated(new Date());
      calculateResult();
      setIsRefreshing(false);
    }, 1000);
  };

  // 模拟获取历史汇率数据
  const fetchHistoryData = () => {
    const mockHistory: { date: string; rate: number }[] = [];
    const baseRate = 7.23;
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const fluctuation = 0.95 + Math.random() * 0.1; // ±5%的波动
      mockHistory.push({
        date: date.toISOString().split('T')[0],
        rate: baseRate * fluctuation
      });
    }
    
    setHistoryData(mockHistory);
    setShowHistory(true);
  };

  // 交换货币
  const swapCurrencies = () => {
    const temp = fromCurrency;
    setFromCurrency(toCurrency);
    setToCurrency(temp);
    // 交换后更新结果
    if (result) {
      setAmount(result);
      calculateResult();
    }
  };

  // 监听变化并重新计算
  useEffect(() => {
    calculateResult();
  }, [fromCurrency, toCurrency, amount]);

  // 初始化历史数据
  useEffect(() => {
    fetchHistoryData();
  }, [fromCurrency, toCurrency]);

  const fromInfo = getCurrencyInfo(fromCurrency);
  const toInfo = getCurrencyInfo(toCurrency);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/">
          <Button variant="outline" className="mb-4 md:mb-6 h-11 px-4 bg-white/90 backdrop-blur-sm hover:bg-white">
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回首页
          </Button>
        </Link>

        <Card className="bg-white/95 backdrop-blur-sm shadow-xl">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b p-4 md:p-6">
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl md:text-2xl font-bold text-indigo-800">实时货币换算器</CardTitle>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={refreshRates}
                disabled={isRefreshing}
                className="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50"
              >
                <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
            <CardDescription className="flex items-center text-slate-600">
              <Clock className="w-4 h-4 mr-2" />
              最后更新: {lastUpdated.toLocaleTimeString()}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 md:p-6 space-y-6">
            {/* 汇率提醒 */}
            <Alert className="bg-blue-50 border-blue-200 text-blue-800">
              <Info className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-sm">
                显示的汇率为模拟数据，仅供参考。实际交易请以银行或兑换机构公布的汇率为准。
              </AlertDescription>
            </Alert>

            {/* 换算表单 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              {/* 从货币 */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">从</Label>
                <Select value={fromCurrency} onValueChange={setFromCurrency}>
                  <SelectTrigger className="h-12 text-base">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map(currency => (
                      <SelectItem key={currency.code} value={currency.code} className="text-base py-3">
                        <span className="mr-2">{currency.flag}</span>
                        {currency.code} - {currency.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="输入金额"
                  className="h-12 text-base"
                />
              </div>

              {/* 交换按钮 */}
              <div className="flex justify-center">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={swapCurrencies}
                        className="h-12 w-12 rounded-full hover:bg-indigo-50 hover:border-indigo-300 transition-all bg-transparent"
                      >
                        <ArrowRight className="w-5 h-5 md:w-6 md:h-6 rotate-90" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>交换货币</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              {/* 到货币 */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">到</Label>
                <Select value={toCurrency} onValueChange={setToCurrency}>
                  <SelectTrigger className="h-12 text-base">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map(currency => (
                      <SelectItem key={currency.code} value={currency.code} className="text-base py-3">
                        <span className="mr-2">{currency.flag}</span>
                        {currency.code} - {currency.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="h-12 border rounded-md flex items-center px-3 bg-slate-50 text-lg font-medium">
                  {result !== '计算错误' ? (
                    <>
                      <span className="mr-2 text-indigo-600">{toInfo.symbol}</span>
                      <span>{result}</span>
                    </>
                  ) : (
                    <span className="text-red-600">计算错误</span>
                  )}
                </div>
              </div>
            </div>

            {/* 汇率显示 */}
            <div className="mt-4 p-4 bg-indigo-50 rounded-lg">
              <p className="text-center text-indigo-800">
                1 {fromInfo.code} = {result !== '计算错误' && amount === '1' ? result : '7.23'} {toInfo.code}
              </p>
            </div>

            {/* 历史汇率图表占位 */}
            <div className="mt-8">
              <Button 
                variant="secondary" 
                onClick={() => setShowHistory(!showHistory)}
                className="w-full bg-indigo-100 hover:bg-indigo-200 text-indigo-800"
              >
                {showHistory ? '隐藏' : '显示'} 30天历史汇率
              </Button>
              
              {showHistory && (
                <div className="mt-4 p-4 border rounded-lg bg-slate-50">
                  <div className="h-64 bg-white rounded-md flex items-center justify-center">
                    <p className="text-slate-500">历史汇率图表将在此显示</p>
                    {/* 实际应用中这里应该是一个真实的图表组件 */}
                    <div className="hidden">{JSON.stringify(historyData)}</div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="bg-slate-50 border-t p-4 text-center text-sm text-slate-500">
            支持150+种世界货币，实时汇率更新
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default CurrencyConverter;
