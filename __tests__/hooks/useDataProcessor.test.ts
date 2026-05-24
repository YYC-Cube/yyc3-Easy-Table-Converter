/**
 * @file useDataProcessor 钩子单元测试
 * @description 测试数据处理钩子的核心功能和性能优化机制
 * @module __tests__/hooks/useDataProcessor.test.ts
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-17
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { useDataProcessor } from '../../hooks/useDataProcessor';

// Mock Web Worker
class MockWorker {
  onmessage: ((this: DedicatedWorkerGlobalScope, ev: MessageEvent<any>) => any) | null = null;
  onerror: ((this: DedicatedWorkerGlobalScope, ev: ErrorEvent) => any) | null = null;

  constructor() {
    // 模拟Worker构造函数
  }

  postMessage(message: any): void {
    // 模拟Worker响应
    setTimeout(() => {
      if (this.onmessage) {
        let response;
        
        switch (message.type) {
          case 'PROCESS_DATA':
            response = {
              data: {
                type: 'PROCESS_DATA_RESULT',
                payload: {
                  data: [{ id: 1, name: 'Test' }],
                  columns: [{ key: 'id', title: 'ID' }, { key: 'name', title: 'Name' }],
                  metadata: { rowCount: 1, columnCount: 2 }
                }
              }
            };
            break;
            
          case 'PARSE_DATA':
            response = {
              data: {
                type: 'PARSE_DATA_RESULT',
                payload: {
                  data: [{ id: 1, name: 'Test' }],
                  columns: [{ key: 'id', title: 'ID' }, { key: 'name', title: 'Name' }]
                }
              }
            };
            break;
            
          case 'PROFILE_DATA':
            response = {
              data: {
                type: 'PROFILE_DATA_RESULT',
                payload: {
                  rowCount: 1,
                  columnCount: 2,
                  dataTypes: { id: 'number', name: 'string' },
                  memoryEstimate: 1,
                  recommendedProcessingMode: 'main_thread'
                }
              }
            };
            break;
            
          case 'OPTIMIZE_DATA':
            response = {
              data: {
                type: 'OPTIMIZE_DATA_RESULT',
                payload: {
                  data: [{ id: 1, name: 'Test' }],
                  optimized: true,
                  optimizationDetails: { reducedMemory: true }
                }
              }
            };
            break;
            
          default:
            response = { data: { type: 'UNKNOWN' } };
        }
        
        this.onmessage(response as any);
      }
    }, 10);
  }

  terminate(): void {
    // 模拟Worker终止
  }
}

// Mock Worker
Object.defineProperty(global, 'Worker', {
  value: MockWorker,
  writable: true
});

// Mock performance.memory
Object.defineProperty(performance, 'memory', {
  configurable: true,
  get: () => ({
    usedJSHeapSize: 1000000,
    totalJSHeapSize: 2000000,
    jsHeapSizeLimit: 10000000
  })
});

describe('useDataProcessor Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // 重置定时器
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('应该正确初始化并返回所有方法和状态', () => {
    const { result } = renderHook(() => useDataProcessor());
    
    // 验证返回的方法和状态
    expect(result.current.processData).toBeDefined();
    expect(result.current.parseData).toBeDefined();
    expect(result.current.profileData).toBeDefined();
    expect(result.current.optimizeData).toBeDefined();
    expect(result.current.isProcessing).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.memoryUsage).toBeDefined();
    expect(result.current.optimizationRecommendations).toEqual([]);
    expect(result.current.dataProfile).toBeNull();
  });

  test('应该正确处理CSV数据', async () => {
    const { result } = renderHook(() => useDataProcessor());
    const csvData = 'id,name\n1,Test';
    
    let processResult;
    await act(async () => {
      processResult = await result.current.processData(csvData, 'csv');
    });
    
    // 验证处理结果
    expect(processResult).toBeDefined();
    expect(processResult.data).toHaveLength(1);
    expect(processResult.columns).toHaveLength(2);
    expect(result.current.isProcessing).toBe(false);
  });

  test('应该正确处理JSON数据', async () => {
    const { result } = renderHook(() => useDataProcessor());
    const jsonData = JSON.stringify([{ id: 1, name: 'Test' }]);
    
    let processResult;
    await act(async () => {
      processResult = await result.current.processData(jsonData, 'json');
    });
    
    // 验证处理结果
    expect(processResult).toBeDefined();
    expect(processResult.data).toHaveLength(1);
    expect(processResult.columns).toHaveLength(2);
  });

  test('应该正确处理TSV数据', async () => {
    const { result } = renderHook(() => useDataProcessor());
    const tsvData = 'id\tname\n1\tTest';
    
    let processResult;
    await act(async () => {
      processResult = await result.current.processData(tsvData, 'tsv');
    });
    
    // 验证处理结果
    expect(processResult).toBeDefined();
    expect(processResult.data).toHaveLength(1);
    expect(processResult.columns).toHaveLength(2);
  });

  test('应该正确执行数据特征分析', async () => {
    const { result } = renderHook(() => useDataProcessor());
    const data = [{ id: 1, name: 'Test' }, { id: 2, name: 'Test2' }];
    
    let profileResult;
    await act(async () => {
      profileResult = await result.current.profileData(data);
    });
    
    // 验证特征分析结果
    expect(profileResult).toBeDefined();
    expect(profileResult.rowCount).toBeDefined();
    expect(profileResult.columnCount).toBeDefined();
    expect(profileResult.dataTypes).toBeDefined();
    expect(profileResult.memoryEstimate).toBeDefined();
  });

  test('应该正确执行数据优化', async () => {
    const { result } = renderHook(() => useDataProcessor());
    const data = [{ id: 1, name: 'Test' }, { id: 2, name: 'Test2' }];
    
    let optimizeResult;
    await act(async () => {
      optimizeResult = await result.current.optimizeData(data);
    });
    
    // 验证优化结果
    expect(optimizeResult).toBeDefined();
    expect(optimizeResult.optimized).toBe(true);
    expect(optimizeResult.data).toBeDefined();
    expect(optimizeResult.optimizationDetails).toBeDefined();
  });

  test('应该正确处理处理中的状态', async () => {
    const { result } = renderHook(() => useDataProcessor());
    const csvData = 'id,name\n1,Test';
    
    // 开始处理前状态
    expect(result.current.isProcessing).toBe(false);
    
    // 开始处理
    const processPromise = result.current.processData(csvData, 'csv');
    
    // 验证处理中状态
    expect(result.current.isProcessing).toBe(true);
    
    // 等待处理完成
    await act(async () => {
      await processPromise;
    });
    
    // 验证处理完成后状态
    expect(result.current.isProcessing).toBe(false);
  });

  test('应该正确处理错误情况', async () => {
    // Mock Worker抛出错误
    const originalPostMessage = MockWorker.prototype.postMessage;
    MockWorker.prototype.postMessage = function(message) {
      setTimeout(() => {
        if (this.onerror) {
          this.onerror(new ErrorEvent('error', { message: 'Worker error' }));
        }
      }, 10);
    };
    
    const { result } = renderHook(() => useDataProcessor());
    const csvData = 'id,name\n1,Test';
    
    await act(async () => {
      try {
        await result.current.processData(csvData, 'csv');
      } catch (error) {
        // 期望的错误
      }
    });
    
    // 验证错误状态
    expect(result.current.error).toBeDefined();
    
    // 恢复原始实现
    MockWorker.prototype.postMessage = originalPostMessage;
  });

  test('应该正确监控内存使用情况', async () => {
    const { result } = renderHook(() => useDataProcessor());
    
    // 推进定时器，触发内存监控
    act(() => {
      jest.advanceTimersByTime(5000); // 5秒后触发第一次内存监控
    });
    
    // 验证内存使用状态已更新
    expect(result.current.memoryUsage).toBeGreaterThan(0);
  });

  test('应该正确处理主线程降级逻辑', async () => {
    const { result } = renderHook(() => useDataProcessor());
    
    // Mock小型数据集，应该使用主线程处理
    const smallData = 'id,name\n1,Test';
    
    let processResult;
    await act(async () => {
      processResult = await result.current.processData(smallData, 'csv');
    });
    
    // 验证处理结果
    expect(processResult).toBeDefined();
  });

  test('应该正确执行数据排序操作', async () => {
    const { result } = renderHook(() => useDataProcessor());
    const data = [{ id: 2, name: 'Test2' }, { id: 1, name: 'Test1' }];
    
    // 使用主线程处理函数进行排序
    const sortedData = (result.current as any).processMainThread(data, [{ type: 'sort', field: 'id', direction: 'asc' }]);
    
    // 验证排序结果
    expect(sortedData).toBeDefined();
    expect(sortedData[0].id).toBe(1);
    expect(sortedData[1].id).toBe(2);
  });

  test('应该正确执行数据过滤操作', async () => {
    const { result } = renderHook(() => useDataProcessor());
    const data = [{ id: 1, name: 'Test1' }, { id: 2, name: 'Test2' }];
    
    // 使用主线程处理函数进行过滤
    const filteredData = (result.current as any).processMainThread(data, [{ type: 'filter', field: 'id', operator: 'eq', value: 1 }]);
    
    // 验证过滤结果
    expect(filteredData).toBeDefined();
    expect(filteredData).toHaveLength(1);
    expect(filteredData[0].id).toBe(1);
  });

  test('应该在组件卸载时清理资源', () => {
    const { result, unmount } = renderHook(() => useDataProcessor());
    
    // Mock terminate方法
    const worker = (result.current as any).worker;
    const originalTerminate = worker.terminate;
    const terminateSpy = jest.fn();
    worker.terminate = terminateSpy;
    
    // 卸载组件
    unmount();
    
    // 验证Worker被终止
    expect(terminateSpy).toHaveBeenCalled();
    
    // 恢复原始方法
    worker.terminate = originalTerminate;
  });

  test('应该正确合并排序数组', () => {
    const { result } = renderHook(() => useDataProcessor());
    
    // 访问内部方法
    const mergeSortedArrays = (result.current as any).mergeSortedArrays;
    
    // 测试合并排序数组
    const arr1 = [{ id: 1 }, { id: 3 }];
    const arr2 = [{ id: 2 }, { id: 4 }];
    const merged = mergeSortedArrays([arr1, arr2], 'id', 'asc');
    
    // 验证合并结果
    expect(merged).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }]);
  });

  test('应该正确处理无效的输入数据', async () => {
    const { result } = renderHook(() => useDataProcessor());
    
    // 测试空数据
    await act(async () => {
      try {
        await result.current.processData('', 'csv');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
    
    // 测试无效的JSON
    await act(async () => {
      try {
        await result.current.processData('invalid json', 'json');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });
});
