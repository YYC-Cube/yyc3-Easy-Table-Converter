# PerformanceTester 和 TableIntegrator 组件文档

## 目录

- [PerformanceTester组件](#performancetester组件)
  - [组件概述](#组件概述)
  - [安装与引入](#安装与引入)
  - [基础用法](#基础用法)
  - [高级用法](#高级用法)
  - [组件属性](#组件属性)
  - [接口定义](#接口定义)
  - [示例代码](#示例代码)
  - [最佳实践](#最佳实践)
- [TableIntegrator组件](#tableintegrator组件)
  - [组件概述](#组件概述-1)
  - [安装与引入](#安装与引入-1)
  - [基础用法](#基础用法-1)
  - [高级用法](#高级用法-1)
  - [组件属性](#组件属性-1)
  - [接口定义](#接口定义-1)
  - [示例代码](#示例代码-1)
  - [最佳实践](#最佳实践-1)
- [组件集成](#组件集成)
  - [性能测试与集成测试对比](#性能测试与集成测试对比)
  - [工作流程](#工作流程)
  - [常见问题](#常见问题)

## PerformanceTester组件

### 组件概述

**PerformanceTester** 是一个专门用于评估表格组件性能并生成详细性能报告的测试工具组件。该组件可以模拟不同数据量下的表格渲染、数据处理和滚动操作，测量关键性能指标，并提供性能评估和优化建议。

主要功能特点：

- 支持多种预设测试场景（基础性能、虚拟滚动、大数据集）
- 精确测量关键性能指标（渲染时间、内存使用、处理时间、FPS等）
- 自动检测性能问题并提供优化建议
- 支持自定义测试配置
- 可视化测试结果和性能评级
- 集成Web Worker性能评估

### 安装与引入

```tsx
// 引入组件
import { PerformanceTester } from '@/components/PerformanceTester';
```

### 基础用法

最基本的使用方式是直接引入组件并提供必要的回调函数：

```tsx
import React from 'react';
import { PerformanceTester } from '@/components/PerformanceTester';

const MyComponent = () => {
  // 处理测试完成事件
  const handleTestComplete = (results) => {
    console.log('性能测试完成:', results);
    // 可以在这里处理测试结果，如保存到日志或显示在UI中
  };

  // 自定义加载测试数据（可选）
  const handleLoadSampleData = async (size) => {
    // 返回自定义测试数据数组
    return customDataGenerator(size);
  };

  return (
    <div className="container">
      <h1>性能测试工具</h1>
      <PerformanceTester
        onTestComplete={handleTestComplete}
        onLoadSampleData={handleLoadSampleData} // 可选参数
      />
    </div>
  );
};

export default MyComponent;
```

### 高级用法

#### 自定义测试数据

您可以通过 `onLoadSampleData` 回调提供自定义的测试数据，以便更贴近真实业务场景：

```tsx
const loadRealisticData = async (size) => {
  let recordCount = 0;
  
  switch (size) {
    case 'small': recordCount = 500; break;
    case 'medium': recordCount = 2000; break;
    case 'large': recordCount = 10000; break;
    case 'xlarge': recordCount = 50000; break;
  }
  
  // 从API获取数据或生成模拟数据
  // return await fetchFromApi(recordCount);
  
  // 或生成模拟数据
  return Array.from({ length: recordCount }, (_, i) => ({
    id: `item-${i}`,
    // 业务特定字段
    name: `产品 ${i}`,
    category: ['电子产品', '服装', '食品'][i % 3],
    price: 100 + Math.random() * 900,
    stock: Math.floor(Math.random() * 1000),
    // 大字段测试
    description: i % 100 === 0 ? 'X'.repeat(5000) : `产品描述 ${i}`,
  }));
};

// 在组件中使用
<PerformanceTester
  onLoadSampleData={loadRealisticData}
  onTestComplete={processResults}
/>
```

#### 处理测试结果

```tsx
const processResults = (results) => {
  const { testName, metrics, issues, dataSize, recordCount } = results;
  
  // 记录测试结果
  saveTestResults({
    testName,
    timestamp: new Date().toISOString(),
    metrics,
    issues,
    environment: {
      browser: navigator.userAgent,
      device: window.innerWidth < 768 ? 'mobile' : 'desktop',
    }
  });
  
  // 分析性能趋势
  analyzePerformanceTrends(results);
  
  // 如果发现严重问题，发送警报
  if (issues.length > 2 || metrics.dataProcessingTime > 2000) {
    sendPerformanceAlert({
      title: `性能警告: ${testName}`,
      message: `在${dataSize}数据集(${recordCount}条记录)下发现${issues.length}个问题`,
      severity: 'high'
    });
  }
};
```

### 组件属性

| 属性名 | 类型 | 必填 | 默认值 | 描述 |
|-------|-----|------|-------|------|
| onTestComplete | `(results: PerformanceResults) => void` | 否 | - | 测试完成时的回调函数，接收性能测试结果 |
| onLoadSampleData | `(size: TestDataSize) => Promise<any[]>` | 否 | - | 自定义加载测试数据的函数，返回测试数据数组 |

### 接口定义

```typescript
// 测试数据大小类型
export type TestDataSize = 'small' | 'medium' | 'large' | 'xlarge';

// 性能指标接口
export interface PerformanceMetrics {
  renderTime: number;       // 渲染时间(ms)
  memoryUsage: number;      // 内存使用(MB)
  dataProcessingTime: number; // 数据处理时间(ms)
  scrollSmoothness: number;  // 滚动流畅度(%)
  fps: number;              // 帧率
}

// 性能测试结果接口
export interface PerformanceResults {
  testName: string;         // 测试名称
  timestamp: Date;          // 测试时间戳
  dataSize: TestDataSize;   // 数据大小
  recordCount: number;      // 记录数量
  metrics: PerformanceMetrics; // 性能指标
  optimizationApplied: boolean; // 是否应用优化
  workerUsed: boolean;      // 是否使用Worker
  issues: string[];         // 发现的问题列表
}
```

### 示例代码

#### 完整集成示例

```tsx
import React, { useState } from 'react';
import { PerformanceTester } from '@/components/PerformanceTester';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const PerformanceDashboard = () => {
  const [history, setHistory] = useState([]);
  
  const handleTestComplete = (results) => {
    // 保存测试历史
    setHistory(prev => [...prev, {
      ...results,
      metrics: { ...results.metrics }, // 深拷贝
      timestamp: results.timestamp.toISOString()
    }]);
    
    console.log('测试结果:', results);
  };
  
  // 准备图表数据
  const chartData = history.map(result => ({
    name: result.testName,
    处理时间: result.metrics.dataProcessingTime,
    渲染时间: result.metrics.renderTime,
    内存使用: result.metrics.memoryUsage,
    FPS: result.metrics.fps
  }));
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">性能监控中心</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">性能测试工具</h2>
          <PerformanceTester onTestComplete={handleTestComplete} />
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">性能趋势</h2>
          {history.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="处理时间" stroke="#8884d8" />
                <Line type="monotone" dataKey="渲染时间" stroke="#82ca9d" />
                <Line type="monotone" dataKey="内存使用" stroke="#ffc658" />
                <Line type="monotone" dataKey="FPS" stroke="#ff7300" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center text-gray-500 py-12">
              <p>运行测试以查看性能趋势图表</p>
            </div>
          )}
        </div>
      </div>
      
      {/* 最近测试结果详情 */}
      {history.length > 0 && (
        <div className="mt-6 bg-white p-4 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">最近测试结果</h2>
          <div className="space-y-4">
            {history.slice(-3).reverse().map((result, index) => (
              <div key={index} className="border p-4 rounded">
                <div className="flex justify-between items-center">
                  <h3 className="font-medium">{result.testName}</h3>
                  <span className="text-sm text-gray-600">
                    {new Date(result.timestamp).toLocaleString()}
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2 text-sm">
                  <div>数据大小: <strong>{result.dataSize}</strong></div>
                  <div>记录数: <strong>{result.recordCount}</strong></div>
                  <div>处理时间: <strong>{result.metrics.dataProcessingTime.toFixed(2)}ms</strong></div>
                  <div>内存使用: <strong>{result.metrics.memoryUsage.toFixed(2)}MB</strong></div>
                </div>
                {result.issues.length > 0 && (
                  <div className="mt-2 text-sm text-red-600">
                    发现问题: {result.issues.join(', ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceDashboard;
```

### 最佳实践

1. **定期运行性能测试**：在开发周期中定期运行性能测试，建立性能基准和趋势
2. **针对真实数据**：尽可能使用贴近真实业务场景的数据进行测试
3. **关注关键指标**：重点关注数据处理时间、渲染时间和内存使用
4. **优化决策依据**：使用测试结果作为优化决策的客观依据
5. **持续监控**：在生产环境中也可以集成轻量级性能监控

## TableIntegrator组件

### 组件概述

**TableIntegrator** 是一个强大的表格功能集成测试组件，它整合了所有表格相关的优化功能，提供端到端的集成测试环境。该组件可以同时测试数据优化、性能表现和集成效果，帮助开发者全面评估表格在各种场景下的表现。

主要功能特点：

- 提供统一的数据管理、优化、性能测试和集成测试界面
- 支持多种数据大小的测试场景
- 集成DataOptimizer和PerformanceTester组件
- 提供完整的表格渲染预览
- 支持虚拟滚动和数据优化的配置
- 模拟真实用户操作序列
- 全面的错误边界和错误处理

### 安装与引入

```tsx
// 引入组件
import { TableIntegrator } from '@/components/TableIntegrator';
```

### 基础用法

最基本的使用方式是直接引入组件并提供表格组件：

```tsx
import React from 'react';
import { TableIntegrator } from '@/components/TableIntegrator';
import { MyTableComponent } from './MyTableComponent'; // 您的表格组件

const TableTestEnvironment = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">表格集成测试环境</h1>
      <TableIntegrator
        tableComponent={MyTableComponent}
        enableAutoOptimization={true}
        enableVirtualScroll={true}
      />
    </div>
  );
};

export default TableTestEnvironment;
```

### 高级用法

#### 提供初始数据

您可以通过 `initialData` 属性提供初始测试数据：

```tsx
import React from 'react';
import { TableIntegrator } from '@/components/TableIntegrator';
import { MyTableComponent } from './MyTableComponent';

// 准备初始数据
const initialData = [
  { id: '1', name: '测试项目1', value: 100, status: 'active' },
  { id: '2', name: '测试项目2', value: 200, status: 'pending' },
  { id: '3', name: '测试项目3', value: 300, status: 'completed' },
  // 更多初始数据...
];

const TableTestWithInitialData = () => {
  return (
    <TableIntegrator
      tableComponent={MyTableComponent}
      initialData={initialData}
      enableAutoOptimization={true}
      enableVirtualScroll={true}
    />
  );
};
```

#### 自定义表格组件集成

确保您的表格组件与TableIntegrator正确集成：

```tsx
// 确保您的表格组件接受这些props
interface MyTableComponentProps {
  data: any[];
  enableVirtualScroll?: boolean;
  enableOptimizations?: boolean;
  // 其他自定义props
}

export const MyTableComponent: React.FC<MyTableComponentProps> = ({
  data,
  enableVirtualScroll = false,
  enableOptimizations = false,
  // 其他props
}) => {
  // 根据props调整表格行为
  const tableConfig = {
    virtualized: enableVirtualScroll,
    optimized: enableOptimizations,
    // 其他配置
  };
  
  return (
    <div className="my-table">
      {/* 表格实现 */}
    </div>
  );
};
```

### 组件属性

| 属性名 | 类型 | 必填 | 默认值 | 描述 |
|-------|-----|------|-------|------|
| tableComponent | `React.ComponentType<any>` | 否 | - | 要测试的表格组件 |
| initialData | `any[]` | 否 | `[]` | 初始测试数据 |
| enableAutoOptimization | `boolean` | 否 | `true` | 是否启用自动数据优化 |
| enableVirtualScroll | `boolean` | 否 | `true` | 是否启用虚拟滚动 |

### 接口定义

```typescript
// 集成测试配置接口
export interface IntegrationTestConfig {
  testName: string;               // 测试名称
  dataSize: 'small' | 'medium' | 'large' | 'xlarge'; // 数据大小
  enableVirtualScroll: boolean;   // 是否启用虚拟滚动
  enableOptimizations: boolean;   // 是否启用优化
  enableWorker: boolean;          // 是否启用Worker
  simulateRealWorld?: boolean;    // 是否模拟真实用户操作
}
```

### 示例代码

#### 完整集成测试环境

```tsx
import React, { useState } from 'react';
import { TableIntegrator } from '@/components/TableIntegrator';
import { MyAdvancedTable } from './MyAdvancedTable';
import { useToast } from '@/hooks/use-toast';
import { TestReportViewer } from './TestReportViewer';

const AdvancedTestingEnvironment = () => {
  const { toast } = useToast();
  const [testReports, setTestReports] = useState([]);
  const [showReports, setShowReports] = useState(false);
  
  // 创建自定义表格组件适配器
  const CustomTableAdapter = ({ data, enableVirtualScroll, enableOptimizations }) => {
    // 配置表格选项
    const tableOptions = {
      enableVirtualization: enableVirtualScroll,
      enableDataOptimization: enableOptimizations,
      rowHeight: 48,
      overscanCount: 10,
      // 其他表格配置
    };
    
    return (
      <div className="custom-table-container">
        <div className="table-controls mb-4">
          <span className="text-sm text-gray-600">
            配置: {enableVirtualScroll ? '虚拟滚动' : '常规滚动'} | 
            {enableOptimizations ? '已优化' : '未优化'}
          </span>
        </div>
        <MyAdvancedTable 
          data={data} 
          options={tableOptions}
        />
      </div>
    );
  };
  
  // 处理报告生成
  const handleTestRun = async () => {
    try {
      // 可以在这里添加前置处理
      toast({ title: '测试环境已准备就绪' });
    } catch (error) {
      toast({ 
        title: '准备失败', 
        description: error.message, 
        variant: 'destructive' 
      });
    }
  };
  
  // 导出测试数据
  const exportTestData = (size) => {
    // 导出逻辑
    toast({ title: `正在导出${size}测试数据` });
  };
  
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <header className="mb-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-800">高级表格集成测试环境</h1>
          <div className="flex gap-4">
            <button 
              onClick={handleTestRun}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              运行全部测试
            </button>
            <button 
              onClick={() => setShowReports(!showReports)}
              className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
            >
              {showReports ? '隐藏报告' : '查看报告'}
            </button>
          </div>
        </div>
        <p className="text-gray-600 mt-2">
          全面测试表格性能、数据优化和集成效果的专业环境
        </p>
      </header>
      
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <TableIntegrator
            tableComponent={CustomTableAdapter}
            enableAutoOptimization={true}
            enableVirtualScroll={true}
          />
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">测试辅助工具</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">导出测试数据</h3>
              <div className="grid grid-cols-2 gap-2">
                {['small', 'medium', 'large', 'xlarge'].map(size => (
                  <button
                    key={size}
                    onClick={() => exportTestData(size)}
                    className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm"
                  >
                    导出{size}数据
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="font-medium mb-2">测试配置</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span>默认启用虚拟滚动</span>
                  <span className="text-green-600">✓</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>默认启用数据优化</span>
                  <span className="text-green-600">✓</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>错误边界保护</span>
                  <span className="text-green-600">✓</span>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-blue-50 rounded text-sm">
              <div className="font-medium text-blue-800 mb-1">使用提示</div>
              <ul className="list-disc pl-4 text-blue-700 space-y-1">
                <li>使用"数据管理"标签页加载测试数据</li>
                <li>在"数据优化"中应用优化规则</li>
                <li>通过"性能测试"评估性能指标</li>
                <li>使用"集成测试"进行端到端测试</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      
      {showReports && (
        <div className="mt-6 bg-white p-6 rounded-lg shadow">
          <TestReportViewer reports={testReports} />
        </div>
      )}
    </div>
  );
};

export default AdvancedTestingEnvironment;
```

### 最佳实践

1. **完整测试流程**：按照数据管理 → 数据优化 → 性能测试 → 集成测试的顺序进行完整测试
2. **多场景测试**：在不同数据大小下测试表格表现，特别是大数据集
3. **真实操作模拟**：启用真实操作模拟以测试用户交互性能
4. **边界测试**：测试各种极端情况下的表格表现
5. **对比分析**：对比优化前后的性能差异，量化优化效果

## 组件集成

### 性能测试与集成测试对比

| 特性 | PerformanceTester | TableIntegrator |
|------|-----------------|----------------|
| 主要功能 | 专注于性能指标测量 | 提供端到端集成测试 |
| 适用场景 | 单一性能指标评估 | 全面功能与性能验证 |
| 数据管理 | 内置测试数据生成 | 提供完整数据管理功能 |
| 优化功能 | 基础优化测试 | 完整的数据优化配置 |
| 测试配置 | 预设性能测试 | 多种集成测试场景 |
| UI界面 | 简洁的性能测试界面 | 多标签页综合环境 |

### 工作流程

1. **初始设置**：
   - 在TableIntegrator中加载测试数据
   - 配置表格组件和基本选项

2. **数据准备**：
   - 分析数据特征
   - 应用必要的数据优化

3. **性能评估**：
   - 在TableIntegrator的性能测试标签页运行测试
   - 或单独使用PerformanceTester进行深入性能分析

4. **集成测试**：
   - 在TableIntegrator中运行集成测试
   - 评估端到端功能和性能

5. **结果分析**：
   - 分析测试报告
   - 根据性能指标和优化建议进行改进

### 常见问题

1. **内存使用过高**
   - 原因：大数据集未启用虚拟滚动或数据优化
   - 解决：启用虚拟滚动和数据优化选项

2. **性能测试不准确**
   - 原因：浏览器缓存或后台进程影响
   - 解决：在无痕模式下运行测试，关闭其他应用

3. **表格组件不显示**
   - 原因：TableIntegrator的tableComponent属性未设置或组件接口不匹配
   - 解决：确保提供正确的表格组件并符合接口要求

4. **测试运行失败**
   - 原因：数据格式错误或组件异常
   - 解决：检查控制台错误，确保数据格式正确，修复组件问题

5. **优化效果不明显**
   - 原因：测试数据过于简单或优化配置不适合
   - 解决：使用更复杂的测试数据，调整优化配置参数

---

以上就是PerformanceTester和TableIntegrator组件的详细文档，通过这些组件，您可以全面测试和优化表格性能，确保在各种场景下都能提供流畅的用户体验。 🌹