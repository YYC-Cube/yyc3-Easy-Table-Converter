/**
 * @file 数据转换流程组件
 * @description 提供优化的数据转换流程交互体验
 * @module components/conversion-flow
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-16
 * @updated 2024-10-16
 */

'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { 
  Loader2, CheckCircle2, ArrowRight, RotateCcw, FileDown, 
  AlertCircle, SlidersHorizontal, HelpCircle 
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import DataPreview, { TableData, FileInfo } from './DataPreview';

// 单位定义接口
export interface Unit {
  id: string;
  name: string;
  symbol: string;
  category?: string;
  conversionFactor: number;
  description?: string;
}

// 转换任务接口
interface ConversionTask {
  id: string;
  inputValue: string;
  outputValue: string;
  status: 'idle' | 'processing' | 'success' | 'error';
  errorMessage?: string;
}

// 转换历史记录接口
interface ConversionHistory {
  id: string;
  timestamp: Date;
  sourceUnit: string;
  targetUnit: string;
  inputValue: string;
  outputValue: string;
}

// 转换选项接口
interface ConversionOptions {
  precision: number;
  showFormula: boolean;
  autoConvert: boolean;
  historyEnabled: boolean;
}

interface ConversionFlowProps {
  sourceUnits: Unit[];
  targetUnits: Unit[];
  convertFunction: (value: string, sourceUnit: Unit, targetUnit: Unit, precision: number) => {
    result: string;
    formula?: string;
    error?: string;
  };
  initialSourceUnit?: string;
  initialTargetUnit?: string;
  initialInputValue?: string;
  onConvertComplete?: (result: { result: string; formula?: string }) => void;
  className?: string;
}

/**
 * 数据转换流程组件
 * 提供现代化的数据转换用户体验，包括实时转换、批量转换、历史记录等功能
 */
