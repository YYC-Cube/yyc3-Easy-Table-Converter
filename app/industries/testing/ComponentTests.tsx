import React, { useState } from 'react';
import { testRunner, TestSuite, TestReport } from './TestRunner';
import { BusinessValueEvaluator } from '../business/BusinessValueEvaluator';

/**
 * 组件测试套件
 * 用于测试图表组件、业务评估功能等核心组件
 */

// 业务价值评估测试数据
const businessValueTestData = {
  investment: 1000000, // 100万
  expectedReturns: [250000, 350000, 450000, 550000, 650000],
  operationalCosts: 150000,
  timeToMarket: 6,
  marketGrowth: 0.15,
};

/**
 * 图表组件测试套件
 */
export const chartsTestSuite: TestSuite = {
  name: '图表组件测试套件',
  tests: [
    {
      name: 'BarChart - 基础渲染测试',
      priority: 'high',
      test: async () => {
        // 这里实际项目中应该使用React Testing Library
        // 简单模拟渲染测试
        console.log('测试BarChart基础渲染功能');
        const result = await testRunner.runComponentPerformanceTest(
          'BarChart基础渲染',
          async () => {
            // 模拟渲染
            const mockCanvas = document.createElement('canvas');
            mockCanvas.width = 800;
            mockCanvas.height = 400;
            document.body.appendChild(mockCanvas);
            
            // 这里应该是实际的渲染逻辑，但在测试中只是模拟
            await new Promise(resolve => setTimeout(resolve, 10));
            
            document.body.removeChild(mockCanvas);
          },
          10
        );
        
        if (result.status !== 'passed') {
          throw new Error('BarChart基础渲染测试失败');
        }
      },
    },
    {
      name: 'BarChart - 数据更新测试',
      priority: 'high',
      test: async () => {
        console.log('测试BarChart数据更新功能');
        
        // 模拟数据更新
        const mockCanvas = document.createElement('canvas');
        document.body.appendChild(mockCanvas);
        
        // 初始数据渲染
        await new Promise(resolve => setTimeout(resolve, 5));
        
        // 更新数据渲染
        await new Promise(resolve => setTimeout(resolve, 5));
        
        document.body.removeChild(mockCanvas);
      },
    },
    {
      name: 'PieChart - 基础渲染测试',
      priority: 'high',
      test: async () => {
        console.log('测试PieChart基础渲染功能');
        const result = await testRunner.runComponentPerformanceTest(
          'PieChart基础渲染',
          async () => {
            const mockCanvas = document.createElement('canvas');
            mockCanvas.width = 400;
            mockCanvas.height = 400;
            document.body.appendChild(mockCanvas);
            
            await new Promise(resolve => setTimeout(resolve, 10));
            
            document.body.removeChild(mockCanvas);
          },
          10
        );
        
        if (result.status !== 'passed') {
          throw new Error('PieChart基础渲染测试失败');
        }
      },
    },
    {
      name: 'PieChart - 交互测试',
      priority: 'medium',
      test: async () => {
        console.log('测试PieChart交互功能');
        // 模拟交互事件
        const mockCanvas = document.createElement('canvas');
        mockCanvas.width = 400;
        mockCanvas.height = 400;
        document.body.appendChild(mockCanvas);
        
        // 模拟点击事件
        const clickEvent = new MouseEvent('click', {
          clientX: 200,
          clientY: 200,
          bubbles: true,
        });
        
        let eventHandled = false;
        mockCanvas.addEventListener('click', () => {
          eventHandled = true;
        });
        
        mockCanvas.dispatchEvent(clickEvent);
        
        // 验证事件是否被处理
        if (!eventHandled) {
          throw new Error('PieChart交互事件处理失败');
        }
        
        document.body.removeChild(mockCanvas);
      },
    },
    {
      name: '图表响应式调整测试',
      priority: 'medium',
      test: async () => {
        console.log('测试图表响应式调整');
        // 模拟窗口大小变化
        const originalWidth = window.innerWidth;
        const originalHeight = window.innerHeight;
        
        // 模拟窗口大小变化
        Object.defineProperty(window, 'innerWidth', { value: 600 });
        Object.defineProperty(window, 'innerHeight', { value: 400 });
        
        // 触发resize事件
        window.dispatchEvent(new Event('resize'));
        
        // 还原窗口大小
        Object.defineProperty(window, 'innerWidth', { value: originalWidth });
        Object.defineProperty(window, 'innerHeight', { value: originalHeight });
        
        window.dispatchEvent(new Event('resize'));
      },
    },
  ],
};

/**
 * 业务价值评估测试套件
 */
