"use client"

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, ArrowRight, Zap, Calculator, Copy, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

/**
 * @file 能源单位换算器工具页面
 * @description 支持20+能源单位的换算，包括科学记数法支持和换算公式显示
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-16
 */

// 能源单位定义
interface EnergyUnit {
  name: string;
  symbol: string;
  joules: number; // 转换为焦耳的系数
  category: string;
  description?: string;
  formula?: string; // 转换公式描述
}

// 能源单位数据
const energyUnits: Record<string, EnergyUnit> = {
  // 国际单位制
  joule: {
    name: '焦耳',
    symbol: 'J',
    joules: 1,
    category: '国际单位制',
    description: '能量、功和热量的国际单位制基本单位',
  },
  millijoule: {
    name: '毫焦耳',
    symbol: 'mJ',
    joules: 0.001,
    category: '国际单位制',
    description: '焦耳的千分之一',
    formula: '1 mJ = 0.001 J',
  },
  kilojoule: {
    name: '千焦耳',
    symbol: 'kJ',
    joules: 1000,
    category: '国际单位制',
    description: '焦耳的一千倍',
    formula: '1 kJ = 1000 J',
  },
  megajoule: {
    name: '兆焦耳',
    symbol: 'MJ',
    joules: 1000000,
    category: '国际单位制',
    description: '焦耳的一百万倍',
    formula: '1 MJ = 1000000 J',
  },
  // 英制
  calorie: {
    name: '卡路里',
    symbol: 'cal',
    joules: 4.184,
    category: '热量单位',
    description: '将1克水升温1摄氏度所需的热量',
    formula: '1 cal = 4.184 J',
  },
  kcalorie: {
    name: '千卡',
    symbol: 'kcal',
    joules: 4184,
    category: '热量单位',
    description: '将1公斤水升温1摄氏度所需的热量',
    formula: '1 kcal = 4184 J',
  },
  // 电力单位
  wattHour: {
    name: '瓦特小时',
    symbol: 'Wh',
    joules: 3600,
    category: '电力单位',
    description: '功率为1瓦特时工作1小时所消耗的能量',
    formula: '1 Wh = 3600 J',
  },
  kilowattHour: {
    name: '千瓦时',
    symbol: 'kWh',
    joules: 3600000,
    category: '电力单位',
    description: '功率为1千瓦特时工作1小时所消耗的能量',
    formula: '1 kWh = 3600000 J',
  },
  megawattHour: {
    name: '兆瓦时',
    symbol: 'MWh',
    joules: 3600000000,
    category: '电力单位',
    description: '功率为1兆瓦特时工作1小时所消耗的能量',
    formula: '1 MWh = 3600000000 J',
  },
  // 传统能量单位
  electronVolt: {
    name: '电子伏特',
    symbol: 'eV',
    joules: 1.602176634e-19,
    category: '原子物理',
    description: '单个电子通过1伏特电场加速获得的动能',
    formula: '1 eV = 1.602176634 × 10⁻¹⁹ J',
  },
  kiloelectronVolt: {
    name: '千电子伏特',
    symbol: 'keV',
    joules: 1.602176634e-16,
    category: '原子物理',
    description: '电子伏特的一千倍',
    formula: '1 keV = 1000 eV',
  },
  megaelectronVolt: {
    name: '兆电子伏特',
    symbol: 'MeV',
    joules: 1.602176634e-13,
    category: '原子物理',
    description: '电子伏特的一百万倍',
    formula: '1 MeV = 1000000 eV',
  },
  britishThermalUnit: {
    name: '英热单位',
    symbol: 'BTU',
    joules: 1055.06,
    category: '英制热量单位',
    description: '将1磅水升温1华氏度所需的热量',
    formula: '1 BTU = 1055.06 J',
  },
  therm: {
    name: '热姆',
    symbol: 'therm',
    joules: 105506000,
    category: '英制热量单位',
    description: '英国热单位的10万倍',
    formula: '1 therm = 100000 BTU',
  },
  footPound: {
    name: '英尺磅',
    symbol: 'ft·lb',
    joules: 1.355818,
    category: '英制功单位',
    description: '将1磅物体在重力下提升1英尺所做的功',
    formula: '1 ft·lb = 1.355818 J',
  },
  // 质量能量
  gramTNT: {
    name: '克TNT当量',
    symbol: 'gTNT',
    joules: 4184,
    category: '爆炸能量',
    description: '1克TNT炸药爆炸释放的能量',
    formula: '1 gTNT = 4184 J',
  },
  kilogramTNT: {
    name: '公斤TNT当量',
    symbol: 'kgTNT',
    joules: 4184000,
    category: '爆炸能量',
    description: '1公斤TNT炸药爆炸释放的能量',
    formula: '1 kgTNT = 1000 gTNT',
  },
  tonTNT: {
    name: '吨TNT当量',
    symbol: 'tTNT',
    joules: 4184000000,
    category: '爆炸能量',
    description: '1吨TNT炸药爆炸释放的能量',
    formula: '1 tTNT = 1000 kgTNT',
  },
};

