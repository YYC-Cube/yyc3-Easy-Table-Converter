"use client"

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, ArrowRight, Database, Info, Maximize2, Minimize2 } from 'lucide-react';
import Link from 'next/link';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

/**
 * @file 数据存储单位换算器工具页面
 * @description 支持所有常用数据单位的换算，包括精度控制和批量换算功能
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-16
 */

// 数据存储单位定义
interface DataUnit {
  name: string;
  symbol: string;
  bytes: number;
  description?: string;
}

// 十进制单位 (国际单位制)
const decimalUnits: Record<string, DataUnit> = {
  byte: { name: '字节', symbol: 'B', bytes: 1 },
  kilobyte: { name: '千字节', symbol: 'KB', bytes: 1000 },
  megabyte: { name: '兆字节', symbol: 'MB', bytes: 1000 * 1000 },
  gigabyte: { name: '吉字节', symbol: 'GB', bytes: 1000 * 1000 * 1000 },
  terabyte: { name: '太字节', symbol: 'TB', bytes: 1000 * 1000 * 1000 * 1000 },
  petabyte: { name: '拍字节', symbol: 'PB', bytes: 1000 * 1000 * 1000 * 1000 * 1000 },
};

// 二进制单位 (IEC标准)
const binaryUnits: Record<string, DataUnit> = {
  byte: { name: '字节', symbol: 'B', bytes: 1 },
  kibibyte: { name: '千比字节', symbol: 'KiB', bytes: 1024 },
  mebibyte: { name: '兆比字节', symbol: 'MiB', bytes: 1024 * 1024 },
  gibibyte: { name: '吉比字节', symbol: 'GiB', bytes: 1024 * 1024 * 1024 },
  tebibyte: { name: '太比字节', symbol: 'TiB', bytes: 1024 * 1024 * 1024 * 1024 },
  pebibyte: { name: '拍比字节', symbol: 'PiB', bytes: 1024 * 1024 * 1024 * 1024 * 1024 },
};

// 单位类型枚举
enum UnitType {
  DECIMAL = 'decimal',
  BINARY = 'binary',
  ALL = 'all'
}

