/**
 * @file 数据转换测试工具
 * @description 用于验证数据转换服务的功能和性能
 * @module app/utils/testDataConverter
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 * @updated 2024-10-15
 */

import { DataConverterService, DataFormat, ConvertOptions } from '../services/dataConverterService';

/**
 * 测试用例接口
 */
interface TestCase {
  name: string;
  data: any;
  fromFormat: DataFormat;
  toFormat: DataFormat;
  options?: ConvertOptions;
  expected?: any;
}

/**
 * 测试结果接口
 */
interface TestResult {
  test: TestCase;
  passed: boolean;
  result?: any;
  error?: string;
  time: number;
}

/**
 * 数据转换测试类
 */
export class DataConverterTester {
  /**
   * 运行所有测试用例
   */
  static async runAllTests(): Promise<TestResult[]> {
    const testCases = this.getTestCases();
    const results: TestResult[] = [];

    console.log(`开始运行 ${testCases.length} 个测试用例...`);

    for (const testCase of testCases) {
      const result = await this.runTest(testCase);
      results.push(result);
      
      const status = result.passed ? '✅ 通过' : '❌ 失败';
      console.log(`测试: ${testCase.name} - ${status} (${result.time.toFixed(2)}ms)`);
      if (!result.passed && result.error) {
        console.error(`  错误: ${result.error}`);
      }
    }

    // 统计结果
    const passedCount = results.filter(r => r.passed).length;
    console.log(`\n测试完成: ${passedCount}/${results.length} 通过`);
    
    if (passedCount < results.length) {
      console.error('存在失败的测试用例');
    }

    return results;
  }

  /**
   * 运行单个测试用例
   */
  private static async runTest(testCase: TestCase): Promise<TestResult> {
    const startTime = performance.now();
    
    try {
      const result = await DataConverterService.convert(
        testCase.data,
        testCase.fromFormat,
        testCase.toFormat,
        testCase.options
      );

      const time = performance.now() - startTime;
      const passed = result.success && (!testCase.expected || this.compareResults(result.data, testCase.expected));

      return {
        test: testCase,
        passed,
        result: result.data,
        time
      };
    } catch (error) {
      const time = performance.now() - startTime;
      return {
        test: testCase,
        passed: false,
        error: error instanceof Error ? error.message : String(error),
        time
      };
    }
  }

  /**
   * 比较测试结果
   */
  private static compareResults(actual: any, expected: any): boolean {
    if (typeof actual !== typeof expected) {
      return false;
    }

    if (typeof actual === 'string') {
      // 对于字符串，进行基本比较（忽略空白差异）
      return actual.trim() === expected.trim();
    }

    if (Array.isArray(actual) && Array.isArray(expected)) {
      if (actual.length !== expected.length) {
        return false;
      }

      return actual.every((item, index) => this.compareResults(item, expected[index]));
    }

    if (typeof actual === 'object' && actual !== null && expected !== null) {
      const actualKeys = Object.keys(actual);
      const expectedKeys = Object.keys(expected);

      if (actualKeys.length !== expectedKeys.length) {
        return false;
      }

      return actualKeys.every(key => 
        expectedKeys.includes(key) && 
        this.compareResults(actual[key], expected[key])
      );
    }

    // 基本类型比较
    return actual === expected;
  }

  /**
   * 获取测试用例
   */
  private static getTestCases(): TestCase[] {
    const sampleData = [
      { id: 1, name: '测试1', value: 123.456, active: true },
      { id: 2, name: '测试2', value: 789.123, active: false },
      { id: 3, name: '测试3', value: 456.789, active: true }
    ];

    return [
      {
        name: 'JSON转CSV基本转换',
        data: JSON.stringify(sampleData),
        fromFormat: 'json',
        toFormat: 'csv',
        options: { delimiter: ',' }
      },
      {
        name: 'JSON转Markdown表格',
        data: JSON.stringify(sampleData),
        fromFormat: 'json',
        toFormat: 'markdown'
      },
      {
        name: 'JSON转XML',
        data: JSON.stringify(sampleData),
        fromFormat: 'json',
        toFormat: 'xml'
      },
      {
        name: 'JSON转HTML',
        data: JSON.stringify(sampleData),
        fromFormat: 'json',
        toFormat: 'html'
      },
      {
        name: '数值精度控制',
        data: JSON.stringify(sampleData),
        fromFormat: 'json',
        toFormat: 'json',
        options: { precision: 1 }
      },
      {
        name: '空数据处理',
        data: JSON.stringify([]),
        fromFormat: 'json',
        toFormat: 'csv'
      },
      {
        name: '特殊字符处理',
        data: JSON.stringify([{ text: '包含,逗号"和\n换行符' }]),
        fromFormat: 'json',
        toFormat: 'csv'
      },
      {
        name: 'CSV转JSON',
        data: 'id,name,value\n1,测试1,123.45\n2,测试2,456.78',
        fromFormat: 'csv',
        toFormat: 'json'
      }
    ];
  }
}

/**
 * 运行性能测试
 */
export async function runPerformanceTest(): Promise<void> {
  console.log('开始性能测试...');
  
  // 生成大数据集
  const largeDataSet = Array.from({ length: 1000 }, (_, i) => ({
    id: i + 1,
    name: `Item ${i + 1}`,
    value: Math.random() * 1000,
    category: `Category ${(i % 10) + 1}`,
    timestamp: new Date(Date.now() - i * 86400000).toISOString()
  }));

  const formats: DataFormat[] = ['csv', 'json', 'markdown', 'xml', 'html'];
  const results: { format: string; time: number; size: number }[] = [];

  for (const format of formats) {
    const startTime = performance.now();
    const result = await DataConverterService.convert(
      JSON.stringify(largeDataSet),
      'json',
      format
    );
    const time = performance.now() - startTime;
    
    const size = typeof result.data === 'string' ? result.data.length : JSON.stringify(result.data).length;
    
    results.push({ format, time, size });
    console.log(`转换为${format}: ${time.toFixed(2)}ms, 大小: ${(size / 1024).toFixed(2)}KB`);
  }

  // 测试缓存性能
  console.log('\n测试缓存性能...');
  const cacheStartTime = performance.now();
  await DataConverterService.convert(JSON.stringify(largeDataSet), 'json', 'csv');
  const cacheTime = performance.now() - cacheStartTime;
  console.log(`缓存命中转换: ${cacheTime.toFixed(2)}ms`);

  // 清理缓存
  DataConverterService.clearCache();
  console.log('缓存已清理');
}

/**
 * 便捷的测试运行函数
 */
export async function runTests(): Promise<void> {
  await DataConverterTester.runAllTests();
  console.log('\n----------------------------------');
  await runPerformanceTest();
}
