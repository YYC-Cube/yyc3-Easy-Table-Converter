/**
 * @file 数据自动优化器组件
 * @description 自动检测、分析和优化表格数据性能
 * @module components
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-18
 */
"use client"

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { AlertTriangle, Zap, Database, RefreshCw } from 'lucide-react';
import { Badge } from './ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { useToast } from '@/YYC_原油/components/ui/use-toast';

interface DataOptimizerProps {
  tableData: string[][];
  onDataOptimized: (optimizedData: string[][]) => void;
  autoDetect?: boolean;
}

interface DataAnalysisResult {
  totalRows: number;
  totalColumns: number;
  totalCells: number;
  estimatedSize: number; // bytes
  hasEmptyColumns: boolean;
  hasMixedDataTypes: boolean;
  hasLongStrings: boolean;
  recommendedOptimizations: Optimization[];
  isLargeDataset: boolean;
  isComplexDataset: boolean;
}

interface Optimization {
  id: string;
  type: 'virtualScroll' | 'webWorker' | 'dataCompression' | 'emptyColumnRemoval' | 'typeOptimization';
  name: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  isApplied: boolean;
  priority: number;
}

const OPTIMIZATION_TYPES: Record<Optimization['type'], Optimization> = {
  virtualScroll: {
    id: 'virtualScroll',
    type: 'virtualScroll',
    name: '虚拟滚动渲染',
    description: '仅渲染可视区域的数据行，大幅提升大数据集渲染性能',
    impact: 'high',
    isApplied: false,
    priority: 1,
  },
  webWorker: {
    id: 'webWorker',
    type: 'webWorker',
    name: 'Web Worker 处理',
    description: '在后台线程处理数据操作，避免阻塞主线程',
    impact: 'high',
    isApplied: false,
    priority: 2,
  },
  dataCompression: {
    id: 'dataCompression',
    type: 'dataCompression',
    name: '数据压缩优化',
    description: '优化数据结构，减少内存占用',
    impact: 'medium',
    isApplied: false,
    priority: 3,
  },
  emptyColumnRemoval: {
    id: 'emptyColumnRemoval',
    type: 'emptyColumnRemoval',
    name: '移除空列',
    description: '自动检测并移除全为空值的列',
    impact: 'low',
    isApplied: false,
    priority: 4,
  },
  typeOptimization: {
    id: 'typeOptimization',
    type: 'typeOptimization',
    name: '数据类型优化',
    description: '优化数据类型表示，提升处理效率',
    impact: 'medium',
    isApplied: false,
    priority: 5,
  },
};

