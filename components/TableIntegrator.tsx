/**
 * @file 表格功能集成测试组件
 * @description 整合所有表格优化功能，提供端到端集成测试
 * @module TableIntegrator
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 * @updated 2024-10-15
 */
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useToast } from '../hooks/use-toast';
import { useDataProcessor } from '../hooks/useDataProcessor';
import { PerformanceTester } from './PerformanceTester';
import { DataOptimizer } from './DataOptimizer';
import { LoadingState } from './LoadingState';
import { ErrorBoundary, ErrorDisplay, handleError } from './ErrorBoundary';

interface TableIntegratorProps {
  // 表格配置
  tableComponent?: React.ComponentType<any>;
  initialData?: any[];
  enableAutoOptimization?: boolean;
  enableVirtualScroll?: boolean;
}

export interface IntegrationTestConfig {
  testName: string;
  dataSize: 'small' | 'medium' | 'large' | 'xlarge';
  enableVirtualScroll: boolean;
  enableOptimizations: boolean;
  enableWorker: boolean;
  simulateRealWorld?: boolean;
}

// 预设集成测试配置
const INTEGRATION_TESTS: IntegrationTestConfig[] = [
  {
    testName: '基础性能测试',
    dataSize: 'medium',
    enableVirtualScroll: false,
    enableOptimizations: false,
    enableWorker: false,
  },
  {
    testName: '虚拟滚动测试',
    dataSize: 'large',
    enableVirtualScroll: true,
    enableOptimizations: true,
    enableWorker: true,
  },
  {
    testName: '大数据优化测试',
    dataSize: 'xlarge',
    enableVirtualScroll: true,
    enableOptimizations: true,
    enableWorker: true,
    simulateRealWorld: true,
  },
];

/**
 * 表格功能集成测试组件
 */