export const ConversionFlow: React.FC<ConversionFlowProps> = ({
  sourceUnits,
  targetUnits,
  convertFunction,
  initialSourceUnit = '',
  initialTargetUnit = '',
  initialInputValue = '',
  onConvertComplete,
  className = ''
}) => {
  // 状态管理
  const [activeTab, setActiveTab] = useState('single');
  const [sourceUnit, setSourceUnit] = useState(initialSourceUnit);
  const [targetUnit, setTargetUnit] = useState(initialTargetUnit);
  const [inputValue, setInputValue] = useState(initialInputValue);
  const [result, setResult] = useState('');
  const [formula, setFormula] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showOptions, setShowOptions] = useState(false);
  const [options, setOptions] = useState<ConversionOptions>({
    precision: 2,
    showFormula: true,
    autoConvert: true,
    historyEnabled: true
  });
  
  // 批量转换状态
  const [batchTasks, setBatchTasks] = useState<ConversionTask[]>([
    { id: Date.now().toString(), inputValue: '', outputValue: '', status: 'idle' }
  ]);
  
  // 历史记录状态
  const [history, setHistory] = useState<ConversionHistory[]>([]);
  
  // 数据预览状态 (用于表格数据转换)
  const [previewData, setPreviewData] = useState<TableData>({
    headers: ['输入值', '输出值', '状态'],
    rows: [],
    totalRows: 0
  });
  const [fileInfo, _setFileInfo] = useState<FileInfo>({
    fileId: '',
    name: '',
    type: 'csv'
  });
  
  // 加载存储的历史记录
  useEffect(() => {
    if (options.historyEnabled) {
      const savedHistory = localStorage.getItem('conversion_history');
      if (savedHistory) {
        try {
          setHistory(JSON.parse(savedHistory));
        } catch (e) {
          console.error('加载历史记录失败:', e);
        }
      }
    }
  }, [options.historyEnabled]);
  
  // 保存历史记录
  const saveToHistory = useCallback((input: string, output: string, source: string, target: string) => {
    if (!options.historyEnabled || !output || error) return;
    
    const newHistory: ConversionHistory = {
      id: Date.now().toString(),
      timestamp: new Date(),
      sourceUnit: source,
      targetUnit: target,
      inputValue: input,
      outputValue: output
    };
    
    const updatedHistory = [newHistory, ...history.slice(0, 49)]; // 保留最近50条
    setHistory(updatedHistory);
    localStorage.setItem('conversion_history', JSON.stringify(updatedHistory));
  }, [options.historyEnabled, error, history]);
  
  // 执行单个转换
  const performSingleConversion = useCallback(async () => {
    if (!inputValue.trim() || !sourceUnit || !targetUnit) {
      setError('请输入数值并选择单位');
      return;
    }
    
    setError(null);
    setLoading(true);
    setProgress(30);
    
    // 模拟处理延迟
    setTimeout(() => {
      setProgress(70);
      
      try {
        const sourceUnitObj = sourceUnits.find(u => u.id === sourceUnit);
        const targetUnitObj = targetUnits.find(u => u.id === targetUnit);
        
        if (!sourceUnitObj || !targetUnitObj) {
          throw new Error('选择的单位无效');
        }
        
        const conversionResult = convertFunction(inputValue, sourceUnitObj, targetUnitObj, options.precision);
        
        if (conversionResult.error) {
          throw new Error(conversionResult.error);
        }
        
        setResult(conversionResult.result);
        setFormula(conversionResult.formula || '');
        saveToHistory(inputValue, conversionResult.result, sourceUnit, targetUnit);
        
        if (onConvertComplete) {
          const callbackData: { result: string; formula?: string } = {
            result: conversionResult.result
          };
          if (conversionResult.formula) {
            callbackData.formula = conversionResult.formula;
          }
          onConvertComplete(callbackData);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '转换失败');
        setResult('');
        setFormula('');
      } finally {
        setProgress(100);
        setTimeout(() => {
          setLoading(false);
          setProgress(0);
        }, 300);
      }
    }, 500);
  }, [inputValue, sourceUnit, targetUnit, sourceUnits, targetUnits, convertFunction, options.precision, saveToHistory, onConvertComplete]);
  
  // 自动转换效果
  useEffect(() => {
    if (options.autoConvert && inputValue.trim() && sourceUnit && targetUnit) {
      const timer = setTimeout(() => {
        performSingleConversion();
      }, 300);
      
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [options.autoConvert, inputValue, sourceUnit, targetUnit, performSingleConversion]);
  
  // 添加批量转换任务
  const addBatchTask = useCallback(() => {
    setBatchTasks(prev => [...prev, {
      id: Date.now().toString(),
      inputValue: '',
      outputValue: '',
      status: 'idle'
    }]);
  }, []);
  
  // 执行批量转换
  const performBatchConversion = useCallback(async () => {
    if (!sourceUnit || !targetUnit) {
      setError('请选择单位');
      return;
    }
    
    setError(null);
    setLoading(true);
    setProgress(0);
    
    const sourceUnitObj = sourceUnits.find(u => u.id === sourceUnit);
    const targetUnitObj = targetUnits.find(u => u.id === targetUnit);
    
    if (!sourceUnitObj || !targetUnitObj) {
      setError('选择的单位无效');
      setLoading(false);
      return;
    }
    
    const tasks = [...batchTasks];
    let processed = 0;
    
    for (const task of tasks) {
      if (!task.inputValue.trim()) {
        task.status = 'error';
        task.errorMessage = '请输入数值';
        task.outputValue = '';
        continue;
      }
      
      task.status = 'processing';
      setBatchTasks([...tasks]);
      
      try {
        // 模拟处理延迟
        await new Promise(resolve => setTimeout(resolve, 200));
        
        const result = convertFunction(task.inputValue, sourceUnitObj, targetUnitObj, options.precision);
        
        if (result.error) {
          task.status = 'error';
          task.errorMessage = result.error;
          task.outputValue = '';
        } else {
          task.status = 'success';
          task.outputValue = result.result;
          
          if (options.historyEnabled) {
            saveToHistory(task.inputValue, result.result, sourceUnit, targetUnit);
          }
        }
      } catch (err) {
        task.status = 'error';
        task.errorMessage = err instanceof Error ? err.message : '转换失败';
        task.outputValue = '';
      }
      
      processed++;
      setProgress(Math.floor((processed / tasks.length) * 100));
      setBatchTasks([...tasks]);
    }
    
    setTimeout(() => {
      setLoading(false);
      setProgress(0);
    }, 300);
  }, [batchTasks, sourceUnit, targetUnit, sourceUnits, targetUnits, convertFunction, options.precision, options.historyEnabled, saveToHistory]);
  
  // 清空历史记录
  const clearHistory = useCallback(() => {
    setHistory([]);
    localStorage.removeItem('conversion_history');
  }, []);
  
  // 切换单位
  const swapUnits = useCallback(() => {
    setSourceUnit(targetUnit);
    setTargetUnit(sourceUnit);
    setInputValue(result);
    setResult(inputValue);
  }, [sourceUnit, targetUnit, inputValue, result]);
  
  // 更新转换选项
  const updateOption = useCallback(<K extends keyof ConversionOptions>(
    key: K, 
    value: ConversionOptions[K]
  ) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  }, []);
  
  // 准备表格预览数据
  useEffect(() => {
    const previewRows = batchTasks.map(task => [
      task.inputValue,
      task.outputValue,
      task.status === 'success' ? '成功' : 
      task.status === 'error' ? '失败' : 
      task.status === 'processing' ? '处理中' : '等待中'
    ]);
    
    setPreviewData({
      headers: ['输入值', '输出值', '状态'],
      rows: previewRows,
      totalRows: previewRows.length
    });
  }, [batchTasks]);
  
  return (
    <Card className={`overflow-hidden transition-all duration-300 ${className}`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-2xl font-bold">数据转换</CardTitle>
            <CardDescription>简单高效的数据转换工具</CardDescription>
          </div>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowOptions(!showOptions)}
                  className="h-8 w-8"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>转换选项</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        {/* 转换选项面板 */}
        {showOptions && (
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="precision">小数精度</Label>
                <div className="flex items-center gap-2">
                  <Slider
                    id="precision"
                    min={0}
                    max={10}
                    step={1}
                    value={[options.precision]}
                    onValueChange={(value) => updateOption('precision', value[0])}
                    className="flex-1"
                  />
                  <span className="w-8 text-center font-mono">{options.precision}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Switch
                  id="show-formula"
                  checked={options.showFormula}
                  onCheckedChange={(checked) => updateOption('showFormula', checked)}
                />
                <Label htmlFor="show-formula">显示计算公式</Label>
              </div>
              
              <div className="flex items-center gap-2">
                <Switch
                  id="auto-convert"
                  checked={options.autoConvert}
                  onCheckedChange={(checked) => updateOption('autoConvert', checked)}
                />
                <Label htmlFor="auto-convert">自动转换</Label>
              </div>
              
              <div className="flex items-center gap-2">
                <Switch
                  id="history-enabled"
                  checked={options.historyEnabled}
                  onCheckedChange={(checked) => updateOption('historyEnabled', checked)}
                />
                <Label htmlFor="history-enabled">启用历史记录</Label>
              </div>
            </div>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* 错误提示 */}
        {error && (
          <Alert variant="destructive" className="animate-shake">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {/* 转换进度 */}
        {loading && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>转换中...</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}
        
        {/* 选项卡 */}
        <Tabs defaultValue="single" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="single" className="flex items-center gap-1">
              <span>单次转换</span>
            </TabsTrigger>
            <TabsTrigger value="batch" className="flex items-center gap-1">
              <span>批量转换</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-1">
              <span>历史记录</span>
              {history.length > 0 && (
                <Badge variant="secondary" className="ml-1">{history.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>
          
          {/* 单次转换内容 */}
          <TabsContent value="single" className="mt-4 space-y-4 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="input-value">输入值</Label>
                <Input
                  id="input-value"
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="请输入数值"
                  disabled={loading}
                  className="font-mono"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="source-unit">源单位</Label>
                <Select
                  value={sourceUnit}
                  onValueChange={setSourceUnit}
                >
                  <SelectTrigger id="source-unit" disabled={loading}>
                    <SelectValue placeholder="选择单位" />
                  </SelectTrigger>
                  <SelectContent>
                    {sourceUnits.map(unit => (
                      <SelectItem key={unit.id} value={unit.id}>
                        {unit.name} ({unit.symbol})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="target-unit">目标单位</Label>
                <div className="relative">
                  <Select
                    value={targetUnit}
                    onValueChange={setTargetUnit}
                  >
                    <SelectTrigger id="target-unit" disabled={loading}>
                      <SelectValue placeholder="选择单位" />
                    </SelectTrigger>
                    <SelectContent>
                      {targetUnits.map(unit => (
                        <SelectItem key={unit.id} value={unit.id}>
                          {unit.name} ({unit.symbol})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={swapUnits}
                          disabled={loading || !sourceUnit || !targetUnit}
                          className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8"
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>交换单位</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>转换结果</Label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={result}
                  readOnly
                  className={`bg-gray-50 dark:bg-gray-800 font-mono font-bold text-lg ${result ? 'text-green-600 dark:text-green-400' : ''}`}
                />
                <Button
                  onClick={performSingleConversion}
                  disabled={loading || !inputValue.trim() || !sourceUnit || !targetUnit}
                  className="gap-1"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                  <span>{options.autoConvert ? '重新转换' : '转换'}</span>
                </Button>
              </div>
            </div>
            
            {/* 计算公式 */}
            {options.showFormula && formula && (
              <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md border font-mono text-sm text-gray-600 dark:text-gray-300">
                <Label className="text-xs font-medium mb-1 block">计算公式</Label>
                {formula}
              </div>
            )}
          </TabsContent>
          
          {/* 批量转换内容 */}
          <TabsContent value="batch" className="mt-4 space-y-4 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="batch-source-unit">源单位</Label>
                <Select
                  value={sourceUnit}
                  onValueChange={setSourceUnit}
                >
                  <SelectTrigger id="batch-source-unit" disabled={loading}>
                    <SelectValue placeholder="选择单位" />
                  </SelectTrigger>
                  <SelectContent>
                    {sourceUnits.map(unit => (
                      <SelectItem key={unit.id} value={unit.id}>
                        {unit.name} ({unit.symbol})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="batch-target-unit">目标单位</Label>
                <Select
                  value={targetUnit}
                  onValueChange={setTargetUnit}
                >
                  <SelectTrigger id="batch-target-unit" disabled={loading}>
                    <SelectValue placeholder="选择单位" />
                  </SelectTrigger>
                  <SelectContent>
                    {targetUnits.map(unit => (
                      <SelectItem key={unit.id} value={unit.id}>
                        {unit.name} ({unit.symbol})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* 批量转换表格预览 */}
            <DataPreview
              data={previewData}
              fileInfo={fileInfo}
              loading={loading}
              editable={!loading}
              onEditComplete={(updatedData) => {
                // 更新批量任务数据
                const updatedTasks = batchTasks.map((task, index) => ({
                  ...task,
                  inputValue: updatedData.rows[index]?.[0] || ''
                }));
                setBatchTasks(updatedTasks);
              }}
            />
            
            <div className="flex justify-between items-center pt-2">
              <Button
                variant="ghost"
                onClick={addBatchTask}
                disabled={loading}
                className="text-primary hover:text-primary/80"
              >
                添加更多行
              </Button>
              
              <Button
                onClick={performBatchConversion}
                disabled={loading || !sourceUnit || !targetUnit}
                className="gap-1"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                <span>批量转换</span>
              </Button>
            </div>
          </TabsContent>
          
          {/* 历史记录内容 */}
          <TabsContent value="history" className="mt-4 space-y-4 animate-fadeIn">
            {history.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center text-gray-500">
                <HelpCircle className="h-12 w-12 mb-4 opacity-50" />
                <p className="text-lg font-medium">暂无历史记录</p>
                <p className="text-sm mt-2">执行转换操作后，历史记录将显示在这里</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium">最近转换记录</h3>
                  <Button variant="ghost" size="sm" onClick={clearHistory}>
                    清空历史
                  </Button>
                </div>
                
                <div className="border rounded-md overflow-hidden">
                  <div className="grid grid-cols-5 gap-2 bg-gray-50 dark:bg-gray-800 p-2 text-sm font-medium">
                    <div>输入</div>
                    <div>源单位</div>
                    <div>目标单位</div>
                    <div>结果</div>
                    <div className="text-right">时间</div>
                  </div>
                  
                  <div className="max-h-[400px] overflow-y-auto space-y-1">
                    {history.map((item, index) => (
                      <div 
                        key={item.id}
                        className={`grid grid-cols-5 gap-2 p-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${index % 2 === 0 ? 'bg-white dark:bg-gray-900' : ''}`}
                      >
                        <div className="font-mono">{item.inputValue}</div>
                        <div>{item.sourceUnit}</div>
                        <div>{item.targetUnit}</div>
                        <div className="font-mono font-medium text-green-600 dark:text-green-400">{item.outputValue}</div>
                        <div className="text-right text-gray-500 text-xs">
                          {new Date(item.timestamp).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="bg-gray-50 dark:bg-gray-800/50 flex justify-between items-center p-4 border-t">
        <div className="text-xs text-gray-500">
          小数精度: {options.precision} | 
          {options.autoConvert ? ' 自动转换已启用' : ' 自动转换已禁用'}
        </div>
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <FileDown className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>导出转换结果</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </CardFooter>
    </Card>
  );
};

export default ConversionFlow;