const DataUnitConverter: React.FC = () => {
  const [unitType, setUnitType] = useState<UnitType>(UnitType.DECIMAL);
  const [precision, setPrecision] = useState<string>('2');
  const [fromUnit, setFromUnit] = useState('byte');
  const [toUnit, setToUnit] = useState('kilobyte');
  const [amount, setAmount] = useState('1');
  const [result, setResult] = useState('1000');
  const [batchMode, setBatchMode] = useState(false);
  const [batchInput, setBatchInput] = useState('');
  const [batchResults, setBatchResults] = useState<{ input: string; result: string }[]>([]);

  // 根据单位类型获取可用单位
  const getAvailableUnits = () => {
    switch (unitType) {
      case UnitType.DECIMAL:
        return decimalUnits;
      case UnitType.BINARY:
        return binaryUnits;
      case UnitType.ALL:
        // 合并十进制和二进制单位，但排除重复的字节单位
        return { ...binaryUnits, ...Object.fromEntries(
          Object.entries(decimalUnits).filter(([key]) => key !== 'byte')
        ) };
      default:
        return decimalUnits;
    }
  };

  // 计算转换结果
  const calculateResult = (inputAmount: string) => {
    if (!inputAmount || isNaN(Number(inputAmount))) {
      return '';
    }

    const numAmount = Number(inputAmount);
    const units = getAvailableUnits();
    
    if (fromUnit === toUnit) {
      return numAmount.toFixed(parseInt(precision));
    }

    try {
      // 转换为字节
      const bytes = numAmount * (units[fromUnit]?.bytes || 1);
      // 从字节转换为目标单位
      const converted = bytes / (units[toUnit]?.bytes || 1);
      
      return converted.toFixed(parseInt(precision));
    } catch (error) {
      console.error('单位转换错误:', error);
      return '计算错误';
    }
  };

  // 处理单个转换
  const handleConvert = () => {
    const convertedResult = calculateResult(amount);
    setResult(convertedResult);
  };

  // 处理批量转换
  const handleBatchConvert = () => {
    if (!batchInput) {
      setBatchResults([]);
      return;
    }

    const inputs = batchInput.split('\n')
      .map(line => line.trim())
      .filter(line => line);

    const results = inputs.map(input => ({
      input,
      result: calculateResult(input)
    }));

    setBatchResults(results);
  };

  // 交换单位
  const swapUnits = () => {
    const temp = fromUnit;
    setFromUnit(toUnit);
    setToUnit(temp);
    // 更新结果
    if (result && result !== '计算错误') {
      setAmount(result);
      const newResult = calculateResult(result);
      setResult(newResult);
    }
  };

  // 重置单位选择
  const resetUnitSelection = () => {
    const units = getAvailableUnits();
    const unitKeys = Object.keys(units);
    setFromUnit(unitKeys[0]);
    setToUnit(unitKeys[1] || unitKeys[0]);
    setAmount('1');
    setResult(calculateResult('1'));
  };

  // 处理单位类型变化
  const handleUnitTypeChange = (newType: UnitType) => {
    setUnitType(newType);
    resetUnitSelection();
  };

  const availableUnits = getAvailableUnits();

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/">
          <Button variant="outline" className="mb-4 md:mb-6 h-11 px-4 bg-white/90 backdrop-blur-sm hover:bg-white">
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回首页
          </Button>
        </Link>

        <Card className="bg-white/95 backdrop-blur-sm shadow-xl">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50 border-b p-4 md:p-6">
            <CardTitle className="flex items-center gap-2 md:gap-3 text-xl md:text-2xl font-bold text-teal-800">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center shadow-lg">
                <Database className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              数据存储单位换算器
            </CardTitle>
            <CardDescription>支持十进制和二进制数据单位换算，精确控制</CardDescription>
          </CardHeader>
          <CardContent className="p-4 md:p-6 space-y-6">
            {/* 单位类型选择 */}
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
              <Label className="text-base font-semibold whitespace-nowrap">单位标准:</Label>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={unitType === UnitType.DECIMAL ? "default" : "outline"}
                  onClick={() => handleUnitTypeChange(UnitType.DECIMAL)}
                  className={unitType === UnitType.DECIMAL ? "bg-teal-600 hover:bg-teal-700" : "hover:bg-teal-50"}
                >
                  十进制 (KB, MB, GB)
                </Button>
                <Button
                  variant={unitType === UnitType.BINARY ? "default" : "outline"}
                  onClick={() => handleUnitTypeChange(UnitType.BINARY)}
                  className={unitType === UnitType.BINARY ? "bg-teal-600 hover:bg-teal-700" : "hover:bg-teal-50"}
                >
                  二进制 (KiB, MiB, GiB)
                </Button>
                <Button
                  variant={unitType === UnitType.ALL ? "default" : "outline"}
                  onClick={() => handleUnitTypeChange(UnitType.ALL)}
                  className={unitType === UnitType.ALL ? "bg-teal-600 hover:bg-teal-700" : "hover:bg-teal-50"}
                >
                  全部单位
                </Button>
              </div>
            </div>

            {/* 精度控制 */}
            <div className="flex items-center gap-4">
              <Label className="text-base font-semibold whitespace-nowrap">小数精度:</Label>
              <Select value={precision} onValueChange={setPrecision}>
                <SelectTrigger className="w-[100px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(p => (
                    <SelectItem key={p} value={p.toString()}>{p} 位</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Alert className="flex-1 bg-teal-50 border-teal-200 text-teal-800">
                <Info className="h-4 w-4 text-teal-600" />
                <AlertDescription className="text-sm">
                  {unitType === UnitType.DECIMAL ? '十进制: 1 KB = 1000 B' : 
                   unitType === UnitType.BINARY ? '二进制: 1 KiB = 1024 B' : 
                   '同时显示十进制和二进制单位'}
                </AlertDescription>
              </Alert>
            </div>

            {/* 批量模式切换 */}
            <div className="flex justify-end">
              <Button
                variant="secondary"
                onClick={() => setBatchMode(!batchMode)}
                className="flex items-center gap-2 bg-teal-100 hover:bg-teal-200 text-teal-800"
              >
                {batchMode ? (
                  <>
                    <Minimize2 className="w-4 h-4" />
                    单值模式
                  </>
                ) : (
                  <>
                    <Maximize2 className="w-4 h-4" />
                    批量换算
                  </>
                )}
              </Button>
            </div>

            {batchMode ? (
              // 批量换算模式
              <div className="space-y-4">
                <div>
                  <Label className="text-base font-semibold mb-2 block">输入数据 (每行一个值):</Label>
                  <textarea
                    value={batchInput}
                    onChange={(e) => setBatchInput(e.target.value)}
                    placeholder="1024\n1048576\n等"
                    className="w-full h-40 p-3 border rounded-md resize-y"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-base font-semibold mb-2 block">从单位:</Label>
                    <Select value={fromUnit} onValueChange={setFromUnit}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(availableUnits).map(([key, unit]) => (
                          <SelectItem key={key} value={key} className="text-base">
                            {unit.symbol} - {unit.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-base font-semibold mb-2 block">到单位:</Label>
                    <Select value={toUnit} onValueChange={setToUnit}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(availableUnits).map(([key, unit]) => (
                          <SelectItem key={key} value={key} className="text-base">
                            {unit.symbol} - {unit.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <Button
                  onClick={handleBatchConvert}
                  className="w-full bg-teal-600 hover:bg-teal-700"
                >
                  执行批量换算
                </Button>
                
                {batchResults.length > 0 && (
                  <div className="mt-4">
                    <h3 className="font-semibold mb-2">换算结果:</h3>
                    <div className="max-h-80 overflow-auto border rounded-md">
                      <table className="w-full">
                        <thead className="bg-teal-50 sticky top-0">
                          <tr>
                            <th className="px-4 py-2 text-left border-b">输入 ({availableUnits[fromUnit]?.symbol})</th>
                            <th className="px-4 py-2 text-left border-b">结果 ({availableUnits[toUnit]?.symbol})</th>
                          </tr>
                        </thead>
                        <tbody>
                          {batchResults.map((item, index) => (
                            <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-teal-50'}>
                              <td className="px-4 py-2 border-b">{item.input}</td>
                              <td className="px-4 py-2 border-b font-medium text-teal-800">{item.result}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              // 单值换算模式
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                {/* 从单位 */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold">从</Label>
                  <Select value={fromUnit} onValueChange={setFromUnit}>
                    <SelectTrigger className="h-12 text-base">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(availableUnits).map(([key, unit]) => (
                        <SelectItem key={key} value={key} className="text-base py-3">
                          {unit.symbol} - {unit.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="输入数值"
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
                          onClick={swapUnits}
                          className="h-12 w-12 rounded-full hover:bg-teal-50 hover:border-teal-300 transition-all bg-transparent"
                        >
                          <ArrowRight className="w-5 h-5 md:w-6 md:h-6 rotate-90" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>交换单位</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                {/* 到单位 */}
                <div className="space-y-3">
                  <Label className="text-base font-semibold">到</Label>
                  <Select value={toUnit} onValueChange={setToUnit}>
                    <SelectTrigger className="h-12 text-base">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(availableUnits).map(([key, unit]) => (
                        <SelectItem key={key} value={key} className="text-base py-3">
                          {unit.symbol} - {unit.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="h-12 border rounded-md flex items-center px-3 bg-slate-50 text-lg font-medium">
                    {result !== '计算错误' ? (
                      <span className="text-teal-600">{result}</span>
                    ) : (
                      <span className="text-red-600">计算错误</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 转换按钮 (单值模式) */}
            {!batchMode && (
              <div className="mt-4">
                <Button
                  onClick={handleConvert}
                  className="w-full md:w-auto md:min-w-[200px] bg-teal-600 hover:bg-teal-700"
                >
                  执行转换
                </Button>
              </div>
            )}
          </CardContent>
          <CardFooter className="bg-slate-50 border-t p-4 text-center text-sm text-slate-500">
            支持字节、KB、MB、GB、TB、PB等数据存储单位的精确换算
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default DataUnitConverter;