// 单位类别
const categories = ['所有类别', ...Array.from(new Set(Object.values(energyUnits).map(unit => unit.category)))];

const EnergyConverter: React.FC = () => {
  const [fromUnit, setFromUnit] = useState('joule');
  const [toUnit, setToUnit] = useState('kilojoule');
  const [amount, setAmount] = useState('1');
  const [result, setResult] = useState('0.001');
  const [selectedCategory, setSelectedCategory] = useState('所有类别');
  const [scientificNotation, setScientificNotation] = useState(false);
  const [showFormula, setShowFormula] = useState(false);
  const [copied, setCopied] = useState(false);
  const [precision, setPrecision] = useState('6');
  const [filterText, setFilterText] = useState('');

  // 根据类别和过滤文本获取可用单位
  const getAvailableUnits = () => {
    let filtered = Object.entries(energyUnits);
    
    // 按类别过滤
    if (selectedCategory !== '所有类别') {
      filtered = filtered.filter(([_, unit]) => unit.category === selectedCategory);
    }
    
    // 按文本过滤
    if (filterText) {
      const lowerFilter = filterText.toLowerCase();
      filtered = filtered.filter(([_, unit]) => 
        unit.name.toLowerCase().includes(lowerFilter) ||
        unit.symbol.toLowerCase().includes(lowerFilter)
      );
    }
    
    return Object.fromEntries(filtered);
  };

  // 计算转换结果
  const calculateResult = () => {
    if (!amount || isNaN(Number(amount))) {
      return '请输入有效数字';
    }

    const numAmount = Number(amount);
    
    if (fromUnit === toUnit) {
      return numAmount.toString();
    }

    try {
      // 转换为焦耳
      const joules = numAmount * (energyUnits[fromUnit]?.joules || 1);
      // 从焦耳转换为目标单位
      const converted = joules / (energyUnits[toUnit]?.joules || 1);
      
      const precisionNum = parseInt(precision);
      
      if (scientificNotation) {
        return converted.toExponential(precisionNum);
      } else {
        return converted.toFixed(precisionNum);
      }
    } catch (error) {
      console.error('单位转换错误:', error);
      return '计算错误';
    }
  };

  // 处理转换
  const handleConvert = () => {
    const convertedResult = calculateResult();
    setResult(convertedResult);
  };

  // 交换单位
  const swapUnits = () => {
    const temp = fromUnit;
    setFromUnit(toUnit);
    setToUnit(temp);
    // 更新结果
    if (result && result !== '计算错误' && result !== '请输入有效数字') {
      setAmount(result);
      const newResult = calculateResult();
      setResult(newResult);
    }
  };

  // 复制结果到剪贴板
  const copyToClipboard = () => {
    navigator.clipboard.writeText(result).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // 生成转换公式描述
  const generateFormulaDescription = () => {
    const fromUnitInfo = energyUnits[fromUnit];
    const toUnitInfo = energyUnits[toUnit];
    
    if (!fromUnitInfo || !toUnitInfo) return '';
    
    if (fromUnit === toUnit) {
      return `${fromUnitInfo.symbol} = ${toUnitInfo.symbol}`;
    }
    
    const conversionFactor = (fromUnitInfo.joules / toUnitInfo.joules);
    
    return `${fromUnitInfo.symbol} × ${conversionFactor.toExponential(6)} = ${toUnitInfo.symbol}`;
  };

  // 自动计算结果
  useEffect(() => {
    if (amount) {
      const convertedResult = calculateResult();
      setResult(convertedResult);
    }
  }, [fromUnit, toUnit, amount, scientificNotation, precision]);

  const availableUnits = getAvailableUnits();

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/">
          <Button variant="outline" className="mb-4 md:mb-6 h-11 px-4 bg-white/90 backdrop-blur-sm hover:bg-white">
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回首页
          </Button>
        </Link>

        <Card className="bg-white/95 backdrop-blur-sm shadow-xl">
          <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b p-4 md:p-6">
            <CardTitle className="flex items-center gap-2 md:gap-3 text-xl md:text-2xl font-bold text-amber-800">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
                <Zap className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              能源单位换算器
            </CardTitle>
            <CardDescription>支持20+能源单位换算，科学记数法支持，公式显示</CardDescription>
          </CardHeader>
          <CardContent className="p-4 md:p-6 space-y-6">
            {/* 单位过滤 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-base font-semibold mb-2 block">单位类别:</Label>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-base font-semibold mb-2 block">搜索单位:</Label>
                <Input
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  placeholder="搜索单位名称或符号"
                  className="w-full"
                />
              </div>
            </div>

            {/* 显示选项 */}
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="scientificNotation"
                  checked={scientificNotation}
                  onChange={(e) => setScientificNotation(e.target.checked)}
                  className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                />
                <Label htmlFor="scientificNotation">科学记数法</Label>
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="showFormula"
                  checked={showFormula}
                  onChange={(e) => setShowFormula(e.target.checked)}
                  className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                />
                <Label htmlFor="showFormula">显示公式</Label>
              </div>
              
              <div className="flex items-center gap-2 ml-auto">
                <Label>精度:</Label>
                <Select value={precision} onValueChange={setPrecision}>
                  <SelectTrigger className="w-[80px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(p => (
                      <SelectItem key={p} value={p.toString()}>{p} 位</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 转换公式显示 */}
            {showFormula && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                <Calculator className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-amber-800">转换公式:</div>
                  <div className="text-base">{generateFormulaDescription()}</div>
                  {energyUnits[fromUnit]?.formula && (
                    <div className="text-sm text-gray-600 mt-1">{energyUnits[fromUnit].formula}</div>
                  )}
                  {energyUnits[toUnit]?.formula && (
                    <div className="text-sm text-gray-600">{energyUnits[toUnit].formula}</div>
                  )}
                </div>
              </div>
            )}

            {/* 换算部分 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              {/* 从单位 */}
              <div className="space-y-3">
                <Label className="text-base font-semibold">从单位:</Label>
                <Select value={fromUnit} onValueChange={setFromUnit}>
                  <SelectTrigger className="h-12 text-base">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(availableUnits).map(([key, unit]) => (
                      <SelectItem key={key} value={key} className="text-base py-3">
                        <div className="flex items-center justify-between">
                          <span>{unit.symbol}</span>
                          <span className="font-medium">{unit.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="text-sm text-gray-600">{energyUnits[fromUnit]?.description}</div>
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
                        className="h-12 w-12 rounded-full hover:bg-amber-50 hover:border-amber-300 transition-all bg-transparent"
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
                <Label className="text-base font-semibold">到单位:</Label>
                <Select value={toUnit} onValueChange={setToUnit}>
                  <SelectTrigger className="h-12 text-base">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(availableUnits).map(([key, unit]) => (
                      <SelectItem key={key} value={key} className="text-base py-3">
                        <div className="flex items-center justify-between">
                          <span>{unit.symbol}</span>
                          <span className="font-medium">{unit.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="text-sm text-gray-600">{energyUnits[toUnit]?.description}</div>
                <div className="relative">
                  <div className="h-12 border rounded-md flex items-center px-3 bg-slate-50 text-lg font-medium">
                    {result !== '计算错误' && result !== '请输入有效数字' ? (
                      <span className="text-amber-600">{result}</span>
                    ) : (
                      <span className="text-red-600">{result}</span>
                    )}
                  </div>
                  <button
                    onClick={copyToClipboard}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1.5 text-gray-500 hover:text-amber-600 rounded-full hover:bg-amber-50"
                    disabled={result === '计算错误' || result === '请输入有效数字'}
                  >
                    {copied ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : (
                      <Copy className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* 转换按钮 */}
            <Button
              onClick={handleConvert}
              className="w-full md:w-auto md:min-w-[200px] bg-amber-600 hover:bg-amber-700"
            >
              执行转换
            </Button>

            {/* 单位类别分组展示 */}
            <div className="mt-6">
              <h3 className="font-semibold text-lg mb-3 text-amber-800">能源单位列表</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {categories.filter(c => c !== '所有类别').map(category => (
                  <div key={category} className="bg-amber-50 rounded-lg p-3">
                    <div className="font-medium text-amber-800 mb-2">{category}</div>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(energyUnits)
                        .filter(([_, unit]) => unit.category === category)
                        .map(([key, unit]) => (
                          <div key={key} className="inline-flex items-center gap-1 bg-white px-2 py-1 rounded text-sm border">
                            <span className="font-semibold text-amber-700">{unit.symbol}</span>
                            <span>{unit.name}</span>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-slate-50 border-t p-4 text-center text-sm text-slate-500">
            支持国际单位制、英制、电力单位、原子物理单位等多种能源单位的精确换算
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default EnergyConverter;
