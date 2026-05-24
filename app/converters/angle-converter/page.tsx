"use client"

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, ArrowRight, CircleDashed, Calculator, Info, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

/**
 * @file 角度单位换算器工具页面
 * @description 支持度、弧度、梯度的角度换算，包括三角函数计算和可视化角度显示
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-16
 */

// 角度单位定义
interface AngleUnit {
  name: string;
  symbol: string;
  toRadians: number; // 转换为弧度的系数
  description: string;
  fullCircle?: number; // 完整圆的单位数
}

// 角度单位数据
const angleUnits: Record<string, AngleUnit> = {
  degrees: {
    name: '度',
    symbol: '°',
    toRadians: Math.PI / 180,
    description: '将圆分为360等份，每一等份为1度',
    fullCircle: 360,
  },
  radians: {
    name: '弧度',
    symbol: 'rad',
    toRadians: 1,
    description: '弧长等于半径的弧所对的圆心角',
    fullCircle: 2 * Math.PI,
  },
  gradians: {
    name: '梯度',
    symbol: 'gon',
    toRadians: Math.PI / 200,
    description: '将圆分为400等份，每一等份为1梯度',
    fullCircle: 400,
  },
};

// 三角函数计算结果
interface TrigonometricResults {
  sin: string;
  cos: string;
  tan: string;
  asin?: string;
  acos?: string;
  atan?: string;
}

