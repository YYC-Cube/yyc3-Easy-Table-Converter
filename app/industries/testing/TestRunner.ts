/**
 * @file 测试运行器
 * @description 提供统一的测试执行、报告生成和性能基准测试功能
 * @module testing
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-20
 */


/**
 * 测试结果接口
 */
export interface TestResult {
  /** 测试名称 */
  name: string;
  /** 测试状态 */
  status: 'passed' | 'failed' | 'skipped';
  /** 执行时间（毫秒） */
  executionTime: number;
  /** 错误信息（如果有） */
  error?: string;
  /** 性能指标（如果有） */
  performanceMetrics?: Record<string, number>;
}

/**
 * 测试套件接口
 */
export interface TestSuite {
  /** 套件名称 */
  name: string;
  /** 测试用例列表 */
  tests: TestCase[];
  /** 套件设置函数 */
  setup?: () => Promise<void>;
  /** 套件清理函数 */
  teardown?: () => Promise<void>;
}

/**
 * 测试用例接口
 */
export interface TestCase {
  /** 测试名称 */
  name: string;
  /** 测试函数 */
  test: () => Promise<void> | void;
  /** 测试优先级 */
  priority?: 'high' | 'medium' | 'low';
  /** 是否跳过 */
  skipped?: boolean;
}

/**
 * 测试报告接口
 */
export interface TestReport {
  /** 测试套件名称 */
  suiteName: string;
  /** 测试总数 */
  totalTests: number;
  /** 通过测试数 */
  passedTests: number;
  /** 失败测试数 */
  failedTests: number;
  /** 跳过测试数 */
  skippedTests: number;
  /** 总执行时间（毫秒） */
  totalExecutionTime: number;
  /** 测试结果列表 */
  testResults: TestResult[];
  /** 性能报告（如果有） */
  performanceReport?: {
    /** 平均执行时间 */
    averageExecutionTime: number;
    /** 最慢测试 */
    slowestTest: { name: string; executionTime: number };
    /** 最快测试 */
    fastestTest: { name: string; executionTime: number };
  };
  /** 执行时间 */
  timestamp: Date;
}

/**
 * 基准测试配置接口
 */
export interface BenchmarkConfig {
  /** 运行次数 */
  runs?: number;
  /** 预热次数 */
  warmupRuns?: number;
  /** 超时时间（毫秒） */
  timeout?: number;
}

/**
 * 基准测试结果接口
 */
export interface BenchmarkResult {
  /** 测试名称 */
  name: string;
  /** 平均执行时间（毫秒） */
  averageTime: number;
  /** 最小执行时间（毫秒） */
  minTime: number;
  /** 最大执行时间（毫秒） */
  maxTime: number;
  /** 中位数执行时间（毫秒） */
  medianTime: number;
  /** 标准差 */
  standardDeviation: number;
  /** 执行次数 */
  runs: number;
  /** 所有运行的时间 */
  allRuns: number[];
}

/**
 * 测试运行器类
 * 提供统一的测试执行、性能基准测试和报告生成功能
 */
export class TestRunner {
  private static instance: TestRunner;

  /**
   * 私有构造函数
   */
  private constructor() {
  }

  /**
   * 获取单例实例
   */
  public static getInstance(): TestRunner {
    if (!TestRunner.instance) {
      TestRunner.instance = new TestRunner();
    }
    return TestRunner.instance;
  }