export const DataOptimizer: React.FC<DataOptimizerProps> = ({ 
  tableData, 
  onDataOptimized,
  autoDetect = true 
}) => {
  const [analysisResult, setAnalysisResult] = useState<DataAnalysisResult | null>(null);
  const [selectedOptimizations, setSelectedOptimizations] = useState<Optimization[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const { toast } = useToast();
  // 使用useDataProcessor的其他方法时可以解构相应属性
  // const { someMethod } = useDataProcessor();

  // 分析数据特征
  const analyzeData = useCallback((data: string[][]) => {
    if (!data || data.length === 0) {
      return null;
    }

    const totalRows = data.length;
    const totalColumns = data[0]?.length || 0;
    const totalCells = totalRows * totalColumns;

    // 估算数据大小（粗略估计）
    let estimatedSize = 0;
    let hasEmptyColumns = false;
    let hasMixedDataTypes = false;
    let hasLongStrings = false;

    // 检查每列是否为空
    const emptyColumns = new Set<number>();
    for (let col = 0; col < totalColumns; col++) {
      let allEmpty = true;
      for (let row = 0; row < totalRows; row++) {
        const cellValue = data[row][col];
        if (cellValue && cellValue.trim() !== '') {
          allEmpty = false;
        }
        // 估算大小
        if (cellValue) {
          estimatedSize += cellValue.length * 2; // 粗略估算UTF-16字符串大小
          
          // 检查是否有长字符串
          if (cellValue.length > 1000) {
            hasLongStrings = true;
          }
        }
      }
      if (allEmpty) {
        emptyColumns.add(col);
        hasEmptyColumns = true;
      }
    }

    // 检查数据类型混合
    for (let col = 0; col < totalColumns; col++) {
      const types = new Set<string>();
      for (let row = 0; row < totalRows; row++) {
        const cellValue = data[row][col];
        if (cellValue && cellValue.trim() !== '') {
          let cellType = 'string';
          if (!isNaN(Number(cellValue)) && cellValue.trim() !== '') {
            cellType = 'number';
          } else if (/^(true|false)$/i.test(cellValue.trim())) {
            cellType = 'boolean';
          }
          types.add(cellType);
        }
      }
      if (types.size > 1) {
        hasMixedDataTypes = true;
        break;
      }
    }

    // 判断是否为大数据集
    const isLargeDataset = totalCells > 10000 || totalRows > 500;
    const isComplexDataset = hasMixedDataTypes || hasLongStrings || hasEmptyColumns;

    // 生成推荐优化方案
    const recommendedOptimizations: Optimization[] = [];
    
    if (isLargeDataset) {
      recommendedOptimizations.push(OPTIMIZATION_TYPES.virtualScroll);
      recommendedOptimizations.push(OPTIMIZATION_TYPES.webWorker);
    }
    
    if (estimatedSize > 1024 * 1024) { // 大于1MB
      recommendedOptimizations.push(OPTIMIZATION_TYPES.dataCompression);
    }
    
    if (hasEmptyColumns) {
      recommendedOptimizations.push(OPTIMIZATION_TYPES.emptyColumnRemoval);
    }
    
    if (hasMixedDataTypes) {
      recommendedOptimizations.push(OPTIMIZATION_TYPES.typeOptimization);
    }

    // 按优先级排序
    recommendedOptimizations.sort((a, b) => a.priority - b.priority);

    return {
      totalRows,
      totalColumns,
      totalCells,
      estimatedSize,
      hasEmptyColumns,
      hasMixedDataTypes,
      hasLongStrings,
      recommendedOptimizations,
      isLargeDataset,
      isComplexDataset,
    };
  }, []);

  // 执行分析
  const performAnalysis = useCallback(async () => {
    setIsAnalyzing(true);
    try {
      // 使用 setTimeout 避免阻塞UI
      setTimeout(() => {
        const result = analyzeData(tableData);
        setAnalysisResult(result);
        if (result) {
          setSelectedOptimizations(result.recommendedOptimizations);
        }
        setIsAnalyzing(false);
      }, 100);
    } catch (error) {
      console.error('数据分析失败:', error);
      setIsAnalyzing(false);
      toast({ title: '分析失败', description: '无法分析数据特征，请重试', variant: 'destructive' });
    }
  }, [analyzeData, tableData, toast]);

  // 自动检测
  useEffect(() => {
    if (autoDetect && tableData && tableData.length > 0) {
      performAnalysis();
    }
  }, [autoDetect, tableData, performAnalysis]);

  // 优化数据
  const optimizeData = async () => {
    if (!tableData || !analysisResult) return;

    setIsOptimizing(true);
    try {
      let optimizedData = [...tableData];
      
      // 收集要应用的优化
      const optimizationsToApply = selectedOptimizations.filter(opt => opt.isApplied);
      
      // 执行优化
      for (const optimization of optimizationsToApply) {
        switch (optimization.type) {
          case 'emptyColumnRemoval':
            // 移除空列
            if (analysisResult.hasEmptyColumns) {
              optimizedData = removeEmptyColumns(optimizedData);
            }
            break;
            
          case 'dataCompression':
            // 数据压缩 (直接实现)
            if (optimization.type === 'dataCompression') {
              // 简单的数据压缩实现 - 移除重复行
              const seenRows = new Set<string>();
              optimizedData = optimizedData.filter(row => {
                const rowString = JSON.stringify(row);
                if (seenRows.has(rowString)) {
                  return false;
                }
                seenRows.add(rowString);
                return true;
              });
            }
            break;
            
          case 'typeOptimization':
            // 数据类型优化
            optimizedData = optimizeDataTypes(optimizedData);
            break;
        }
      }

      // 通知父组件数据已优化
      onDataOptimized(optimizedData);
      
      // 显示成功消息
      toast({
        title: '数据优化完成',
        description: `已应用 ${optimizationsToApply.length} 项优化`,
        variant: 'default'
      });
    } catch (error) {
      console.error('数据优化失败:', error);
      toast({
        title: '优化失败',
        description: '数据优化过程中发生错误，请重试',
        variant: 'destructive'
      });
    } finally {
      setIsOptimizing(false);
    }
  };

  // 辅助函数：移除空列
  const removeEmptyColumns = (data: string[][]): string[][] => {
    if (!data || data.length === 0) return data;
    
    const columnsToKeep: number[] = [];
    const totalColumns = data[0].length;
    
    // 确定哪些列需要保留
    for (let col = 0; col < totalColumns; col++) {
      let hasData = false;
      for (let row = 0; row < data.length; row++) {
        if (data[row][col] && data[row][col].trim() !== '') {
          hasData = true;
          break;
        }
      }
      if (hasData) {
        columnsToKeep.push(col);
      }
    }
    
    // 生成新的数据结构
    return data.map(row => columnsToKeep.map(col => row[col]));
  };

  // 辅助函数：优化数据类型
  const optimizeDataTypes = (data: string[][]): string[][] => {
    if (!data || data.length === 0) return data;
    
    return data.map(row => {
      return row.map(cell => {
        if (!cell) return cell;
        
        const trimmedCell = cell.trim();
        
        // 优化数字表示
        if (!isNaN(Number(trimmedCell)) && trimmedCell !== '') {
          const num = Number(trimmedCell);
          // 去除末尾多余的0和小数点
          return num % 1 === 0 ? num.toString() : num.toString();
        }
        
        // 优化布尔值表示
        if (/^(true|false)$/i.test(trimmedCell)) {
          return trimmedCell.toLowerCase();
        }
        
        return cell;
      });
    });
  };

  // 切换优化选项
  const toggleOptimization = (id: string) => {
    setSelectedOptimizations(prev => 
      prev.map(opt => 
        opt.id === id ? { ...opt, isApplied: !opt.isApplied } : opt
      )
    );
  };

  // 全选/取消全选
  const toggleAllOptimizations = (allApplied: boolean) => {
    setSelectedOptimizations(prev => 
      prev.map(opt => ({ ...opt, isApplied: allApplied }))
    );
  };

  // 获取影响级别对应的样式
  const getImpactStyle = (impact: Optimization['impact']) => {
    switch (impact) {
      case 'high': return 'bg-emerald-100 text-emerald-700';
      case 'medium': return 'bg-amber-100 text-amber-700';
      case 'low': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (!analysisResult) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <button 
            onClick={performAnalysis}
            className="flex items-center gap-2 mx-auto text-primary hover:underline"
            disabled={isAnalyzing}
          >
            {isAnalyzing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
            <span>{isAnalyzing ? '分析中...' : '分析数据特征'}</span>
          </button>
        </CardContent>
      </Card>
    );
  }

  const allOptimizationsApplied = selectedOptimizations.every(opt => opt.isApplied);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">数据性能优化器</CardTitle>
        <CardDescription>
          基于数据分析的智能优化建议，提升表格渲染和操作性能
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="analysis" className="w-full">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="analysis">数据分析</TabsTrigger>
            <TabsTrigger value="optimizations">优化建议</TabsTrigger>
          </TabsList>
          
          <TabsContent value="analysis" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="text-sm font-medium mb-2">数据集规模</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>行数:</span>
                    <span className="font-medium">{analysisResult.totalRows}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>列数:</span>
                    <span className="font-medium">{analysisResult.totalColumns}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>总单元格数:</span>
                    <span className="font-medium">{analysisResult.totalCells.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>估计大小:</span>
                    <span className="font-medium">
                      {(analysisResult.estimatedSize / 1024).toFixed(2)} KB
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="text-sm font-medium mb-2">数据特征</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>大数据集:</span>
                    <Badge variant={analysisResult.isLargeDataset ? "destructive" : "default"}>
                      {analysisResult.isLargeDataset ? '是' : '否'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>复杂数据集:</span>
                    <Badge variant={analysisResult.isComplexDataset ? "destructive" : "default"}>
                      {analysisResult.isComplexDataset ? '是' : '否'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>有空列:</span>
                    <Badge variant={analysisResult.hasEmptyColumns ? "destructive" : "default"}>
                      {analysisResult.hasEmptyColumns ? '是' : '否'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>混合数据类型:</span>
                    <Badge variant={analysisResult.hasMixedDataTypes ? "destructive" : "default"}>
                      {analysisResult.hasMixedDataTypes ? '是' : '否'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>长字符串:</span>
                    <Badge variant={analysisResult.hasLongStrings ? "destructive" : "default"}>
                      {analysisResult.hasLongStrings ? '是' : '否'}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
            
            {analysisResult.isLargeDataset && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-amber-700">性能警告</p>
                    <p className="text-amber-600">
                      当前数据集较大 ({analysisResult.totalCells.toLocaleString()} 单元格)，
                      可能会影响渲染性能。建议启用虚拟滚动和Web Worker处理。
                    </p>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="optimizations" className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">优化选项</h4>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => toggleAllOptimizations(!allOptimizationsApplied)}
                className="h-8"
              >
                {allOptimizationsApplied ? '取消全选' : '全选'}
              </Button>
            </div>
            
            <div className="space-y-3">
              {selectedOptimizations.map((optimization) => (
                <div 
                  key={optimization.id}
                  className={`p-4 rounded-lg border ${optimization.isApplied ? 'border-primary bg-primary/5' : 'border-border'}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 pr-4">
                      <div className="flex items-center gap-2">
                        <h5 className="font-medium">{optimization.name}</h5>
                        <Badge className={`${getImpactStyle(optimization.impact)}`} variant="outline">
                          {optimization.impact === 'high' ? '高' : 
                           optimization.impact === 'medium' ? '中' : '低'}影响
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{optimization.description}</p>
                    </div>
                    <Switch 
                      checked={optimization.isApplied}
                      onCheckedChange={() => toggleOptimization(optimization.id)}
                    />
                  </div>
                </div>
              ))}
            </div>
            
            {selectedOptimizations.length === 0 && (
              <div className="p-6 text-center text-muted-foreground">
                <p>当前数据集无需优化</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
      
      {selectedOptimizations.length > 0 && (
        <CardFooter className="flex flex-col sm:flex-row gap-2 border-t p-4">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  onClick={optimizeData}
                  disabled={isOptimizing || !selectedOptimizations.some(opt => opt.isApplied)}
                  className="w-full sm:w-auto gap-2"
                >
                  {isOptimizing ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      优化中...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4" />
                      应用优化
                    </>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>应用所选优化项</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <Button 
            variant="secondary" 
            onClick={performAnalysis}
            disabled={isAnalyzing}
            className="w-full sm:w-auto"
          >
            重新分析
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

// 性能优化建议上下文
export const useOptimizationRecommendations = () => {
  const [recommendations, setRecommendations] = useState<Optimization[]>([]);
  
  // 基于数据特征获取优化建议
  const getRecommendations = useCallback((tableData: string[][]) => {
    const optimizer = new DataOptimizerImpl();
    return optimizer.getRecommendations(tableData);
  }, []);
  
  // 应用推荐优化
  const applyRecommendations = useCallback(async (tableData: string[][], recommendations: Optimization[]) => {
    const optimizer = new DataOptimizerImpl();
    return await optimizer.applyOptimizations(tableData, recommendations);
  }, []);
  
  return {
    recommendations,
    setRecommendations,
    getRecommendations,
    applyRecommendations,
  };
};

// 数据优化器实现类
class DataOptimizerImpl {
  // 获取优化建议
  getRecommendations(tableData: string[][]): Optimization[] {
    const recommendations: Optimization[] = [];
    const totalRows = tableData.length;
    const totalColumns = tableData[0]?.length || 0;
    const totalCells = totalRows * totalColumns;
    
    // 基于数据规模推荐
    if (totalCells > 10000) {
      recommendations.push({...OPTIMIZATION_TYPES.virtualScroll, isApplied: true});
      recommendations.push({...OPTIMIZATION_TYPES.webWorker, isApplied: true});
    }
    
    return recommendations.sort((a, b) => a.priority - b.priority);
  }
  
  // 应用优化
  async applyOptimizations(tableData: string[][], _recommendations: Optimization[]): Promise<string[][]> {
    const optimizedData = [...tableData];
    
    // 这里可以实现具体的优化逻辑
    // 实际应用中可能需要使用Web Worker
    
    return optimizedData;
  }
}