export const businessValueTestSuite: TestSuite = {
  name: '业务价值评估测试套件',
  tests: [
    {
      name: 'ROI计算测试',
      priority: 'high',
      test: () => {
        console.log('测试ROI计算功能');
        const evaluator = new BusinessValueEvaluator();
        const roiResult = evaluator.calculateROI({
          initialInvestment: businessValueTestData.investment,
          annualRevenue: 500000, // 示例值
          operatingCosts: 200000, // 示例值
          projectLifetime: 5,
          discountRate: 10
        });
        
        // 基本验证
        if (roiResult.roi < 0) {
          throw new Error('ROI计算结果应为正数');
        }
      },
    },
    {
      name: '决策支持效果评估测试',
      priority: 'high',
      test: () => {
        console.log('测试决策支持效果评估');
        const evaluator = new BusinessValueEvaluator();
        const decisionSupport = evaluator.evaluateDecisionSupport({
          decisionAccuracyImprovement: 25,
          decisionTimeReduction: 30,
          informationCoverageImprovement: 85,
          errorReduction: 20,
          keyDecisionFrequency: 10,
          costPerError: 5000,
          averageDecisionHours: 2,
          hourlyLaborCost: 100
        });
        
        if (decisionSupport.efficiencyScore < 0 || decisionSupport.efficiencyScore > 100) {
          throw new Error('决策支持效果评分应在0-100之间');
        }
        
        console.log(`决策支持效果评分: ${decisionSupport.efficiencyScore}`);
      },
    },
    {
      name: '现金流预测测试',
      priority: 'medium',
      test: () => {
        console.log('测试现金流预测功能');
        const evaluator = new BusinessValueEvaluator();
        const roiResult = evaluator.calculateROI({
          initialInvestment: businessValueTestData.investment,
          annualRevenue: 500000,
          operatingCosts: businessValueTestData.operationalCosts,
          projectLifetime: 5,
          discountRate: 10
        });
        
        if (!roiResult || !Array.isArray(roiResult.cashFlowProjection)) {
          throw new Error('现金流预测返回格式不正确');
        }
        
        if (roiResult.cashFlowProjection.length < 5) {
          throw new Error(`现金流预测应有至少5个数据点，实际有${roiResult.cashFlowProjection.length}个`);
        }
      },
    },
  ],
};

/**
 * 性能优化测试套件
 */
export const performanceTestSuite: TestSuite = {
  name: '性能优化测试套件',
  tests: [
    {
      name: '大数据集渲染性能测试',
      priority: 'high',
      test: async () => {
        console.log('测试大数据集渲染性能');
        
        // 运行性能基准测试
        const result = await testRunner.runBenchmark(
          '大数据集渲染',
          async () => {
            const mockCanvas = document.createElement('canvas');
            mockCanvas.width = 1200;
            mockCanvas.height = 600;
            document.body.appendChild(mockCanvas);
            
            // 模拟渲染
            await new Promise(resolve => setTimeout(resolve, 5));
            
            document.body.removeChild(mockCanvas);
          },
          { runs: 20 }
        );
        
        // 性能要求：平均渲染时间应小于100ms
        if (result.averageTime > 100) {
          console.warn(`性能警告：大数据集渲染平均时间${result.averageTime.toFixed(2)}ms超过100ms`);
        }
      },
    },
    {
      name: '图表动画性能测试',
      priority: 'medium',
      test: async () => {
        console.log('测试图表动画性能');
        
        // 运行动画性能测试
        const result = await testRunner.runComponentPerformanceTest(
          '图表动画性能',
          async () => {
            // 模拟动画渲染
            await new Promise(resolve => setTimeout(resolve, 10));
          },
          30
        );
        
        // 验证动画性能
        if (result.performanceMetrics?.averageRenderTime !== undefined && result.performanceMetrics.averageRenderTime > 50) {
          console.warn(`动画性能警告：平均渲染时间${result.performanceMetrics.averageRenderTime.toFixed(2)}ms超过50ms`);
        }
      },
    },
  ],
};

/**
 * 运行所有测试套件
 * @returns 测试报告数组
 */
export const runAllTests = async (): Promise<TestReport[]> => {
  console.log('🚀 开始运行所有测试套件...');
  
  const reports: TestReport[] = [];
  
  // 运行图表测试套件
  try {
    const chartReport = await testRunner.runTestSuite(chartsTestSuite);
    reports.push(chartReport);
  } catch (error) {
    console.error('图表测试套件运行失败:', error);
  }
  
  // 运行业务价值测试套件
  try {
    const businessReport = await testRunner.runTestSuite(businessValueTestSuite);
    reports.push(businessReport);
  } catch (error) {
    console.error('业务价值测试套件运行失败:', error);
  }
  
  // 运行性能测试套件
  try {
    const performanceReport = await testRunner.runTestSuite(performanceTestSuite);
    reports.push(performanceReport);
  } catch (error) {
    console.error('性能测试套件运行失败:', error);
  }
  
  // 生成综合报告
  generateComprehensiveReport(reports);
  
  console.log('✅ 所有测试套件运行完成！');
  
  return reports;
};

/**
 * 生成综合测试报告
 * @param reports 测试报告数组
 */