const AngleConverter: React.FC = () => {
  const [fromUnit, setFromUnit] = useState('degrees');
  const [toUnit, setToUnit] = useState('radians');
  const [amount, setAmount] = useState('45');
  const [result, setResult] = useState('0.7853981634');
  const [showTrigonometric, setShowTrigonometric] = useState(true);
  const [trigResults, setTrigResults] = useState<TrigonometricResults>({
    sin: '0.7071067812',
    cos: '0.7071067812',
    tan: '1.0',
  });
  const [precision, setPrecision] = useState('10');
  const [visualizationAngle, setVisualizationAngle] = useState(45); // 用于可视化的角度（度）
  const [rotationMode, setRotationMode] = useState(false); // 启用连续旋转模式

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
      // 转换为弧度
      const radians = numAmount * (angleUnits[fromUnit]?.toRadians || 1);
      // 从弧度转换为目标单位
      const converted = radians / (angleUnits[toUnit]?.toRadians || 1);
      
      const precisionNum = parseInt(precision);
      return converted.toFixed(precisionNum);
    } catch (error) {
      console.error('单位转换错误:', error);
      return '计算错误';
    }
  };

  // 计算三角函数值
  const calculateTrigonometric = () => {
    if (!amount || isNaN(Number(amount))) {
      return {
        sin: '无效输入',
        cos: '无效输入',
        tan: '无效输入',
      };
    }

    const numAmount = Number(amount);
    const precisionNum = parseInt(precision);
    
    try {
      // 转换为弧度
      const radians = numAmount * (angleUnits[fromUnit]?.toRadians || 1);
      
      return {
        sin: Math.sin(radians).toFixed(precisionNum),
        cos: Math.cos(radians).toFixed(precisionNum),
        tan: Math.abs(Math.cos(radians)) < 1e-10 ? '无穷大' : Math.tan(radians).toFixed(precisionNum),
        asin: (Math.asin(Math.sin(radians)) / angleUnits[toUnit]?.toRadians || 1).toFixed(precisionNum),
        acos: (Math.acos(Math.cos(radians)) / angleUnits[toUnit]?.toRadians || 1).toFixed(precisionNum),
        atan: (Math.atan(Math.tan(radians)) / angleUnits[toUnit]?.toRadians || 1).toFixed(precisionNum),
      };
    } catch (error) {
      console.error('三角函数计算错误:', error);
      return {
        sin: '计算错误',
        cos: '计算错误',
        tan: '计算错误',
      };
    }
  };

  // 更新可视化角度（转换为度）
  const updateVisualizationAngle = () => {
    if (!amount || isNaN(Number(amount))) {
      return;
    }
    
    const numAmount = Number(amount);
    const radians = numAmount * (angleUnits[fromUnit]?.toRadians || 1);
    const degrees = radians * (180 / Math.PI);
    
    setVisualizationAngle(degrees);
  };

  // 处理转换
  const handleConvert = () => {
    const convertedResult = calculateResult();
    setResult(convertedResult);
    
    if (showTrigonometric) {
      const trigResult = calculateTrigonometric();
      setTrigResults(trigResult);
    }
    
    updateVisualizationAngle();
  };

  // 交换单位
  const swapUnits = () => {
    const temp = fromUnit;
    setFromUnit(toUnit);
    setToUnit(temp);
    // 更新结果
    if (result && result !== '计算错误' && result !== '请输入有效数字') {
      setAmount(result);
      handleConvert();
    }
  };

  // 随机角度生成
  const generateRandomAngle = () => {
    const randomDegrees = Math.floor(Math.random() * 360);
    setAmount(randomDegrees.toString());
    setFromUnit('degrees');
  };

  // 常见角度预设
  const commonAngles = [
    { value: '0', name: '0° (0 弧度)' },
    { value: '30', name: '30° (π/6)' },
    { value: '45', name: '45° (π/4)' },
    { value: '60', name: '60° (π/3)' },
    { value: '90', name: '90° (π/2)' },
    { value: '180', name: '180° (π)' },
    { value: '270', name: '270° (3π/2)' },
    { value: '360', name: '360° (2π)' },
  ];

  // 连续旋转模式
  useEffect(() => {
    let rotationInterval: NodeJS.Timeout;
    
    if (rotationMode) {
      rotationInterval = setInterval(() => {
        setVisualizationAngle(prev => {
          const newAngle = (prev + 1) % 360;
          return newAngle;
        });
      }, 50); // 50ms更新一次，大约20fps
    }
    
    return () => {
      if (rotationInterval) {
        clearInterval(rotationInterval);
      }
    };
  }, [rotationMode]);

  // 自动计算
  useEffect(() => {
    if (amount) {
      handleConvert();
    }
  }, [fromUnit, toUnit, precision, showTrigonometric]);

  // 绘制角度可视化
  const renderAngleVisualization = () => {
    const radius = 100;
    const center = { x: radius + 20, y: radius + 20 };
    const startAngle = -Math.PI / 2; // 从12点钟方向开始
    const endAngle = startAngle + (visualizationAngle * Math.PI / 180);
    
    // 计算弧线路径
    const largeArcFlag = visualizationAngle > 180 ? 1 : 0;
    const x1 = center.x + radius * Math.cos(startAngle);
    const y1 = center.y + radius * Math.sin(startAngle);
    const x2 = center.x + radius * Math.cos(endAngle);
    const y2 = center.y + radius * Math.sin(endAngle);
    
    const arcPath = `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`;
    const linePath = `M ${center.x} ${center.y} L ${x2} ${y2}`;
    
    return (
      <svg width="240" height="240" viewBox="0 0 240 240" className="mx-auto">
        {/* 背景圆 */}
        <circle
          cx={center.x}
          cy={center.y}
          r={radius}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="2"
        />
        
        {/* 角度弧线 */}
        <path
          d={arcPath}
          fill="none"
          stroke="#0ea5e9"
          strokeWidth="4"
          strokeLinecap="round"
        />
        
        {/* 角度线 */}
        <path
          d={linePath}
          fill="none"
          stroke="#0284c7"
          strokeWidth="3"
          strokeLinecap="round"
        />
        
        {/* 中心点 */}
        <circle
          cx={center.x}
          cy={center.y}
          r="4"
          fill="#0369a1"
        />
        
        {/* 0度标记 */}
        <line
          x1={center.x - 3}
          y1={center.y - radius + 6}
          x2={center.x + 3}
          y2={center.y - radius + 6}
          stroke="#475569"
          strokeWidth="2"
        />
        <text x={center.x} y={center.y - radius + 25} textAnchor="middle" fontSize="12" fill="#475569">0°</text>
        
        {/* 90度标记 */}
        <line
          x1={center.x + radius - 6}
          y1={center.y - 3}
          x2={center.x + radius - 6}
          y2={center.y + 3}
          stroke="#475569"
          strokeWidth="2"
        />
        <text x={center.x + radius - 35} y={center.y + 5} textAnchor="middle" fontSize="12" fill="#475569">90°</text>
        
        {/* 180度标记 */}
        <line
          x1={center.x - 3}
          y1={center.y + radius - 6}
          x2={center.x + 3}
          y2={center.y + radius - 6}
          stroke="#475569"
          strokeWidth="2"
        />
        <text x={center.x} y={center.y + radius - 10} textAnchor="middle" fontSize="12" fill="#475569">180°</text>
        
        {/* 270度标记 */}
        <line
          x1={center.x - radius + 6}
          y1={center.y - 3}
          x2={center.x - radius + 6}
          y2={center.y + 3}
          stroke="#475569"
          strokeWidth="2"
        />
        <text x={center.x - radius + 35} y={center.y + 5} textAnchor="middle" fontSize="12" fill="#475569">270°</text>
        
        {/* 角度文本 */}
        <text x={center.x} y="30" textAnchor="middle" fontSize="16" fontWeight="bold" fill="#0c4a6e">
          ${visualizationAngle.toFixed(1)}°
        </text>
      </svg>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-indigo-50 p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <Link href="/">
          <Button variant="outline" className="mb-4 md:mb-6 h-11 px-4 bg-white/90 backdrop-blur-sm hover:bg-white">
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回首页
          </Button>
        </Link>

        <Card className="bg-white/95 backdrop-blur-sm shadow-xl">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b p-4 md:p-6">
            <CardTitle className="flex items-center gap-2 md:gap-3 text-xl md:text-2xl font-bold text-blue-800">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg">
                <CircleDashed className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              角度单位换算器
            </CardTitle>
            <CardDescription>支持度、弧度、梯度的角度换算，包含三角函数计算和可视化角度显示</CardDescription>
          </CardHeader>
          <CardContent className="p-4 md:p-6 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 左侧：换算功能 */}
              <div>
                {/* 精度控制 */}
                <div className="flex items-center gap-4 mb-4">
                  <Label className="text-base font-semibold whitespace-nowrap">小数精度:</Label>
                  <Select value={precision} onValueChange={setPrecision}>
                    <SelectTrigger className="w-[100px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(p => (
                        <SelectItem key={p} value={p.toString()}>{p} 位</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <div className="flex items-center gap-2 ml-auto">
                    <input
                      type="checkbox"
                      id="showTrigonometric"
                      checked={showTrigonometric}
                      onChange={(e) => setShowTrigonometric(e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <Label htmlFor="showTrigonometric">显示三角函数</Label>
                  </div>
                </div>

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
                        {Object.entries(angleUnits).map(([key, unit]) => (
                          <SelectItem key={key} value={key} className="text-base py-3">
                            <div className="flex items-center justify-between">
                              <span>{unit.symbol}</span>
                              <span className="font-medium">{unit.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="text-sm text-gray-600">{angleUnits[fromUnit]?.description}</div>
                    <Input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="输入角度值"
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
                            className="h-12 w-12 rounded-full hover:bg-blue-50 hover:border-blue-300 transition-all bg-transparent"
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
                        {Object.entries(angleUnits).map(([key, unit]) => (
                          <SelectItem key={key} value={key} className="text-base py-3">
                            <div className="flex items-center justify-between">
                              <span>{unit.symbol}</span>
                              <span className="font-medium">{unit.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="text-sm text-gray-600">{angleUnits[toUnit]?.description}</div>
                    <div className="h-12 border rounded-md flex items-center px-3 bg-slate-50 text-lg font-medium">
                      {result !== '计算错误' && result !== '请输入有效数字' ? (
                        <span className="text-blue-600">{result}</span>
                      ) : (
                        <span className="text-red-600">{result}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 转换和预设按钮 */}
                <div className="flex flex-wrap gap-3 mt-4">
                  <Button
                    onClick={handleConvert}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    执行转换
                  </Button>
                  
                  <Button
                    onClick={generateRandomAngle}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    随机角度
                  </Button>
                </div>

                {/* 常见角度预设 */}
                <div className="mt-6">
                  <Label className="text-base font-semibold mb-2 block">常见角度预设:</Label>
                  <div className="flex flex-wrap gap-2">
                    {commonAngles.map(angle => (
                      <Button
                        key={angle.value}
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setAmount(angle.value);
                          setFromUnit('degrees');
                        }}
                        className="bg-blue-50 hover:bg-blue-100 text-blue-800"
                      >
                        {angle.name}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* 三角函数计算结果 */}
                {showTrigonometric && (
                  <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Calculator className="w-5 h-5 text-blue-600" />
                      <h4 className="font-semibold text-blue-800">三角函数计算结果</h4>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex justify-between">
                        <span className="font-medium">sin:</span>
                        <span className="text-blue-700">{trigResults.sin}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">cos:</span>
                        <span className="text-blue-700">{trigResults.cos}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">tan:</span>
                        <span className="text-blue-700">{trigResults.tan}</span>
                      </div>
                      {trigResults.asin && (
                        <div className="flex justify-between">
                          <span className="font-medium">asin:</span>
                          <span className="text-blue-700">{trigResults.asin}</span>
                        </div>
                      )}
                      {trigResults.acos && (
                        <div className="flex justify-between">
                          <span className="font-medium">acos:</span>
                          <span className="text-blue-700">{trigResults.acos}</span>
                        </div>
                      )}
                      {trigResults.atan && (
                        <div className="flex justify-between">
                          <span className="font-medium">atan:</span>
                          <span className="text-blue-700">{trigResults.atan}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* 右侧：可视化部分 */}
              <div>
                <Card>
                  <CardHeader className="bg-blue-50 border-b">
                    <CardTitle className="text-lg font-semibold text-blue-800 flex items-center gap-2">
                      <CircleDashed className="w-4 h-4" />
                      角度可视化
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {renderAngleVisualization()}
                    
                    <div className="flex justify-center gap-3 mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setRotationMode(!rotationMode)}
                        className={rotationMode ? "bg-blue-50 text-blue-700" : ""}
                      >
                        {rotationMode ? "停止旋转" : "连续旋转"}
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setAmount('0');
                          setFromUnit('degrees');
                          setRotationMode(false);
                        }}
                      >
                        重置为0°
                      </Button>
                    </div>
                    
                    <Alert className="mt-4 bg-blue-50 border-blue-200">
                      <Info className="h-4 w-4 text-blue-600" />
                      <AlertDescription className="text-sm">
                        可视化显示的是当前角度的直观表示。蓝色弧线表示角度大小，线条指向角度的终止方向。
                      </AlertDescription>
                    </Alert>
                  </CardContent>
                </Card>
                
                {/* 单位关系说明 */}
                <div className="mt-6">
                  <Card>
                    <CardHeader className="bg-blue-50 border-b">
                      <CardTitle className="text-lg font-semibold text-blue-800">角度单位关系</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="space-y-4">
                        {Object.entries(angleUnits).map(([key, unit]) => (
                          <div key={key} className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                            <div>
                              <div className="font-medium text-blue-800">{unit.name} ({unit.symbol})</div>
                              <div className="text-sm text-gray-600">{unit.description}</div>
                            </div>
                            <div className="text-blue-700 font-semibold">
                              1圆 = {unit.fullCircle}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-slate-50 border-t p-4 text-center text-sm text-slate-500">
            支持度(°)、弧度(rad)、梯度(gon)之间的精确换算，包含三角函数计算和直观的角度可视化
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default AngleConverter;