export const TableIntegrator: React.FC<TableIntegratorProps> = ({
  tableComponent: TableComponent,
  initialData,
  enableAutoOptimization = true,
  enableVirtualScroll = true,
}) => {
  const [isTestRunning, setIsTestRunning] = useState(false);
  const [currentTestConfig, setCurrentTestConfig] = useState<IntegrationTestConfig | null>(null);
  const [testData, setTestData] = useState<any[]>(initialData || []);
  const [isOptimized, setIsOptimized] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'data' | 'performance' | 'optimization' | 'integration'>('data');
  
  const { toast } = useToast();
  const { 
    processData, 
    parseData, 
    profileData, 
    optimizeData, 
    isProcessing, 
    error, 
    processingTime, 
    dataProfile, 
    isWorkerAvailable 
  } = useDataProcessor();
  
  // 性能测试结果
  const [performanceResults, setPerformanceResults] = useState<any[]>([]);
  
  // 测试计时
  const testStartTimeRef = useRef<number>(0);
  const testEndTimeRef = useRef<number>(0);
  
  // 生成测试数据
  const generateTestData = useCallback((size: 'small' | 'medium' | 'large' | 'xlarge'): any[] => {
    let recordCount = 0;
    let columnCount = 10; // 标准列数
    
    switch (size) {
      case 'small':
        recordCount = 500;
        break;
      case 'medium':
        recordCount = 2000;
        break;
      case 'large':
        recordCount = 8000;
        columnCount = 15;
        break;
      case 'xlarge':
        recordCount = 20000;
        columnCount = 20;
        break;
    }
    
    const data: any[] = [];
    for (let i = 0; i < recordCount; i++) {
      const row: any = {
        id: `row-${i}`,
        name: `测试项目 ${i}`,
        category: `类别 ${i % 10}`,
        value: Math.random() * 10000,
        quantity: Math.floor(Math.random() * 100),
        price: Math.random() * 1000,
        date: new Date(Date.now() - Math.random() * 31536000000).toISOString(),
        status: ['active', 'pending', 'completed', 'failed', 'draft'][Math.floor(Math.random() * 5)],
        priority: ['high', 'medium', 'low'][Math.floor(Math.random() * 3)],
        tags: Array(Math.floor(Math.random() * 5)).fill(0).map((_, j) => `标签${j}`),
      };
      
      // 添加额外的列以测试大数据集
      for (let c = 10; c < columnCount; c++) {
        const colType = c % 5;
        switch (colType) {
          case 0:
            row[`numberCol${c}`] = Math.random() * 1000;
            break;
          case 1:
            row[`stringCol${c}`] = `文本数据 ${Math.random().toString(36).substring(2, 15)}`;
            break;
          case 2:
            row[`dateCol${c}`] = new Date(Date.now() - Math.random() * 31536000000).toISOString();
            break;
          case 3:
            // 生成空列，测试自动优化
            if (i % 10 !== 0) {
              row[`emptyCol${c}`] = '';
            }
            break;
          case 4:
            // 生成混合类型列
            row[`mixedCol${c}`] = i % 3 === 0 ? Math.random() * 1000 : `混合数据 ${i}`;
            break;
        }
      }
      
      // 添加一些大文本，测试性能
      if (i % 100 === 0) {
        row.largeText = 'X'.repeat(20000);
      }
      
      data.push(row);
    }
    
    return data;
  }, []);
  
  // 加载测试数据
  const loadTestData = useCallback(async (size: 'small' | 'medium' | 'large' | 'xlarge') => {
    try {
      setIsProcessing(true);
      const data = generateTestData(size);
      setTestData(data);
      setIsOptimized(false);
      
      // 自动分析数据特征
      if (profileData) {
        await profileData(data);
      }
      
      toast({
        title: '测试数据加载完成',
        description: `已生成 ${data.length} 条记录的${size}数据集`,
      });
    } catch (error) {
      handleError(error, '加载测试数据');
      toast({
        title: '加载数据失败',
        description: '生成测试数据时出错',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  }, [generateTestData, profileData, toast]);
  
  // 执行优化
  const runOptimization = useCallback(async () => {
    if (!testData.length) {
      toast({
        title: '无数据可优化',
        description: '请先加载测试数据',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setIsProcessing(true);
      
      if (optimizeData) {
        const optimized = await optimizeData(testData, {
          removeEmptyColumns: true,
          optimizeTypes: true,
          compressData: true,
        });
        
        setTestData(optimized);
        setIsOptimized(true);
        
        toast({
          title: '数据优化完成',
          description: `处理时间: ${processingTime}ms`,
        });
      }
    } catch (error) {
      handleError(error, '数据优化');
      toast({
        title: '优化失败',
        description: '数据优化过程中出错',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  }, [testData, optimizeData, processingTime, toast]);
  
  // 重置数据
  const resetData = useCallback(() => {
    setTestData([]);
    setIsOptimized(false);
    toast({
      title: '数据已重置',
    });
  }, [toast]);
  
  // 处理性能测试完成事件
  const handlePerformanceTestComplete = useCallback((results: any) => {
    setPerformanceResults(prev => [...prev, results]);
    
    // 分析测试结果，生成集成报告
    analyzeIntegrationResults(results);
  }, []);
  
  // 分析集成测试结果
  const analyzeIntegrationResults = useCallback((results: any) => {
    // 这里可以实现更复杂的分析逻辑
    console.log('集成测试结果分析:', results);
    
    // 根据性能指标提供综合建议
    const suggestions: string[] = [];
    
    if (results.metrics.dataProcessingTime > 1000) {
      suggestions.push('考虑优化数据处理算法或增加Web Worker数量');
    }
    
    if (results.metrics.fps < 30 && results.dataSize !== 'small') {
      suggestions.push('虚拟滚动性能不足，建议调整缓冲区大小或优化渲染');
    }
    
    if (results.issues.length > 0) {
      toast({
        title: '测试完成，发现问题',
        description: `发现 ${results.issues.length} 个性能问题，建议查看详情`,
        variant: 'destructive',
      });
    } else {
      toast({
        title: '测试完成',
        description: `性能表现良好，FPS: ${results.metrics.fps.toFixed(0)}`,
      });
    }
  }, [toast]);
  
  // 执行集成测试
  const runIntegrationTest = useCallback(async (config: IntegrationTestConfig) => {
    setIsTestRunning(true);
    setCurrentTestConfig(config);
    testStartTimeRef.current = performance.now();
    
    try {
      // 1. 加载测试数据
      toast({
        title: `开始集成测试: ${config.testName}`,
        description: `加载${config.dataSize}数据集...`,
      });
      
      const data = generateTestData(config.dataSize);
      setTestData(data);
      setIsOptimized(false);
      
      // 2. 分析数据特征
      await profileData?.(data);
      
      // 3. 应用优化（如果启用）
      let processedData = data;
      if (config.enableOptimizations) {
        toast({
          title: '应用数据优化',
          description: '启用列清理、类型优化和数据压缩',
        });
        processedData = await optimizeData?.(data, {
          removeEmptyColumns: true,
          optimizeTypes: true,
          compressData: true,
        }) || data;
        setIsOptimized(true);
      }
      
      // 4. 执行模拟操作（排序、过滤等）
      if (config.simulateRealWorld) {
        toast({
          title: '模拟真实操作',
          description: '执行排序、过滤和聚合操作',
        });
        
        // 模拟用户操作序列
        await processData(processedData, { operation: 'SORT', field: 'value', order: 'desc' });
        await new Promise(resolve => setTimeout(resolve, 500)); // 模拟用户思考时间
        
        await processData(processedData, { 
          operation: 'FILTER', 
          conditions: [{ field: 'status', operator: 'equals', value: 'active' }]
        });
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // 更多操作...
      }
      
      testEndTimeRef.current = performance.now();
      const totalTime = testEndTimeRef.current - testStartTimeRef.current;
      
      // 5. 生成测试报告
      toast({
        title: '集成测试完成',
        description: `总耗时: ${totalTime.toFixed(2)}ms, 数据量: ${processedData.length}条`,
      });
      
      // 将测试结果添加到性能测试结果中
      const integrationResult = {
        testName: config.testName,
        timestamp: new Date(),
        dataSize: config.dataSize,
        recordCount: processedData.length,
        totalTime,
        enableVirtualScroll: config.enableVirtualScroll,
        enableOptimizations: config.enableOptimizations,
        enableWorker: config.enableWorker && isWorkerAvailable,
        successful: true,
      };
      
      setPerformanceResults(prev => [...prev, integrationResult]);
      
    } catch (error) {
      handleError(error, '集成测试');
      toast({
        title: '集成测试失败',
        description: error instanceof Error ? error.message : '未知错误',
        variant: 'destructive',
      });
    } finally {
      setIsTestRunning(false);
    }
  }, [generateTestData, profileData, optimizeData, processData, isWorkerAvailable, toast]);
  
  // 处理错误显示
  useEffect(() => {
    if (error) {
      handleError(error, '表格集成测试');
    }
  }, [error]);
  
  // 渲染表格预览
  const renderTablePreview = () => {
    if (!TableComponent) {
      return (
        <div className="border border-gray-200 rounded-lg p-8 text-center text-gray-500">
          <div className="text-xl mb-2">表格组件未指定</div>
          <div>请在TableIntegrator组件props中提供tableComponent以预览表格渲染效果</div>
        </div>
      );
    }
    
    return (
      <ErrorBoundary>
        <div className="overflow-hidden border border-gray-200 rounded-lg">
          <TableComponent 
            data={testData} 
            enableVirtualScroll={enableVirtualScroll} 
            enableOptimizations={enableAutoOptimization}
          />
        </div>
      </ErrorBoundary>
    );
  };
  
  return (
    <div className="table-integrator">
      {/* 标签切换 */}
      <div className="mb-6 border-b">
        <div className="flex space-x-8">
          {[
            { key: 'data', label: '数据管理' },
            { key: 'optimization', label: '数据优化' },
            { key: 'performance', label: '性能测试' },
            { key: 'integration', label: '集成测试' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setSelectedTab(tab.key as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${ 
                selectedTab === tab.key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* 内容区域 */}
      <div className="space-y-6">
        {/* 数据管理标签 */}
        {selectedTab === 'data' && (
          <div>
            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
              <h3 className="text-lg font-semibold mb-4">测试数据管理</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                {[['small', '小型 (500条)'], ['medium', '中型 (2000条)'], ['large', '大型 (8000条)'], ['xlarge', '超大型 (20000条)']].map(([size, label]) => (
                  <button
                    key={size}
                    onClick={() => loadTestData(size as any)}
                    disabled={isProcessing || isTestRunning}
                    className={`px-4 py-2 rounded-md border ${ 
                      isProcessing || isTestRunning
                        ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    加载{label}
                  </button>
                ))}
              </div>
              
              <div className="flex gap-4">
                <button
                  onClick={resetData}
                  disabled={isProcessing || isTestRunning || testData.length === 0}
                  className={`px-6 py-2 rounded-md ${ 
                    isProcessing || isTestRunning || testData.length === 0
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-red-600 text-white hover:bg-red-700'
                  }`}
                >
                  重置数据
                </button>
              </div>
            </div>
            
            {/* 数据预览 */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-4">
                数据预览 ({testData.length} 条记录)
                {isOptimized && (
                  <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">已优化</span>
                )}
              </h3>
              
              <LoadingState isLoading={isProcessing} operation="加载">
                {testData.length > 0 ? (
                  <div className="space-y-4">
                    <div className="text-sm text-gray-600">
                      {dataProfile && (
                        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                          <div className="font-medium mb-2">数据特征分析</div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            <div>总行数: <strong>{dataProfile.totalRows}</strong></div>
                            <div>总列数: <strong>{dataProfile.totalColumns}</strong></div>
                            <div>总单元格: <strong>{dataProfile.totalCells}</strong></div>
                            <div>数据大小: <strong>{(dataProfile.estimatedSize / 1024).toFixed(2)}KB</strong></div>
                          </div>
                          {dataProfile.issues && dataProfile.issues.length > 0 && (
                            <div className="mt-2 text-red-600 text-xs">
                              发现 {dataProfile.issues.length} 个潜在性能问题
                            </div>
                          )}
                        </div>
                      )}
                      
                      <div className="mb-4">
                        <div className="font-medium mb-1">前5条记录:</div>
                        <pre className="bg-gray-50 p-3 rounded text-xs overflow-auto max-h-40">
                          {JSON.stringify(testData.slice(0, 5), null, 2)}
                        </pre>
                      </div>
                    </div>
                    
                    {renderTablePreview()}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <div className="text-lg mb-2">暂无数据</div>
                    <div>请选择上方按钮加载测试数据</div>
                  </div>
                )}
              </LoadingState>
            </div>
          </div>
        )}
        
        {/* 数据优化标签 */}
        {selectedTab === 'optimization' && (
          <div>
            <DataOptimizer 
              data={testData}
              dataProfile={dataProfile}
              isOptimized={isOptimized}
              onOptimizeComplete={() => setIsOptimized(true)}
              onResetOptimization={() => setIsOptimized(false)}
            />
          </div>
        )}
        
        {/* 性能测试标签 */}
        {selectedTab === 'performance' && (
          <div>
            <PerformanceTester 
              onTestComplete={handlePerformanceTestComplete}
              onLoadSampleData={loadTestData}
            />
          </div>
        )}
        
        {/* 集成测试标签 */}
        {selectedTab === 'integration' && (
          <div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-lg font-semibold mb-6">集成测试</h3>
              
              {/* 测试配置列表 */}
              <div className="space-y-4 mb-6">
                {INTEGRATION_TESTS.map((test, index) => (
                  <div 
                    key={index}
                    className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => !isTestRunning && runIntegrationTest(test)}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">{test.testName}</span>
                      <button
                        disabled={isTestRunning}
                        className={`px-4 py-1 rounded text-sm ${ 
                          isTestRunning
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                      >
                        运行测试
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-600">
                      <div>数据: {test.dataSize}</div>
                      <div>虚拟滚动: {test.enableVirtualScroll ? '是' : '否'}</div>
                      <div>优化: {test.enableOptimizations ? '是' : '否'}</div>
                      <div>Worker: {test.enableWorker ? '是' : '否'}</div>
                    </div>
                    
                    {test.simulateRealWorld && (
                      <div className="mt-2 text-xs text-blue-600">
                        ✓ 包含真实用户操作模拟
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              {/* 测试进度 */}
              {isTestRunning && currentTestConfig && (
                <div className="p-4 bg-gray-50 rounded-lg mb-6">
                  <div className="font-medium mb-2">正在运行: {currentTestConfig.testName}</div>
                  <div className="text-sm text-gray-600">
                    数据集: {currentTestConfig.dataSize}, 
                    虚拟滚动: {currentTestConfig.enableVirtualScroll ? '启用' : '禁用'}
                  </div>
                </div>
              )}
              
              {/* 集成测试结果 */}
              {performanceResults.length > 0 && (
                <div className="mt-8">
                  <h4 className="text-md font-semibold mb-4">测试结果历史</h4>
                  
                  <div className="space-y-4">
                    {performanceResults.map((result, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">{result.testName}</span>
                          <span className={`px-2 py-1 text-xs rounded-full ${ 
                            result.successful ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {result.successful ? '成功' : '失败'}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-600 mb-2">
                          <div>数据: {result.dataSize}</div>
                          <div>记录数: {result.recordCount}</div>
                          <div>耗时: {result.totalTime.toFixed(2)}ms</div>
                          <div>Worker: {result.enableWorker ? '使用' : '未使用'}</div>
                        </div>
                        
                        <div className="text-xs text-gray-500">
                          {result.timestamp.toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * 表格集成测试Provider组件
 * 用于全局管理表格性能测试状态
 */
export const TableIntegrationProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  // 可以在这里添加全局状态管理逻辑
  return (
    <div className="table-integration-provider">
      {children}
    </div>
  );
};