  /**
   * 运行测试套件
   * @param suite 测试套件
   * @returns 测试报告
   */
  public async runTestSuite(suite: TestSuite): Promise<TestReport> {
    console.log(`开始运行测试套件: ${suite.name}`);
    const startTime = performance.now();
    const testResults: TestResult[] = [];
    let passedTests = 0;
    let failedTests = 0;
    let skippedTests = 0;

    try {
      // 执行套件设置
      if (suite.setup) {
        console.log(`  执行套件设置...`);
        await suite.setup();
      }

      // 执行每个测试用例
      for (const testCase of suite.tests) {
        const testResult = await this.runTestCase(testCase);
        testResults.push(testResult);

        switch (testResult.status) {
          case 'passed':
            passedTests++;
            break;
          case 'failed':
            failedTests++;
            break;
          case 'skipped':
            skippedTests++;
            break;
        }
      }
    } catch (error) {
      console.error(`套件执行失败: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      // 执行套件清理
      if (suite.teardown) {
        console.log(`  执行套件清理...`);
        try {
          await suite.teardown();
        } catch (error) {
          console.error(`套件清理失败: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    }

    const totalExecutionTime = performance.now() - startTime;
    const report = this.generateTestReport(suite.name, testResults, totalExecutionTime);
    
    console.log(`测试套件执行完成: ${suite.name}`);
    console.log(`  通过: ${passedTests}, 失败: ${failedTests}, 跳过: ${skippedTests}, 总时间: ${totalExecutionTime.toFixed(2)}ms`);
    
    return report;
  }

  /**
   * 运行单个测试用例
   * @param testCase 测试用例
   * @returns 测试结果
   */
  private async runTestCase(testCase: TestCase): Promise<TestResult> {
    const result: TestResult = {
      name: testCase.name,
      status: 'skipped',
      executionTime: 0
    };

    // 检查是否跳过测试
    if (testCase.skipped) {
      console.log(`  ⏭️  跳过测试: ${testCase.name}`);
      return result;
    }

    console.log(`  运行测试: ${testCase.name}${testCase.priority ? ` [${testCase.priority}]` : ''}`);
    const startTime = performance.now();

    try {
      // 执行测试
      await testCase.test();
      
      // 测试通过
      result.status = 'passed';
      result.executionTime = performance.now() - startTime;
      console.log(`  ✅  测试通过: ${testCase.name} (${result.executionTime.toFixed(2)}ms)`);
    } catch (error) {
      // 测试失败
      result.status = 'failed';
      result.executionTime = performance.now() - startTime;
      result.error = error instanceof Error ? error.message : String(error);
      console.error(`  ❌  测试失败: ${testCase.name} (${result.executionTime.toFixed(2)}ms)`);
      console.error(`     错误: ${result.error}`);
    }

    return result;
  }

  /**
   * 生成测试报告
   * @param suiteName 套件名称
   * @param testResults 测试结果列表
   * @param totalExecutionTime 总执行时间
   * @returns 测试报告
   */
  private generateTestReport(suiteName: string, testResults: TestResult[], totalExecutionTime: number): TestReport {
    const passedTests = testResults.filter(r => r.status === 'passed').length;
    const failedTests = testResults.filter(r => r.status === 'failed').length;
    const skippedTests = testResults.filter(r => r.status === 'skipped').length;
    
    // 计算性能统计数据
    const executedTests = testResults.filter(r => r.status !== 'skipped');
    
    const baseReport = {
      suiteName,
      totalTests: testResults.length,
      passedTests,
      failedTests,
      skippedTests,
      totalExecutionTime,
      testResults,
      timestamp: new Date()
    };
    
    if (executedTests.length > 0) {
      return {
        ...baseReport,
        performanceReport: {
          averageExecutionTime: executedTests.map(r => r.executionTime).reduce((sum, time) => sum + time, 0) / executedTests.length,
          slowestTest: {
            name: executedTests[executedTests.map(r => r.executionTime).indexOf(Math.max(...executedTests.map(r => r.executionTime)))].name,
            executionTime: Math.max(...executedTests.map(r => r.executionTime))
          },
          fastestTest: {
            name: executedTests[executedTests.map(r => r.executionTime).indexOf(Math.min(...executedTests.map(r => r.executionTime)))].name,
            executionTime: Math.min(...executedTests.map(r => r.executionTime))
          }
        }
      };
    }
    
    return baseReport;
  }

  /**
   * 运行性能基准测试
   * @param name 基准测试名称
   * @param func 测试函数
   * @param config 配置选项
   * @returns 基准测试结果
   */
  public async runBenchmark(name: string, func: () => Promise<void> | void, config?: BenchmarkConfig): Promise<BenchmarkResult> {
    const defaultConfig: BenchmarkConfig = {
      runs: 100,
      warmupRuns: 10,
      timeout: 30000
    };
    
    const mergedConfig = { ...defaultConfig, ...config } as Required<BenchmarkConfig>;
    console.log(`运行基准测试: ${name} (${mergedConfig.runs}次运行)`);
    
    const results: number[] = [];
    
    // 预热运行
    console.log(`  预热中... (${mergedConfig.warmupRuns}次)`);
    for (let i = 0; i < mergedConfig.warmupRuns; i++) {
      await func();
    }
    
    // 实际运行
    console.log(`  执行测试...`);
    for (let i = 0; i < mergedConfig.runs; i++) {
      const startTime = performance.now();
      await func();
      const endTime = performance.now();
      results.push(endTime - startTime);
      
      // 显示进度
      if ((i + 1) % 10 === 0) {
        console.log(`    ${i + 1}/${mergedConfig.runs}次运行完成`);
      }
    }
    
    // 计算统计信息
    const sortedResults = [...results].sort((a, b) => a - b);
    const sum = results.reduce((acc, val) => acc + val, 0);
    const average = sum / results.length;
    const min = Math.min(...results);
    const max = Math.max(...results);
    
    // 计算中位数
    let median: number;
    const middle = Math.floor(results.length / 2);
    if (results.length % 2 === 0) {
      median = (sortedResults[middle - 1] + sortedResults[middle]) / 2;
    } else {
      median = sortedResults[middle];
    }
    
    // 计算标准差
    const squaredDifferences = results.map(val => Math.pow(val - average, 2));
    const variance = squaredDifferences.reduce((acc, val) => acc + val, 0) / results.length;
    const standardDeviation = Math.sqrt(variance);
    
    const benchmarkResult: BenchmarkResult = {
      name,
      averageTime: average,
      minTime: min,
      maxTime: max,
      medianTime: median,
      standardDeviation,
      runs: mergedConfig.runs,
      allRuns: results
    };
    
    // 输出结果
    console.log(`基准测试结果: ${name}`);
    console.log(`  平均时间: ${average.toFixed(3)}ms`);
    console.log(`  最小时间: ${min.toFixed(3)}ms`);
    console.log(`  最大时间: ${max.toFixed(3)}ms`);
    console.log(`  中位数时间: ${median.toFixed(3)}ms`);
    console.log(`  标准差: ${standardDeviation.toFixed(3)}ms`);
    
    return benchmarkResult;
  }

  /**
   * 运行组件性能测试
   * @param componentName 组件名称
   * @param renderFunction 渲染函数
   * @param iterations 迭代次数
   * @returns 性能测试结果
   */
  public async runComponentPerformanceTest(
    componentName: string,
    renderFunction: () => Promise<void> | void,
    iterations: number = 50
  ): Promise<TestResult> {
    console.log(`运行组件性能测试: ${componentName} (${iterations}次渲染)`);
    
    const result: TestResult = {
      name: componentName,
      status: 'passed',
      executionTime: 0,
      performanceMetrics: {
        averageRenderTime: 0,
        minRenderTime: Infinity,
        maxRenderTime: 0,
        totalRenderTime: 0
      }
    };
    
    const renderTimes: number[] = [];
    
    try {
      // 预热
      for (let i = 0; i < 5; i++) {
        await renderFunction();
      }
      
      // 实际测试
      for (let i = 0; i < iterations; i++) {
        const startTime = performance.now();
        await renderFunction();
        const renderTime = performance.now() - startTime;
        
        renderTimes.push(renderTime);
        
        if (renderTime < result.performanceMetrics!.minRenderTime) {
          result.performanceMetrics!.minRenderTime = renderTime;
        }
        if (renderTime > result.performanceMetrics!.maxRenderTime) {
          result.performanceMetrics!.maxRenderTime = renderTime;
        }
      }
      
      // 计算统计信息
      const totalTime = renderTimes.reduce((sum, time) => sum + time, 0);
      result.performanceMetrics!.totalRenderTime = totalTime;
      result.performanceMetrics!.averageRenderTime = totalTime / iterations;
      result.executionTime = totalTime;
      
      console.log(`组件性能测试完成: ${componentName}`);
      console.log(`  平均渲染时间: ${result.performanceMetrics!.averageRenderTime.toFixed(3)}ms`);
      console.log(`  最小渲染时间: ${result.performanceMetrics!.minRenderTime.toFixed(3)}ms`);
      console.log(`  最大渲染时间: ${result.performanceMetrics!.maxRenderTime.toFixed(3)}ms`);
      console.log(`  总渲染时间: ${result.performanceMetrics!.totalRenderTime.toFixed(2)}ms`);
    } catch (error) {
      result.status = 'failed';
      result.error = error instanceof Error ? error.message : String(error);
      console.error(`组件性能测试失败: ${componentName}`);
      console.error(`  错误: ${result.error}`);
    }
    
    return result;
  }

  /**
   * 比较性能优化前后的差异
   * @param testName 测试名称
   * @param originalFunction 原始函数
   * @param optimizedFunction 优化后函数
   * @param iterations 迭代次数
   */
  public async comparePerformance(
    testName: string,
    originalFunction: () => Promise<void> | void,
    optimizedFunction: () => Promise<void> | void,
    iterations: number = 100
  ): Promise<void> {
    console.log(`比较性能: ${testName}`);
    
    // 测量原始函数性能
    console.log(`  测量原始函数性能...`);
    const originalStartTime = performance.now();
    for (let i = 0; i < iterations; i++) {
      await originalFunction();
    }
    const originalTotalTime = performance.now() - originalStartTime;
    const originalAverageTime = originalTotalTime / iterations;
    
    // 测量优化函数性能
    console.log(`  测量优化函数性能...`);
    const optimizedStartTime = performance.now();
    for (let i = 0; i < iterations; i++) {
      await optimizedFunction();
    }
    const optimizedTotalTime = performance.now() - optimizedStartTime;
    const optimizedAverageTime = optimizedTotalTime / iterations;
    
    // 计算性能提升
    const improvement = ((originalAverageTime - optimizedAverageTime) / originalAverageTime) * 100;
    
    console.log(`性能比较结果: ${testName}`);
    console.log(`  原始函数平均执行时间: ${originalAverageTime.toFixed(3)}ms`);
    console.log(`  优化函数平均执行时间: ${optimizedAverageTime.toFixed(3)}ms`);
    console.log(`  性能提升: ${improvement.toFixed(2)}%`);
    console.log(`  总节省时间: ${(originalTotalTime - optimizedTotalTime).toFixed(2)}ms`);
    
    if (improvement > 0) {
      console.log(`✅  优化成功! ${testName} 性能提升了 ${improvement.toFixed(2)}%`);
    } else if (improvement < 0) {
      console.log(`❌  优化失败! ${testName} 性能下降了 ${Math.abs(improvement).toFixed(2)}%`);
    } else {
      console.log(`➡️  优化无效! ${testName} 性能没有变化`);
    }
  }

  /**
   * 生成HTML格式的测试报告
   * @param report 测试报告
   * @returns HTML字符串
   */
  public generateHtmlReport(report: TestReport): string {
    const passedPercentage = (report.passedTests / (report.totalTests - report.skippedTests)) * 100;
    
    return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>测试报告 - ${report.suiteName}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; margin: 0; padding: 20px; color: #333; }
    .header { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
    .summary { display: flex; justify-content: space-between; flex-wrap: wrap; margin-bottom: 30px; }
    .summary-item { background-color: #f8f9fa; padding: 15px; border-radius: 8px; flex: 1; min-width: 200px; margin: 5px; }
    .summary-item h3 { margin: 0 0 10px 0; font-size: 18px; color: #495057; }
    .summary-item .value { font-size: 24px; font-weight: bold; }
    .summary-item.passed .value { color: #28a745; }
    .summary-item.failed .value { color: #dc3545; }
    .summary-item.skipped .value { color: #ffc107; }
    .summary-item.time .value { color: #17a2b8; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #dee2e6; }
    th { background-color: #f8f9fa; font-weight: 600; }
    tr:hover { background-color: #f8f9fa; }
    .status-passed { color: #28a745; }
    .status-failed { color: #dc3545; }
    .status-skipped { color: #ffc107; }
    .error { background-color: #f8d7da; color: #721c24; padding: 10px; border-radius: 4px; margin-top: 5px; font-family: monospace; }
    .performance-stats { background-color: #e9ecef; padding: 15px; border-radius: 8px; margin-top: 20px; }
    .timestamp { color: #6c757d; text-align: right; margin-top: 20px; font-size: 14px; }
    @media (max-width: 768px) { .summary-item { min-width: 100%; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>测试报告: ${report.suiteName}</h1>
    <div class="timestamp">生成时间: ${report.timestamp.toLocaleString('zh-CN')}</div>
  </div>
  
  <div class="summary">
    <div class="summary-item">
      <h3>总测试数</h3>
      <div class="value">${report.totalTests}</div>
    </div>
    <div class="summary-item passed">
      <h3>通过测试</h3>
      <div class="value">${report.passedTests}</div>
    </div>
    <div class="summary-item failed">
      <h3>失败测试</h3>
      <div class="value">${report.failedTests}</div>
    </div>
    <div class="summary-item skipped">
      <h3>跳过测试</h3>
      <div class="value">${report.skippedTests}</div>
    </div>
    <div class="summary-item time">
      <h3>通过率</h3>
      <div class="value">${passedPercentage.toFixed(1)}%</div>
    </div>
    <div class="summary-item time">
      <h3>总执行时间</h3>
      <div class="value">${report.totalExecutionTime.toFixed(2)}ms</div>
    </div>
  </div>
  
  ${report.performanceReport ? `
  <div class="performance-stats">
    <h2>性能统计</h2>
    <div class="summary">
      <div class="summary-item">
        <h3>平均执行时间</h3>
        <div class="value">${report.performanceReport.averageExecutionTime.toFixed(3)}ms</div>
      </div>
      <div class="summary-item">
        <h3>最快测试</h3>
        <div class="value">${report.performanceReport.fastestTest.name}</div>
        <div class="value">${report.performanceReport.fastestTest.executionTime.toFixed(3)}ms</div>
      </div>
      <div class="summary-item">
        <h3>最慢测试</h3>
        <div class="value">${report.performanceReport.slowestTest.name}</div>
        <div class="value">${report.performanceReport.slowestTest.executionTime.toFixed(3)}ms</div>
      </div>
    </div>
  </div>
  ` : ''}
  
  <h2>测试详情</h2>
  <table>
    <thead>
      <tr>
        <th>测试名称</th>
        <th>状态</th>
        <th>执行时间 (ms)</th>
        <th>错误信息</th>
      </tr>
    </thead>
    <tbody>
      ${report.testResults.map(test => `
      <tr>
        <td>${test.name}</td>
        <td class="status-${test.status}">${test.status === 'passed' ? '✅ 通过' : test.status === 'failed' ? '❌ 失败' : '⏭️ 跳过'}</td>
        <td>${test.executionTime.toFixed(2)}</td>
        <td>${test.error ? `<div class="error">${test.error}</div>` : ''}</td>
      </tr>
      `).join('')}
    </tbody>
  </table>
</body>
</html>`;
  }
}

// 导出默认实例
export const testRunner = TestRunner.getInstance();
export default testRunner;
