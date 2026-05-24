/**
 * @file 性能指标展示组件
 * @description 实时显示数据处理性能指标和统计信息
 * @module components
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-18
 */
"use client"

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { BarChart3, Activity, Cpu, Clock, Database, AlertTriangle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

interface PerformanceMetrics {
  processingTime?: number; // 毫秒
  memoryUsage?: number; // 字节
  dataSize?: number; // 字节
  recordCount?: number;
  operationType?: string;
  isWorkerUsed?: boolean;
  errorCount?: number;
}

interface PerformanceIndicatorProps {
  metrics: PerformanceMetrics;
  visible?: boolean;
  autoHideAfter?: number; // 毫秒，自动隐藏时间
}

export const PerformanceIndicator: React.FC<PerformanceIndicatorProps> = ({
  metrics,
  visible: initialVisible = false,
  autoHideAfter = 5000,
}) => {
  const [visible, setVisible] = useState(initialVisible);
  const [previousMetrics, setPreviousMetrics] = useState<PerformanceMetrics>(metrics);

  // 监听指标变化并自动显示
  useEffect(() => {
    if (Object.keys(metrics).length > 0 && 
        JSON.stringify(metrics) !== JSON.stringify(previousMetrics)) {
      setVisible(true);
      setPreviousMetrics(metrics);
      
      // 设置自动隐藏计时器
      const timer = setTimeout(() => {
        setVisible(false);
      }, autoHideAfter);

      return () => clearTimeout(timer);
    }
  }, [metrics, previousMetrics, autoHideAfter]);

  if (!visible && !initialVisible) {
    return null;
  }

  // 格式化时间
  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(1)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  // 格式化文件大小
  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  // 获取性能评级
  const getPerformanceRating = (ms: number) => {
    if (ms < 100) return { level: '优秀', color: 'text-emerald-500' };
    if (ms < 500) return { level: '良好', color: 'text-green-500' };
    if (ms < 1000) return { level: '一般', color: 'text-amber-500' };
    if (ms < 3000) return { level: '较慢', color: 'text-orange-500' };
    return { level: '较慢', color: 'text-red-500' };
  };

  const processingRating = metrics.processingTime 
    ? getPerformanceRating(metrics.processingTime)
    : null;

  return (
    <Card 
      className="fixed bottom-4 right-4 z-50 w-80 shadow-xl transition-all duration-300 bg-background/95 backdrop-blur-sm"
      style={{ 
        transform: visible ? 'translate(0, 0)' : 'translate(100%, 0)',
        opacity: visible ? 1 : 0
      }}
    >
      <CardHeader className="px-4 py-3 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            <CardTitle className="text-sm font-medium">性能指标</CardTitle>
          </div>
          <button
            onClick={() => setVisible(false)}
            className="text-muted-foreground hover:text-foreground rounded-full p-1"
            aria-label="关闭性能指标"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="overview" className="text-xs">概览</TabsTrigger>
            <TabsTrigger value="details" className="text-xs">详情</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="p-4 space-y-3">
            {metrics.operationType && (
              <div className="text-xs font-medium text-muted-foreground">
                操作: {metrics.operationType}
              </div>
            )}
            
            {metrics.processingTime !== undefined && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs">处理时间</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-medium">{formatTime(metrics.processingTime)}</span>
                  {processingRating && (
                    <span className={`text-xs ${processingRating.color}`}>
                      {processingRating.level}
                    </span>
                  )}
                </div>
              </div>
            )}
            
            {metrics.recordCount !== undefined && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs">数据量</span>
                </div>
                <div className="text-sm font-medium">
                  {metrics.recordCount.toLocaleString()} 条记录
                </div>
              </div>
            )}
            
            {metrics.isWorkerUsed !== undefined && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cpu className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs">处理模式</span>
                </div>
                <div className="text-xs font-medium bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                  {metrics.isWorkerUsed ? 'Web Worker' : '主线程'}
                </div>
              </div>
            )}
            
            {metrics.errorCount && metrics.errorCount > 0 && (
              <div className="flex items-center justify-between bg-destructive/10 p-2 rounded-md">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                  <span className="text-xs text-destructive">错误数</span>
                </div>
                <div className="text-sm font-medium text-destructive">
                  {metrics.errorCount}
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="details" className="p-4 space-y-3 text-xs">
            {metrics.dataSize !== undefined && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="h-3.5 w-3.5 text-primary" />
                  <span>数据大小</span>
                </div>
                <div className="font-medium">{formatSize(metrics.dataSize)}</div>
              </div>
            )}
            
            {metrics.memoryUsage !== undefined && (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cpu className="h-3.5 w-3.5 text-primary" />
                  <span>内存使用</span>
                </div>
                <div className="font-medium">{formatSize(metrics.memoryUsage)}</div>
              </div>
            )}
            
            {metrics.processingTime !== undefined && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="w-full bg-muted/50 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full transition-all duration-500 ease-out"
                        style={{
                          width: `${Math.min((metrics.processingTime / 3000) * 100, 100)}%`,
                          backgroundColor: processingRating?.color.replace('text-', 'bg-') || 'bg-primary'
                        }}
                      />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>处理时间可视化</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            
            <div className="pt-2 text-muted-foreground text-xs text-center">
              更新于: {new Date().toLocaleTimeString()}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

// 简化版本的性能指标钩子
export const usePerformanceTracker = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({});
  
  const startOperation = (operationType: string) => {
    setMetrics(prev => ({
      ...prev,
      operationType,
      processingTime: undefined,
    }));
    return Date.now();
  };
  
  const endOperation = (startTime: number, additionalMetrics?: Partial<PerformanceMetrics>) => {
    const processingTime = Date.now() - startTime;
    setMetrics(prev => ({
      ...prev,
      processingTime,
      ...additionalMetrics,
    }));
    return processingTime;
  };
  
  const updateMetrics = (newMetrics: Partial<PerformanceMetrics>) => {
    setMetrics(prev => ({
      ...prev,
      ...newMetrics,
    }));
  };
  
  return {
    metrics,
    startOperation,
    endOperation,
    updateMetrics,
  };
};