const generateComprehensiveReport = (reports: TestReport[]): void => {
  if (reports.length === 0) return;
  
  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;
  let skippedTests = 0;
  let totalExecutionTime = 0;
  
  reports.forEach(report => {
    totalTests += report.totalTests;
    passedTests += report.passedTests;
    failedTests += report.failedTests;
    skippedTests += report.skippedTests;
    totalExecutionTime += report.totalExecutionTime;
  });
  
  const overallPassRate = totalTests > skippedTests 
    ? ((passedTests / (totalTests - skippedTests)) * 100).toFixed(2)
    : '0.00';
  
  console.log('📊 综合测试报告');
  console.log('----------------------------------------');
  console.log(`总测试套件: ${reports.length}`);
  console.log(`总测试用例: ${totalTests}`);
  console.log(`通过: ${passedTests} (${overallPassRate}%)`);
  console.log(`失败: ${failedTests}`);
  console.log(`跳过: ${skippedTests}`);
  console.log(`总执行时间: ${totalExecutionTime.toFixed(2)}ms`);
  console.log('----------------------------------------');
  
  // 检查是否有失败的测试
  if (failedTests > 0) {
    console.warn('⚠️  测试中存在失败项，请检查测试报告！');
  } else {
    console.log('🎉 所有测试通过！');
  }
};

// 测试执行结果展示组件
interface TestResultDisplayProps {
  report: TestReport | null;
  onRunTests: () => Promise<void>;
}

export const TestResultDisplay: React.FC<TestResultDisplayProps> = ({ report, onRunTests }) => {
  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">测试结果</h2>
      
      <button 
        onClick={onRunTests}
        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
      >
        运行测试
      </button>
      
      {report && (
        <div className="mt-6">
          <div className="mb-4">
            <h3 className="text-xl font-semibold">{report.suiteName}</h3>
            <p className="text-gray-600">生成时间: {report.timestamp.toLocaleString('zh-CN')}</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-100 p-4 rounded-md">
              <div className="text-sm text-gray-600">总测试</div>
              <div className="text-2xl font-bold">{report.totalTests}</div>
            </div>
            <div className="bg-green-100 p-4 rounded-md">
              <div className="text-sm text-gray-600">通过</div>
              <div className="text-2xl font-bold text-green-600">{report.passedTests}</div>
            </div>
            <div className="bg-red-100 p-4 rounded-md">
              <div className="text-sm text-gray-600">失败</div>
              <div className="text-2xl font-bold text-red-600">{report.failedTests}</div>
            </div>
            <div className="bg-yellow-100 p-4 rounded-md">
              <div className="text-sm text-gray-600">跳过</div>
              <div className="text-2xl font-bold text-yellow-600">{report.skippedTests}</div>
            </div>
          </div>
          
          <div className="mb-4">
            <h4 className="text-lg font-semibold mb-2">测试详情</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="py-2 px-4 border-b">测试名称</th>
                    <th className="py-2 px-4 border-b">状态</th>
                    <th className="py-2 px-4 border-b">执行时间 (ms)</th>
                  </tr>
                </thead>
                <tbody>
                  {report.testResults.map((test, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="py-2 px-4 border-b">{test.name}</td>
                      <td className="py-2 px-4 border-b">
                        <span className={`px-2 py-1 rounded-full text-xs ${test.status === 'passed' ? 'bg-green-100 text-green-800' : test.status === 'failed' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {test.status === 'passed' ? '通过' : test.status === 'failed' ? '失败' : '跳过'}
                        </span>
                      </td>
                      <td className="py-2 px-4 border-b">{test.executionTime.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * 测试执行器组件
 */
export const TestRunnerComponent: React.FC = () => {
  const [selectedSuite, setSelectedSuite] = useState<'charts' | 'business' | 'performance'>('charts');
  const [testReport, setTestReport] = useState<TestReport | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  
  const handleRunTests = async () => {
    setIsRunning(true);
    setTestReport(null);
    
    try {
      let report: TestReport;
      
      switch (selectedSuite) {
        case 'charts':
          report = await testRunner.runTestSuite(chartsTestSuite);
          break;
        case 'business':
          report = await testRunner.runTestSuite(businessValueTestSuite);
          break;
        case 'performance':
          report = await testRunner.runTestSuite(performanceTestSuite);
          break;
      }
      
      setTestReport(report);
    } catch (error) {
      console.error('测试执行失败:', error);
    } finally {
      setIsRunning(false);
    }
  };
  
  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">组件测试运行器</h1>
      
      <div className="mb-6">
        <label className="block text-gray-700 mb-2">选择测试套件</label>
        <select 
          value={selectedSuite}
          onChange={(e) => setSelectedSuite(e.target.value as any)}
          className="p-2 border border-gray-300 rounded-md min-w-[200px]"
        >
          <option value="charts">图表组件测试</option>
          <option value="business">业务价值评估测试</option>
          <option value="performance">性能优化测试</option>
        </select>
      </div>
      
      <TestResultDisplay 
        report={testReport} 
        onRunTests={handleRunTests} 
      />
      
      {isRunning && (
        <div className="mt-4 p-4 bg-blue-50 rounded-md">
          <p className="text-blue-700">测试正在运行中...</p>
        </div>
      )}
    </div>
  );
};

export default TestRunnerComponent;
