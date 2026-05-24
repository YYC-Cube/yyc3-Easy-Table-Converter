/**
 * @file 性能测试工具组件
 * @description 用于评估表格组件性能并生成性能报告
 * @module PerformanceTester
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 * @updated 2024-10-15
 */
import React, { useState, useRef, useCallback } from 'react';
import { useToast } from '../hooks/use-toast';
import { useDataProcessor } from '../hooks/useDataProcessor';

interface PerformanceTesterProps {
  onTestComplete?: (results: PerformanceResults) => void;
  onLoadSampleData?: (size: TestDataSize) => Promise<any[]>;
}

export type TestDataSize = 'small' | 'medium' | 'large' | 'xlarge';

export interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  dataProcessingTime: number;
  scrollSmoothness: number;
  fps: number;
}

export interface PerformanceResults {
  testName: string;
  timestamp: Date;
  dataSize: TestDataSize;
  recordCount: number;
  metrics: PerformanceMetrics;
  optimizationApplied: boolean;
  workerUsed: boolean;
  issues: string[];
}

interface TestConfig {
  name: string;
  dataSize: TestDataSize;
  iterations: number;
  warmupRuns: number;
  testVirtualScroll: boolean;
  applyOptimizations: boolean;
}

// 预设测试配置
const PRESET_TESTS: TestConfig[] = [
  {
    name: '基础性能测试',
    dataSize: 'medium',
    iterations: 3,
    warmupRuns: 1,
    testVirtualScroll: false,
    applyOptimizations: false,
  },
  {
    name: '虚拟滚动性能测试',
    dataSize: 'large',
    iterations: 3,
    warmupRuns: 1,
    testVirtualScroll: true,
    applyOptimizations: true,
  },
  {
    name: '大数据集测试',
    dataSize: 'xlarge',
    iterations: 2,
    warmupRuns: 1,
    testVirtualScroll: true,
    applyOptimizations: true,
  },
];

/**
 * 性能测试工具组件
 */
export const PerformanceTester: React.FC<PerformanceTesterProps> = ({
  onTestComplete,
  onLoadSampleData,
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [selectedTest, setSelectedTest] = useState<TestConfig | null>(null);
  const [testResults, setTestResults] = useState<PerformanceResults[]>([]);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [currentTestStep, setCurrentTestStep] = useState('');
  
  const { toast } = useToast();
  const { processData, parseData, optimizeData, isWorkerAvailable, dataProfile } = useDataProcessor();
  
  // 性能测试引用
  const startTimeRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const rafIdRef = useRef<number>(0);
  const memoryBeforeRef = useRef<number>(0);
  
  // 生成测试数据
  const generateTestData = useCallback((size: TestDataSize): any[] => {
    let recordCount = 0;
    
    switch (size) {
      case 'small':
        recordCount = 100;
        break;
      case 'medium':
        recordCount = 1000;
        break;
      case 'large':
        recordCount = 5000;
        break;
      case 'xlarge':
        recordCount = 10000;
        break;
    }
    
    const data: any[] = [];
    for (let i = 0; i < recordCount; i++) {
      data.push({
        id: `row-${i}`,
        name: `测试项目 ${i}`,
        description: `这是一个测试描述，包含一些随机文本 ${Math.random().toString(36).substring(2, 10)}`,
        value: Math.random() * 1000,
        date: new Date(Date.now() - Math.random() * 31536000000).toISOString(),
        status: ['active', 'pending', 'completed', 'failed'][Math.floor(Math.random() * 4)],
        // 生成混合类型数据，测试性能
        mixedData: i % 10 === 0 ? Math.random() * 1000 : `文本数据 ${i}`,
        // 生成大文本，测试内存使用
        largeText: i % 100 === 0 ? 'X'.repeat(10000) : '正常文本',
      });
    }
    
    return data;
  }, []);
  
  // 测量FPS
  const measureFPS = useCallback((duration: number): Promise<number> => {
    return new Promise((resolve) => {
      frameCountRef.current = 0;
      lastTimeRef.current = performance.now();
      
      const endTime = lastTimeRef.current + duration;
      
      const updateFrameCount = (timestamp: number) => {
        frameCountRef.current++;
        
        if (timestamp < endTime) {
          rafIdRef.current = requestAnimationFrame(updateFrameCount);
        } else {
          const elapsed = timestamp - lastTimeRef.current;
          const fps = Math.round((frameCountRef.current * 1000) / elapsed);
          resolve(fps);
        }
      };
      
      rafIdRef.current = requestAnimationFrame(updateFrameCount);
    });
  }, []);
  
  // 测量内存使用
  const measureMemoryUsage = useCallback((): number => {
    if (typeof performance !== 'undefined' && performance.memory) {
      return performance.memory.usedJSHeapSize / (1024 * 1024); // MB
    }
    return 0;
  }, []);
  
  // 模拟滚动测试
  const simulateScrolling = useCallback(async (): Promise<{ fps: number; smoothness: number }> => {
    // 测量滚动期间的FPS和流畅度
    // 注意：在实际集成中，这里应该与表格组件的滚动事件结合
    const fps = await measureFPS(1000); // 测量1秒内的FPS
    
    // 计算滚动流畅度（基于FPS）
    const smoothness = fps > 55 ? 100 : fps > 30 ? 70 : fps > 20 ? 40 : 10;
    
    return { fps, smoothness };
  }, [measureFPS]);
  
  // 执行单次测试
  const runSingleTest = useCallback(async (config: TestConfig): Promise<PerformanceResults> => {
    setCurrentTestStep('准备测试数据...');
    
    // 生成或加载测试数据
    let testData = [];
    if (onLoadSampleData) {
      testData = await onLoadSampleData(config.dataSize);
    } else {
      testData = generateTestData(config.dataSize);
    }
    
    // 预热运行
    setCurrentTestStep('预热运行...');
    for (let w = 0; w < config.warmupRuns; w++) {
      if (config.applyOptimizations && optimizeData) {
        await optimizeData(testData, { removeEmptyColumns: true, optimizeTypes: true });
      }
    }
    
    // 重置性能指标
    const metrics: PerformanceMetrics = {
      renderTime: 0,
      memoryUsage: 0,
      dataProcessingTime: 0,
      scrollSmoothness: 0,
      fps: 0,
    };
    
    const issues: string[] = [];
    
    // 主测试循环
    for (let i = 0; i < config.iterations; i++) {
      setCurrentProgress(((i + 1) / config.iterations) * 100);
      setCurrentTestStep(`执行测试迭代 ${i + 1}/${config.iterations}...`);
      
      // 测量内存使用
      memoryBeforeRef.current = measureMemoryUsage();
      
      // 测量数据处理时间
      startTimeRef.current = performance.now();
      
      try {
        if (config.applyOptimizations && optimizeData) {
          await optimizeData(testData, {
            removeEmptyColumns: true,
            optimizeTypes: true,
            compressData: true,
          });
        }
        
        // 处理数据（排序为例）
        await processData(testData, {
          operation: 'SORT',
          field: 'value',
          order: 'asc',
        });
      } catch (error) {
        issues.push(`数据处理错误: ${error instanceof Error ? error.message : '未知错误'}`);
      }
      
      metrics.dataProcessingTime += performance.now() - startTimeRef.current;
      
      // 测量渲染时间（模拟）
      startTimeRef.current = performance.now();
      // 这里应该是实际的渲染调用
      // 模拟渲染延迟
      await new Promise(resolve => setTimeout(resolve, 50));
      metrics.renderTime += performance.now() - startTimeRef.current;
      
      // 测量内存使用
      metrics.memoryUsage += measureMemoryUsage() - memoryBeforeRef.current;
      
      // 测试虚拟滚动性能
      if (config.testVirtualScroll) {
        setCurrentTestStep(`测试虚拟滚动...`);
        const scrollResult = await simulateScrolling();
        metrics.fps += scrollResult.fps;
        metrics.scrollSmoothness += scrollResult.smoothness;
      }
    }
    
    // 计算平均值
    metrics.dataProcessingTime /= config.iterations;
    metrics.renderTime /= config.iterations;
    metrics.memoryUsage /= config.iterations;
    
    if (config.testVirtualScroll) {
      metrics.fps /= config.iterations;
      metrics.scrollSmoothness /= config.iterations;
    }
    
    // 检查性能问题
    if (metrics.dataProcessingTime > 1000) {
      issues.push('数据处理时间过长');
    }
    if (metrics.renderTime > 200) {
      issues.push('渲染时间过长');
    }
    if (metrics.memoryUsage > 100) {
      issues.push('内存使用过高');
    }
    if (metrics.fps < 30 && config.testVirtualScroll) {
      issues.push('滚动帧率过低');
    }
    
    if (!isWorkerAvailable && config.dataSize === 'xlarge') {
      issues.push('大数据集未使用Web Worker优化');
    }
    
    // 生成测试结果
    const results: PerformanceResults = {
      testName: config.name,
      timestamp: new Date(),
      dataSize: config.dataSize,
      recordCount: testData.length,
      metrics,
      optimizationApplied: config.applyOptimizations,
      workerUsed: isWorkerAvailable,
      issues,
    };
    
    return results;
  }, [generateTestData, onLoadSampleData, processData, optimizeData, isWorkerAvailable, measureMemoryUsage, simulateScrolling]);
  
  // 运行测试
  const runTest = useCallback(async (config: TestConfig) => {
    setIsRunning(true);
    setCurrentProgress(0);
    setSelectedTest(config);
    
    try {
      const results = await runSingleTest(config);
      setTestResults(prev => [...prev, results]);
      
      // 发送测试完成通知
      toast({
        title: `测试完成: ${config.name}`,
        description: `处理了 ${results.recordCount} 条记录，处理时间: ${results.metrics.dataProcessingTime.toFixed(2)}ms`,
        variant: results.issues.length === 0 ? 'default' : 'destructive',
      });
      
      // 回调通知
      if (onTestComplete) {
        onTestComplete(results);
      }
    } catch (error) {
      toast({
        title: '测试失败',
        description: error instanceof Error ? error.message : '未知错误',
        variant: 'destructive',
      });
    } finally {
      setIsRunning(false);
      setCurrentProgress(0);
      setCurrentTestStep('');
    }
  }, [runSingleTest, toast, onTestComplete]);
  
  // 运行所有测试
  const runAllTests = useCallback(async () => {
    for (const test of PRESET_TESTS) {
      await runTest(test);
    }
  }, [runTest]);
  
  // 清除测试结果
  const clearResults = useCallback(() => {
    setTestResults([]);
  }, []);
  
  // 获取性能评级
  const getPerformanceRating = (metrics: PerformanceMetrics): 'excellent' | 'good' | 'fair' | 'poor' => {
    const totalScore = 
      (1000 / Math.max(metrics.dataProcessingTime, 10)) * 0.3 +
      (100 / Math.max(metrics.renderTime, 10)) * 0.2 +
      (100 / Math.max(metrics.memoryUsage + 10, 20)) * 0.2 +
      metrics.scrollSmoothness * 0.3;
    
    if (totalScore > 85) return 'excellent';
    if (totalScore > 70) return 'good';
    if (totalScore > 50) return 'fair';
    return 'poor';
  };
  
  // 获取优化建议
  const getOptimizationSuggestions = (results: PerformanceResults): string[] => {
    const suggestions: string[] = [];
    
    if (results.metrics.dataProcessingTime > 500) {
      suggestions.push('考虑使用Web Worker进行数据处理');
    }
    
    if (results.metrics.renderTime > 100) {
      suggestions.push('优化组件渲染，考虑使用React.memo或useMemo');
    }
    
    if (results.metrics.memoryUsage > 50) {
      suggestions.push('减少不必要的数据存储，考虑使用数据压缩');
    }
    
    if (results.metrics.fps < 45 && results.dataSize !== 'small') {
      suggestions.push('改进虚拟滚动实现，减少不必要的DOM操作');
    }
    
    if (!results.optimizationApplied) {
      suggestions.push('启用数据优化选项以提高性能');
    }
    
    return suggestions;
  };
  
  return (
    <div className="performance-tester bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">性能测试工具</h2>
      
      {/* 测试控制区 */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">预设测试</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {PRESET_TESTS.map((test, index) => (
            <div
              key={index}
              className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => !isRunning && runTest(test)}
            >
              <div className="font-medium mb-2">{test.name}</div>
              <div className="text-sm text-gray-600">
                数据集: {test.dataSize}, 迭代: {test.iterations}, 
                虚拟滚动: {test.testVirtualScroll ? '是' : '否'}, 
                优化: {test.applyOptimizations ? '是' : '否'}
              </div>
            </div>
          ))}
        </div>
        
        <div className="flex gap-4">
          <button
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors flex-1"
            onClick={runAllTests}
            disabled={isRunning}
          >
            运行所有测试
          </button>
          
          <button
            className="bg-gray-200 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-300 transition-colors"
            onClick={clearResults}
            disabled={isRunning || testResults.length === 0}
          >
            清除结果
          </button>
        </div>
      </div>
      
      {/* 测试进度 */}
      {isRunning && (
        <div className="mb-8 p-4 bg-gray-50 rounded-lg">
          <div className="mb-2 font-medium">{selectedTest?.name}</div>
          <div className="text-sm text-gray-600 mb-2">{currentTestStep}</div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-500 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${currentProgress}%` }}
            ></div>
          </div>
          <div className="text-right text-xs mt-1 text-gray-500">{currentProgress.toFixed(0)}%</div>
        </div>
      )}
      
      {/* 测试结果 */}
      {testResults.length > 0 && (
        <div className="test-results mt-8">
          <h3 className="text-lg font-semibold mb-4">测试结果</h3>
          
          {testResults.map((result, index) => {
            const rating = getPerformanceRating(result.metrics);
            const suggestions = getOptimizationSuggestions(result);
            
            return (
              <div 
                key={index} 
                className="border rounded-lg p-4 mb-4"
              >
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium">{result.testName}</h4>
                  <span className={`px-2 py-1 text-xs rounded-full ${ 
                    rating === 'excellent' ? 'bg-green-100 text-green-800' :
                    rating === 'good' ? 'bg-blue-100 text-blue-800' :
                    rating === 'fair' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800' 
                  }`}>
                    {rating === 'excellent' ? '优秀' :
                     rating === 'good' ? '良好' :
                     rating === 'fair' ? '一般' :
                     '较差'}
                  </span>
                </div>
                
                <div className="text-sm text-gray-600 mb-2">
                  时间: {result.timestamp.toLocaleString()} | 
                  数据集大小: {result.dataSize} | 
                  记录数: {result.recordCount} |
                  Worker: {result.workerUsed ? '使用中' : '未使用'}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="font-medium text-sm mb-2">性能指标</div>
                    <div className="space-y-1 text-sm">
                      <div>处理时间: <span className="font-mono">{result.metrics.dataProcessingTime.toFixed(2)}ms</span></div>
                      <div>渲染时间: <span className="font-mono">{result.metrics.renderTime.toFixed(2)}ms</span></div>
                      <div>内存使用: <span className="font-mono">{result.metrics.memoryUsage.toFixed(2)}MB</span></div>
                      {result.dataSize !== 'small' && (
                        <>
                          <div>FPS: <span className="font-mono">{result.metrics.fps.toFixed(0)}</span></div>
                          <div>滚动流畅度: <span className="font-mono">{result.metrics.scrollSmoothness.toFixed(0)}%</span></div>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    {result.issues.length > 0 && (
                      <div className="bg-red-50 p-3 rounded mb-3">
                        <div className="font-medium text-sm mb-1 text-red-800">发现问题</div>
                        <ul className="text-sm text-red-700 list-disc pl-4 space-y-1">
                          {result.issues.map((issue, i) => (
                            <li key={i}>{issue}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {suggestions.length > 0 && (
                      <div className="bg-blue-50 p-3 rounded">
                        <div className="font-medium text-sm mb-1 text-blue-800">优化建议</div>
                        <ul className="text-sm text-blue-700 list-disc pl-4 space-y-1">
                          {suggestions.map((suggestion, i) => (
                            <li key={i}>{suggestion}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};